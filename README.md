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

## Local Codex on your own PC

The real NTNU `webedit` archive is intentionally **not** in Git. For the
actual filesystem inspection, backup and later V2 course migration, start
local Codex from this repository and hand it the
[dedicated read-only-first operator prompt and runbook](docs/LOCAL_CODEX_FOLK_MIGRATION.md).
The repository's [`AGENTS.md`](AGENTS.md) records immutable V1 freeze,
private-content handling and go/no-go rules. Before any NTNU staging upload,
verify explicitly approved public course copies with
`scripts/verify_ntnu_public_assets.py` (streaming SHA-256 check).
Keep local reports, original archive and secrets out of Git and Pages.

## Separate NTNU staging build (no changes to V1)

NTNU's [own folk hosting docs](docs/NTNU_FOLK_HOSTING.md) confirm webedit
publishing, Apache directory authentication via `.htaccess` (NTNU LDAP or
`htpasswd`) and PHP-related support guidance. **PHP modules, disk quotas,
environmental secret availability and external API access must be live-tested
on this account; do not assume they are available.**

The tested `scripts/build_ntnu_staging.py` produces an **offline-only**
V2 candidate from the public GitHub build, optionally combining a separately
reviewed manifest with only explicitly approved *public* files in a local
`site-content/semesters` source. It never copies private folders or uploads
anything to NTNU. Matpris PHP is bundled and enabled only with an explicit
`--enable-matpris` opt-in, using a subdirectory-relative endpoint that
cannot silently access V1 from NTNU staging. V1 and the Engineering
Portfolio are frozen until at least 2027-01-01 and separate GO approval.

## Migration readiness and course analytics

**V2 has not replaced V1.** The GitHub history of V1 is not a complete backup
of the production NTNU course archive (`semestre/` was absent from the Git
tree inspected on 2026-10-10). Use a verified offline NTNU webedit snapshot
before staging public course resources. See the
[full backup/cutover/rollback playbook](docs/PRODUCTION_MIGRATION_PLAYBOOK.md),
[30-point parity gap register](docs/PRODUCTION_PARITY_GAP_REGISTER.md), and
[API/secrets integration checklist](docs/INTEGRATION_CONFIGURATION_REGISTER.md).
A read-only inventory comparison is available:

    python scripts/audit_migration_readiness.py --legacy-repo ../FolkNettside --legacy-site /path/to/ntnu-snapshot --v2-root .

It does not migrate files or certify service parity. GitHub Pages cannot run
legacy PHP APIs or securely hold private credentials.

Google Analytics uses the same GA4 property as V1. When a visitor consents,
**public course visits** include `course_code` and `course_semester` from
the validated course manifest. See
[GA4 configuration and owner-only reports](docs/INTEGRATION_CONFIGURATION_REGISTER.md#analytics-per-fag--rapportoppsett).
No individual file path or private data is sent in the manual event.

## Contributions and safe deployment

Create a feature branch, add focused regression tests, and open a pull request against main. Require passing CI and document remaining limitations. Main deploys only to the separate V2 gh-pages preview. Do not modify the original repository, NTNU production tree, DNS or Engineering Portfolio URL. Use this repository's Issues and Pull Requests for tracked changes where access permits.

Any eventual production migration needs a separate content inventory, old-vs-new comparison, privacy/security review, rollback route and explicit owner go/no-go. See [static hosting/security constraints](docs/STATIC_DEPLOYMENT_GUIDE.md).
