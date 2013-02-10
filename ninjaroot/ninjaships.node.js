/**
 * @file Ninja Ships ninjanode main serverside handler for all network
 * communication to clients and turning input from clients into ship movement
 */

// all Ships are held here with the key as the user hash
var _ships = {};

var projectileTypes = {
  laser: {
    speed: 20,
    life: 30, // Num of cycles before death
    yOffset: -50
  },
  energy : {
    speed: 10,
    life: 90,
    yOffset: -2
  }
};

/**
 *  Exported function for creating ships
 */
module.exports.addShip = function(options){
  _ships[options.id] = new _shipObject(options);
}

/**
 *  Exported Main loop function
 */
module.exports.processShipFrame = function(){
  _updateShipMovement();
  _updateProjectileMovement();
  _detectCollision();
}

/**
 *  Exported remover for ship data
 */
module.exports.shipRemove = function(id){
  if (_ships[id]){
    delete _ships[id];
    return true;
  } else {
    return false;
  }
}

/**
 *  Exported Getter for ship data
 */
module.exports.shipGet = function(id){
  if (_ships[id]){
    return _ships[id];
  } else {
    return _ships;
  }
}
/**
 *  Exported Getter for all projectile positions
 */
module.exports.getAllProjectiles = function(){
  var out = {};

  // Pile all the projectile positions from every ship together into a clean list
  for (var s in _ships){
    for (var p in _ships[s].projectiles) {
      var proj = _ships[s].projectiles[p];
      if (proj.active){
        out[s + '_' + p] = {
          x: Math.round(proj.pos.x * 100)/100,
          y: Math.round(proj.pos.y * 100)/100,
          d: proj.pos.d
        };
      }
    }
  }

  return out;
}

/**
 *  Exported Getter for a random starting position
 */
var getRandomPos = function(){
  return {
    x: Math.floor((Math.random()*16)+1) * 128,
    y: Math.floor((Math.random()*16)+1) * 128,
    d: Math.floor((Math.random()*355)+1)
  };
}
module.exports.getRandomPos = getRandomPos;


/**
 *  Exported Getter for all ship positions
 */
module.exports.getAllPos = function(){
  var out = {};

  // Pile all the ship positions together into a clean list with a string version

  for (var s in _ships){
    var thrustNum = 0;

    // Thrust detailing
    if (!_ships[s].exploding){
      if (_ships[s].thrust > 0) {
        thrustNum = 1; // Forward
      } else if (_ships[s].thrust < 0) {
        thrustNum = 2; // Reverse
      }
    }

    out[s] = {
      pos: {
        x: Math.round(_ships[s].pos.x * 100)/100,
        y: Math.round(_ships[s].pos.y * 100)/100,
        t: thrustNum,
        d: _ships[s].pos.d
      }
    }

    out[s].str = JSON.stringify(out[s].pos);
  }
  return out;
}

/**
 *  Exported Setter for thrust
 */
module.exports.shipSetThrust = function(id, thrust){
  if (_ships[id]){
    _ships[id].thrust = thrust;

    if (_ships[id].exploding) {
      _ships[id].thrust = 0;
    }

    return true;
  }else {
    return false;
  }
}

/**
 *  Exported Setter for direction
 */
module.exports.shipSetTurn = function(id, direction){
  if (_ships[id]){
    if (direction){
      _ships[id].turn = _ships[id].rotation_speed * (direction == 'l' ? -1 : 1);
    } else {
      _ships[id].turn = 0;
    }

    if (_ships[id].exploding) {
      _ships[id].turn = 0;
    }

    return true;
  }else {
    return false;
  }
}

/**
 *  Exported Setter for triggering Fire command
 */
module.exports.shipSetFire = function(id, createCallback, destroyCallback){
  if (_ships[id]){
      _ships[id].fire(createCallback, destroyCallback);
    return true;
  }else {
    return false;
  }
}


/**
 * Private ship instantiator function
 * @param {object} options
 *   Accepts the following object keys:
 *     name {string}: Name of the user
 *     style {char}: Letter of the ship style to use (a|b|c|d|e|f)
 *     pos {object}: Initial home position object (x:[n], y:[n], d:[n])
 *     hit {func}: Callback for when the ship gets hit or collides
 * @returns {object} instantiated ship object
 * @see module.exports.addShip
 */
