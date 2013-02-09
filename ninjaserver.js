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
var lastData = {}; // Ensures duplicate data isn't sent

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

  // Send out list of existing ships for this new client (gets sent to everyone)
  emitAllShips(id);

  // This client's new ship data recieved! Create it.
  clientSocket.on('shipstat', function (data) {
    console.log('Creating ship: ' + data);
    if (data.status == 'create'){ // New ship!
      console.log('Creating ship: ' + id);
      data.id = id;
      data.hit = shipHit;
      data.boom = shipBoom;
      data.pos = {
        x: Math.floor((Math.random()*8)+1)*70,
        y: Math.floor((Math.random()*8)+1)*70,
        d: 0
      };
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
      case 'u':
        ships.shipSetThrust(id, data.s ? 0.2 : 0); break;
      case 'd':
        ships.shipSetThrust(id, data.s ? -0.2 : 0); break;
      case 'l':
      case 'r':
        ships.shipSetTurn(id, data.s ? data.c : false); break;
      case 'f':
        if (data.s) {
          ships.shipSetFire(id, projectileCreate, projectileDestroy);
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

    // Also.. if it's a collision, then they're dead!
    if (data.type == 'collision'){
      emitSystemMessage(data.source.id, data.type, data.target.id);
    } else { // For right now, one shot = one kill
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

// Send out shipstat for every ship to everyone
function emitAllShips(targetID){
  var listShips = ships.shipGet();
  var out = {};
  var shipCount = 0;
  for (var id in listShips){
    shipCount++;
    out[id] = {
      status: 'create',
      name: listShips[id].name,
      style: listShips[id].style,
      pos: listShips[id].pos
    }
  }

  if (shipCount){
    console.log('Existing ship update: ', out);

    if (targetID){
      // TODO: Get targetID to send to JUST that socket.io ID!
    }
    io.sockets.emit('shipstat', out);
  }
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

// Send out positions for every projectile position to everyone
function emitProjectilePositionUpdates(){
  var out = ships.getAllProjectiles();
  if (Object.keys(out).length) {
    io.sockets.emit('projpos', out);
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
  emitShipPositionUpdates();
  emitProjectilePositionUpdates();
}, 60);


// Every 5 Minutes clear out lastData cache (frees memory from disconnected clients)
setInterval(function(){
  lastData = {};
}, 5 * 60 * 1000);