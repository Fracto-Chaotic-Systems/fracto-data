import FractoFastCalc from "../../../sdk/FractoFastCalc.js";

const SAMPLES_PER_ORBITAL_INTERVAL = 50;
const MAX_SAMPLE_COUNT = 65536;
const MAX_EXHAUSTIVE_POLARITY_POINTS = 16;
const POLARITY_SCORE_SAMPLES_PER_INTERVAL = 10;
const INTERPOLATION_HERMITE = "hermite";
const INTERPOLATION_RADIAL_SWEEP = "radial_sweep";

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
   const points = calculation?.orbital_points?.map(point => ({
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

const wrap_angle = angle => {
   const full_turn = 2 * Math.PI;
   return ((angle + Math.PI) % full_turn + full_turn) % full_turn - Math.PI;
};

const get_rotation_direction = (points, origin) => {
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
      const t = period * index / sample_count;
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

const polarity_pattern_from_index = (point_count, pattern_index) => {
   const pattern = new Array(point_count).fill(1);
   for (let index = 1; index < point_count; index += 1) {
      pattern[index] = pattern_index & (1 << (index - 1)) ? -1 : 1;
   }
   return pattern;
};

const optimize_polarity = (points, normals, looped_points, origin) => {
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
   for (let pattern_index = 0; pattern_index < pattern_count; pattern_index += 1) {
      const pattern = polarity_pattern_from_index(points.length, pattern_index);
      const coefficients = solve_coefficients(
         points,
         normals,
         looped_points,
         pattern,
      );
      const metrics = curve_score(
         coefficients,
         points.length,
         points,
         origin,
      );
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

const sample_radial_sweep = (points, origin, sample_count) => {
   const polar_points = points.map(point => ({
      angle: Math.atan2(point.im - origin.im, point.re - origin.re),
      radius: magnitude(sub(point, origin)),
   }));
   const direction = get_rotation_direction(points, origin);
   const sweep_positions = [0];
   for (let index = 1; index < polar_points.length; index += 1) {
      const delta = direction * wrap_angle(
         polar_points[index].angle - polar_points[index - 1].angle,
      );
      sweep_positions.push(
         sweep_positions[index - 1] + Math.max(delta, 1e-9),
      );
   }
   const closing_delta = direction * wrap_angle(
      polar_points[0].angle - polar_points[polar_points.length - 1].angle,
   );
   const period = sweep_positions.at(-1) + Math.max(closing_delta, 1e-9);
   return Array.from({length: sample_count}, (_, index) => {
      const sweep = period * index / (sample_count - 1);
      let segment = sweep_positions.length - 1;
      for (let candidate = 0; candidate < sweep_positions.length - 1; candidate += 1) {
         if (sweep <= sweep_positions[candidate + 1]) {
            segment = candidate;
            break;
         }
      }
      const start = sweep_positions[segment];
      const end = segment === sweep_positions.length - 1
         ? period
         : sweep_positions[segment + 1];
      const local = Math.max(0, Math.min(1, (sweep - start) / (end - start)));
      const radius_at = offset =>
         polar_points[(segment + offset + polar_points.length) % polar_points.length]
            .radius;
      const radius = Math.max(0, 0.5 * (
         2 * radius_at(0) +
         (-radius_at(-1) + radius_at(1)) * local +
         (2 * radius_at(-1) - 5 * radius_at(0) + 4 * radius_at(1) - radius_at(2)) * local ** 2 +
         (-radius_at(-1) + 3 * radius_at(0) - 3 * radius_at(1) + radius_at(2)) * local ** 3
      ));
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
   const looped_points = [true, 'true', 1, '1'].includes(
      req.query.looped_points,
   );
   const optimize_polarity_pattern = [true, 'true', 1, '1'].includes(
      req.query.optimize_polarity,
   );
   const interpolation = req.query.interpolation || INTERPOLATION_HERMITE;
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
   const default_sample_count =
      points.length * SAMPLES_PER_ORBITAL_INTERVAL + 1;
   const sample_count = Math.min(
      MAX_SAMPLE_COUNT,
      Math.max(2, Number(req.query.samples) || default_sample_count),
   );
   if (![INTERPOLATION_HERMITE, INTERPOLATION_RADIAL_SWEEP].includes(interpolation)) {
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
      result: sample_curve(
         optimized.coefficients,
         points.length,
         sample_count,
      ),
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
