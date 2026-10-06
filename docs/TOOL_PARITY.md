# Tool functional parity contract

A v2 tool must not replace or hide its legacy counterpart until all working legacy capabilities are present in v2 or the user explicitly approves a different replacement.

Parity states:
- `partial`: known legacy features are missing.
- `review`: feature coverage appears complete but still needs explicit side-by-side verification.
- `full`: verified parity or approved supersession.
- `retired`: intentionally not migrated because the old tool/function is obsolete or has been replaced by an approved v2 mechanism.

While parity is neither `full` nor `retired`, the v2 Tools page must retain a working HTTPS link to the full legacy tool. Retired tools are excluded from the v2 Tools surface and from parity-review work.

## CoolProp

Legacy: `Tools/Coolprop/CoolPropForbedretKanksje2.html`

Already migrated:
- two independent state inputs
- fluid selection
- pressure / temperature / energy / entropy unit choices
- engineering-unit conversion around SI CoolProp calls
- standard state-property output
- phase identification
- local/lazy WASM runtime
- Batch multi-output with TP / PT / PH / PU formats
- process chain: isobaric, isothermal, isentropic, isochoric, isenthalpic
- All data / explore
- CSV export
- JSON export
- Air book-basis calibration

Now also migrated:
- Single / Batch / Process state-point diagrams
- log P-h, linear P-h, T-s and P-v diagrams
- saturation dome
- optional isotherms, isobars and quality lines
- diagram drag-pan / wheel-zoom / reset
- PNG export

Now also migrated:
- searchable integrated help/reference notes covering overview, diagrams, phases, units, Air book basis and common errors
- legacy P-T near-saturation / two-phase ambiguity warning

Remaining:
- final side-by-side functional and visual verification

Status: `review`. The full legacy fallback remains until verification promotes this to `full`.

The old implementation itself marked Table 4 batch mode and fully custom process input as incomplete; these are improvements, not parity blockers.

## Fluid properties

Legacy: `Tools/FluidKalkulator.html`

Migrated:
- fluid selection
- temperature + unit handling
- density
- dynamic and kinematic viscosity
- cp
- thermal conductivity
- thermal diffusivity
- Prandtl number
- thermal expansion estimate
- legacy polynomial behavior

v2 additionally rejects non-physical polynomial outputs.

Remaining:
- side-by-side visual/behavior verification before `full`.

## Periodic table

Legacy: `Tools/PeriodicTable/periodic-table.html`

Migrated:
- local element data
- search
- category/material/period/group/phase/crystal filters
- temperature-dependent phase
- selectable property display
- element detail

Now migrated:
- one-click quick filters: metals, non-metals, STP gases, BCC, FCC, radioactive
- explicit reset filters
- clear selected element
- the legacy property set, including atomic radius, first ionization and electron affinity
- element summary/detail panel
- source/Wikipedia link

Remaining:
- final side-by-side visual/behavior verification.

Status: `review`. Legacy fallback remains until `full`.

## Crystal structures

Legacy: `Tools/KrystallStrukturer/krystall-viewer.html`

Migrated:
- structures: SC, BCC, FCC, Diamond, HCP, NaCl, CsCl, ZnS, CaF2 and simplified Spinel
- material presets: Na, Fe, Cu, Al, Ni, Si, C, MgAl2O4 and Fe3O4
- cell replication and lattice scaling
- HCP c/a handling
- tetrahedral and octahedral hole visualization
- measurement with undo/clear
- atom/hole visibility modes
- bond visualization
- vacancy and dopant substitution by atom click or coordinate snap
- interstitials
- electron/hole markers
- manual atoms with type/radius/color
- edit undo/clear
- close-packed plane families
- custom Miller planes
- reset view
- composition/defect/bond/plane analyzer summary
- shared Three.js renderer with render-on-demand and cleanup

Remaining before review/full:
- compare the legacy advanced automatic structure/material analyzer against v2 and migrate any useful identification heuristics not represented by the explicit structure/preset model
- side-by-side interaction/visual verification

Status: `partial`. Legacy fallback remains available.

## Chemical structure editor

Legacy: `Tools/ChemDraw.html`

Migrated:
- lazy Kekule Composer runtime
- New
- Import for the legacy format set
- MOL export
- SMILES export
- Undo
- Redo
- Clean 2D
- Copy SMILES
- the legacy keyboard shortcuts
- load/error status and tips
- route cleanup so global hotkeys do not leak outside the tool

Remaining:
- final side-by-side behavior check against the legacy Kekule build.

Status: `review`. Legacy fallback remains available until `full`.

## Advanced STL / model inspector

Legacy: `Tools/stlview1.html`

Migrated into the shared ModelScene / Advanced Model Inspector:
- STL and 3MF local loading
- Fit / Reset / Zoom+ / Zoom-
- automatic boat alignment
- reset alignment
- axis swaps X/Y, X/Z, Y/Z
- camera presets: iso/front/rear/port/starboard/top
- separate alignment and user-attitude transforms
- X/Y/Z rotation controls
- wireframe, opacity, model color and background
- surface measurement with undo/clear
- model bounds / topology
- geometric solid centroid
- center of buoyancy
- displacement / waterplane area at horizontal waterline
- waterline visualization
- PNG export
- in-tool help
- shared scene cleanup and mobile layout

Superseded:
- viewer-local theme ownership is intentionally replaced by global Settings; explicit model/background appearance controls remain available where useful.

Remaining before parity review/full:
- verify legacy snap-to-vertex/edge measurement behavior and migrate it if still useful
- compare legacy clipping controls and retain/migrate them if they provide value not covered elsewhere
- hydro under non-zero trim/heel must use transformed analysis geometry, not only visual attitude
- final side-by-side visual/behavior check

Status: `partial`. Legacy fallback remains available.

## Retired theme tools

The following legacy tools are intentionally **not** migrated:

- `Tools/theme-creator.html`
- `Tools/image-to-theme.html`

Reason:
- v2 has one centralized Settings-owned theme system;
- viewer/tool-specific theme generation is intentionally removed;
- CSS/JS theme generators and image-to-theme export would reintroduce the duplicated theme architecture v2 is designed to eliminate.

Registry status: `retired`.

The legacy files may continue to exist on the old production site during the production freeze, but they are not parity blockers and should not be surfaced as v2 tools.

## Migration rule

For each legacy tool or feature:
1. inventory the working legacy behavior;
2. decide whether it is still useful, superseded, or obsolete;
3. if obsolete/superseded, document the reason and mark it `retired`;
4. otherwise encode the required parity here;
5. add deterministic tests for calculation/data logic;
6. verify the v2 UI exposes the functions;
7. compare v2 and legacy side-by-side;
8. keep the legacy fallback until parity becomes `full`;
9. only then change the registry parity to `full`.

Do not port obsolete functionality merely for numerical parity with the old Tools directory.
