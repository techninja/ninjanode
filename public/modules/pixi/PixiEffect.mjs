/**
 * @file NinjaNode Pixi.js Render Library: PixiEffect
 *   Effect wrapper abstraction class for named effect preset emitters
 *   and their logic.
 */

import { emitters } from 'emitters';

const {
  Assets,
  Container,
  particles: { Emitter },
  // Assume PIXI global namespace.
  // eslint-disable-next-line no-undef
} = PIXI;

const degToRad = (degrees) => degrees * (Math.PI / 180);

export class PixiEffect {
  effect;
  container;
  emitter;
  active;
  started;
  pos = { x: 0, y: 0, d: 0 };

  constructor({ app, type, parent, pos, active = false }) {
    this.started = Date.now();
    this.container = new Container();
    parent.addChild(this.container);

    this.loadAssets().then(() => {
      switch (type) {
        case 'explosion':
          this.emitter = new Emitter(this.container, emitters.poof);
          break;
        case 'thruster':
          this.emitter = new Emitter(this.container, emitters.thrust);
          break;

        default:
          break;
      }

      this.setActive(active);

      // Set position.
      this.emitter.resetPositionTracking();
      this.setPos(pos || this.pos);

      app.ticker.add(() => {
        this.emitter.update((Date.now() - this.started) * 0.00001);
      });
    });
  }

  async loadAssets() {
    // TODO: Do this better.
    await Assets.load('/resources/graphics/explosions/smoke.png');
    await Assets.load('/resources/graphics/spark.png');
  }

  setPos({ x = 0, y = 0, d = 0 } = {}) {
    if (!this.container || !this.emitter) return;

    this.pos.x = x;
    this.pos.y = y;

    // console.log({ x, y });
    this.emitter.updateSpawnPos(x, y);
    this.emitter.rotation = degToRad(d || 0);
  }

  setActive(state) {
    this.active = !!state;
    if (this.emitter) this.emitter.emit = !!state;
  }

  activate() {
    this.setActive(true);
  }

  deactivate() {
    this.setActive(false);
  }
}
