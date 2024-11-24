/**
 * @file Tab item element definition.
 */
import { html } from 'hybrids';

export const NinjaTab = {
  tag: 'ninja-tab',
  text: '',
  caption: '',
  name: '',
  icon: '',
  active: false,

  // Renders children (<slot/>) if active is set to true
  render: ({ active }) => html`
    <style>
      :host {
        display: block;
        position: relative;
        overflow: hidden;
      }
    </style>
    ${active && html`<slot></slot>`}
  `,
};
