/**
 * @file NinjaNode Pixi.js Render Library
 * Clientside abstraction to separate networking response logic from game rendering.
 */

// Assume PIXI global namespace.
// eslint-disable-next-line no-undef
const { Application, Assets, TilingSprite } = PIXI;
import { PixiShip, PixiCamera } from 'pixirender';

export class PixiRenderer {
  app;
  socket;
  camera;
  stage = {};
  background;

  // ID keyed object of ship render info and elements.
  ships = {};
  projectiles = {};
  powerUps = {};
  pnbits = {};
  gameConfig = {};
  world = {};

  constructor(options) {
    this.socket = options.socket;
    this.gameConfig = options.gameConfig;
    this.world = {
      width: this.gameConfig.playArea,
      height: this.gameConfig.playArea,
    };

    const canvas = document.getElementById(options.stageId);
    this.app = new Application();

    const pixiOpts = { canvas, resizeTo: window };
    this.app.init(pixiOpts).then(async () => {
      // Setup camera and stage where layer containers are held and then added to.
      this.camera = new PixiCamera({
        app: this.app,
        playArea: this.gameConfig.playArea,
        layers: ['ships', 'projectiles', 'background'],
      });

      this.stage = { ...this.camera.layers, base: this.camera.viewport };

      // Add ship getter helper
      this.ships.get = (index = 0) => Object.values(this.ships)[index + 1];

      // Bind to socket events to start rendering the game.
      this.bindUpdateEvents();

      // Setup the background.
      this.initBackground();

      // Minimum for creating a ship object.
      // window.ship = new PixiShip(this.app, {
      //   style: 'a',
      //   pos: { x: 150, y: 150, d: 0, t: 1 },
      // });
    });
  }

  onShipStatusUpdate(shipUpdates) {
    for (const id in shipUpdates) {
      const update = shipUpdates[id];
      const ship = this.ships[id];

      switch (update.status) {
        case 'create':
          // Ignore already created ships.
          if (ship) continue;

          // Create ship.
          this.ships[id] = new PixiShip(this.app, {
            id,
            parent: this.stage.ships,
            camera: this.camera,
            world: this.world,
            blur: this.socket.id !== id,
            ...update,
            onInit: () => {
              // Follow us when we join.
              if (this.socket.id == id) {
                this.camera.follow(this.ships[id]);
                this.camera.setZoom(1);
              }
            },
          });

          break;

        case 'boom':
          switch (update.stage) {
            case 'start':
              ship.explode();
              break;

            case 'middle':
              // TODO: Hide label, etc.
              break;

            default:
              // Complete, respawn.
              ship.fadeIn();
              break;
          }
          break;

        case 'destroy':
          delete this.ships[id];
          this.camera.unfollow(id);
          ship?.destroy();
          break;

        default:
          break;
      }
    }
  }

  async initBackground() {
    // Load the tile texture
    const { worldWidth, worldHeight } = this.stage.base;

    const layers = [
      new TilingSprite({
        texture: await Assets.load('/resources/graphics/grid.png'),
        width: worldWidth,
        height: worldHeight,
      }),
      new TilingSprite({
        texture: await Assets.load('/resources/graphics/starfield.png'),
        width: worldWidth,
        height: worldHeight,
        scale: 2,
      }),
    ];

    this.background = {
      container: this.stage.background,
      layers,
    };

    this.stage.background.addChild(layers[0]);
    this.stage.background.addChild(layers[1]);

    this.app.ticker.add(() => {
      layers[1].tilePosition = {
        x: -this.stage.base.center.x / 9,
        y: -this.stage.base.center.y / 9,
      };
    });
  }

  onUpdateShipPos(posUpdates) {
    Object.entries(posUpdates).forEach(([id, pos]) => {
      this.ships[id].setPos(pos);
    });
  }

  onProjectileStatusUpdate(projectiles) {
    for (const id in projectiles) {
      const proj = projectiles[id];
      if (this.ships[proj.shipId]) {
        this.ships[proj.shipId].updateProjectile({ ...proj, id });
      }
    }
  }

  onUpdateProjectilePos(projectiles) {
    for (const id in projectiles) {
      const shipId = id.slice(0, -7);
      const pos = projectiles[id];
      if (this.ships[shipId]) {
        this.ships[shipId].updateProjectile({ status: 'move', pos, id });
      }
    }
  }

  bindUpdateEvents() {
    const binds = {
      chat: console.log,
      pos: this.onUpdateShipPos,
      shipstat: this.onShipStatusUpdate,
      // shipbeaconstat: this.onBeaconsStatusUpdate,
      projstat: this.onProjectileStatusUpdate,
      projpos: this.onUpdateProjectilePos,
      // powerupstat: this.onPowerUpStatusUpdate,
      // pnbitsstat: this.onPnbitsStatusUpdate,
      disconnect: () => console.log('Disconnected!'),
    };

    this.bindSocketEvents(binds);
  }

  bindSocketEvents(binds) {
    Object.entries(binds).forEach(([key, callback]) => {
      this.socket.socket.on(key, (d) => {
        callback.call(this, d);
      });
    });
  }
}
