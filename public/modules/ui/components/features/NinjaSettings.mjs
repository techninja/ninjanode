import { html } from 'hybrids';

export const NinjaSettings = {
  tag: 'ninja-settings',

  render: () => html`
    <style></style>
    <div>
      <h2>Game settings</h2>
      <div>
        <ninja-toggle
          on-title="Yes"
          off-title="No"
          on-icon="sound-on"
          off-icon="sound-mute"
        ></ninja-toggle>
      </div>
    </div>
  `,
};
