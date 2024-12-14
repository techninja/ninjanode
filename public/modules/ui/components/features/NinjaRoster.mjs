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
        border: 1px solid var(--border-color);
        box-shadow:
          -2px 0 0 0 var(--border-color),
          2px 0 0 0 var(--border-color),
          0 -2px 0 0 var(--border-color),
          0 2px 0 0 var(--border-color),
          0px 0px 20px 10px var(--glow-color);
        color: #aaaaff;
        font-family: monospace;
        font-size: 14px;
        padding: 8px;
        right: 1em;
        top: 1em;
        width: 250px;
        position: absolute;
      }

      h2 {
        border-bottom: 1px solid var(--border-color);
        margin-top: 0;
        color: var(--text-color);
        margin-bottom: 0.2em;
        font-family: var(--body-font);
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
