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

v2 currently:
- BCC
- FCC
- HCP
- cell edges
- lattice scaling and HCP c/a
- shared Three.js renderer
- render-on-demand and cleanup

Legacy capabilities that must remain available until migrated:
- structures: SC, BCC, FCC, Diamond, HCP, NaCl, CsCl, ZnS, CaF2, Spinel
- element/material presets including Fe, Cu, Al, Ni, Si, C and spinel examples
- measurement tool with undo/clear
- tetrahedral and octahedral hole visualization
- structure analyzer
- defect modes: dopant substitution, vacancy, interstitial, electron marker, hole marker
- atom/hole visibility modes
- manual atom placement
- manual atom type/radius/color
- undo/clear manual atoms
- reset view and other working legacy interaction controls

Status: `partial`.

## Chemical structure editor

Legacy: `Tools/ChemDraw.html`

Parity requirements:
- New
- Import
- MOL export
- SMILES export
- Undo
- Redo
- Clean 2D
- Copy SMILES
- existing tips/error-help behavior where useful

Until migrated, this remains a legacy-only tool in the v2 registry.

## Advanced STL engineering viewer

Legacy: `Tools/stlview1.html`

Parity requirements or approved replacements:
- Fit / Reset / Zoom+ / Zoom-
- download/open original
- import alignment
- automatic boat alignment
- reset alignment
- axis swaps X/Y, X/Z, Y/Z
- camera/view presets
- object rotation controls
- render/view options
- theme/look controls where still relevant
- measurement + clear
- CG/CB information/recalculation
- hydro waterline
- trim/heel reset
- PNG export
- working help modes

Some of these can be superseded by the shared Model/Engineering workspace, but legacy access remains until the replacement is demonstrably complete.

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
