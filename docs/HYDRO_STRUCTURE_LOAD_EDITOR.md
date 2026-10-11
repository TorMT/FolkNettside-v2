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

The panel **does not compute the local pressure distribution** \(p(z)=
\rho g\max(h-z,0)\) over the wetted faces, and the resulting beam reactions
of the current **Structure** panel do not include buoyancy; its supports
remain a simply supported test idealisation.

### Recommended next method

For a genuine distributed hull buoyancy load, integrate pressure *normal to
each clipped, verified, submerged external hull triangle*, and verify that
the integrated vertical resultant and moment match \(\rho g V\) and the
existing CB to numerical tolerance. Only then map the integrated loads to
a separately declared hull-girder or shell FEM support model. Do not use a
visual rectangle or a uniform upward line load as a replacement for this
calculation.

## Regression and CI

- `tests/deck-surface-projection.test.mjs`: geometry transforms,
  explicit/candidate tags and uncovered footprints.
- `tests/hydro-force-balance.test.mjs`: analytical Archimedes check,
  vertical force residual and missing hull mass.
- `tests/browser/load-sketch-smoke.html`: drawing, moving, editing, undo,
  Z from model geometry and rejecting loads outside a selected deck.
- `tests/hydro-panel.test.mjs`: earlier hydro UI controls and plot rendering.

The GitHub Pages workflow runs the regression and browser smoke tests.
