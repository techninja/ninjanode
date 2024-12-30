/**
 * @file Toggle button element definition.
 */
import { html, dispatch } from 'hybrids';

const click = (host) => {
  const newVal = !host.isOn;

  // Manage our own state if configured.
  if (host.statefull) {
    host.isOn = newVal;
  }

  // After change custom event is dispatched
  dispatch(host, 'change', { detail: { isOn: newVal } });
};

export const NinjaToggle = {
  tag: 'ninja-toggle',
  isOn: false,
  statefull: false,
  fullwidth: false,
  onTitle: 'On',
  onIcon: 'octagon-check',
  offTitle: 'Off',
  offIcon: 'octagon-times',

  // Passthrough attributes for button.
  disabled: false,
  size: 25,
  fontSize: 16,
  fullWidth: false,

  render: ({
    isOn,
    onIcon,
    offIcon,
    onTitle,
    offTitle,
    size,
    fullWidth,
    fontSize,
    disabled,
  }) =>
    html` <style>
        :host {
          display: inline-block;
        }
      </style>
      <ninja-button
        onclick=${click}
        fullWidth=${fullWidth}
        fontSize=${fontSize}
        disabled=${disabled}
        size=${size}
        icon=${isOn ? onIcon : offIcon}
        text=${isOn ? onTitle : offTitle}
        active=${isOn}
      ></ninja-button>`,
};
