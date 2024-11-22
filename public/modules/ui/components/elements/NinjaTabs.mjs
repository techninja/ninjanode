/**
 * @file Tab group element definition.
 */
import { html, children, dispatch } from 'hybrids';

// Function factory takes tab name and returns callback
// which can be added as event listener
function activate(name) {
  return (host) => {
    console.log('activate', name);

    // Set next active element by it's name
    host.activeItem = name;

    // After change custom event is dispatched
    // for the user of tab-group element
    dispatch(host, 'change', { detail: { name } });
  };
}

export const NinjaTabs = {
  tag: 'ninja-tabs',

  // Children defined in 'tab-item.js'
  items: children(({ tag }) => tag == 'ninja-tab'),

  // Sets and returns active item by name, which can be
  // used by the user of tab-group element
  activeItem: {
    value: '',
    connect: (host, key, invalidate) => {
      // get the current value
      const value = host[key];

      // return `disconnect` function
      return () => {
        // clean up
      };
    },
    observe: ({ items }, name) => {
      if (!name) name = items[0].name;
      console.log('Set value', { items, name });
      return items
        .filter((item) => (item.active = item.name === name))
        .map(({ name }) => name)[0];
    },
  },
  render: ({ items }) => html`
    <style>
      :host {
        display: block;
        position: relative;
        overflow: hidden;
      }
      nav {
        border-right: 3px dashed black;
        float: left;
        margin-right: 1em;
      }
      ul {
        list-style: none;
        padding: 0;
      }
      li.is-active {
        filter: invert(1);
      }
    </style>
    <nav class="tabs">
      <ul>
        ${items.map(({ text, active, icon, name }) =>
          html`
            <li class=${active ? 'is-active' : ''} onclick="${activate(name)}">
              <ninja-button icon=${icon} solid=${active} title=${text}>
                ${text}
              </ninja-button>
            </li>
          `.key(name)
        )}
      </ul>
    </nav>

    <slot></slot>
  `,
};
