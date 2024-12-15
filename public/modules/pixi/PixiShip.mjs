/**
 * @file NinjaNode Pixi.js Render Library: PixiShip
 *   Manages sprite and other effect abstractions within the app stage
 */

import { store } from 'hybrids';
import { projectileTypes, shipTypes } from 'data';
import { PixiEffect, PixiProjectile } from 'pixirender';
import { AppState, UserSettings } from 'models';
import { lineDistance, getRando } from 'utils';

// Assume PIXI global namespace.
const {
  Sprite,
  Container,
  Text,
  filters: { MotionBlurFilter, PixelateFilter, ShockwaveFilter },
  DEG_TO_RAD,
  Graphics,
  Texture,
  sound,
} = window.PIXI;

const degToRad = (degrees) => degrees * DEG_TO_RAD;

export class PixiShip {
  id;
  app;
  container;
  width;
  height;
  style;
  config;
  thrust = 0;
  sprite;
  shield;
  nameLabel;
  name = '';
  projectiles = {};
  emitters = {};
  filters = {};
  parent;
  globalCamera;
  isMirror;
  mirror;
  world;
  ticker;

  // Server and client frame sync.
  pos = { x: 0, y: 0, d: 0 }; // Actual Pixi container pinned position transposed.
  velocity = { x: 0, y: 0 }; // Server reported velocity per ms
  targetPos = { x: 0, y: 0 }; // Server-corrected position
  correctionStartTime = null; // Time when correction begins
  correctionDuration = 400; // Duration of correction in ms

  constructor(app, options) {
    this.app = app;
    this.config = shipTypes[options.style];
    this.init(options);
  }

  async init(options) {
    const { style, pos, isMirror = false, parent, camera, name } = options;
    const {
      size: { width, height },
    } = this.config;
    this.id = options.id;

    this.isMirror = isMirror;
    this.style = style;
    this.globalCamera = camera;
    this.world = options.world || { width: 200, height: 200 };
    this.pos = { x: pos.x, y: pos.y, d: pos.d };
    this.width = width;
    this.height = height;
    const shieldAlias = `shield_${this.config.shield.style}`;

    // Init shield sprite.
    const shield = new Sprite(shieldAlias);
    shield.anchor = 0.5;
    shield.width = 150;
    shield.height = 150;
    shield.alpha = 0;
    shield.position = { x: width / 2, y: height / 2 };
    this.shield = shield;

    // Everything goes in the container which is moved.
    this.container = new Container();
    this.container.addChild(shield);

    // Init ship sprite.
    this.setSprite(style);

    // Add name label to ship
    this.name = name;
    this.nameLabel = new Container();

    const back = new Graphics();
    back.rect(-2, -5, 100, 25);
    back.fill('#212121cc');

    this.shieldIndicator = new Graphics();
    this.updateShieldStatus({ amount: 100 });

    this.nameLabel.addChild(
      back,
      this.shieldIndicator,
      new Text({
        text: name,
        style: {
          fontFamily: 'Silkscreen',
          fontSize: 13,
          letterSpacing: -1,
          fill: getComputedStyle(document.body).getPropertyValue(
            '--text-color'
          ),
          align: 'left',
        },
      })
    );

    camera.getStage('labels').addChild(this.nameLabel);

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
    this.ticker = () => {
      this.tickerCallback();
    };
    this.app.ticker.add(this.ticker);

    this.onServerUpdatePos(pos);

    // Init callback.
    if (options.onInit) options.onInit();
  }

  setSprite(style) {
    const alias = `ship-${style}`;

    if (!this.sprite) {
      const ship = new Sprite(Texture.from(alias));
      ship.width = this.width;
      ship.height = this.height;
      this.sprite = ship;
      this.container.addChild(ship);
    } else {
      this.sprite.texture = Texture.from(alias);
      this.sprite.alpha = 0;
    }
  }

  updateShieldStatus({ amount }) {
    let color = 'green';

    if (amount <= 60) {
      color = 'orange';
    }

    if (amount <= 30) {
      color = 'red';
    }

    if (this.shieldIndicator) {
      this.shieldIndicator.clear();
      this.shieldIndicator.rect(-2, -5, amount, 5);
      this.shieldIndicator.fill(color);
    }
  }

