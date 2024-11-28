import { getRandomPos } from '../utils.mjs';

/**
 * Dynamic object with position and optional velocity movement.
 */
export class DynamicObject {
  callbacks = {};
  config = {};
  pos = { x: 0, y: 0, d: 0 };
  velocity = { x: 0, y: 0, length: 0 };
  width;
  height;
  id;
  offsetPos;

  constructor({
    pos = {},
    width = 64,
    height = 64,
    offsetPos = false,
    id,
    callbacks,
    config,
  }) {
    this.width = width;
    this.height = height;
    const { d = 0, x = 0, y = 0 } = pos;

    // Offset position by half size.
    this.offsetPos = offsetPos;
    if (offsetPos) {
      this.pos = { d, x: x - width / 2, y: y - height / 2 };
    } else {
      this.pos = Object.values(pos).length ? { d, x, y } : getRandomPos();
    }

    this.id = id;
    this.callbacks = { ...callbacks };
    this.config = { ...config };
  }

  // Rotate relative degrees.
  rot(deg) {
    this.pos.d = this.pos.d + deg;
    if (this.pos.d >= 360) {
      this.pos.d = 0;
    } else if (this.pos.d <= 0) {
      this.pos.d = 360;
    }
  }

  // Kill all velocity.
  killVelocity() {
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.velocity.length = 0;
  }

  // Call a named callback with "this" context and arguments.
  callback(name, args = {}) {
    if (this.callbacks[name]) {
      this.callbacks[name].call(this, args);
    }
  }
}
