/**
 * @file Ninja Ships ninjanode main clientside handler for all network
 * communication and html element management.
 */

import { io } from "/socket.io/socket.io.esm.min.js";

export class ShipSocket {
  // Socket ID and base controller
  id;
  socket;

  hasConnected = false;

  constructor(socketURL) {
    this.socket = io(socketURL, { reconnect: false, transports: ["websocket"] });
    this.socket.on('connect', () => {
      // Shortcut to our session id
      this.id = this.socket.id;
      this.hasConnected = true;
    });

    // Bind disconnect.
    this.socket.on('disconnect', (reason, details) => {
      console.error(`Connection failed: ${reason}`, details);
    });
  }

  // Actually join the game! Happens once connection screen is submitted
  join(shipData) {
    // Send the ship data! User will have to wait for server to relay the
    // new ship back to them before the ship will exist locally
    shipData.status = "create";
    this.socket.emit('shipstat', shipData);
  }

  // Sends chat messages
  sendChat(msg) {
    this.socket.emit('chat', { msg });
  }

  // Sends key commands to the server for the user
  key(e, commandName) {
    var out = {
      s: e.type == 'keyup' ? 0 : 1, // Status
      c: commandName // Command
    }

    // If mouse / touch event, send the x/y pos
    if (e.type == 'mousetouch') {
      out.d = e.angle;
    }

    this.socket.emit('key', out);
  }
}

export default ShipSocket;
