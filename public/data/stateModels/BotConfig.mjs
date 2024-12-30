import { store } from 'hybrids';

// const storageKey = 'BotConfig';

export const BotConfig = {
  id: true,
  ship: 'a',
  name: '',
  alignment: 'foe',
  attitude: 3,
  difficulty: 0.5,

  // TODO: This doesn't work, but should.
  // [store.connect]: {
  //   list: () => {
  //     const vals = Object.values(
  //       JSON.parse(localStorage.getItem(storageKey) || '{}')
  //     );
  //     console.log('Listing...', vals);
  //     return vals;
  //   },
  //   get: (id) => {
  //     const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
  //     return data[id];
  //   },
  //   set: (id, values) => {
  //     const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
  //     // Null means delete the entry.
  //     if (!values) {
  //       delete data[id];
  //     } else if (data[values.id]) {
  //       // Existing entry, fold in new values.
  //       data[values.id] = { ...data[values.id], ...values };
  //     } else {
  //       // Set new value entry.
  //       data[values.id] = values;
  //     }
  //     localStorage.setItem(storageKey, JSON.stringify(data));
  //     console.log('Setting', { values });
  //     return values;
  //   },
  // },
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
