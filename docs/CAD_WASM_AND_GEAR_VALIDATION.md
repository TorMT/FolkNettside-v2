# CAD and KISSsoft quality contract — V2 preview

## Import matrix

| Source | V2 status | Behavior and important limits |
|---|---|---|
| STL | supported | Triangle-mesh data, no feature/history tree |
| 3MF | supported | Assembly hierarchy, transforms and triangle mesh |
| GLB/GLTF, OBJ | supported in their existing adapters | Rendered mesh, not editable parametric CAD |
| **STEP/STP** | **OpenCascade WASM** | Real B-rep imported and tessellated in isolated browser Worker; hierarchy, source names and colors preserved where available |
| **IGES/IGS** | **OpenCascade WASM** | Surface/solid import and tessellation where OCCT can extract triangles |
| **BREP** | **OpenCascade WASM** | OCCT BREP tessellation; original units may be unavailable, use explicit BREP unit selector |
| F3Z | 3MF/STL; now neutral STEP/IGES/BREP fallback | Only when such neutral representation is embedded, not proprietary Fusion BRep reverse-engineering |
| F3D | conversion required | Native Fusion archive internals are not parsed; neutral export/Autodesk-authorized API still necessary |
| SolidWorks/NX/Parasolid etc. | conversion required | Use an authorized native CAD export to STEP/3MF/STL |

**All model bytes remain local to the browser.** Only a pinned third-party OpenCascade JS and WASM runtime is downloaded from a CDN when STEP/IGES/BREP is first used. This needs network connectivity, but no CAD documents are sent to the CDN. Before claiming an offline CAD mode, pin and vendor the audited WASM files via a separate binary packaging workflow. This is computationally expensive and limited to 25 MiB source and 1.5 million triangles for browser safety.

### Coordinate and geometry semantics

STEP/IGES output is requested in millimeters from OCCT and converted by the shared `ModelDocument.unitScaleToMeters`. BREP's source units are not always embedded in the format, so the selected source units are an **assumption**. Where OCCT provides names, face counts, colors and hierarchy, they are stored in ModelDocument. Native B-rep geometry, feature history, sketches, constraints and manufacturing tolerance are *not* preserved after tessellation. Hydro still needs validated watertight meshes; viewer success is never automatic permission for Hydro or FEM.

## KISSsoft

- Z014 planetary: inspect teeth, module, helix and face widths. Pitch consistency requires `z_r=z_s+2z_p`. View normalized speeds for fixed-ring, fixed-sun or fixed-carrier cases, calculated from Willis' equation, with a displayed numerical closure residual.
- Z012 two-shaft external meshes: `a=m_n(z_1+z_2)/(2cos beta)`, `omega_2/omega_1=-z_1/z_2`; visually counter-rotating helical teeth.
- Z012 pinion + internal ring: use a *negative* ring tooth count; `a=m_n(|z_r|-z_p)/(2cos beta)`, `omega_r/omega_p=+z_p/|z_r|`; same rotation direction and the same helix hand for an internal mesh.
- W10/KSYS and unsupported KISSsoft modules: parameter inspection only until real parameter layouts are verified. An inconsistent Z014 must never silently be reinterpreted as an external gear pair.
- These are ideal nominal pitch and speed calculations, not KISSsoft contact/stress, clearance/backlash, bearing loads, profile modification or genuine involute CAD. The 3D geometry is a purposely approximate educational concept showing assembly and relative motion.

## Acceptance tests

- `tests/cad-wasm-import.test.mjs`: mesh topology, hierarchy, mm output, bounds/security limits, cancellation
- `tests/browser/cad-step-smoke.html`: actual 300 mm upstream STEP cube read by OCCT browser WASM, then rendered by the shared Model viewer
- `tests/fusion-archive.test.mjs`: deterministic neutral-file fallback within Fusion archives
- `tests/gear-wave-audit.test.mjs`: external/internal pitch & angular ratios, invalid planetary fallback
- `tests/browser/kisssoft-smoke.html`: WebGL imported planetary, external and internal gearing and motion ratios

Still needed for high confidence: test with the user's genuine KISSsoft Z012/Z014/KSYS/W10 sources and several professional CAD exports across browsers and devices; check axis/units against reference dimensions and STEP color hierarchy on a real multi-part assembly. Native F3D and STEP B-rep *editing* are not claimed.

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

## Fusion-style navigation, component groups and SpaceMouse

All imported mesh/CAD formats use the same orbitable workbench, including
neutral geometries inside F3D/F3Z archives. Select the 3D canvas (click or Tab)
to activate local keyboard controls:

| Gesture / key | Effect |
|---|---|
| Left mouse drag | Orbit the camera |
| Middle mouse drag | Pan |
| Shift + middle mouse drag | Orbit (Fusion-style) |
| Wheel / two-finger pinch | Zoom |
| F, I, T | Fit, isometric, top |
| 1–5 | Front, rear, port, starboard, top |
| Arrow keys | Pan the camera |
| Shift + arrows | Orbit the camera |
| + / − | Zoom |
| X / Escape | Toggle whole assembly explosion / restore assembled view |

The 3DConnexion SpaceMouse integration uses the **WebHID API** in supporting
desktop Chromium browsers over HTTPS. Press **Connect 3D mouse** inside the
viewer and explicitly grant device permission. The integration reads 3-axis
translation and 3-axis rotation HID reports, with a deadzone and clamping.
It never requests permission on page load and ignores reports unless the
CAD workbench is focused and the page is visible. The device connection is
closed on viewer disposal. The actual hardware/device-driver/OS mapping and
3DConnexion driver interactions still require physical-hardware validation.
WebHID is not supported in Safari/Firefox and cannot be promised to work with
every SpaceMouse firmware/driver. Mouse and touch remain available.

Component grouping is **view-only**. Shared root words form assemblies:
`Fremre skrog babord` and `Bakre skrog` are grouped under `Skrog`,
with nested `Fremre`/`Babord` subgroups where multiple parts share them.
`Thruster fremre` and `Thruster bakre` are grouped under `Thruster`.
Manual group paths such as `Thruster / Fremre / Motor` can override naming
for the current session. Users can focus, isolate or explode **the whole
assembly, a group, a subgroup or one existing CAD component**. A single
monolithic mesh cannot be split into internal parts without an actual
assembly structure. Changes never modify ModelDocument or source CAD.

The optional thruster markup requires an explicitly selected group/component,
thrust-axis (+X/−X/+Y/−Y/+Z/−Z) and propeller diameter. Animated intake rings
visually travel from the suction side toward the propeller disk and arrows
show assumed flow direction. This is an illustration of direction only,
**not simulated CFD, streamtube contraction, velocity magnitude or
cavitation prediction**. Source metadata is used only if axis and diameter
are explicitly provided. Selected original hull geometry can be checked
for watertightness and used for a preliminary still-water volume/CB/waterplane
calculation; invalid, intersecting, open or overly large hull meshes are
blocked from producing hydrostatic figures. The exploded presentation is
never used in Hydro calculations.

New regression checks:
`tests/cad-groups-navigation-spacemouse.test.mjs` and
`tests/browser/cad-assembly-navigation-smoke.html` verify shared-name
hierarchies, manual groups, scoped explosions, isolation, focus,
thruster ring markup, keyboard movement and gated WebHID reports.
