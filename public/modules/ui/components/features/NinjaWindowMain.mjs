import { html, store } from 'hybrids';
import { AppState, AppStateObserver } from 'models';

const body = document.querySelector('body');

const fullscreenToggle = (host) => {
  const fullscreen = !host.fullscreen;

  // State managed by browser event.
  if (fullscreen) {
    body.requestFullscreen();
  } else {
    if (document.readyState == 'complete') document.exitFullscreen();
  }
};

// Catch if the browser took over fullscreen state.
body.addEventListener('fullscreenchange', () => {
  // Set state of fullscreen base on document state change.
  store.set(AppState, { fullscreen: !!document.fullscreenElement });
});

export const NinjaWindowMain = {
  tag: 'ninja-window-main',
  fullscreen: () => store.get(AppState).fullscreen,

  render: ({ fullscreen }) => html`
    <style>
      h3.subhed {
        position: absolute;
        top: 0;
        right: 60px;
        width: 250px;
        line-height: 17px;
        font-size: 13px;
        font-family: var(--head-font);
        text-transform: lowercase;
        text-align: right;
        color: var(--text-color);
      }

      @media (max-width: 600px) {
        h3.subhed {
          font-size: 10px;
          width: 136px;
          line-height: 10px;
          text-align: right;
          padding-right: 6px;
          top: 0;
        }
      }
      ninja-button.fullscreen {
        position: absolute;
        right: 8px;
        top: 8px;
      }
    </style>
    <ninja-window id="main-window" head="ninjanode">
      <h3 class="subhed">
        A fully open source web browser space ship game, for the hell of it.
      </h3>
      <ninja-button
        class="fullscreen"
        icon="external-link"
        active=${fullscreen}
        title=${fullscreen ? 'Exit Fullscreen' : 'Go Fullscreen'}
        onclick=${fullscreenToggle}
        angle=${fullscreen ? 180 : 0}
      ></ninja-button>
      <ninja-tabs activeItem="play">
        <ninja-tab caption="Pick a name and a ship" icon="play" name="play">
          <ninja-ship-select></ninja-ship-select>
        </ninja-tab>
        <ninja-tab caption="Controls" icon="edit" name="controls">
          <ninja-controls></ninja-controls>
        </ninja-tab>
        <ninja-tab caption="Bots" icon="robot" name="bots">
          <ninja-bots></ninja-bots>
        </ninja-tab>
        <ninja-tab caption="Settings" icon="cog" name="settings">
          <ninja-settings></ninja-settings>
        </ninja-tab>
      </ninja-tabs>
    </ninja-window>
  `,
};
