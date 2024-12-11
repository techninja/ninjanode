/**
 * @file ninjanode Ship type configuration.
 */
import { projectileTypes } from './projectileTypes.mjs';

export const shipTypes = {
  a: {
    name: 'Legionnaire',
    topSpeed: 350,
    accelRate: 6.25, // PX Per sec(2)
    drag: 1.5,
    rotationSpeed: 9,
    thrusterPositions: {
      front: [{ angle: -90, distance: 40 }],
      rear: [{ angle: 90, distance: 35 }],
    },
    size: {
      width: 64,
      height: 64,
    },
    shield: {
      max: 100,
      regenRate: 0.3,
      style: 'yellow',
    },
    weapons: [
      { type: 'biglaser', style: 'yellow', fireRate: 475 },
      { type: 'mine', style: 'yellow', fireRate: 5000 },
    ],
  },

  b: {
    name: 'Cygnuss',
    topSpeed: 500,
    accelRate: 5.83,
    drag: 0.5,
    rotationSpeed: 8,
    thrusterPositions: {
      front: [{ angle: -90, distance: 40 }],
      rear: [{ angle: 90, distance: 35 }],
    },
    size: {
      width: 64,
      height: 64,
    },
    shield: {
      max: 100,
      regenRate: 0.2,
      style: 'green',
    },
    weapons: [
      { type: 'energy', style: 'green', fireRate: 250 },
      { type: 'mine', style: 'green', fireRate: 5000 },
    ],
  },

  c: {
    name: 'Scimitar',
    topSpeed: 375,
    accelRate: 15,
    drag: 1.34,
    rotationSpeed: 15,
    thrusterPositions: {
      front: [
        { angle: -130, distance: 25 },
        { angle: -40, distance: 25 },
      ],
      rear: [
        { angle: 60, distance: 35 },
        { angle: 110, distance: 35 },
      ],
    },
    size: {
      width: 64,
      height: 64,
    },
    shield: {
      max: 100,
      regenRate: 0.3,
      style: 'red',
    },
    weapons: [
      { type: 'laser', style: 'red', fireRate: 875 },
      { type: 'mine', style: 'red', fireRate: 5000 },
    ],
  },

  d: {
    name: 'Mongoose',
    topSpeed: 300,
    accelRate: 6.25,
    drag: 8.34,
    rotationSpeed: 15,
    thrusterPositions: {
      front: [{ angle: -90, distance: 40 }],
      rear: [{ angle: 90, distance: 35 }],
    },
    size: {
      width: 64,
      height: 64,
    },
    shield: {
      max: 75,
      regenRate: 0.4,
      style: 'pink',
    },
    weapons: [
      { type: 'biglaser', style: 'pink', fireRate: 375 },
      { type: 'mine', style: 'pink', fireRate: 5000 },
    ],
  },

  e: {
    name: 'Sulaco',
    topSpeed: 300,
    accelRate: 7.25,
    drag: 0.5,
    rotationSpeed: 18,
    thrusterPositions: {
      front: [{ angle: -90, distance: 40 }],
      rear: [{ angle: 90, distance: 35 }],
    },
    size: {
      width: 64,
      height: 64,
    },
    shield: {
      max: 125,
      regenRate: 0.3,
      style: 'purple',
    },
    weapons: [
      { type: 'duallaser', style: 'purple', fireRate: 325 },
      { type: 'mine', style: 'purple', fireRate: 5000 },
    ],
  },

  f: {
    name: 'Excalibur',
    topSpeed: 200,
    accelRate: 20,
    drag: 0.5,
    rotationSpeed: 13,
    thrusterPositions: {
      front: [{ angle: -90, distance: 40 }],
      rear: [{ angle: 90, distance: 35 }],
    },
    size: {
      width: 64,
      height: 64,
    },
    shield: {
      max: 200,
      regenRate: 0.2,
      style: 'blue',
    },
    weapons: [
      { type: 'energy', style: 'blue', fireRate: 325 },
      { type: 'mine', style: 'blue', fireRate: 5000 },
    ],
  },

  g: {
    name: 'Falcon',
    topSpeed: 833.4,
    accelRate: 18.3,
    drag: 1,
    rotationSpeed: 10,
    thrusterPositions: {
      front: [{ angle: -90, distance: 40 }],
      rear: [{ angle: 90, distance: 35 }],
    },
    size: {
      width: 64,
      height: 64,
    },
    shield: {
      max: 75,
      regenRate: 0.2,
      style: 'blue',
    },
    weapons: [
      { type: 'fire', style: 'blue', fireRate: 25 },
      { type: 'mine', style: 'blue', fireRate: 5000 },
    ],
  },
};

