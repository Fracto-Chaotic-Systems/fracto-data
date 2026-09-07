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

const complex_sqrt = (point) => {
  const size = magnitude(point);
  const real_part = Math.sqrt(Math.max(0, (size + point.re) / 2));
  const imaginary_part = Math.sqrt(Math.max(0, (size - point.re) / 2));
  return {
    re: real_part,
    im: point.im < 0 ? -imaginary_part : imaginary_part,
  };
};

const get_cardioid_root = (focal_point) =>
  scale(
    sub(
      { re: 1, im: 0 },
      complex_sqrt(sub({ re: 1, im: 0 }, scale(focal_point, 4))),
    ),
    0.5,
  );

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
  return points;
};

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
 * Sample a smooth closed curve around the periodic Mandelbrot orbit for c.
 * Query parameters: re, im (required), samples (optional output count), and
 * looped_points and optimize_polarity (optional booleans), and interpolation
 * (optional, either `hermite` or `radial_sweep`). When
 * optimize_polarity=true, exhaustive polarity patterns are evaluated using
 * arc length, tangent variation, and directional angular sweep as the
 * objective for small orbits. Orbital
 * points are found with FractoFastCalc, which can iterate for millions of
 * steps when necessary. The normal at each orbital point is the ray from
 * Q = (1 - sqrt(1 - 4P)) / 2 to that point. By default, the curve is sampled
 * 50 times between each pair of orbital points, including both endpoints, so
 * integer values of t are represented exactly. The response is an array of
 * `{t, C}` values, where C is serialized as `{re, im}`. The response also
 * includes `Q`, the cardioid-root center used to define the normals.
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
  const points = get_orbital_points(re, im);
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
  if (
    ![INTERPOLATION_HERMITE, INTERPOLATION_RADIAL_SWEEP].includes(interpolation)
  ) {
    return res.status(400).json({
      error: `Unknown circuitry interpolation: ${interpolation}`,
      supported: [INTERPOLATION_HERMITE, INTERPOLATION_RADIAL_SWEEP],
    });
  }
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
