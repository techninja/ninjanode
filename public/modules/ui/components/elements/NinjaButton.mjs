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
          background-color: var(--button-background);
          box-shadow:
            -${borderSize}px 0 0 0 var(--border-color),
            ${borderSize}px 0 0 0 var(--border-color),
            0 -${borderSize}px 0 0 var(--border-color),
            0 ${borderSize}px 0 0 var(--border-color),
            0px 0px 15px 5px var(--glow-color);
        }
        :host button:hover {
          color: var(--button-text-hover);
          background-color: var(--button-background-hover);
        }
        button {
          padding: 0.25em;
          border: none;
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          width: 100%;
          height: 100%;
          font-family: var(--small-font);
          color: var(--button-text);
          overflow: hidden;
          background-color: transparent;
        }
        button.is-active {
          color: var(--button-text-active);
          background-color: var(--button-background-active);
        }
        button:disabled {
          color: var(--text-color-disabled);
          background-color: var(--text-background-disabled);
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
