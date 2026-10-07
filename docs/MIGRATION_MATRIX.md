# v2 migration matrix

Status values: `fixture`, `prototype`, `rewrite-next`, `planned`.

| Legacy capability | v2 target | Fixture | Status | Notes |
|---|---|---:|---|---|
| Course/semester indexing | `scripts/update_site.py` + one manifest | yes | prototype | One-purpose updater; no HTML patching |
| Theme picker | Settings + `src/settings.js` | n/a | prototype | No floating theme control |
| PDF viewer | ViewerShell adapter | PDF | prototype | Native browser renderer; unsupported toolbar actions hidden |
| Code/text/Python | ViewerShell code adapter | MD, PY | prototype | Lazy highlighting, line numbers, copy and in-viewer Find |
| CSV | ViewerShell CSV adapter | CSV | prototype | Delimiter detection, table renderer and Find |
| HTML | ViewerShell HTML adapter | HTML | prototype | Sandboxed iframe |
| Notebook | ViewerShell notebook adapter | IPYNB | prototype | Source/output rendering and Find |
| LaTeX | dedicated adapter | TEX | prototype | Lazy KaTeX preview, source fallback and Find |
| Office | shared OOXML adapter | DOCX/XLSX/PPTX | prototype | Lazy ZIP/XML parser, provider-free baseline and Find |
| Video | shared local/YouTube adapters + progress store | MP4 + YouTube | prototype | One progress model, local resume/watched state, externalResources manifest support; cloud sync later |
| STL | shared Three.js ModelScene | ASCII STL | prototype | Render-on-demand; binary parser; real Fit/Reset controls |
| 3MF | ModelDocument + shared Three.js scene | 3MF geometry assembly | prototype | Object/build identity, units, transforms, selection and real Fit/Reset controls |
| Fusion F3D/F3Z | semantic ModelDocument import pipeline | archive-selection tests | prototype | F3Z can consume embedded 3MF/STL with provenance; native F3D/F3Z emits APS_REQUIRED until Autodesk conversion is connected |
| STEP/IGES | shared CAD import | pending | planned | Keep component/source identity where possible |
| Hydrostatics | exact clipped-triangle surface integrals + prepared world geometry | box/wedge/multi-component + perf fixture | prototype | CI validates volume/CB/waterplane moments and benchmarks 21 drafts; curves/solver reuse transformed geometry |
| FEM | engineering workspace Structure mode | cantilever frame JSON | prototype | Tested 2D Euler–Bernoulli frame solver; shell/solid later |
| CFD/resistance | Resistance workspace baseline | ITTC friction JSON | prototype | ITTC-1957 friction only; total resistance/OpenFOAM later |
| Thruster flow | actuator-disk + rigid-body thruster system | actuator-disk JSON + ModelDocument thrusters | prototype | World-space force, resultant thrust, roll/pitch/yaw moments and ideal power regression-tested; OpenFOAM later |
| CoolProp | lazy local WASM Tools module | legacy engine + fake-engine CI | review | Single/Batch/Process/All-data, diagrams, exports, book-basis/help and legacy Table 4 restored; final browser/table validation remains |
| Fluid calculator | shared Tools calculator | legacy polynomial fixture | prototype | Pure tested core; legacy validity warnings; CoolProp remains separate |
| ChemDraw | lazy Kekule chemistry editor | live runtime | review | Browser-verified New/Import/MOL/SMILES/Undo/Redo/Clean 2D/Copy SMILES |
| Crystal structures | shared Three.js Tools module | full legacy structure set | review | Hole coordination polyhedra use real neighbour atoms; close-packed/Miller planes clip to visible bounds |
| Periodic table | data-driven Tools module | full local dataset + test fixture | review | Search, quick filters, category/material/period/group/phase/crystal, property display, detail/source links browser-reviewed |
| Quiz | shared course module | quiz JSON | prototype | Interactive scoring/feedback; data-driven |
| Karakterweb | shared course capability | course code | prototype | External fallback always available |
| Google Drive/login | Settings connection service | n/a | planned | Optional auth only |
| Autodesk login | Settings connection service | n/a | planned | Optional auth only |

Every row gets a deterministic fixture before being considered migrated.
