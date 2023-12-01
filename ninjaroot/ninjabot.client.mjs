/**
 * @file NinjaNode Bot controller library
 * Logic and behavior for bots.
 */


class BotController {
  socket;

  constructor(socket, name) {
    this.socket = socket;

    // Bot joins immediately?
    this.socket.socket.on('connect', () => {
      this.socket.join({
        name, style: 'b',
      });
    });

    // Start the brain cycle!
    setInterval(() => {
      this.thoughtTick();
    }, 1000);
  }

  thoughtTick() {
    this.socket.key({
      type: 'keydown'
    }, 'f');
  }


}

export default BotController;
