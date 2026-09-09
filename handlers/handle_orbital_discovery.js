import { discover_orbital } from "./orbitals/orbital_discovery.js";

/**
 * Run the initial polar orbital-discovery scout.
 *
 * Query parameters:
 * - `re`, `im`: required Mandelbrot parameter coordinates.
 * - `iterations`: optional maximum critical-orbit iterations.
 * - `sample_limit`: optional maximum number of returned polar samples.
 * - `analysis_start`: optional fraction of samples to skip before spectral analysis.
 * - `peak_count`: optional number of spectral peaks to return.
 * - `max_period`: optional maximum candidate cardinality denominator.
 *
 * The endpoint currently returns the polar scout data. Cardinality estimation
 * and Fourier candidate scoring will be added as subsequent pipeline stages.
 * When native separation from Q approaches floating-point resolution, the
 * scout recomputes the complete orbit with BigComplex and reports the selected
 * precision in `precision_mode`, `precision_digits`, and `Q_decimal`.
 *
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {import('express').Response} JSON response.
 */
export const handle_orbital_discovery = (req, res) => {
  const re = Number(req.query.re);
  const im = Number(req.query.im);
  if (!Number.isFinite(re) || !Number.isFinite(im)) {
    return res.status(400).json({ error: "re and im must be finite numbers" });
  }
  try {
    const result = discover_orbital(
      { re: req.query.re, im: req.query.im },
      {
        iterations: req.query.iterations,
        sample_limit: req.query.sample_limit,
        analysis_start: req.query.analysis_start,
        peak_count: req.query.peak_count,
        max_period: req.query.max_period,
      },
    );
    return res.status(200).json({ result });
  } catch (error) {
    console.error("handle_orbital_discovery", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// TODO: Add an explicit precision-policy query option after predictive sizing
// replaces the current adaptive safety retry.
