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
      ships.addShip(data);
      emitAllShips();
    }
  });

  // Client disconnected! Let everyone else know...
  clientSocket.on('disconnect', function (){
    console.log('Disconnected ship: ' + id);
    var shipStat = {};
    shipStat[id] = {status: 'destroy'};
    io.sockets.emit('shipstat', shipStat);
    ships.shipRemove(id);
  });

  // Broadcast incoming chats to all clients
  clientSocket.on('chat', function (data) {
    io.sockets.emit('chat', data);
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
        //ships.shipSetFire(id);
    }
  });
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

// Main loop to run processing for all ship positions, collisions, projectiles
// Also compiles changed positions and sends out to all clients
setInterval(function(){
  ships.processShipFrame();
  var positions = ships.getAllPos();
  var out = {};
  var usefulCount = 0;

  // Only add to the output json that has changed since last send
  for (var id in positions){
    if (lastData[id] != positions[id].str) {
      lastData[id] = positions[id].str;
      out[id] = positions[id].pos;
      usefulCount++;
    }
  }

  // Only *if* there's useful data to be sent, send only that pos data to all clients
  if (usefulCount) {
    io.sockets.emit('pos', out);
  }

}, 60);


// Every 5 Minutes clear out lastData cache (frees memory from disconnected clients)
setInterval(function(){
  lastData = {};
}, 5 * 60 * 1000);