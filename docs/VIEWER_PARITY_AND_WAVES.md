# Viewer parity and 3D water/wave workflow

Status: **progressively ported; not blanket legacy parity** (October 2026).
The unchanged production legacy website remains an external reference until the
remaining gaps below are verified. The new site never edits legacy code.

## Architecture

- `src/viewers/registry.js` loads lazy format adapters in a single `ViewerShell`.
- `src/viewers/model-workbench.js` is the reusable STL/3MF/F3Z panel, using the
  exact same `src/model/model-scene.js` 3D scene as Engineering and Inspector.
- `src/model/waterline-preview.js` reuses **the same** triangle-plane
  intersection code and contour-stitcher as Hydro, rather than drawing a fake
  horizontal 2D line on top of the viewport.
- `src/model/wave-core.js`, `model-wave-controls.js`,
  `wave-collection.js`, and `wave-concept-estimates.js` separate conceptual
  wave visualization, observed series, and very approximate legacy formulas.
- Python/notebook execution uses a disposable Pyodide Web Worker; source never
  executes merely because a file was opened. Stopping terminates the runtime.

## Delivered, tested

| Capability | Current implementation | Evidence |
| --- | --- | --- |
| Engineering scroll/resizing | Independent tree/inspector/result scrollports; keyboard/pointer result-height adjustment | Chrome Engineering layout smoke |
| Python `.py` | Syntax preview, edit, Run, Stop, session Reset, stdout/stderr, Matplotlib plots, copy, wrap, lines, save `.py`, VS Code | Real Pyodide browser execution + unit tests |
| Jupyter `.ipynb` | Edit/run individual cells, Run all, Stop/Reset, in-order shared variables, saved text/PNG output | Chrome notebook interactions + unit tests |
| CSV/TSV/PSV | Quoted multiline fields, escaped quotes, delimiter detection, search rows, raw text | Pure tests + browser matrix |
| Text/code | Existing syntax highlighting, copy/find; newly restored wrap and line toggles | ViewerShell browser matrix |
| STL/3MF | Shared camera, view directions, align, rotations, wireframe, shading, opacity, axes, bbox, edges, explode, clipping, vertex/edge measure snapping, PNG | WebGL workbench browser check |
| Fusion archive F3Z | Embedded 3MF/STL becomes native ModelDocument with shared workbench | Import tests + format matrix |
| Calm-waterline | Real intersection contours from hull triangles, 3D waterplane, updated after roll, trim, axis alignment and manual Z input | Analytic 10 × 4 m box + real Chrome/WebGL |
| Waves | Optional animated linear-wave surface with H/T/heading/depth inputs; synthetic probe time series and CSV measured-series import; local library and CSV/JSON export | Deep/finite-depth dispersion unit checks + Chrome WebGL/collection |
| Concept wave forces | Explicit-input legacy Morison/empirical wave resistance with concept-only warning | Unit tests |
| Other adapters | PDF, HTML, LaTeX, Office, video, quiz and YouTube share ViewerShell (individual scope varies) | Existing viewer matrix and specialized tests |

## Numerical and safety boundaries

**Still water:** the line drawn around the hull is a genuine intersection with
the *horizontal mean-water* plane. A wave surface **does not** change the Hydro
displaced volume, GM or GZ. This is deliberate: a visual animation is not a
time-domain floating-body solver.

**Waves:** the rendered surface is deterministic, single-frequency linear
Airy-wave theory, not measured weather, wave superposition, a JONSWAP spectrum,
a diffraction/radiation solver, an RAO or a CFD simulation. Synthetic histories
are persistently labelled *synthetic*. Uploaded CSV columns must include
`time_s` and `eta_m`; imported data is kept as observations and not
misrepresented as a computed spatial wave field. Wave records are stored locally
in the browser and can be exported. Loading third-party Python has security
implications; use only trusted code.

**Mesh limits:** the interactive 3D contour overlay is capped at 350,000
triangles to prevent browser freezing. More complex meshes show a non-fabricated
status; the numerical Hydro Worker can process them separately. This is a
performance constraint, **not** proof of hull validity.

**Block Hydro:** independent analytic block checks exist for displaced volume,
weight, moments, GM, GZ, attitude and equilibrium; actual vessel validation
still requires correct shell/coordinate data and loading condition.

## Legacy feature gaps / non-parity

These are **not** described as complete, despite available partial adapters:

1. **Native F3D / F3Z without an embedded STL or 3MF:** requires Autodesk APS
   conversion or author-supplied neutral geometry; never fabricate a mesh.
2. **STEP/IGES / specialist Fusion and APS viewers:** no general native
   triangulation/service-backed derivative conversion or cloud OAuth.
3. **Full legacy HydroLab:** no regular/irregular wave spectrum fitting, RAOs,
   time-domain floating-body dynamics, CFD, geographic forecast ingest or
   independent validation of Morison estimates.
4. **Exact waterline on very large/invalid meshes:** no responsive Worker-based
   3D contour overlay yet; the analysis gate is independent.
5. **LaTeX:** KaTeX currently previews supported mathematical blocks rather
   than providing complete multi-file TeX compilation and document-level ZIP
   dependency resolution.
6. **Office/HTML:** native safe previews do not guarantee full macros, design,
   Microsoft Office editing, arbitrary iframe embed permissions or CSS/JS
   behavior parity.
7. **Model presentation:** certain specialized legacy rendering presets,
   automatic model orbit and detailed hull-specific CAD selections need
   interaction-level parity comparisons.

Do **not** mark this matrix `full` until the associated tests exercise the
actual UI paths. The old website remains unchanged.
