# v2 migration matrix

Status values: `fixture`, `prototype`, `rewrite-next`, `planned`.

| Legacy capability | v2 target | Fixture | Status | Notes |
|---|---|---:|---|---|
| Course/semester indexing | `scripts/update_site.py` + one manifest | yes | prototype | One-purpose updater; no HTML patching |
| Theme picker | Settings + `src/settings.js` | n/a | prototype | No floating theme control |
| PDF viewer | ViewerShell adapter | PDF | prototype | Native browser renderer first |
| Code/text/Python | ViewerShell code adapter | MD, PY | prototype | Lazy highlight.js, line numbers and copy |
| CSV | ViewerShell CSV adapter | CSV | prototype | Delimiter detection; table renderer |
| HTML | ViewerShell HTML adapter | HTML | prototype | Sandboxed iframe |
| Notebook | ViewerShell notebook adapter | IPYNB | prototype | Source/output rendering |
| LaTeX | dedicated adapter | TEX | prototype | Lazy KaTeX preview with source fallback |
| Office | shared OOXML adapter | DOCX/XLSX/PPTX | prototype | Lazy ZIP/XML parser; provider-free baseline |
| Video | shared video adapter/workspace | MP4 | prototype | Local resume/watched state; metadata/search next |
| STL | shared Three.js ModelScene | ASCII STL | prototype | Render-on-demand; binary parser included |
| 3MF | ModelDocument + shared Three.js scene | 3MF geometry assembly | prototype | Object/build identity, units, transforms and selection |
| Fusion F3D/F3Z | semantic import pipeline | pending | planned | APS/native pipeline; do not fake F3Z as 3MF |
| STEP/IGES | shared CAD import | pending | planned | Keep component/source identity where possible |
| Hydrostatics | exact clipped-triangle surface integrals | box/wedge/multi-component | prototype | CI validates volume, CB and waterplane moments; worker/BVH only if needed |
| FEM | engineering workspace module | pending beam fixtures | planned | Beam/frame first, then Gmsh/CalculiX |
| CFD/resistance | engineering workspace module | pending | planned | Estimate first, OpenFOAM backend later |
| Thruster flow | propulsion module | pending | planned | Actuator disk first |
| CoolProp | engineering/science tool module | pending | planned | Consolidate variants |
| Fluid calculator | shared calculator page | pending | planned | Preserve useful equations only |
| ChemDraw | chemistry tool module | pending | planned | Review active use |
| Crystal structures | 3D science tool module | pending | planned | Reuse shared renderer |
| Periodic table | data-driven tool | pending | planned | Keep if actively useful |
| Quiz | shared course module | quiz JSON | prototype | Interactive scoring/feedback; data-driven |
| Karakterweb | shared course capability | course code | prototype | External fallback always available |
| Google Drive/login | Settings connection service | n/a | planned | Optional auth only |
| Autodesk login | Settings connection service | n/a | planned | Optional auth only |

Every row gets a deterministic fixture before being considered migrated.
