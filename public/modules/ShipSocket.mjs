/**
 * @file Ninja Ships ninjanode main clientside handler for all network
 * communication and html element management.
 */

import { io } from '/socket.io/socket.io.esm.min.js';

export class ShipSocket {
  // Socket ID and base controller
  id;
  socket;

  hasConnected = false;

  constructor(socketURL) {
    const uri = socketURL ?? `${location.protocol}//${location.host}/`;
    this.socket = io(uri, {
      reconnect: false,
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      // Shortcut to our session id
      this.id = this.socket.id;
      this.hasConnected = true;
    });

    // Bind disconnect.
    this.socket.on('disconnect', (reason, details) => {
      console.log(`Disconnected: ${reason}`, details);
    });
  }

  // Actually join the game! Happens once connection screen is submitted
  join(shipData) {
    // Send the ship data! User will have to wait for server to relay the
    // new ship back to them before the ship will exist locally
    this.socket.emit('shipstat', { ...shipData, status: 'create' });
  }

  disconnect() {
    return this.socket.disconnect();
  }

  // Sends chat messages
  sendChat(msg) {
    this.socket.emit('chat', { msg });
  }

  // Sends key commands to the server for the user
  key(e, commandName) {
    const out = {
      s: e.type == 'keyup' ? 0 : 1, // Status
      c: commandName, // Command
    };

    // If mouse / touch event, send the x/y pos
    if (e.type == 'mousetouch') {
      out.d = e.angle;
    }

    this.socket.emit('key', out);
  }
}

export default ShipSocket;
