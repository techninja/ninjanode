/**
 * @file Ninja Ships ninjanode main serverside handler for all network
 * communication to clients and turning input from clients into ship movement
 */

// all Ships are held here with the key as the user hash
var _ships = {};

var projectileTypes = {
  laser: {
    speed: 20,
    life: 2500, // How many ms till it dies?
    sound: 3,
    knockBackForce: 3,
    yOffset: -50
  },
  biglaser: {
    speed: 15,
    life: 5000,
    sound: 1,
    knockBackForce: 10,
    yOffset: -50
  },
  energy : {
    speed: 15,
    life: 5500,
    sound: 2,
    knockBackForce: 15,
    yOffset: -2
  },
  mine : {
    speed: 0,
    life: 60000,
    sound: 4,
    knockBackForce: 5,
    yOffset: 0
  }
};

var shipTypes = {
  a: {
    name: 'Legionnaire',
    topSpeed: 14,
    accelRate: 0.15,
    drag: 0.09,
    rotationSpeed: 6,
    weapons: [
      {type: 'biglaser', style: 'red', fireRate: 950},
      {type: 'mine', style: 'red', fireRate: 10000}
    ]
  },
  b: {
    name: 'Cygnuss',
    topSpeed: 20,
    accelRate: 0.2,
    drag: 0.03,
    rotationSpeed: 2,
    weapons: [
      {type: 'energy', style: 'red', fireRate: 450},
      {type: 'mine', style: 'red', fireRate: 10000}
    ]
  },
  c: {
    name: 'Scimitar',
    topSpeed: 15,
    accelRate: 0.6,
    drag: 0.08,
    rotationSpeed: 10,
    weapons: [
      {type: 'laser', style: 'green', fireRate: 1750},
      {type: 'mine', style: 'green', fireRate: 10000}
    ]
  },
  d: {
    name: 'Mongoose',
    topSpeed: 12,
    accelRate: 0.25,
    drag: 0.03,
    rotationSpeed: 5,
    weapons: [
      {type: 'biglaser', style: 'blue', fireRate: 750},
      {type: 'mine', style: 'blue', fireRate: 10000}
    ]
  },
  e: {
    name: 'Sulaco',
    topSpeed: 10,
    accelRate: 0.2,
    drag: 0.03,
    rotationSpeed: 5,
    weapons: [
      {type: 'laser', style: 'red', fireRate: 650},
      {type: 'mine', style: 'red', fireRate: 10000}
    ]
  },
  f: {
    name: 'Excalibur',
    topSpeed: 8,
    accelRate: 0.8,
    drag: 0.03,
    rotationSpeed: 5,
    weapons: [
      {type: 'energy', style: 'blue', fireRate: 650},
      {type: 'mine', style: 'red', fireRate: 10000}
    ]
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
module.exports.getActiveProjectiles = function(){
  var out = {};

  // Each projectile, from each ship
  for (var s in _ships){
    for (var p in _ships[s].projectiles) {
      var proj = _ships[s].projectiles[p];
      // Only return active projectiles
      if (proj.active){
        out[s + '_' + p] = proj;
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
module.exports.shipSetThrust = function(id, direction){
  if (_ships[id]){
    var amount = _ships[id].data.accelRate;
    _ships[id].thrust = amount * direction;

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
      _ships[id].turn = _ships[id].data.rotationSpeed * (direction == 'l' ? -1 : 1);
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
module.exports.shipSetFire = function(id, createCallback, destroyCallback, weaponID){
  if (_ships[id] && !_ships[id].exploding){
      _ships[id].fire(createCallback, destroyCallback, weaponID);
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
 *     pos {object}: Initial position object (x:[n], y:[n], d:[n])
 *     hit {func}: Callback for when the ship gets hit or collides
 * @returns {object} instantiated ship object
 * @see module.exports.addShip
 */
function _shipObject(options){

  this.name = options.name;

  // Ship object state variables===========
  // Velocity (speed + direction)
  this.velocity_x = 0;
  this.velocity_y = 0;
  this.id = options.id;
  this.velocityLength = 0;
  this.turn = 0;
  this.thrust = 0;
  this.width = 64;
  this.height = 64;
  this.projectiles = [];
  this.exploding = false;

  // Default to style 'a' if not found in shipTypes
  this.style = shipTypes[options.style] ? options.style : 'a';

  // All customizable ship type options are held here
  this.data = shipTypes[options.style];

  // Populate weapons with projectile type data for data access
  for (var w in this.data.weapons){
    this.data.weapons[w].data = projectileTypes[this.data.weapons[w].type];
  }

  this.pos = options.pos ? options.pos : {x: 0, y: 0, d: 0};

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
  this.lastFire = [0, 0];

  // FUNCTION Send out a projectile
  this.fire = function(createCallback, destroyCallback, weaponID){
    // Don't fire too quickly! Respect the fireRate for this ship
    if (new Date().getTime() - this.lastFire[weaponID] < this.data.weapons[weaponID].fireRate){
      return;
    }

    this.lastFire[weaponID] = new Date().getTime();

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
      type: this.data.weapons[weaponID].type,
      style: this.data.weapons[weaponID].style,
      shipID: this.id,
      weaponID: weaponID,
      pos: {x: this.pos.x + 25, y: this.pos.y, d: this.pos.d},
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
  this.shipID = options.shipID;
  this.age = 0;
  this.type = options.type;
  this.weaponID = options.weaponID;
  this.born = new Date().getTime();

  this.data = projectileTypes[options.type];

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
        proj.pos.x+= Math.sin(theta) * proj.data.speed;
        proj.pos.y+= Math.cos(theta) * -proj.data.speed;

        // Projectile is to old! Kill it.
        if (new Date().getTime() - proj.born > proj.data.life) {
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

          // Exploding ships can't collide with things
          if (!source.exploding){
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
          } // End not source exploding

          // Loop through projectiles on source ship (CAN be exploding!)
          for (var i in source.projectiles){
            var p = source.projectiles[i];
            if (p.active){ // Skip inactive projectiles
              if (p.pos.x > target.pos.x && p.pos.x < target.pos.x + target.width){
                // Target is within the vertical column! check horizontal
                if (p.pos.y - p.data.yOffset > target.pos.y && p.pos.y - p.data.yOffset < target.pos.y + target.height){
                  // Projectile X & Y is within the target's box!
                  console.log(source.name + ' shot ' + target.name);

                  // Run callback
                  target.hit({
                    type: 'projectile',
                    source: source
                  });

                  // Register knockback on the target on next move
                  target.knockBack = {
                    angle: p.pos.d,
                    amount: p.data.knockBackForce
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
      if (self.knockBack){
        angle = self.knockBack.angle;
        amount = self.knockBack.amount;
        delete self.knockBack;
      }

      theta = angle * (Math.PI / 180);
      self.velocity_x += Math.cos(theta) * -amount;
      self.velocity_y += Math.sin(theta) * amount;
    }

    // find the overall velocity length
    self.velocityLength = Math.sqrt(Math.pow(self.velocity_x, 2) + Math.pow(self.velocity_y, 2)) - self.data.drag;

    // if exploding, exponential drag!
    if (self.exploding){
      self.velocityLength = self.velocityLength / 1.1;
    }

    if (self.velocityLength < 0) {
      self.velocityLength = 0;
    } else {
      if (self.velocityLength > self.data.topSpeed){
        self.velocityLength = self.data.topSpeed;
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
