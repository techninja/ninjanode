/**
 * @file NinjaNode Pixi Input Library
 * Clientside abstraction to separate networking response logic from input.
 */

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
    const window = this.get({ id: 'main-window' });

    // Bind to the global keyup & keydown events.
    this.docBind('keyup keydown', ({ type, which }) => {
      // Window keypress, toggle visibility.
      if (type == 'keyup' && which == this.keys.w) {
        window.hidden = !window.hidden;
      }
    });
  }

  docBind(binds, cb) {
    binds.split(' ').forEach((bind) => {
      document.addEventListener(bind, cb);
    });
  }

  get({ id, className, type }) {
    if (id) {
      return document.getElementById(id);
    }

    if (className) {
      return document.getElementsByClassName(className);
    }

    if (type) {
      return document.getElementsByTagName(type)[0];
    }
  }
}
