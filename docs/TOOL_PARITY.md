# Tool functional parity contract

A v2 tool must not replace its legacy counterpart until all **working legacy capabilities** are present in v2 or there is a documented, intentional replacement.

Parity states:

- `partial`: known working legacy features are still missing.
- `review`: v2 appears comparable or better, but legacy behavior still needs explicit verification.
- `full`: all working legacy features have been verified or intentionally superseded.

Until parity is `full`, a legacy fallback is retained when a legacy standalone tool exists.

## CoolProp

Legacy source:
`Tools/Coolprop/CoolPropForbedretKanksje2.html`

Required working parity:

- [x] Two independent state inputs
- [x] Fluid selection
- [x] Engineering-unit conversion around SI CoolProp calls
- [x] Full standard state-property output
- [x] Phase identification
- [ ] Batch multi-output input
- [ ] Batch state-point diagram support
- [ ] Process chain
  - [ ] isobaric
  - [ ] isothermal
  - [ ] isentropic
  - [ ] isochoric
  - [ ] isenthalpic
- [ ] Process state-point diagram support
- [ ] All-data/explore mode
- [ ] log P-h diagram
- [ ] linear P-h diagram
- [ ] T-s diagram
- [ ] P-v diagram
- [ ] saturation dome
- [ ] optional isotherms
- [ ] optional isobars
- [ ] optional quality lines
- [ ] diagram reset/zoom
- [ ] diagram PNG export
- [ ] CSV export
- [ ] JSON export
- [ ] legacy Air book-basis calibration
- [ ] integrated help/reference notes

Not counted as legacy parity because the old implementation itself explicitly marked them unimplemented:

- Table 4 batch mode
- Custom process mode requiring two freely selected new inputs

These can be implemented later as v2 improvements.

## Fluid properties

Legacy source:
`Tools/FluidKalkulator.html`

Review requirements:

- [x] Fluid selection
- [x] Temperature input/unit handling
- [x] density
- [x] dynamic viscosity
- [x] kinematic viscosity
- [x] cp
- [x] thermal conductivity
- [x] thermal diffusivity
- [x] Prandtl number
- [x] thermal expansion estimate
- [x] legacy polynomial behavior retained
- [x] v2 rejects non-physical polynomial output instead of silently displaying it
- [ ] final visual/behavior comparison against legacy

## Periodic table

Legacy source:
`Tools/PeriodicTable/periodic-table.html`

Review requirements:

- [x] local periodic data
- [x] search
- [x] category filtering
- [x] material classification
- [x] period/group filters
- [x] phase information
- [x] temperature-dependent phase
- [x] crystal-structure metadata/filtering
- [x] selectable property display
- [x] element detail
- [ ] final visual/behavior comparison against legacy

## Crystal structures

The old site did not expose a separate standalone Crystal Structure page in the current legacy Tools tree. v2 therefore treats this as an expanded replacement capability rather than a direct standalone migration.

Current v2 capabilities:

- [x] BCC
- [x] FCC
- [x] HCP
- [x] cell edges
- [x] lattice parameter scaling
- [x] HCP c/a handling
- [x] interactive shared Three.js viewer
- [x] render-on-demand
- [x] cleanup/disposal
- [ ] expand structures only when a real use case requires them

## Rule for future tools

Before a legacy tool is removed or hidden:

1. Record its working feature set here.
2. Add deterministic fixtures/tests for calculation logic.
3. Verify the v2 UI exposes those capabilities.
4. Keep a fallback while parity is incomplete.
5. Change registry parity to `full` only after verification.
