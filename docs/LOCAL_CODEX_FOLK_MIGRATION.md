# LOCAL CODEX HANDOFF — FolkNettside V1 → V2 on NTNU folkserver

**Owner:** FolkNettside. **Scope:** Work performed locally on the owner's PC, with a verified V1 webedit network drive and a V2 Git clone. **No direct production changes under this instruction.** Original V1 and legacy Engineering Portfolio stay intact at least until 2027-01-01 and an explicitly approved final switch.

**Ready-to-paste instruction for local Codex appears in Section A.** The rest is a verification contract and runbook. It is intended to be discoverable through the repository's `AGENTS.md`.

## A. Hand this task to local Codex

> You are preparing FolkNettside V2 to eventually replace the existing FolkNettside V1 hosted at NTNU folk.ntnu.no. Read `AGENTS.md`, `docs/LOCAL_CODEX_FOLK_MIGRATION.md`, `docs/NTNU_FOLK_HOSTING.md`, `docs/PRODUCTION_MIGRATION_PLAYBOOK.md`, `docs/PRODUCTION_PARITY_GAP_REGISTER.md`, `scripts/audit_migration_readiness.py`, `scripts/build_ntnu_staging.py` and `scripts/update_site.py` before acting. Confirm exact V1 source and NTNU webedit paths with me; do not assume the drive letter or course root.
>
> **Goal:** Inventory the *real local* V1 archive (not the sparse Git repo); take a verifiable complete encrypted/offline V1 backup, then prepare a completely separate, organized and publicly shareable V2 course content staging tree **outside Git**. Produce reviewed mappings between legacy course slugs and actual NTNU codes, preserving all old relative filenames and links until redirects can be tested. Create and test a staged V2 site, compare all original public-file counts and SHA-256 hashes against its staged destinations, test file viewers and key V1/V2 functionality, document unresolved private content, broken references, server dependencies and missing features. V2 code fixes belong in small PRs with tests.
>
> **Strict safeguards:** V1 is READ-ONLY and production cutover is prohibited until at least January 1, 2027 plus fresh explicit approval. No deletion-capable sync (`robocopy /MIR` or `/PURGE`, `rsync --delete`), destructive renames, overwrites, automatic redirects, DNS changes, or NTNU server uploads. Do not sync private/protected/unknown files or API secrets into public source, GitHub, model prompts, or published V2. The old browser-side V1 password hash is not security. NTNU private content requires separate Apache LDAP/htpasswd protection verified in a dedicated harmless test directory by direct unauthenticated and unauthorized HTTP requests. Do not touch V1's existing protected folders.
>
> **Execute in phases without repeated permission prompts for strictly read-only discovery and local safe tests**, but pause before **any** write to the webedit share, NTNU deployment, private-data migration, backend configuration, destructive action or replacing even a staging URL. Report a concise inventory table and a clear GO/NO-GO after each major phase. Use actual files and test results; never claim parity based only on successful compilation. Do not infer unknown course codes.
>
> Start by identifying the NTNU webedit source root and the intended local backup location, validating the paths, then give me the detected semester/course counts, total bytes, number of symlinks, and potential protected material **without printing filenames or contents that are private**.

The operator must provide their actual NTNU share path and local backup location. No agent can know them from public URLs.

## B. Local folder layout and rules

Illustrative paths only. Choose owner-specific directories **outside the V2 clone** and not on the same server disk as the original:

```text
D:/FolkMigration/
  backups/2026-10-xx-v1/           # encrypted/offline, complete raw V1 snapshot
  workspace/v1-catalog-inventory/  # private reports, no private file contents in LLM logs
  workspace/approved-public/
    site-content/semesters/         # approved public course copies ONLY
  workspace/restricted-review/     # separate local/private staging, NEVER in V2 or Pages
  workspace/reviewed-content-manifest.json
  workspace/reviewed-course-map.json
  workspace/reports/
  builds/v2-candidate/             # output of build_ntnu_staging.py, public files only

<separate-repo-location>/FolkNettside-v2/
  AGENTS.md
  scripts/build_ntnu_staging.py
```

There is **no** implicit authorization to publish a file simply because it resides under a publicly visible `filer/` path. File ownership, third-party lecture material and distribution rights must be reviewed.

## C. Phase 0 – inspect and assert identity, no writes

