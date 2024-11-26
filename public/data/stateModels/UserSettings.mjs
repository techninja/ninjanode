import { store } from 'hybrids';

const { localStorage } = window;
const storageKey = 'UserSettings';

export const UserSettings = {
  ship: '',
  name: '',
  freelook: false,

  // Standard local storage store.
  [store.connect]: {
    get: () => JSON.parse(localStorage.getItem(storageKey) || '{}'),
    set: (id, values) => {
      localStorage.setItem(storageKey, JSON.stringify(values));
      return values;
    },
  },
};
