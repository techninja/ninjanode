/**
 * @file Icon element definition.
 */
import { html } from 'hybrids';

export const NinjaIcon = {
  tag: 'ninja-icon',
  name: '',
  size: 32,
  angle: 0,
  dark: true,
  solid: false,
  fullWidth: false,
  disabled: false,

  render: ({ name, dark, fullWidth, disabled, solid, size, angle }) => {
    const svg = `icons/icons/svg/${solid ? 'solid' : 'regular'}/${name}${solid ? '-solid' : ''}.svg`;
    const src =
      name.substr(0, 4) == 'ship'
        ? `resources/graphics/ships/ship_${name.substr(-1)}.png`
        : svg;

    return html`
      <style>
        :host {
          display: block;
        }
        img {
          width: ${fullWidth ? '100%' : `${size}px`};
          filter: ${dark ? 'invert(0)' : 'invert(1)'};
          ${disabled && 'filter: invert(0.5) sepia(1) saturate(0) hue-rotate(175deg)'};
          transform: ${`rotate(${angle}deg)`};
        }
      </style>
      <img
        src=${src}
      >
      </img>
    `;
  },
};
