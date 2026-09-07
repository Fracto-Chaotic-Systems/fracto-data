import FractoFastCalc from "../../../sdk/FractoFastCalc.js";

const SAMPLES_PER_ORBITAL_INTERVAL = 50;
const MAX_SAMPLE_COUNT = 65536;

const add = (a, b) => ({re: a.re + b.re, im: a.im + b.im});
const sub = (a, b) => ({re: a.re - b.re, im: a.im - b.im});
const scale = (a, factor) => ({re: a.re * factor, im: a.im * factor});
const magnitude = point => Math.hypot(point.re, point.im);

const normalize = point => {
   const size = magnitude(point);
   return size === 0 ? {re: 0, im: 0} : scale(point, 1 / size);
};

const get_orbital_points = (re, im) => {
   const calculation = FractoFastCalc.calc(re, im);
   return calculation?.orbital_points?.map(point => ({
      re: point.x,
      im: point.y,
   }));
};

const get_tangents = points => points.map((point, index) => {
   const previous = points[(index - 1 + points.length) % points.length];
   const next = points[(index + 1) % points.length];
   const incoming = sub(point, previous);
   const outgoing = sub(next, point);
   const bisector_sum = add(normalize(incoming), normalize(outgoing));
   const direction = magnitude(bisector_sum) === 0
      ? normalize(outgoing)
      : normalize(bisector_sum);
   const velocity = (magnitude(incoming) + magnitude(outgoing)) / 2;
   return scale(direction, velocity);
});

const dft = values => values.map((_, frequency) => values.reduce(
   (sum, value, index) => {
      const angle = -2 * Math.PI * frequency * index / values.length;
      return add(sum, {
         re: value.re * Math.cos(angle) - value.im * Math.sin(angle),
         im: value.re * Math.sin(angle) + value.im * Math.cos(angle),
      });
   }, {re: 0, im: 0})
).map(value => scale(value, 1 / values.length));

const solve_coefficients = (points, tangents, looped_points = false) => {
   const count = points.length;
   const alpha = 2 * Math.PI / count;
   const positions = dft(points);
   const normalized_tangents = dft(tangents.map(tangent => ({
      // The default orientation preserves the original curve. The alternate
      // orientation is available for experiments with looped orbital points.
      re: (looped_points ? -tangent.im : tangent.im) / alpha,
      im: (looped_points ? tangent.re : -tangent.re) / alpha,
   })));
   const coefficients = new Array(count * 2);
   for (let frequency = 0; frequency < count; frequency += 1) {
      const high = scale(
         sub(normalized_tangents[frequency], scale(positions[frequency], frequency)),
         1 / count,
      );
      coefficients[frequency + count] = high;
      coefficients[frequency] = sub(positions[frequency], high);
   }
   return coefficients;
};

const evaluate_curve = (coefficients, period, t) => coefficients.reduce(
   (point, coefficient, frequency) => {
      const angle = 2 * Math.PI * frequency * t / period;
      return add(point, {
         re: coefficient.re * Math.cos(angle) - coefficient.im * Math.sin(angle),
         im: coefficient.re * Math.sin(angle) + coefficient.im * Math.cos(angle),
      });
   }, {re: 0, im: 0});

const sample_curve = (coefficients, period, sample_count) => Array.from(
   {length: sample_count},
   (_, index) => {
      const t = period * index / (sample_count - 1);
      return {t, C: evaluate_curve(coefficients, period, t)};
   },
);

/**
 * Sample a smooth closed curve around the periodic Mandelbrot orbit for c.
 * Query parameters: re, im (required), samples (optional output count), and
 * looped_points (optional boolean). Orbital points are found with
 * FractoFastCalc, which can iterate for millions of steps when necessary. By
 * default, the curve is sampled 50 times between each pair of orbital points,
 * including both endpoints, so integer values of t are represented exactly.
 * The response is an array of `{t, C}` values, where C is serialized as
 * `{re, im}`.
 */
export const handle_circuitry = (req, res) => {
   const re = Number(req.query.re);
   const im = Number(req.query.im);
   const looped_points = [true, 'true', 1, '1'].includes(
      req.query.looped_points,
   );
   if (!Number.isFinite(re) || !Number.isFinite(im)) {
      return res.status(400).json({error: 're and im must be finite numbers'});
   }
   const points = get_orbital_points(re, im);
   if (!points || points.length < 2) {
      return res.status(422).json({
         error: 'No periodic orbit found by FractoFastCalc',
      });
   }
   const coefficients = solve_coefficients(
      points,
      get_tangents(points),
      looped_points,
   );
   const default_sample_count =
      points.length * SAMPLES_PER_ORBITAL_INTERVAL + 1;
   const sample_count = Math.min(
      MAX_SAMPLE_COUNT,
      Math.max(2, Number(req.query.samples) || default_sample_count),
   );
   return res.status(200).json({
      result: sample_curve(coefficients, points.length, sample_count),
      cardinality: points.length,
      samples: sample_count,
      looped_points,
   });
};
