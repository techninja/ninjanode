/**
 * @file ninjanode main Gameplay specific data: ships, projectiles and power-ups
 */

module.exports.projectileTypes = {
  laser: {
    name: "Death Laser",
    speed: 67.5,
    life: 2500, // How many ms till it dies?
    sound: 3,
    damage: 50,
    size: {
      hitRadius: 20,
      width: 8,
      height: 70
    },
    knockBackForce: 2,
    yOffset: -30
  },
  biglaser: {
    name: "Super Laser",
    damage: 40,
    speed: 60,
    life: 5000,
    sound: 1,
    size: {
      hitRadius: 20,
      width: 8,
      height: 70
    },
    knockBackForce: 4,
    yOffset: -50
  },
  duallaser: {
    name: "Dual Laser",
    damage: 30,
    speed: 53,
    life: 2500,
    sound: 3,
    size: {
      hitRadius: 25,
      width: 25,
      height: 50
    },
    knockBackForce: 3,
    yOffset: -50
  },
  energy : {
    name: "Energy Orb",
    damage: 30,
    speed: 20,
    life: 5500,
    sound: 2,
    size: {
      hitRadius: 21,
      width: 64,
      height: 64
    },
    knockBackForce: 6,
    yOffset: -8
  },
  mine : {
    name: "Mine",
    damage: 100,
    speed: 0,
    life: 86400000,
    sound: 4,
    size: {
      hitRadius: 20,
      width: 40,
      height: 40
    },
    knockBackForce: 5,
    yOffset: 0
  },
  fire : {
    name: "Fire",
    damage: 40,
    speed: 35,
    life: 1000,
    sound: 2,
    size: {
      hitRadius: 21,
      width: 64,
      height: 64
    },
    knockBackForce: 10,
    yOffset: -8
  }
};

module.exports.shipTypes = {
  a: {
    name: 'Legionnaire',
    topSpeed: 21,
    accelRate: 0.375,
    drag: 0.09,
    rotationSpeed: 9,
    shield: {
      max: 100,
      regenRate: 0.3,
      style: 'yellow'
    },
    weapons: [
      {type: 'biglaser', style: 'yellow', fireRate: 475},
      {type: 'mine', style: 'yellow', fireRate: 5000}
    ]
  },
  b: {
    name: 'Cygnuss',
    topSpeed: 30,
    accelRate: 0.35,
    drag: 0.03,
    rotationSpeed: 8,
    shield: {
      max: 100,
      regenRate: 0.2,
      style: 'green'
    },
    weapons: [
      {type: 'energy', style: 'green', fireRate: 250},
      {type: 'mine', style: 'green', fireRate: 5000}
    ]
  },
  c: {
    name: 'Scimitar',
    topSpeed: 22.5,
    accelRate: 0.9,
    drag: 0.08,
    rotationSpeed: 15,
    shield: {
      max: 100,
      regenRate: 0.3,
      style: 'red'
    },
    weapons: [
      {type: 'laser', style: 'red', fireRate: 875},
      {type: 'mine', style: 'red', fireRate: 5000}
    ]
  },
  d: {
    name: 'Mongoose',
    topSpeed: 18,
    accelRate: 0.375,
    drag: 0.03,
    rotationSpeed: 15,
    shield: {
      max: 75,
      regenRate: 0.4,
      style: 'pink'
    },
    weapons: [
      {type: 'biglaser', style: 'pink', fireRate: 375},
      {type: 'mine', style: 'pink', fireRate: 5000}
    ]
  },
  e: {
    name: 'Sulaco',
    topSpeed: 18,
    accelRate: 0.435,
    drag: 0.03,
    rotationSpeed: 18,
    shield: {
      max: 125,
      regenRate: 0.3,
      style: 'purple'
    },
    weapons: [
      {type: 'duallaser', style: 'purple', fireRate: 325},
      {type: 'mine', style: 'purple', fireRate: 5000}
    ]
  },
  f: {
    name: 'Excalibur',
    topSpeed: 12,
    accelRate: 1.2,
    drag: 0.03,
    rotationSpeed: 13,
    shield: {
      max: 200,
      regenRate: 0.2,
      style: 'blue'
    },
    weapons: [
      {type: 'energy', style: 'blue', fireRate: 325},
      {type: 'mine', style: 'blue', fireRate: 5000}
    ]
  },
  g: {
    name: 'Falcon',
    topSpeed: 50,
    accelRate: 1.1,
    drag: 0.06,
    rotationSpeed: 10,
    shield: {
      max: 75,
      regenRate: 0.2,
      style: 'blue'
    },
    weapons: [
      {type: 'fire', style: 'blue', fireRate: 25},
      {type: 'mine', style: 'blue', fireRate: 5000}
    ]
  }
};

module.exports.powerUpTypes = [
  {
    id: 'ghost', // Machine name and base class
    name: "Space Ghost", // Name displayed to user
    rarity: 0.75, // 1 is common, 0 is never spawned
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
    rarity: 0.2, // 1 is common, 0 is never spawned
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

module.exports.pnbitsTypes = [
  {
    major: 'planet',
    minor: 'm', // Earth like
    cssClass: 'planet_a', // Match to styles.css class
    solid: true,  // True is solid material, false is gas giant
    rarity: 0.5, // 1 is common, 0 is never spawned
    ranges: {
      radius: [100, 200],
      density: [1, 3]
    }
  },
  {
    major: 'planet',
    minor: 'g', // Mars like?
    cssClass: 'planet_b', // Match to styles.css class
    solid: true,  // True is solid material, false is gas giant
    rarity: 0.7, // 1 is common, 0 is never spawned
    ranges: {
      radius: [110, 280],
      density: [1, 2]
    }
  },
  {
    major: 'planet',
    minor: 'x', // Venus like?
    cssClass: 'planet_c', // Match to styles.css class
    solid: true,  // True is solid material, false is gas giant
    rarity: 0.3, // 1 is common, 0 is never spawned
    ranges: {
      radius: [110, 180], // Min, Max in pixels
      density: [1, 4] // Sets gravitation attraction based on radius
    }
  },
  {
    major: 'planet',
    minor: 'n', // Jupiter like?
    cssClass: 'planet_d', // Match to styles.css class
    solid: false,  // True is solid material, false is gas giant
    rarity: 0.1, // 1 is common, 0 is never spawned
    ranges: {
      radius: [280, 400],
      density: [3, 5]
    }
  }
];
