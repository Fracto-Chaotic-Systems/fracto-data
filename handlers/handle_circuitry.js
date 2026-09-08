import FractoFastCalc from "../../../sdk/FractoFastCalc.js";
import { magnitude, normalize, scale, sub } from "./orbitals/orbitals_utils.js";
import {
  optimize_polarity,
  sample_curve,
  solve_coefficients,
} from "./orbitals/hermite.js";
import { sample_radial_sweep } from "./orbitals/radial_sweep.js";

const SAMPLES_PER_ORBITAL_INTERVAL = 50;
const MAX_SAMPLE_COUNT = 65536;
const INTERPOLATION_HERMITE = "hermite";
const INTERPOLATION_RADIAL_SWEEP = "radial_sweep";

/**
 * Calculate the principal complex square root used by the cardioid-root
 * construction.
 *
 * @param {{re: number, im: number}} point Complex input.
 * @returns {{re: number, im: number}} Principal complex square root.
 */
const complex_sqrt = (point) => {
  const size = magnitude(point);
  const real_part = Math.sqrt(Math.max(0, (size + point.re) / 2));
  const imaginary_part = Math.sqrt(Math.max(0, (size - point.re) / 2));
  return {
    re: real_part,
    im: point.im < 0 ? -imaginary_part : imaginary_part,
  };
};

/**
 * Calculate Q, the cardioid-root point used as the normal origin.
 *
 * @param {{re: number, im: number}} focal_point Mandelbrot focal point P.
 * @returns {{re: number, im: number}} Q = (1 - sqrt(1 - 4P)) / 2.
 */
const get_cardioid_root = (focal_point) =>
  scale(
    sub(
      { re: 1, im: 0 },
      complex_sqrt(sub({ re: 1, im: 0 }, scale(focal_point, 4))),
    ),
    0.5,
  );

/**
 * Run the deep orbit calculation and normalize its point representation.
 * A repeated terminal point, when present, is removed so the orbit remains
 * cyclic without duplicating its starting point.
 *
 * @param {number} re Real component of the focal point.
 * @param {number} im Imaginary component of the focal point.
 * @returns {{points: Array<{re: number, im: number}>|undefined, pattern: number|undefined}}
 *   Ordered orbit points and the calculator's detected pattern.
 */
const get_orbital_points = (re, im) => {
  const calculation = FractoFastCalc.calc(re, im);
  const points = calculation?.orbital_points?.map((point) => ({
    re: point.x,
    im: point.y,
  }));
  if (
    points?.length > 1 &&
    magnitude(sub(points[points.length - 1], points[0])) <= 1e-12
  ) {
    points.pop();
  }
  return { points, pattern: calculation?.pattern };
};

/**
 * Build a normal-length vector at each orbit point. Each vector follows the
 * ray from Q to the point and is scaled by the average adjacent edge length.
 *
 * @param {Array<{re: number, im: number}>} points Ordered orbit points.
 * @param {{re: number, im: number}} focal_point Focal point P.
 * @returns {Array<{re: number, im: number}>} Scaled normal vectors.
 */
const get_normals = (points, focal_point) => {
  const cardioid_root = get_cardioid_root(focal_point);
  return points.map((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const incoming = sub(point, previous);
    const outgoing = sub(next, point);
    const velocity = (magnitude(incoming) + magnitude(outgoing)) / 2;
    return scale(normalize(sub(point, cardioid_root)), velocity);
  });
};

