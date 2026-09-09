import { discover_orbital } from "./orbitals/orbital_discovery.js";

/**
 * Return the polar spectrum used by the cardinality discovery scout.
 *
 * This intentionally keeps the discovery calculation in one place while
 * exposing a chart-oriented response for diagnostics. The complete sampled
 * power series is returned in addition to ranked peaks and candidates.
 *
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @returns {import('express').Response} JSON spectral response.
 */
export const handle_orbital_spectrum = (req, res) => {
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
    return res.status(200).json({
      point: result.point_input,
      precision_mode: result.precision_mode,
      precision_digits: result.precision_digits,
      iterations: result.iterations,
      warmup_iterations: result.warmup_iterations,
      sample_stride: result.sample_stride,
      spectrum: result.spectrum,
    });
  } catch (error) {
    console.error("handle_orbital_spectrum", error.message);
    return res.status(500).json({ error: error.message });
  }
};
