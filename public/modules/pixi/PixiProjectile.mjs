/**
 * @file NinjaNode Pixi.js Render Library: PixiProjectile
 *   Tracking render object class for all ninjanode projectile types.
 */

import { projectileTypes } from 'data';

const {
  // Assets,
  Container,
  Graphics,
  FillGradient,
  filters: { GlowFilter },
  // Assume PIXI global namespace.
  // eslint-disable-next-line no-undef
} = PIXI;

const degToRad = (degrees) => degrees * (Math.PI / 180);

export class PixiProjectile {
  app;
  container;
  started;
  style;
  type;
  pos = { x: 0, y: 0, d: 0 };
  velocity = { x: 0, y: 0 };
  config = {};
  ticker;

  constructor({ app, style, type, parent, pos = {} }) {
    this.config = projectileTypes[type];
    this.app = app;
    this.type = type;
    this.style = style;
    this.started = Date.now();
    this.container = new Container();
    parent.addChild(this.container);

    const laser = new Graphics();
    this.container.addChild(laser);
    const width = 5;
    const length = 50;
    const color = 0xff0000;

    // Bottom of laser
    laser.moveTo(0, 50);

    // Top Left
    laser.lineTo(-width / 2, -length / 2);

    // Rounded arc to right.
    laser.arcTo(0, -length / 2 - 5, width / 2 + 10, -length / 2 + 20, width);

    // Back to bottom.
    laser.lineTo(0, length / 2);

    // Create a fill gradient
    const gradientFill = new FillGradient(-width, 0, width, 0);

    // Add the color stops to the fill gradient
    gradientFill.addColorStop(0, 0xff0000);
    gradientFill.addColorStop(0.5, 0xffffff);
    gradientFill.addColorStop(1, 0xff0000);

    laser.fill(gradientFill);

    this.container.filters = [
      new GlowFilter({ distance: 20, outerStrength: 5, color }),
    ];
    this.setPos(pos);

    // Velocity is locked at init.
    this.velocity = {
      x: this.config.speed * Math.cos(degToRad(this.pos.d - 90)),
      y: this.config.speed * Math.sin(degToRad(this.pos.d - 90)),
    };

    this.initTicker();
  }

  initTicker() {
    this.ticker = () => {
      this.tickerCallback();
    };

    this.app.ticker.add(this.ticker);
  }

  tickerCallback() {
    // Update position
    const fps = 120;
    const serverFps = 1000 / 60;
    // Glide between vector velocity length updates.
    // TODO: move to absolute time based calculation for better accuracy.
    if (this.container && !this.container.destroyed) {
      this.container.updateTransform({
        x: this.container.x + this.velocity.x * ((1 / fps) * serverFps),
        y: this.container.y + this.velocity.y * ((1 / fps) * serverFps),
      });
    }
  }

  destroy() {
    // TODO: Anything else to clean up?
    this.app.ticker.remove(this.ticker);
    this.container.destroy();
  }

  setPos({ x = 0, y = 0, d = 0 } = {}) {
    if (!this.container) return;
    this.pos.x = x;
    this.pos.y = y;
    this.pos.d = d;

    this.container.updateTransform({ x, y });
    this.container.rotation = degToRad(d);
  }

  setActive(state) {
    this.active = !!state;
  }

  activate() {
    this.setActive(true);
  }

  deactivate() {
    this.setActive(false);
  }
}
