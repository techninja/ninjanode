/**
 * @file NinjaNode Pixi Input Library
 * Clientside abstraction to separate networking response logic from input.
 */

import { store } from 'hybrids';
import { gamepadMappings, bindableGameActions } from 'data';
import { AppState, UserSettings, InputBind, ActiveBindingState } from 'models';
import { coordAngle } from 'utils';

const { joypad } = window;

const defaultKeyBindings = {
  u: ['w', 'ArrowUp'], // Forward thrust
  d: ['s', 'ArrowDown'], // Reverse Thrust
  l: ['a', 'ArrowLeft'], // TurnLeft
  r: ['d', 'ArrowRight'], // Right
  f: [' '], // Primary Fire (space)
  s: ['m'], // Secondary Fire (m)
  b: ['s'], // Set Spawn Beacon (s)
  w: ['Escape'], // Open/Close main window
  c: ['t'], // Open Chat (t)
};

const defaultGamepadBindings = {
  u: ['Up', 'X'], // Up
  d: ['Down', 'Y'], // Down
  l: ['Left'], // Left
  r: ['Right'], // Right
  f: ['A'], // Primary Fire (space)
  s: ['B'], // Secondary Fire (m)
  b: ['LeftFrontShoulder'], // Set Spawn Beacon (s)
  w: ['Select'], // Open/Close main window
  // c: ['t'], // Open Chat (t)
};

export class PixiInput {
  renderer;
  socket;
  keys = defaultKeyBindings;
  mousedown = 0; // Mouse button
  lastKey = '';
  stick = { x: 0, y: 0 };

  constructor({ renderer, socket }) {
    this.renderer = renderer;
    this.socket = socket;
    this.initializeDefaults();
    this.initializeKeyBindings();
    this.initializeMouseBindings();
    this.initializeTouchBindings();
    this.initializeGamepadBindings();
  }

  initializeDefaults() {
    const binds = store.get([InputBind]);
    if (!binds.length) {
      // Move through all default keybindings and add base stored editable entries.
      Object.entries(defaultKeyBindings).forEach(([command, keys]) => {
        keys.forEach((key) => {
          store.set(InputBind, {
            device: 'keyboard',
            trigger: key,
            command,
          });
        });
      });

      // Move through all default gamepad bindings and add base stored editable entries.
      Object.entries(defaultGamepadBindings).forEach(([command, keys]) => {
        keys.forEach((key) => {
          store.set(InputBind, {
            device: 'gamepad',
            trigger: key,
            command,
          });
        });
      });
    }
  }

  initializeKeyBindings() {
    // Bind to the global keyup & keydown events.
    this.docBind('keyup keydown', (event) => {
      const { key, type } = event;
      return this.onButtonCallback({
        key,
        type,
        device: 'keyboard',
        event,
      });
    });
  }

  onButtonCallback({ key, device, type, event }) {
    const state = store.get(AppState);
    const bindState = store.get(ActiveBindingState);
    const actionCode = this.getCommandAction(key, device);

    // Override actual bindings to allow for new bindings.
    if (bindState.listenCommand && type == 'keyup') {
      let error = '';
      const { heardTrigger, heardDevice } = bindState;
      const lastHeard = `${heardDevice}-${heardTrigger}`;

      // Set error string if there's already a bound action.
      if (actionCode) {
        const { name } = bindableGameActions[actionCode];
        error = `Already bound to ${name}`;
      }

      // Set device and what triggered.
      store.set(ActiveBindingState, {
        error,
        lastHeard,
        heardTrigger: key,
        heardDevice: device,
      });

      return;
    }

    // Ignore all key defaults when listening.
    if (bindState.listenCommand) {
      event.preventDefault();
      return;
    }

    // Escape keypress.
    if (type == 'keyup' && actionCode == 'w') {
      // Chat visible? Close it.
      if (state.chatVisible) {
        store.set(AppState, { chatVisible: false });
        return;
      }

      // Toggle main window visibility via global state.
      store.set(AppState, { windowVisible: !state.windowVisible });
      return;
    }

    // Show chat.
    if (
      type == 'keyup' &&
      actionCode == 'c' &&
      state.joined &&
      !state.chatVisible &&
      !state.windowVisible
    ) {
      store.set(AppState, { chatVisible: true });
      return;
    }

    // If not chatting or in window, move through keybindings.
    if (!state.chatVisible && !state.windowVisible && actionCode) {
      const action = `${actionCode}${type}`;

      // Prevent default key action for any bound keys.
      event.preventDefault();

      // Filter out held down key repeats
      if (this.lastKey != action) {
        this.lastKey = action;
        this.socket.key({ type }, actionCode);
      }
      return false;
    }
  }

  // Touch/Mouse Start & movement binding callback.
  touchPositionCallback(e) {
    // Pause viewport scrolling.
    this.renderer.stage.base.pause = true;

    // Find the angle relative to the center of the screen
    const center = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    // Trigger the binding on the server.
    this.socket.key(
      {
        type: 'mousetouch',
        angle: coordAngle({ x: e.x - center.x, y: e.y - center.y }),
      },
      'm'
    );

    // Unpause viewport
    this.renderer.stage.base.pause = false;
  }

  // Multitouch trigger binding callback.
  // (number of touches only for now)
  multiTouchCallback(touchCount) {
    // If touch enabled device, give them some way to fire!
    if (touchCount == 2) {
      // 2 touch primary fire
      this.socket.key({ type: 'keydown' }, 'f');
    }

    if (touchCount == 3) {
      // 3 touch secondary fire
      this.socket.key({ type: 'keydown' }, 's');
    }

    if (touchCount == 4) {
      // 4 touch set spawn
      this.socket.key({ type: 'keydown' }, 'b');
    }
  }

