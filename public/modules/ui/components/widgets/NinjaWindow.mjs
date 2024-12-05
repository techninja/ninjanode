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
      }

      section {
        transition: 0.5s ease-in-out;
        overflow: hidden;
        background-color: #a0a0a0;
        max-width: 600px;
        padding-top: 30px;
        box-shadow: 0 0 25px 17px rgba(200, 200, 200, 0.4);
        position: relative;
        opacity: ${!windowVisible ? 0 : 1};
        height: ${!windowVisible ? 0 : 'auto'};
        min-width: 525px;
        z-index: 5;
        box-shadow:
          -3px 0 0 0 white,
          3px 0 0 0 white,
          0 -3px 0 0 white,
          0 3px 0 0 white;
      }

      @media (max-width: 600px) {
        section {
          min-width: 380px;
        }
      }

      h2 {
        border-bottom: 0.1em solid var(--text-color);
        color: var(--text-color);
        font-family: 'Black Ops One', sans-serif;
        text-transform: lowercase;
        padding-left: 0.2em;
        font-weight: 300;
        position: absolute;
        top: -15px;
        left: 57px;
        font-size: 30px;
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
      }

      ninja-button#open {
        transition: 0.5s ease-in-out;
        position: absolute;
        left: 10px;
        top: 10px;
        background-color: gray;
        padding: 0.3em;
        padding-bottom: 0.1em;
        border-radius: 0.5em;
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
