/**
 * @file NinjaNode Pixi.js Render Library
 * Clientside abstraction to separate networking response logic from game rendering.
 */

// Assume PIXI global namespace.
// eslint-disable-next-line no-undef
const { Application, Container, Assets, TilingSprite } = PIXI;
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

  constructor(options) {
    this.socket = options.socket;

    const canvas = document.getElementById(options.stageId);
    this.app = new Application();

    const pixiOpts = { canvas, resizeTo: window };
    this.app.init(pixiOpts).then(async () => {
      // Before anything else, create a container for ships and bind events.
      // If you take too long to do this, you will miss initial ship data.
      this.stage.ships = new Container();
      this.bindUpdateEvents();

      // Setup camera and stage where layer containers are held and then added to.
      this.gameConfig = await (await fetch('/game')).json();
      this.camera = new PixiCamera(this.app, this.gameConfig);
      this.stage.base = this.camera.getStage();

      // Layers (including ships)
      this.stage.background = new Container();

      // Add the working stage "layers" to the base stage.
      this.stage.base.addChild(this.stage.background);
      this.stage.base.addChild(this.stage.ships);

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
          this.ships[id] = new PixiShip(this.app, {
            parent: this.stage.ships,
            ...update,
            onInit: () => {
              this.camera.follow(this.ships[id].container);
              this.camera.setZoom(1);
            },
          });

          break;

        case 'boom':
          switch (update.stage) {
            case 'start':
              ship.explode();
              console.log('BOOM', id, ship.pos);
              break;

            default:
              break;
          }

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

  bindUpdateEvents() {
    const binds = {
      chat: console.log,
      pos: this.onUpdateShipPos,
      shipstat: this.onShipStatusUpdate,
      // shipbeaconstat: this.onBeaconsStatusUpdate,
      // projstat: this.onProjectileStatusUpdate,
      // projpos: this.updateProjectilePos,
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
