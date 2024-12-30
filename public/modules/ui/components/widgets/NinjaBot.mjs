import { html, store } from 'hybrids';
import {
  storeBot,
  removeBot,
  BotConfig,
  getConnectedBot,
  storeConnectedBot,
  removeConnectedBot,
} from 'models';
import { shipTypes } from 'data';
import { ShipSocket } from 'modules';
import { BotController } from 'bots';

// Local Bot config ID key => controllers for connected bots.
const controllers = {};

const toggleLaunch = ({ bot, connectedState }) => {
  // Not connected? Connect!
  if (!connectedState?.socketId) {
    connectBot(bot);
  } else {
    // Only disconnect if we have a local bot controller.
    if (controllers[bot.id]) {
      controllers[bot.id].disconnect();
    }
  }
};

const connectBot = (bot) => {
  const socket = new ShipSocket();
  const controller = new BotController({
    socket,
    name: `🤖 ${bot.name}`,
    style: bot.ship,
  });

  controllers[bot.id] = controller;
  socket.socket.on('connect', () => {
    // Add socket ID once connected.
    storeConnectedBot(bot.id, {
      socketId: socket.socket.id,
    });
  });

  socket.socket.on('disconnect', () => {
    // Remove the socket id in connected bot store.
    removeConnectedBot(bot.id);
    delete controllers[bot.id];
  });
};

const updateState =
  (update) =>
  ({ nameInput, attitudeInput, difficultyInput, bot }) => {
    // Pull name value from input.
    if (update.name) {
      update.name = nameInput.value;
    }

    // Pull attitude input dropdown to int.
    if (update.attitude) {
      update.attitude = parseInt(attitudeInput.value, 10);
    }

    // Pull difficulty input slider.
    if (update.difficulty) {
      update.difficulty = parseFloat(difficultyInput.value, 10);
    }

    storeBot(bot.id, update);
  };

const trashBot = ({ bot: { id } }) => {
  removeBot(id);
};

const swapShip =
  (direction) =>
  ({ bot: { id, ship } }) => {
    const keys = Object.keys(shipTypes);
    let index = keys.findIndex((a) => a === ship) + direction;

    // Assume valid key.
    let finalKey = keys[index];
    if (index < 0) {
      // Off the bottom, wrap to top.
      finalKey = keys[keys.length - 1];
    } else if (index >= keys.length) {
      // Off the top, wrap to bottom.
      finalKey = keys[0];
    }

    // Actually set the new ship key.
    storeBot(id, { ship: finalKey });
  };

export const NinjaBot = {
  tag: 'ninja-bot',
  bot: store(BotConfig),
  connectedState: ({ bot }) => getConnectedBot(bot.id),

  // Programmatic attributes: just lookup from other attributes.
  config: ({ bot }) => shipTypes[store.ready(bot) ? bot.ship : 'a'],
  isLaunched: ({ connectedState }) => !!connectedState?.socketId,

  // Render Input lookups, for reading the DOM input elements.
  nameInput: ({ render }) => render().querySelector('input#name'),
  attitudeInput: ({ render }) => render().querySelector('select#attitude'),
  difficultyInput: ({ render }) => render().querySelector('input#difficulty'),

  render: ({ bot, config, isLaunched }) =>
    store.ready(bot)
      ? html`
          <style>
            :host {
              display: inline-block;
            }
            .bot {
              border: 1px solid green;
              padding: 10px;
              max-width: 200px;
              display: grid;
              grid-template-columns: 1fr;
              grid-gap: 7px;
            }

            .bot .ship {
              background-color: ${config.shield.style};
              border-radius: 60px;
            }

            header {
              display: grid;
              grid-template-columns: 60px 1fr 30px;
              grid-template-rows: 40px 1fr;
            }

            header span {
              display: block;
              text-align: center;
            }

            .scroller {
              display: flex;
              visibility: ${isLaunched ? 'hidden' : 'visible'};
              z-index: 2;
              justify-content: space-between;
            }
          </style>
          <div class="bot">
            <header>
              <ninja-icon
                class="ship"
                name="ship-${bot.ship}"
                size="55"
                angle="45"
              ></ninja-icon>
              <div class="meters">
                <ninja-meter
                  ratio=${config.stats.highlights.worst.ratio}
                  flipped=${config.stats.highlights.worst.flipped}
                  label=${config.stats.highlights.worst.label}
                ></ninja-meter>
                <ninja-meter
                  ratio=${config.stats.highlights.best.ratio}
                  flipped=${config.stats.highlights.best.flipped}
                  label=${config.stats.highlights.best.label}
                ></ninja-meter>
                <span>${config.name}</span>
              </div>
              <ninja-button
                icon="trash"
                size="20"
                desc="Remove Bot"
                onclick=${trashBot}
                disabled=${isLaunched}
              ></ninja-button>
              <div class="scroller">
                <ninja-button
                  solid
                  border-size="0"
                  size="15"
                  icon="chevron-up"
                  title="Previous Ship"
                  onclick=${swapShip(-1)}
                ></ninja-button>
                <ninja-button
                  solid
                  size="15"
                  border-size="0"
                  icon="chevron-down"
                  title="Next Ship"
                  onclick=${swapShip(1)}
                ></ninja-button>
              </div>
            </header>
            <div>
              <label for="name">🤖</label>
              <input
                type="text"
                name="name"
                id="name"
                disabled=${isLaunched}
                value=${bot.name}
                onchange=${updateState({ name: true })}
              />
            </div>
            <ninja-toggle
              is-on=${bot.alignment == 'foe'}
              disabled=${isLaunched}
              on-title="Foe"
              off-title="Friend"
              on-icon="hockey-mask"
              font-size="23"
              size="28"
              off-icon="users"
              onchange=${updateState({
                alignment: bot.alignment == 'foe' ? 'friend' : 'foe',
              })}
              full-width
            ></ninja-toggle>
            <div>
              <label>Attitude</label>
              <select
                id="attitude"
                disabled=${isLaunched}
                onchange=${updateState({ attitude: true })}
              >
                <option value="0" selected=${bot.attitude == 0}>
                  In yo' face
                </option>
                <option value="1" selected=${bot.attitude == 1}>
                  Stepped down
                </option>
                <option value="2" selected=${bot.attitude == 2}>
                  Almost Polite
                </option>
                <option value="3" selected=${bot.attitude == 3}>
                  Reserved
                </option>
                <option value="4" selected=${bot.attitude == 4}>Quiet</option>
              </select>
            </div>

            <div>
              <label for="difficulty">Difficulty</label>
              <input
                name="difficulty"
                id="difficulty"
                disabled=${isLaunched}
                type="range"
                min="0"
                step="0.1"
                max="1"
                value=${bot.difficulty}
                onchange=${updateState({ difficulty: true })}
              />
            </div>

            <ninja-toggle
              is-on=${isLaunched}
              off-title="Launch Bot"
              on-title="Disconnect Bot"
              off-icon="external-link"
              on-icon="times-circle"
              full-width
              onchange=${toggleLaunch}
            ></ninja-toggle>
          </div>
        `
      : html`Loading...`,
};
