/**
 * @file Icon element definition.
 */
import { html } from 'hybrids';
import iconfont from '/icons/fonts/iconfont.css' with { type: 'css' };

export const NinjaIcon = {
  tag: 'ninja-icon',
  name: '',
  size: 32,
  angle: 0,
  color: 'black',
  hoverColor: 'white',
  solid: false,
  disabled: false,

  render: ({ name, color, hoverColor, disabled, solid, size, angle }) => {
    const icon = `hn-${name}${solid ? '-solid' : ''}`;
    const pxSize = `${size}px`;
    const shipImage =
      name.substr(0, 4) == 'ship'
        ? `resources/graphics/ships/ship_${name.substr(-1)}.png`
        : false;

    const iconClasses = {
      hn: !shipImage,
      ship: !!shipImage,
      [icon]: !shipImage,
    };

    return html`
      <style>
        :host {
          display: inline-block;
          width: ${pxSize};
          height: ${pxSize};
        }
        .icon {
          transform: ${`rotate(${angle}deg)`};
        }
        .icon i {
          font-size: ${pxSize};
          color: ${color};
          ${disabled &&
        'filter: invert(0.5) sepia(1) saturate(0) hue-rotate(175deg)'};
        }
        .icon i:hover {
          color: ${hoverColor};
        }
        .ship {
          display: block;
          content: ' ';
          background-image: ${`url(${shipImage})`};
          background-repeat: no-repeat;
          background-size: contain;
          width: ${pxSize};
          height: ${pxSize};
        }
      </style>
      <div class="icon">
        <i class=${iconClasses}></i>
      </div>
    `.style(iconfont);
  },
};
