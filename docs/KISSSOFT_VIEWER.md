# KISSsoft browser support

## Imported formats

- `.Z14`: parameter-based planetary visualizer, if a compatible `MODULE=Z014` record has sun/planet/internal-ring tooth counts and a positive normal module
- `.Z12`, `.W10`, `.KSYS`: bounded generic parameter inspection; do not infer an assembly from unmatched fields
- UTF-16LE, UTF-16BE BOM and UTF-8 sources accepted, with a 12 MB limit
- Inputs are read locally; no script commands in the file are evaluated

The shared Courses ViewerShell registers these formats. Engineering has a dedicated `#/engineering/kisssoft` tool and upload interface.

## Interpretation and limits

The test fixture `Stage3PlanetaryGear.Z14` from KISSsoft 2026 SP1 has `ZR[0].z=25`, `ZR[1].z=35`, `ZR[2].z=-95`, `ZS.Geo.mn=2`, `ZS.Geo.beta=0`, and face widths of 35 mm. A nominal sun-to-planet center distance of 60 mm and nominal pitch diameters of 50/70/190 mm follow geometrically.

**The 2D SVG diagram is only a schematic** of the gear layout and pitch proportions. Teeth are stylized, not true involute profiles; ring tooth spacing, phases, profile shifts, helix, fillets, backlash, axes/bearings, clearance, and 3D CAD are not solved here. Three planets are displayed illustratively, not read as an asserted planet count.

For actual 3D geometry, export a neutral CAD mesh from KISSsoft or another authorized engineering tool (STL/3MF) and open it in the existing V2 Model Inspector. Do not label a conceptual sketch as a model certified for manufacture, tooth strength or mesh compatibility.

## Test approach

Run `npm test` for parser/UTF-16/parameter/sanitization regression tests. A complete end-to-end check requires uploading a genuine file in a browser and checking the Engineering link and shared ViewerShell. Real KISSsoft calculation parity remains out of scope.
