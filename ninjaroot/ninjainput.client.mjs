/**
 * @file NinjaNode Input Library
 * Clientside abstraction to separate networking response logic from human/bot input.
 */

const defaultKeyBindings = {
  l: 37,  // Left
  u: 38,  // Up
  r: 39,  // Right
  d: 40,  // Down
  f: 32,  // Primary Fire (space)
  s: 77,  // Secondary Fire (m)
  b: 83,  // Set Spawn Beacon (s)
};

class ShipInput {
  renderer;
  $body;
  socket;
  keys = defaultKeyBindings;
  mousedown = 0;
  lastKey = '';

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

      if (!connectionHidden){
        if (e.type == 'keyup' && e.which == 27) { // 'esc' pressed
          renderer.toggleConnectionWindow(false);
          return;
        }
        return;
      }

      if (chatHidden && connectionHidden) {
        if (e.type == 'keyup' && e.which == 27) {
          renderer.toggleConnectionWindow(true);
          return;
        }
      }


      // Check for each gameplay key binding
      if (chatHidden){
        for(var name in this.keys){
          if (e.which == this.keys[name]){
            const action = `${name}${e.type}`;

            // Filter out held down key repeats
            if (this.lastKey != action) {
              this.lastKey = action;
              this.socket.key(e, name)
            }
            return false;
          }
        }
      }

      // Show/hide debug box
      if (e.type == 'keyup' && e.which == 115){
        $('#debug').toggle();
        return false;
      }

      // Text chat enable/disable bindings
      if (e.type == 'keyup' && e.which == 84 && chatHidden) { // 't' pressed
        renderer.toggleChat(true);
        $('#chat-notify').hide();
        $('#chat-main input')[0].focus();
        $('#chat-main ol')[0].scrollTop = $('#chat-main ol')[0].scrollHeight; // Scroll to bottom
        return false;
      }

      // Leave text chat
      // 'esc' pressed or empty text box
      if ((e.type == 'keyup' && e.which == 27) || (!$('#chat-main input').val() && e.which == 13)) {
        renderer.toggleChat(false);
        $('#chat-main input').val(''); // Counteract text coming back...
        if ($('#chat-notify li').length){
          $('#chat-notify').fadeIn('slow');
        }
        return false;
      }

      // Send chat
      $('#chat-main input').bind('keyup', function(e) {
        if (e.which == 13 && $(this).val().trim()){
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
      y: $(window).height() / 2
    };

    // TODO: Remove hardcoded ship width / height to allow for larger ships!
    let touchAngle = (
      Math.atan2(
        e.y - center.y,
        e.x - center.x
      ) * (180 / Math.PI)
    ) + 90;

    // Fix quandrant offset
    if (touchAngle < 0) {
      touchAngle = touchAngle + 360;
    }

    // Trigger the binding on the server.
    this.socket.key({
      type: 'mousetouch',
      angle: Math.round(touchAngle)
    }, 'm');
  }

  // Touch end / Mouse Up binding callback.
  touchEndCallback(e) {
    // Short circuit with keyup ;)
    this.socket.key({type: 'keyup'}, 'm');
  }

  // Multitouch trigger binding callback.
  // (number of touches only for now)
  multiTouchCallback(touchCount) {
    // If touch enabled device, give them some way to fire!
    if (touchCount == 2) { // 2 touch primary fire
      this.socket.key({type: 'keydown'}, 'f');
    }

    if (touchCount == 3) { // 3 touch secondary fire
      this.socket.key({type: 'keydown'}, 's');
    }
  }

  // Bind callbacks to both mouse and touch events for input
  bindTouchEvents() {
    // Mouse bindings....
    $(document).bind('mousedown', ({ pageX: x, pageY: y, which }) => {
      this.touchPositionCallback({x, y});
      this.mousedown = which;
      return false;
    });

    $(document).bind('mousemove', ({ pageX: x, pageY: y }) => {
      if (this.mousedown == 1){
        this.touchPositionCallback({x, y});
        return false;
      }
    });

    $(document).bind('mouseup', ({ pageX: x, pageY: y }) => {
      this.touchEndCallback({x, y});
      this.mousedown = 0;
      return false;
    });

    // Touch device beindings...
    $(document).bind('touchstart', ({ originalEvent: { touches } }) => {
      if (touches.length != 1){
        this.multiTouchCallback(touches.length);
      }
    });

    $(document).bind('touchstart touchmove', ({ originalEvent: orig }) => {
      // Ignore any touchstart / touchmove here except the first
      if (orig.touches.length == 1){
        this.touchPositionCallback({
          x: orig.changedTouches[0].pageX,
          y: orig.changedTouches[0].pageY
        });
      }
      return false;
    });

    $(document).bind('touchend', ({ originalEvent: orig }) => {
      // Ignore any touchend except the last one
      if (orig.changedTouches.length == 1) {
        this.touchEndCallback({
          x: orig.changedTouches[0].pageX,
          y: orig.changedTouches[0].pageY
        });
      }

      return false;
    });
  }
}

export default ShipInput;
