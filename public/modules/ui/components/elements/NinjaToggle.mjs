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

  // Passthrough attributes for buttons.
  size: 25,

  render: ({ isOn, onIcon, offIcon, onTitle, offTitle, size }) =>
    html` <style>
        :host {
          display: inline-block;
        }
      </style>
      <ninja-button
        onclick=${click}
        size=${size}
        icon=${isOn ? onIcon : offIcon}
        text=${isOn ? onTitle : offTitle}
        active=${isOn}
      ></ninja-button>`,
};
