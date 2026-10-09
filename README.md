# FolkNettside V2

A separate preview of the engineering portfolio, course archive and browser engineering tools.

- **V2 preview:** https://tormt.github.io/FolkNettside-v2/
- **V2 source:** https://github.com/TorMT/FolkNettside-v2 (repository access may be restricted)
- **Original FolkNettside repository (legacy):** https://github.com/TorMT/FolkNettside

**No production cutover.** The original NTNU FolkNettside and Engineering Portfolio entry point used in job applications remain unchanged through **2027-01-01**. A green CI/deploy does not prove complete feature parity.

## Implemented features

- Portfolio, data-driven CV (data/cv.json), About, Contact and responsive navigation
- Courses, semesters, nested resources, quiz tools, search and shared format-specific viewers
- Python/Jupyter workbench with deliberate Run/Stop, project-folder uploads and generated-file downloads
- Browser model viewing for STL, 3MF, GLTF, STEP/IGES/BREP using OpenCascade WASM where available; Fusion archive inspection and conceptual KISSsoft gearing
- Exploratory Hydro, waves, structures, propulsion and resistance tools; CoolProp and chemistry tools
- Settings-controlled theme and Diverse modules

**Important limits:** F3D native geometry needs authorized conversion; tessellated CAD is not feature-history editing; conceptual KISSsoft is not a stress/contact solver. Hydro is not vessel certification. Python Workers are not security boundaries for untrusted code. Brewing and cloud sync still have provider-dependent features requiring verification.

## Development and verification

Serve the repository root over HTTP so ES modules/workers resolve.

    python -m http.server 4173
    # Open http://localhost:4173/
    npm test
    python scripts/validate_content.py
    python scripts/audit_public_assets.py

The Pages workflow runs regression tests, numerical checks and selected Chrome smoke tests before publishing. See [release gates](docs/V2_RELEASE_GATES.md), [release audit](docs/RELEASE_AUDIT_2026-10-09.md), [CAD/KISSsoft validation](docs/CAD_WASM_AND_GEAR_VALIDATION.md). Real model files, external OAuth and physical SpaceMouse testing remain separate acceptance steps.

## SiteUpdater

On Windows, run **Run SiteUpdater.cmd** to choose all semesters, a semester or a course. CLI equivalents:

    python scripts/update_site.py --interactive
    python scripts/update_site.py --dry-run --semester 5 --course TMR4182
    python scripts/update_site.py --semester 5 --course TMR4182
    python scripts/update_site.py --check

The default source is **example fixtures** under examples/semesters, not the full legacy course archive. Only stage approved public content. SiteUpdater writes manifests atomically and rejects protected paths; this is not a substitute for manual privacy review. Never publish plaintext private folders, passwords, OAuth client secrets or medical records to GitHub Pages.

## Contributions and safe deployment

Create a feature branch, add focused regression tests, and open a pull request against main. Require passing CI and document remaining limitations. Main deploys only to the separate V2 gh-pages preview. Do not modify the original repository, NTNU production tree, DNS or Engineering Portfolio URL. Use this repository's Issues and Pull Requests for tracked changes where access permits.

Any eventual production migration needs a separate content inventory, old-vs-new comparison, privacy/security review, rollback route and explicit owner go/no-go. See [static hosting/security constraints](docs/STATIC_DEPLOYMENT_GUIDE.md).
