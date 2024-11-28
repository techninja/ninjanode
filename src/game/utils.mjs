import { gameConfig } from './gameConfig.mjs';

/**
 *  Get a random starting position
 */
export const getRandomPos = (angleDivisibleBy) => {
  angleDivisibleBy = angleDivisibleBy ? angleDivisibleBy : 1;

  let angle = Math.floor(Math.random() * 355 + 1);
  angle = Math.round(angle / angleDivisibleBy) * angleDivisibleBy;

  const usefulArea = (gameConfig.playArea / 4) * 3; // Limit spawn pos to 3/4 of the play area

  return {
    x: Math.floor(Math.random() * usefulArea),
    y: Math.floor(Math.random() * usefulArea),
    d: angle,
  };
};

/**
 * Get a random item from a list based on weight
 * @param {array} list
 *   Array of objects, assumes the following array item object keys:
 *     rarity {float}: probability for this item to be chosen, 0 to 1
 * @returns {object} selected from the list
 */
export const getWeightedRandomItem = (list) => {
  // Compile the weights from rarity in each array item
  const weights = list.map(({ rarity }) => rarity);
  const totalWeight = weights.reduce((prev, cur) => prev + cur);
  const randomNum = rand(0, totalWeight);
  let weightSum = 0;

  for (let i = 0; i < list.length; i++) {
    weightSum += weights[i];
    weightSum = +weightSum.toFixed(2);

    if (randomNum <= weightSum) {
      return list[i];
    }
  }
};

/**
 * Get a random value within a min/max
 * @param {int} || {array} min
 *  Lowest allowed value, or array of min/max
 * @param {int} max
 *  Highest allowed value
 * @returns {float} value between min and max
 */
export const rand = (min, max) => {
  // If it's an array (object), assume it holds min and max together
  if (typeof min == 'object') {
    max = min[1];
    min = min[0];
  }
  return Math.random() * (max - min) + min;
};

export const getId = (prefix) => `${prefix}-${Math.floor(rand(1000, 9000))}`;

export const circleIntersects = (pos1, radius1, pos2, radius2) => {
  // Get center of circles (as positions are all top left corner centered)
  const x0 = pos1.x + radius1;
  const y0 = pos1.y + radius1;

  const x1 = pos2.x + radius2;
  const y1 = pos2.y + radius2;

  // Find the distance between the centerpoints
  // TODO: Probably use something faster than sqrt...
  const distance = Math.sqrt(Math.pow(x0 - x1, 2) + Math.pow(y0 - y1, 2));

  // If the distance between them is less than the radius, it's inside!
  if (distance < radius2) {
    return true;
  }

  // Return true if the distance is shorter than difference between the radii
  if (
    distance >= radius1 + radius2 ||
    distance <= Math.abs(radius1 - radius2)
  ) {
    return false;
  } else {
    return true;
  }
};

/**
 * Private utility function get angle of the line between two points
 * @param {object} point1
 *  X, Y coordinate object of first point
 * @param {object} point2
 *  X, Y coordinate object of second point
 * @returns {float} Angle in absolute radians
 */
export const lineAngle = (point1, point2) => {
  let theta = Math.atan2(-(point1.y - point2.y), point1.x - point2.x);
  if (theta < 0) theta += 2 * Math.PI;
  return theta;
};

/**
 * Get distance between two points
 * @param {object} point1
 *  X, Y coordinate object of first point
 * @param {object} point2
 *  X, Y coordinate object of second point
 * @returns {float} distance between first and second point
 */
export const lineDistance = (point1, point2) => {
  let xs = 0;
  let ys = 0;

  xs = point2.x - point1.x;
  xs = xs * xs;

  ys = point2.y - point1.y;
  ys = ys * ys;

  return Math.sqrt(xs + ys);
};