1. Confirm V1 browser URLs (homepage, Engineering Portfolio, one course), V1 Git repo, currently mounted NTNU `webedit` target and a separate local V2 clone; record `git rev-parse HEAD` for both repositories.
2. **Validate share roots by contents**, not drive letters: for the source, confirm a known existing V1 `index.html`, `semestre/`, `includes/`, `diverse/` and inspect a few known legacy URLs against corresponding files. Never assume `W:`, `Q:`, `/web/folk/<user>` is available on this machine.
3. Inspect `semestre/` recursively without following symlink/junction directories. Record original semester ID, original slug, relative paths, file counts, total byte count, path case/Unicode and parent/child structure. Discover **unlisted** course folders, not just the 24 V1 public navbar entries.
4. Identify files with probable restriction labels (`beskyttet`, `private`, `restricted`, `.env`, credentials, tokens), hidden dirs, conflicting names, OS symlinks and unknown file extensions. Do not include their contents or personal metadata in a public report.
5. Identify V1 backend data: PHP endpoints, quiz leaderboard persistence, Brewing/RAPT database or log folders, Autodesk APS contract, Matpris configuration. The GitHub V1 repo **does not** contain the full NTNU course archive.
6. Record all legacy course URLs and all external viewer resources (Panopto, Google Drive, YouTube); classify those as *linked*, not automatically downloaded.

**Required outputs:** private inventory JSON/CSV, counts by semester/slug, list of ambiguities and a safe non-destructive copy plan.

## D. Phase 1 – full verified V1 backup before copying toward V2

Windows PowerShell example; **replace both placeholders with inspected actual paths**:

```powershell
$source = '<VERIFIED_REAL_NTNU_V1_ROOT>'
$backup = '<ENCRYPTED_OFFLINE_BACKUP_DIR>/folk-v1-YYYYMMDD'
if (!(Test-Path (Join-Path $source 'index.html'))) { throw 'Wrong source root' }
if (!(Test-Path (Join-Path $source 'semestre'))) { throw 'No semester tree' }
New-Item -ItemType Directory -Force $backup | Out-Null
robocopy $source $backup /E /COPY:DAT /DCOPY:DAT /R:2 /W:3 /XJ
if ($LASTEXITCODE -ge 8) { throw "Backup failed: robocopy code $LASTEXITCODE" }
```

The example copies files **from** NTNU into a private, encrypted, non-public backup. It never writes to the V1 source. `/MIR`, `/PURGE` and `/MOVE` are **prohibited**.

Backup V1 and V2 Git objects separately (mirrors/bundles), and **backup server persistence separately** if it is not file-based (leaderboards, Brewing/RAPT, medicines, live service databases). Git alone is not a site backup. Record SHA-256 manifests from the backed-up files, and verify randomly selected source/backup files and restore samples in a temporary location. Treat any backup mismatch as STOP.

If V1 cannot be fully backed up (permissions, locked files, quotas, very large data), stop and record the unresolved data rather than silently proceeding.

## E. Phase 2 – normalize into staged V2 paths WITHOUT changing V1

The public V2 file tree is a local copy outside Git. Suggested mapping:

```text
V1:  semestre/3/marin-intro/filer/Forelesning.json
V2:  site-content/semesters/3/<VERIFIED_CODE>/Forelesninger/Forelesning.json

V1:  semestre/5/Marin-Dynamikk/filer/Ovinger/uke 5/rapport.pdf
V2:  site-content/semesters/5/<VERIFIED_CODE>/Ovinger/uke 5/rapport.pdf
```

**These are examples, not confirmed source files or NTNU codes.** An original slug is not necessarily a course code. The reviewed mapping format is
[`data/migration-course-map.example.json`](../data/migration-course-map.example.json). It has `v2CourseCode=null` until each course is verified. Verify against original course metadata and the correct semester. Keep a separate explicit mapping of **old full URL → new path** for testing redirects and for links embedded in HTML/PDF.

For each source asset, record a private migration ledger:

```text
source_slug | relative_source_path | source_SHA256 | classification |
checked_course_code | v2_relative_path | copy_SHA256 | viewer_kind |
old_URL | staged_URL | result | reviewer | date
```

Classify into **PUBLIC-APPROVED**, **AUTHENTICATED**, **SENSITIVE**, **SECRET**, **EXTERNAL-LINK**, **UNKNOWN**. Only the first enters `approved-public/`. Everything else remains protected, privately handled, or referenced via an authorized link. `UNKNOWN` cannot be automatically treated as public.

