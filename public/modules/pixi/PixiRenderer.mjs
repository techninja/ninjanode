/**
 * @file NinjaNode Pixi.js Render Library
 * Clientside abstraction to separate networking response logic from game rendering.
 */
import { store } from 'hybrids';
import {
  UserSettings,
  UserSettingsObserver,
  AppState,
  ChatStateObserver,
  ChatState,
  storeUser,
  removeUser,
} from 'models';
import { PixiShip, PixiCamera } from 'pixirender';
import { manifest } from 'manifest';

// Assume PIXI global namespace.
// eslint-disable-next-line no-undef
const { Application, TilingSprite, Texture, Assets } = PIXI;

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
      // DEBUG: Lock framerate.
      // this.app.ticker.maxFPS = 30;

      // Load all manifest assets in background.
      // TODO: Add visual loader for slow connections.
      await Assets.init({ manifest });
      await Assets.loadBundle(['graphics', 'sounds']);

      // Setup camera and stage where layer containers are held and then added to.
      this.camera = new PixiCamera({
        app: this.app,
        playArea: this.gameConfig.playArea,
        layers: ['labels', 'ships', 'projectiles', 'background'],
      });

      // TODO: Where should this live?
      // Bind to freelook user setting to set viewport state.
      new UserSettingsObserver('freelook', ({ freelook }) => {
        if (!freelook) {
          this.setFollow(true);
        } else {
          store.set(AppState, { followShip: '' });
        }
      });

      this.stage = { ...this.camera.layers, base: this.camera.viewport };

      // Add ship getter helper
      this.ships.get = (index = 0) => Object.values(this.ships)[index + 1];

      // Bind to socket events to start rendering the game.
      this.bindUpdateEvents();

      // Setup the background.
      this.initBackground();

      // Setup chat.
      this.initChat();

      // Minimum for creating a ship object.
      // window.ship = new PixiShip(this.app, {
      //   style: 'a',
      //   pos: { x: 150, y: 150, d: 0, t: 1 },
      // });
    });
  }

  initChat() {
    // Whenever a user submits a new message, send it.
    new ChatStateObserver('newMessage', ({ newMessage }) => {
      this.socket.sendChat(newMessage);
    });
  }

  /**
   * Render a message for dispay to the user.
   *
   * @param {*} data
   * @returns
   */
  renderMessage(data) {
    if (!this.ships[data.id]) return false;
    const nameSource = this.ships[data.id].name;

    let type = 'chat';
    let nameTarget = '';

    // Set the name of the target in the message to the sip, if it's available
    if (data.target && this.ships[data.target]) {
      nameTarget = this.ships[data.target].name;
    } else {
      // Otherwise, use it as a literal
      nameTarget = data.target;
    }

    const sysMsgActions = {
      join: `${nameSource} joined the game`,
      disconnect: `${nameSource} disconnected`,
      projectile: `${nameSource} made ${nameTarget} explode`,
      collision: `${nameSource} slammed into ${nameTarget}`,
      pnbcollision: `${nameSource} crashed into ${nameTarget}`,
    };

    if (data.type == 'system') {
      type = 'system';
      data.msg = sysMsgActions[data.action];
    } else if (data.type == 'chat') {
      data.msg = nameSource + ': ' + data.msg;
      if (data.id == this.socket.id) {
        type = 'self';
      }
    }

    return { type, message: data.msg };
  }

  /**
   * Socket chat/system message callback handler.
   *
   * @param {*} payload
   */
  onMessage(payload) {
    const { messages } = store.get(ChatState);
    const newMessage = this.renderMessage(payload);

    if (newMessage) {
      store.set(ChatState, {
        messages: [...messages, newMessage],
      });
    }
  }

  setFollow(force = false) {
    const { joined } = store.get(AppState);
    const { freelook } = store.get(UserSettings);

    // Ignore this if freelook is on or not joined.
    if ((!freelook || force) && joined) {
      store.set(AppState, { followShip: this.socket.id });
      this.camera.setZoom(1);
    }
  }

  onShipStatusUpdate(shipUpdates) {
    for (const id in shipUpdates) {
      const update = shipUpdates[id];
      const ship = this.ships[id];

      switch (update.status) {
        case 'create':
          if (ship) {
            // Update a player if their name or style is different than existing.
            if (ship.name != update.name || ship.style != update.style) {
              ship.update(update);
              storeUser(id, update);
            }

            // Ignore already created ships from here.
            continue;
          }

          // Store the user data in state.
          storeUser(id, update);

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
                this.setFollow();
              }
            },
          });

          break;

        case 'hit':
          ship.hit(update);

          // If someone exploded, we've got to update the scores!
          if (update.scores) {
            for (const socketId in update.scores) {
              const score = update.scores[socketId];
              storeUser(socketId, { score });
            }
          }
          break;

        case 'boom':
          switch (update.stage) {
            case 'start':
              storeUser(id, { exploding: true });
              ship.explode();
              break;

            case 'middle':
              // TODO: Hide label, etc.
              break;

            default:
              // Complete, respawn.
              // TODO: Server still sends this for destroyed ships!
              if (ship) {
                ship.fadeIn();
                storeUser(id, { exploding: false });
              }
              break;
          }
          break;

        case 'destroy':
          removeUser(id);
          delete this.ships[id];
          this.camera.unfollow(id);
          ship?.destroy();
          break;

        case 'shield':
          ship.updateShieldStatus(update);
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
        texture: Texture.from('stars'),
        width: worldWidth,
        height: worldHeight,
      }),
      new TilingSprite({
        texture: Texture.from('starfield'),
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
      storeUser(id, { pos: { x: pos.x, y: pos.y, d: pos.d } });
      this.ships[id].onServerUpdatePos(pos);
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
      chat: this.onMessage,
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
