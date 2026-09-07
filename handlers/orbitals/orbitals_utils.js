/**
 * Shared utilities for orbital handlers.
 *
 * Orbital-specific helpers should be added here when they are used by more
 * than one handler, keeping endpoint modules focused on request handling.
 */

/** @param {{re: number, im: number}} a @param {{re: number, im: number}} b @returns {{re: number, im: number}} Difference. */
export const sub = (a, b) => ({ re: a.re - b.re, im: a.im - b.im });

/** @param {{re: number, im: number}} a @param {{re: number, im: number}} b @returns {{re: number, im: number}} Sum. */
export const add = (a, b) => ({ re: a.re + b.re, im: a.im + b.im });

/** @param {{re: number, im: number}} point @param {number} factor @returns {{re: number, im: number}} Scaled point. */
export const scale = (point, factor) => ({
  re: point.re * factor,
  im: point.im * factor,
});

/** @param {{re: number, im: number}} point @returns {number} Euclidean magnitude. */
export const magnitude = (point) => Math.hypot(point.re, point.im);

/** @param {{re: number, im: number}} point @returns {{re: number, im: number}} Unit-length point, or zero when the input is zero. */
export const normalize = (point) => {
  const size = magnitude(point);
  return size === 0 ? { re: 0, im: 0 } : scale(point, 1 / size);
};

/** @param {number} angle Angle in radians. @returns {number} Equivalent angle in [-pi, pi). */
const wrap_angle = (angle) => {
  const full_turn = 2 * Math.PI;
  return ((((angle + Math.PI) % full_turn) + full_turn) % full_turn) - Math.PI;
};

/**
 * Determine the dominant direction in which orbital points rotate around an
 * origin. The result is `1` for counter-clockwise motion and `-1` for
 * clockwise motion.
 *
 * @param {Array<{re: number, im: number}>} points Orbital points in order.
 * @param {{re: number, im: number}} origin Rotation origin.
 * @returns {number} The dominant rotation direction, either `1` or `-1`.
 */
export const get_rotation_direction = (points, origin) => {
  let total_rotation = 0;
  for (let index = 0; index < points.length; index += 1) {
    const next_index = (index + 1) % points.length;
    const current_angle = Math.atan2(
      points[index].im - origin.im,
      points[index].re - origin.re,
    );
    const next_angle = Math.atan2(
      points[next_index].im - origin.im,
      points[next_index].re - origin.re,
    );
    total_rotation += wrap_angle(next_angle - current_angle);
  }
  return total_rotation < 0 ? -1 : 1;
};

export { wrap_angle };
