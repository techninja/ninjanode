/**
 * @file ninjanode powerup definitions.
 */

module.exports = [
  {
    id: 'ghost', // Machine name and base class
    name: "Space Ghost", // Name displayed to user
    rarity: 0.5, // 1 is common, 0 is never spawned
    respawnTime: 120,
    size: 64,
    active: { // Effective time, as soon as it's picked up'
      time: 15,
      cssClass: 'ghost-active'
    },
    end: { // Time at end, removed from effect time
      time: 5,
      cssClass: 'ghost-end'
    },
    skipAlters: {
      collision_ship2ship: function(source, target) {

        if (source.powerUps.list['ghost'] && source.powerUps.list['ghost'].active) {
          return true;
        }

        if (target.powerUps.list['ghost'] && target.powerUps.list['ghost'].active) {
          return true;
        }

        return false;
      }
    }
  },
  {
    id: 'triple', // Machine name and base class
    name: "Triple Shot", // Name displayed to user
    rarity: 0.5, // 1 is common, 0 is never spawned
    respawnTime: 120,
    size: 64,
    active: { // Effective time, as soon as it's picked up'
      time: 15,
      cssClass: 'triple-active'
    },
    end: { // Time at end, removed from effect time
      time: 5,
      cssClass: 'triple-end'
    },
    alters: {
      fire_count: function(def, source) {

        if (source.powerUps.list['triple'] && source.powerUps.list['triple'].active) {
          return 3;
        }

        return def;
      }
    }
  }
];
