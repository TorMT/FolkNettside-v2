# Automatic NTNU course catalog — local V2-only publishing

**Status:** Development feature. No hourly Windows job has been installed and
no file on NTNU has been written by ChatGPT.

## First use

1. Mount NTNU webedit in VS Code / Windows. Confirm its original
   `index.html`, `semestre/` and `v2-staging/index.html` really exist.
2. Prepare your *own* reviewed public-course allowlist as JSON, based on
   `data/ntnu-index-allowlist.example.json`. Do not guess whether folders
   are public; their existing NTNU indexes must explicitly say
   `beskyttet: false`.
3. Create an external backup folder, e.g.
   `%USERPROFILE%\Documents\FolkNetV2-CatalogBackups`. This must not be
   under webedit.
4. From a **local** checkout of `TorMT/FolkNettside-v2` run:

```powershell
# Replace paths with your verified existing webedit location.
$webroot = "\\webedit.ntnu.no\ormt"
$allowlist = "$env:USERPROFILE\Documents\ntnu-public-courses.json"
$backup = "$env:USERPROFILE\Documents\FolkNetV2-CatalogBackups"
New-Item -ItemType Directory -Force -Path $backup

# Read-only preview of resource counts and destination:
py -3 scripts/publish_ntnu_autocatalog.py `
  --webroot "$webroot" --allowlist "$allowlist" --backup-root "$backup"

# ONLY when you explicitly want to write V2 staging's JSON:
py -3 scripts/publish_ntnu_autocatalog.py `
  --webroot "$webroot" --allowlist "$allowlist" --backup-root "$backup" --apply
```

The publisher writes **only**
`<verified-webedit-root>/v2-staging/data/ntnu-autocatalog.json`.
It never regenerates `index.html`, modifies existing
`semestre/N/index.json`, copies course bytes, deletes any existing file,
or changes the public root. It refuses to run without a verified
`v2-staging/index.html`, external backup folder and reviewed public
course list. It compares JSON content, so an unchanged catalog causes
**zero** write operations.

When updating an existing catalog, the prior version is preserved
outside webedit under a content-hash filename; if more than 25% of indexed
resources disappear, automatic publishing fails closed. Legitimate mass
deletions require independent inspection and explicit
`--allow-removals` along with `--apply`; a completely empty replacement
of previously indexed course data is always rejected.

## Hourly updates — later, only with owner permission

The publishing command is safe to run periodically **after** real staging
and allowlist tests pass. Preferred sequence:

- Run immediately after copying new course files via VS Code.
- Later, optionally run hourly through **Windows Task Scheduler**, as the
  Windows user who has access to the NTNU webedit share. Use the exact
  same reviewed `--webroot`, `--allowlist` and external `--backup-root`
  with `--apply`.
- Task Scheduler is not a server cron: the local PC must be running and
  authorized to access webedit; network drive letters may be unavailable
  from a background session. Prefer a verified UNC path.
- The task must stop and report a failure if the mounted disk, public
  allowlist, V2 staging or previous catalog cannot be verified.
- No ChatGPT or Supabase background job can directly scan this private
  mounted filesystem without an explicitly authorized bridge.

The browser catalog reader (`src/courses/ntnu-autocatalog.js`) will
prefer the published V2 JSON only when V2 itself is served on NTNU,
with a strict same-origin and public-path validator. If absent or bad,
V2 falls back to the original per-semester NTNU indexes.

**Acceptance still needed:** manual webedit smoke, display of new/removed
files, real protected-file HTTP access rules, concurrent local/NTNU writes
on the mounted share and backup/restore rehearsal. Do not schedule
unattended updates until these succeed.
