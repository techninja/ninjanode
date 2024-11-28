import { SimpleObject } from './SimpleObject.mjs';
import { pnbitsTypes } from '../../../public/data/index.mjs';
import { getWeightedRandomItem, rand } from '../utils.mjs';

/**
 * Dynamic object with position and optional velocity movement.
 */
export class PermanentBody extends SimpleObject {
  radius;
  type;
  density;
  center;
  g;
  name;

  constructor(options = {}) {
    // Pick random type if one not given.
    const config =
      pnbitsTypes.find(({ cssClass }) => cssClass == options.type) ||
      getWeightedRandomItem(pnbitsTypes);

    const { ranges, cssClass } = config;
    const { radius = rand(ranges.radius) } = options;
    super({ ...options, width: radius, height: radius, config });

    this.type = cssClass;
    this.radius = radius;
    this.density = rand(config.ranges.density);
    this.center = { x: this.pos.x + radius, y: this.pos.y + radius };
    this.g = (this.density * radius) ^ (2 / 10000000);

    this.name = 'a type ' + config.minor.toUpperCase() + ' ' + config.major;
  }
}
