/**
 * @file NinjaNode Input Library
 * Clientside abstraction to separate networking response logic from human/bot input.
 */

const defaultKeyBindings = {
  l: 37, // Left
  u: 38, // Up
  r: 39, // Right
  d: 40, // Down
  f: 32, // Primary Fire (space)
  s: 77, // Secondary Fire (m)
  b: 83, // Set Spawn Beacon (s)
};

export class ShipInput {
  renderer;
  $body;
  socket;
  keys = defaultKeyBindings;
  mousedown = 0;
  lastKey = '';
  connectionHidden = false;
  chatHidden = true;

  constructor(renderer, socket, $body) {
    this.renderer = renderer;
    this.socket = socket;
    this.$body = $body;

    this.initializeKeyBindings();
    this.bindTouchEvents();
  }

  initializeKeyBindings() {
    // Bind to the window global keyup & keydown events
    $(window).bind('keyup keydown', (e) => {
      // Check for each gameplay key binding (not when chat visible)
      const chatHidden = !$('#chat-main:visible').length;
      const connectionHidden = !$('#connection-window:visible').length;
      const { renderer, socket } = this;

      if (!connectionHidden) {
        if (e.type == 'keyup' && e.which == 27) {
          // 'esc' pressed
          renderer.toggleConnectionWindow(false);
          this.connectionHidden = false;
          return;
        }
        return;
      }

      if (chatHidden && connectionHidden) {
        if (e.type == 'keyup' && e.which == 27) {
          renderer.toggleConnectionWindow(true);
          this.connectionHidden = true;
          return;
        }
      }

      // Check for each gameplay key binding
      if (chatHidden) {
        for (const name in this.keys) {
          if (e.which == this.keys[name]) {
            const action = `${name}${e.type}`;

            // Filter out held down key repeats
            if (this.lastKey != action) {
              this.lastKey = action;
              this.socket.key(e, name);
            }
            return false;
          }
        }
      }

      // Show/hide debug box
      if (e.type == 'keyup' && e.which == 115) {
        $('#debug').toggle();
        return false;
      }

      // Text chat enable/disable bindings
      if (e.type == 'keyup' && e.which == 84 && chatHidden) {
        // 't' pressed
        renderer.toggleChat(true);
        $('#chat-notify').hide();
        $('#chat-main input')[0].focus();
        $('#chat-main ol')[0].scrollTop = $('#chat-main ol')[0].scrollHeight; // Scroll to bottom
        this.chatHidden = false;
        return false;
      }

      // Leave text chat
      // 'esc' pressed or empty text box
      if (
        (e.type == 'keyup' && e.which == 27) ||
        (!$('#chat-main input').val() && e.which == 13)
      ) {
        renderer.toggleChat(false);
        $('#chat-main input').val(''); // Counteract text coming back...
        if ($('#chat-notify li').length) {
          $('#chat-notify').fadeIn('slow');
        }
        this.chatHidden = true;
        return false;
      }

      // Send chat
      $('#chat-main input').bind('keyup', function (e) {
        if (e.which == 13 && $(this).val().trim()) {
          socket.sendChat($(this).val());
          $(this).val('');

          // Leave chat window once chat sent
          renderer.toggleChat(false);
        }
      });
    });
  }

  // Touch/Mouse Start & movement binding callback.
  touchPositionCallback(e) {
    // Find the angle relative to the center of the screen
    const center = {
      x: $(window).width() / 2,
      y: $(window).height() / 2,
    };

    // TODO: Remove hardcoded ship width / height to allow for larger ships!
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
  touchEndCallback(e) {
    // Short circuit with keyup ;)
    this.socket.key({ type: 'keyup' }, 'm');
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
  }

  notControllable() {
    this.connectionHidden = !$('#connection-window:visible').length;
    this.chatHidden = !$('#chat-main:visible').length;
    return !this.connectionHidden || !this.chatHidden;
  }

  // Bind callbacks to both mouse and touch events for input
  bindTouchEvents() {
    // Mouse bindings....
    $(document).bind('mousedown', ({ pageX: x, pageY: y, which }) => {
      // No control if these are open.
      if (this.notControllable()) return false;

      this.touchPositionCallback({ x, y });
      this.mousedown = which;
      return false;
    });

    $(document).bind('mousemove', ({ pageX: x, pageY: y }) => {
      // No control if these are open.
      if (this.notControllable()) return false;

      if (this.mousedown == 1) {
        this.touchPositionCallback({ x, y });
        return false;
      }
    });

    $(document).bind('mouseup', ({ pageX: x, pageY: y }) => {
      // No control if these are open.
      if (this.notControllable()) return false;

      this.touchEndCallback({ x, y });
      this.mousedown = 0;
      return false;
    });

    // Disable Gestures for iOS.
    document.addEventListener('gesturestart', function (e) {
      e.preventDefault();
    });

    document.addEventListener(
      'touchstart',
      (e) => {
        // No control if these are open.
        if (this.notControllable()) return false;

        const { touches, changedTouches, preventDefault } = e;
        if (touches.length != 1) {
          this.multiTouchCallback(touches.length);
        } else {
          // Ignore any touchstart / touchmove here except the first
          this.touchPositionCallback({
            x: changedTouches[0].pageX,
            y: changedTouches[0].pageY,
          });
        }
        preventDefault();
        // iOS long press fix.
        e.returnValue = false;
      },
      { passive: false }
    );

    document.addEventListener(
      'touchmove',
      (e) => {
        // No control if these are open.
        if (this.notControllable()) return false;

        const { touches, changedTouches, preventDefault } = e;
        // Ignore any touchstart / touchmove here except the first
        if (touches.length === 1) {
          this.touchPositionCallback({
            x: changedTouches[0].pageX,
            y: changedTouches[0].pageY,
          });
          // iOS long press fix.
          e.returnValue = false;
          preventDefault();
        }
      },
      { passive: false }
    );

    document.addEventListener('touchend', (e) => {
      // No control if these are open.
      if (this.notControllable()) return false;

      const { changedTouches, preventDefault } = e;
      // Ignore any touchend except the last one
      if (changedTouches.length == 1) {
        this.touchEndCallback({
          x: changedTouches[0].pageX,
          y: changedTouches[0].pageY,
        });
        // iOS long press fix.
        e.returnValue = false;
        preventDefault();
      }

      return false;
    });
  }
}

export default ShipInput;
