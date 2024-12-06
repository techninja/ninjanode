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

const swapShip =
  (direction) =>
  ({ ship }) => {
    const keys = Object.keys(shipTypes);
    let index = keys.findIndex((a) => a === ship) + direction;

    // Valid key
    if (keys[index]) {
      store.set(UserSettings, { ship: keys[index] });
    } else if (index < 0) {
      // Off the bottom, wrap to top.
      store.set(UserSettings, { ship: keys[keys.length - 1] });
    } else {
      // Off the top, wrap to bottom.
      store.set(UserSettings, { ship: keys[0] });
    }
  };

export const NinjaSlideJoin = {
  tag: 'ninja-slide-join',
  ship: () => store.get(UserSettings).ship,
  name: () => store.get(UserSettings).name,
  config: ({ ship }) => shipTypes[ship],
  render: ({ ship, name, config }) =>
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
              grid-template-rows: 41px auto;
              grid-gap: 10px;
              padding: 5px;
              overflow: hidden;
            }
            .ship-info .back {
              grid-area: 1 / 1 / 2 / 2;
            }
            .ship-info h2 {
              grid-area: 1 / 2 / 2 / 3;
            }
            .ship-info .ship {
              grid-area: 1 / 3 / 2 / 4;
            }
            .ship-info .breakdown {
              grid-area: 2 / 1 / 3 / 3;
            }
            .ship-info .scroller {
              grid-area: 2 / 3 / 3 / 4;
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
            .breakdown {
              overflow-y: scroll;
              height: 122px;
            }
            table {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11px;
              border-collapse: collapse;
              width: 85%;
            }
            table th {
              border-bottom: 2px solid #aaa;
            }
            table td {
              border-bottom: 1px solid #aaa;
            }
            table td.spacer {
              border: 0 none;
              width: 1.7em;
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
              <h2>${config.name}</h2>
              <ninja-icon
                class="ship"
                angle="-45"
                size="72"
                name=${`ship-${ship}`}
              ></ninja-icon>
              <div class="breakdown">
                <table>
                  <thead></thead>
                  <tbody>
                    <tr>
                      <th colspan="2">Ship Stats</th>
                      <td class="spacer"></td>
                      <th colspan="2">
                        ${config.weapons[0].proj.name} (space)
                      </th>
                      <th>${config.weapons[1].proj.name} (m)</th>
                    </tr>
                    <tr>
                      <td>Top Speed</td>
                      <td>
                        <ninja-meter
                          ratio=${config.stats.topSpeed}
                          title="${config.topSpeed * 420} kph"
                        ></ninja-meter>
                      </td>
                      <td class="spacer"></td>
                      <td>Damage</td>
                      <td>
                        <ninja-meter
                          ratio=${config.stats.primaryWeaponDamage}
                          title="${config.weapons[0].proj.damage} units"
                        ></ninja-meter>
                      </td>
                      <td>
                        <ninja-meter
                          ratio=${config.stats.secondaryWeaponDamage}
                          title="${config.weapons[1].proj.damage} units"
                        ></ninja-meter>
                      </td>
                    </tr>
                    <tr>
                      <td>Rotation Speed</td>
                      <td>
                        <ninja-meter
                          ratio=${config.stats.rotationSpeed}
                          title="${config.rotationSpeed} rpm"
                        ></ninja-meter>
                      </td>
                      <td class="spacer"></td>
                      <td>Speed</td>
                      <td>
                        <ninja-meter
                          ratio=${config.stats.primaryWeaponSpeed}
                          title="${config.weapons[0].proj.speed} kph"
                        ></ninja-meter>
                      </td>
                      <td>
                        <ninja-meter
                          ratio=${config.stats.secondaryWeaponSpeed}
                          title="${config.weapons[1].proj.speed} kph"
                        ></ninja-meter>
                      </td>
                    </tr>
                    <tr>
                      <td>Acceleration</td>
                      <td>
                        <ninja-meter
                          ratio=${config.stats.accelRate}
                          title="${(config.accelRate * 680).toFixed(2)} cps²"
                        ></ninja-meter>
                      </td>
                      <td class="spacer"></td>
                      <td>Pushback</td>
                      <td>
                        <ninja-meter
                          ratio=${config.stats.primaryWeaponForce}
                          title="${config.weapons[0].proj.knockBackForce *
                          42} joules"
                        ></ninja-meter>
                      </td>
                      <td>
                        <ninja-meter
                          ratio=${config.stats.secondaryWeaponForce}
                          title="${config.weapons[1].proj.knockBackForce *
                          42} joules"
                        ></ninja-meter>
                      </td>
                    </tr>
                    <tr>
                      <td>Drag</td>
                      <td>
                        <ninja-meter
                          flipped
                          ratio=${config.stats.drag}
                          title="${(config.drag * 680).toFixed(2)} cps²"
                        ></ninja-meter>
                      </td>
                      <td class="spacer"></td>
                      <td>Lifetime</td>
                      <td>
                        <ninja-meter
                          ratio=${config.stats.primaryWeaponLife}
                          title="${config.weapons[0].proj.life / 1000} secs"
                        ></ninja-meter>
                      </td>
                      <td>
                        <ninja-meter
                          ratio=${config.stats.secondaryWeaponLife}
                          title="${config.weapons[1].proj.life / 1000} secs"
                        ></ninja-meter>
                      </td>
                    </tr>
                    <tr>
                      <td>Shield (200)</td>
                      <td>
                        <ninja-meter
                          ratio=${config.stats.shieldRate}
                          title="Regen rate ${config.shield.regenRate * 16} jps"
                        ></ninja-meter>
                      </td>
                      <td class="spacer"></td>
                      <td>Reload Rate</td>
                      <td>
                        <ninja-meter
                          flipped
                          ratio=${config.stats.primaryWeaponRate}
                          title="${config.weapons[0].fireRate / 1000} sec"
                        ></ninja-meter>
                      </td>
                      <td>
                        <ninja-meter
                          flipped
                          ratio=${config.stats.secondaryWeaponRate}
                          title="${config.weapons[1].fireRate / 1000} secs"
                        ></ninja-meter>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="scroller">
                <ninja-button
                  solid
                  border-size="0"
                  icon="chevron-up"
                  title="Previous Ship"
                  onclick=${swapShip(-1)}
                ></ninja-button>
                <ninja-button
                  solid
                  border-size="0"
                  icon="chevron-down"
                  title="Next Ship"
                  onclick=${swapShip(1)}
                ></ninja-button>
              </div>
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
              <ninja-button solid class="join" onclick=${join}>
                Join the Fun
                <ninja-icon name="chevron-up" size="20" angle="90"></ninja-icon>
              </ninja-button>
            </footer>
          </div>
        `
      : html`<span>Select a valid Ship</span>`,
};
