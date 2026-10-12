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
The system independently checks each X-strip's **vertical force and
vertical-force X first moment** against the unbinned wetted triangles. It
then audits total transferred force, X first moment and the complete global
beam pitch moment before performing the FE solve. The numerical structural
reactions are separately checked against *both* force equilibrium and
pitch-moment equilibrium about the beam's initial X station. A result with
an unexplained moment residual is rejected rather than silently displayed.

The maximum vertical beam deflection is extracted from the stationary
points of each **cubic Hermite finite-element interpolation**, including
locations between mesh nodes. This is an exact extremum of the FE interpolant,
not an exact continuum Euler–Bernoulli solution at a coarse discretization.

The Structure results now display separate shear-force and bending-moment
diagrams with element-side discontinuities, plus reaction and equilibrium
residual readouts. Use **Export response CSV** for all FE field samples,
**Export load strips CSV** for gravity and buoyancy line load components,
and **Export reactions CSV** for constrained support forces. These
machine-readable outputs use SI units in column names and intentionally
preserve duplicate X positions on opposite sides of load jumps. The source
engineering-case report continues to store the assumptions and scenario.

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
- `tests/girder-equilibrium.test.mjs`: independent pin/roller reaction
  and pitch-moment balance, with sub-element deflection maxima.
- `tests/girder-reporting.test.mjs`: side-limit shear/moment SVGs and
  auditable SI CSV exports, including E/I/EI and baseline t/m values.
- `tests/girder-profiles.test.mjs`: varying section stiffness, nonuniform
  baseline mass with independent mass/LCG checks, reaction shifts and
  backward compatibility with constant-EI baseline.

## Longitudinal EI(x) and baseline mass per metre (new)

Structure now permits **two optional, explicit, complete X-station profiles**
from **Longitudinal beam profiles** in the structural input inspector:

- Structural: `x0_m, x1_m, E_GPa, I_m4`. Each section sets its own
  Euler–Bernoulli bending rigidity `EI`. **E and I are manually supplied**
  structural properties and are not inferred from triangles of a visual 3D
  hull shell. If the structural table is empty, the original constant E/I
  inputs remain in use.
- Baseline structural mass: `x0_m, x1_m, tonnes_per_m`. This gives
  the **unloaded** hull's longitudinal weight distribution. Point masses
  and distributed deck masses remain additional, separate inputs. If the
  mass table is empty, the original uniform `hullMassTonnes / span` law
  remains in use.

A non-empty profile must be arranged **from aft/low X to forward/high X**,
covering the entire world-coordinate girder X extent **without gaps,
overlap, zero or negative element length**. Each profile can have up to
60 sections. The solver creates actual FEM nodes at all section boundaries,
including all Hydro pressure station boundaries and additional mass loads,
rather than averaging the jump over neighboring beam elements.

For a given baseline mass profile, calculate:

```text
m_hull = sum_i ((x1_i-x0_i) * tonnesPerMeter_i)       [tonnes]
LCG_hull = sum_i (m_i * (x0_i+x1_i)/2) / m_hull          [metres]
gravity_line_load_i = -1000 * g * tonnesPerMeter_i   [N/m]
```

The independent mass audit **rejects** an explicit profile if its integrated
mass differs from the entered unloaded hull mass or if its computed LCG
differs from the entered unloaded hull CG X. No hidden scale normalization
or displacement-as-mass shortcut is used. A legacy uniform profile continues
to place baseline gravity at beam mid-span. In the floating-equilibrium
case, a mismatched entered baseline CG and uniform beam centroid remains
invalid; in other cases, the input is a *declared uniform idealisation*.

Bending stress uses **local** section inertia `sigma_x=M(x)*c/I(x)`, with
uniform entered extreme-fibre distance `c`. The location of the peak
absolute stress can now change even if the maximum absolute bending moment
has not changed. The stress display is still a beam-fibre result, not hull
plating von Mises stress, nor a complete shell model; a true hull section
needs plate thickness, material and frame/bulkhead participation.

The result shows separately the EI(x) and baseline mass(x) profiles; **Export
EI/mass sections CSV** writes the effective E, I, EI and mass density for
every actual beam element. Existing case-report and mass/force/moment
exports remain available.

**Next engineering level:** Source true section inertia from an explicit
longitudinal cross-section *structural* model (plate geometry and thickness,
stiffeners, bulkheads, materials, effective breadth) with a documented
neutral axis, and compare weight by frame/station to a declared weight
ledger. A watertight *external visual hull surface alone cannot provide
these engineering properties*.

## Explicit 2D structural cross-sections: plate/stiffener EI and material stress

