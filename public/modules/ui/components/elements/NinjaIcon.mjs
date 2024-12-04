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
  flash: false,

  render: ({
    name,
    color,
    hoverColor,
    disabled,
    solid,
    size,
    angle,
    flash,
  }) => {
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
      flash,
    };

    return html`
      <style>
        :host {
          display: inline-block;
          width: ${pxSize};
          height: ${pxSize};
        }
        @keyframes flash {
          0% {
            color: ${color};
          }
          10% {
            color: #fff;
          }
          100% {
            color: ${color};
          }
        }
        .flash {
          animation-name: flash;
          animation-duration: 500ms;
          animation-iteration-count: infinite;
          animation-timing-function: ease-out;
        }
        .icon {
          transform: ${`rotate(${angle}deg)`};
          width: ${pxSize};
          height: ${pxSize};
        }
        .icon i {
          font-size: ${pxSize};
          color: ${color};
        }
        .icon i:hover {
          color: ${hoverColor};
        }
      </style>
      <div class="icon">
        <i class=${iconClasses}></i>
      </div>
    `.style(iconfont).css`
      .ship {
        background-image: url(${shipImage});
        width: ${pxSize};
        height: ${pxSize};
        display: block;
        content: ' ';
        background-repeat: no-repeat;
        background-size: contain;
      }
    `;
  },
};
