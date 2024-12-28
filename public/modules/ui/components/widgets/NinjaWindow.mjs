/**
 * @file <ninja-window> component for window management
 */

import { html, store } from 'hybrids';
import { AppState } from 'models';

const toggleVis = (windowVisible) => () => {
  const { chatVisible } = store.get(AppState);
  if (windowVisible && chatVisible) {
    // Hide chat window if trying to open main.
    store.set(AppState, { chatVisible: false, windowVisible });
  } else {
    store.set(AppState, { windowVisible });
  }
};

export const NinjaWindow = {
  tag: 'ninja-window',
  head: '',
  windowVisible: () => store.get(AppState).windowVisible,

  render: ({ head, windowVisible }) => html`
    <style>
      div.wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: 0.5s ease-in-out;
        min-height: ${!windowVisible ? 0 : '100vh'};
        max-width: 100%;
        margin: 1em;
        max-height: 100%;
      }
      section {
        transition: 0.5s ease-in-out;
        background: linear-gradient(
            rgba(18, 16, 16, 0) 50%,
            rgba(0, 0, 0, 0.25) 50%
          ),
          linear-gradient(
            90deg,
            rgba(255, 0, 0, 0.06),
            rgba(0, 255, 0, 0.02),
            rgba(0, 0, 255, 0.06)
          ),
          var(--text-background);
        background-size:
          100% 2px,
          3px 100%;
        width: 600px;
        position: relative;
        opacity: ${!windowVisible ? 0 : 1};
        height: ${!windowVisible ? 0 : 'auto'};
        overflow: ${!windowVisible ? 'hidden' : 'visible'};
        z-index: 5;
        box-shadow:
          -3px 0 0 0 var(--border-color),
          3px 0 0 0 var(--border-color),
          0 -3px 0 0 var(--border-color),
          0 3px 0 0 var(--border-color),
          0px 0px 55px 25px var(--glow-color);
      }

      @media (max-width: 600px) {
        section {
          /* width: 300px; */
        }
      }

      @media (max-height: 500px) {
        section {
          height: ${!windowVisible ? 0 : 'auto'};
        }
      }
      slot {
        padding: 2em;
        padding: 2em 1em;
        display: block;
      }

      ninja-button#close {
        position: absolute;
        left: 0;
        top: 0;
        margin: 10px;
        z-index: 2;
      }

      ninja-button#open {
        transition: 0.5s ease-in-out;
        position: absolute;
        left: 10px;
        top: 10px;
        opacity: ${!windowVisible ? 1 : 0};
        height: ${!windowVisible ? 'auto' : 0};
      }
    </style>
    <div class="wrapper">
      <ninja-button
        id="open"
        title="Open"
        icon="bars"
        onclick="${toggleVis(true)}"
      ></ninja-button>
      <section>
        <ninja-button
          id="close"
          icon="times"
          size="20"
          onclick="${toggleVis(false)}"
          solid
        ></ninja-button>
        ${head && html`<h2>${head}</h2>`}
        <slot></slot>
      </section>
    </div>
  `,
};
