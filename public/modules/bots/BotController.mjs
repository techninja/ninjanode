/**
 * @file NinjaNode Bot controller library
 * Logic and behavior for bots.
 */
import getChat from './getChat.mjs';
import getName from './getName.mjs';
import BotControllerBase from './BotControllerBase.mjs';

/**
 * Plane Flight Notes: Nov 2023
 * 
 * Behavior loop:
 * - Pick target if none
 * - Turn towards selected target
 * - Move forward
 * - Check for obstacles (noting radius)
 *   - Turn to avoid
 *   - Return to target once safe
 * - Fire if ship within "screen" range
 * - Random mine planting at interval?
 * - Set behavior state with Emoji? (patrolling, seeking, happy, etc)
 * - Defensive option, same team?
 * - Quake style chat for events
 *  
 * General todo:
 * - UI renderer component (renderer takes )
 * 
 * 
 */

export class BotController extends BotControllerBase {
  tickRate = 150;

  constructor(socket, name = null) {
    super(socket);

    // Bot joins immediately for now.
    this.socket.socket.on('connect', () => {
      this.socket.join({
        name: name ?? getName(),
        style: 'b',
      });
    });

    // Start the brain cycle!
    setInterval(() => {
      this.thoughtTick();
    }, this.tickRate);
  }

  mine() {
    this.socket.key({
      type: 'keydown'
    }, 'm');
  }

  goALittleForward() {
    if (!this.keyState.u) {
      this.setCommand('u', true);
      setTimeout(() => {
        this.setCommand('u', false);
      }, 500);
    }
  }

  // Pick a target (first for now), return ID.
  findTarget() {
    // console.log('Find target...', Object.keys(this.ships).length, this.target);
    // Short circuit for no ships.
    if (!Object.keys(this.ships).length) return;

    // Short circuit for existing target.
    if (this.target && this.ships[this.target]) return;

    // Clear target for new selection.
    this.target = null;

    // Only pick non-exploding ships.
    Object.entries(this.ships).forEach(([id, ship]) => {
      if (!ship.exploding && !this.target) {
        this.target = id;
        this.actionChat('target_locked');
      }
    });
  }

  lostTarget(action) {
    this.actionChat(action);
    this.target = null;
  }

  actionChat(action) {
    const targetName = this.ships[this.target]?.name ?? 'Nobody';
    this.sendChat(getChat(action, targetName));
  }

  onTargetHit({ source }) {
    console.log('Child hit', source, this.id);
    if (source == this.id) {
      this.actionChat('target_hit');
    }
  }

  onTargetBoom() {
    this.lostTarget('target_boom');
  }

  onTargetDisconnect() {
    this.lostTarget('target_disconnect');
  }

  getMoveToTarget(target) {
    const targetAngleDeg = this.getAngleToTarget();
    const mePos = this.me.pos;

    if (this.isPointingAtTarget()) {
      this.stopRotation();

      if (this.getDistanceToTarget() < 1000) {
        this.fire();
      }
      return;
    }

    // console.log('Relative angle', targetAngleDeg, mePos.d);

    if (mePos.d > targetAngleDeg) {
      this.moveLeft();
    } else {
      this.moveRight();
    }

    this.goALittleForward();

    return ;
  }

  thoughtTick() {
    const actions = {};

    // Without a target, look for one.
    if (!this.target) {
      this.findTarget();
    } else {
      actions.move = this.getMoveToTarget(this.target);
    }
    
  }

}

export default BotController;
