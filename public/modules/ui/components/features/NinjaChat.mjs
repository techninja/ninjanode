/**
 * @file Chat window feature definition.
 */
import { html, store } from 'hybrids';
import { AppState, ChatState } from 'models';

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

  render: ({ visible, messages }) => html`
    <style>
      :host {
        display: block;
        position: relative;
        overflow: hidden;
      }
      .wrapper {
        background-color: rgba(0, 0, 25, 0.5);
        border: 1px solid #444444;
        color: #fff;
        font-size: 16px;
        padding: 1em;
        font-family: monospace;
        border-radius: 0em 1em;
        transition: 0.5s ease-in-out;
        height: 0;
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
      li.system {
        color: red;
      }
      li.self {
        color: yellow;
      }
    </style>
    <div class=${{ wrapper: true, visible }}>
      <ul class="messages">
        ${messages.map(
          ({ type, message }) => html`<li class=${type}>${message}</li>`
        )}
      </ul>
      <input type="text" onkeyup=${textInput} />
    </div>
  `,
};
