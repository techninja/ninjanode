import { html, store } from 'hybrids';
import { InputBind, ActiveBindingState } from 'models';
import { bindableGameActions, bindableInterfaceDevices } from 'data';

const deleteBind = (id) => () => {
  const bind = store.get(InputBind, id);
  store.set(bind, null);
};

// Depending on bindState, set the icon and label for the button for a specific command.
const getAddBind = (
  command,
  { listenCommand, heardTrigger, heardDevice, error, lastHeard }
) => {
  const justHeard = `${heardDevice}-${heardTrigger}`;
  const addBind = {
    icon: 'plus',
    label: 'Add Binding',
    error,
  };

  // If we're listening for the current command, swap it out.
  if (listenCommand === command) {
    addBind.label = 'Press a Button!';
    addBind.icon = 'question';

    // Did something get pressed?
    if (heardTrigger) {
      addBind.label = `Pressed: \n[${heardDevice}: ${heardTrigger}] ${!error ? 'Confirm?' : ''}`;
      addBind.icon = !error ? 'check-circle' : 'octagon-times';

      // Double press to confirm without error.
      if (!error && justHeard === lastHeard) {
        handleAddBinding(command)();
      }
    }
  }

  return addBind;
};

const getCommandBindings = (binds, bindState) => {
  const commands = {};

  // Move through all bindable commands and set them up (allows for unbound commands).
  Object.entries(bindableGameActions).forEach(
    ([command, { name: label, icon }]) => {
      commands[command] = {
        label,
        addBind: getAddBind(command, bindState),
        icon: icon.name,
        command,
        bindList: [],
      };
    }
  );

  // Add stored binds to each command.
  binds.forEach(({ id, device, trigger, command }) => {
    // Is this the only one? This feels dumb.
    const triggerLabel = trigger === ' ' ? 'Space bar' : trigger;

    const deviceIcon = `trans-${bindableInterfaceDevices[device].icon}`;
    const deviceLabel = bindableInterfaceDevices[device].name;

    // Push the bind into the array for the command.
    commands[command].bindList.push({
      id,
      device,
      deviceIcon,
      deviceLabel,
      trigger,
      triggerLabel,
    });
  });

  // Return the flat array as we don't need the command grouping keys anymore.
  return Object.values(commands);
};

const handleAddBinding = (command) => () => {
  const bindState = store.get(ActiveBindingState);

  // Not listening, start!
  if (!bindState.listenCommand) {
    store.set(ActiveBindingState, { listenCommand: command });
  } else {
    // If we have device and trigger without an error, save the bind!
    if (!bindState.error) {
      store.set(InputBind, {
        device: bindState.heardDevice,
        trigger: bindState.heardTrigger,
        command,
      });
    }

    // Stop listening, clear all state.
    store.set(ActiveBindingState, null);
  }
};

export const NinjaControls = {
  tag: 'ninja-controls',
  // controlCallback: controlInputBind,
  // settings: () => store.get(UserSettings),
  binds: () => store.get([InputBind]),
  bindState: () => store.get(ActiveBindingState),

  render: ({ binds, bindState }) => html`
    <style>
      :host {
        color: var(--button-text);
      }
      .commands {
        margin: 11px;
        box-shadow:
          -3px 0 0 0 var(--border-color),
          3px 0 0 0 var(--border-color),
          0 -3px 0 0 var(--border-color),
          0 3px 0 0 var(--border-color);
        padding: 11px;
        overflow-y: scroll;
        max-height: 250px;
        display: grid;
        grid-template-columns: 1fr;
        grid-gap: 10px;
      }

      .command {
        box-shadow:
          -2px 0 0 0 var(--border-color),
          2px 0 0 0 var(--border-color),
          0 -2px 0 0 var(--border-color),
          0 2px 0 0 var(--border-color);
        padding: 6px;
      }

      .command header {
        background-color: blue;
        padding: 4px;
        border-radius: 20px;
        font-family: var(--head-font);
        font-size: 19px;
      }

      .binds > * {
        margin: 10px;
      }

      .bind {
        border: 1px solid var(--border-color);
        padding: 8px;
        display: grid;
        font-size: 17px;
        align-items: center;
        grid-template-columns: 60px 100px 1fr 40px;
      }

      ninja-button b {
        height: 51px;
        display: flex;
        align-items: center;
      }
    </style>
    <div>
      <div class="commands">
        ${getCommandBindings(binds, bindState).map(
          ({ command, icon, label, addBind, bindList }) => html`
            <div class="command">
              <header>
                <ninja-icon
                  name=${icon}
                  id=${`${icon}-${command}`}
                ></ninja-icon>
                <label for=${`${icon}-${command}`}>${label}</label>
              </header>
              <div class="binds">
                ${bindList.map(
                  ({ id, deviceIcon, deviceLabel, triggerLabel }) =>
                    html`<div class="bind" key=${id}>
                      <ninja-icon
                        color="limegreen"
                        name=${`${deviceIcon}`}
                        size="40"
                      ></ninja-icon>
                      <label>${deviceLabel}</label>
                      <label>Button: ${triggerLabel}</label>
                      <ninja-button
                        size="20"
                        icon="trash"
                        desc="Remove"
                        onclick=${deleteBind(id)}
                      ></ninja-button>
                    </div>`
                )}
                <ninja-button
                  icon=${addBind.icon}
                  text=${addBind.label}
                  type=${addBind.error ? 'error' : 'primary'}
                  full-width
                  solid
                  font-size="17"
                  onclick=${handleAddBinding(command)}
                >
                  ${addBind.error && html`<b>${addBind.error}</b>`}
                </ninja-button>
              </div>
            </div>
          `
        )}
      </div>
    </div>
  `,
};
