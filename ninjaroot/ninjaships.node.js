/**
 * @file Ninja Ships ninjanode main serverside handler for all network
 * communication to clients and turning input from clients into ship movement
 */

// all Ships are held here with the key as the user hash
var _ships = {};

var projectileTypes = {
  laser: {
    speed: 20,
    life: 30 // Num of cycles before death
  },
  energy : {
    speed: 10,
    life: 90
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
          x: Math.round(proj.pos.x, 1),
          y: Math.round(proj.pos.y, 1),
          d: proj.pos.d
        };
      }
    }
  }

  return out;
}

/**
 *  Exported Getter for all ship positions
 */
module.exports.getAllPos = function(){
  var out = {};

  // Pile all the ship positions together into a clean list with a string version

  for (var s in _ships){
    var thrustNum = 0;

    // Thrust detailing
    if (_ships[s].thrust > 0) {
      thrustNum = 1; // Forward
    } else if (_ships[s].thrust < 0) {
      thrustNum = 2; // Reverse
    }

    out[s] = {
      pos: {
        x: Math.round(_ships[s].pos.x, 1),
        y: Math.round(_ships[s].pos.y, 1),
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
 * @returns {object} instantiated ship object
 * @see module.exports.addShip
 */
function _shipObject(options){

  this.name = options.name;

  // Velocity (speed + direction)
  this.velocity_x = 0;
  this.velocity_y = 0;
  this.velocity_length = 0;
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
    this.velocity_length = 0;
  }

  // FUNCTION Trigger ship explosion
  this.trigger_boom = function(returnhome, midcallback, endcallback){
    if (!this.exploding){
      var ship = this;
      this.exploding = true;
      // TODO: Trigger explode
      // TODO: Trigger after explode
      /*ship.kill_velocity();
      ship.pos.x = ship.home.x;
      ship.pos.y = ship.home.y;*/
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
  /*
    * Pseudo:
    *
    * ship to ship collision
    *
    * ship to projectile collision
    *
    *
    *
    *
    */
   // TODO: REWRITE!
    /*var lastd = '';
      for(var s in _ships){
        var b = _ships[s];

        var debug = a.x + ', ' + b.x;

        if (lastd != debug){
          //console.log(debug);
          lastd=debug;
        }

        if (a.x > b.x && a.x < b.x + b.width){
          // Ship a is within the vert column!
          a.trigger_boom(true);
        }
      }
      */
}

/**
 * Private ship calculator. Moves all ships individually based on inertia
 * @see module.exports.processShipFrame
 */
function _updateShipMovement(){
  for (s in _ships){
    var self = _ships[s];

    if (self.turn != 0){
      self.rot(self.turn);
    }

    if (self.exploding){
      //$(this.element_id).removeClass('thrusting thrusting_back')
      //return;
    }

    // find the overall velocity length
    self.velocity_length = Math.sqrt(Math.pow(self.velocity_x, 2) + Math.pow(self.velocity_y, 2)) - self.drag;

    // if exploding, double the drag!
    if (self.exploding){
      self.velocity_length = self.velocity_length - self.drag;
    }

    if (self.velocity_length < 0) {
      self.velocity_length = 0;
    } else {
      if (self.velocity_length > self.max_speed){
        self.velocity_length = self.max_speed;
      }

      // find the current velocity rotation
      var rot = Math.atan2(self.velocity_y, self.velocity_x) * (180 / Math.PI);

      // recalculate the vVelelocities by multiplying the new rotation by the overall velocity length
      var theta = rot * (Math.PI / 180);
      self.velocity_x = Math.cos(theta) * self.velocity_length;
      self.velocity_y = Math.sin(theta) * self.velocity_length;

      // update position
      self.pos.y += self.velocity_x;
      self.pos.x += self.velocity_y;
    }

    if (self.thrust != 0){
      theta = self.pos.d * (Math.PI / 180);
      self.velocity_x += Math.cos(theta) * -self.thrust;
      self.velocity_y += Math.sin(theta) * self.thrust;
    }

    if (self.thrust > 0){
      //this.element.addClass('thrusting');
    }else if (self.thrust < 0){
      //this.element.addClass('thrusting_back');
    }else if (self.thrust == 0){
      //this.element.removeClass('thrusting thrusting_back')
    }
  }
}
