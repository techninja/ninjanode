/**
 * @file Chat window feature definition.
 */
import { html, store } from 'hybrids';
import { AppState, ChatState } from 'models';

const toggleVis = (chatVisible) => () => {
  const { windowVisible } = store.get(AppState);
  if (chatVisible && windowVisible) {
    // Hide main window if trying to access chat.
    store.set(AppState, { chatVisible, windowVisible: false });
  } else {
    store.set(AppState, { chatVisible });
  }
};

const textInput = (host, { keyCode, target }) => {
  // Enter pressed
  if (keyCode === 13) {
    const newMessage = target.value.trim();
    if (newMessage) {
      store.set(ChatState, { newMessage });
    }
    host.input.value = '';
  }
};

const messagesAttribute = (host) => {
  // Scroll to bottom for chat updates.
  if (host.shadowRoot) {
    const container = host.shadowRoot.querySelector('.messages');
    container.scrollTop = container.scrollHeight;
  }

  // Return a reference to the messages for building the chat data.
  return store.get(ChatState).messages;
};

const visibleAttribute = (host) => {
  const { chatVisible } = store.get(AppState);

  if (chatVisible) {
    host.shadowRoot?.querySelector('input').focus();
  } else {
    host.shadowRoot?.querySelector('input').blur();
  }
  return chatVisible;
};

export const NinjaChat = {
  tag: 'ninja-chat',
  visible: visibleAttribute,
  messages: messagesAttribute,
  input: ({ render }) => render().querySelector('input'),
  joined: () => store.get(AppState).joined,
  windowVisible: () => store.get(AppState).windowVisible,

  render: ({ visible, messages, joined, windowVisible }) => html`
    <style>
      :host {
        display: block;
      }
      .wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: 0.5s ease-in-out;
        min-height: ${!visible ? 0 : '100vh'};
      }
      .messages {
        height: calc(100% - 40px);
        overflow-y: scroll;
      }
      .visible {
        height: 300px;
      }
      input {
        background: none repeat scroll 0 0 transparent;
        border-color: #444444 -moz-use-text-color;
        border-image: none;
        border-style: solid none;
        border-width: 1px 0;
        bottom: 0.5em;
        color: #aaffff;
        font-family: monospace;
        font-size: 1.1em;
        height: 35px;
        position: absolute;
        width: 96%;
      }
      ul {
        display: block;
        height: 90%;
        list-style: none outside none;
        margin: 0;
        overflow-y: scroll;
        padding: 0;
      }
      li {
        font-size: 1.2em;
        color: #6ce26c;
      }
      section {
        overflow: hidden;
        max-width: 600px;
        position: absolute;
        bottom: 10px;
        left: 10px;
        opacity: ${!visible ? 0 : 1};
        height: ${!visible ? 0 : '70%'};
        background-color: rgba(0, 0, 25, 0.5);
        border: 1px solid #444444;
        color: #fff;
        font-size: 16px;
        padding: 1em;
        font-family: monospace;
        border-radius: 0em 1em;
        transition: 0.5s ease-in-out;
        width: 100%;
      }
      ninja-button#open {
        z-index: 2;
        transition: 0.5s ease-in-out;
        position: absolute;
        left: 10px;
        top: ${windowVisible ? '10px' : '70px'};
        background-color: gray;
        padding: 0.3em;
        padding-bottom: 0.1em;
        border-radius: 0.5em;
        opacity: ${!visible ? 1 : 0};
        height: ${!visible ? 'auto' : 0};
      }
      li.system {
        color: red;
      }
      li.self {
        color: yellow;
      }
    </style>
    <div class="wrapper">
      <ninja-button
        id="open"
        title="Open Chat"
        icon="comment"
        onclick="${toggleVis(true)}"
      ></ninja-button>
      <section>
        <ul class="messages">
          ${messages.map(
            ({ type, message }) => html`<li class=${type}>${message}</li>`
          )}
        </ul>
        <input
          title="hello"
          placeholder=${joined
            ? 'Type your message and press enter to chat'
            : 'Join the game to chat'}
          disabled=${!joined}
          type="text"
          onkeyup=${textInput}
          onblur=${toggleVis(false)}
        />
      </section>
    </div>
  `,
};
