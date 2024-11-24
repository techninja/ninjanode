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
    icon,
    solid,
    angle,
  }) => {
    const linkClasses = {
      button: true,
      'is-active': active,
      'is-loading': loading,
    };
    if (type) linkClasses[`is-${type}`] = true;

    const buttonStyle = { display: fullWidth ? 'flex' : 'inline-block' };

    return html`
      <style>
        :host {
          display: inline-block;
          cursor: pointer;
        }
        a {
          display: block !important;
          padding: 0.25em;
        }
        a:hover {
          background-color: gray;
        }
      </style>
      <a
        class="${linkClasses}"
        disabled=${disabled}
        style=${buttonStyle}
        title="${desc}"
      >
        ${icon &&
        html`<ninja-icon name=${icon} solid=${solid} angle=${angle} />`}
        ${text && html`<span>${text}</span>`}
        <slot></slot>
      </a>
    `;
  },
};
