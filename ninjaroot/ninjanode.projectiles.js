/**
 * @file ninjanode main weapon/projectile definitions.
 */

module.exports = {
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
    sound: 5,
    size: {
      hitRadius: 21,
      width: 64,
      height: 64
    },
    knockBackForce: 10,
    yOffset: -8
  }
};
