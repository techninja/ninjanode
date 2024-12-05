import { shipTypes } from 'data';
import { html, store } from 'hybrids';
import { UserSettings } from 'models';
import { getRandomName } from 'modules';

const selectShip = (ship) => (host) => {
  // If they don't have a name, give em one.
  let { name } = host;
  if (!name.trim()) name = getRandomName();

  // Store the new state
  store.set(UserSettings, { ship, name }).then(() => {
    // Directly set the index of the slide controller
    host.parentElement.parentElement.index = 1;
  });
};

export const NinjaSlideShips = {
  tag: 'ninja-slide-ships',
  name: () => store.get(UserSettings).name,

  render: () => html`
    <style>
      div.wrapper {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: 0.5em;
        max-height: 250px;
        overflow-y: scroll;
        padding: 3px;
      }

      @media (max-width: 530px) {
        div.wrapper {
          grid-template-columns: 1fr;
        }
      }

      ninja-icon {
        padding: 0.25em;
        border-radius: ${`${40 * 2}px`};
      }

      ninja-button {
        grid-gap: 0.5em;
      }

      ninja-button > div {
        display: grid;
        grid-template-columns: 40px 1fr;
      }

      h4 {
        margin: 0;
        font-family: 'Black Ops One', sans-serif;
      }

      b {
        text-indent: 0.5em;
        display: inline-block;
      }

      .ship-info {
        padding-left: 0.5em;
      }
    </style>
    <div class="wrapper">
      ${Object.entries(shipTypes).map(
        ([type, config]) => html`
          <ninja-button onclick=${selectShip(type)}>
            <div>
              <ninja-icon
                angle="45"
                name=${`ship-${type}`}
                size="40"
                style=${{ backgroundColor: config.shield.style }}
              ></ninja-icon>
              <div class="ship-info">
                <h4>${config.name}</h4>
                <b>Top Speed:</b> ${config.topSpeed}<br />
                <b>Accel Rate:</b> ${config.accelRate}<br />
              </div>
            </div>
          </ninja-button>
        `
      )}
    </div>
  `,
};
