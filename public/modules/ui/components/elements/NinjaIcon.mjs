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
  color: '',
  hoverColor: '',
  solid: false,
  disabled: false,
  flash: false,
  origin: 'inherit',
  noAnimation: false,

  render: ({
    name,
    color,
    hoverColor,
    disabled,
    solid,
    size,
    angle,
    flash,
    origin,
    noAnimation,
  }) => {
    const icon = `hn-${name}${solid ? '-solid' : ''}`;
    const pxSize = `${size}px`;
    let shipImage =
      name.substr(0, 4) == 'ship'
        ? `resources/graphics/ships/ship_${name.substr(-1)}.png`
        : false;

    const customImage =
      name.substr(0, 4) == 'cust'
        ? `resources/graphics/icons/${name.substr(5)}.png`
        : false;

    if (customImage) shipImage = customImage;

    const iconClasses = {
      hn: !shipImage,
      ship: !!shipImage,
      [icon]: !shipImage,
      flash,
      disabled,
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
          transform-origin: ${origin};
          width: ${pxSize};
          height: ${pxSize};
          transition: ${!noAnimation ? '0.5s ease-in-out' : 'none'};
        }
      </style>
      <div class="icon">
        <i class=${iconClasses}></i>
      </div>
    `.style(iconfont).css`
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
      .icon i {
        font-size: ${pxSize};
        // color: ${color ? color : 'var(--button-text)'} !important;
      }
      .icon i:hover {
        //color: ${hoverColor ? hoverColor : 'var(--button-text-hover)'};
      }
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
