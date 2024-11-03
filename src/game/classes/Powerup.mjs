import { SimpleObject } from './SimpleObject.mjs';
import { powerupTypes } from '../../../public/data/index.mjs';
import { getWeightedRandomItem } from '../utils.mjs';

/**
 * Dynamic object with position and optional velocity movement.
 */
export class Powerup extends SimpleObject {
  type;
  constructor(options) {
    const config =
      powerupTypes.find(({ id }) => id == options.type) ||
      getWeightedRandomItem(powerupTypes);

    super({ ...options, config });
    this.type = config.id;
  }

  // Activate the powerup for a given ship!
  activate(ship) {
    this.visible = false;
    const pType = this.id;

    // has this user seen this powerup before?
    if (ship.powerups.list[pType] && ship.powerups.list[pType].active) {
      ship.powerups.list[pType].counter += this.type.active.time; // Add to the time
    } else {
      ship.powerups.list[pType] = {
        counter: this.config.active.time,
        active: true,
        type: this.config,
        interval: setInterval(function () {
          ship.powerups.list[pType].counter--;
          if (ship.powerups.list[pType].counter <= 0) {
            ship.powerups.list[pType].active = false;
            clearInterval(ship.powerups.list[pType].interval);
            ship.powerups.rebuild();
          }
        }, 1000),
      };
    }

    ship.powerups.rebuild();

    // Time till the power up orb respawns
    setTimeout(
      function (powerup) {
        powerup.visible = true;
        // TODO: randomize position?
      },
      this.config.respawnTime * 1000,
      this
    );
  }
}
