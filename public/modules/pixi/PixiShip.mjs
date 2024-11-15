/**
 * @file NinjaNode Pixi.js Render Library: PixiShip
 *   Manages sprite and other effect abstractions within the app stage
 */

import { shipTypes } from 'data';
import { PixiEffect } from 'pixirender';

// Assume PIXI global namespace.
const {
  Sprite,
  Assets,
  Container,
  filters: { MotionBlurFilter },
  DEG_TO_RAD,
  Graphics,
  // eslint-disable-next-line no-undef
} = PIXI;

const degToRad = (degrees) => degrees * DEG_TO_RAD;

export class PixiShip {
  id;
  app;
  pos;
  velocity = { x: 0, y: 0 };
  container;
  width;
  height;
  style;
  config;
  thrust = 0;
  sprite;
  emitters = {};
  filters = {};
  parent;
  isMirror;
  mirror;
  world;
  ticker;

  constructor(app, options) {
    this.app = app;
    this.config = shipTypes[options.style];
    this.init(options);
  }

  async init(options) {
    const { style, pos, isMirror = false, parent } = options;
    const {
      size: { width, height },
    } = this.config;
    this.id = options.id;

    this.isMirror = isMirror;
    this.style = style;
    this.world = options.world || { width: 200, height: 200 };
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
    parent.addChild(this.container);
    this.parent = parent;

    // Init thrusters.
    this.initThrusters();

    // Add motion blur
    if (options.blur) {
      this.addFilter('motionblur', new MotionBlurFilter());
    }

    // Manage ticker updates.
    this.ticker = this.app.ticker.add(() => {
      this.tickerCallback();
    });
    this.setPos(pos);

    // Init callback.
    if (options.onInit) options.onInit();
  }

  tickerCallback() {
    const fps = 120;
    const serverFps = 1000 / 60;

    // Glide between vector velocity length updates.
    // TODO: move to absolute time based calculation for better accuracy.
    if (this.container && !this.container.destroyed) {
      this.container.updateTransform({
        x: this.container.x + this.velocity.x * ((1 / fps) * serverFps),
        y: this.container.y - this.velocity.y * ((1 / fps) * serverFps),
      });

      this.manageMirror();
    }
  }

  async chunkParts() {
    const parts = 8;
    const timeout = 5000;
    const imgPath = `../resources/graphics/ships/ship_${this.style}.png`;
    const texture = await Assets.load(imgPath);
    let chunks = [];

    const arcWidth = 360 / parts;
    const half = this.width * 0.5;
    const chunkRadius = this.width * 0.8;

    // Turn a distance and angle into an x/y coordinate with 90 degree offset.
    const getC = (distance, angle, isY = false) =>
      distance *
      (isY ? Math.sin(degToRad(angle - 90)) : Math.cos(degToRad(angle - 90)));

    this.sprite.alpha = 0;
    for (let index = 0; index < parts; index++) {
      // Initialize new sprite and mask
      const container = new Container();
      const sprite = new Sprite(texture);
      const mask = new Graphics();

      // Conform sprite to ship dimensions (not image dimensions).
      sprite.anchor.set(0.5);
      sprite.width = this.width;
      sprite.height = this.height;

      sprite.mask = mask;
      sprite.rotation = 0;

      // Add both Sprite and mask to a container that we'll move/effect on the ship container.
      container.addChild(sprite);
      container.addChild(mask);
      this.container.addChild(container);

      // Home coordinates of slice triangle base.
      const home = [
        getC(chunkRadius, index * arcWidth), // X
        getC(chunkRadius, index * arcWidth, 1), // Y
      ];

      // Middle is starting point of next index.
      const middle = [
        getC(chunkRadius, (index + 1) * arcWidth), // X
        getC(chunkRadius, (index + 1) * arcWidth, 1), // Y
      ];

      mask.moveTo(home[0], home[1]); // Move home
      mask.lineTo(0, 0); // Draw to 0
      mask.lineTo(middle[0], middle[1]); // Draw To middle point
      mask.lineTo(home[0], home[1]); // Draw to home
      mask.fill({ color: 0xff0000 }); // Add fill to activate.

      // Move to center to align with ship
      container.updateTransform({ x: half, y: half });
      chunks.push(container);
    }

    const speed = 1.2;
    const rotation = [0.01, -0.1, 0.04, 0.09, -0.001, 0.1, -0.02, 0.015];
    const ticker = this.app.ticker.add(() => {
      chunks.forEach((chunk, index) => {
        chunk.updateTransform({
          x: chunk.x + getC(speed, arcWidth * index + arcWidth / 2),
          y: chunk.y + getC(speed, arcWidth * index + arcWidth / 2, 1),
          rotation: chunk.rotation + rotation[index],
        });
        chunk.alpha = chunk.alpha - 0.005;
      });
    });

    // Cleanup after timeout.
    setTimeout(() => {
      this.app.ticker.remove(ticker);
      chunks.forEach((sprite) => sprite.destroy());
      chunks = [];
      this.sprite.alpha = 1;
    }, timeout);

    console.log(chunks);
  }

  destroy() {
    // Clean up ticker.
    this.app.ticker.remove(this.ticker);

    // Remove ship container.
    this.container.destroy();

    // Clean up emitters.
    const emitters = [
      ...this.emitters.thrusters.front,
      ...this.emitters.thrusters.rear,
    ];
    emitters.forEach((effect) => effect.destroy());
  }

  manageMirror() {
    // No mirror management for mirror ships.
    if (this.isMirror) return;

    const half = this.width / 2;

    const setMirror = (pos) => {
      if (!this.mirror) {
        this.mirror = new PixiShip(this.app, {
          parent: this.parent,
          style: this.style,
          pos,
          isMirror: true,
          width: this.width,
          height: this.height,
        });
      } else {
        this.mirror.setPos(pos);
      }
    };

    // Mirror position base.
    const mPos = {
      x: this.pos.x,
      y: this.pos.y,
      d: this.pos.d,
    };

    // Past right edge.
    if (this.pos.x > this.world.width - half) {
      mPos.x = mPos.x - this.world.width;
      setMirror(mPos);
      return;
    }

    // Past left edge.
    if (this.pos.x - half < 0) {
      mPos.x = mPos.x + this.world.width;
      setMirror(mPos);
      return;
    }

    // Past bottom edge.
    if (this.pos.y > this.world.height - half) {
      mPos.y = mPos.y - this.world.height;
      setMirror(mPos);
      return;
    }

    // Past top edge.
    if (this.pos.y - half < 0) {
      mPos.y = mPos.y + this.world.height;
      setMirror(mPos);
      return;
    }

    // If we got this far, don't need it anymore!
    this.mirror?.destroy();
    this.mirror = null;
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

  explode() {
    new PixiEffect({
      app: this.app,
      type: 'explosion',
      parent: this.container,
      pos: { x: this.width / 2, y: this.height / 2 },
      active: true,
    });

    this.chunkParts();
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
        parent: this.container.parent,
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

    // Reset position once no velocity
    //if (vel?.l === 0) {
    this.container.updateTransform({ x, y });
    //}
    this.container.rotation = degToRad(d);
  }

  setVel({ l, t }) {
    this.velocity = {
      x: Math.cos(degToRad(t - 90)) * (l * 1),
      y: Math.sin(degToRad(t - 90)) * (l * 1),
    };

    if (this.filters['motionblur']) {
      this.filters['motionblur'].velocity = {
        x: this.velocity.x * 1,
        y: this.velocity.y * 1,
      };
    }
  }
}
