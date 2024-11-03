/**
 * @file ninjanode powerup definitions.
 */

export const powerupTypes = [
  {
    id: 'ghost', // Machine name and base class
    name: 'Space Ghost', // Name displayed to user
    rarity: 0.5, // 1 is common, 0 is never spawned
    respawnTime: 120,
    size: 64,
    active: {
      // Effective time, as soon as it's picked up'
      time: 15,
      cssClass: 'ghost-active',
    },
    end: {
      // Time at end, removed from effect time
      time: 5,
      cssClass: 'ghost-end',
    },
    skipAlters: {
      collision_ship2ship: (source, target) => {
        if (
          source.powerups.list['ghost'] &&
          source.powerups.list['ghost'].active
        ) {
          return true;
        }

        if (
          target.powerups.list['ghost'] &&
          target.powerups.list['ghost'].active
        ) {
          return true;
        }

        return false;
      },
    },
  },
  {
    id: 'triple', // Machine name and base class
    name: 'Triple Shot', // Name displayed to user
    rarity: 0.5, // 1 is common, 0 is never spawned
    respawnTime: 120,
    size: 64,
    active: {
      // Effective time, as soon as it's picked up'
      time: 15,
      cssClass: 'triple-active',
    },
    end: {
      // Time at end, removed from effect time
      time: 5,
      cssClass: 'triple-end',
    },
    alters: {
      fire_count: (def, source) => {
        if (
          source.powerups.list['triple'] &&
          source.powerups.list['triple'].active
        ) {
          return 3;
        }

        return def;
      },
    },
  },
];
