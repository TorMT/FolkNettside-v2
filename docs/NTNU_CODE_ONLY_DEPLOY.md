# Code-only GitHub → NTNU deployment (no course migration)

**Source-of-truth decision, 2026-10-12:** GitHub stores the V2 application
code, not the existing NTNU course archive. The public, previously published
semester files remain exactly where they already are:
`https://tormt.folk.ntnu.no/semestre/`.

When served under `https://tormt.folk.ntnu.no/v2-staging/`, V2 reads
`/semestre/index.json` and the actual `/semestre/<n>/index.json`
files **on the same origin**, without CORS, copying, downloading whole archives,
Git LFS or size-limit workarounds. Its original URLs point directly at NTNU
files. New course entries appear after the legacy index updates and a reload.

The separate GitHub Pages build remains a functional application preview but
deliberately shows **synthetic test course data only**. This is not a bug or
evidence the actual NTNU semester archive is missing.

### Safe update from Windows/webedit (staging, never V1 root)

NTNU's documented website workflow uses its webedit network drive or SFTP/SCP.
Do not assume you can run `git pull` on the web server itself. Instead:
pull GitHub **locally**, build only V2 assets, then copy changed assets into
a **separate** folder on the existing webedit drive.

```powershell
git -C "C:\path\to\FolkNettside-v2" pull --ff-only origin main
Set-Location "C:\path\to\FolkNettside-v2"
py scripts/build_ntnu_staging.py --version (git rev-parse HEAD)

# Replace this path ONLY after verifying it is the actual NTNU website root:
$webroot = "W:\VERIFIED-NTNU-WEB-ROOT"
Test-Path "$webroot\index.html"
Test-Path "$webroot\semestre\5\index.json"

# Read-only preview of exactly what will be updated:
py scripts/publish_ntnu_staging.py --webroot "$webroot"

# Run only after checking the output and choosing to publish V2 staging:
py scripts/publish_ntnu_staging.py --webroot "$webroot" --apply
```

The last command can write **only** into
`<verified-webroot>/v2-staging/`. It never copies to the original
`index.html`, `semestre/`, `includes/`, or the existing portfolio.
It requires original V1 `index.html` plus `semestre/` as verification
of the webroot, rejects symlinks, secrets and PHP scripts, and never deletes
files (no `robocopy /MIR`, `/PURGE` or `git clean`). Changed V2 files
are replaced individually and verified by source/destination SHA-256.

The NTNU staging URL, after an authorized first upload, is:
`https://tormt.folk.ntnu.no/v2-staging/`.

### Alternative: download ready-made code from GitHub Actions

Without running a local build, open **GitHub → Actions →
prepare-ntnu-v2-code-package → Run workflow**. The workflow creates a
versioned artifact named `folknet-v2-ntnu-code-only` containing the static
V2 application, **not** semester files, credentials or the Git history.
Download and extract it *outside* the NTNU webedit directory first.
Use `scripts/publish_ntnu_staging.py` from your local checkout for the
same dry-run and safe `v2-staging` update. The Action never connects to
NTNU automatically.

**Never `git clone` a repository containing `.git` or configuration
secrets directly inside a public NTNU webroot.** Use the validated build
instead. A plain `git pull` does not create a publishable static build
or safely separate your files from deployment internals.

### Post-deploy smoke test (no protected course downloads)

After manually copying V2 to `v2-staging` and confirming webedit has
published the new files, run:

```powershell
py -3 scripts/verify_ntnu_staging.py --commit (git rev-parse HEAD)
```

The verifier checks only the V2 index/entrypoints, Fusion script, build
marker, and **public semester JSON indexes** over HTTPS. It rejects
unexpected redirects, wrong build SHA or missing files. It does not
access protected PDFs or mutate anything. This is a prerequisite for
manual browser checks, **not** a substitute for real login/API testing.



- Existing `(beskyttet)`, `private`, and related directory names are
  **excluded** from the public V2 catalog. This prevents casual exposure of
  names but **does not enforce access rights** to known direct file URLs.
  Apache `.htaccess` and NTNU account permission rules must still protect
  those bytes on the server. Do not publish hidden paths or access tokens.
- Files for a semester are listed by its own `index.json`, not by the
  incomplete root-level `files` summary. Course display labels may come
  from the existing `includes/navbar.html`; original slugs remain stable.
- NTNU does not always provide correct MIME headers or a browser-compatible
  preview for uncommon file formats. V2's ViewerShell offers an original
  link/download fallback. Unsupported previews never imply a file was lost.
- If one index fails, a visible **partial-catalog warning** appears. If
  all fail, V2 shows the catalog is unavailable instead of presenting a
  fake demo as the real course archive.
- SiteUpdater can stay on NTNU for maintaining `index.json` after file
  changes. Do not run the V2 GitHub demo-manifest updater against webedit.
- Any later V1-to-V2 root homepage replacement, PHP integration or redirect
  still requires an independent owner-approved cutover and rollback plan.

The staging builder and code-only sync have independent tests:
`tests/test_build_ntnu_staging.py` (if present),
`tests/test_publish_ntnu_staging.py`, and
`tests/ntnu-catalog.test.mjs`. A green GitHub CI test is not proof of
write access to NTNU or of live private-file authentication.
