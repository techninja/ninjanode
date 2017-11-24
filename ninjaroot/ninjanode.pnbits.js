/**
 * @file ninjanode main permanent natural bodies configuration.
 */

module.exports = [
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