  // Allow updating name and ship type.
  update({ name, style }) {
    this.name = name;
    this.nameLabel.children[2].text = name;
    this.style = style;
    this.config = shipTypes[style];
    this.setSprite(style);
    this.initThrusters();
  }

  fadeIn(speed = 20) {
    const fn = () => {
      this.sprite.alpha += speed / 1000;
      this.nameLabel.alpha = this.sprite.alpha;
      if (this.sprite.alpha > 1) {
        this.sprite.alpha = 1;
        this.app.ticker.remove(fn);
      }
    };
    this.app.ticker.add(fn);
  }

  tickerCallback() {
    // Glide between vector velocity length updates.
    if (this.container && !this.container.destroyed) {
      this.tickerUpdatePosition(this.app.ticker.deltaMS);
      this.manageMirror();
    }
  }

  tickerUpdatePosition(deltaTime) {
    if (this.correctionStartTime) {
      const elapsed = performance.now() - this.correctionStartTime;

      // If correction is complete or outside range, snap to the target position
      if (
        elapsed >= this.correctionDuration ||
        lineDistance(this.targetPos, this.pos) > 400
      ) {
        this.pos.x = this.targetPos.x;
        this.pos.y = this.targetPos.y;
        this.correctionStartTime = null;
      } else {
        // Interpolate position toward the target
        const t = elapsed / this.correctionDuration;
        this.pos.x += (this.targetPos.x - this.pos.x) * t;
        this.pos.y += (this.targetPos.y - this.pos.y) * t;
      }
    }

    // Predict movement based on velocity
    this.pos.x += this.velocity.x * deltaTime;
    this.pos.y -= this.velocity.y * deltaTime;

    // Actually set position of container.
    this.actuallyUpdatePos();
  }

  chunkParts() {
    const parts = 8;
    const timeout = 5000;
    const alias = `ship-${this.style}`;
    const texture = Texture.from(alias);
    let chunks = [];

    const arcWidth = 360 / parts;
    const half = this.width * 0.5;
    const chunkRadius = this.width * 0.8;

    // Turn a distance and angle into an x/y coordinate with 90 degree offset.
    const getC = (distance, angle, isY = false) =>
      distance *
      (isY ? Math.sin(degToRad(angle - 90)) : Math.cos(degToRad(angle - 90)));

    // Fully hide the ship and label.
    this.sprite.alpha = 0;
    this.nameLabel.alpha = 0;
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

    const fps = 120;
    const serverFps = 1000 / 60;

    const speed = 0.6;
    const rotation = [0.01, -0.1, 0.04, 0.09, -0.001, 0.1, -0.02, 0.015];
    const ticker = () => {
      chunks.forEach((chunk, index) => {
        chunk.updateTransform({
          x:
            chunk.x +
            getC(speed, arcWidth * index + arcWidth / 2) +
            this.velocity.x * ((1 / fps) * serverFps),
          y:
            chunk.y +
            getC(speed, arcWidth * index + arcWidth / 2, 1) +
            this.velocity.y * ((1 / fps) * serverFps),
          rotation: chunk.rotation + rotation[index],
        });
        chunk.alpha = chunk.alpha - 0.005;
      });
    };
    this.app.ticker.add(ticker);

    // Cleanup after timeout.
    setTimeout(() => {
      this.app.ticker.remove(ticker);
      chunks.forEach((sprite) => sprite.destroy());
      chunks = [];
    }, timeout);
  }

