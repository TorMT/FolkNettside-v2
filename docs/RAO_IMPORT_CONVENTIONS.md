# Import externally computed 6-DOF motion RAOs

The V2 wave viewer supports a **linear motion RAO animation** based on externally
computed data. This tool **does not compute hydrodynamic RAOs**, diffraction,
radiation, added mass, wave forcing or damping from the mesh. Hydro still
computes still-water quantities separately. The preview is only as accurate as
the external solver, coordinate conventions, geometry alignment and input data.

## Format

A UTF-8, comma-delimited CSV with the exact header:

```csv
heading_deg,omega_rad_s,dof,amplitude,phase_deg
0,1.0471975512,surge,0.12,0
0,1.0471975512,sway,0,0
0,1.0471975512,heave,0.82,-20
0,1.0471975512,roll,0,0
0,1.0471975512,pitch,0.04,95
0,1.0471975512,yaw,0,0
```

- **Exactly one row** for each `surge`, `sway`, `heave`, `roll`,
  `pitch`, and `yaw` at each frequency and heading. Declare genuinely
  zero responses explicitly; omitted DOFs fail validation rather than
  silently being treated as zero.
- `omega_rad_s` is **angular frequency in rad/s**, not frequency in Hz
  or wave period in seconds: `omega = 2π/T`.
- `heading_deg` is the **direction of wave propagation** in world X/Y:
  0° means toward +X (following seas), 90° toward +Y (port beam),
  180° toward −X (head seas), 270° toward −Y. Many solvers use an
  *approach* angle instead; convert explicitly before import.
- Vessel axes are +X forward, +Y port, +Z up, and right-handed positive
  rotations around the corresponding axes.
- RAO amplitudes are per **one metre incident wave amplitude**:
  `surge/sway/heave` have **m/m** units; `roll/pitch/yaw` have **rad/m**
  units. Convert degrees/m to radians/m, and values normalized by wave
  **height** to values normalized by amplitude, before importing.
- Phase uses **positive lead** in
  `Re{ a H(omega,beta) exp[i(k·r - omega*t + phase_wave)] }`.
  If your solver uses an opposite Fourier sign convention, complex-conjugate
  its RAOs by negating the phase. Verify both with one known case.
- Translation and rotation must be defined about the **same reference
  point** as the model's displayed geometric centre. The importer does
  not perform a rigid-body reference-point transformation.
- The 3D model is assumed aligned to X-forward/Y-port/Z-up. Source geometry
  orientation is not inferred from the file name.
- Import is **local to the browser tab**. The original CSV is not uploaded.
  Removing it disables RAO motion immediately.

## Interpolation and limits

The UI converts the selected regular-wave period to rad/s. It interpolates
complex real/imaginary RAO coefficients between available frequencies at
**one exactly matched heading**. It never extrapolates or automatically
interpolates over different headings, since phase conventions and angle
periodicity can make that incorrect. Wave phase advances using the same
Airy-wave convention as the sea surface.

This is a linear, regular-wave first-order response animation, **not**
a nonlinear multi-frequency simulation. It does not account for speed-
dependent encounter-frequency effects, second-order drift, mooring forces,
slamming, nonlinearity, viscous roll effects, or RAO-dependent uncertainty.

Use the built-in [synthetic example](../examples/rao/synthetic_six_dof_rao.csv)
to verify the interface; **do not use it as a vessel's RAO**.

## Acceptance checklist for solver exports

1. Verify the solver's headings (propagation versus approach) and axes.
2. Verify response amplitude basis (wave amplitude versus height) and
   translation/rotation units.
3. Verify phase sign and location of wave elevation reference.
4. Verify that the solver and visualization use the same 6-DOF reference point.
5. Test a pure-heave RAO of 1 m/m at phase zero: `H=2 m` produces
   a 1 m peak vertical response.
6. Check expected response magnitude and relative phase at several frequencies
   **against the external solver's time history** before using a real ship.

A validated seakeeping solver (e.g. a suitable radiation/diffraction model)
is needed to **generate** physical RAOs. Adding a numerical solver is a
separate project, not implied by importing a CSV.
