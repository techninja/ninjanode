/**
 * @file ninjanode main node.js server file!
 * - Install with 'npm install', requires express & socket.io
 * - Run with 'node ninjaserver.js [port]' replace "[port]" with HTTP port,
 * if run without argument, defaults to port 4242
 * - Once running, visit localhost:[port] and you'll be up and running!
 */

import sanitizer from 'sanitizer';
import express from 'express';
import { Server as SocketServer } from 'socket.io';
import http from 'http';

import { Game } from './game/Game.mjs';

const args = process.argv.splice(2);
const port = args[0] ? args[0] : 4242;
const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, { log: false });

let lastData = {}; // Ensures duplicate data for positions isn't sent
const lastShieldData = {}; // Ensures duplicate data for shield values isn't sent
const lastPowerUpData = {}; // Ensures duplicate data for powerup values isn't sent
const lastPowerUpOrbData = {}; // Ensures duplicate data for powerup orbs isn't sent
const users = { count: 0, playerCount: 0 }; // ID keyed object to hold on to user data for stats

// Ninjanode game simulation controller class.
const game = new Game();

// Start express hosting the site from "public" folder on the given port
server.listen(port);
app.use('/', express.static('public'));

// Map frontend node modules to public static file endpoints.
// node_modules/from -> /to
const frontendNodeMaps = {
  'pixi.js/dist': 'pixi',
  'pixi-filters/dist': 'pixi-filters',
  'pixi-viewport/dist': 'pixi-viewport',
  'hybrids/src': 'hybrids',
  '@barvynkoa/particle-emitter': 'particle-emitter',
  '@hackernoon/pixel-icon-library': 'icons',
};

for (const sourcePath in frontendNodeMaps) {
  const destPath = frontendNodeMaps[sourcePath];
  app.use(`/${destPath}`, express.static(`node_modules/${sourcePath}`));
}

console.log('ninjanode server listening on localhost:' + port);

// ninjanode API!
// Return the entire users object, with players, names, kill/death stats etc.
app.get('/users', function (req, res) {
  res.set('Content-Type', 'application/json');
  res.send(JSON.stringify(users));
});

// Return base game data
app.get('/game', function (req, res) {
  res.set('Content-Type', 'application/json');
  res.send(JSON.stringify(game.config));
});

// Return just the numbers of playing and lobby users
app.get('/users/count', function (req, res) {
  res.set('Content-Type', 'application/json');
  res.send(
    JSON.stringify({
      lobby: users.count - users.playerCount,
      players: users.playerCount,
    })
  );
});

