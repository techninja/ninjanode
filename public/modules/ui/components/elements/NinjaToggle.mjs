/**
 * @file Toggle button element definition.
 */
import { html, dispatch } from 'hybrids';

const click = (host) => {
  host.isOn = !host.isOn;

  // After change custom event is dispatched
  dispatch(host, 'change', { detail: { isOn: host.isOn } });
};

export const NinjaToggle = {
  tag: 'ninja-toggle',
  isOn: false,
  fullwidth: false,
  onTitle: 'On',
  onIcon: 'octagon-check',
  offTitle: 'Off',
  offIcon: 'octagon-times',

  render: ({ isOn, onIcon, offIcon, onTitle, offTitle }) =>
    html`<ninja-button
      onclick=${click}
      icon=${isOn ? onIcon : offIcon}
      text=${isOn ? onTitle : offTitle}
    ></ninja-button>`,
};
