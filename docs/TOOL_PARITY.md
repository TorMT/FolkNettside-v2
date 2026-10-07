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
- legacy Table 4 batch mode with exact R_spec constants and v_ideal / v_real / diff % / Z calculation
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

Verified numerically in deployed v2:
- Air book basis at 1000 K / 1 bar gives H = 1046.04 kJ/kg and U = 758.94 kJ/kg exactly;
- both legacy Air and Water Table 4 presets calculate all six rows successfully;
- Single-mode Water at 100 °C / 1.01325 bar raises the expected two-phase ambiguity warning.

Status: `full`. Legacy fallback remains temporarily for safety.

The legacy Table 4 mode is now explicitly migrated and regression-tested. Fully custom process input remains an optional improvement rather than a parity blocker.

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

Verified:
- deployed browser comparison covered all legacy fluids, C/F/K and all eight displayed properties.

Status: `full`. Legacy fallback remains temporarily for safety.

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

Verified:
- deployed browser test covered search, quick filters, dropdown filters, temperature phase, property selection, detail panel, reset/clear and Wikipedia link.

Status: `full`. Legacy fallback is retained temporarily as an additional safety link.

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

Analyzer parity added:
- first-shell cutoff detection
- coordination distribution, average and mode
- common SC/BCC/FCC/Diamond/NaCl/CsCl/ZnS/CaF2/Spinel matching
- stoichiometric ratio matching
- Fe-C / Fe3C-like and Fe-Cr(-Ni) material heuristics
- defect-aware confidence/details

Verified:
- deployed browser test exercised all ten structures, presets, replication, holes, measurement, defects, manual atoms, Miller planes and analyzer updates.

Status: `full`. Legacy fallback remains temporarily as a safety link.

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

Verified:
- deployed browser test confirmed the Kekule editor reaches Ready and exposes New/Import/MOL/SMILES/Undo/Redo/Clean 2D/Copy SMILES.

Status: `full`. Legacy fallback remains temporarily for safety.

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

Additional parity completed:
- measurement snap modes: none / vertex / edge / both, using the hit triangle for efficient local snapping
- configurable snap tolerance
- shared X/Y/Z clipping plane with invert + offset
- hydro analysis now applies the same heel/trim/yaw attitude as the 3D view

Verified:
- deployed browser test exercised model load, camera controls, alignment, axis swaps, appearance, snapping/measurement, clipping, CG/CB, waterline, attitude hydro, PNG and help.

Status: `full`. Legacy fallback remains temporarily for safety.

## Theme creator and Image to theme

Legacy:
- `Tools/theme-creator.html`
- `Tools/image-to-theme.html`

Migrated into the Settings-owned Theme Studio:
- manual theme name and role editing
- live preview
- CSS generation
- JS registry generation
- copy outputs
- image upload / drag-drop
- local image palette extraction
- five-color palette
- manual palette-to-role assignment
- auto-assign
- JSON download
- reset/new theme workflow

Architectural change:
- the generators no longer own runtime theme state;
- generated themes target the single Settings-owned theme system.

Manual Theme Creator verified:
- deployed browser test covered theme name, all color roles, live preview, CSS/JS outputs, copy, reset and JSON download.

Status:
- manual Theme Creator: `full`
- Image→Theme: `full` after deployed in-browser sample-image verification of file decoding, palette extraction, auto-assign, preview and exports.

Both legacy fallbacks remain temporarily for safety.

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
