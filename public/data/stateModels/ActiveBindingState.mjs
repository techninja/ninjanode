/**
 * @file Global active binding state:
 *   Needed to track bindings (and rebinding override) from NinjaControls
 */

export const ActiveBindingState = {
  listenCommand: '', // The single character string we're listening for. Empty when not listening.
  heardTrigger: '', // What the triggered input was last
  heardDevice: '', // One of: keyboard, gamepad, mouse.
  lastHeard: '', // Triggered device and input to validate confirmation.
  error: '', // String handed to user about problem with binding.
};
