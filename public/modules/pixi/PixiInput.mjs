/**
 * @file NinjaNode Pixi Input Library
 * Clientside abstraction to separate networking response logic from input.
 */

import { store } from 'hybrids';
import { AppState } from 'models';

const defaultKeyBindings = {
  l: 37, // Left
  u: 38, // Up
  r: 39, // Right
  d: 40, // Down
  f: 32, // Primary Fire (space)
  s: 77, // Secondary Fire (m)
  b: 83, // Set Spawn Beacon (s)
  w: 27, // Open/Close main window
};

export class PixiInput {
  renderer;
  socket;
  keys = defaultKeyBindings;
  mousedown = 0;
  lastKey = '';

  constructor({ renderer, socket }) {
    this.renderer = renderer;
    this.socket = socket;
    this.initializeKeyBindings();
  }

  initializeKeyBindings() {
    // Bind to the global keyup & keydown events.
    this.docBind('keyup keydown', (e) => {
      const { type, which } = e;
      const state = store.get(AppState);

      // Window keypress, toggle visibility via global state.
      if (type == 'keyup' && which == this.keys.w) {
        store.set(AppState, { windowVisible: !state.windowVisible });
      }

      // If not chatting, move through
      if (!state.chatVisible) {
        const actionCode = this.getKey(which);
        if (actionCode) {
          const action = `${actionCode}${type}`;

          // Filter out held down key repeats
          if (this.lastKey != action) {
            this.lastKey = action;
            this.socket.key(e, actionCode);
          }
          return false;
        }
      }
    });
  }

  /**
   * Return the action code for a given char code if any.
   * @param {*} charCode
   */
  getKey(charCode) {
    const index = Object.values(this.keys).findIndex(
      (ascii) => ascii === charCode
    );
    return Object.keys(this.keys)?.[index];
  }

  docBind(binds, cb) {
    binds.split(' ').forEach((bind) => {
      document.addEventListener(bind, cb);
    });
  }

  // get({ id, className, type }) {
  //   if (id) {
  //     return document.getElementById(id);
  //   }

  //   if (className) {
  //     return document.getElementsByClassName(className);
  //   }

  //   if (type) {
  //     return document.getElementsByTagName(type)[0];
  //   }
  // }
}