function _shipObject(options){

  this.name = options.name;

  // Velocity (speed + direction)
  this.velocity_x = 0;
  this.velocity_y = 0;
  this.id = options.id;
  this.velocityLength = 0;
  this.max_speed = 10;
  this.drag = 0.03;
  this.turn = 0;
  this.thrust = 0;
  this.width = 64;
  this.height = 64;
  this.projectiles = [];

  this.rotation_speed = 5;
  this.exploding = false;

  this.style = options.style ? options.style : 'a';

  // Set Projectile defaults per ship style
  switch (this.style){
    case 'b':
      this.projectileDefaults = {
        type: 'energy',
        style: 'blue'
      };
      this.fireRate = 550; // MS between shots
      break;

    case 'c':
      this.projectileDefaults = {
        type: 'laser',
        style: 'green'
      };
      this.fireRate = 450; // MS between shots
      break;

    case 'd':
      this.projectileDefaults = {
        type: 'energy',
        style: 'blue'
      };
      this.fireRate = 750; // MS between shots
      break;

    case 'e':
      this.projectileDefaults = {
        type: 'laser',
        style: 'blue'
      };
      this.fireRate = 650; // MS between shots
      break;

    case 'f':
      this.projectileDefaults = {
        type: 'laser',
        style: 'green'
      };
      this.fireRate = 850; // MS between shots
      break;

    default:
      this.projectileDefaults = {
        type: 'laser',
        style: 'red'
      };
      this.fireRate = 750; // MS between shots
  }

  this.pos = options.pos ? options.pos : {x: 0, y: 0, d: 0};

  this.home = {x: this.pos.x, y: this.pos.y, d: this.pos.d};

  // FUNCTION Direct visual rotation
  this.rot = function(deg){
    this.pos.d = this.pos.d + deg;
      if (this.pos.d >= 360) {
        this.pos.d = 0;
      }else if (this.pos.d <= 0) {
        this.pos.d = 360;
      }
  };

  // Prep the lastFire var for testing
  this.lastFire = new Date().getTime();

  // FUNCTION Send out a projectile
  this.fire = function(createCallback, destroyCallback){
    // Don't fire too quickly! Respect the fireRate for this ship
    if (new Date().getTime() - this.lastFire < this.fireRate){
      return;
    }

    this.lastFire = new Date().getTime();

    // Add to the projectile array for the ship object
    var index = -1;

    // Cull the array position of the first non-active projectile
    for (var i in this.projectiles){
      if (!this.projectiles[i].active){
        index = i;
        break;
      }
    }

    // If there are nor projectiles, or they're all active, then
    // index should be added to the end (AKA, array length!)
    if (index == -1) {
      index = this.projectiles.length;
    }

    this.projectiles[index] = new _projectileObject({
      id: index,
      type: this.projectileDefaults.type,
      style: this.projectileDefaults.style,
      pos: {x: this.pos.x+25, y: this.pos.y, d: this.pos.d},
      create: createCallback,
      destroy: destroyCallback
    });
  }

  // FUNCTION remove velocity helper
  this.kill_velocity = function(){
    this.velocity_x = 0;
    this.velocity_y = 0;
    this.velocityLength = 0;
  }

  // FUNCTION projectile hit/collision callback
  this.hit = function(data){
    data.target = this;

    if (data.type == 'collision'){
      // Everyone dies here!
      data.target.triggerBoom();
      data.source.triggerBoom();
    } else if (data.type == 'projectile') {
      // TODO: Calc damage
      // Just kill em for now
      data.target.triggerBoom();
    }

    options.hit(data);
  }

  // FUNCTION Trigger ship explosion
  this.triggerBoom = function(){
    if (!this.exploding){
      var ship = this;
      ship.exploding = true;

      // Trigger first callback
      options.boom({
        id: ship.id,
        stage: 'start'
      });

      // 5 seconds should be enough time for the explosion and wait
      setTimeout(function(){
        ship.kill_velocity();
        ship.pos = getRandomPos();
        ship.exploding = false;

        // Trigger second callback
        options.boom({
          id: ship.id,
          stage: 'complete'
        });
      }, 5000)
    }
  }
}

/**
 * Private projectile instantiator function
 * @param {object} options
 *   Requires the following object keys:
 *     type {string}: Type of projectile, currently supports (laser|energy)
 *     style {string}: Class/Color for projectile
 *     pos {object}: Starting position object (x:[n], y:[n], d:[n])
 *     id {integer}: The serial index ID for this projectile
 *     create {func}: Callback called when projectile is created
 *     destroy {func}: Callback called when projectile is destroyed
 * @returns {object} instantiated projectile object
 * @see _shipObject.fire
 */
function _projectileObject(options){
  this.pos = options.pos;
  this.style = options.style;
  this.id = options.id;
  this.age = 0;
  this.type = options.type;

  var typeData = projectileTypes[options.type];
  this.speed = typeData.speed;
  this.life = typeData.life;
  this.yOffset = typeData.yOffset;

  this.destroy = function(){
    this.active = false;
    options.destroy(this);
  }

  this.active = true;
  options.create(this);
}

