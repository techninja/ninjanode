import { store } from 'hybrids';

const { localStorage } = window;
const storageKey = 'UserSettings';
const observers = [];

/**
 * Observer for any change to user settings.
 *
 * Examples:
 * ---------------------------------
 * // Watch one key.
 * new UserSettingsObserver('mute', ({ mute }) => {
 *   console.log('mute changed to', mute)
 * });
 *
 * // Watch multiple keys.
 * new UserSettingsObserver('mute name', ({ mute, name }, changedKey) => {
 *   console.log(`${changedKey} changed`, { mute, name });
 * });
 *
 * // Watch any key.
 * new UserSettingsObserver('', (settings, changedKey) => {
 *   console.log('Any key changed', { settings, changedKey });
 * });
 *
 */
export class UserSettingsObserver {
  constructor(settingsKey = '', callback) {
    observers.push((newVals, oldVals) => {
      const keys = settingsKey.split(' ');
      const watchAll = settingsKey == '';
      let keyChanged = '';

      // Walk through all settings keys, if one is in in our passed keys
      // or watching all keys, check to see if it changed and store that.
      Object.keys(newVals).forEach((newValKey) => {
        if (newVals[newValKey] != oldVals?.[newValKey]) {
          if (watchAll) {
            keyChanged = newValKey;
          } else {
            if (keys.includes(newValKey)) {
              keyChanged = newValKey;
            }
          }
        }
      });

      // Only if a watched key changed (or watch all),
      // trigger callback with all values and changed key.
      if (keyChanged || watchAll) callback(newVals, keyChanged);
    });
  }
}

export const UserSettings = {
  ship: '',
  name: '',
  freelook: false,
  mute: false,
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
