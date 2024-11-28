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
  render: ({ active, caption }) => html`
    <style>
      :host {
        display: block;
        position: relative;
        overflow: hidden;
      }
      h2 {
        margin: 0;
        padding-bottom: 5px;
      }
    </style>
    ${active &&
    html`
      <h2>${caption}</h2>
      <slot></slot>
    `}
  `,
};
