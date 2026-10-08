# Hydro completion programme

The calculation engine is **already implemented**, including clipped-triangle hydrostatics, displacement/draft inversion, waterplane properties, initial stability, heel/trim attitude, constant-displacement GZ, equilibrium, CSV and web-worker execution. This programme closes the gap between analytic fixtures and auditable real-vessel usage.

## Phase 1 — Hard geometry preflight (implemented on feature/hydro-geometry-gate)

- Select only geometry explicitly belonging to hydro (using semantic ModelDocument flags).
- Check coordinate and index integrity, world transforms and unit scaling before computation.
- Weld coincident vertices within a documented tolerance in **metres** (default `1e-7`); detect open boundary edges, non-manifold edges, inconsistent face winding and degenerate faces.
- Compute oriented signed closed-body volume from triangulated surface in world metres, using a translated numerical origin. Reject inverted or nearly zero volume.
- Reject **all** Hydro requests (analysis, curves, draft solve, attitude, GZ) when selected geometry fails preflight. Treat Web Worker and main-thread fallback identically.
- Report actionable component-level mesh errors in Engineering and include the blocked state in engineering exports. A positive *mesh* result does not override any model capability or source approval gate.
- Unit and real browser-worker regressions use a known 10 m × 3 m × 2 m box, including inverted, open, non-manifold and individually flipped faces.

## Phase 2 — Independent mesh/hull eligibility (next)

- Detect self-intersections and overlapping or nested closed shells that a simple manifold test cannot identify; distinguish external hull, interior equipment and intentionally disjoint displacement bodies.
- Add optional repair **preview** for vertex welding, consistent winding and outward normal correction, with before/after differences and confirmation. Never silently change imported geometry.
- Verify source geometry unit, handedness, vessel baseline, x-forward/y-port/z-up convention, and alignment with draft datum.
- Validate principal dimensions against separately sourced LOA, beam and relevant moulded dimensions; keep ship data provenance in the case file.
- **Implemented:** explicit closed-loop waterplane graph, nested hole/moonpool subtraction and geometric waterline crossing checks, with analytical tests and Web Worker browser regression. Coplanar/tangential degeneracies remain fail-closed; reference-vessel qualification still pending.

## Phase 3 — Hydrostatic numerical qualification

- Check `V(T)` monotonicity for a known watertight hull, enforce converged target displacement and explain out-of-range conditions.
- Analytic fixture matrix: rectangle, wedge, skewed hull, disconnected permissible bodies, eccentric cross section, non-zero Ixy, dry/full, heel, trim and varying density. Cross-check against independent reference implementations or published hydrostatic particulars (with source and tolerances).
- Waterplane curves and reports: displacement, KB, LCB, TCB, LCF, TCF, TPC, transverse/longitudinal BM/KM/GM, sectional area data and clear uncertainty flags.
- Validate initial GM against the near-zero-angle derivative of GZ and GZ symmetry for a symmetric hull. Include loading condition, KG, LCG/TCG, margin on bounds and residuals in every export.
- Stress-test >100k triangles, memory consumption, cancellation and stale worker responses when switching models.

## Phase 4 — Engineering import and real-vessel acceptance

- STEP/IGES triangulation/conversion workflow, provenance and repeatable mesh export.
- One working **closed external hull** with independently validated dimensions and datum before real vessel Hydro can be labelled `validated`.
- For Gunnerus: the current C-JOB visual assembly combines hull and structure; it is not a separately validated submerged external wetted surface. Keep `data/gunnerus-model.json` Hydro capability **disabled**. Before enabling, acquire or reconstruct a permissible hull-only surface, verify watertightness and winding, correct the coordinate datum, select a sourced loading condition, independently compare displacement/KB/waterplane properties and document approved results.
- On real-vessel models, indicate explicitly whether values are verified, preliminary, calculated on fixture geometry or blocked. Avoid displaying unsupported stability certificates.

## Sign-off conditions

**Geometry preflight passed** = selected mesh closes and has outward-facing normals under the stated numeric tolerance. This is not a naval architectural approval.

**Hydro validated** = all geometry preflight checks + independently documented hull provenance, source/datum, underwater volume/waterplane comparisons, loading condition, calculation reference tolerances, and model-specific review complete.

No old FolkNettside files are modified for this work; the LeseRavnen demo stays independent.
