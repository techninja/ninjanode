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
    life: 60000,
    sound: 4,
    size: {
      hitRadius: 20,
      width: 40,
      height: 40
    },
    knockBackForce: 5,
    yOffset: 0
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
  }
};
