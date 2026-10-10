# KISSsoft browser support

## Regression recovery — 2026-10-10

Commit [fe44a810](https://github.com/TorMT/FolkNettside-v2/commit/fe44a8109849da7e0a1ca20e2c80b3e4154d4193) (merged 2026-10-09) unintentionally changed the **default** planetary boundary from `ring-fixed` to `carrier-fixed`. The original fixed-ring/sun-drive educational behavior is now restored on initial load, while the explicitly selectable fixed-sun and fixed-carrier alternatives remain available. This is a targeted rollback, **not** a revert of the other bug fixes or file-format support.

### Built-in examples

| Filename | Purpose | Geometric constraints |
|---|---|---|
| `examples/kisssoft/PlanetaryExample.Z14` | Sun 25, planet 35, internal ring −95, normal module 2 mm | Planetary closure 25+2×35=95, nominal sun–planet center 60 mm |
| `examples/kisssoft/InternalRingAndPinion.Z012RS` | Internal ring −225 with 20-tooth pinion, normal module 20 mm, β=15° | Nominal center distance **2122.31617 mm** with zero profile shift, ratio +20/225 |
| `examples/kisssoft/HelicalExternalPair.Z12` | External 20/40 teeth, normal module 3 mm, β=20° | Nominal center distance **95.77600 mm**, ratio −1/2 |

The original internal-ring `InternalRingAndPinion.Z12` path is preserved for old links. The synthetic `.Z012RS` duplicate demonstrates native suffix handling in the browser, **not** that this short fixture is a complete native KISSsoft project file. All three are synthetic samples, not exported engineering verification or actual KISSsoft strength/contact solutions.

Each sample has a one-click loader and a download link from Engineering → KISSsoft. The loader resolves example URLs relative to the module path, so it works even if the page is embedded elsewhere. Invalid source parameters are never auto-corrected without notice.

Regression coverage: `tests/kisssoft-examples.test.mjs` validates file geometry, angle interpretation and expected links; `tests/browser/kisssoft-smoke.html` verifies the initial fixed-ring boundary and example loading. Real customer files and full contact geometry still require direct validation.

## Imported formats

- `.Z14`, `.Z014RS`: parameter-based planetary visualizer, if a compatible `MODULE=Z014` record has sun/planet/internal-ring tooth counts and a positive normal module
- `.Z12`, `.Z012RS`: parameter inspection and approximate 3D pair visualizations when signed tooth counts and module support a valid external or internal mesh
- `.W10`, `.KSYS`: bounded generic parameter inspection; do not infer an assembly from unmatched fields
- UTF-16LE, UTF-16BE BOM and UTF-8 sources accepted, with a 12 MB limit
- Inputs are read locally; no script commands in the file are evaluated

The shared Courses ViewerShell registers these formats. Engineering has a dedicated `#/engineering/kisssoft` tool and upload interface.

## Interpretation and limits

The parameter example `Stage3PlanetaryGear.Z14` used for tests has `ZR[0].z=25`, `ZR[1].z=35`, `ZR[2].z=-95`, `ZS.Geo.mn=2`, `ZS.Geo.beta=0`, and face widths of 35 mm. A nominal sun-to-planet center distance of 60 mm and nominal pitch diameters of 50/70/190 mm follow geometrically.

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
