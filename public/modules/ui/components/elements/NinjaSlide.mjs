/**
 * @file Slide item element definition.
 */
import { html } from 'hybrids';

export const NinjaSlide = {
  tag: 'ninja-slide',
  text: '',
  name: '',
  icon: '',
  active: false,

  // Renders all children (<slot/>) with active class.
  render: ({ active }) => html`
    <style>
      :host {
        overflow-x: hidden;
        padding: 0.75em;
      }
    </style>
    <div class=${{ active, item: true }}><slot></slot></div>
  `,
};
