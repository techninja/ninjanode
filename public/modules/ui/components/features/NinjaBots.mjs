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
        height: 280px;
      }
      .bots {
        overflow-x: scroll;
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
