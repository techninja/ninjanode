import { store } from 'hybrids';

const { localStorage } = window;
const storageKey = 'UserSettings';
const observers = [];

export class UserSettingsObserver {
  constructor(settingsKey, callback) {
    observers.push((newVals, oldVals) => {
      if (newVals[settingsKey] != oldVals?.[settingsKey]) {
        callback(newVals);
      }
    });
  }
}

export const UserSettings = {
  ship: '',
  name: '',
  freelook: false,
  mouseControls: true,

  // Standard local storage store.
  [store.connect]: {
    get: () => JSON.parse(localStorage.getItem(storageKey) || '{}'),
    set: (id, values) => {
      localStorage.setItem(storageKey, JSON.stringify(values));
      return values;
    },
    observe: (id, newVals, oldVals) => {
      observers.forEach((observer) => observer(newVals, oldVals));
    },
  },
};
