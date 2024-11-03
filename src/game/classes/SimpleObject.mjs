import { getRandomPos } from '../utils.mjs';

/**
 * Dynamic object with position and optional velocity movement.
 */
export class SimpleObject {
  // callbacks = {};
  config = {};
  pos = { x: 0, y: 0 };
  width;
  height;
  id;
  visible = true;

  constructor({ pos = {}, width, height, id, config } = {}) {
    this.width = width || 64;
    this.height = height || 64;

    // Offset position by half size.
    const { x, y } = pos;
    this.pos = Object.values(pos).length
      ? { x: x - width / 2, y: y - height / 2 }
      : getRandomPos();
    this.id = id;
    // this.callbacks = { ...callbacks };
    this.config = { ...config };
  }
}
