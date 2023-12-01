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
      this.socket = io.connect(socketURL, {reconnect: false});
      this.socket.on('connect', function(){
        // Shortcut to our session id
        ShipSocket.id = ShipSocket.socket.id;
      });

      this.socket.on('disconnect', function(){
        $('body').append('<div class="window fixed disconnected">Connection to server lost, refresh the page to reconnect</div>');
        ShipSocket.socket.disconnect();
      });


      // Object array of ships and their elements
      this.dummyShips = {};
      this.projectiles = {};
      this.powerUps = [];
      this.pnbits = []; // Planets and stars and stuff!
      this.hasConnected = false;

      // Audio Resources
      var audioRoot = '/resources/audio/';
      this.audioPath = {
        boom:  audioRoot + "explosion.wav",
        thrust: audioRoot + "thrust.wav",
        fire1: audioRoot + "fire1.wav",
        fire2: audioRoot + "fire2.wav",
        fire3: audioRoot + "fire3.wav",
        fire4: audioRoot + "fire4.wav",
        fire5: audioRoot + "fire5.wav",
        hit1: audioRoot + "hit1.wav",
        hit2: audioRoot + "hit2.wav",
        spawnSet: audioRoot + "spawn_set.wav",
        spawnUnset: audioRoot + "spawn_unset.wav",
        mine: audioRoot + "mine_boom.wav",
        warning: audioRoot + "warning.wav"
      };

      // Preload large resources
      $('body').append('<div id="preload-boom" class="preload"> </div>');
      $('body').append('<div id="preload-boom-mine" class="preload"> </div>');

      // Bind functions to incoming data
      this.socket.on('chat', this.chat);
      this.socket.on('pos', this.updatePos);
      this.socket.on('shipstat', this.shipStatus);
      this.socket.on('shipbeaconstat', this.updateBeacons);
      this.socket.on('shiptypes', this.buildShipSelect);
      this.socket.on('projstat', this.projectileStatus);
      this.socket.on('projpos', this.updateProjectilePos);
      this.socket.on('powerupstat', this.updatePowerUpStatus);
      this.socket.on('pnbitsstat', this.pnbitsStatus);
    },

    // Actually join the game! Happens once connection screen is submitted
    join : function(shipData) {
      // Send the ship data! User will have to wait for server to relay the
      // new ship back to them before the ship will exist locally
      shipData.status = "create";
      this.socket.emit('shipstat', shipData);

      // Key command bindings
      this.keys = {
        l: 37,  // Left
        u: 38,  // Up
        r: 39,  // Right
        d: 40,  // Down
        f: 32,  // Primary Fire (space)
        s: 77,  // Secondary Fire (m)
        b: 83,  // Set Spawn Beacon (s)
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

        // Bind window resize to re-center on ship
        $(window).resize(function(){
          ShipSocket._centerView(ShipSocket.id);
        });

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
          $('#chat-main ol')[0].scrollTop = $('#chat-main ol')[0].scrollHeight; // Scroll to bottom
          return false;
        }

        // Leave text chat
        // 'esc' pressed or empty text box
        if (e.which == 27 || (!$('#chat-main input').val() && e.which == 13)) {
          $('#chat-main').fadeOut('slow');
          $('#chat-main input').val(''); // Counteract text coming back...
          if ($('#chat-notify li').length){
            $('#chat-notify').fadeIn('slow');
          }
          return false;
        }
      });

      // Bind mouse and touch events for alternate control scheme
      this._bindPushEvents(function(e){ // Touch Start / Mouse move
        // Find the angle relative to the center of the screen
        var center = {x: $(window).width() / 2, y: $(window).height() / 2}

        // TODO: Remove hardcoded ship width / height to allow for larger ships!
        var touchAngle = (Math.atan2(
          e.y - center.y,
          e.x - center.x) * (180 / Math.PI)
        ) + 90;

        // Fix quandrant offset
        if (touchAngle < 0) {
          touchAngle = touchAngle + 360;
        }

        ShipSocket.key({
          type: 'mousetouch',
          angle: Math.round(touchAngle)
        }, 'm');

      }, function(e){ // Touch end / Mouse Up
        // Short circuit with keyup ;)
        ShipSocket.key({type: 'keyup'}, 'm');
      }, function(touchCount){  // Multitouch trigger
        // If touch enabled device, give them some way to fire!
        if (touchCount == 2) { // 2 touch primary fire
          ShipSocket.key({type: 'keydown'}, 'f');
        }

        if (touchCount == 3) { // 3 touch secondary fire
          ShipSocket.key({type: 'keydown'}, 's');
        }
      });

      // Send chat
      $('#chat-main input').bind('keyup', function(e) {
        if (e.which == 13 && $(this).val().trim()){
          ShipSocket.sendChat($(this).val());
          $(this).val('');

          // Leave chat window once chat sent
          $('#chat-main').fadeOut('slow');
          $('#chat-notify').fadeIn('slow');
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
      var out = {
        s: e.type == 'keyup' ? 0 : 1, // Status
        c: name // Command
      }

      // If mouse / touch event, send the x/y pos
      if (e.type == 'mousetouch') {
        out.d = e.angle;
      }

      this.socket.emit('key', out);
    },


    /*
     *  RECIEVE DATA HANDLER CALLBACKS ======================================
     */

    // Create / remove local dummy ships
    shipStatus: function(data){
      for (var id in data){
        var d = data[id];
        var ship = ShipSocket.dummyShips[id];
        if (d.status == 'create'){ // Create new ship object
          // Only create locally if it doesn't exist.
          if (!ship){
            // Add ship and label element
            $('body').append(
              $('<ship>')
                .attr('id', 'user_' + id)
                .attr('class', 'overlay layer2 ship_' + d.style)
                .addClass(id == ShipSocket.id ? 'self' : 'other'),
              $('<label>')
                .attr('class', 'overlay layer4 username ship-type-' + d.style)
                .addClass('style-' + d.shieldStyle)
                .addClass(id == ShipSocket.id ? 'self' : 'other')
                .attr('id', 'label_' + id)
                .text(d.name),
              $('<beacon>')
                .attr('class', 'overlay hidden layer0 ship-type-' + d.style)
                .addClass('style-' + d.shieldStyle)
                .addClass(id == ShipSocket.id ? 'self' : 'other')
                .attr('id', 'beacon_' + id)
            );

            // Add player list element, mini ship and player compass
            $('#players').append(
              $('<player>')
                .attr('class', 'ship-id-' + id)
                .append(
                  $('<ship>')
                    .addClass('ship_' + d.style),
                  $('<i>')
                    .addClass('score'),
                  $('<div>')
                    .attr('title', id == ShipSocket.id ? "It's you!" : 'Follow me!')
                    .addClass(id == ShipSocket.id ? 'circle' : 'arrow', 'compass'),
                  $('<label>').text(d.name)
                )
            );

            ShipSocket.dummyShips[id] = {
              element: $('ship#user_' + id),
              label: $('#label_' + id),
              beacon: $('#beacon_' + id),
              name: d.name,
              sound: {
                boom: new Audio(ShipSocket.audioPath['boom']),
                thrust: new Audio(ShipSocket.audioPath['thrust']),
                fire: [
                  new Audio(ShipSocket.audioPath['fire' + d.sounds[0]]),
                  new Audio(ShipSocket.audioPath['fire' + d.sounds[1]])
                ],
                hit: [
                  new Audio(ShipSocket.audioPath['hit1']),
                  new Audio(ShipSocket.audioPath['hit2'])
                ],
                minehit: new Audio(ShipSocket.audioPath['mine']),
                warning: new Audio(ShipSocket.audioPath['warning']),
                beacon: {
                  set: new Audio(ShipSocket.audioPath['spawnSet']),
                  unset: new Audio(ShipSocket.audioPath['spawnUnset'])
                }
              },
              height: 64,
              width: 64,
              pos: d.pos,
              style: d.style,
              spawnPoint: d.spawnPoint,
            }

            ShipSocket._updateScore(id, d.score.kills, d.score.deaths);

            // Send to update to ensure it gets drawn
            var u = {};
            u[id] = d.pos;
            ShipSocket.updatePos(u);

            // Update Beacon for ship
            u = {};
            u[id] = d.spawnPoint;
            ShipSocket.updateBeacons(u, true);
          }
        } else if (d.status == 'destroy'){ // Destroy!
          // Remove element, projectile elements, and data
          if (ship){
            $('.ship-id-' + id).remove();
            ShipSocket.dummyShips[id].element.remove();
            ShipSocket.dummyShips[id].label.remove();
            ShipSocket.dummyShips[id].beacon.remove();
            delete ShipSocket.dummyShips[id];
          }
        } else if (d.status == 'hit'){ // Hit

          // Play hit sounds
          // TODO: Genralize this to allow custom hit sounds for every weapon
          if (d.weapon == 'mine') {
            ship.sound.minehit.volume = ShipSocket._getDistanceVolume(id);
            ship.sound.minehit.play();
          } else {
            var index = Math.round(Math.random()); // Pick between 0 and 1
            ship.sound.hit[index].volume = ShipSocket._getDistanceVolume(id);
            ship.sound.hit[index].play();
          }

          // Make Shields pulse (css animation)
          ship.label.addClass('pulse');
          setTimeout(function(){
            ship.label.removeClass('pulse');
          }, 300);

          // If someone exploded, we've got to update the scores!
          if (d.scores) {
            for (var i in d.scores){
              ShipSocket._updateScore(i, d.scores[i].kills, d.scores[i].deaths);
            }
          }

        } else if (d.status == 'shield'){ // Shield status (up or down!)
          // Shield amounts already rounded to nearest 5% by the server
          var oldValue = ship.label.data('shields');

          // Remove all classes that look like "shield-"
          ship.label.removeClass(function (index, css) {
            return (css.match(/\bshield-\S+/g) || []).join(' ');
          });

          // Reset warning sound once shields above 30
          if (d.amount > 30) {
            ship.sound.warning.pause();
            ship.sound.warning.currentTime = 0;
          }

          // Shields went down! Animate
          if (oldValue > d.amount) {
            // Make Shields pulse (css animation)
            var color = 'green';

            if (d.amount <= 60) {
              color = 'orange';
            }

            // Trigger Red color and warning claxon
            if (d.amount <= 30) {
              color = 'red';
              ship.sound.warning.loop = true;
              ship.sound.warning.volume = ShipSocket._getDistanceVolume(id);
              ship.sound.warning.play();
            }

            ship.label.addClass('flash-' + color);

            // Red flash sticks around to make it obvious that this is BAD
            if (color != 'red') {
              setTimeout(function(){
                ship.label.removeClass('flash-' + color);
              }, 500);
            }
          }

          // If transitioning from red to orange, clear the red class
          if (oldValue < d.amount && d.amount > 30 && oldValue <= 30) {
            ship.label.removeClass('flash-red');
          }

          // Set data and class for width
          ship.label.addClass('shield-'+d.amount).data('shields', d.amount);

        } else if (d.status == 'boom'){ // BOOM!
          if (d.stage == 'start'){
            // Kill claxon
            ship.sound.warning.pause();
            ship.sound.warning.currentTime = 0;

            // Start animation
            ship.sound.boom.volume = ShipSocket._getDistanceVolume(id);
            ship.sound.boom.play();
            ShipSocket._animateBoom(id);
          } else if (d.stage == 'middle') {
            // Fade out...
            ship.element.fadeOut();
            ship.label.fadeOut();
          } else { // Complete!
            // Fade back in
            ship.element.fadeIn('slow');
            ship.label.fadeIn('slow');
            ShipSocket._updateCompass(id);
          }
        } else if (d.status == 'powerup'){ // PowerUp! Add or remove classes
          if (d.addClasses) {
            ship.element.addClass(d.addClasses);
            ship.label.addClass(d.addClasses);
          }

          if (d.removeClasses) {
            ship.element.removeClass(d.removeClasses);
            ship.label.removeClass(d.removeClasses);
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

            $('body').append('<projectile id="proj_' + id + '" class="ship-id-' + d.shipID + ' ship-type-' + ShipSocket.dummyShips[d.shipID].style + ' overlay init layer0 ' + d.style + ' ' + d.type + '"/>');
            ShipSocket.projectiles[id] = {
              element: $('#proj_' + id),
              type: d.type,
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

            // Mines get a special explosion
            // TODO: allow for special animation for each weapon
            if (ShipSocket.projectiles[id].type == 'mine') {
              ShipSocket._animateMineBoom(id);
            }

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

    // Handle power up status update
    updatePowerUpStatus : function(data) {
      // DEBUG
      updateCount++;

      for (var id in data){
        var p = data[id];

        // Power up orb not yet created, lets build it!
        if (!ShipSocket.powerUps[id]){
          ShipSocket.powerUps[id] = {
            element: $('<powerup>')
              .addClass(p.cssClass + ' overlay layer0')
              .attr('id', 'pu-' + id)
              .css({left: p.pos.x, top: p.pos.y})
          };

          ShipSocket.powerUps[id].element.appendTo('body');
          if (!p.visible) ShipSocket.powerUps[id].element.hide();
        } else if (!p.visible) { // It does exist, hide it if it should go
          ShipSocket.powerUps[id].element.fadeOut();
          // TODO: add sound?
        } else if (p.visible) { // It does exist, show it!
          ShipSocket.powerUps[id].element.fadeIn('slow');
        }
      }
    },

    // Handle Clestial Body (PNBITS) status updates
    pnbitsStatus : function(data) {
      for (var id in data){
        var p = data[id];

        // Object not created yet!
        if (!ShipSocket.pnbits[id]){
          var size = p.radius * 2;
          ShipSocket.pnbits[id] = {
            element: $('<pnbits>')
              .addClass(p.cssClass + ' overlay layer0')
              .attr('id', 'pnb-' + id)
              .css({
                left: p.pos.x,
                top: p.pos.y,
                width: size,
                height: size,
                backgroundSize: size + 'px ' + size + 'px '
              })
          };

          ShipSocket.pnbits[id].element.appendTo('body');
        } else { // It does exist, move it?
          // TODO: Add Move code
        }
      }
    },

    // Handle ship beacon updates (comes in as [id] : x, y, or [id]: null)
    updateBeacons: function(data, batch) {
      for (var id in data) {
        if (ShipSocket.dummyShips[id]) {
          var d = data[id];
          var s = ShipSocket.dummyShips[id];

          // Set beacon position.
          if (d) {
            if (!batch) {
              s.sound.beacon.set.volume = ShipSocket._getDistanceVolume(id) / 8;
              s.sound.beacon.set.play();
            }
            s.beacon
              .css({
                left: d.x + (s.width / 2) - 20,
                top: d.y + (s.height / 2) - 20,
              })
              .show('fast');
          } else {
            // Hide Beacon!
            if (!batch) {
              s.sound.beacon.unset.volume = ShipSocket._getDistanceVolume(id) / 8;
              s.sound.beacon.unset.play();
            }
            s.beacon.hide('slow');
          }
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
              left: s.pos.x + s.width / 2 - $('#boom-'+ id).width() / 2,
              top: s.pos.y + s.height / 2 - $('#boom-'+ id).height() / 2
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

          // Our ship updated its position
          if (id == ShipSocket.id){
            // DEBUG
            $('#debug .pos span').html(s.pos.x + ', ' + s.pos.y);

            // Center body view on us
            ShipSocket._centerView(id);

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

      // Set the name of the target in the message to the sip, if it's available
      if (data.target && ShipSocket.dummyShips[data.target]){
        nameTarget = ShipSocket.dummyShips[data.target].name.spanWrap();
      } else { // Otherwise, use it as a literal
        nameTarget = data.target;
      }

      var sysMsgActions = {
        join: '{0} joined the game',
        disconnect: '{0} disconnected',
        projectile: '{0} made {1} explode',
        collision: '{0} slammed into {1}',
        pnbcollision: '{0} crashed into {1}'
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

      // TODO: Refactor to use objects and set text with .text to avoid XSS
      out+= '<li class="' + classType + '">' + data.msg + '</li>';

      var $chatList = $('#chat-main ol');
      var $notifyList = $('#chat-notify ol');

      $chatList.append(out); // Add element
      $chatList.find('li:last').hide().show('slow', function(){
        $chatList[0].scrollTop = $chatList[0].scrollHeight; // Scroll to bottom
      });

      // Manage notifications system =================================
      $notifyList.append(out);
      $notifyList.find('li:last').data('time', new Date().getTime()).hide().show('slow');

      // Only show notify if chat window isn't visible
      if (!$('#chat-main:visible').length){
        $('#chat-notify').fadeIn('slow');
      }
    },

    // Build out the main ship select menu and initialize the connect window
    buildShipSelect: function(data){
      if (ShipSocket.hasConnected) {
        return; // This stuff should only happen once
      } else {
        ShipSocket.hasConnected = true;
      }

      var ships = data.ships;
      var $menu = $('#connection-window .ship-select');
      var $selector = $('<div>').addClass('selector');
      $menu.before($selector);

      // Use the data sent from the server and build out the ship selection
      for (var s in ships){
        var weapons = [
          data.projectiles[ships[s].weapons[0].type],
          data.projectiles[ships[s].weapons[1].type]
        ];

        var $item = $('<label>');
        $item.attr('for', 'ship-' + s).addClass('ship');
        $item.append(
          $('<input>').attr({
            type: 'radio',
            name: 'ship',
            id: 'ship-' + s,
            value: s
          }),
          $('<ship>').addClass('ship_' + s)
        );

        // Selector tabs
        $selector.append(
          $('<ship>')
            .attr('title', ships[s].name)
            .addClass('ship_' + s)
            .data('type', s)
        );

        var $details = $('<div>').addClass('details');

        $details.append(
          $('<h4>').text(ships[s].name),
          $('<table>').append(
            $('<tr>').append(
              $('<th>').text('Ship Stats').attr('colspan', 2),
              $('<td>').text(' ').addClass('spacer'),
              $('<th>').text(weapons[0].name + ' (space)').attr('colspan', 2),
              $('<th>').text(weapons[1].name + ' (m)')
            ),
            $('<tr>').append(
              $('<td>').text('Top Speed'),
              $('<td>').text(ships[s].topSpeed * 420 + ' kph'),
              $('<td>').text(' ').addClass('spacer'),
              $('<td>').text('Damage'),
              $('<td>').text(weapons[0].damage),
              $('<td>').text(weapons[1].damage)
            ),
            $('<tr>').append(
              $('<td>').text('Rotation Speed'),
              $('<td>').text(Math.round((ships[s].rotationSpeed*16)/360*60) + ' rpm'),
              $('<td>').text(' ').addClass('spacer'),
              $('<td>').text('Speed'),
              $('<td>').text(weapons[0].speed),
              $('<td>').text(weapons[1].speed)
            ),
            $('<tr>').append(
              $('<td>').text('Acceleration'),
              $('<td>').html(((ships[s].accelRate*16)*42.5).toFixed(2) + ' cps<sup>2</sup>'),
              $('<td>').text(' ').addClass('spacer'),
              $('<td>').text('Pushback'),
              $('<td>').text(weapons[0].knockBackForce*42),
              $('<td>').text(weapons[1].knockBackForce*42)
            ),
            $('<tr>').append(
              $('<td>').text('Drag'),
              $('<td>').html(((ships[s].drag*16)*42.5).toFixed(2) + ' cps<sup>2</sup>'),
              $('<td>').text(' ').addClass('spacer'),
              $('<td>').text('Lifetime'),
              $('<td>').text(weapons[0].life/1000 + ' sec'),
              $('<td>').text(weapons[1].life/1000 + ' sec')
            ),
            $('<tr>').append(
              $('<td>').text('Shield (' + ships[s].shield.max + ')'),
              $('<td>').html('Regen Rate: ' + (ships[s].shield.regenRate*16) + ' jps'),
              $('<td>').text(' ').addClass('spacer'),
              $('<td>').text('Reload Rate'),
              $('<td>').text(ships[s].weapons[0].fireRate/1000 + ' sec'),
              $('<td>').text(ships[s].weapons[1].fireRate/1000 + ' sec')
            )
          )
        );

        $item.append($details);
        $menu.append($item);
      }


      // Load previous preferences & bind change save
      var prefs = ShipSocket._cookiePrefs();
      if (prefs){
        $('#name').val(prefs.name);
        $('input[value=' + prefs.ship + ']').prop('checked', true);
      } else { // default ship selection if no cookie
        $('input[type=radio]:first').prop('checked', true);
      }

      $('#connection-window input').change(function(){
        ShipSocket._cookiePrefs({
          name: $('#name').val(),
          ship: $('input[name=ship]:checked').val()
        });
      })

      // Bind click for the the selector tabs
      $('.selector ship').click(function(){
        $('input#ship-' + $(this).data('type')).prop('checked', true).change();
      })

      // Bind to change to add / remove select class
      $('input[name=ship]').change(function(){
        if ($(this).is(':checked')){
          $('#connection-window label, .selector ship').removeClass('selected');
          $('.selector ship.ship_'+$(this).val()).addClass('selected');
          $(this).parent().addClass('selected');

          $('.ship-select').animate({
            scrollTop: $(this).parent()[0].offsetTop - $('.selector ship:first')[0].offsetTop - 43
          }, 'slow');
        }
      });

      // Set the initially selected classes
      $('input[name=ship]:checked').parent().addClass('selected');

      $('#connection-window').fadeIn('slow', function(){
        $('.selector ship.ship_' + $('input[name=ship]:checked').val()).addClass('selected').click();
      }).find('input')[0].focus();
    },

    // Utility function for updating player compass directions
    _updateCompass: function(target){
      if (ShipSocket.dummyShips[ShipSocket.id] && target != ShipSocket.id){
        var myPos = ShipSocket.dummyShips[ShipSocket.id].pos;
        var t = ShipSocket.dummyShips[target].pos;
        var angle = 0;
        var color = 'gray'; // Default far away

        if (ShipSocket.dummyShips[target].exploding){
          color = 'dead';
        } else {
          var theta = Math.atan2((t.y + 32) - (myPos.y + 32), (t.x + 32) - (myPos.x + 32));
          if (theta < 0) {theta += 2 * Math.PI;}
          angle = theta * (180 / Math.PI) + 90;

          // Change color based on distance
          var dist = Math.sqrt( Math.pow(t.x - myPos.x, 2) + Math.pow(t.y - myPos.y, 2));

          if (dist < 4000) {
            color = 'green';
          }
          if (dist < 3000) {
            color = 'blue';
          }
          if (dist < 2000) {
            color = 'orange';
          }
          if (dist < 750) {
            color = 'red';
          }
        }

        $('player.ship-id-' + target + ' .arrow')
          .removeClass('gray green blue orange red dead')
          .addClass(color)
          .rotate(Math.round(angle));
      }
    },

    // Utility function to update the player scores
    _updateScore: function(id, kills, deaths){
      var gcd = Math.gcd(deaths, kills);
      $('player.ship-id-' + id + ' i').attr('title',
        kills + ' kills / ' + deaths + ' deaths | Ratio: ' +
          (kills ? kills / gcd : 0) + ':' +
          (deaths ? deaths  / gcd : 0)
      ).text(
        kills + '/' + deaths
      );
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

      var frame = {
        rate: 24,
        number: 120
      };

      var ipad = false;

      // Use the old explosion if ipad
      if ($('html').is('.ipad')){
        ipad = true;
        frame.rate = 20;
        frame.number = 56;
      }

      $('body').append('<boom id="boom-' + id + '" class="layer5 overlay" />');
      $('#boom-'+ id)
      .css({
        left: ship.pos.x + ship.width / 2 - $('#boom-'+ id).width() / 2,
        top: ship.pos.y + ship.height / 2 - $('#boom-'+ id).height() / 2
      })
      .destroy()
      .sprite({
        fps: frame.rate,
        no_of_frames: frame.number,
        on_frame: { // note - on_frame is an object not a function
          19: function(obj) {
            if (!ipad) obj.spState(2);
          },
          39: function(obj) {
            if (!ipad) obj.spState(3);
          },
          59: function(obj) {
            if (!ipad) obj.spState(4);
          },
          79: function(obj) {
            if (!ipad) obj.spState(5);
          },
          99: function(obj) {
            if (!ipad) obj.spState(6);
          }
        },
        on_last_frame: function(obj) {
          obj.spStop();
          ship.exploding = false;
          $('#boom-'+ id).remove();
        }
      });
    },

    _animateMineBoom: function(projectileID){
      var minePos = ShipSocket.projectiles[projectileID].pos;
      var mineSize = 40;

      $('body').append('<boom id="mineboom-' + projectileID + '" class="layer5 overlay mine" />');
      $('#mineboom-' + projectileID)
      .css({
        left: minePos.x - mineSize / 2 - 32,
        top: minePos.y + mineSize / 2 - 64
      })
      .destroy()
      .sprite({
        fps: 24,
        no_of_frames: 37,
        on_last_frame: function(obj) {
          obj.spStop();
          $('#mineboom-' + projectileID).remove();
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

    // Bind callbacks to both mouse and touch events for input
    _bindPushEvents: function(positionCallback, endCallback, triggerCallback){
      // Mouse bindings....
      $(document).bind('mousedown', function(e){
        positionCallback({x:e.pageX, y:e.pageY});
        ShipSocket.mousedown = e.which;
        return false;
      });

      $(document).bind('mousemove', function(e){
        if (ShipSocket.mousedown == 1){
          positionCallback({x:e.pageX, y:e.pageY});
          return false;
        }
      });

      $(document).bind('mouseup', function(e){
        endCallback({x:e.pageX, y:e.pageY});
        ShipSocket.mousedown = 0;
        return false;
      });

      // Touch device beindings...
      $(document).bind('touchstart', function(e){
        var orig = e.originalEvent;
        if (orig.touches.length != 1){
          triggerCallback(orig.touches.length);
        }
      });

      $(document).bind('touchstart touchmove', function(e){
        var orig = e.originalEvent;

        // Ignore any touchstart / touchmove here except the first
        if (orig.touches.length == 1){
          positionCallback({
            x: orig.changedTouches[0].pageX,
            y: orig.changedTouches[0].pageY
          });
        }
        return false;
      });

      $(document).bind('touchend', function(e){
        var orig = e.originalEvent;

        // Ignore any touchend except the last one
        if (orig.changedTouches.length == 1){
          endCallback({
            x: orig.changedTouches[0].pageX,
            y: orig.changedTouches[0].pageY
          });
        }

        return false;
      });
    },

    // Center the view onto a given ship
    _centerView: function(id){
      var s = ShipSocket.dummyShips[id];

      if (s) {
        var x = ($(window).width() / 2) - s.pos.x - 32;
        var y = ($(window).height() / 2) - s.pos.y - 32;

        $('body').css({
          margin: y + 'px ' + x + 'px',
          backgroundPosition: x + 'px ' + y + 'px'
        });
      }
    },
  };
}());
