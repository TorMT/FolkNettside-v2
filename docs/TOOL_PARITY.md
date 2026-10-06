# Tool functional parity contract

A v2 tool must not replace or hide its legacy counterpart until all working legacy capabilities are present in v2 or the user explicitly approves a different replacement.

Parity states:
- `partial`: known legacy features are missing.
- `review`: feature coverage appears complete but still needs explicit side-by-side verification.
- `full`: verified parity or approved supersession.

While parity is not `full`, the v2 Tools page must retain a working HTTPS link to the full legacy tool.

## CoolProp

Legacy: `Tools/Coolprop/CoolPropForbedretKanksje2.html`

Already migrated:
- two independent state inputs
- fluid selection
- engineering-unit conversion around SI CoolProp calls
- standard state-property output
- phase identification
- local/lazy WASM runtime

Still required for full parity:
- batch multi-output
- batch diagram support
- process chain: isobaric, isothermal, isentropic, isochoric, isenthalpic
- process diagrams
- All data / explore
- log P-h, linear P-h, T-s and P-v diagrams
- saturation dome
- optional isotherms, isobars and quality lines
- diagram reset/zoom
- PNG export
- CSV export
- JSON export
- Air book-basis calibration
- integrated help/reference notes

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

Legacy behavior still to verify/migrate:
- one-click quick filters: metals, non-metals, STP gases, BCC, FCC, radioactive
- explicit reset filters
- clear selected element
- property tabs matching legacy set, including atomic radius and first ionization/electron affinity presentation
- legacy info panel behavior and Wikipedia link

Status stays `partial` until these are covered.

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

## Theme creator

Legacy: `Tools/theme-creator.html`

Preserve:
- theme name/editing
- live preview
- CSS generation
- JS generation
- reset
- copy outputs

This may ultimately live under Settings/Developer rather than Courses/Tools.

## Image to theme

Legacy: `Tools/image-to-theme.html`

Preserve:
- image upload/drag-drop
- palette extraction
- color role assignment
- auto-assign
- live preview
- generate CSS
- generate JS
- JSON download
- reset/new image

This may ultimately live under Settings/Developer.

## Migration rule

Before any legacy tool is removed, hidden, or redirected:
1. inventory all working legacy features;
2. encode the inventory here;
3. add deterministic tests for calculation/data logic;
4. verify the v2 UI exposes the functions;
5. compare v2 and legacy side-by-side;
6. keep the legacy fallback until parity becomes `full`;
7. only then change the registry parity to `full`.
