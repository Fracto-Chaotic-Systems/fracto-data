const DEFAULT_ANALYSIS_START = 0.25;
const DEFAULT_PEAK_COUNT = 8;
const DEFAULT_MAX_CANDIDATE_PERIOD = 4096;
const MAX_PEAK_COUNT = 32;
// A candidate must complete this many cycles in the analyzed window before
// it is treated as a trustworthy cardinality. Larger periods remain in the
// raw spectrum for diagnostics but are not promoted as candidates.
const MIN_OBSERVED_CYCLES = 5;

/** @param {number} left @param {number} right @returns {number} Greatest common divisor. */
const greatest_common_divisor = (left, right) => {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a || 1;
};

/**
 * Estimate the slope of an unwrapped phase sequence using least squares.
 *
 * @param {Array<{iteration: number, theta: number}>} samples Polar samples.
 * @returns {number} Radians per iteration.
 */
const estimate_phase_slope = (samples) => {
  const count = samples.length;
  const sum_x = samples.reduce((sum, sample) => sum + sample.iteration, 0);
  const sum_y = samples.reduce((sum, sample) => sum + sample.theta, 0);
  const sum_xx = samples.reduce(
    (sum, sample) => sum + sample.iteration * sample.iteration,
    0,
  );
  const sum_xy = samples.reduce(
    (sum, sample) => sum + sample.iteration * sample.theta,
    0,
  );
  const denominator = count * sum_xx - sum_x * sum_x;
  return denominator === 0 ? 0 : (count * sum_xy - sum_x * sum_y) / denominator;
};

/**
 * Calculate windowed DFT power for the complex unit phase signal e^(i theta).
 *
 * @param {Array<{theta: number}>} samples Polar samples.
 * @param {number} bin Frequency bin.
 * @returns {number} Normalized power.
 */
const dft_power = (samples, bin) => {
  const count = samples.length;
  let real = 0;
  let imaginary = 0;
  let window_power = 0;
  for (let index = 0; index < count; index += 1) {
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (count - 1));
    const phase = samples[index].theta - (samples[0].theta || 0);
    const signal_re = Math.cos(phase);
    const signal_im = Math.sin(phase);
    const angle = (2 * Math.PI * bin * index) / count;
    real +=
      window * (signal_re * Math.cos(angle) + signal_im * Math.sin(angle));
    imaginary +=
      window * (signal_im * Math.cos(angle) - signal_re * Math.sin(angle));
    window_power += window * window;
  }
  return (real * real + imaginary * imaginary) / Math.max(window_power, 1);
};

/**
 * Rank reduced rational approximations to a frequency. Denominators are
 * candidate orbital cardinalities, not yet validated periods.
 *
 * @param {number} frequency Cycles per iteration in [0, 1).
 * @param {number} max_period Largest candidate denominator.
 * @param {number} resolution Frequency resolution of the sample window.
 * @returns {Array<{period: number, numerator: number, error: number, confidence: number}>}
 *   Ranked candidate periods.
 */
const rational_candidates = (frequency, max_period, resolution) => {
  const candidates = [];
  for (let denominator = 2; denominator <= max_period; denominator += 1) {
    const numerator = Math.round(frequency * denominator);
    const error = Math.abs(frequency - numerator / denominator);
    if (numerator === 0 || numerator >= denominator) continue;
    const divisor = greatest_common_divisor(numerator, denominator);
    const reduced_numerator = numerator / divisor;
    const reduced_period = denominator / divisor;
    candidates.push({
      period: reduced_period,
      numerator: reduced_numerator,
      error,
      confidence: 1 / (1 + error / Math.max(resolution, 1e-12)),
    });
  }
  candidates.sort((left, right) => left.error - right.error);
  return candidates
    .filter(
      (candidate, index, values) =>
        values.findIndex((value) => value.period === candidate.period) ===
        index,
    )
    .slice(0, DEFAULT_PEAK_COUNT);
};

