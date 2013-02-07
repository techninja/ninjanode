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

  // DEBUG Data placeholder
  var shipData = {
    id: id,
    name: 'TESTSHIP',
    style: 'a',
    pos: {x:550, y:100, d:135}
  };

  console.log('Creating ship: ' + id);
  ships.addShip(shipData);

  // Send out list of all existing ships (including the new one)
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
  console.log('Existing ship update: ', out);
  io.sockets.emit('shipstat', out);

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