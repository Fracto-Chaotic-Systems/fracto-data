import FractoFastCalc from "../../../sdk/FractoFastCalc.js";

const SAMPLES_PER_ORBITAL_INTERVAL = 50;
const MAX_SAMPLE_COUNT = 65536;
const MAX_EXHAUSTIVE_POLARITY_POINTS = 16;
const POLARITY_SCORE_SAMPLES_PER_INTERVAL = 10;

const add = (a, b) => ({re: a.re + b.re, im: a.im + b.im});
const sub = (a, b) => ({re: a.re - b.re, im: a.im - b.im});
const scale = (a, factor) => ({re: a.re * factor, im: a.im * factor});
const magnitude = point => Math.hypot(point.re, point.im);

const normalize = point => {
   const size = magnitude(point);
   return size === 0 ? {re: 0, im: 0} : scale(point, 1 / size);
};

const complex_sqrt = point => {
   const size = magnitude(point);
   const real_part = Math.sqrt(Math.max(0, (size + point.re) / 2));
   const imaginary_part = Math.sqrt(Math.max(0, (size - point.re) / 2));
   return {
      re: real_part,
      im: point.im < 0 ? -imaginary_part : imaginary_part,
   };
};

const get_cardioid_root = focal_point => scale(
   sub({re: 1, im: 0}, complex_sqrt(
      sub({re: 1, im: 0}, scale(focal_point, 4)),
   )),
   0.5,
);

const get_orbital_points = (re, im) => {
   const calculation = FractoFastCalc.calc(re, im);
   return calculation?.orbital_points?.map(point => ({
      re: point.x,
      im: point.y,
   }));
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

const dft = values => values.map((_, frequency) => values.reduce(
   (sum, value, index) => {
      const angle = -2 * Math.PI * frequency * index / values.length;
      return add(sum, {
         re: value.re * Math.cos(angle) - value.im * Math.sin(angle),
         im: value.re * Math.sin(angle) + value.im * Math.cos(angle),
      });
   }, {re: 0, im: 0})
).map(value => scale(value, 1 / values.length));

const solve_coefficients = (
   points,
   normals,
   looped_points = false,
   polarity_pattern = null,
) => {
   const count = points.length;
   const alpha = 2 * Math.PI / count;
   const positions = dft(points);
   const normalized_tangents = dft(normals.map((normal, index) => {
      // The Hermite coefficient transform applies the quarter-turn needed to
      // convert this normal constraint into a curve tangent. Passing the ray
      // directly avoids rotating it twice. The default orientation preserves
      // traversal direction; looped_points reverses it.
      const polarity = polarity_pattern?.[index] || 1;
      const orientation = looped_points ? -1 : 1;
      return {
         re: polarity * orientation * normal.re / alpha,
         im: polarity * orientation * normal.im / alpha,
      };
   }));
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

const tangent_variation_score = (coefficients, period) => {
   const sample_count = Math.max(
      3,
      period * POLARITY_SCORE_SAMPLES_PER_INTERVAL,
   );
   let score = 0;
   let previous_direction = null;
   for (let index = 0; index <= sample_count; index += 1) {
      const t = period * index / sample_count;
      const next_t = period * (index + 1) / sample_count;
      const current = evaluate_curve(coefficients, period, t);
      const next = evaluate_curve(coefficients, period, next_t);
      const direction = normalize(sub(next, current));
      if (previous_direction) {
         const dot = Math.max(
            -1,
            Math.min(
               1,
               previous_direction.re * direction.re +
                  previous_direction.im * direction.im,
            ),
         );
         score += Math.acos(dot) ** 2;
      }
      previous_direction = direction;
   }
   return score;
};

const polarity_pattern_from_index = (point_count, pattern_index) => {
   const pattern = new Array(point_count).fill(1);
   for (let index = 1; index < point_count; index += 1) {
      pattern[index] = pattern_index & (1 << (index - 1)) ? -1 : 1;
   }
   return pattern;
};

const optimize_polarity = (points, normals, looped_points) => {
   if (points.length > MAX_EXHAUSTIVE_POLARITY_POINTS) {
      return {
         coefficients: solve_coefficients(points, normals, looped_points),
         pattern: null,
         score: null,
         exhaustive: false,
      };
   }
   const pattern_count = 2 ** (points.length - 1);
   let best = null;
   for (let pattern_index = 0; pattern_index < pattern_count; pattern_index += 1) {
      const pattern = polarity_pattern_from_index(points.length, pattern_index);
      const coefficients = solve_coefficients(
         points,
         normals,
         looped_points,
         pattern,
      );
      const score = tangent_variation_score(coefficients, points.length);
      if (!best || score < best.score) {
         best = {coefficients, pattern, score, exhaustive: true};
      }
   }
   return best;
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
 * looped_points and optimize_polarity (optional booleans). When
 * optimize_polarity=true, exhaustive polarity patterns are evaluated using
 * tangent-direction variation as the objective for small orbits. Orbital
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
   const looped_points = [true, 'true', 1, '1'].includes(
      req.query.looped_points,
   );
   const optimize_polarity_pattern = [true, 'true', 1, '1'].includes(
      req.query.optimize_polarity,
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
   const normals = get_normals(points, {re, im});
   const cardioid_root = get_cardioid_root({re, im});
   const optimized = optimize_polarity_pattern
      ? optimize_polarity(points, normals, looped_points)
      : {
         coefficients: solve_coefficients(points, normals, looped_points),
         pattern: null,
         score: null,
         exhaustive: false,
      };
   const default_sample_count =
      points.length * SAMPLES_PER_ORBITAL_INTERVAL + 1;
   const sample_count = Math.min(
      MAX_SAMPLE_COUNT,
      Math.max(2, Number(req.query.samples) || default_sample_count),
   );
   return res.status(200).json({
      result: sample_curve(
         optimized.coefficients,
         points.length,
         sample_count,
      ),
      cardinality: points.length,
      samples: sample_count,
      Q: cardioid_root,
      looped_points,
      optimize_polarity: optimize_polarity_pattern,
      polarity_pattern: optimized.pattern,
      polarity_score: optimized.score,
      polarity_exhaustive: optimized.exhaustive,
   });
};
