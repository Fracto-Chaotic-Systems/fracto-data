/**
 * Hermite interpolation helpers for orbital circuitry.
 *
 * Hermite-specific curve construction can be moved here while the circuitry
 * endpoint remains responsible for request parsing and response formatting.
 */

import {
  add,
  get_rotation_direction,
  magnitude,
  normalize,
  scale,
  sub,
  wrap_angle,
} from "./orbitals_utils.js";

const MAX_EXHAUSTIVE_POLARITY_POINTS = 16;
const POLARITY_SCORE_SAMPLES_PER_INTERVAL = 10;

/** @param {Array<{re: number, im: number}>} values Complex samples. @returns {Array<{re: number, im: number}>} Normalized DFT coefficients. */
const dft = (values) =>
  values
    .map((_, frequency) =>
      values.reduce(
        (sum, value, index) => {
          const angle = (-2 * Math.PI * frequency * index) / values.length;
          return add(sum, {
            re: value.re * Math.cos(angle) - value.im * Math.sin(angle),
            im: value.re * Math.sin(angle) + value.im * Math.cos(angle),
          });
        },
        { re: 0, im: 0 },
      ),
    )
    .map((value) => scale(value, 1 / values.length));

/**
 * Convert orbital positions and normal constraints into Fourier coefficients.
 * @param {Array<{re: number, im: number}>} points Orbital positions.
 * @param {Array<{re: number, im: number}>} normals Normal constraints.
 * @param {boolean} looped_points Reverse normal orientation when true.
 * @param {Array<number>|null} polarity_pattern Optional normal polarity signs.
 * @returns {Array<{re: number, im: number}>} Fourier curve coefficients.
 */
export const solve_coefficients = (
  points,
  normals,
  looped_points = false,
  polarity_pattern = null,
) => {
  const count = points.length;
  const alpha = (2 * Math.PI) / count;
  const positions = dft(points);
  const normalized_tangents = dft(
    normals.map((normal, index) => {
      // The Hermite coefficient transform applies the quarter-turn needed to
      // convert this normal constraint into a curve tangent. Passing the ray
      // directly avoids rotating it twice. The default orientation preserves
      // traversal direction; looped_points reverses it.
      const polarity = polarity_pattern?.[index] || 1;
      const orientation = looped_points ? -1 : 1;
      return {
        re: (polarity * orientation * normal.re) / alpha,
        im: (polarity * orientation * normal.im) / alpha,
      };
    }),
  );
  const coefficients = new Array(count * 2);
  for (let frequency = 0; frequency < count; frequency += 1) {
    const high = scale(
      sub(
        normalized_tangents[frequency],
        scale(positions[frequency], frequency),
      ),
      1 / count,
    );
    coefficients[frequency + count] = high;
    coefficients[frequency] = sub(positions[frequency], high);
  }
  return coefficients;
};

/** @param {Array<{re: number, im: number}>} coefficients Fourier coefficients. @param {number} period Curve period. @param {number} t Parameter value. @returns {{re: number, im: number}} Evaluated curve point. */
const evaluate_curve = (coefficients, period, t) =>
  coefficients.reduce(
    (point, coefficient, frequency) => {
      const angle = (2 * Math.PI * frequency * t) / period;
      return add(point, {
        re: coefficient.re * Math.cos(angle) - coefficient.im * Math.sin(angle),
        im: coefficient.re * Math.sin(angle) + coefficient.im * Math.cos(angle),
      });
    },
    { re: 0, im: 0 },
  );

/**
 * Score a candidate curve by length, tangent variation, reversals, and sweep direction.
 * @param {Array<{re: number, im: number}>} coefficients Fourier coefficients.
 * @param {number} period Curve period.
 * @param {Array<{re: number, im: number}>} orbital_points Original orbit.
 * @param {{re: number, im: number}} origin Scoring origin.
 * @returns {object} Aggregate score and component metrics.
 */
