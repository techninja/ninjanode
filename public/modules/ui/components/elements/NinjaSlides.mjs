/**
 * @file Slide group element definition.
 */
import { html, children, dispatch } from 'hybrids';

function getIndex(host, name) {
  let index = -1;
  let home = 0;

  let i = 0;
  for (const slide of host.children) {
    if (slide.name === host.home) home = i;
    if (slide.name === name) index = i;
    i++;
  }

  // Default to home if none found.
  if (index === -1) index = home;

  return index;
}

/**
 * Factory for managing host item change/value, takes name, changes what's selected.
 *
 * @param {string} [defaultItem='']
 *   Hash value from hybrids factory handler.
 *
 * @returns {hybrids factory}
 */
function itemChangeFactory() {
  return {
    observe: (host, value) => {
      const index = getIndex(host, value);

      // Actually set the index based on the name (if we have a value/home).
      if (value && host.home) {
        host.index = index;
        console.log('Active change:', value, index, host.home, host.index);
      }

      // Dispatch the change up from the host.
      dispatch(host, 'change', { detail: { name: host.children[index].name } });
      return host.children[index].name;
    },
    connect: (host) => {
      const activeItemIndex = host.items.findIndex(({ active }) => active) || 0;
      host.activeItem = host.items[activeItemIndex].name;
      host.index = activeItemIndex;
    },
    value: '',
  };
}

export const NinjaSlides = {
  tag: 'ninja-slides',
  items: children(({ tag }) => tag == 'ninja-slide'),
  height: 100,
  width: 100,
  initialized: false,
  unit: '%', // Any CSS unit is allowed. Defaults here.

  // Sets and returns active item by name
  activeItem: itemChangeFactory(),
  home: '',
  index: 0,

  render: ({ height, width, unit, items, index }) => html`
    <style>
      :host {
        display: block;
        position: relative;
        overflow: hidden;
      }
      .slide-wrapper {
        width: ${`${width}${unit}`};
        border: 1px solid red;
        overflow: hidden;
      }
      .slides {
        height: ${height}px;
        display: grid;
        width: ${`${items.length * width}${unit}`};
        grid-template-columns: repeat(${items.length}, 1fr);
        transition: margin-left 0.5s ease;
        margin-left: ${`-${index * width}${unit}`};
      }
    </style>
    <div class="slide-wrapper">
      <div class="slides is-boxed">
        <slot></slot>
      </div>
    </div>
  `,
};
