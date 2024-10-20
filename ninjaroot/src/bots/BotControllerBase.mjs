/**
 * @file NinjaNode Bot controller base class
 * Base network and control implementation for bots
 */

export class BotControllerBase {
  socket;
  id;
  ships = {};
  me = {};
  keyState = {
    l: false,
    u: false,
    r: false,
    d: false,
    f: false,
    s: false,
    b: false,
  }
  target;

  constructor(socket) {
    this.socket = socket;

    this.initializeBindings();
  }

  initializeBindings() {

    // TODO: Setup binds to fill/update the base object with streamed
    // data from sockets, anything it might want. 
    const binds = {
      // chat: this.onNewMessage,
      pos: this.onUpdatePos,
      shipstat: this.onShipStatusUpdate,
      connect: () => this.id = this.socket.id,
      // shipbeaconstat: this.onBeaconsStatusUpdate,
      // shiptypes: (d) => this.buildShipSelect(d),
      // projstat: this.onProjectileStatusUpdate,
      // projpos: this.updateProjectilePos,
      // powerupstat: this.onPowerUpStatusUpdate,
      // pnbitsstat: this.onPnbitsStatusUpdate,
      // disconnect: this.onDisconnect,
    };

    Object.entries(binds).forEach(([key, callback]) => {
      this.socket.socket.on(key, (d) => {
        callback.call(this, d);
      });
    });
  }

  onShipStatusUpdate(updates) {
    // Update each ship position in data
    Object.entries(updates).forEach(([id, { status, ...d }]) => {
      switch (status) {
        case 'create':
          this.setShipData(id, d);
          break;
        case 'destroy':
          if (this.target === id) {
            this.onTargetDisconnect();
          }
          delete this.ships[id];
          break;
        case 'boom':
          if (d.stage === 'start') this.setShipData(id, { exploding: true });
          if (d.stage === 'complete') this.setShipData(id, { exploding: false });
          
          if (this.target === id && d.stage === 'start') {
            console.log('Death', id, this.target, d);
            this.onTargetBoom();
          }
          break;
        case 'hit':
          if (this.target === id) {
            this.onTargetHit(d);
          }
      
        default:
          break;
      }
    });
  }

  // Placeholder for child overloading.
  onTargetHit(d) {
    // No code needed.
    console.log('BaseHit', d);
  }

  // Placeholder for child overloading.
  onTargetBoom() {
    // No code needed.
    console.log('BaseBoom');
  }

  // Placeholder for child overloading.
  onTargetDisconnect() {
    // No code needed.
    console.log('BaseDisconnect');
  }

  setShipData(id, data) {
    if (this.socket.socket.id === id) {
      this.me = { ...this.me, ...data }; // Merge in data.
    } else {
      this.ships[id] = { ...this.ships[id], ...data }; // Merge in data.
    }
  }

  onUpdatePos(ships) {
    Object.entries(ships).forEach(([id, pos]) => {
      this.setShipData(id, { pos });
    });
  }

  sendChat(message) {
    this.socket.sendChat(message);
  }

  fire(rate = 1000) {
    // Don't do anything if we're firing
    if (this.keyState.f) return;

    // Otherwise fire.
    this.setCommand('f', true);

    // Max attempted fire rate 1hz.
    setTimeout(() => {
      this.setCommand('f', false);
    }, rate);
  }

  moveLeft() {
    if (this.keyState.r) this.setCommand('r', false);
    this.setCommand('l', true);
  }

  moveRight() {
    if (this.keyState.l) this.setCommand('l', false);
    this.setCommand('r', true);
  }

  stopRotation() {
    this.setCommand('l', false);
    this.setCommand('r', false);
  }

  getDistanceToTarget() {
    const targetPos = this.ships[this.target].pos;
    const mePos = this.me.pos;

    return Math.round(Math.sqrt(Math.pow(targetPos.x - mePos.x, 2) + Math.pow(targetPos.y - mePos.y, 2)));
  }

  isPointingAtTarget() {
    const range = 10;
    const targetAngleDeg = this.getAngleToTarget();
    const mePos = this.me.pos;

    if (mePos.d > targetAngleDeg - range && mePos.d < targetAngleDeg + range) {
      return true;
    }
    return false;
  }

  getAngleToTarget() {
    const targetPos = this.ships[this.target].pos;
    const mePos = this.me.pos;
    const targetAngle = Math.atan2(targetPos.y - mePos.y, targetPos.x - mePos.x);
    let targetAngleDeg = targetAngle * (180 / Math.PI) + 90;

    if (targetAngleDeg < 0) {
      targetAngleDeg += 360;
    }

    return Math.round(targetAngleDeg);
  }

  // Boolean state backed command setter.
  setCommand(command, state) {
    // Only do anything if we're changing the state
    if (this.keyState[command] === state) {
      return;
    }

    // Store the new command state.
    this.keyState[command] = state;

    // Set keydown/keyup with change.
    this.socket.key({
      type: state ? 'keydown' : 'keyup',
    }, command);
  } 
}

export default BotControllerBase;
