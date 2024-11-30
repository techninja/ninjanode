import { DynamicObject } from './DynamicObject.mjs';
import {
  shipTypes,
  powerupTypes,
  projectileTypes,
} from '../../../public/data/index.mjs';
import { Projectile } from './Projectile.mjs';
import { gameConfig } from '../gameConfig.mjs';
import { getId, getRandomPos, lineAngle, lineDistance } from '../utils.mjs';

/**
 * Ship class.
 */
export class Ship extends DynamicObject {
  // Player State
  name;

  // Ship game state
  turn = 0;
  thrust = 0;
  projectiles = {};
  lastFire = [0, 0];
  exploding = false;
  knockBack;
  spawnPoint = false; // Position object if set.
  powerups = {
    active: [],
    inactive: [],
    list: {},
  };

  constructor(options) {
    super(options);
    this.name = options.name;
    this.setStyle(options.style);
    this.pos = options.pos ?? this.getSpawnPos();
    this.bindpowerups();
  }

  bindpowerups() {
    this.powerups.rebuild = () => {
      // Rebuild the lists from scratch
      this.powerups.active = [];
      this.powerups.inactive = [];
      const { list } = this.powerups;
      for (const p in list) {
        if (list[p].active) {
          this.powerups.active.push(list[p].type.active.cssClass);
        } else {
          this.powerups.inactive.push(list[p].type.active.cssClass);
        }
      }
    };

    // Returns true if an alter function returns true, can be used to skip
    // certain operations based on input
    this.powerups.alterSkip = (functionName, arg1, arg2) => {
      for (const p in powerupTypes) {
        if (powerupTypes[p].skipAlters) {
          if (typeof powerupTypes[p].skipAlters[functionName] == 'function') {
            return powerupTypes[p].skipAlters[functionName](arg1, arg2);
          }
        }
      }
      return false;
    };

    // Returns a value if an alter function returns a value, default value otherwise
    this.powerups.alter = (functionName, def, arg1, arg2) => {
      for (const p in powerupTypes) {
        if (powerupTypes[p].alters) {
          if (typeof powerupTypes[p].alters[functionName] == 'function') {
            return powerupTypes[p].alters[functionName](def, arg1, arg2);
          }
        }
      }
      return def;
    };
  }

  // Allow changing ship style. You die after.
  changeStyle(style) {
    this.setStyle(style);
    this.triggerBoom();
  }

  setStyle(style) {
    // Default to style 'a' if not found in shipTypes
    this.style = shipTypes[style] ? style : 'a';

    // All customizable ship type options are held here
    this.config = shipTypes[this.style];

    // Set intial shield power level (will be drawn down by hits from opponents)
    this.shieldPowerStatus = this.config.shield.max;

    // Populate weapons with projectile type data for data access
    for (const w in this.config.weapons) {
      this.config.weapons[w].data =
        projectileTypes[this.config.weapons[w].type];
    }
  }

  // Cull inactive projectiles.
  cullProjectile(id) {
    if (this.projectiles[id]) {
      this.projectiles[id].destroy();
      delete this.projectiles[id];
    }
  }

  // Add a projectile
  addProjectile(angle, weaponId, callbacks) {
    // Cull inactive projectiles.
    for (const i in this.projectiles) {
      if (!this.projectiles[i].active) {
        this.cullProjectile(i);
        break;
      }
    }

    const { weapons } = this.config;
    const id = getId('p');
    this.projectiles[id] = new Projectile({
      id,
      type: weapons[weaponId].type,
      style: weapons[weaponId].style,
      shipId: this.id,
      weaponId,
      pos: {
        x: this.pos.x,
        y: this.pos.y,
        d: angle,
      },
      callbacks,
    });
  }

  // FUNCTION Attempt to fire a projectile
  fire(createCallback, destroyCallback, weaponId) {
    // Don't fire too quickly! Respect the fireRate for this ship
    if (
      new Date().getTime() - this.lastFire[weaponId] <
      this.config.weapons[weaponId].fireRate
    ) {
      return;
    }

    this.lastFire[weaponId] = new Date().getTime();

    const callbacks = { create: createCallback, destroy: destroyCallback };
    const fireCount = this.powerups.alter('fire_count', 1, this);
    switch (fireCount) {
      case 1:
        this.addProjectile(this.pos.d, weaponId, callbacks);
        break;
      case 3:
        this.addProjectile(this.pos.d - 10, weaponId, callbacks);
        this.addProjectile(this.pos.d, weaponId, callbacks);
        this.addProjectile(this.pos.d + 10, weaponId, callbacks);
        break;
    }
  }

