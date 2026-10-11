# Hydro / Structure: geometry-aware mass load editor and force balance

## Scope and trust levels

Both the **Hydro** and **Structure** mass editors use one shared implementation,
`src/engineering/load-sketch.js`, with authoritative, manually editable
text fields. Drawing, moving or editing a load does not run the solver: users
must choose **Apply all loads** (Hydro) or **Calculate hull girder FEM**
(Structure).

The model's source vertex buffer is converted to world-space **metres**,
including the ModelDocument component transform. The X–Y sketch can show
near-horizontal *triangles from the actual mesh*. The displayed surface is
not reconstructed from the mesh's axis-aligned bounding box.

- **Tagged deck:** a component with an explicit deck/floor/platform semantic
  label, type, or name. This is a declaration in model metadata, **not proof
  of load capacity or structural integrity**. A matching layer is selected by
  default.
- **Candidate surface:** horizontal mesh geometry lacking a deck label.
  It requires explicit selection, and may be hull plating, an interior floor
  or another unrelated mesh. It must be independently identified as an
  appropriate loading deck.
- **Manual:** the original X–Y bounding-box sketch, with user-entered Z and
  **no 3D surface validation**, remains available if the imported model lacks
  a usable candidate or its metadata is uncertain.

### Placement checks

In surface mode, new point masses must lie on a selected projected triangle.
For rectangular area masses, a 15 × 15 sample grid, including corners and
edges, must be covered by the **same mesh surface/layer**. Existing masses
can be moved only while the new positions pass the selected surface check.
Area density and Z are still explicit inputs; Z defaults to the selected
approximately horizontal mesh layer and cannot be edited in surface mode.

**This is sampled geometrical screening, not an exact polygon-union proof.**
It does not establish structural strength, deck load limits, floor thickness,
local curvature, tank/void exclusion, collisions with equipment, buoyant hull
closure, or certified hydrostatic accuracy. For detailed engineering,
verify the load-bearing surface and map loads to a separately validated
structural mesh before using computed stresses.

## Units and input files

Point weights: `massTonnes, x, y, z` (negative mass represents removal).
Area weights: `densityTonnesPerM2, x0, x1, y0, y1, z`.
Z is positive upward from the supplied model datum; mass density is per
**horizontal projected square metre**. Drawing a box does not apply a
distributed vertical force or hydrostatic water pressure.

Each selected load can be moved, edited, removed or undone. Other data rows,
comments and line endings are retained; manual edits to the source text remain
authoritative.

## Hydro force display

`src/engineering/hydro-force-balance.js` reports still-water resultant
forces **at the reference draft currently displayed**:

\[
F_B=\rho_{water}\,g\,V,\qquad F_G=g\,m,
\qquad R_z=F_B-F_G
\]

Where `V` and `CB` come from the existing hydrostatic solver and `m`
and `CG` from **applied entered loading**. Conversion to kN divides
newtons by 1000; masses supplied in tonnes are converted to kilograms first.
If no baseline mass or applied loading mass has been provided, gravity and
the residual stay unknown. A calculated displacement is **never silently
interpreted as independently known hull weight**.

The diagram places a schematic upward arrow at CB, and a downward arrow at
CG only when CG is known. Arrow lengths are **not** proportional to force.
The component comparison uses displaced-volume contributions returned by
Hydro, and presupposes that contributing components do not overlap. Area and
point loads are listed by their masses and moment arms; pending editor rows
are excluded until Apply is selected.

The CB/CG overview displays global resultants. A separate pressure audit now
computes the wetted-surface distribution, and Structure can **optionally**
transfer its vertical load distribution to an explicitly constrained beam
proxy. Neither visualization is a certification of local shell stress.

## Exact wetted-surface pressure integration (new)

Hydro now has an optional **Integrate and cross-check hull pressure** button.
It runs on the existing Hydro Web Worker, after the same geometry preflight
gate used by the volume, draft and GZ solvers. The independent implementation
in `src/hydro/pressure-integration.js` transforms each included hull mesh
to world metres and clips each triangular facet below the upright reference
waterline. It integrates gauge pressure analytically within every submerged
triangle (linear pressure, exactly integrated force and first moments):

```text
p = water_density * gravity * (waterline_z - surface_z) [Pa]
dF = -p * outward_normal * dA [N]
dM = position_vector cross dF [N*m]
```

The integrated force vector and moment vector about the model origin are
compared with the independent hydrostatic reference
`F_ref=[0,0,density*g*displaced_volume]` and
`M_ref=CB cross F_ref`. A numerical pass/fail audit reports **both**
errors and their tolerances, rather than assuming the pressure integral
matches by construction. Horizontal pressure cancellation is checked too.