  // Touch end / Mouse Up binding callback.
  touchEndCallback() {
    // Short circuit with keyup ;)
    this.socket.key({ type: 'keyup' }, 'm');
  }

  initializeMouseBindings() {
    // Mouse bindings....
    this.docBind(
      'mousedown mousemove mouseup',
      ({ pageX: x, pageY: y, which, type }) => {
        const { windowVisible, chatVisible, joined } = store.get(AppState);
        const { mouseControls, freelook } = store.get(UserSettings);

        const controllable =
          joined &&
          !windowVisible &&
          !chatVisible &&
          mouseControls &&
          !freelook;

        // If we can't mouse control, leave early.
        if (!controllable) return false;

        switch (type) {
          case 'mousedown':
            this.mousedown = which;
            this.touchPositionCallback({ x, y });
            break;

          case 'mousemove':
            if (this.mousedown == 1) {
              this.touchPositionCallback({ x, y });
            }
            break;

          case 'mouseup':
            if (this.mousedown) {
              this.touchEndCallback();
              this.mousedown = 0;
            }
            break;

          default:
            break;
        }
      }
    );
  }

  initializeTouchBindings() {
    // Disable Gestures for iOS.
    this.docBind('gesturestart', (e) => {
      e.preventDefault();
    });

    this.docBind(
      'touchstart touchend touchmove',
      (e) => {
        const { windowVisible, chatVisible, joined } = store.get(AppState);
        const { freelook } = store.get(UserSettings);

        const controllable =
          joined && !windowVisible && !chatVisible && !freelook;

        // No control if these are open.
        if (!controllable) return false;

        const { touches, changedTouches, type } = e;

        switch (type) {
          case 'touchstart':
            if (touches.length != 1) {
              this.multiTouchCallback(touches.length);
            } else {
              // Ignore any touchstart / touchmove here except the first
              this.touchPositionCallback({
                x: changedTouches[0].pageX,
                y: changedTouches[0].pageY,
              });
            }
            break;
          case 'touchmove':
            // Ignore any touchstart / touchmove here except the first
            if (touches.length === 1) {
              this.touchPositionCallback({
                x: changedTouches[0].pageX,
                y: changedTouches[0].pageY,
              });
            }
            break;
          case 'touchend':
            // Ignore any touchend except the last one
            if (changedTouches.length == 1) {
              this.touchEndCallback({
                x: changedTouches[0].pageX,
                y: changedTouches[0].pageY,
              });
            }
            break;
          default:
            break;
        }

        e.preventDefault();
        // iOS long press fix.
        e.returnValue = false;
      },
      document.getElementById('stage')
    );
  }

  initializeGamepadBindings() {
    joypad.set({
      axisMovementThreshold: 0.4,
    });

    // Debug log connected controller
    joypad.on('connect', (e) => {
      const { id } = e.gamepad;
      console.log(`${id} connected!`);
    });

    // Bind button press down.
    joypad.on('button_press', (event) => {
      const { buttonName } = event.detail;
      const key = gamepadMappings[buttonName];

      if (key) {
        return this.onButtonCallback({
          event,
          key,
          type: 'keydown',
          device: 'gamepad',
        });
      } else {
        console.log('Unknown button', event.detail);
      }
    });

    // Bind button release.
    joypad.on('button_release', (event) => {
      const { buttonName } = event.detail;
      const key = gamepadMappings[buttonName];

      if (key) {
        return this.onButtonCallback({
          event,
          key,
          type: 'keyup',
          device: 'gamepad',
        });
      }
    });

    // Stick doesn't return without new info, so we have to
    // reset with a timout.
    const stickResetTime = 200;
    let stickTimeout = { x: 0, y: 0 };

    // Bind axis movement.
    joypad.on('axis_move', (e) => {
      const { axis, axisMovementValue } = e.detail;
      // Ignore secondary sticks for now.
      if (axis > 1) return;
      const stickAxis = axis % 2 ? 'y' : 'x';

      // Lock back to 0 after 500 ms without any update.
      clearTimeout(stickTimeout[stickAxis]);
      stickTimeout[stickAxis] = setTimeout(() => {
        this.stick[stickAxis] = 0;
        if (!this.stick.x && !this.stick.y) {
          // End movement.
          this.touchEndCallback();
        }
      }, stickResetTime);

      // Only on state value change.
      if (this.stick[stickAxis] !== axisMovementValue) {
        this.stick[stickAxis] = axisMovementValue;

        const angle = coordAngle(this.stick);

        // Trigger angle move.
        this.socket.key({ type: 'mousetouch', angle }, 'm');
      }
    });
  }

  /**
   * Return the command action code for a given key string, or null.
   *
   * @param {string} trigger
   *   The keyboard event "key" string, or other input base.
   * @param {string} deviceFilter
   *   The specific device to filter to, defaults to keyboard.
   */
  getCommandAction(key, deviceFilter = 'keyboard') {
    const binds = store.get([InputBind]);

    const { command } =
      binds.find(
        ({ device, trigger }) => trigger === key && deviceFilter === device
      ) || {};
    return command;
  }

  /**
   * Bind to global document level events.
   *
   * @param string binds
   *   Space separated list of events to bind to.
   * @param {*} cb
   *   Callback for event.
   * @param {DOMElement} element
   *   The element to base the event binding on.
   */
  docBind(binds, cb, element = window) {
    binds.split(' ').forEach((bind) => {
      element.addEventListener(bind, cb, { passive: false });
    });
  }
}
