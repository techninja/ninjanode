/**
 * @file Icon element definition.
 */
import { html } from 'hybrids';

export const NinjaIcon = {
  tag: 'ninja-icon',
  name: '',
  size: 32,
  dark: true,
  solid: false,
  fullWidth: false,
  disabled: false,

  render: ({ name, dark, fullWidth, disabled, solid, size }) => html`
    <style>
      :host {
        display: block;
      }
      img {
        width: ${fullWidth ? '100%' : `${size}px`};
        filter: ${dark ? 'invert(0)' : 'invert(1)'};
        ${disabled && 'filter: invert(0.5) sepia(1) saturate(0) hue-rotate(175deg)'};
      }
    </style>
    <img
      src=${`icons/icons/svg/${solid ? 'solid' : 'regular'}/${name}${solid ? '-solid' : ''}.svg`}
    >
    </img>
  `,
};
