# ASV Tollak – original CAD publishing and integrity

The original files were supplied on 2 November 2026. The GitHub integration
used for this change can create UTF-8 files but cannot stream the original
binary attachment from the conversation container directly into GitHub.
**Neither original asset is present in this PR.** Do not confuse the existing
`examples/models/asv-tollak-visual-preview.obj` with original CAD.

## Expected repository paths

| Artifact | Repository path | Size | SHA-256 |
|---|---|---:|---|
| Original *Skrog tollak v2.3mf* | `assets/models/asv-tollak-hull-original.3mf` | 526230 bytes | `f2c4a4cb96ab3b2192e432cb3b774335cc7e0bf065797d7963098dd3a9cfb2b7` |
| Original *FolkNet Fusion ASV Assembly ZIP* | `assets/models/asv-tollak-assembly-fusion-original.zip` | 4408331 bytes | `536001eaee63597bef0ca16810de083f9c4d2ffabfdd32f0720955f69643091d` |

The Fusion bundle contains `assembly.step` and `folknet-fusion.json`.
The standalone 3MF contains the real hull mesh. The assembly's original
material masses are **not** a validated plastic boat lightship weight.

Upload both files through the repository's `assets/models` folder in the
GitHub website, preserving these exact names; use a separate branch and PR
when possible. Compare SHA-256 hashes before merging.

When the assets are available on GitHub Pages, the CAD workbench automatically
prefers the full Fusion assembly bundle and falls back to the original
3MF, then the clearly labelled simplified OBJ. The Engineering shared model
selector prefers the original 3MF over the simplified OBJ.

## Hydro qualification gate

The separate `Skrog tollak v2.3mf` is an **open hull**, not a watertight
external displacement surface. Original provenance does *not* mean it passes
the Hydro preflight. Leave Hydro disabled until a closed, correctly oriented
non-self-intersecting external buoyancy envelope is constructed and validated,
including downflooding and a consistent model datum. Do not treat the static
GZ/SAC preview as a verified vessel stability assessment.

The existing PETG study assumes uniform 1270 kg/m³, all-solid CAD volume,
seawater 1025 kg/m³, CAD-reported CG, approximate dry hull top closure and
zero-trim equilibrium. Actual weight, infill, machinery, batteries and CG
have not been confirmed.

No changes to the production NTNU V1 site are included here.
