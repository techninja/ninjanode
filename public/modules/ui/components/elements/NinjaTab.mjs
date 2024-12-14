/**
 * @file Tab item element definition.
 */
import { html } from 'hybrids';

export const NinjaTab = {
  tag: 'ninja-tab',
  active: false,
  caption: '',

  // These are only read by the parent component!
  // @see NinjaTabs.mjs
  text: '',
  name: '',
  icon: '',

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
        color: var(--text-color);
      }
    </style>
    ${active &&
    html`
      <h2>${caption}</h2>
      <slot></slot>
    `}
  `,
};
