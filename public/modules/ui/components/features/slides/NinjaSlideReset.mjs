import { html, store } from 'hybrids';
import { UserSettings } from 'models';

const back = (host) => {
  host.parentElement.parentElement.index = 0;
};

export const NinjaSlideReset = {
  tag: 'ninja-slide-reset',
  active: ({ parentNode }) => parentNode.active,
  settings: () => store.get(UserSettings),
  render: ({ settings, active }) => html`
    <style>
      :host {
        color: var(--text-color);
      }
    </style>
    <div>
      <h2>
        <ninja-button disabled=${!active} onclick=${back} icon="refresh"
          >Change your setup:</ninja-button
        >
      </h2>
      <ul>
        <li>Name: ${settings.name}</li>
        <li>Ship: ${settings.ship}</li>
      </ul>
    </div>
  `,
};
