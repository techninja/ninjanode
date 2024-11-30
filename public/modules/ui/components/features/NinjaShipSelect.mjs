import { html, store, dispatch } from 'hybrids';
import { UserSettings } from 'models';

// Bubble up the join event so the primary host can catch it.
const joinGame = (host, { detail }) => {
  dispatch(host, 'join', { detail });
};

export const NinjaShipSelect = {
  tag: 'ninja-ship-select',
  settings: () => store.get(UserSettings),
  render: ({ settings }) => html`
    <style></style>
    <ninja-slides width="99" height="250" unit="%" onjoin=${joinGame}>
      <ninja-slide name="pick" active=${!settings.name}>
        <ninja-slide-ships></ninja-slide-ships>
      </ninja-slide>
      <ninja-slide name="join" active=${!!settings.name}>
        <ninja-slide-join></ninja-slide-join>
      </ninja-slide>
      <ninja-slide name="reset">
        <ninja-slide-reset></ninja-slide-reset>
      </ninja-slide>
    </ninja-slides>
  `,
};
