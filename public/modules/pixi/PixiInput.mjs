/**
 * @file NinjaNode Pixi Input Library
 * Clientside abstraction to separate networking response logic from input.
 */

import { store } from 'hybrids';
import { AppState, UserSettings } from 'models';

const defaultKeyBindings = {
  l: 37, // Left
  u: 38, // Up
  r: 39, // Right
  d: 40, // Down
  f: 32, // Primary Fire (space)
  s: 77, // Secondary Fire (m)
  b: 83, // Set Spawn Beacon (s)
  w: 27, // Open/Close main window
  c: 84, // Open Chat (t)
};

export class PixiInput {
  renderer;
  socket;
  keys = defaultKeyBindings;
  mousedown = 0; // Mouse button
  lastKey = '';

  constructor({ renderer, socket }) {
    this.renderer = renderer;
    this.socket = socket;
    this.initializeKeyBindings();
    this.initializeTouchBindings();
  }

  initializeKeyBindings() {
    // Bind to the global keyup & keydown events.
    this.docBind('keyup keydown', (e) => {
      const { type, which } = e;
      const state = store.get(AppState);

      // Escape keypress.
      if (type == 'keyup' && which == this.keys.w) {
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
        which == this.keys.c &&
        state.joined &&
        !state.chatVisible &&
        !state.windowVisible
      ) {
        store.set(AppState, { chatVisible: true });
        return;
      }

      // If not chatting or in window, move through keybindings.
      if (!state.chatVisible && !state.windowVisible) {
        const actionCode = this.getKey(which);
        if (actionCode) {
          const action = `${actionCode}${type}`;

          // Filter out held down key repeats
          if (this.lastKey != action) {
            this.lastKey = action;
            this.socket.key(e, actionCode);
          }
          return false;
        }
      }
    });
  }

  // Touch/Mouse Start & movement binding callback.
  touchPositionCallback(e) {
    // Find the angle relative to the center of the screen
    const center = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    let touchAngle =
      Math.atan2(e.y - center.y, e.x - center.x) * (180 / Math.PI) + 90;

    // Fix quandrant offset
    if (touchAngle < 0) {
      touchAngle = touchAngle + 360;
    }

    // Trigger the binding on the server.
    this.socket.key(
      {
        type: 'mousetouch',
        angle: Math.round(touchAngle),
      },
      'm'
    );
  }

  // Touch end / Mouse Up binding callback.
  touchEndCallback() {
    // Short circuit with keyup ;)
    this.socket.key({ type: 'keyup' }, 'm');
  }

  initializeTouchBindings() {
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
            this.renderer.stage.base.pause = true;
            this.mousedown = which;
            this.touchPositionCallback({ x, y });
            this.renderer.stage.base.pause = false;
            break;

          case 'mousemove':
            if (this.mousedown == 1) {
              this.renderer.stage.base.pause = true;
              this.touchPositionCallback({ x, y });
              this.renderer.stage.base.pause = false;
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

  /**
   * Return the action code for a given char code if any.
   * @param {*} charCode
   */
  getKey(charCode) {
    const index = Object.values(this.keys).findIndex(
      (ascii) => ascii === charCode
    );
    return Object.keys(this.keys)?.[index];
  }

  /**
   * Bind to global document level events.
   *
   * @param string binds
   *   Space separated list of events to bind to.
   * @param {*} cb
   *   Callback for event.
   */
  docBind(binds, cb) {
    binds.split(' ').forEach((bind) => {
      document.addEventListener(bind, cb, { passive: false });
    });
  }
}