const getHighlightableStats = (stats) => {
  const {
    topSpeed,
    accelRate,
    drag,
    rotationSpeed,
    shieldMax,
    shieldRate,
    primaryWeaponRate,
    primaryWeaponDamage,
    primaryWeaponSpeed,
    primaryWeaponLife,
    primaryWeaponForce,
  } = stats;
  return {
    slowFast: {
      topSpeed,
      accelRate,
      primaryWeaponSpeed,
    },
    fastSlow: {
      shieldRate,
      rotationSpeed,
      primaryWeaponRate,
    },
    lowHigh: {
      shieldMax,
      primaryWeaponDamage,
      primaryWeaponLife,
      primaryWeaponForce,
    },
    highLow: {
      drag,
    },
  };
};

// Wrapper for extracting stat comparison keys from the base object.
const getStatVals = (type = 'a') => {
  const {
    topSpeed,
    accelRate,
    drag,
    rotationSpeed,
    shield: { max: shieldMax, regenRate: shieldRate },
    weapons: [
      {
        fireRate: primaryWeaponRate,
        proj: {
          damage: primaryWeaponDamage,
          speed: primaryWeaponSpeed,
          life: primaryWeaponLife,
          knockBackForce: primaryWeaponForce,
        },
      },
      {
        fireRate: secondaryWeaponRate,
        proj: {
          damage: secondaryWeaponDamage,
          speed: secondaryWeaponSpeed,
          life: secondaryWeaponLife,
          knockBackForce: secondaryWeaponForce,
        },
      },
    ],
  } = shipTypes[type];

  return {
    topSpeed,
    accelRate,
    drag,
    rotationSpeed,
    shieldMax,
    shieldRate,
    primaryWeaponRate,
    primaryWeaponDamage,
    primaryWeaponSpeed,
    primaryWeaponLife,
    primaryWeaponForce,
    secondaryWeaponRate,
    secondaryWeaponDamage,
    secondaryWeaponSpeed,
    secondaryWeaponLife,
    secondaryWeaponForce,
  };
};

// Get ratios for all comparable stats vs all ships.
const getCompareStats = (compareType) => {
  // Fill base stats object with keys and initial values.
  const baseStats = getStatVals();

  // Convert stats key values to arrays
  Object.keys(baseStats).forEach((key) => {
    baseStats[key] = [];
  });

  // Move through every ship type and add the values.
  for (const type in shipTypes) {
    const stats = getStatVals(type);

    Object.keys(stats).forEach((key) => {
      baseStats[key].push(stats[key]);
    });
  }

  // Final stat comparison object.
  const shipStats = getStatVals(compareType);

  // Sort final values, calculate ratio.
  Object.keys(baseStats).forEach((key) => {
    baseStats[key].sort((a, b) => a - b);

    // Min/max
    const min = baseStats[key][0];
    const max = baseStats[key][baseStats[key].length - 1];

    // Assume max value, to be reset if min and max aren't the same.
    let statRatio = 1;

    // If min == max, then default to 100%.
    if (min !== max) {
      statRatio = (shipStats[key] - min) / (max - min);
    }

    // Store final ratio for the stat.
    shipStats[key] = statRatio;
  });

  return shipStats;
};

// Append projectile info to each weapon entry.
for (const key in shipTypes) {
  shipTypes[key].weapons.forEach((e, index) => {
    shipTypes[key].weapons[index] = {
      ...shipTypes[key].weapons[index],
      proj: projectileTypes[shipTypes[key].weapons[index].type],
    };
  });
}

// Append calculated comparison stats.
for (const key in shipTypes) {
  shipTypes[key].stats = getCompareStats(key);
}

// Append highlighted best and worst stats.
for (const key in shipTypes) {
  const ship = shipTypes[key];
  const stats = getHighlightableStats(ship.stats);
  const best = {
    label: '',
    ratio: 0,
    flipped: false,
  };

  const worst = {
    label: '',
    ratio: 1,
    flipped: false,
  };

  const labels = {
    slowFast: ['Slow', 'Fast', false],
    fastSlow: ['Fast', 'Slow', true],
    lowHigh: ['Low', 'High', false],
    highLow: ['High', 'Low', true],
  };

  for (const labelType in stats) {
    for (const metric in stats[labelType]) {
      const value = stats[labelType][metric];
      const [, , flipped] = labels[labelType];

      if (!flipped) {
        // Better than best? Add it.
        if (value > best.ratio) {
          best.metric = metric;
          best.ratio = value;
          best.label = `${labels[labelType][1]} ${metric}`;
          best.flipped = false;
        }

        // Worst than worst? Add it.
        if (value < worst.ratio) {
          worst.metric = metric;
          worst.ratio = value;
          worst.label = `${labels[labelType][0]} ${metric}`;
          best.flipped = false;
        }
      } else {
        // Better than best? Add it.
        if (1 - value < best.ratio) {
          best.metric = metric;
          best.ratio = value;
          best.label = `${labels[labelType][1]} ${metric}`;
          best.flipped = true;
        }

        // Worst than worst? Add it.
        if (1 - value > worst.ratio) {
          worst.metric = metric;
          worst.ratio = value;
          worst.label = `${labels[labelType][0]} ${metric}`;
          worst.flipped = true;
        }
      }
    }
  }

  shipTypes[key].stats.highlights = {
    best,
    worst,
  };
}
