import { DynamicObject } from './DynamicObject.mjs';
import { projectileTypes } from '../../../public/data/index.mjs';

export class Projectile extends DynamicObject {
  shipId;
  style;
  born;
  type;
  weaponId;
  age = 0;
  active = true;

  constructor(options) {
    const { type, style, weaponId, shipId } = options;
    const config = projectileTypes[type];
    const { width, height } = config.size;

    super({ ...options, config, width, height });

    this.born = new Date().getTime();
    this.style = style;
    this.type = type;
    this.weaponId = weaponId;
    this.shipId = shipId;

    // Is this actually needed?
    this.callback('create');
  }

  destroy() {
    this.active = false;
    this.callback('destroy');
  }
}
