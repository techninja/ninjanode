/**
 * @file Ninja Ships ninjanode main clientside handler for all network
 * communication and html element management.
 */

(function () {
  var updateCount = 0;

  setInterval(function(){
    $('#debug .ups span').html(updateCount * 2);
    updateCount = 0;
  }, 500);

  window.ShipSocket = {
    socket : null,

    // Intitalize the socket.io websockets connection, happens on page load
    initialize : function(socketURL) {
      this.socket = io.connect(socketURL);
      this.socket.on('connect', function(){
        // Shortcut to our session id
        ShipSocket.id = ShipSocket.socket.socket.sessionid;
        $('#connection-window').fadeIn('slow');
        $('#connection-window input')[0].focus();
      })

      // Object array of ships and their elements
      this.dummyShips = {};
      this.projectiles = {};

      // Bind functions to incoming data
      this.socket.on('chat', this.chat);
      this.socket.on('pos', this.updatePos);
      this.socket.on('shipstat', this.shipStatus);
      this.socket.on('projstat', this.projectileStatus);
      this.socket.on('projpos', this.updateProjectilePos);
    },

    // Actually join the game! Happens once connection screen is submitted
    join : function(shipData) {
      // Send the ship data! User will have to wait for server to relay the
      // new ship back to them before the ship will exist locally
      shipData.status = "create";
      this.socket.emit('shipstat', shipData);

      this.keys = {
        l: 37,
        u: 38,
        r: 39,
        d: 40,
        f: 32
      };

      // Bind to the window global keyup & keydown events
      var lastKey = '';
      $(window).bind('keyup keydown', function(e) {
        // Check for each key binding (not when chat visible)
        var chatHidden = !$('#chat-main:visible').length;

        if (chatHidden){
          for(var name in ShipSocket.keys){
            if (e.which == ShipSocket.keys[name]){
              var action = name + e.type;

              // Filter out held down key repeats
              if (lastKey != action){
                lastKey = action;
                ShipSocket.key(e, name)
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
          $('#chat-main').show();
          $('#chat-notify').hide();
          $('#chat-main input')[0].focus();
          return false;
        }

        // Leave text chat
        if (e.which == 27) { // 'esc' pressed
          $('#chat-main').fadeOut('slow');
          $('#chat-main input').val(''); // Counteract text coming back...
          if ($('#chat-notify li').length){
            $('#chat-notify').fadeOut('slow');
          }
          return false;
        }

        // Send chat
        $('#chat-main input').bind('keyup', function(e) {
          if (e.which == 13 && $(this).val().trim()){
            ShipSocket.sendChat($(this).val());
            $(this).val('');
          }
        });

      });
    },


    /*
     *  SEND DATA FUNCTIONS =================================================
     */

    // Sends chat messages
    sendChat : function(msg) {
      this.socket.emit('chat', {
        msg: msg
      });
    },

    // Sends key commands to the server for the user
    key : function(e, name) {
      this.socket.emit('key', {
        s: e.type == 'keyup'? 0 : 1, // Status
        c: name // Command
      });
    },


    /*
     *  RECIEVE DATA HANDLER CALLBACKS ======================================
     */

    // Create / remove local dummy ships
    shipStatus: function(data){
      for (var id in data){
        var d = data[id];
        if (d.status == 'create'){ // Create new ship object
          // Only create locally if it doesn't exist.
          if (!ShipSocket.dummyShips[id]){
            // Add ship element
            $('body').append('<ship id="user_' + id + '" class="overlay layer2 ship_' + d.style + '"></ship><label class="overlay layer4 username" id="label_' + id + '">' + d.name + '</label>');

            // Add player list element
            $('#players').append('<player class="ship-id-' + id +
              '"><ship class="ship_' + d.style + '"></ship>' + d.name +
              '<span title="' + (id == ShipSocket.id ? 'It\'s you!' : 'Follow me!') +
              '" class="' + (id == ShipSocket.id ? 'circle' : 'arrow') + '"></span></player>');
            ShipSocket.dummyShips[id] = {
              element: $('ship#user_' + id),
              label: $('#label_' + id),
              name: d.name,
              pos: d.pos,
              style: d.style
            }

            // Send to update to ensure it gets drawn
            var u = {};
            u[id] = d.pos;
            ShipSocket.updatePos(u);
          }
        } else if (d.status == 'destroy'){ // Destroy!
          // Remove element, projectile elements, and data
          if (ShipSocket.dummyShips[id]){
            $('.ship-id-' + id).remove();
            ShipSocket.dummyShips[id].element.remove();
            ShipSocket.dummyShips[id].label.remove();
            delete ShipSocket.dummyShips[id];
          }
        } else if (d.status == 'hit'){ // Hit
          // TODO: Add sound effect, with volume based on distance away from user?
        } else if (d.status == 'boom'){ // BOOM!
          if (d.stage == 'start'){
            // TODO: Add sound, fade out
          } else { // Complete
            // Fade back in
          }
        }
      }
    },

    // Create / remove local projectile objects, id is ship ID plus serial
    projectileStatus: function(data){
      for (var id in data){
        var d = data[id];
        if (d.status == 'create'){
          // Only create locally if it doesn't exist.
          if (!ShipSocket.projectiles[id]){
            // TODO: Add sound effect
            $('body').append('<projectile id="proj_' + id + '" class="ship-id-' + d.shipID + ' overlay init layer0 ' + d.style + ' ' + d.type + '"/>');
            ShipSocket.projectiles[id] = {
              element: $('#proj_' + id),
              pos: d.pos
            }

            // Send to update to ensure it gets drawn
            var u = {};
            u[id] = d.pos;
            ShipSocket.updateProjectilePos(u);
          }
        } else { // Destroy!
          // Remove element and data
          if (ShipSocket.projectiles[id]){
            ShipSocket.projectiles[id].element.remove();
            delete ShipSocket.projectiles[id];
          }
        }
      }
    },

    // Handle projectile position data (comes in as [id] : x, y, d)
    updateProjectilePos : function(data) {
      // DEBUG
      updateCount++;

      // Update each projectile position in data
      for (var id in data){
        if (ShipSocket.projectiles[id]){
          var d = data[id];
          var s = ShipSocket.projectiles[id];
          s.pos = {x: d.x, y: d.y, d: d.d};

          // Set ship element position and rotation
          s.element.removeClass('init');
          s.element.rotate(s.pos.d);
          s.element.css({
            left: s.pos.x,
            top: s.pos.y
          });
        }
      }
    },

    // Handle ship position data (comes in as [id] : x, y, t, d)
    updatePos : function(data) {
      // DEBUG
      updateCount++;

      // Update each ship position in data
      for (var id in data){
        if (ShipSocket.dummyShips[id]){
          var d = data[id];
          var s = ShipSocket.dummyShips[id];
          /*if (this.exploding){
            $('#boom_'+ this.element_name).css({
              left:this.pos.x - this.width/2-64, top:this.pos.y+this.height/2-128
            });
          }*/
          s.pos = {x: d.x, y: d.y, d: d.d};

          // Set ship element position and rotation
          s.element.rotate(s.pos.d);
          s.element.css({
            left: s.pos.x,
            top: s.pos.y
          });

          // Show thrust direction
          if (d.t == 0){
            s.element.removeClass('thrusting thrusting_back')
          }else if (d.t == 1){
            s.element.addClass('thrusting');
          }else if (d.t == 2){
            s.element.addClass('thrusting_back');
          }

          // Set label position
          s.label.css({
            left: s.pos.x,
            top: s.pos.y
          });

          // Our ship updated its position, move the screen
          if (id == ShipSocket.id){
            // DEBUG
            $('#debug .pos span').html(s.pos.x + ', ' + s.pos.y);

            var x = ($(window).width() / 2) - d.x - 32;
            var y = ($(window).height() / 2) - d.y - 32;

            $('body').css({
              margin: y + 'px ' + x + 'px',
              backgroundPosition: x + 'px ' + y + 'px'
            });

            // Update all compasses
            for (var g in ShipSocket.dummyShips){
              ShipSocket._updateCompass(g);
            }

          } else { // Update This players compass!
              ShipSocket._updateCompass(id);
          }

        }
      }
    },

    // Handle chat / system messages
    chat: function(data) {

      // If there's no match for the ID, then we shouldn't really continue
      // TODO: This rules out sys messages NOT about users... should rethink later
      if (!ShipSocket.dummyShips[data.id]) {
        return;
      }

      var classType = '';
      var out = '';
      var name = ShipSocket.dummyShips[data.id].name;

      var sysMsgActions = {
        join: 'joined the game',
        disconnect: 'disconnected',
        collision: 'slammed into'
      }

      if (data.type == 'system'){
        classType = 'sys';
        data.msg = '<span>' + name + '</span> '
        data.msg+= sysMsgActions[data.action]
        data.msg+= (!data.target ? '' :' <span>' + ShipSocket.dummyShips[data.target].name + '</span>');
      } else if (data.type == 'chat') {
        data.msg = '<span>' + name + ':</span> ' + data.msg;
        if (data.id == ShipSocket.id) {
          classType = 'self';
        }
      }

      out+= '<li class="' + classType + '">' + data.msg + '</li>';

      var $chatList = $('#chat-main ol');
      var $notifyList = $('#chat-notify ol');

      $chatList.append(out); // Add element
      $chatList.find('li:last').hide().show('slow');
      $chatList[0].scrollTop = $chatList[0].scrollHeight; // Scroll down

      // Manage notifications system =================================
      $notifyList.append(out);
      $notifyList.find('li:last').hide().show('slow');

      // Remove items older than 10 seconds
      setTimeout(function(){
        $notifyList.find('li:first').hide('slow', function(){
          $(this).remove();
          if (!$notifyList.find('li').length){
            $('#chat-notify').fadeOut('slow');
          }
        });
      }, 10000);

      // Only show notify if chat window isn't visible
      if (!$('#chat-main:visible').length){
        $('#chat-notify').fadeIn('slow');
      }
    },

    // Utility function for updating player compass directions
    _updateCompass: function(target){
      if (ShipSocket.dummyShips[ShipSocket.id] && target != ShipSocket.id){
        var myPos = ShipSocket.dummyShips[ShipSocket.id].pos;
        var t = ShipSocket.dummyShips[target].pos;
        var theta = Math.atan2((t.y + 32) - (myPos.y + 32), (t.x + 32) - (myPos.x + 32));
        if (theta < 0) {theta += 2 * Math.PI;}
        var angle = theta * (180 / Math.PI) + 90;

        $('player.ship-id-' + target + ' .arrow')
          .rotate(Math.round(angle));
      }
    },

    xxx: {}

  };
}());
