# v2 migration matrix

Status values: `fixture`, `prototype`, `rewrite-next`, `planned`, `full`.

| Legacy capability | v2 target | Fixture | Status | Notes |
|---|---|---:|---|---|
| Course/semester indexing | `scripts/update_site.py` + one manifest | CI updater/check + validator | full | Metadata-only indexing is rebuilt, freshness-checked and validated on every deploy; no HTML patching or large-file reads |
| Theme picker | Settings + `src/settings.js` | n/a | prototype | No floating theme control |
| PDF viewer | ViewerShell adapter | PDF + browser matrix | full | Native browser renderer browser-verified; unsupported toolbar actions hidden |
| Code/text/Python | ViewerShell code adapter | MD, PY + browser matrix | full | Lazy highlighting, line numbers, copy and in-viewer Find browser-verified |
| CSV | ViewerShell CSV adapter | CSV + browser matrix | full | Delimiter detection, table renderer and Find browser-verified |
| HTML | ViewerShell HTML adapter | HTML + browser matrix | full | Sandboxed iframe and srcdoc rendering browser-verified |
| Notebook | ViewerShell notebook adapter | IPYNB + browser matrix | full | Source/output rendering and Find browser-verified |
| LaTeX | dedicated adapter | TEX + browser matrix | full | Lazy KaTeX preview, source fallback and Find browser-verified |
| Office | shared OOXML adapter | DOCX/XLSX/PPTX + browser matrix | full | Lazy ZIP/XML parser, provider-free baseline and Find browser-verified |
| Local video | ViewerShell video adapter + progress store | MP4 + browser matrix | full | Resume/watched state, explicit reset progress and ViewerShell rendering browser-verified; cloud sync remains optional future work |
| YouTube | ViewerShell YouTube adapter + shared progress store | URL/parser + progress tests | prototype | Resume/watched/reset workflow implemented; external YouTube IFrame API is intentionally not a deploy-critical browser gate |
| STL | shared Three.js ModelScene | ASCII STL + browser matrix | full | Parse, WebGL render, finite bounds, Fit/Reset and cleanup browser-verified |
| 3MF | ModelDocument + shared Three.js scene | 3MF assembly + browser matrix | full | Object/build identity, units, transforms, WebGL render, finite bounds, selection and Fit/Reset browser-verified |
| Fusion F3D/F3Z | semantic ModelDocument import pipeline | archive-selection + semantic-sidecar tests | prototype | F3Z consumes embedded 3MF/STL with provenance and optional semantic sidecar metadata for hull/thruster/subsystem roles; native F3D/F3Z emits APS_REQUIRED until Autodesk conversion is connected |
| STEP/IGES | shared CAD import | pending | planned | Keep component/source identity where possible |
| Hydrostatics | exact clipped-triangle integrals + stability/GZ | box/wedge/multi-component + GZ + attitude/equilibrium + perf + browser workspace fixtures | full | Core hydrostatics is unit-, worker-, performance- and browser-verified: draft/displacement solve, CB/LCB/TCB/KB, waterplane/LCF/TCF/TPC, principal moments, BM/KM/GM, hydrostatic curves, constant-displacement GZ, heel/trim attitude, equilibrium and CSV export. Real vessel models remain capability-gated; Gunnerus hydro stays disabled until a validated watertight external hull and loading condition are available. |
| FEM | engineering workspace Structure mode | cantilever frame JSON | prototype | Tested 2D Euler–Bernoulli frame solver; shell/solid later |
| CFD/resistance | Resistance workspace baseline | ITTC friction JSON | prototype | ITTC-1957 friction only; total resistance/OpenFOAM later |
| Thruster flow | actuator-disk + rigid-body thruster system | actuator-disk JSON + semantic ModelDocument thrusters | prototype | Semantic azimuth/tunnel components, world-space force, resultant thrust, roll/pitch/yaw moments and ideal power regression-tested; OpenFOAM later |
| CoolProp | lazy local WASM Tools module | hashed legacy WASM + unit tests + deployed browser + real-WASM CI verifier | full core / UI polish | Numerical core is verified. Course tables are fluid-specific; A-22 is temperature-driven at the calibrated 1-bar basis, table presets follow display units, stale results are invalidated on fluid/unit/basis changes, and diagram axes state their fixed engineering units. Further UI polish remains open. |
| Fluid calculator | shared Tools calculator | legacy polynomial fixture + deployed browser comparison | full | Browser-verified against legacy for all 6 fluids/gases, C/F/K, all 8 properties, warnings and responsive layout |
| ChemDraw | lazy Kekule chemistry editor | live runtime | full | Browser-verified New/Import/MOL/SMILES/Undo/Redo/Clean 2D/Copy SMILES |
| Crystal structures | shared Three.js Tools module | full legacy structure set + interactive browser verification | full | Full legacy functional parity verified; next work is beyond-legacy hole polyhedra and close-packed-plane visualization |
| Periodic table | data-driven Tools module | full local dataset + test fixture + deployed browser verification | full | Search, quick filters, dropdown filters, temperature phase, property display, reset/clear, details and Wikipedia link browser-verified |
| Quiz | shared course module | quiz JSON + study browser smoke | full | Validated data, persistent attempts, feedback, navigation, review, keyboard controls and browser-verified ViewerShell integration |
| Karakterweb | shared course capability | validated course-code URL tests | full | Course-code normalization and deterministic HTTPS fallback are tested; external site availability is not a deploy dependency |
| Google Drive/login | shared Settings-owned Google session | Brewing Drive consumer + shared account gate | prototype | One site-level GIS session; Brewing reuses it without a second OAuth prompt. Signed-out modules stay local. Dive-log consumers must use the same gate; no source-controlled dive-log sync implementation exists yet. |
| MedisinTimer | native Diverse page + Google Drive sync | typed backup + concentration math + browser smoke | prototype / parity pending | Native timers, dose history, level estimates, local records partitioned by Google sub, Google Drive file sync and JSON import/export. Browser smoke verifies local operations; production cross-device OAuth needs live verification. Legacy peptide calculator, FARE gallery and sharing remain external. History from the old cross-origin app does not migrate automatically. Health-related JSON on Drive is not E2E-encrypted; no notification guarantee when closed. |
| Autodesk login | Settings connection service | n/a | planned | Optional auth only |

Every row gets a deterministic fixture before being considered migrated.
