import { html, store } from 'hybrids';
import { UserSettings } from 'models';

const back = (host) => {
  host.parentElement.parentElement.index = 0;
};

export const NinjaSlideReset = {
  tag: 'ninja-slide-reset',
  settings: () => store.get(UserSettings),
  render: ({ settings }) => html`
    <style></style>
    <div>
      <h2>
        <ninja-button onclick=${back} icon="refresh"
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