const curve_score = (coefficients, period, orbital_points, origin) => {
  const sample_count = Math.max(
    3,
    period * POLARITY_SCORE_SAMPLES_PER_INTERVAL,
  );
  const samples = [];
  let arc_length = 0;
  let tangent_variation = 0;
  let tangent_reversals = 0;
  let angular_reversals = 0;
  let previous_direction = null;
  let previous_angle = null;
  const rotation_direction = get_rotation_direction(orbital_points, origin);
  for (let index = 0; index <= sample_count; index += 1) {
    const t = (period * index) / sample_count;
    samples.push(evaluate_curve(coefficients, period, t));
  }
  for (let index = 0; index < sample_count; index += 1) {
    const segment = sub(samples[index + 1], samples[index]);
    arc_length += magnitude(segment);
    const direction = normalize(segment);
    const angle = Math.atan2(
      samples[index].im - origin.im,
      samples[index].re - origin.re,
    );
    if (previous_angle !== null) {
      const angular_delta = wrap_angle(angle - previous_angle);
      const directed_delta = rotation_direction * angular_delta;
      if (directed_delta < 0) {
        angular_reversals += directed_delta ** 2;
      }
    }
    previous_angle = angle;
    if (previous_direction) {
      const dot = Math.max(
        -1,
        Math.min(
          1,
          previous_direction.re * direction.re +
            previous_direction.im * direction.im,
        ),
      );
      tangent_variation += Math.acos(dot) ** 2;
      if (dot < 0) {
        tangent_reversals += -dot;
      }
    }
    previous_direction = direction;
  }
  let polygon_length = 0;
  for (let index = 0; index < orbital_points.length; index += 1) {
    const next_index = (index + 1) % orbital_points.length;
    polygon_length += magnitude(
      sub(orbital_points[next_index], orbital_points[index]),
    );
  }
  const normalized_arc_length = arc_length / Math.max(polygon_length, 1e-12);
  const score =
    normalized_arc_length +
    tangent_variation +
    10 * tangent_reversals +
    100 * angular_reversals;
  return {
    score,
    normalized_arc_length,
    tangent_variation,
    tangent_reversals,
    angular_reversals,
    rotation_direction,
  };
};

/** @param {number} point_count Number of orbit points. @param {number} pattern_index Bit-packed polarity pattern. @returns {Array<number>} Polarity signs with the first point fixed positive. */
const polarity_pattern_from_index = (point_count, pattern_index) => {
  const pattern = new Array(point_count).fill(1);
  for (let index = 1; index < point_count; index += 1) {
    pattern[index] = pattern_index & (1 << (index - 1)) ? -1 : 1;
  }
  return pattern;
};

/**
 * Select the lowest-scoring Hermite polarity pattern for a small orbit.
 *
 * @param {Array<{re: number, im: number}>} points Orbital points.
 * @param {Array<{re: number, im: number}>} normals Point normals.
 * @param {boolean} looped_points Whether to reverse normal orientation.
 * @param {{re: number, im: number}} origin Scoring origin.
 * @returns {object} Coefficients and optimization metadata.
 */
export const optimize_polarity = (points, normals, looped_points, origin) => {
  if (points.length > MAX_EXHAUSTIVE_POLARITY_POINTS) {
    return {
      coefficients: solve_coefficients(points, normals, looped_points),
      pattern: null,
      score: null,
      metrics: null,
      exhaustive: false,
    };
  }
  const pattern_count = 2 ** (points.length - 1);
  let best = null;
  for (
    let pattern_index = 0;
    pattern_index < pattern_count;
    pattern_index += 1
  ) {
    const pattern = polarity_pattern_from_index(points.length, pattern_index);
    const coefficients = solve_coefficients(
      points,
      normals,
      looped_points,
      pattern,
    );
    const metrics = curve_score(coefficients, points.length, points, origin);
    if (!best || metrics.score < best.score) {
      best = {
        coefficients,
        pattern,
        score: metrics.score,
        metrics,
        exhaustive: true,
      };
    }
  }
  return best;
};

/**
 * Sample a Hermite coefficient set over one complete period.
 *
 * @param {Array<{re: number, im: number}>} coefficients Fourier coefficients.
 * @param {number} period Curve period.
 * @param {number} sample_count Number of samples to produce.
 * @returns {Array<{t: number, C: {re: number, im: number}}>} Sampled path.
 */
export const sample_curve = (coefficients, period, sample_count) =>
  Array.from({ length: sample_count }, (_, index) => {
    const t = (period * index) / (sample_count - 1);
    return { t, C: evaluate_curve(coefficients, period, t) };
  });
