# Orbital analysis

The orbital discovery pipeline currently performs a polar scout around the
fixed point `Q`, optionally recomputes the samples with adaptive
`BigComplex` precision, and applies a first windowed Fourier analysis. The
reported candidate periods are suggestions only and must be validated by a
later exact-period solver.

## Future spectral confidence improvements

The current candidate confidence is based only on rational-frequency error
relative to the available frequency resolution:

```text
confidence = 1 / (1 + approximation_error / frequency_resolution)
```

Future confidence metrics should combine that heuristic with:

- DFT peak power relative to the surrounding spectral floor.
- Peak-to-noise or peak-to-neighbor power ratios.
- Phase-fit residual after projecting the samples onto the candidate rational
  frequency.
- Stability of the candidate across multiple analysis-window positions and
  lengths.
- Agreement between native and high-precision spectral passes.
- Harmonic consistency, including whether related peaks reduce to the same
  fundamental period.
- Sensitivity to the analysis start point and discarded transient samples.
- The estimated angular error caused by the remaining radius from `Q`.
- Candidate ranking that penalizes alias ambiguity when the sampling stride is
  too large to distinguish nearby frequencies.

These measures should produce a composite score or confidence interval rather
than treating the current rational-approximation score as statistical
confidence. No candidate should be reported as a discovered cardinality until
dynatomic deflation, Newton refinement, and exact-period validation agree.

## Spectral inspection endpoint

`GET /orbital_spectrum?re=<real>&im=<imaginary>` runs the same adaptive
discovery scout and returns the complete `spectrum.power_spectrum` series,
including frequency in cycles per iteration and normalized power. The
orbital-circuitry UI plots this series beside the parameterized path so that
peak shape, noise, and aliasing can be inspected directly. Optional discovery
parameters such as `iterations`, `sample_limit`, `analysis_start`,
`peak_count`, and `max_period` are forwarded to the scout.

The scout currently performs a fixed 4,096-iteration warm-up before collecting
the configured analysis window. This is deliberately a constant while its
stability benefit is being measured; it may later become an operator-controlled
or adaptive parameter. The warm-up adds linear orbit work and does not increase
the DFT sample count.

The analyzer currently requires at least five complete cycles in the analyzed
window before treating a period as a trustworthy cardinality. The response
reports `minimum_observed_cycles` and the calculated
`maximum_trustworthy_cardinality`. Raw spectral bins remain available for
diagnostics, but candidates beyond that ceiling are excluded. This five-cycle
factor is deliberately explicit: detecting much larger cardinalities will
eventually require longer runs, more samples, or a confidence model that can
justify fewer observed cycles.

## Peak rational decomposition

Each ranked entry in `spectrum.peaks` contains a raw `bin` and a frequency
estimate. The analyzer also approximates that frequency as a reduced rational
value:

```text
frequency_cycles_per_iteration ~= cycles / cardinality
```

Here `cycles` is the number of angular revolutions represented by one proposed
orbital cycle, and `cardinality` is the proposed whole-number point count.
`period_iterations` is the reciprocal frequency and is therefore not itself
the cardinality when more than one revolution occurs per orbital cycle. The
`rational_error` and `rational_confidence` fields describe the fit to the
measured frequency; they are screening signals, not proof of an orbit.

## Exact-period validation

Spectral decomposition can only suggest a cardinality because finite windows,
sampling stride, leakage, and noise can produce convincing rational ratios.
Exact-period validation must independently test each proposed pair `(cycles,
cardinality)` against the iteration map. Starting from the candidate orbital
state, the validator should:

1. Iterate the map for exactly `cardinality` steps and measure the residual
   between the final state and the starting state.
2. Confirm that the angular progression accounts for `cycles` complete turns
   within the same tolerance.
3. Test every proper divisor of `cardinality` so a smaller repeating orbit is
   not mislabeled as a larger one.
4. Reject escaped or numerically unstable candidates and repeat the test with
   adaptive `BigComplex` precision when the residual approaches the current
   numeric tolerance.

Only a candidate that returns after the proposed cardinality, does not return
earlier, and remains stable under increased precision should be promoted to a
discovered orbital.
