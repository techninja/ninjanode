import { shipTypes } from 'data';
import { html, store, dispatch } from 'hybrids';
import { UserSettings, AppState } from 'models';

const join = (host) => {
  const settings = store.get(UserSettings);
  const sliderParent = host.parentElement.parentElement;

  // Directly set the index of the slide controller
  sliderParent.index = 2;

  // Dispatch the join event.
  dispatch(sliderParent, 'join', { detail: settings });

  // Set window and joined app states.
  store.set(AppState, { windowVisible: false, joined: true });
};

const changeName = (host, { target }) => {
  store.set(UserSettings, { name: target.value });
};

const back = (host) => {
  host.parentElement.parentElement.index = 0;
};

export const NinjaSlideJoin = {
  tag: 'ninja-slide-join',
  ship: () => store.get(UserSettings).ship,
  name: () => store.get(UserSettings).name,
  render: ({ ship, name }) =>
    ship
      ? html`
          <style>
            ninja-icon {
              background-color: ${shipTypes[ship].shield.style};
              border-radius: 100px;
              float: right;
            }
            ninja-button.back {
              float: left;
              /* position: absolute;
              left: -10px;
              top: -10px; */
            }
            h2 {
              margin: 0;
              font-family: 'Black Ops One', sans-serif;
              text-transform: lowercase;
            }
            div.wrapper {
              /* position: relative; */
            }
          </style>
          <div class="wrapper">
            <ninja-icon
              angle="-45"
              size="72"
              name=${`ship-${ship}`}
            ></ninja-icon>
            <ninja-button
              class="back"
              size="45"
              icon="arrow-alt-circle-left"
              onclick=${back}
            ></ninja-button>
            <div class="ship-info">
              <h2>${shipTypes[ship].name}</h2>
            </div>
            <label for="name">Nickname:</label
            ><input
              type="text"
              value=${name}
              id="name"
              placeholder="Enter a name here"
              onchange=${changeName}
            />
            <ninja-button icon="check-circle" solid onclick=${join}
              >Join the Fun</ninja-button
            >
          </div>
        `
      : html`<span>Select a valid Ship</span>`,
};
