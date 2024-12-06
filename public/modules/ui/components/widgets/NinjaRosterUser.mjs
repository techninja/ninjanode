/**
 * @file Ninjanode player roster.
 */
import { html, store } from 'hybrids';
import { getUser, AppState } from 'models';

const userClick = ({ user }) => {
  store.set(AppState, {
    viewportFocus: {
      x: user.pos.x,
      y: user.pos.y,
    },
  });
};

export const NinjaRosterUser = {
  tag: 'ninja-roster-user',
  user: { value: {} },
  self: '',

  render: ({ user, self }) => {
    let compass = html`<ninja-icon
      size="16"
      name="home"
      color="#00FF00"
      solid
      title="It's you!"
    ></ninja-icon>`;

    const selfUser = getUser(self);

    // Calculate distance and angle from "our" position
    if (user.socketId !== self) {
      // Not connected, compass is empty.
      if (!selfUser) {
        compass = html`<ninja-icon
          size="16"
          name="ellipses-horizontal-circle"
          color="grey"
          solid
        ></ninja-icon>`;
      } else {
        // Calulate angle and distance from each ship to you.
        var theta = Math.atan2(
          user.pos.y - selfUser.pos.y,
          user.pos.x - selfUser.pos.x
        );
        if (theta < 0) {
          theta += 2 * Math.PI;
        }

        let angle = Math.round(theta * (180 / Math.PI) + 90);
        const dist = Math.sqrt(
          Math.pow(user.pos.x - selfUser.pos.x, 2) +
            Math.pow(user.pos.y - selfUser.pos.y, 2)
        );

        let title = `Enemy ${Math.round(dist / 10)} clicks away from you`;
        let icon = 'arrow-up';
        let flash = false;

        let color = 'gray';
        if (dist < 4000) {
          color = 'green';
        }
        if (dist < 3000) {
          color = 'blue';
        }
        if (dist < 2000) {
          color = 'orange';
        }
        if (dist < 750) {
          color = 'red';
          flash = true;
        }

        if (user.exploding) {
          color = 'red';
          icon = 'octagon-times';
          title = 'Enemy exploded';
          angle = 0;
        }

        // We're connected!
        compass = html`<ninja-icon
          size="16"
          name=${icon}
          color=${color}
          angle=${angle}
          title=${title}
          flash=${flash}
          solid
        ></ninja-icon>`;
      }
    }

    return html`
      <style>
        :host {
          display: block;
          cursor: pointer;
        }
        .wrapper {
          display: grid;
          grid-template-columns: 16px 35px auto 16px;
          grid-gap: 5px;
        }
      </style>
      <div class="wrapper" onclick=${userClick}>
        <span>
          <ninja-icon
            size="16"
            angle=${user.pos.d}
            name=${`ship-${user.style}`}
          ></ninja-icon>
        </span>
        <span>${user.score.kills}/${user.score.deaths}</span>
        <span>${user.name}</span>
        <span>${compass}</span>
      </div>
    `;
  },
};