/**
 * Generate a parameterized smooth curve around a periodic Mandelbrot orbit.
 *
 * The endpoint accepts `GET /circuitry` query parameters:
 * - `re`, `im` (required): finite focal-point coordinates P.
 * - `samples` (optional): output count, clamped to 2 through 65,536. The
 *   default is 50 samples per orbital interval plus the closing sample.
 * - `looped_points` (optional boolean): reverses Hermite normal orientation.
 * - `optimize_polarity` (optional boolean): exhaustively tests Hermite normal
 *   polarity patterns for small orbits and scores their smoothness.
 * - `interpolation` (optional): `hermite` (default) or `radial_sweep`.
 *
 * Both modes use FractoFastCalc to find the orbit and return `{t, C}` samples,
 * orbit cardinality, sample count, Q, and interpolation metadata. Hermite
 * mode also returns polarity optimization metadata. Radial-sweep mode uses
 * Q as its polar origin and intentionally ignores Hermite-only options.
 *
 * Responses:
 * - `200`: sampled curve and metadata.
 * - `400`: invalid coordinates or unsupported interpolation mode.
 * - `200`: a valid request whose point is outside the Mandelbrot set. In this
 *   case `orbit_status` and `message` explain why `result` is empty.
 * - `422`: no periodic orbit with at least two points was found for a result
 *   other than the explicit `pattern=0` outside-set outcome.
 *
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {import('express').Response} JSON response sent to the client.
 */
export const handle_circuitry = (req, res) => {
  const re = Number(req.query.re);
  const im = Number(req.query.im);
  const looped_points = [true, "true", 1, "1"].includes(
    req.query.looped_points,
  );
  const optimize_polarity_pattern = [true, "true", 1, "1"].includes(
    req.query.optimize_polarity,
  );
  const interpolation = req.query.interpolation || INTERPOLATION_HERMITE;
  if (!Number.isFinite(re) || !Number.isFinite(im)) {
    return res.status(400).json({ error: "re and im must be finite numbers" });
  }
  if (
    ![INTERPOLATION_HERMITE, INTERPOLATION_RADIAL_SWEEP].includes(interpolation)
  ) {
    return res.status(400).json({
      error: `Unknown circuitry interpolation: ${interpolation}`,
      supported: [INTERPOLATION_HERMITE, INTERPOLATION_RADIAL_SWEEP],
    });
  }
  const orbit = get_orbital_points(re, im);
  if (orbit?.pattern === 0) {
    return res.status(200).json({
      result: [],
      cardinality: 0,
      samples: 0,
      Q: null,
      interpolation,
      looped_points: false,
      optimize_polarity: false,
      polarity_pattern: null,
      polarity_score: null,
      polarity_metrics: null,
      polarity_exhaustive: false,
      in_mandelbrot_set: false,
      orbit_status: "outside_mandelbrot_set",
      message:
        "The requested focal point is outside the Mandelbrot set; no periodic orbit is available for circuitry rendering.",
    });
  }
  const points = orbit?.points;
  if (!points || points.length < 2) {
    return res.status(422).json({
      error: "No periodic orbit found by FractoFastCalc",
    });
  }
  const normals = get_normals(points, { re, im });
  const cardioid_root = get_cardioid_root({ re, im });
  const default_sample_count = points.length * SAMPLES_PER_ORBITAL_INTERVAL + 1;
  const sample_count = Math.min(
    MAX_SAMPLE_COUNT,
    Math.max(2, Number(req.query.samples) || default_sample_count),
  );
  if (interpolation === INTERPOLATION_RADIAL_SWEEP) {
    return res.status(200).json({
      result: sample_radial_sweep(points, cardioid_root, sample_count),
      cardinality: points.length,
      samples: sample_count,
      Q: cardioid_root,
      interpolation,
      looped_points: false,
      optimize_polarity: false,
      polarity_pattern: null,
      polarity_score: null,
      polarity_metrics: null,
      polarity_exhaustive: false,
    });
  }
  const optimized = optimize_polarity_pattern
    ? optimize_polarity(points, normals, looped_points, cardioid_root)
    : {
        coefficients: solve_coefficients(points, normals, looped_points),
        pattern: null,
        score: null,
        metrics: null,
        exhaustive: false,
      };
  return res.status(200).json({
    result: sample_curve(optimized.coefficients, points.length, sample_count),
    cardinality: points.length,
    samples: sample_count,
    Q: cardioid_root,
    interpolation,
    looped_points,
    optimize_polarity: optimize_polarity_pattern,
    polarity_pattern: optimized.pattern,
    polarity_score: optimized.score,
    polarity_metrics: optimized.metrics,
    polarity_exhaustive: optimized.exhaustive,
  });
};