/**
 * Analyze polar samples for angular spectral peaks and candidate periods.
 *
 * @param {Array<{iteration: number, theta: number}>} samples Polar samples.
 * @param {number} sample_stride Iterations represented by each sample step.
 * @param {{analysis_start?: number, peak_count?: number, max_period?: number}} options Analysis options.
 * @returns {object} Spectral summary and unvalidated period candidates.
 */
export const analyze_polar_spectrum = (
  samples,
  sample_stride,
  options = {},
) => {
  const valid_samples = samples.filter(
    (sample) =>
      Number.isFinite(sample.iteration) && Number.isFinite(sample.theta),
  );
  const start_fraction = Math.max(
    0,
    Math.min(0.9, Number(options.analysis_start) || DEFAULT_ANALYSIS_START),
  );
  const start_index = Math.min(
    Math.max(0, valid_samples.length - 2),
    Math.floor(valid_samples.length * start_fraction),
  );
  const analysis_samples = valid_samples.slice(start_index);
  if (analysis_samples.length < 4) {
    return {
      sample_count: analysis_samples.length,
      status: "insufficient_samples",
      phase_slope_radians_per_iteration: null,
      frequency_cycles_per_iteration: null,
      peaks: [],
      candidate_periods: [],
    };
  }

  const phase_slope = estimate_phase_slope(analysis_samples);
  const analysis_span_iterations = Math.max(
    1,
    analysis_samples.at(-1).iteration - analysis_samples[0].iteration,
  );
  const maximum_trustworthy_cardinality =
    analysis_span_iterations / MIN_OBSERVED_CYCLES;
  const frequency = (((phase_slope / (2 * Math.PI)) % 1) + 1) % 1;
  const bin_count = Math.floor(analysis_samples.length / 2);
  const powers = Array.from({ length: bin_count }, (_, bin) => ({
    bin: bin + 1,
    power: dft_power(analysis_samples, bin + 1),
  }));
  const peaks = powers
    .filter(
      (value, index, values) =>
        index === 0 ||
        index === values.length - 1 ||
        (value.power >= values[index - 1].power &&
          value.power >= values[index + 1].power),
    )
    .sort((left, right) => right.power - left.power)
    .slice(
      0,
      Math.min(
        MAX_PEAK_COUNT,
        Number(options.peak_count) || DEFAULT_PEAK_COUNT,
      ),
    )
    .map((peak) => {
      const frequency_per_sample = peak.bin / analysis_samples.length;
      const frequency_per_iteration = frequency_per_sample / sample_stride;
      return {
        ...peak,
        frequency_cycles_per_sample: frequency_per_sample,
        frequency_cycles_per_iteration: frequency_per_iteration,
        period_iterations:
          frequency_per_iteration > 0 ? 1 / frequency_per_iteration : null,
        trustworthy:
          frequency_per_iteration > 0 &&
          1 / frequency_per_iteration <= maximum_trustworthy_cardinality,
      };
    });
  const candidate_periods = rational_candidates(
    frequency,
    Math.min(
      DEFAULT_MAX_CANDIDATE_PERIOD,
      Math.max(2, Number(options.max_period) || DEFAULT_MAX_CANDIDATE_PERIOD),
    ),
    1 / Math.max(analysis_samples.length * sample_stride, 1),
  ).filter(
    (candidate) => candidate.period <= maximum_trustworthy_cardinality,
  );

  return {
    sample_count: analysis_samples.length,
    analysis_start_index: start_index,
    sample_stride,
    analysis_span_iterations,
    minimum_observed_cycles: MIN_OBSERVED_CYCLES,
    maximum_trustworthy_cardinality,
    phase_slope_radians_per_iteration: phase_slope,
    frequency_cycles_per_iteration: frequency,
    peaks,
    // Preserve the complete spectrum for diagnostics and visualization. The
    // ranked peaks above are useful for discovery, while this series shows
    // the surrounding energy and makes aliasing/noise visible to callers.
    power_spectrum: powers.map((value) => ({
      bin: value.bin,
      frequency_cycles_per_sample: value.bin / analysis_samples.length,
      frequency_cycles_per_iteration:
        value.bin / (analysis_samples.length * sample_stride),
      power: value.power,
    })),
    candidate_periods,
    status: "spectral_analysis_complete",
  };
};
