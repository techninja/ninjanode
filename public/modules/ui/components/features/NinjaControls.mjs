import { html, store } from 'hybrids';
import { UserSettings, InputBind } from 'models';
import { bindableGameActions, bindableInterfaceDevices } from 'data';

const setVal =
  (key) =>
  (host, { detail }) => {
    store.set(UserSettings, { [key]: detail.isOn });
  };

const getCommandBindings = (binds) => {
  const commands = {};

  binds.forEach(({ id, device, trigger, command }) => {
    // Setup base storage for the command
    if (!commands[command]) {
      const action = bindableGameActions[command];
      commands[command] = {
        label: action.name,
        icon: action.icon.name,
        command,
        foo: true,
        bindList: [],
      };
    }

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

export const NinjaControls = {
  tag: 'ninja-controls',
  settings: () => store.get(UserSettings),
  binds: () => store.get([InputBind]),

  render: ({ settings, binds }) => html`
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
    </style>
    <div>
      <!-- <span>
        Mouse Controls:
        <ninja-toggle
          is-on=${settings.mouseControls}
          onchange=${setVal('mouseControls')}
        ></ninja-toggle>
      </span> -->
      <div class="commands">
        ${getCommandBindings(binds).map(
          ({ command, icon, label, bindList }) => html`
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
                      ></ninja-button>
                    </div>`
                )}
                <ninja-button
                  icon="plus"
                  text="Add Binding"
                  full-width
                  solid
                ></ninja-button>
              </div>
            </div>
          `
        )}
      </div>
    </div>
  `,
};
