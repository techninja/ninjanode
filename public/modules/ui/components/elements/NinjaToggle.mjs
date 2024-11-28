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

  render: ({ isOn, onIcon, offIcon, onTitle, offTitle }) =>
    html` <style>
        :host {
          display: inline-block;
        }
      </style>
      <ninja-button
        onclick=${click}
        icon=${isOn ? onIcon : offIcon}
        text=${isOn ? onTitle : offTitle}
      ></ninja-button>`,
};
