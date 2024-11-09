/**
 * @file NinjaNode Pixi.js Render Library: PixiShip
 *   Manages sprite and other effect abstractions within the app stage
 */

import { shipTypes } from '../index.mjs';
import { PixiEffect } from './PixiEffect.mjs';

// Assume PIXI global namespace.
const {
  Sprite,
  Assets,
  Container,
  filters: { MotionBlurFilter },
  // eslint-disable-next-line no-undef
} = PIXI;

const degToRad = (degrees) => degrees * (Math.PI / 180);

export class PixiShip {
  app;
  pos;
  velocity = { x: 0, y: 0 };
  container;
  width;
  height;
  config;
  thrust = 0;
  sprite;
  emitters = {};
  filters = {};

  explode() {
    new PixiEffect({
      app: this.app,
      type: 'explosion',
      parent: this.container,
      pos: { x: this.width / 2, y: this.height / 2 },
      active: true,
    });
  }

  constructor(app, options) {
    this.app = app;
    this.config = shipTypes[options.style];
    this.init(options);
  }

  async init(options) {
    const { style, pos } = options;
    const {
      size: { width, height },
    } = this.config;

    this.pos = pos;
    this.width = width;
    this.height = height;
    const imgPath = `../resources/graphics/ships/ship_${style}.png`;

    // load the texture we need
    const texture = await Assets.load(imgPath);
    const ship = new Sprite(texture);
    this.sprite = ship;
    ship.width = width;
    ship.height = height;

    // Everything goes in the container which is moved.
    this.container = new Container();
    this.container.addChild(ship);

    // Rotate around the center
    this.container.pivot.x = width / 2;
    this.container.pivot.y = height / 2;

    // Add the ship to the scene we are building
    this.app.stage.addChild(this.container);

    // Init thrusters.
    this.initThrusters();

    // Add a filter!
    this.addFilter('motionblur', new MotionBlurFilter());

    this.app.ticker.add(() => {
      // TODO: Fake glide between updates
      // this.setPos({
      //   x: this.pos.x - this.velocity.x * 0.1,
      //   y: this.pos.y + this.velocity.y * 0.1,
      //   d: this.pos.d,
      // });
    });

    this.setPos(pos);
  }

  addFilter(name, filter) {
    this.filters[name] = filter;
    this.sprite.filters = Object.values(this.filters);
  }

  setThrust(t = 0) {
    this.thrust = t;
    const { thrusters } = this.emitters;

    if (!thrusters) return;

    switch (t) {
      case 0:
        // No thrust.
        thrusters.rear.forEach((thruster) => thruster.deactivate());
        thrusters.front.forEach((thruster) => thruster.deactivate());
        break;

      case 1:
        // Forward thrust from back.
        thrusters.rear.forEach((thruster) => thruster.activate());

        break;

      case 2:
        // Reverse thrust from front.
        thrusters.front.forEach((thruster) => thruster.activate());
        break;
      default:
        break;
    }
  }

  getThrusterOffset({
    x = this.pos.x,
    y = this.pos.y,
    d: rawAngle = this.pos.d,
    t,
    index,
  }) {
    const { thrusterPositions } = this.config;
    const enginePosition = t == 1 ? 'rear' : 'front';
    const offsets = thrusterPositions[enginePosition][index];

    if (!offsets) return {};

    // Flip angle for thruster emitter based on front/rear.
    const d = enginePosition == 'rear' ? rawAngle - 180 : rawAngle;

    return {
      d,
      x: x + offsets.distance * Math.cos(degToRad(rawAngle + offsets.angle)),
      y: y + offsets.distance * Math.sin(degToRad(rawAngle + offsets.angle)),
    };
  }

  initThrusters() {
    const {
      thrusterPositions: { front, rear },
    } = this.config;

    const thrustEmitter = () =>
      new PixiEffect({
        app: this.app,
        type: 'thruster',
        pos: this.pos,
        parent: this.app.stage,
      });

    this.emitters.thrusters = {
      front: front.map(thrustEmitter),
      rear: rear.map(thrustEmitter),
    };
  }

  updateThrusterPositions() {
    if (!this.emitters.thrusters) return;
    this.emitters.thrusters.rear.forEach((thruster, index) => {
      thruster.setPos(this.getThrusterOffset({ t: 1, index }));
    });

    this.emitters.thrusters.front.forEach((thruster, index) => {
      thruster.setPos(this.getThrusterOffset({ t: 2, index }));
    });
  }

  setPos({ x, y, d, t = 0, vel }) {
    if (!this.container) return;

    this.pos.x = x;
    this.pos.y = y;
    this.pos.d = d;
    this.setThrust(t);
    this.updateThrusterPositions();

    if (vel) this.setVel(vel);

    this.container.x = x;
    this.container.y = y;
    this.container.rotation = degToRad(d);
  }

  setVel({ l, t }) {
    this.velocity = {
      x: Math.cos(degToRad(t - 90)) * (l * 1),
      y: Math.sin(degToRad(t - 90)) * (l * 1),
    };

    if (this.filters['motionblur']) {
      this.filters['motionblur'].velocity = {
        x: this.velocity.x * 0.5,
        y: this.velocity.y * 0.5,
      };
    }
  }
}
