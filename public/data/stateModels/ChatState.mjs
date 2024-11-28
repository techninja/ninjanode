import { store } from 'hybrids';
const observers = [];

export class ChatStateObserver {
  constructor(settingsKey, callback) {
    observers.push((newVals, oldVals) => {
      if (newVals[settingsKey] != oldVals?.[settingsKey]) {
        callback(newVals);
      }
    });
  }
}

let memoryStore = {};

export const ChatState = {
  messages: [{ type: 'system', message: 'Welcome to ninjanode!' }],
  newMessage: '',

  [store.connect]: {
    get: () => memoryStore,
    set: (id, values) => {
      memoryStore = values;
      return values;
    },
    observe: (id, newVals, oldVals) => {
      observers.forEach((observer) => observer(newVals, oldVals));
    },
  },
};
