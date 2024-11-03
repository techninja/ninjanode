import { getId, circleIntersects } from './utils.mjs';
import { gameConfig } from './gameConfig.mjs';
import { PermanentBody, Powerup, Ship } from './classes/index.mjs';

/**
 * Ninjanode primary Game controller class.
 */
export class Game {
  // All Ships are held here with the key as the user hash.
  ships = {};

  // All free floating power up orbs are stored with a random hash key.
  powerups = {};

  // All permanent natural bodies it the sky stored just like powerups.
  pnbits = {};

  // Base entity configs and imported env config.
  playArea;

  constructor() {
    // TODO: Add support for construct overrides?
    this.initialize(gameConfig);
  }

  // Initial gameplay area setup.
  initialize(config) {
    this.playArea = config.playArea;

    // Create the powerups
    for (let i = 0; i < config.powerupCount; i++) {
      const id = getId('pu');
      this.powerups[id] = new Powerup({ id });
    }

    // Create the PNBITS: Planets, suns, etc
    for (let i = 0; i < config.pnbitsCount; i++) {
      const id = getId('pn');
      this.pnbits[id] = new PermanentBody({ id });
    }
  }

  addShip(options) {
    this.ships[options.id] = new Ship(options);
  }

  removeShip(id) {
    if (this.ships[id]) {
      delete this.ships[id];
      return true;
    } else {
      return false;
    }
  }

  processFrame() {
    this.updateShipMovement();
    this.updateProjectileMovement();
    this.detectCollisions();
  }

  /**
   * Move through all ships and step one movement frame ahead.
   */
  updateShipMovement() {
    const { pnbits } = this;
    Object.values(this.ships).forEach((ship) =>
      ship.updateMovementFrame({ pnbits })
    );
  }

  /**
   * Move through all ships and move their projectiles one movement frame ahead.
   */
  updateProjectileMovement() {
    Object.values(this.ships).forEach((ship) =>
      ship.updateProjectileMovementFrame()
    );
  }

  /**
   * Get all Ship positions
   */
  getAllPos() {
    const out = {};

    // Pile all the ship positions together into a clean list with a string version
    for (const id in this.ships) {
      let thrustNum = 0;
      const ship = this.ships[id];

      // Thrust detailing
      if (!ship.exploding) {
        if (ship.thrust > 0) {
          thrustNum = 1; // Forward
        } else if (ship.thrust < 0) {
          thrustNum = 2; // Reverse
        }
      }

      out[id] = {
        pos: {
          x: Math.round(ship.pos.x * 100) / 100,
          y: Math.round(ship.pos.y * 100) / 100,
          t: thrustNum,
          d: ship.pos.d,
        },
        vel: {
          x: ship.velocity.x,
          y: ship.velocity.y,
          l: ship.velocity.length,
          t: parseInt(
            Math.atan2(ship.velocity.y, ship.velocity.x) * (180 / Math.PI)
          ),
        },
      };

      out[id].str = JSON.stringify(out[id]);
    }
    return out;
  }

  /**
   * Get All active projectile positions.
   */
  getActiveProjectiles() {
    const out = {};

    // Each projectile, from each ship
    for (const s in this.ships) {
      for (const p in this.ships[s].projectiles) {
        const proj = this.ships[s].projectiles[p];
        // Only return active projectiles
        if (proj.active) {
          out[s + '_' + p] = proj;
        }
      }
    }

    return out;
  }

  /**
   * Collision detector. Detects collisions between ships, projectiles,
   * powerups, obstacles and the rest.
   */
  detectCollisions() {
    // Loop through every ship, to every ship, to every projectile
    for (const s in this.ships) {
      const source = this.ships[s];

      // Check for ship intersection with a power up!
      if (!source.exploding) {
        // Ship can't be exploding...'
        for (const p in this.powerups) {
          const pow = this.powerups[p];
          if (pow.visible) {
            // Only currently visible powerups
            if (
              circleIntersects(
                source.pos,
                source.width / 2,
                pow.pos,
                pow.width / 2
              )
            ) {
              pow.activate(source);
            }
          }
        }
      }

      // Check for ship intersection with a celestial body!
      if (!source.exploding) {
        // Ship can't be exploding...'
        for (const p in this.pnbits) {
          const pnb = this.pnbits[p];
          if (
            circleIntersects(source.pos, source.width / 2, pnb.pos, pnb.radius)
          ) {
            // console.log(source.name + ' slammed into a type ' + pnb.type.minor + ' ' + pnb.type.major);
            source.hit({ type: 'pnbcollision', source: pnb });
          }
        }
      }

      // Check for projectile intersection with a celestial body!
      for (const i in source.projectiles) {
        const p = source.projectiles[i];
        if (p.active) {
          // Skip inactive projectiles
          // Have projectiles hit PNBITS
          for (const x in this.pnbits) {
            const pnb = this.pnbits[x];
            if (
              circleIntersects(
                { x: p.pos.x, y: p.pos.y - p.config.yOffset },
                p.config.size.hitRadius,
                pnb.pos,
                pnb.radius
              )
            ) {
              p.destroy();
              break;
            }
          }
        }
      }

      // Check every ship against this projectile
      for (const t in this.ships) {
        const target = this.ships[t];

        if (
          t != s &&
          !target.exploding &&
          source.powerups.alterSkip(
            'collision_ship2projectile',
            source,
            target
          ) !== true
        ) {
          // Ships can't hit themselves

          // Exploding ships can't collide with things
          if (!source.exploding) {
            const skipcollision =
              source.powerups.alterSkip(
                'collision_ship2ship',
                source,
                target
              ) === true;

            // While we're here, check for ship to ship collision via circular hitbox
            if (
              circleIntersects(
                source.pos,
                source.width / 2,
                target.pos,
                target.width / 2
              ) &&
              !skipcollision
            ) {
              // Trigger hit callback (to simplify things.. both should die
              if (target.velocityLength > source.velocityLength) {
                console.log(target.name + ' slammed into ' + source.name);
                source.hit({
                  type: 'collision',
                  source: target, // Include source to find out who's hitting who
                });
              } else {
                console.log(source.name + ' slammed into ' + target.name);
                target.hit({
                  type: 'collision',
                  source: source, // Include source to find out who's hitting who
                });
              }
            } // End Check Circle Intersection
          } // End not source exploding

          // Loop through projectiles on source ship (CAN be exploding!)
          for (const i in source.projectiles) {
            const p = source.projectiles[i];
            if (p.active) {
              // Skip inactive projectiles
              if (
                circleIntersects(
                  { x: p.pos.x, y: p.pos.y - p.config.yOffset },
                  p.config.size.hitRadius,
                  target.pos,
                  target.width / 2
                )
              ) {
                // Target is within the hit circle fpr projectile! check horizontal
                console.log(source.name + ' shot ' + target.name);

                // Run hit callback on the target, the shooter is the source
                target.hit({
                  type: 'projectile',
                  weapon: p,
                  source: source,
                });

                // Register knockback on the target on next move
                target.knockBack = {
                  angle: p.pos.d,
                  amount: p.config.knockBackForce,
                };
                p.destroy();
              } // End Check Circular Intersection
            } // End if projectile active
          } // End each projectile in source ship
        } // End if source != target
      } // End each target ship
    } // End Each source ship
  }
}