  // FUNCTION projectile hit/collision callback
  hit({ type, weapon, source }) {
    const target = this;

    if (type == 'collision') {
      // Same shield, both die
      if (target.shieldPowerStatus == source.shieldPowerStatus) {
        target.shieldPowerStatus = 0;
        source.shieldPowerStatus = 0;
      } else {
        // Force shield comparison, whoever wins gets only 5 shield points left
        target.shieldPowerStatus -= source.shieldPowerStatus;
        source.shieldPowerStatus -= target.shieldPowerStatus + 15;
      }

      if (target.shieldPowerStatus > 0) {
        // Only leave them with a sliver if they lived
        target.shieldPowerStatus = 5;
      } else {
        // Kill em if their shield is out
        target.shieldPowerStatus = 0;
        target.triggerBoom();
      }

      if (source.shieldPowerStatus > 0) {
        // Only leave them with a sliver if they lived
        source.shieldPowerStatus = 5;
      } else {
        this.callback('hit', {
          type: 'secondary collision',
          target: source,
          source: target,
        });

        source.shieldPowerStatus = 0;
        source.triggerBoom();
      }
    } else if (type == 'projectile') {
      // Remove the shield power directly via the weapon damage
      target.shieldPowerStatus =
        target.shieldPowerStatus - weapon.config.damage;

      // Kill em if their shield is out
      if (target.shieldPowerStatus <= 0) {
        target.shieldPowerStatus = 0;
        target.triggerBoom();
      }
    } else if (type == 'pnbcollision') {
      // Target hit source (A permanent natural body!)
      target.shieldPowerStatus *= 0.9;

      // Kill em if their shield is out
      if (target.shieldPowerStatus < 1) {
        target.shieldPowerStatus = 1;
      }
    }

    this.callback('hit', { type, weapon, source, target });
  }

  getSpawnPos() {
    if (!this.spawnPoint) {
      return getRandomPos(this.config.rotationSpeed);
    } else {
      return {
        x: this.spawnPoint.x,
        y: this.spawnPoint.y,
        d: this.spawnPoint.d,
      };
    }
  }

  setSpawnPos() {
    // Toggle spawnpoint on set, only set if unset.
    if (this.spawnPoint) {
      this.spawnPoint = null;
    } else {
      this.spawnPoint = {
        x: this.pos.x,
        y: this.pos.y,
        d: 0,
      };
    }

    return true;
  }

  // FUNCTION Trigger ship explosion
  triggerBoom() {
    if (!this.exploding) {
      const ship = this;
      ship.exploding = true;

      // Clear out any powerups when you die
      for (const p in ship.powerups.list) {
        if (ship.powerups.list[p].active) {
          ship.powerups.list[p].active = false;
          clearInterval(ship.powerups.list[p].interval);
        }
      }

      ship.powerups.rebuild();

      // Trigger first callback
      this.callback('boom', {
        id: ship.id,
        stage: 'start',
      });

      // 2 seconds to wait for the middle
      setTimeout(() => {
        // Trigger second callback
        this.callback('boom', {
          id: ship.id,
          stage: 'middle',
        });
      }, 300);

      // 5 seconds should be enough time for the explosion and wait
      // Respawn & reset ship
      setTimeout(() => {
        ship.killVelocity();
        ship.pos = this.getSpawnPos(ship);
        ship.exploding = false;
        ship.shieldPowerStatus = ship.config.shield.max;

        // Trigger third callback
        this.callback('boom', {
          id: ship.id,
          stage: 'complete',
        });
      }, 5500);
    }
  }

  setThrust(direction) {
    const { accelRate } = this.config;
    this.thrust = accelRate * direction;

    // Nullify thrust if exploding.
    if (this.exploding) {
      this.thrust = 0;
    }

    return true;
  }

  setTurn(direction) {
    if (direction) {
      this.turn = this.config.rotationSpeed * (direction == 'l' ? -1 : 1);
    } else {
      this.turn = 0;
    }

    // Nullify turning if exploding.
    if (this.exploding) {
      this.turn = 0;
    }

    return true;
  }

  setTouch(rawAngle) {
    // Stopping.
    if (rawAngle === false) {
      // Stop ship calc position
      this.touchAngle = false;
      this.setTurn(false);
      this.setThrust(false);
      return false;
    }

    // Directing ship with a touch.
    const { d } = this.pos;
    const { rotationSpeed } = this.config;

    // Round incoming angle to nearest available ship rotation speed angle
    // Prevents angle jitter, but makes touch less precise
    let angle = Math.round(rawAngle / rotationSpeed) * rotationSpeed;

    // Figure out which direction to turn comparing current angle to touch angle
    const turnDir = ((angle - d + 540) % 360) - 180;

    // If user touches in 40 degree range behind the ship, thrust backwards
    const reverse = Math.abs(turnDir) > 150;
    this.setThrust(reverse ? -1 : 1);

    // Same direction! disable turning
    if (d == angle) {
      this.setTurn(false);

      // Stop ship calc position
      this.touchAngle = false;
      return true;
    }

    // The algorithm below fails with an angle of 0, so cheat and make it 1
    if (angle == 0) {
      angle = 1;
    }

    if (!reverse) {
      if (turnDir > 0) {
        this.setTurn('r');
      } else {
        this.setTurn('l');
      }
    }

    // Continue calculation during ship move without new data sent
    this.touchAngle = angle;

    return true;
  }

