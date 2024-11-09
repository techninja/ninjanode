/**
 * @file NinjaNode Pixi.js Render Library
 * Clientside abstraction to separate networking response logic from game rendering.
 */

// Assume PIXI global namespace.
// eslint-disable-next-line no-undef
const { Application } = PIXI;
import { PixiShip } from 'pixirender';

export class PixiRenderer {
  app;
  socket;

  // ID keyed object of ship render info and elements.
  ships = {};
  projectiles = {};
  powerUps = {};
  pnbits = {};

  constructor(options) {
    this.socket = options.socket;

    const canvas = document.getElementById(options.stageId);
    this.app = new Application();

    const pixiOpts = { canvas, resizeTo: window };
    this.app.init(pixiOpts).then(async () => {
      // window.ship = new PixiShip(this.app, {
      //   style: 'a',
      //   pos: { x: 150, y: 150, d: 0, t: 1 },
      // });

      this.bindUpdateEvents();
    });
  }

  onShipStatusUpdate(shipUpdates) {
    for (const id in shipUpdates) {
      const update = shipUpdates[id];
      const ship = this.ships[id];

      switch (update.status) {
        case 'create':
          this.ships[id] = new PixiShip(this.app, update);
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