Structure also offers **Structural cross-sections · plating, stiffeners,
materials**. This is a declared **engineering structural cross-section**
in the transverse Y / vertical Z plane, repeated for one or more X
intervals. It is not inferred from an imported visual hull STL/GLB mesh.

Each CSV-style row has one of two forms:

```text
# flat/angled plate segment in YZ, with thickness normal to the segment
plate,x0,x1,y0,z0,y1,z1,thickness_m,E_GPa,density_kg_m3

# rectangular longitudinal stiffener (Y-width by Z-height)
stiffener,x0,x1,y_center,z_center,width_y,height_z,E_GPa,density_kg_m3
```

An intentionally **illustrative** 10 m beam made of two longitudinal
plates (not an actual vessel scantling) can be entered as:

```text
plate,0,10,-1,1,1,1,0.1,210,7850
plate,0,10,-1,-1,1,-1,0.1,210,7850
```

**All positions and thicknesses are metres** in the world-coordinate
system. The example is deliberately thick to make analytical checks easy.
For a real vessel, use validated drawings, material specifications and
actual plating/stiffener dimensions.

For each longitudinal section, the engine calculates:

```text
A_i = plate_thickness * plate_length  OR  stiffener_width*stiffener_height
z_NA = sum(E_i A_i z_i) / sum(E_i A_i)
EI = sum(E_i * (I_yy,i,own + A_i*(z_i - z_NA)^2))
m_per_m = sum(A_i * density_i) / 1000 [t/m]
sigma_x,i(z) = M(x) * E_i * (z-z_NA) / EI
```

Each plate's exact rectangular own second moment includes its orientation
and normal thickness, while rectangular stiffeners contribute exact
width×height area and width×height³/12 inertia about their centroid.
Composite neutral-axis locations and section extrema are calculated from
those explicitly declared components, including mixed material E.

For compatibility with the existing Euler–Bernoulli solver, the computed
EI is passed as `E_ref * I_equivalent` where `E_ref` is the existing
general structural modulus field. **The reference modulus does not replace
member-specific material moduli** for bending stress calculations.
The general (I) and fibre distance `c` are fallback inputs; a populated
cross-section table replaces the manual EI-station table. These two
sources cannot both be active.

### Structural weight is not vessel baseline by default

The new cross-section model calculates **gross mass of its structural
components**, which generally excludes fluids, machinery, equipment,
outfitting and anything not explicitly entered.

By default, choose **Stiffness only**. The existing independent hull
baseline mass and optional longitudinal mass-profile ledger remain
authoritative.

An opt-in mode can use the calculated plate/stiffener `t/m` values as
the vessel's baseline weight **only when they are complete**: explicit
mass and LCG comparison with the entered hull baseline must pass, and a
separate manual mass profile must not also be provided. The solver never
silently replaces missing hull weight with hydrostatic displacement or
renormalizes a partial cross-section model.

Every structural station has its own calculated (EI), equivalent I,
elastic neutral axis Z and gross material weight per metre. These appear
in a Y/Z geometry preview and a longitudinal property table. The
resultant beam bending stress chooses the maximum absolute *member*
fibre stress using material E and its elastic-neutral-axis distance,
rather than the global manual (c/I) law.

### Important engineering limits

This is a **gross structural-section** idealisation, not a scantling
verification or full ship stiffness model. It does **not** detect or
subtract overlapping web/flange areas, penetrations, corrosion deductions,
effective breadth, shear lag or member instability. It assumes that
members act together in longitudinal bending and that the relevant joints
transfer shear. No torsional warping, transverse hull stress, fatigue,
wave-induced dynamic load or regulatory class-rules assessment is made.

Validate the physical section connectivity, plate intersections,
neutral-axis assumptions, buckling and shear transfer separately before
using these values for design. For mixed-material sections, report fibre
stress by material if detailed design is required.

The following tests cover these assumptions:
`tests/girder-section-properties.test.mjs` checks exact flanges,
webs, rectangles, composite material neutral axes, weight and invalid
geometries. `tests/girder-section-integration.test.mjs` checks that the
computed sectional EI and material fibre stresses are actually used by
the existing structural FEM, including the explicit baseline-weight gate.
The coupled Hydro/Structure browser smoke additionally checks UI fields
and the structural Y/Z preview.

## Regression and CI

- `tests/deck-surface-projection.test.mjs`: geometry transforms,
  explicit/candidate tags and uncovered footprints.
- `tests/hydro-force-balance.test.mjs`: analytical Archimedes check,
  vertical force residual and missing hull mass.
- `tests/browser/load-sketch-smoke.html`: drawing, moving, editing, undo,
  Z from model geometry and rejecting loads outside a selected deck.
- `tests/hydro-panel.test.mjs`: earlier hydro UI controls and plot rendering.

The GitHub Pages workflow runs the regression and browser smoke tests.
