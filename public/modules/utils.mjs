// TODO: Unify these utils with the backend utils.

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
