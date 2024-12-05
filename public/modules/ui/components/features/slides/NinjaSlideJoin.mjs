import { shipTypes } from 'data';
import { html, store, dispatch } from 'hybrids';
import { UserSettings, AppState } from 'models';
import { getRandomName } from 'modules';

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
  store.set(UserSettings, { name: target.value.trim() || getRandomName() });
};

const back = (host) => {
  host.parentElement.parentElement.index = 0;
};

const randomName = () => {
  store.set(UserSettings, { name: getRandomName() });
};

export const NinjaSlideJoin = {
  tag: 'ninja-slide-join',
  ship: () => store.get(UserSettings).ship,
  name: () => store.get(UserSettings).name,
  render: ({ ship, name }) =>
    ship
      ? html`
          <style>
            ninja-icon.ship {
              background-color: ${shipTypes[ship].shield.style};
              border-radius: 100px;
              float: right;
            }
            h2 {
              margin: 0;
              font-family: 'Black Ops One', sans-serif;
              text-transform: lowercase;
            }
            div.wrapper {
              display: grid;
              grid-gap: 8px;
            }
            .ship-info {
              display: grid;
              height: 170px;
              box-shadow:
                -2px 0 0 0 black,
                2px 0 0 0 black,
                0 -2px 0 0 black,
                0 2px 0 0 black;
              grid-template-columns: 45px auto 76px;
              grid-gap: 10px;
              grid-template-rows: 41px auto;
              padding: 5px;
            }
            footer {
              display: grid;
              grid-gap: 10px;
              grid-template-columns: auto 40px 145px;
              position: relative;
            }
            label {
              position: absolute;
              color: gray;
              bottom: 12px;
              right: 221px;
            }
            input {
              box-shadow:
                -2px 0 0 0 black,
                2px 0 0 0 black,
                0 -2px 0 0 black,
                0 2px 0 0 black;
              font-family: 'Pixelify Sans', sans-serif;
              font-size: 24px;
            }
          </style>
          <div class="wrapper">
            <div class="ship-info">
              <ninja-button
                class="back"
                size="45"
                icon="arrow-alt-circle-left"
                onclick=${back}
                border-size="0"
              ></ninja-button>
              <h2>${shipTypes[ship].name}</h2>
              <ninja-icon
                class="ship"
                angle="-45"
                size="72"
                name=${`ship-${ship}`}
              ></ninja-icon>
            </div>
            <footer>
              <label for="name">&lt;&lt; name</label
              ><input
                type="text"
                value=${name}
                id="name"
                onchange=${changeName}
                size="10"
                maxlength="20"
              />
              <ninja-button
                icon="face-thinking"
                title="Random Name"
                onclick=${randomName}
              ></ninja-button>
              <ninja-button solid onclick=${join}>
                Join the Fun
                <ninja-icon name="chevron-up" angle="90"></ninja-icon>
              </ninja-button>
            </footer>
          </div>
        `
      : html`<span>Select a valid Ship</span>`,
};
