/**
 * @file NinjaNode Render Library
 * Clientside abstraction to separate networking response logic from game rendering.
 */
import ShipInput from './ninjainput.client.mjs';
import audio from './resources/audio/audio.mjs';

const spanWrap = (msg) => `<span>${msg}</span>`;
const gcd = (a, b) => (b == 0) ? a : gcd(b, a % b);

class ShipRenderer {
  $body;
  socket;

  // ID keyed object of dummy ship render info and elements.
  dummyShips = {};
  projectiles = {};
  powerUps = {};
  pnbits = {};

  chatVisible = false;
  shipSelectBuilt = false;

  constructor(socket, $body) {
    this.socket = socket;
    this.$body = $body;
    this.input = new ShipInput(this, socket, $body);

    this.initializeBody();
    this.bindRenderers();
    this.initializeChat();
  }

  initializeBody() {
    // Preload large resources
    this.$body.append('<div id="preload-boom" class="preload"> </div>');
    this.$body.append('<div id="preload-boom-mine" class="preload"> </div>');

    // Bind window resize to re-center on ship
    $(window).resize(() => {
      this._centerView(this.socket.id);
    });

  }

  initializeChat() {
    // Chat notification manager, check every second.
    setInterval(() => {
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
  }

  toggleChat(toggle) {
    $('#chat-main').toggle(toggle, 'slow');
  }

  toggleConnectionWindow(toggle, cb) {
    if (toggle) {
      $('#connection-window').fadeIn('slow', cb);
    } else {
      $('#connection-window').fadeOut('slow', cb);
    }
  }

  setDummyShip(d, id) {
    const root = audio.rootPath; 
    this.dummyShips[id] = {
      element: $('ship#user_' + id),
      label: $('#label_' + id),
      beacon: $('#beacon_' + id),
      name: d.name,
      sound: {
        boom: new Audio(`${root}/${audio.boom}`),
        thrust: new Audio(`${root}/${audio.thrust}`),
        fire: [
          new Audio(`${root}/${audio['fire' + d.sounds[0]]}`),
          new Audio(`${root}/${audio['fire' + d.sounds[1]]}`),
        ],
        hit: [
          new Audio(`${root}/${audio.hit1}`),
          new Audio(`${root}/${audio.hit2}`),
        ],
        minehit: new Audio(`${root}/${audio.mine}`),
        warning: new Audio(`${root}/${audio.warning}`),
        beacon: {
          set: new Audio(`${root}/${audio.spawnSet}`),
          unset: new Audio(`${root}/${audio.spawnUnset}`)
        }
      },
      height: 64,
      width: 64,
      pos: d.pos,
      style: d.style,
      spawnPoint: d.spawnPoint,
    };
  }

  createDummyShipElements(d, id) {
    const myId = this.socket.id;

    // Add ship and label element
    this.$body.append(
      $('<ship>')
        .attr('id', 'user_' + id)
        .attr('class', 'overlay layer2 ship_' + d.style)
        .addClass(id == myId ? 'self' : 'other'),
      $('<label>')
        .attr('class', 'overlay layer4 username ship-type-' + d.style)
        .addClass('style-' + d.shieldStyle)
        .addClass(id == myId ? 'self' : 'other')
        .attr('id', 'label_' + id)
        .text(d.name),
      $('<beacon>')
        .attr('class', 'overlay hidden layer0 ship-type-' + d.style)
        .addClass('style-' + d.shieldStyle)
        .addClass(id == myId ? 'self' : 'other')
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
            .attr('title', id == myId ? "It's you!" : 'Follow me!')
            .addClass(id == myId ? 'circle' : 'arrow', 'compass'),
          $('<label>').text(d.name)
        )
    );
  }


  destroyDummyShip(id) {
    $('.ship-id-' + id).remove();
    this.dummyShips[id].element.remove();
    this.dummyShips[id].label.remove();
    this.dummyShips[id].beacon.remove();
    delete this.dummyShips[id];
  }

  createDummyProjectileElement(d, id) {
    // Only create locally if it doesn't exist.
    if (!this.projectiles[id]) {
      if (!d.noSound){ // No sound play for bulk updates or the like
        this.dummyShips[d.shipID].sound.fire[d.weaponID].volume = this._getDistanceVolume(d.shipID);
        this.dummyShips[d.shipID].sound.fire[d.weaponID].play();
      }

      this.$body.append('<projectile id="proj_' + id + '" class="ship-id-' + d.shipID + ' ship-type-' + this.dummyShips[d.shipID].style + ' overlay init layer0 ' + d.style + ' ' + d.type + '"/>');
      
      this.projectiles[id] = {
        element: $('#proj_' + id),
        type: d.type,
        pos: d.pos
      }

      // Send to update to ensure it gets drawn
      var u = {};
      u[id] = d.pos;
      this.updateProjectilePos(u);
    }
  }

  destroyDummyProjectile(id) {
    // Remove element and data
    if (this.projectiles[id]){

      // Mines get a special explosion
      // TODO: allow for special animation for each weapon
      if (this.projectiles[id].type == 'mine') {
        this._animateMineBoom(id);
      }

      this.projectiles[id].element.remove();
      delete this.projectiles[id];
    }
  }

  bindRenderers() {
    const binds = {
      chat: this.onNewMessage,
      pos: this.updatePos,
      shipstat: this.onShipStatusUpdate,
      shipbeaconstat: this.onBeaconsStatusUpdate,
      shiptypes: (d) => this.buildShipSelect(d),
      projstat: this.onProjectileStatusUpdate,
      projpos: this.updateProjectilePos,
      powerupstat: this.onPowerUpStatusUpdate,
      pnbitsstat: this.onPnbitsStatusUpdate,
      disconnect: this.onDisconnect,
    };

    Object.entries(binds).forEach(([key, callback]) => {
      this.socket.socket.on(key, (d) => {
        callback.call(this, d);
      });
    });
  }

  // TODO:
  // - Figure out "this" pollution for callbacks (likely with call)

  // Handle ship position data (comes in as [id] : x, y, t, d)
  updatePos(data) {
    // Update each ship position in data
    for (var id in data){
      if (this.dummyShips[id]){
        var d = data[id];
        var s = this.dummyShips[id];

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
        s.sound.thrust.volume = this._getDistanceVolume(id) / 10;

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
        if (id == this.socket.id){
          // DEBUG
          $('#debug .pos span').html(s.pos.x + ', ' + s.pos.y);

          // Center body view on us
          this._centerView(id);

          // Update all compasses
          for (var g in this.dummyShips){
            this._updateCompass(g);
          }

        } else { // Update This players compass!
            this._updateCompass(id);
        }

      }
    }
  }

   // Handle projectile position data (comes in as [id] : x, y, d)
  updateProjectilePos(data) {
    // Update each projectile position in data
    for (var id in data){
      if (this.projectiles[id]){
        var d = data[id];
        var s = this.projectiles[id];
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
  }

  // Create / remove local dummy render ships.
  onShipStatusUpdate(data) {
    for (var id in data){
      var d = data[id];
      var ship = this.dummyShips[id];
      if (d.status == 'create'){ // Create new ship object
        // Only create locally if it doesn't exist.
        if (!ship) {
          this.createDummyShipElements(d, id);
          this.setDummyShip(d, id);
          this._updateScore(id, d.score.kills, d.score.deaths);

          // Send to update to ensure it gets drawn
          var u = {};
          u[id] = d.pos;
          this.updatePos(u);

          // Update Beacon for ship
          u = {};
          u[id] = d.spawnPoint;
          this.onBeaconsStatusUpdate(u, true);
        }
      } else if (d.status == 'destroy'){ // Destroy!
        // Remove element, projectile elements, and data
        if (ship){
          this.destroyDummyShip(id);
        }
      } else if (d.status == 'hit'){ // Hit

        // Play hit sounds
        // TODO: Genralize this to allow custom hit sounds for every weapon
        if (d.weapon == 'mine') {
          ship.sound.minehit.volume = this._getDistanceVolume(id);
          ship.sound.minehit.play();
        } else {
          var index = Math.round(Math.random()); // Pick between 0 and 1
          ship.sound.hit[index].volume = this._getDistanceVolume(id);
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
            this._updateScore(i, d.scores[i].kills, d.scores[i].deaths);
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
            ship.sound.warning.volume = this._getDistanceVolume(id);
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
          ship.sound.boom.volume = this._getDistanceVolume(id);
          ship.sound.boom.play();
          this._animateBoom(id);
        } else if (d.stage == 'middle') {
          // Fade out...
          ship.element.fadeOut();
          ship.label.fadeOut();
        } else { // Complete!
          // Fade back in
          ship.element.fadeIn('slow');
          ship.label.fadeIn('slow');
          this._updateCompass(id);
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
  }

  // Create / remove local projectile objects, id is ship ID plus serial
  onProjectileStatusUpdate(data) {
    for (var id in data) {
      var d = data[id];
      if (d.status == 'create'){
        this.createDummyProjectileElement(d, id);
      } else { // Destroy!
        this.destroyDummyProjectile(id);
      }
    }
  }

   // Handle power up status update
  onPowerUpStatusUpdate(data) {
    for (var id in data){
      var p = data[id];

      // Power up orb not yet created, lets build it!
      if (!this.powerUps[id]){
        this.powerUps[id] = {
          element: $('<powerup>')
            .addClass(p.cssClass + ' overlay layer0')
            .attr('id', 'pu-' + id)
            .css({left: p.pos.x, top: p.pos.y})
        };

        this.powerUps[id].element.appendTo('body');
        if (!p.visible) this.powerUps[id].element.hide();
      } else if (!p.visible) { // It does exist, hide it if it should go
        this.powerUps[id].element.fadeOut();
        // TODO: add sound?
      } else if (p.visible) { // It does exist, show it!
        this.powerUps[id].element.fadeIn('slow');
      }
    }
  }


  // Handle chat / system messages
  onNewMessage(data) {
    // If there's no match for the ID, then we shouldn't really continue
    // TODO: This rules out sys messages NOT about users... should rethink later
    if (!this.dummyShips[data.id]) {
      return;
    }

    var classType = '';
    var out = '';
    var nameSource = spanWrap(this.dummyShips[data.id].name);
    var nameTarget = '';

    // Set the name of the target in the message to the sip, if it's available
    if (data.target && this.dummyShips[data.target]){
      nameTarget = spanWrap(this.dummyShips[data.target].name);
    } else { // Otherwise, use it as a literal
      nameTarget = data.target;
    }

    var sysMsgActions = {
      join: `${nameSource} joined the game`,
      disconnect: `${nameSource} disconnected`,
      projectile: `${nameSource} made ${nameTarget} explode`,
      collision: `${nameSource} slammed into ${nameTarget}`,
      pnbcollision: `${nameSource} crashed into ${nameTarget}`
    }

    if (data.type == 'system'){
      classType = 'sys';
      data.msg = sysMsgActions[data.action];
    } else if (data.type == 'chat') {
      data.msg = nameSource + ': ' + data.msg;
      if (data.id == this.socket.id) {
        classType = 'self';
      }
    }

    // TODO: Refactor to use objects and set text with .text to avoid XSS
    out += `<li class="${classType}">${data.msg}</li>`;

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
  }

  // Handle Clestial Body (PNBITS) status updates
  onPnbitsStatusUpdate(data) {
    for (var id in data){
      var p = data[id];

      // Object not created yet!
      if (!this.pnbits[id]){
        var size = p.radius * 2;
        this.pnbits[id] = {
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

        this.pnbits[id].element.appendTo('body');
      } else { // It does exist, move it?
        // TODO: Add Move code
      }
    }
  }

  // Handle ship beacon updates (comes in as [id] : x, y, or [id]: null)
  onBeaconsStatusUpdate(data, batch) {
    for (var id in data) {
      if (this.dummyShips[id]) {
        var d = data[id];
        var s = this.dummyShips[id];

        // Set beacon position.
        if (d) {
          if (!batch) {
            s.sound.beacon.set.volume = this._getDistanceVolume(id) / 8;
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
            s.sound.beacon.unset.volume = this._getDistanceVolume(id) / 8;
            s.sound.beacon.unset.play();
          }
          s.beacon.hide('slow');
        }
      }
    }
  }

  onDisconnect() {
    this.$body.append('<div class="window fixed disconnected">Connection to server lost, refresh the page to reconnect</div>');
  }

  // Build out the main ship select menu and initialize the connect window
  buildShipSelect(data) {
    if (this.shipSelectBuilt) {
      return; // This stuff should only happen once
    } else {
      this.shipSelectBuilt = true;
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
    var prefs = this._cookiePrefs();
    if (prefs){
      $('#name').val(prefs.name);
      $('input[value=' + prefs.ship + ']').prop('checked', true);
    } else { // default ship selection if no cookie
      $('input[type=radio]:first').prop('checked', true);
    }

    $('#connection-window input').change(() => {
      this._cookiePrefs({
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


    // But only *in* game if data submitted
    $('#connection-window button').click(() => {
      // TODO: Validate form input
      this.socket.join({
        name: $('input.name').val(),
        style: $('input[name=ship]:checked').val()
      });

      $('#connection-window').fadeOut('slow');
      return false;
    });

    // Show it and set focus!
    this.toggleConnectionWindow(true, () => {
      $('#connection-window').find('input')[0].focus();
      $('.selector ship.ship_' + $('input[name=ship]:checked').val()).addClass('selected').click();
    });
  }

  // Center the view onto a given ship
  _centerView(id) {
    const s = this.dummyShips[id];

    if (s) {
      // TODO: Support non-<body> $body.
      const x = ($(window).width() / 2) - s.pos.x - 32;
      const y = ($(window).height() / 2) - s.pos.y - 32;

      this.$body.css({
        margin: `${y}px ${x}px`,
        backgroundPosition: `${x}px ${y}px`,
      });
    }
  }

  // Utility function for updating player compass directions
  _updateCompass(target) {
    const myId = this.socket.id;
    if (this.dummyShips[myId] && target != myId){
      var myPos = this.dummyShips[myId].pos;
      var t = this.dummyShips[target].pos;
      var angle = 0;
      var color = 'gray'; // Default far away

      if (this.dummyShips[target].exploding){
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
  }

  // Utility function to update the player scores
  _updateScore(id, kills, deaths) {
    var gcdVal = gcd(deaths, kills);
    $('player.ship-id-' + id + ' i').attr('title',
      kills + ' kills / ' + deaths + ' deaths | Ratio: ' +
        (kills ? kills / gcdVal : 0) + ':' +
        (deaths ? deaths  / gcdVal : 0)
    ).text(
      kills + '/' + deaths
    );
  }

  // Utility function to return a volume from 0 to 1 as a factor
  // of distance away from the player.
  _getDistanceVolume(id) {
    // The distance past which nothing can be heard
    var maxDistance = 2500;

    // The distance at which there is no volume drop
    var minDistance = 500;

    var source = { x: 0, y: 0 };
    var target = this.dummyShips[id].pos;

    // If after connection... get pos from current user location
    if (this.dummyShips[this.socket.id]){
      source = this.dummyShips[this.socket.id].pos;
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

  }

  _animateBoom(id) {
    const ship = this.dummyShips[id];
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

    this.$body.append('<boom id="boom-' + id + '" class="layer5 overlay" />');
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
  }

  _animateMineBoom(projectileID) {
    var minePos = this.projectiles[projectileID].pos;
    var mineSize = 40;

    this.$body.append('<boom id="mineboom-' + projectileID + '" class="layer5 overlay mine" />');
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
  }

  _cookiePrefs(prefs) {
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
  }

}

export default ShipRenderer;