// All websockets client connect/disconnect management
io.sockets.on('connection', function (clientSocket) {
  const id = clientSocket.id;

  users.count++;
  users[id] = {
    status: 'lobby',
    name: '',
    type: '',
    started: new Date().getTime(),
  };

  // User is expected to 'connect' immediately, but isn't in game until they send
  // their name, ship type, etc.
  console.log('New user connected: ' + id);

  // Send out list of existing ships & projectiles for this new client (gets sent to everyone)
  emitAllShips(id);
  emitAllProjectiles(id);
  emitAllPowerUps(id);
  emitAllPNBITS(id);

  // This client's new ship data recieved! Create it.
  clientSocket.on('shipstat', function (data) {
    if (data.status == 'create') {
      // New ship!

      // Populate data fields.
      data.name = sanitizer.escape(data.name.substring(0, 20));
      data.style = sanitizer.sanitize(data.style.substring(0, 1));
      data.id = id;

      // Existing user, setting new ship.
      if (users[id].status !== 'lobby') {
        console.log('Changing ship type for user: ' + id + ': ' + data.name);
        game.ships[id].changeStyle(data.style);
      } else {
        // New user ship.
        console.log('Creating ship for user: ' + id + ': ' + data.name);

        users.playerCount++;
        users[id].deaths = 0;
        users[id].kills = 0;
        users[id].status = 'playing';
        game.addShip({ ...data, callbacks: { hit: shipHit, boom: shipBoom } });

        emitSystemMessage(id, 'join'); // Must send after create...
      }

      // Only store verified and cleaned user input data
      const s = game.ships[id];
      users[id].name = s.name;
      users[id].type = s.config.name;

      emitAllShips();
    }
  });

  // Client disconnected! Let everyone else know...
  clientSocket.on('disconnect', function () {
    console.log('Disconnected user: ' + id);

    users.count--; // Remove from total user count

    // Only if the connected socket was playing...
    if (users[id].status == 'playing') {
      users.playerCount--; // Remove from player count

      // Send ship destroy and disconnect message
      const shipStat = {};
      shipStat[id] = { status: 'destroy' };
      emitSystemMessage(id, 'disconnect'); // Must send before delete...
      io.sockets.emit('shipstat', shipStat);
      game.removeShip(id);
    }
    delete users[id];
  });

  // Broadcast incoming chats to all clients
  clientSocket.on('chat', function (data) {
    console.log('Chat:', game.ships[id].name, 'says:', data.msg);
    io.sockets.emit('chat', {
      type: 'chat',
      msg: sanitizer.escape(data.msg),
      id: id,
    });
  });

  // Keypresses from individual clients
  clientSocket.on('key', function (data) {
    const ship = game.ships[id];
    if (!ship) return;

    switch (data.c) {
      case 'u': // Up (thrust forward)
        ship.setThrust(data.s ? 1 : 0);
        break;
      case 'd': // Down (thrust back)
        ship.setThrust(data.s ? -1 : 0);
        break;
      case 'l':
      case 'r': // Turn Right/Left
        ship.setTurn(data.s ? data.c : false);
        break;
      case 'b': // Set/unset spawn beacon to current position
        if (data.s) {
          ship.setSpawnPos();
          emitBeaconUpdate(id);
        }
        break;
      case 's':
      case 'f': // Main/Secondary Fire
        if (data.s) {
          ship.fire(projectileCreate, projectileDestroy, data.c == 'f' ? 0 : 1);
        }
        break;
      case 'm': // Mouse / touch control
        ship.setTouch(data.s ? data.d : false);
    }
  });

  // Handle projectile creation emit
  function projectileCreate() {
    const p = {};

    p[id + '_' + this.id] = {
      shipId: id,
      status: 'create',
      pos: this.pos,
      weaponId: this.weaponId,
      style: this.style,
      type: this.type,
    };
    io.sockets.emit('projstat', p);
  }

  // Handle projectile destruction emit
  function projectileDestroy() {
    const p = {};
    p[id + '_' + this.id] = {
      shipId: id,
      status: 'destroy',
      type: this.type,
    };
    io.sockets.emit('projstat', p);
  }

  // Send out ship hit status
  function shipHit(data) {
    const out = {};
    let includeScore = false;
    out[data.target.id] = {
      status: 'hit',
      type: data.type,
      source: data.source.id,
      weapon: data.weapon ? data.weapon.type : 'none',
    };

    // Send a system message for death if ship to ship collision...
    if (data.type == 'collision') {
      users[data.source.id].deaths++;
      users[data.target.id].deaths++;
      includeScore = true;
      emitSystemMessage(data.source.id, data.type, data.target.id);
    }

    // Send a system message for death if ship to PNBITS collision
    if (data.type == 'pnbcollision' && data.target.shieldPowerStatus == 0) {
      users[data.target.id].deaths++;
      includeScore = true;
      emitSystemMessage(data.target.id, data.type, data.source.name);
    }

    // ...or if target shield power is 0
    if (data.type == 'projectile' && data.target.shieldPowerStatus == 0) {
      users[data.source.id].kills++;
      users[data.target.id].deaths++;
      includeScore = true;
      emitSystemMessage(data.source.id, data.type, data.target.id);
    }

    // Only if the score has changed... include it with the hit
    if (includeScore) {
      out[data.target.id].scores = {};

      // If the source is a user (not an inamate object)
      if (users[data.source.id]) {
        out[data.target.id].scores[data.source.id] = {
          kills: users[data.source.id].kills,
          deaths: users[data.source.id].deaths,
        };
      }

      out[data.target.id].scores[data.target.id] = {
        kills: users[data.target.id].kills,
        deaths: users[data.target.id].deaths,
      };
    }

    io.sockets.emit('shipstat', out);
  }

  // Send out ship exploding status
  function shipBoom(data) {
    const out = {};
    out[data.id] = {
      status: 'boom',
      stage: data.stage,
    };
    io.sockets.emit('shipstat', out);
  }
});

// Send out shipstat for every ship to everyone (for creation)
function emitAllShips(targetID) {
  const listShips = game.ships;
  const out = {};

  for (const id in listShips) {
    out[id] = {
      status: 'create',
      name: listShips[id].name,
      style: listShips[id].style,
      shieldStyle: listShips[id].config.shield.style,
      pos: listShips[id].pos,
      spawnPoint: listShips[id].spawnPoint,
      score: { kills: users[id].kills, deaths: users[id].deaths },
    };
  }

  if (Object.keys(out).length) {
    if (targetID) {
      // TODO: Get targetID to send to JUST that socket.io ID!
    }
    io.sockets.emit('shipstat', out);
  }
}

// Send out positions for every new ship position to everyone
function emitShipPositionUpdates() {
  const positions = game.getAllPos();
  const out = {};

  // Only add to the output json that has changed since last send
  for (const id in positions) {
    if (lastData[id] != positions[id].str) {
      lastData[id] = positions[id].str;
      out[id] = positions[id].pos;
      out[id].vel = positions[id].vel;
    }
  }

  // Only *if* there's useful data to be sent, send only that pos data to all clients
  if (Object.keys(out).length) {
    io.sockets.emit('pos', out);
  }
}