  destroy() {
    // Clean up ticker.
    this.app.ticker.remove(this.ticker);

    // Remove ship container.
    this.container.destroy();

    // Remove name label.
    this.nameLabel.destroy();

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
          camera: this.globalCamera,
          name: this.name,
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

  updateProjectile(update) {
    const { id, status } = update;

    switch (status) {
      case 'create':
        if (!this.projectiles[id]) {
          // Optionally play projectile sound.
          if (!update.noSound) {
            const config = projectileTypes[update.type];
            this.playSound(getRando(config.sounds.emission));
          }
          this.projectiles[id] = new PixiProjectile({
            ...update,
            app: this.app,
            parent: this.globalCamera.getStage('projectiles'),
          });
        }
        break;

      case 'move':
        this.projectiles[id].setPos(update.pos);
        break;

      case 'destroy':
        if (this.projectiles[id]) {
          this.projectiles[id].destroy();
          delete this.projectiles[id];
        }
        break;

      default:
        break;
    }
  }

  explode() {
    this.playSound('boom');

    new PixiEffect({
      app: this.app,
      type: 'explosion',
      parent: this.container,
      pos: { x: this.width / 2, y: this.height / 2 },
      active: true,
    });
    this.chunkParts();
    this.shockwave();
  }

  playSound(alias) {
    // TODO: Offset for sound world positon in relation to the viewport camera.
    // this.pos
    sound.play(alias);
  }

  // Play sound, show shield.
  hit({ weapon }) {
    const timeout = 300;
    this.shield.alpha = 1;

    const config = projectileTypes[weapon];
    if (config) {
      // Weapon specific hit sounds.
      this.playSound(getRando(config.sounds.reception));
    } else {
      // Default hit sounds.
      this.playSound(getRando(['hit1', 'hit2']));
    }

    // Add ticker for animation.
    const ticker = () => {
      this.shield.alpha = this.shield.alpha - 0.001;
      this.shield.width = this.shield.width * 0.985;
      this.shield.height = this.shield.width;
    };
    this.app.ticker.add(ticker);

    // Cleanup after timeout.
    setTimeout(() => {
      this.shield.alpha = 0;
      this.shield.width = 150;
      this.shield.height = 150;
      this.app.ticker.remove(ticker);
    }, timeout);
  }

  shockwave() {
    const timeout = 5000;
    const filterId = `${this.id}-wave`;

    // Create global GL filter around ship position.
    const wave = new ShockwaveFilter({
      center: this.globalCamera.toGlobalScreen(this.pos),

      // TODO: Apply global viewport scale.
      amplitude: 60,
      speed: 160,
      radius: 600,
    });
    this.globalCamera.addFilter(filterId, wave);

    // Animate Shockwave effect.
    const ticker = () => {
      wave.time = wave.time + 0.01;
      wave.amplitude = wave.amplitude * 0.98;
    };
    this.app.ticker.add(ticker);

    // Cleanup after timeout.
    setTimeout(() => {
      this.app.ticker.remove(ticker);
      this.globalCamera.removeFilter(filterId);
    }, timeout);
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

  destroyThusters() {
    if (this.emitters?.thrusters?.front?.length) {
      this.emitters.thrusters.front.forEach((emitter) => emitter.destroy());
    }

    if (this.emitters?.thrusters?.rear?.length) {
      this.emitters.thrusters.rear.forEach((emitter) => emitter.destroy());
    }
  }

  initThrusters() {
    this.destroyThusters();

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

  setNamePos({ x, y }) {
    // Set name label position
    if (this.nameLabel)
      this.nameLabel.updateTransform({
        x: x - this.width / 2,
        y: y - this.height / 2 - 20,
      });
  }

  onServerUpdatePos(pos) {
    this.targetPos = { x: pos.x, y: pos.y };
    this.pos.d = pos.d;
    if (pos.vel) this.setVel(pos.vel);
    this.correctionStartTime = performance.now();

    // Update status for thruster emitters.
    this.setThrust(pos.t);
  }

  actuallyUpdatePos() {
    if (!this.container) return;
    const pos = { x: this.pos.x, y: this.pos.y };

    this.container.updateTransform(pos);
    this.updateThrusterPositions();
    this.setNamePos(pos);

    // Set the camera position to follow this ship if its ID matches.
    const { followShip } = store.get(AppState);
    const { freelook } = store.get(UserSettings);
    if (!freelook && followShip == this.id) {
      this.globalCamera.setPos(pos);
    }

    this.container.rotation = degToRad(this.pos.d);
  }

  // Direct setter, only for puppets.
  setPos({ x, y, d }) {
    this.pos.x = x;
    this.pos.y = y;
    this.pos.d = d;
  }

  setVel({ x, y }) {
    this.velocity = { x, y };

    // I'm leaving this off for now, it actually needs to be set as
    // a function of speed relative to the viewport speed.
    // if (this.filters['motionblur']) {
    //   this.filters['motionblur'].velocity = {
    //     x: this.velocity.x * 1,
    //     y: this.velocity.y * 1,
    //   };
    // }
  }
}
