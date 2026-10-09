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
