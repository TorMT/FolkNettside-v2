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

- **Screening implemented:** world-space BVH triangle self-intersection check, conservative nested/overlapping shell AABB refusal within a component, and bounded fail-closed comparisons. Full proof, touching-at-shared-vertex cases and selection of true external hull still require independent verification.
- Add optional repair **preview** for vertex welding, consistent winding and outward normal correction, with before/after differences and confirmation. Never silently change imported geometry.
- Verify source geometry unit, handedness, vessel baseline, x-forward/y-port/z-up convention, and alignment with draft datum.
- Validate principal dimensions against separately sourced LOA, beam and relevant moulded dimensions; keep ship data provenance in the case file.
- **Implemented:** explicit closed-loop waterplane graph, nested hole/moonpool subtraction and geometric waterline crossing checks, with analytical tests and Web Worker browser regression. Coplanar/tangential degeneracies remain fail-closed; reference-vessel qualification still pending.

## Phase 3 — Hydrostatic numerical qualification

- **Implemented:** finite-volume V(T) monotonicity and sampled dV/dT vs waterplane A(T) review diagnostics; strict target-volume residual convergence, bounded iteration errors and explicit out-of-range conditions.
- Analytic fixture matrix: rectangle, wedge, skewed hull, disconnected permissible bodies, eccentric cross section, non-zero Ixy, dry/full, heel, trim and varying density. Cross-check against independent reference implementations or published hydrostatic particulars (with source and tolerances).
- Waterplane curves and reports: displacement, KB, LCB, TCB, LCF, TCF, TPC, transverse/longitudinal BM/KM/GM, sectional area data and clear uncertainty flags.
- **Partially implemented:** sampled small-angle GM/GZ cross-check for matching upright displacement and zero TCG, with structured numerical diagnostics and draft solver residuals in reports; still need vessel-specific loading, full precision, symmetry and stability criteria.
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

## Rectangular reference block and control verification (October 2026)

Continuous CI runs `tests/hydro-block-comprehensive.test.mjs` and the real Chrome Worker
fixture `tests/browser/hydro-block-complete-smoke.html`. The browser
import smoke additionally clicks the live Engineering controls after importing an
STL with two separate bodies and selecting only the external hull.

For a **10 × 4 × 3 m closed box at T=1 m**, seawater density 1025 kg/m³
and KG=0.5 m, the independent analytical expected values are:

| Quantity | Reference | Units |
| --- | ---: | --- |
| Displaced volume | 40 | m³ |
| Displacement mass | 41 | tonnes |
| Centre of buoyancy | (0, 0, 0.5) | m |
| Waterplane area | 40 | m² |
| LCF / TCF | 0 / 0 | m |
| Ixx | 53.333333 | m⁴ |
| Iyy | 333.333333 | m⁴ |
| Ixy | 0 | m⁴ |
| TPC | 0.410 | tonnes/cm |
| BM transverse | 1.333333 | m |
| BM longitudinal | 8.333333 | m |
| KM transverse | 1.833333 | m |
| GM transverse | 1.333333 | m |
| GM longitudinal | 8.333333 | m |
| Inverse draft at 52 m³ | 1.3 | m |

Signed GZ is now **antisymmetric** under equal positive/negative heel for the
symmetric reference block. At small angles, it is checked against the
independent wall-sided formula
`GZ = sin(phi) [GMt + (BMt/2) tan²(phi)]`. Roll/trim attitude, sampled curves,
heel/trim equilibrium, Worker request dispatch, blocked mesh analysis, and all
Hydro inspector and CSV export control IDs are also covered.

The equilibrium solver no longer returns a plausible angle solely because
the angular bracket narrowed or an iteration budget was exhausted: only
`|roll/pitch lever| <= leverTolerance` indicates convergence.
Both GZ and attitude curve generators reject zero/invalid steps and prohibit
more than 361 requested samples.

These checks establish consistency on an analytical model, **not real-vessel
validation**. Ship hull isolation, datum, loading condition, downflooding,
free-surface corrections and external stability criteria remain open.