/**
 * Private projectile calculator. Moves all projectiles for all ships
 * @see module.exports.processShipFrame
 */
function _updateProjectileMovement(){
  for(var s in _ships) {
    for(var p in _ships[s].projectiles) {
      var proj = _ships[s].projectiles[p];

      if (proj.active){
        var theta = proj.pos.d * (Math.PI / 180);
        proj.pos.x+= Math.sin(theta) * proj.speed;
        proj.pos.y+= Math.cos(theta) * -proj.speed;

        // Age the projectile
        proj.age++;

        // Projectile is to old! Kill it.
        if (proj.age > proj.life) {
          proj.destroy();
        }
      }
    }
  }
}

/**
 * Private collision detector. Detects collisions between ships, projectiles,
 * powerups, obstacles and the rest. Currently very broken.
 * @see module.exports.processShipFrame
 */
function _detectCollision(){
    // Loop through every ship, to every ship, to every projectile
    for(var s in _ships){
      var source = _ships[s];
      // Check every ship against this projectile
      for(var t in _ships){
        var target = _ships[t];
        if (t != s && !target.exploding){ // Ships can't hit themselves

          // While we're here, check for ship to ship collision
          if (source.pos.x + source.width > target.pos.x && source.pos.x < target.pos.x + target.width){
            // Target is within the vertical column! check horizontal
            if (source.pos.y + source.height > target.pos.y && source.pos.y < target.pos.y + target.height){
              // Source bounding box is within the target's box!

              // Trigger hit callback (to simplify things.. both should die
              if (target.velocityLength > source.velocityLength){
                console.log(target.name + ' slammed into ' + source.name);
                source.hit({
                  type: 'collision',
                  source: target // Include source to find out who's hitting who
                });
              } else {
                console.log(source.name + ' slammed into ' + target.name);
                target.hit({
                  type: 'collision',
                  source: source // Include source to find out who's hitting who
                });
              }
            } // End Check Y bounds
          } // End Check X bounds

          // Loop through projectiles on source ship
          for (var i in source.projectiles){
            var p = source.projectiles[i];
            if (p.active){ // Skip inactive projectiles
              if (p.pos.x > target.pos.x && p.pos.x < target.pos.x + target.width){
                // Target is within the vertical column! check horizontal
                if (p.pos.y - p.yOffset > target.pos.y && p.pos.y - p.yOffset < target.pos.y + target.height){
                  // Projectile X & Y is within the target's box!
                  console.log(source.name + ' shot ' + target.name);

                  // Run callback
                  target.hit({
                    type: 'projectile',
                    source: source
                  });

                  // Register knockback on the target on next move
                  target.knockback = {
                    angle: p.pos.d,
                    type: p.type
                  };
                  p.destroy();
                } // End Check Y bounds
              } // End Check X bounds
            } // End if projectile active
          } // End each projectile in source ship
        } // End if source != target
      } // End each target ship
    } // End Each source ship

}

/**
 * Private ship calculator. Moves all ships individually based on inertia
 * @see module.exports.processShipFrame
 */
function _updateShipMovement(){
  for (s in _ships){
    var self = _ships[s];

    if (self.turn != 0 && !self.exploding){
      self.rot(self.turn);
    }

    // Apply thrust vector
    if (self.thrust != 0 || self.hit){
      var angle = self.pos.d;
      var amount = self.thrust;

      // For knockback hit, only run once..
      if (self.knockback){
        angle = self.knockback.angle;
        amount = 2;
        delete self.knockback;
      }

      theta = angle * (Math.PI / 180);
      self.velocity_x += Math.cos(theta) * -amount;
      self.velocity_y += Math.sin(theta) * amount;
    }

    // find the overall velocity length
    self.velocityLength = Math.sqrt(Math.pow(self.velocity_x, 2) + Math.pow(self.velocity_y, 2)) - self.drag;

    // if exploding, exponential drag!
    if (self.exploding){
      self.velocityLength = self.velocityLength / 1.1;
    }

    if (self.velocityLength < 0) {
      self.velocityLength = 0;
    } else {
      if (self.velocityLength > self.max_speed){
        self.velocityLength = self.max_speed;
      }

      // find the current velocity rotation
      var rot = Math.atan2(self.velocity_y, self.velocity_x) * (180 / Math.PI);

      // recalculate the velocities by multiplying the new rotation by the overall velocity length
      var theta = rot * (Math.PI / 180);
      self.velocity_x = Math.cos(theta) * self.velocityLength;
      self.velocity_y = Math.sin(theta) * self.velocityLength;

      // update position
      self.pos.y += self.velocity_x;
      self.pos.x += self.velocity_y;
    }
  }
}