// Send out shield amounts for every new shield change to everyone
function emitShipShieldUpdates() {
  const { ships } = game;
  const out = {};

  // Only add to the output json that has changed since last send
  for (const id in ships) {
    const ship = ships[id];
    let roundedPercent =
      (ship.shieldPowerStatus * 100) / ship.config.shield.max;

    roundedPercent = Math.round(roundedPercent / 5) * 5;

    if (lastShieldData[id] != roundedPercent) {
      lastShieldData[id] = roundedPercent;
      out[id] = {
        status: 'shield',
        amount: roundedPercent,
      };
    }
  }

  // Only *if* there's useful data to be sent, send that data to all clients
  if (Object.keys(out).length) {
    io.sockets.emit('shipstat', out);
  }
}

// Send out updates on powerup orb visibility
function emitPowerUpOrbUpdates() {
  const { powerups } = game;
  const out = {};

  // Only add to the output json that has changed since last send
  for (const i in powerups) {
    if (lastPowerUpOrbData[i] != powerups[i].visible) {
      lastPowerUpOrbData[i] = powerups[i].visible;
      out[i] = {
        visible: powerups[i].visible,
      };
    }
  }

  // Only *if* there's useful data to be sent, send that data to all clients
  if (Object.keys(out).length) {
    io.sockets.emit('powerupstat', out);
  }
}

// Send out updates on powerup use
function emitShipPowerUpUpdates() {
  const { ships } = game;
  const out = {};

  // Only add to the output json that has changed since last send
  for (const id in ships) {
    const list = ships[id].powerups.active.join(' ');
    if (lastPowerUpData[id] != list && list) {
      lastShieldData[id] = list;
      out[id] = {
        status: 'powerup',
        addClasses: list,
        removeClasses: ships[id].powerups.inactive.join(' '),
      };
    }
  }

  // Only *if* there's useful data to be sent, send that data to all clients
  if (Object.keys(out).length) {
    io.sockets.emit('shipstat', out);
  }
}

// Send out positions for every projectile position to everyone
function emitProjectilePositionUpdates() {
  const projectiles = game.getActiveProjectiles();
  const out = {};

  // Filter out non-moving projectiles, and simplify output to just positions
  for (const i in projectiles) {
    const proj = projectiles[i];
    if (proj.config.speed) {
      out[i] = {
        x: Math.round(proj.pos.x * 100) / 100,
        y: Math.round(proj.pos.y * 100) / 100,
        d: proj.pos.d,
      };
    }
  }

  if (Object.keys(out).length) {
    io.sockets.emit('projpos', out);
  }
}

// Send out positions for beacon updates
function emitBeaconUpdate(id) {
  const ship = game.ships[id];
  const out = {};

  out[id] = ship.spawnPoint;

  io.sockets.emit('shipbeaconstat', out);
}

// Send out projstat for every projectile to everyone (for creation on connect)
function emitAllProjectiles(targetID) {
  const projectiles = game.getActiveProjectiles();
  const out = {};

  for (const id in projectiles) {
    const proj = projectiles[id];

    out[id] = {
      shipId: proj.shipId,
      status: 'create',
      pos: proj.pos,
      noSound: true, // Don't play the sound for bulk create
      weaponId: proj.weaponId,
      style: proj.style,
      type: proj.type,
    };
  }

  if (Object.keys(out).length) {
    if (targetID) {
      // TODO: Get targetID to send to JUST that socket.io ID!
    }
    io.sockets.emit('projstat', out);
  }
}

// Send out pustat for every powerup to everyone (for creation on connect)
function emitAllPowerUps(targetID) {
  const { powerups } = game;
  const out = {};

  for (const id in powerups) {
    out[id] = {
      pos: powerups[id].pos,
      cssClass: powerups[id].type,
      visible: powerups[id].visible,
    };
  }

  if (Object.keys(out).length) {
    if (targetID) {
      // TODO: Get targetID to send to JUST that socket.io ID!
    }
    io.sockets.emit('powerupstat', out);
  }
}

// Send out pnbitsstat for every PNBITS to everyone (for creation on connect)
function emitAllPNBITS(targetID) {
  const { pnbits } = game;
  const out = {};

  for (const id in pnbits) {
    out[id] = {
      pos: pnbits[id].pos,
      cssClass: pnbits[id].config.cssClass,
      radius: pnbits[id].radius,
    };
  }

  if (Object.keys(out).length) {
    if (targetID) {
      // TODO: Get targetID to send to JUST that socket.io ID!
    }
    io.sockets.emit('pnbitsstat', out);
  }
}

// Send out system messages
function emitSystemMessage(id, action, target) {
  const out = {
    type: 'system',
    action: action,
    id: id,
    target: target,
  };
  io.sockets.emit('chat', out);
}

// Main loop to run processing for all ship positions, collisions, projectiles
// Also compiles changed positions and sends out to all clients
setInterval(function () {
  game.processFrame();
  emitShipShieldUpdates();
  emitShipPositionUpdates();
  emitProjectilePositionUpdates();
  emitShipPowerUpUpdates();
  emitPowerUpOrbUpdates();
}, 60);

// Every 5 Minutes clear out lastData cache (frees memory from disconnected clients)
setInterval(
  function () {
    lastData = {};
  },
  5 * 60 * 1000
);
