# Third-party notices

## Periodic Table JSON data

The local file `data/periodic-table.json` is sourced from:

- Project: Bowserinator/Periodic-Table-JSON
- Source file: `PeriodicTableJSON.json`
- License: Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)
- The upstream project states that the data is cited from Wikipedia.

The v2 site vendors this dataset locally so the periodic-table tool does not depend on a runtime network request. Test fixtures remain separate under `examples/tools/`.


## CoolProp WebAssembly engine

The v2 CoolProp tool reuses the existing local CoolProp WebAssembly build from the legacy FolkNettside deployment.

- Runtime wrapper source in v2: `src/vendor/coolprop/coolprop.js`
- WebAssembly binary source during build: `https://tormt.folk.ntnu.no/Tools/Coolprop/coolprop.wasm`
- Legacy Git blob id used for integrity validation: `db4c724c417c9614a600c5105946be1605a02106`
- The binary is copied into the v2 Pages deployment during CI and is then served locally by v2.
- CoolProp itself is an open-source thermophysical property library; upstream licensing and attribution remain applicable.
