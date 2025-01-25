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
    const shipImage =
      name.substr(0, 4) == 'ship'
        ? `resources/graphics/ships/ship_${name.substr(-1)}.png`
        : false;

    const iconImage =
      name.substr(0, 4) == 'cust'
        ? `resources/graphics/icons/${name.substr(5)}.png`
        : false;

    const transparentImage =
      name.substr(0, 5) == 'trans'
        ? `resources/graphics/icons/${name.substr(6)}.png`
        : false;

    const customImage = shipImage || iconImage || transparentImage;

    const iconClasses = {
      hn: !customImage,
      custom: !!customImage,
      [icon]: !customImage,
      transparent: !!transparentImage,
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

      .custom {
        background-image: url(${customImage});
        display: block;
        width: ${pxSize};
        height: ${pxSize};
        content: ' ';
        background-repeat: no-repeat;
        background-size: contain;
      }

      .transparent {
        background-image: none;
        background-color: ${color};
        mask-image: url(${customImage});
        mask-size: 100%;
      }
    `;
  },
};
