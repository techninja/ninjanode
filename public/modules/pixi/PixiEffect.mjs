/**
 * @file NinjaNode Pixi.js Render Library: PixiEffect
 *   Effect wrapper abstraction class for named effect preset emitters
 *   and their logic.
 */

import { emitters } from 'emitters';

const {
  Container,
  particles: { Emitter },
  // Assume PIXI global namespace.
  // eslint-disable-next-line no-undef
} = PIXI;

const degToRad = (degrees) => degrees * (Math.PI / 180);

export class PixiEffect {
  app;
  container;
  emitter;
  active = false;
  started;
  type;
  pos = { x: 0, y: 0, d: 0 };
  ticker;

  constructor({ app, type, parent, pos = {}, active = false }) {
    this.app = app;
    this.type = type;
    this.pos = { ...this.pos, ...pos };
    this.started = Date.now();
    this.container = new Container();
    parent.addChild(this.container);

    this.setActive(active);

    // Manage ticker updates.
    this.initTicker();
  }

  initTicker() {
    this.ticker = () => {
      this.tickerCallback();
    };

    this.app.ticker.add(this.ticker);
  }

  tickerCallback() {
    if (this.emitter) {
      this.emitter.update((Date.now() - this.started) * 0.00001);

      // Cull inactive and empty emitters.
      if (this.emitter.particleCount === 0 && !this.active) {
        this.destroyEmitter();
      }
    }
  }

  destroy() {
    // TODO: Anything else to clean up?
    this.app.ticker.remove(this.ticker);
    this.destroyEmitter();
  }

  destroyEmitter() {
    if (this.emitter) {
      this.emitter.destroy();
      this.emitter = null;
    }
  }

  initEmitter(type = this.type) {
    this.destroyEmitter();
    switch (type) {
      case 'explosion':
        this.emitter = new Emitter(this.container, emitters.poof);
        break;
      case 'thruster':
        this.emitter = new Emitter(this.container, emitters.thrust);
        this.emitter.rotation = degToRad(this.pos.d || 0);
        break;

      default:
        break;
    }
  }

  setPos({ x = 0, y = 0, d = 0 } = {}) {
    this.pos.x = x;
    this.pos.y = y;
    this.pos.d = d;

    if (!this.container || !this.emitter) return;

    // console.log({ x, y });
    this.emitter.updateSpawnPos(x, y);
    this.emitter.rotation = degToRad(d || 0);
  }

  setActive(state) {
    this.active = !!state;

    // Reinitialize culled emitters.
    if (!this.emitter && state) {
      this.initEmitter();

      // Reset emitter position
      this.emitter.resetPositionTracking();
      this.setPos(this.pos);
    }

    if (this.emitter) this.emitter.emit = !!state;
  }

  activate() {
    this.setActive(true);
  }

  deactivate() {
    this.setActive(false);
  }
}
