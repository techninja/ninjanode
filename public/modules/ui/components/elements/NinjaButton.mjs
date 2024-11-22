/**
 * @file Single button element definition.
 */
import { html } from 'hybrids';

export const NinjaButton = {
  tag: 'ninja-button',
  text: '',
  icon: '',
  type: 'plain',
  loading: false,
  desc: '',
  fullWidth: false,
  active: false,
  disabled: false,

  render: ({
    icon,
    text,
    desc,
    fullWidth,
    active,
    disabled,
    loading,
    type,
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
      </style>
      <a
        class="${linkClasses}"
        disabled=${disabled}
        style=${buttonStyle}
        title="${desc}"
      >
        ${icon && html`<ninja-icon name=${icon} />`}
        ${text && html`<span>${text}</span>`}
      </a>
    `;
  },
};
