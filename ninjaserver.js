/**
 * @file ninjanode main node.js server file!
 * - Install with 'npm install', requires express & socket.io
 * - Run with 'node ninjaserver.js [port]' replace "[port]" with HTTP port,
 * if run without argument, defaults to port 4242
 * - Once running, visit localhost:[port] and you'll be up and running!
 *
 */

var arguments = process.argv.splice(2);
var port = arguments[0] ? arguments[0] : 4242;
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server, {log: false});
var ships = require('./ninjaroot/ninjaships.node.js');
var lastData = {}; // Ensures duplicate data for positions isn't sent
var lastShieldData = {} // Ensures duplicate data for shield values isn't sent

// Start express hosting the site from "ninjaroot" folder on the given port
server.listen(port);
app.use("/", express.static(__dirname + '/ninjaroot'));
console.log('ninjanode server listening on localhost:' + port);

// When a websockets client connects...
io.sockets.on('connection', function (clientSocket) {
  var id = clientSocket.id;

  // User is expected to 'connect' immediately, but isn't in game until they send
  // their name, ship type, etc.
  console.log('New user connected: ' + id);

  // Send out list of existing ships & projectiles for this new client (gets sent to everyone)
  emitAllShips(id);
  emitAllProjectiles(id);
  emitAllShipTypes(id)

  // This client's new ship data recieved! Create it.
  clientSocket.on('shipstat', function (data) {
    if (data.status == 'create'){ // New ship!
      console.log('Creating ship for user: ' + id);
      data.id = id;
      data.hit = shipHit;
      data.boom = shipBoom;
      data.pos = ships.getRandomPos();
      ships.addShip(data);
      emitAllShips();
      emitSystemMessage(id, 'join'); // Must send after create...
    }
  });

  // Client disconnected! Let everyone else know...
  clientSocket.on('disconnect', function (){
    console.log('Disconnected user: ' + id);
    var shipStat = {};
    shipStat[id] = {status: 'destroy'};
    emitSystemMessage(id, 'disconnect'); // Must send before delete...
    io.sockets.emit('shipstat', shipStat);
    ships.shipRemove(id);
  });

  // Broadcast incoming chats to all clients
  clientSocket.on('chat', function (data) {
    io.sockets.emit('chat', {
      type: 'chat',
      msg: data.msg,
      id: id
    });
  });

  // Keypresses from individual clients
  clientSocket.on('key', function (data) {
    switch (data.c){
      case 'u': // Up (thrust forward)
        ships.shipSetThrust(id, data.s ? 1 : 0); break;
      case 'd': // Down (thrust back)
        ships.shipSetThrust(id, data.s ? -1 : 0); break;
      case 'l':
      case 'r': // Turn Right/Left
        ships.shipSetTurn(id, data.s ? data.c : false); break;
      case 's':
      case 'f': // Main/Secondary Fire
        if (data.s) {
          ships.shipSetFire(id, projectileCreate, projectileDestroy, data.c == 'f' ? 0 : 1);
        }
    }
  });

  // Handle projectile creation emit
  function projectileCreate(data){
    var p = {};
    p[id + '_' + data.id] = {
      shipID: id,
      status: 'create',
      pos: data.pos,
      weaponID: data.weaponID,
      style: data.style,
      type: data.type
    };
    io.sockets.emit('projstat', p);
  }

  // Handle projectile destruction emit
  function projectileDestroy(data){
    var p = {};
    p[id + '_' + data.id] = {
      status: 'destroy'
    };
    io.sockets.emit('projstat', p);
  }

  // Send out ship hit status
  function shipHit(data){
    var out = {};
    out[data.target.id] = {
      status: 'hit'
    };
    io.sockets.emit('shipstat', out);

    // Send a system message for death if collision...
    if (data.type == 'collision'){
      emitSystemMessage(data.source.id, data.type, data.target.id);
    }

    // ...or if target shield power is 0
    if (data.type == 'projectile' && data.target.shieldPowerStatus == 0){
      emitSystemMessage(data.source.id, data.type, data.target.id);
    }
  }

  // Send out ship exploding status
  function shipBoom(data){
    var out = {};
    out[data.id] = {
      status: 'boom',
      stage: data.stage
    };
    io.sockets.emit('shipstat', out);
  }

});

