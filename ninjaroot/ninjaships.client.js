/**
 * @file Ninja Ships ninjanode main clientside handler for all network
 * communication and html element management.
 */

// String protype formatter (for system messages)
// Via http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
String.prototype.format = function() {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined'
      ? args[number]
      : match
    ;
  });
};


// String Prototype for wrapping with spans
String.prototype.spanWrap = function() {
  return '<span>' + this + '</span>';
};


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

      // Audio Resources
      var audioRoot = '/resources/audio/';
      this.audioPath = {
        boom:  audioRoot + "explosion.wav",
        thrust: audioRoot + "thrust.wav",
        fire1: audioRoot + "fire1.wav",
        fire2: audioRoot + "fire2.wav",
        fire3: audioRoot + "fire3.wav",
        fire4: audioRoot + "fire4.wav",
        hit1: audioRoot + "hit1.wav",
        hit2: audioRoot + "hit2.wav"
      };

      // Preload large resources
      $('body').append('<div id="preload-boom" class="preload"> </div>');

      // Bind functions to incoming data
      this.socket.on('chat', this.chat);
      this.socket.on('pos', this.updatePos);
      this.socket.on('shipstat', this.shipStatus);
      this.socket.on('projstat', this.projectileStatus);
      this.socket.on('projpos', this.updateProjectilePos);

      // Load previous preferences & bind change save
      var prefs = this._cookiePrefs();
      if (prefs){
        $('#name').val(prefs.name);
        $('input[value=' + prefs.ship + ']').prop('checked',true);
      }

      $('#connection-window input').change(function(){
        ShipSocket._cookiePrefs({
          name: $('#name').val(),
          ship: $('input[name=ship]:checked').val()
        });
      })

      // Set the initially selected class
      $('input[name=ship]:checked').parent().addClass('selected');

      // Bind to change to add / remove select class
      $('input[name=ship]').change(function(){
        if ($(this).is(':checked')){
          $('#connection-window label').removeClass('selected');
          $(this).parent().addClass('selected');
        }
      });

    },

    // Actually join the game! Happens once connection screen is submitted
    join : function(shipData) {
      // Send the ship data! User will have to wait for server to relay the
      // new ship back to them before the ship will exist locally
      shipData.status = "create";
      this.socket.emit('shipstat', shipData);

      // Key command bindings
      this.keys = {
        l: 37, // Left
        u: 38, // Up
        r: 39, // Right
        d: 40, // Down
        f: 32, // Primary Fire (space)
        s: 77  // Secondary Fire (m)
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

        // Chat notification manager, check every second
        setInterval(function(){
          $('#chat-notify li').each(function(){
            // Remove items older than 10 seconds
            if (new Date().getTime() - $(this).data('time') > 10000) {
              $(this).hide('slow', function(){
                $(this).remove();
                if (!$('#chat-notify li').length){
                  $('#chat-notify').fadeOut('slow');
                }
              });
            }
          });
        }, 1000);


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
              sound: {
                boom: new Audio(ShipSocket.audioPath['boom']),
                thrust: new Audio(ShipSocket.audioPath['thrust']),
                fire: [
                  new Audio(ShipSocket.audioPath['fire' + d.sounds[0]]),
                  new Audio(ShipSocket.audioPath['fire' + d.sounds[1]])
                ]
              },
              height: 64,
              width: 64,
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
          var ship = ShipSocket.dummyShips[id];
          if (d.stage == 'start'){
            console.log('Boom start')
            ship.sound.boom.volume = ShipSocket._getDistanceVolume(id);
            ship.sound.boom.play();
            ShipSocket._animateBoom(id);
          } else if (d.stage == 'middle') { // Fade out...
            ship.element.fadeOut();
            ship.label.fadeOut();
          } else { // Complete!
            console.log('Boom complete')
            // Fade back in
            ship.element.fadeIn('slow');
            ship.label.fadeIn('slow');
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
            if (!d.noSound){ // No sound play for bulk updates or the like
              ShipSocket.dummyShips[d.shipID].sound.fire[d.weaponID].volume = ShipSocket._getDistanceVolume(d.shipID);
              ShipSocket.dummyShips[d.shipID].sound.fire[d.weaponID].play();
            }

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

          // In case the ship missed the mark
          if (!s.element.is(':visible')) {
            //s.element.show();
          }

          // Move explosion sprite with ship
          if (s.exploding){
            $('#boom-'+ id).css({
              left:s.pos.x - s.width/2-64, top:s.pos.y+s.height/2-128
            });
          }

          s.pos = {x: d.x, y: d.y, d: d.d};

          // Set ship element position and rotation
          s.element.rotate(s.pos.d);
          s.element.css({
            left: s.pos.x,
            top: s.pos.y
          });

          s.sound.thrust.loop = true;
          s.sound.thrust.volume = ShipSocket._getDistanceVolume(id) / 10;

          // Show thrust direction
          if (d.t == 0){
            s.element.removeClass('thrusting thrusting_back')
            s.sound.thrust.pause();
          }else if (d.t == 1){
            s.element.addClass('thrusting');
            s.sound.thrust.play();
          }else if (d.t == 2){
            s.element.addClass('thrusting_back');
            s.sound.thrust.play();
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
      var nameSource = ShipSocket.dummyShips[data.id].name.spanWrap();
      var nameTarget = '';

      if (data.target){
        nameTarget = ShipSocket.dummyShips[data.target].name.spanWrap();
      }

      var sysMsgActions = {
        join: '{0} joined the game',
        disconnect: '{0} disconnected',
        projectile: '{0} made {1} explode',
        collision: '{0} slammed into {1}'
      }

      if (data.type == 'system'){
        classType = 'sys';
        data.msg = sysMsgActions[data.action].format(nameSource, nameTarget);
      } else if (data.type == 'chat') {
        data.msg = nameSource + ': ' + data.msg;
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
      $notifyList.find('li:last').data('time', new Date().getTime()).hide().show('slow');

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

    // Utility function to return a volume from 0 to 1 as a factor of distance
    _getDistanceVolume: function(id){
      // The distance past which nothing can be heard
      var maxDistance = 2500;

      // The distance at which there is no volume drop
      var minDistance = 500;

      var source = {x:0, y:0};
      var target = ShipSocket.dummyShips[id].pos;

      // If after connection... et pos from current user location
      if (ShipSocket.dummyShips[ShipSocket.id]){
        source = ShipSocket.dummyShips[ShipSocket.id].pos;
      }

      var dist = Math.sqrt( Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2));

      if (dist < minDistance){
        return 1;
      } else if (dist > maxDistance){
        return 0;
      }

      var range = maxDistance - minDistance;

      // Remove the min from the bottom of the distance
      dist = dist - minDistance;

      // Straight linear scale for now... though it should be log
      return 1 - (dist / range);

    },

    _animateBoom: function(id){
      var ship = ShipSocket.dummyShips[id];
      ship.exploding = true;
      //ship.element.addClass('exploding');

      $('body').append('<boom id="boom-' + id + '" class="layer5 overlay" />');
      $('#boom-'+ id)
      .css({
        left: ship.pos.x - ship.width / 2 - 64,
        top: ship.pos.y + ship.height / 2 - 128
      })
      .destroy()
      .sprite({
        fps: 20,
        no_of_frames: 56,
        on_last_frame: function(obj) {
          obj.spStop();
          ship.exploding = false;
          $('#boom-'+ id).remove();
        }
      });
    },

    _cookiePrefs: function(prefs){
      var d = new Date();

      if (prefs) { // Set Data
        d.setDate(d.getDate() + 100);
        var data = escape(JSON.stringify(prefs)) + "; expires=" + d.toUTCString();
        document.cookie = "ninjaprefs=" + data;
      } else { // Get Data
        var nameEQ = "ninjaprefs=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
          var c = ca[i];
          while (c.charAt(0)==' '){
            c = c.substring(1,c.length);
          }
          if (c.indexOf(nameEQ) == 0){
            return JSON.parse(unescape(c.substring(nameEQ.length,c.length)));
          }
        }
        return false;
      }
    },

    xxx: {}

  };
}());
