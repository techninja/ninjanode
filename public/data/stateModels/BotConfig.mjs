import { store } from 'hybrids';
import { connectLocalStorage } from 'models';

export const BotConfig = {
  id: true,
  ship: 'a',
  name: '',
  alignment: 'foe',
  attitude: 3,
  difficulty: 0.5,

  [store.connect]: connectLocalStorage('BotConfig'),
};

// Externalize for debugging.
// window.store = store;
// window.BotConfig = BotConfig;

export const getBot = (id) => {
  const bot = store.get(BotConfig, id);

  return store.ready(bot) ? bot : null;
};

export const removeBot = (id) => {
  const bot = getBot(id);

  // Delete the value in storage.
  if (bot) {
    store.set(bot, null);
  }
};

export const storeBot = (id, bot) => {
  store.set(getBot(id) || BotConfig, bot);
};
