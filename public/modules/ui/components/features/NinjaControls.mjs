import { html, store } from 'hybrids';
import { UserSettings } from 'models';

const setVal =
  (key) =>
  (host, { detail }) => {
    store.set(UserSettings, { [key]: detail.isOn });
  };

export const NinjaControls = {
  tag: 'ninja-controls',
  settings: () => store.get(UserSettings),

  render: ({ settings }) => html`
    <style></style>
    <div>
      <span>
        Mouse Controls:
        <ninja-toggle
          is-on=${settings.mouseControls}
          onchange=${setVal('mouseControls')}
        ></ninja-toggle>
      </span>
    </div>
  `,
};