For the longitudinal force chart and structural transfer, the wetted
triangles are **clipped again at exact X-station boundaries**. Each station
records the integrated vertical force and first longitudinal moment of this
force. The overall pressure resultant and 3D pitch moment are independently
integrated over the original wetted triangles. The X-station results are
validated against the original total force. This supplies a geometrically
meaningful distributed load projection, not a nearest-triangle-centroid
histogram.

The reported peak gauge pressure depends on the selected reference
waterline. The wetted surface area and per-component force breakdown come
from the *included selected hydro hull meshes*. Extra models of machinery,
internal tanks and superstructures must be excluded by hydro selection.
Mesh preflight is necessary but not enough to certify external-hull
isolation, pressure boundaries, an actual loading condition or ship
structures.

The calculation is upright and still-water only. Pressures under arbitrary
heel/trim, wave-induced loading, free-surface effects, local shell strength
and hydro-elastic support conditions are **not** represented. The **Structure** workspace can optionally include the forces using a
separately declared structural idealisation. The default remains the
gravity-only pinned/roller test fixture.

Regression qualification covers rectangular blocks at different drafts,
translated and unit-scaled hulls, sloping wedge geometry, component selection,
model preflight rejection and force/moment numerical equality. A dedicated
browser smoke test checks rendering and the numerical review/failure state.

## Hydro to Structure: explicit conservative Euler-beam transfer

The **Structure** workspace has a load-case selector:

- `Gravity only`: the pre-existing pinned/roller beam laboratory fixture,
  without any buoyancy.
- `Mass + wetted-surface pressure`: runs validated still-water pressure
  integration on the selected externally qualified hull at the explicitly
  entered waterline, density and number of stations. The beam carries hull
  baseline gravity (uniform by model assumption), user-added point masses,
  rectangular projected-area masses and the integrated upward pressure.

For each X station, an equivalent uniform line load is computed as
`qz = Fz / station_width`, and an equal/opposite **end-node force pair**
restores its exact first longitudinal force moment `∫x dFz`. Because 3D
pressure may also have horizontal traction components generating pitch
moments, a single **equivalent bending couple** at the beam midpoint restores
the full integrated global pitching moment `-M_y`. This couple's location
is a modeling decision: it is not an exact mapping of local shell traction,
and the resulting bending distribution will depend on that idealisation.
The system audits total transferred force, X first moment and global beam
pitch moment before performing the FE solve.

### Boundary condition selection

- `Pinned / roller fixture`: artificial end supports can carry vertical
  residuals or trim moments. Nonzero reactions are reported; this is NOT a
  freely floating vessel.
- `Balanced floating reference`: uses these mathematical supports to
  eliminate rigid-body modes only. The requested input must have negligible
  net vertical force and beam pitching moment, baseline hull CG on the
  declared uniform beam weight centroid, and negligible artificial support
  reaction. If the checks fail, the solve is explicitly blocked. The user
  must solve Hydro displacement/draft and loading, or choose the fixture
  case and interpret its reactions.

These results remain preliminary **global Euler–Bernoulli beam bending**,
with manually supplied E, structural second moment I, extreme fibre and
neutral axis. The model omits shear deformation, hull-shell plates,
torsion, wave loads, local load application effects, transverse pressure
stress, buckling, strength certification and hydroelastic supports.

The default Structural model is unchanged until the user chooses the
pressure-connected load case. A Gunnerus visual model with disabled or
unvalidated Hydro is **not** allowed to source hydrostatic beam pressure
until its external hull geometry and capability are qualified.

New automated coverage:

- `tests/hydro-beam-transfer.test.mjs`: exact station clipping, force
  and first-moment conservation, pitching couple, balanced barge,
  unbalanced fixture reactions and explicit rejection cases.
- `tests/browser/hull-girder-hydro-coupled-smoke.html`: coupled beam
  rendering, mass/buoyancy chart and floating-equilibrium guard.

## Regression and CI

- `tests/deck-surface-projection.test.mjs`: geometry transforms,
  explicit/candidate tags and uncovered footprints.
- `tests/hydro-force-balance.test.mjs`: analytical Archimedes check,
  vertical force residual and missing hull mass.
- `tests/browser/load-sketch-smoke.html`: drawing, moving, editing, undo,
  Z from model geometry and rejecting loads outside a selected deck.
- `tests/hydro-panel.test.mjs`: earlier hydro UI controls and plot rendering.

The GitHub Pages workflow runs the regression and browser smoke tests.
