import { html, store } from 'hybrids';
import { BotConfig } from 'models';
import { getRando } from 'utils';
import { shipTypes } from 'data';
import { getBotName } from 'bots';

const MAX_BOTS = 2;

const addBot = (host) => {
  // Don't add anything if we're at max.
  if (host.bots.length >= MAX_BOTS) return;

  const newBot = {
    ship: getRando(Object.keys(shipTypes)),
    name: getBotName(),
    alignment: 'foe',
    attitude: 1,
    difficulty: 0.5,
    enabled: false,
    socketId: '',
  };

  store.set(BotConfig, newBot);
};

// TODO:
// - Randomize Button
// - Missing referenced bot features
// - Persistant bot config state

export const NinjaBots = {
  tag: 'ninja-bots',
  bots: store([BotConfig]),
  botMax: ({ bots }) => bots.length == MAX_BOTS,

  render: ({ bots, botMax }) => html`
    <style>
      :host {
        color: var(--button-text);
      }

      .wrapper {
        display: grid;
        grid-template-columns: 1fr 50px;
        height: 310px;
      }
      .bots {
        display: flex;
        overflow-x: scroll;
        overflow-y: hidden;
      }

      .bots::-webkit-scrollbar {
        width: var(--sb-size);
      }

      .bots::-webkit-scrollbar-track {
        background: var(--sb-track-color);
        border-radius: 3px;
      }

      .bots::-webkit-scrollbar-thumb {
        background: var(--sb-thumb-color);
        border-radius: 3px;
      }

      @supports not selector(::-webkit-scrollbar) {
        .bots {
          scrollbar-color: var(--sb-thumb-color) var(--sb-track-color);
        }
      }

      .bots ninja-bot {
        margin: 2px 4px 2px 2px;
        box-shadow:
          -2px 0 0 0 var(--border-color),
          2px 0 0 0 var(--border-color),
          0 -2px 0 0 var(--border-color),
          0 2px 0 0 var(--border-color);
      }
    </style>
    <div class="wrapper">
      <div class="bots">
        ${bots.map((bot) => html`<ninja-bot bot=${bot}></ninja-bot>`)}
      </div>
      <ninja-button
        icon="plus"
        angle=${botMax ? 45 : 0}
        solid
        disabled=${botMax ? true : false}
        text=${botMax ? `Max ${MAX_BOTS}` : 'Add Bot'}
        desc=${botMax ? 'Remove a bot to add' : 'Add a new bot'}
        onclick=${addBot}
      ></ninja-button>
    </div>
  `,
};
