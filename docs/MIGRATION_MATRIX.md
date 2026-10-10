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
| Hydrostatics | exact clipped-triangle integrals + stability/GZ | box/wedge/multi-component + GZ + attitude/equilibrium + perf + browser workspace fixtures | full | Core hydrostatics is unit-, worker-, performance- and browser-verified. Waterplane geometry now uses closed segment graphs, even-odd moonpool hole subtraction, crossing checks, and translated-moment integration; analytic 3D hollow-prism and Chrome Worker checks were added. New strict mesh preflight blocks analysis/draft/GZ/attitude for malformed, open, non-manifold, degenerate or inverted selected hull geometry in both Worker and fallback; Model Inspector also enforces this gate. Browser WebDriver tests validate Worker rejection. Mesh-only pass does not certify a real vessel. Computation scope: draft/displacement solve, CB/LCB/TCB/KB, waterplane/LCF/TCF/TPC, principal moments, BM/KM/GM, hydrostatic curves, constant-displacement GZ, heel/trim attitude, equilibrium and CSV export. General STL/3MF user-file import now supports edge-connected STL shell separation, 3MF named components, manual hull selection, explicit source unit/up-axis acknowledgement, exploratory analysis, conservative overlap gate and browser end-to-end validation. Imported files are session-only. World-space BVH SAT triangle collision checks and conservative nested disconnected-shell blocking now prevent selected watertight-but-penetrating imported meshes entering displacement/stability solvers. Shared-vertex penetrating contacts, true hull provenance and certification remain unresolved. Hydro numerical V(T) monotonicity/finite-difference area check and GZ/GM cross-check are presented in Hydro and report exports. Draft solver now refuses unconverged volume results, with analytic box/wedge reference tests and wedge-chine contour handling. Real vessel models remain capability-gated; Gunnerus hydro stays disabled until a validated watertight external hull and loading condition are available. |
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
| LAOS | native v2 study archive + Courses resources | 3 source PDFs, 1 welcome JPEG with SHA-256, unit and browser smoke | full | All three public PDFs from original LAOS filer/index.json and welcome image mirrored into versioned v2 assets. Viewer uses local files; sourced Courses exercise resources remain a separate group. Legacy iframe removed. |
| AndreKokSider | native source-backed student website catalog | 29 original records, metadata validation, unit/browser smoke | full | Imported original inline directory entries including study, specialization, cohort, 0-10 rating, IDs and URLs; 26 supplementary descriptions separately attributed to Perrur. Search/filter/sort native; legacy iframe removed. External site uptime is not a deployment guarantee. |
| LeseRavnen | direct GitHub Pages external demo link | registry and navigation regression | external preserved | Verified live target: https://tormt.github.io/LeseRavnen/ . No iframe, duplicate deployment, auth coupling or changes to test data collection. |
| KISSsoft parameter viewer | Approximate animated Z014 planetary + Z012 external-pair 2D/3D, helix and pitch-ratio checks; other W10/KSYS parameter view | Core numeric + Chrome upload and WebGL gear motion | prototype | Nominal pitch/ratio verified from tooth count/module and helix angle, but involute contact, load strength, nonstandard formats and actual KISSsoft 3D parity remain open. |
| Brewing raw materials | local inventory with JSON import/export | validation and Brewing browser smoke | partial | Locally editable stock list; does not ingest legacy server stocks. Live RAPT/log/recipe and cross-device cloud parity requires deployed PHP backend and credentials. |
| Sectional Area Curve (SAC) | Mesh-sliced area A(x) and CSV in Hydro | Analytic submerged box (A=3 m2, V=30 m3) + UI audit | prototype | Validated-mesh and station limits; still requires independent real-hull reference data, multi-body/holes and performance qualification. |\n| Wave vessel motion mode | Anchored vs illustrative follow-surface heave | Unit + Chrome model wave smoke | prototype | Follow mode does not solve RAOs, mooring dynamics, roll/pitch or wave loads. |\n| Autodesk login | Settings connection service | n/a | planned | Optional auth only |

Every row gets a deterministic fixture before being considered migrated.


### MedisinTimer sky-synk: samtykke før ukryptert opplasting (2026-10-10)

Google-innlogging alene starter nå **ikke** automatisk Google Drive-lesing eller
-opplasting av MedisinTimer-data. Brukeren må velge **Aktiver Drive-synk**
og bekrefte en tydelig advarsel om at timer-/dosehistorikk synkroniseres
som **ukryptert JSON**. Valget lagres lokalt per Google-konto (`sub`).
Uten dette valget forblir historikken lokal selv om Google er tilkoblet.
Det finnes også en **Slå av sky-synk**-knapp som stopper videre
automatisk synkronisering. Den sletter *ikke* tidligere lagrede Drive-data.

Dette er en **eksplisitt samtykkekontroll, ikke E2E-kryptering**.
Reell ende-til-ende-kryptering, revisjon av gamle Drive-kopier,
atomerisk fler-enhetssynk/konflikthåndtering og to-konto-/to-enhetstest
må fortsatt løses før MedisinTimer kan klassifiseres som ferdig.

### MedisinTimer-kryptering og Drive-mappe – 2026-10-10

V2-kopien til Google Drive er nå ende-til-ende-kryptert i nettleseren med
AES-256-GCM og en PBKDF2-avledet passfrasenøkkel. Brukeren kan velge en
eksplisitt Google Drive-mappe-ID, inkludert en delt mappe ved riktige
Google-tillatelser. Passfrasen lagres ikke; hver ny nettlesersesjon må
låses opp. Den tidligere ukrypterte Drive-filen `folk-medisin-v2.json`
forblir urørt. **Lokale nettleserdata og manuelle JSON-eksporter er fortsatt
ukrypterte**, og fler-enhetskonflikter uten atomisk revisjonskontroll gjenstår.
Alle begrensninger og manuelt migreringsløp er i
[MEDISINTIMER_ENCRYPTED_DRIVE.md](MEDISINTIMER_ENCRYPTED_DRIVE.md).
