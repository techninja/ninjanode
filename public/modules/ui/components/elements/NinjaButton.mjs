/**
 * @file Single button element definition.
 */
import { html } from 'hybrids';

export const NinjaButton = {
  tag: 'ninja-button',
  text: '',
  type: 'plain',
  loading: false,
  desc: '',
  fullWidth: false,
  active: false,
  disabled: false,
  borderSize: 2,
  backgroundColor: 'grey',
  hoverColor: 'white',

  // Icon prop drilled attributes.
  icon: '',
  solid: false,
  angle: 0,

  render: ({
    text,
    desc,
    fullWidth,
    active,
    disabled,
    loading,
    type,
    borderSize,
    icon,
    solid,
    angle,
    backgroundColor,
    hoverColor,
    buttonIndex,
  }) => {
    const buttonClasses = {
      button: true,
      'is-active': active,
      'is-loading': loading,
    };
    if (type) buttonClasses[`is-${type}`] = true;

    const buttonStyle = { display: fullWidth ? 'flex' : 'inline-block' };

    return html`
      <style>
        :host {
          display: inline-block;
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          margin: ${borderSize}px;
          background-color: ${backgroundColor};
          box-shadow:
            -${borderSize}px 0 0 0 black,
            ${borderSize}px 0 0 0 black,
            0 -${borderSize}px 0 0 black,
            0 ${borderSize}px 0 0 black;
        }
        :host button:hover {
          background-color: ${hoverColor};
        }
        button {
          padding: 0.25em;
          border: none;
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          width: 100%;
          height: 100%;
          font-family: 'Pixelify Sans', monospace;
          overflow: hidden;
          background-color: transparent;
        }
      </style>
      <button
        class="${buttonClasses}"
        disabled=${disabled}
        style=${buttonStyle}
        title="${desc}"
        tabindex="0"
      >
        ${icon &&
        html`<ninja-icon name=${icon} solid=${solid} angle=${angle} />`}
        ${text && html`<span>${text}</span>`}
        <slot></slot>
      </button>
    `;
  },
};
