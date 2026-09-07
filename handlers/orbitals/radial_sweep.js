/**
 * Radial-sweep interpolation helpers for orbital circuitry.
 *
 * The radial-sweep implementation can be moved here as a focused module
 * while the circuitry endpoint remains responsible for request handling.
 */

import {
  get_rotation_direction,
  magnitude,
  sub,
  wrap_angle,
} from "./orbitals_utils.js";

/**
 * Sample an orbit by sweeping angle around the supplied radial origin and
 * interpolating the distance from that origin between orbital points.
 *
 * @param {Array<{re: number, im: number}>} points Ordered orbital points.
 * @param {{re: number, im: number}} origin Center of the radial sweep.
 * @param {number} sample_count Number of samples to produce.
 * @returns {Array<{t: number, C: {re: number, im: number}}>} Sampled path.
 */
export const sample_radial_sweep = (points, origin, sample_count) => {
  const polar_points = points.map((point) => ({
    angle: Math.atan2(point.im - origin.im, point.re - origin.re),
    radius: magnitude(sub(point, origin)),
  }));
  const direction = get_rotation_direction(points, origin);
  const sweep_positions = [0];
  for (let index = 1; index < polar_points.length; index += 1) {
    const delta =
      direction *
      wrap_angle(polar_points[index].angle - polar_points[index - 1].angle);
    sweep_positions.push(sweep_positions[index - 1] + Math.max(delta, 1e-9));
  }
  const closing_delta =
    direction *
    wrap_angle(
      polar_points[0].angle - polar_points[polar_points.length - 1].angle,
    );
  const period = sweep_positions.at(-1) + Math.max(closing_delta, 1e-9);
  return Array.from({ length: sample_count }, (_, index) => {
    const sweep = (period * index) / (sample_count - 1);
    let segment = sweep_positions.length - 1;
    for (
      let candidate = 0;
      candidate < sweep_positions.length - 1;
      candidate += 1
    ) {
      if (sweep <= sweep_positions[candidate + 1]) {
        segment = candidate;
        break;
      }
    }
    const start = sweep_positions[segment];
    const end =
      segment === sweep_positions.length - 1
        ? period
        : sweep_positions[segment + 1];
    const local = Math.max(0, Math.min(1, (sweep - start) / (end - start)));
    const radius_at = (offset) =>
      polar_points[
        (segment + offset + polar_points.length) % polar_points.length
      ].radius;
    const radius = Math.max(
      0,
      0.5 *
        (2 * radius_at(0) +
          (-radius_at(-1) + radius_at(1)) * local +
          (2 * radius_at(-1) -
            5 * radius_at(0) +
            4 * radius_at(1) -
            radius_at(2)) *
            local ** 2 +
          (-radius_at(-1) +
            3 * radius_at(0) -
            3 * radius_at(1) +
            radius_at(2)) *
            local ** 3),
    );
    const angle = polar_points[0].angle + direction * sweep;
    return {
      t: angle,
      C: {
        re: origin.re + radius * Math.cos(angle),
        im: origin.im + radius * Math.sin(angle),
      },
    };
  });
};
