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
      div.title {
        position: absolute;
        top: -115px;
      }
      h2,
      h3 {
        margin: 0;
        width: 100%;
        text-transform: lowercase;
        text-align: center;
      }
      h2 {
        color: var(--text-color);
        font-family: var(--head-font);
        font-weight: 300;
        font-size: 50px;
        text-shadow: var(--glow-color) 0px 0px 35px;
      }
      h3.subhed {
        line-height: 17px;
        font-size: 13px;
        font-family: var(--head-font);
        color: var(--text-color);
      }
      ninja-button.fullscreen {
        position: absolute;
        left: 8px;
        bottom: 8px;
      }

      ninja-tabs {
        margin-top: -25px;
      }

      /* Portrait Phone */
      @media (max-height: 500px) {
        div.title {
          top: 155px;
          transform: scale(0.7) rotate(-90deg);
          left: -310px;
        }
      }

      /* Landscape Phone */
      @media (max-width: 600px) {
        /* TODO */
      }
    </style>
    <ninja-window id="main-window">
      <div class="title">
        <h2>ninjanode</h2>
        <h3 class="subhed">
          A fully open source web browser space ship game, for the hell of it.
        </h3>
      </div>
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