Use `Copy-Item`/equivalent *copy-only* operations after source and destination paths have been checked. Avoid case-normalization collisions on NTFS vs NTNU Linux webserver; don't silently overwrite files with the same basename. Preserve original filenames and nested directory structure unless a redirect mapping justifies changing them. Do not modify original file bytes; metadata changes must be recorded.

Construct `reviewed-content-manifest.json` with `"source": "site-content/semesters"` and `semesters[].courses[].resources[].path` entries such as `"./site-content/semesters/3/<VERIFIED_CODE>/Forelesninger/file.pdf"`. Inspect how V2 SiteUpdater populates sections, label, folder order, video/quiz type. **Do not** make V2's public Pages `content-manifest.json` point to off-Git private material.

## F. Phase 3 – create and audit a local candidate

From the local V2 clone, after running the tests:

```powershell
python scripts/build_ntnu_staging.py --version (git rev-parse HEAD) --output '<LOCAL_BUILD_DIR>' --manifest '<REVIEWED_CONTENT_MANIFEST.json>' --approved-root '<REVIEWED_PUBLIC_ROOT>'
```

The staging builder fails if a source file is absent, protected by filename, symlinked or outside its approved root. Without `--enable-matpris`, PHP Matpris remains disabled. **Do not** turn on PHP until the actual NTNU account's capability and secret setup have been tested. The staging output is **a public webroot candidate**, not a backup.

**Mandatory direct byte-parity gate** (large files are hashed in 1 MiB
chunks; this may take time):

```powershell
python scripts/verify_ntnu_public_assets.py --manifest '<REVIEWED_CONTENT_MANIFEST.json>' --approved-root '<REVIEWED_PUBLIC_ROOT>' --build-root '<LOCAL_BUILD_DIR>' --out '<PRIVATE_REPORTS_DIR>/v2-file-hashes.json'
```

A successful run requires the staged manifest to **exactly match** the
approved manifest, and the source/staged SHA-256 digest and byte count to
match for every approved file. A missing, changed or symlinked file is STOP.
The JSON report must remain *outside Git*. This proves byte equality **only
for explicitly approved public files**; it does not prove every original V1
file was classified, mapped or permitted to publish.

Run the read-only course comparison against both the *full* V1 backup and the local staged V2 tree. It can be used as a preliminary name/size check; it is NOT evidence of exact byte equality, so compare approved input and staged output SHA-256 files from the mapping ledger as well.

```powershell
python scripts/audit_migration_readiness.py --legacy-repo '<LOCAL_V1_REPO>' --legacy-site '<PRIVATE_BACKUP_OF_ACTUAL_V1_ROOT>' --v2-root '<LOCAL_BUILD_DIR>' --mapping '<REVIEWED_COURSE_MAP.json>' --out '<PRIVATE_REPORT.json>'
```

**Known limitation:** This audit compares original basenames/lengths and may flag intended renames/relocations, while the V2 manifest only contains approved public files. The migration ledger with SHA-256 and explicit classifications is the authoritative mapping. Do not change the script to automatically 'pass' unrecognized V1 directories.

### Function-level checks

- Course navigation: all actual semesters, non-code legacy slugs mapped, nested folders, search, course counters, new-file notices, breadcrumbs and old link mapping.
- Viewers: PDF, Office, video `Forelesning.json` incl. Panopto/Drive/YouTube, notebooks, Python, STL/3MF/STEP, KISSsoft, hydro exports; verify actual source-file compatibility and fallback handling, not just demo fixtures.
- Quiz: answer change before submission, wrong-answer bank, chapter selection and persistence. Server-side leaderboard is not local fallback; require live backend for that feature.
- SiteUpdater: source preservation, `--dry-run`, `--check`, metadata rollback, non-destructive updates; course source MUST NOT switch back to fixtures.
- Engineering: 3D mouse default mappings/focus, real hull/mesh units, wave/RAO data conventions, F3D/F3Z requiring authorized Autodesk conversion.
- Services: Matpris via explicit local V2 PHP endpoint; Brewing/RAPT, recipe/log persistence, APS, Google OAuth/Drive, MedisinTimer privacy and Dive Log; error handling when servers are absent.
- Security/accessibility: direct URL authorization, content classification, no plaintext secrets in public tree, escaped metadata/HTML, mobile layout, keyboard navigation, screen-reader/contrast checks.
- External stability: old CV/portfolio URL unchanged, V1 assets and redirects remain intact.

