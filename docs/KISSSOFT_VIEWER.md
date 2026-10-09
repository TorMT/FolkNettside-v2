# KISSsoft browser support

## Imported formats

- `.Z14`: parameter-based planetary visualizer, if a compatible `MODULE=Z014` record has sun/planet/internal-ring tooth counts and a positive normal module
- `.Z12`, `.W10`, `.KSYS`: bounded generic parameter inspection; do not infer an assembly from unmatched fields
- UTF-16LE, UTF-16BE BOM and UTF-8 sources accepted, with a 12 MB limit
- Inputs are read locally; no script commands in the file are evaluated

The shared Courses ViewerShell registers these formats. Engineering has a dedicated `#/engineering/kisssoft` tool and upload interface.

## Interpretation and limits

The test fixture `Stage3PlanetaryGear.Z14` from KISSsoft 2026 SP1 has `ZR[0].z=25`, `ZR[1].z=35`, `ZR[2].z=-95`, `ZS.Geo.mn=2`, `ZS.Geo.beta=0`, and face widths of 35 mm. A nominal sun-to-planet center distance of 60 mm and nominal pitch diameters of 50/70/190 mm follow geometrically.

**The optional orbitable Three.js 3D scene and the 2D SVG diagram are both schematic** of the gear layout and pitch proportions. 3D tooth blocks and 2D teeth are stylized, not true involute profiles; ring tooth spacing, phases, profile shifts, helix, fillets, backlash, axes/bearings, clearance, and 3D CAD are not solved here. Three planets are displayed illustratively, not read as an asserted planet count.

For accurate 3D geometry, export a neutral CAD mesh from KISSsoft or another authorized engineering tool (STL/3MF) and open it in the existing V2 Model Inspector. Do not label a conceptual sketch as a model certified for manufacture, tooth strength or mesh compatibility.

## Test approach

Run `npm test` for parser/UTF-16/parameter/sanitization regression tests. A complete end-to-end check requires uploading a genuine file in a browser and checking the Engineering link and shared ViewerShell. Real KISSsoft calculation parity remains out of scope.

## Animated fixed-ring interpretation

The conceptual WebGL assembly now has Play/Pause, a normalized playback-speed
slider, housing/carrier visibility and exploded-view controls. The sample
25/35/95-tooth assembly uses the ideal *fixed ring* relation:

- Sun = +1.000 normalized revolution rate
- Ring = 0
- Carrier = 25 / (25 + 95) = +0.2083
- Planet gear (absolute) = -0.3571, relative to the carrier = -0.5655

These values describe ideal gear kinematics under the **assumed boundary
condition** that the ring is stationary and the sun is driving. This is a visual
explanation, not an assertion that the actual KISSsoft shaft speeds, number of
planets, tooth geometry, housing or bearings match the illustrative model.
Pause and reduced-motion preferences are respected. The same KISSsoft file
adapter is used from Courses resources and the Engineering page.

## Native KISSsoft angular units

KISSsoft parameter files store `ZS.Geo.beta` as **radians**, not degrees. The
native value in `model.fields` remains unchanged; the parsed `model.betaRad`
and `model.beta` represent radians and degrees respectively. Calculations
such as `m_t=m_n/cos(beta)` convert the normalized degree angle back to
radians for JavaScript trigonometry. `ZS.Geo.alfn` similarly denotes the
normal pressure angle in radians; the preview displays its degree equivalent.
The conversion is documented by KISSsoft's report notation
`Grad(ZS.Geo.beta)` in the official KISSsoft user manual (2024, section 12.1):
https://www.kisssoft.com/files/TXGMHz/KISSsoft-Manual-en-v2402.pdf
The browser test uses 0.3490658504 radians to represent 20°. Treating this
source value as 20° would have corrupted helix and center-distance results.
