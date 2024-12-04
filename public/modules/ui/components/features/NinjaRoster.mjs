/**
 * @file Ninjanode player roster.
 */
import { html, store } from 'hybrids';
import { ConnectedUsers, AppState } from 'models';

export const NinjaRoster = {
  tag: 'ninja-roster',
  socketId: () => store.get(AppState).socketId,
  users: store([ConnectedUsers]),

  render: ({ socketId, users }) => html`
    <style>
      :host {
        display: block;
      }
      .wrapper {
        background-color: rgba(22, 22, 22, 0.5);
        border: 1px solid #444444;
        border-radius: 1em 1em 1em 1em;
        color: #aaaaff;
        font-family: monospace;
        font-size: 14px;
        padding: 1em;
        right: 1em;
        top: 1em;
        width: 250px;
        position: absolute;
      }

      h2 {
        border-bottom: 1px solid #2d918b;
        margin-top: 0;
        color: #005bce;
        margin-bottom: 0.2em;
        font-family: 'Pixelify Sans', sans-serif;
      }
    </style>
    <div class="wrapper">
      <h2>Currently Online</h2>
      ${users.map((user) =>
        html`<ninja-roster-user
          user=${user}
          self=${socketId}
        ></ninja-roster-user>`.key(user.id)
      )}
    </div>
  `,
};