  updateMovementFrame({ pnbits }) {
    // Process touch angle movement, if any
    if (this.touchAngle) {
      this.setTouch(this.touchAngle);
    }

    // Rotate the ship
    if (this.turn != 0 && !this.exploding) {
      this.rot(this.turn);
    }

    // Apply shield regeneration
    if (!this.exploding) {
      const { shield } = this.config;
      this.shieldPowerStatus = this.shieldPowerStatus + shield.regenRate;

      // Cap shield power at max power
      if (this.shieldPowerStatus > shield.max) {
        this.shieldPowerStatus = shield.max;
      }
    }

    // Apply thrust vector, or knockback vector.
    // TODO: These should both be added separately and effect each other.
    if (this.thrust != 0 || this.knockBack) {
      const { angle = this.pos.d, amount = this.thrust } = this.knockBack || {};

      // For knockback hit, only run once..
      if (this.knockBack) {
        delete this.knockBack;
      }

      const theta = angle * (Math.PI / 180);
      this.velocity.x += Math.cos(theta) * -amount;
      this.velocity.y += Math.sin(theta) * amount;
    }

    // Modify Velocity length/angle based on proximity to all PNBITS
    let pnbitsEffected = false;
    if (!this.exploding) {
      for (const i in pnbits) {
        const p = pnbits[i];
        const thisCenter = {
          x: this.pos.x + this.width / 2,
          y: this.pos.y + this.height / 2,
        };
        const distance = lineDistance(thisCenter, p.center) - this.width / 2;

        // Only apply gravitational effects within the "effective area" of the object
        if (distance < p.density * p.radius * 5) {
          // Find the angle between the ship and the center of the mass
          let theta = lineAngle(this.pos, p.center);
          const shipMass = 100;
          pnbitsEffected = true;

          // Calculate amount of gravitational pull as log of distance and mass
          const amount = (((p.g * shipMass) / distance) ^ 2) / 300;
          theta = theta - Math.PI / 2; // Rotate angle 90 degrees

          // Apply gravitational pull to vector
          this.velocity.x += Math.cos(theta) * amount;
          this.velocity.y += Math.sin(theta) * amount;
        }
      }
    }

    // Find the overall velocity length
    const dragOption = pnbitsEffected ? 0 : this.config.drag;
    this.velocity.length =
      Math.sqrt(Math.pow(this.velocity.x, 2) + Math.pow(this.velocity.y, 2)) -
      dragOption;

    // if exploding, exponential drag!
    if (this.exploding) {
      this.velocity.length = this.velocity.length / 1.1;
    }

    if (this.velocity.length < 0) {
      this.velocity.length = 0;
    } else {
      if (this.velocity.length > this.config.topSpeed && !pnbitsEffected) {
        this.velocity.length = this.config.topSpeed;
      }

      // find the current velocity rotation
      const rot =
        Math.atan2(this.velocity.y, this.velocity.x) * (180 / Math.PI);

      // recalculate the velocities by multiplying the new rotation by the overall velocity length
      const theta = rot * (Math.PI / 180);
      this.velocity.x = Math.cos(theta) * this.velocity.length;
      this.velocity.y = Math.sin(theta) * this.velocity.length;

      // update position
      this.pos.y += this.velocity.x;
      this.pos.x += this.velocity.y;

      this.pos = this.getWrapPos(this.pos, this.width);
    }
  }

  // Wrap to play area around center and complete transfer
  getWrapPos(inPos, width) {
    const half = width / 2;
    const pos = { ...inPos };

    const p = gameConfig.playArea;

    // Top to bottom.
    if (pos.y < -half) {
      pos.y = p - half;
    }

    // Bottom to top
    if (pos.y > p + half) {
      pos.y = half;
    }

    // Left to right.
    if (pos.x < -half) {
      pos.x = p - half;
    }

    // Right to left
    if (pos.x > p + half) {
      pos.x = half;
    }

    return pos;
  }

  updateProjectileMovementFrame() {
    for (const p in this.projectiles) {
      const proj = this.projectiles[p];

      if (proj.active) {
        const theta = proj.pos.d * (Math.PI / 180);
        proj.pos.x += Math.sin(theta) * proj.config.speed;
        proj.pos.y += Math.cos(theta) * -proj.config.speed;

        // Wrap projectile
        proj.pos = this.getWrapPos(proj.pos, proj.config.size.width);

        // Projectile is too old! Kill it.
        if (new Date().getTime() - proj.born > proj.config.life) {
          this.cullProjectile(proj.id);
        }
      }
    }
  }
}
