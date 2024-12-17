/**
 * @file Ninja ship info for the selections creen, takes in shiptype.
 */
import { html } from 'hybrids';
import { shipTypes } from 'data';

export const NinjaShipInfo = {
  tag: 'ninja-ship-info',
  type: 'a',
  config: ({ type }) => shipTypes[type],

  render: ({ config }) => html`
    <style>
      :host {
        color: var(--text-color);
        overflow-y: scroll;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
      }
      div span {
        display: grid;
        grid-template-columns: 2fr 1fr;
        padding-top: 1em;
      }
      h4,
      h5 {
        margin: 0;
        color: var(--button-text-active);
      }

      @media (max-width: 600px) {
        :host {
          display: grid;
          grid-template-columns: auto;
        }
      }
    </style>
    <div>
      <h4>Ship Stats</h4>
      <h5>${config.name}</h5>
      <span>
        <b>Top Speed</b>
        <ninja-meter
          ratio=${config.stats.topSpeed}
          title="${config.topSpeed * 420} kph"
        ></ninja-meter>
      </span>

      <span>
        <b>Acceleration</b>
        <ninja-meter
          ratio=${config.stats.accelRate}
          title="${(config.accelRate * 680).toFixed(2)} cps²"
        ></ninja-meter>
      </span>
    </div>

    <div>
      <h4>Weapon Stats</h4>
      <h5>${config.weapons[0].proj.name} (space)</h5>
      <span>
        <b>Damage</b>
        <ninja-meter
          ratio=${config.stats.primaryWeaponDamage}
          title="${config.weapons[0].proj.damage} units"
        ></ninja-meter>
      </span>

      <span>
        <b>Speed</b>
        <ninja-meter
          ratio=${config.stats.primaryWeaponSpeed}
          title="${config.weapons[0].proj.speed * 420} kph"
        ></ninja-meter>
      </span>
    </div>
  `,
};