// Send out shipstat for every ship to everyone (for creation)
function emitAllShips(targetID){
  var listShips = ships.shipGet();
  var out = {};

  for (var id in listShips){
    out[id] = {
      status: 'create',
      name: listShips[id].name,
      sounds: [listShips[id].data.weapons[0].data.sound, listShips[id].data.weapons[1].data.sound],
      style: listShips[id].style,
      pos: listShips[id].pos
    }
  }

  if (Object.keys(out).length){
    console.log('Existing ship update: ', out);

    if (targetID){
      // TODO: Get targetID to send to JUST that socket.io ID!
    }
    io.sockets.emit('shipstat', out);
  }
}

// Send out ship types to all users (really uneccesary)
function emitAllShipTypes(id){
  // TODO: Tweak/Add to data?
  io.sockets.emit('shiptypes', ships.shipTypesGet());
}

// Send out positions for every new ship position to everyone
function emitShipPositionUpdates(){
  var positions = ships.getAllPos();
  var out = {};

  // Only add to the output json that has changed since last send
  for (var id in positions){
    if (lastData[id] != positions[id].str) {
      lastData[id] = positions[id].str;
      out[id] = positions[id].pos;
    }
  }

  // Only *if* there's useful data to be sent, send only that pos data to all clients
  if (Object.keys(out).length) {
    io.sockets.emit('pos', out);
  }
}

// Send out shield amounts for every new shield change to everyone
function emitShipShieldUpdates(){
  var vessels = ships.shipGet();
  var out = {};

  // Only add to the output json that has changed since last send
  for (var id in vessels){
    var roundedPercent = (vessels[id].shieldPowerStatus * 100) / vessels[id].data.shieldPower;
    roundedPercent = Math.round(roundedPercent / 5) * 5;

    if (lastShieldData[id] != roundedPercent) {
      lastShieldData[id] = roundedPercent;
      out[id] = {
        status: 'shield',
        amount: roundedPercent
      };
    }
  }

  // Only *if* there's useful data to be sent, send that data to all clients
  if (Object.keys(out).length) {
    io.sockets.emit('shipstat', out);
  }
}

// Send out positions for every projectile position to everyone
function emitProjectilePositionUpdates(){
  var projectiles = ships.getActiveProjectiles();
  var out = {};

  // Filter out non-moving projectiles, and simplify output to just positions
  for (var i in projectiles) {
    var proj = projectiles[i];
    if (proj.data.speed){
      out[i] = {
        x: Math.round(proj.pos.x * 100)/100,
        y: Math.round(proj.pos.y * 100)/100,
        d: proj.pos.d
      };
    }
  }

  if (Object.keys(out).length) {
    io.sockets.emit('projpos', out);
  }
}

// Send out projstat for every projectile to everyone (for creation on connect)
function emitAllProjectiles(targetID){
  var projectiles = ships.getActiveProjectiles();
  var out = {};

  for (var id in projectiles){
    var proj = projectiles[id];

    out[id] = {
      shipID: proj.shipID,
      status: 'create',
      pos: proj.pos,
      noSound: true, // Don't play the sound for bulk create
      weaponID: proj.weaponID,
      style: proj.style,
      type: proj.type
    }
  }

  if (Object.keys(out).length) {
    console.log('Existing Projectile update: ', out);

    if (targetID){
      // TODO: Get targetID to send to JUST that socket.io ID!
    }
    io.sockets.emit('projstat', out);
  }
}

// Send out system messages
function emitSystemMessage(id, action, target){
  var out = {
    type: 'system',
    action: action,
    id: id,
    target: target
  }
  io.sockets.emit('chat', out);
}

// Main loop to run processing for all ship positions, collisions, projectiles
// Also compiles changed positions and sends out to all clients
setInterval(function(){
  ships.processShipFrame();
  emitShipShieldUpdates();
  emitShipPositionUpdates();
  emitProjectilePositionUpdates();
}, 60);


// Every 5 Minutes clear out lastData cache (frees memory from disconnected clients)
setInterval(function(){
  lastData = {};
}, 5 * 60 * 1000);