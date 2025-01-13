// TODO: Unify these utils with the backend utils.

/**
 * Get distance between two points
 * @param {object} point1
 *  X, Y coordinate object of first point
 * @param {object} point2
 *  X, Y coordinate object of second point
 *
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

/**
 * Get angle of the line between two points
 * @param {object} point1
 *  X, Y coordinate object of first point
 * @param {object} point2
 *  X, Y coordinate object of second point
 * @param {boolean} useRads
 *  Default true, pass false to get degrees.
 *
 * @returns {float} Angle in absolute radians (or degrees)
 */
export const lineAngle = (point1, point2, useRads = true) => {
  let theta = Math.atan2(-(point1.y - point2.y), point1.x - point2.x);
  if (theta < 0) theta += 2 * Math.PI;
  return useRads ? theta : (theta * 180) / Math.PI;
};

/**
 * Map a value from a given range to a given range.
 *
 * @param {number} value
 * @param {number} fromLow
 * @param {number} fromHigh
 * @param {number} toLow
 * @param {number} toHigh
 *
 * @returns {number}
 *   The value scaled to match the output range measured from the input range.
 */
export const valueMap = (value, fromLow, fromHigh, toLow, toHigh) => {
  return ((value - fromLow) * (toHigh - toLow)) / (fromHigh - fromLow) + toLow;
};

/**
 * Pick and return a random item from an array.
 *
 * @param {array} items
 *   Items to choose from.
 * @returns
 */
export const getRando = (items) =>
  items[Math.floor(items.length * Math.random())];
