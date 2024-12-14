import { html } from 'hybrids';

export const NinjaBots = {
  tag: 'ninja-bots',

  render: () => html`
    <style>
      :host {
        color: var(--button-text);
      }
    </style>
    <div>
      <small>bot stuff goes here</small>
    </div>
  `,
};
