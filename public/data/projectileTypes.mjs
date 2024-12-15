/**
 * @file ninjanode main weapon/projectile definitions.
 */

export const projectileTypes = {
  laser: {
    name: 'Death Laser',
    speed: 1125,
    life: 2500, // How many ms till it dies?
    sound: 3,
    sounds: {
      emission: ['laser1'],
      reception: ['hit1', 'hit2'],
    },
    damage: 50,
    size: {
      hitRadius: 20,
      width: 8,
      height: 70,
    },
    knockBackForce: 33.3,
    yOffset: -30,
  },

  biglaser: {
    name: 'Super Laser',
    damage: 40,
    speed: 1000,
    life: 5000,
    sound: 1,
    sounds: {
      emission: ['laser2'],
      reception: ['hit1', 'hit2'],
    },
    size: {
      hitRadius: 20,
      width: 8,
      height: 70,
    },
    knockBackForce: 66,
    yOffset: -50,
  },

  duallaser: {
    name: 'Dual Laser',
    damage: 30,
    speed: 883.4,
    life: 2500,
    sound: 3,
    sounds: {
      emission: ['laser2'],
      reception: ['hit1', 'hit2'],
    },
    size: {
      hitRadius: 25,
      width: 25,
      height: 50,
    },
    knockBackForce: 50,
    yOffset: -50,
  },

  energy: {
    name: 'Energy Orb',
    damage: 30,
    speed: 333,
    life: 5500,
    sound: 2,
    sounds: {
      emission: ['energy'],
      reception: ['hit1', 'hit2'],
    },
    size: {
      hitRadius: 21,
      width: 64,
      height: 64,
    },
    knockBackForce: 100,
    yOffset: -8,
  },

  mine: {
    name: 'Mine',
    damage: 100,
    speed: 0,
    life: 30 * 60 * 1000, // 30 Minutes
    sound: 4,
    sounds: {
      emission: ['mine'],
      reception: ['mineBoom'],
    },
    size: {
      hitRadius: 20,
      width: 40,
      height: 40,
    },
    knockBackForce: 83,
    yOffset: 0,
  },

  fire: {
    name: 'Fire',
    damage: 40,
    speed: 583,
    life: 1000,
    sound: 5,
    sounds: {
      emission: ['flame'],
      reception: ['hit1', 'hit2'],
    },
    size: {
      hitRadius: 21,
      width: 64,
      height: 64,
    },
    knockBackForce: 166,
    yOffset: -8,
  },
};
