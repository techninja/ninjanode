/**
 * @file Ninja Ships ninjanode main clientside handler for all network
 * communication and html element management.
 */

(function () {
  var updateCount = 0;

  setInterval(function(){
    $('.ups span').html(updateCount * 2);
    updateCount = 0;
  }, 500);

  window.ShipSocket = {
    socket : null,

    initialize : function(socketURL) {
      this.socket = io.connect(socketURL);

      // Object array of ships and their elements
      this.dummyShips = {};

      // Bind functions to incoming data
      this.socket.on('chat', this.chat);
      this.socket.on('pos', this.updatePos);
      this.socket.on('shipstat', this.shipStatus);
    },

    join : function(shipData) {
      // Send the ship data! User will have to wait for server to relay the
      // new ship back to them before the ship will exist locally
      shipData.status = "create";
      this.socket.emit('shipstat', shipData);

      this.keys = {
        l: 37,
        u: 38,
        r: 39,
        d: 40,
        f: 32
      };

      var lastKey = '';
      $(window).bind( 'keyup keydown', function(e) {
        // Check for each key binding
        for(var name in ShipSocket.keys){
          if (e.which == ShipSocket.keys[name]){
            var action = name + e.type;

            // Filter out held down key repeats
            if (lastKey != action){
              lastKey = action;
              ShipSocket.key(e, name)
            }
            return false;
          }
        }
      });
    },


    /*
     *  SEND DATA FUNCTIONS =================================================
     */

    // Sends key commands to the server for the user
    key : function(e, name) {
      this.socket.emit('key', {
        s: e.type == 'keyup'? 0 : 1, // Status
        c: name // Command
      });
    },


    /*
     *  RECIEVE DATA HANDLER CALLBACKS ======================================
     */

    // Create / remove local dummy ships
    shipStatus: function(data){
      for (var id in data){
        if (data[id].status == 'create'){
          // Only create locally if it doesn't exist.
          if (!ShipSocket.dummyShips[id]){
            console.log('Create Ship: ', data[id]);
            $('body').append('<ship id="user_' + id + '" class="overlay layer2 ship_' + data[id].style + '"/>');
            ShipSocket.dummyShips[id] = {
              element: $('ship#user_' + id),
              pos: data[id].pos,
              style: data[id].style
            }

            // Send to update to ensure it gets drawn
            var u = {};
            u[id] = data[id].pos;
            ShipSocket.updatePos(u);
          } else {
            console.log('Ignore Create Ship: ', id);
          }
        } else { // Destroy!
          console.log('Remove Ship: ', id);//
          // Remove element and dummy data
          if (ShipSocket.dummyShips[id]){
            ShipSocket.dummyShips[id].element.remove();
            delete ShipSocket.dummyShips[id];
          }
        }
      }
    },

    // Handle ship position data (comes in as [id] : x, y, d)
    updatePos : function(data) {
      // DEBUG
      updateCount++;

      // Update each ship position in data
      for (var id in data){
        if (ShipSocket.dummyShips[id]){
          var d = data[id];
          var s = ShipSocket.dummyShips[id];
          /*if (this.exploding){
            $('#boom_'+ this.element_name).css({
              left:this.pos.x - this.width/2-64, top:this.pos.y+this.height/2-128
            });
          }*/
          s.pos = {x: d.x, y: d.y, d: d.d};

          //console.log (data.pos);
          s.element.css('transform', 'rotate(' + s.pos.d + 'deg)');
          s.element.css('WebkitTransform', 'rotate(' + s.pos.d + 'deg)');
          s.element.css({
            left: s.pos.x,
            top: s.pos.y
          });
        }
      }
    },

    xxx: {}

  };
}());
