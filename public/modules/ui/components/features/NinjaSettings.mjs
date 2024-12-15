import { html, store } from 'hybrids';
import { UserSettings } from 'models';

const setVal =
  (key) =>
  (host, { detail }) => {
    store.set(UserSettings, { [key]: detail.isOn });
  };

export const NinjaSettings = {
  tag: 'ninja-settings',
  settings: () => store.get(UserSettings),

  render: ({ settings }) => html`
    <style></style>
    <div>
      <ninja-toggle
        is-on=${settings.freelook}
        on-title="Freelook On"
        off-title="Freelook Off"
        on-icon="eye"
        off-icon="eye-cross"
        onchange=${setVal('freelook')}
      ></ninja-toggle>
      <ninja-toggle
        is-on=${settings.mute}
        on-title="Sound Off"
        off-title="Sound On"
        on-icon="sound-mute"
        off-icon="sound-on"
        onchange=${setVal('mute')}
      ></ninja-toggle>
    </div>
  `,
};