## G. Phase 4 – optional independent NTNU test URL (STOP BEFORE WRITING)

**Only after the owner explicitly approves writing a dedicated new V2-staging folder on webedit**, inspect the exact NTNU destination and ensure it doesn't overlap the old site. Copy the **already audited** candidate to a *new* staging path. No automatic production URLs, redirects, file moves or deletes.

For a private-folder access-control test, use a separate directory and a disposable **non-sensitive** sentinel file. For the requested simple V1-like **one-password-for-an-entire-folder** workflow, start with the uninstalled `deploy/ntnu/shared-password-folder.htaccess.example` and one non-public `htpasswd` database on a secure NTNU path, **only if the account supports this**. Verify logged-out access is denied for a direct nested document link and authenticated access works. Never copy real plaintext passwords into Git, model prompts or configuration files. Choose LDAP instead if non-public credential storage cannot be established. Review [`deploy/ntnu/protected-folder.htaccess.example`](../deploy/ntnu/protected-folder.htaccess.example) and NTNUs LDAP/htpasswd documentation. Verify unauthenticated 401/403 via a direct URL (not just a V2 menu guard), success only for explicitly authorized users, failure for unauthorized users, nested file behavior and browser caching. This access model is distinct from Google OAuth.

Test PHP requirements with harmless capability probes. Never display `phpinfo()`, server absolute paths, secrets, environment dumps or request headers publicly. Confirm secure env secret configuration, `curl`, `mbstring`, quotas and outbound HTTPS before enabling Matpris, RAPT or APS.

## H. Phase 5 – acceptance, rollback and freeze

Produce the following before recommending production:
- A source-backed per-function parity register showing `PASS / FAIL / UNKNOWN / WAIVED` and owner review.
- A course mapping/URL ledger covering all accessible source courses, including any beyond the 24 public navbar entries.
- A **verified full backup** with restore evidence, backed-up service data and a reproducible rollback plan.
- Hash verification that each *approved* public resource matches its staged copy.
- A protected/private resource count and storage plan, without disclosing contents.
- A V2 release SHA and a green CI link; mobile and desktop acceptance evidence.
- A list of unresolved live services and an explicit recommendation **NO-GO** until resolved.

No production cutover or modification of the old NTNU root before 2027-01-01 and a separate explicit instruction.

## I. Operational pitfalls Codex must detect

1. **GitHub Pages is not an archive**: `build_preview.py` deliberately does not copy the real NTNU `semestre/`; it uses public fixture content for preview. Keep that preview working independently.
2. **V1 repo is not the whole site**: `semestre/` is absent from its Git tree, and public `index.json` can be stale/incomplete. The full mounted NTNU site backup is necessary.
3. **Private directories are not protected by a filename, CSS, JS password hash, or by leaving a link out of the UI.** Protection must happen at the webserver for direct URLs.
4. **NTNU platform constraints have unknowns**: no assumed guaranteed PHP version, cache, quotas, cron, outbound API calls or persistent DB without live tests.
5. **Same-origin PHP paths**: V2 service calls must not default to V1 `/includes`. Use distinct, reviewed V2 configuration.
6. **Git case sensitivity and NTFS differences**: `Fluid` vs `fluid`, duplicate names, reserved Windows characters, paths with æ/ø/å, files containing spaces, and case-variant code titles can silently collide.
7. **Context window/privacy**: process actual private filenames/file bytes using local tools and reports, not through internet-based assistant prompts or public CI logs.
8. **Backup/data retention**: don't treat `.siteupdater-backups/` manifest snapshots as whole-site backups; protect actual archive and server data separately.
9. **Version pinning**: verify CSS/JS/WASM/cache busting when publishing under a *subdirectory*. Hash navigation `#/courses` is not an HTTP redirect mapping.
10. **Owner confirmation**: any NTNU write, service credential insertion, deletion or final URL switch requires an explicit authorization distinct from this plan.

This handoff is intentionally strict. It is designed to let local Codex make real progress on backups and offline staging **without granting it unattended authority to alter the existing production site**.
