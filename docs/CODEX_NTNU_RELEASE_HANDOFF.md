# Codex – V2 release and webedit handoff (12 October 2026)

## Goal and operating rules

Finish V2's verifiable workflows, not the previous proposal to migrate semester
files into GitHub. GitHub is the source for application code, while
`tormt.folk.ntnu.no/semestre/` remains the source for ALL existing
course files and index.json metadata. Never duplicate, delete, or relocate
the semester tree.

**Do not modify the existing NTNU homepage or the current portfolio until an
explicit later approval.** Stage at `/v2-staging/` only. No Git repositories
or `.git` directories may be hosted by webedit.

Codex must operate with the actual Windows VS Code / webedit mount.
ChatGPT cloud cannot confirm the local mapped drive or passwords.

## 1. One-time local setup (Windows PowerShell)

```powershell
# Open the local Git clone in VS Code (NOT inside NTNU's public webroot)
cd "C:\path\to\FolkNettside-v2"

# Check tools and identity, don't use your existing NTNU website path here
git remote -v
git branch --show-current
py -3 --version
node --version
npm --version

# Find and VERIFY the mapped/UNC webedit root
Get-PSDrive -PSProvider FileSystem
Test-Path "\\webedit.ntnu.no\ormt\index.html"
Test-Path "\\webedit.ntnu.no\ormt\semestre\5\index.json"

# Once actual mapping is confirmed, replace placeholders and store paths
# outside the repo. Backup MUST NOT be under the public webroot.
.\Oppdater-FolkNettside.ps1 -Configure `
  -WebRoot "\\webedit.ntnu.no\ormt" `
  -BackupRoot "$env:USERPROFILE\Documents\FolkNetV2-Releases"
```

**Codex must not assume** the UNC example is correct. Verify the real
`index.html`, `semestre` directory, and the allowed write scope. If the
webedit path is a VS Code Remote SSH mount and not locally accessible via
PowerShell, implement an equivalent SFTP workflow outside the webroot; never
blindly run these commands against an unrelated path.

## 2. Recurring code-only update

```powershell
# Source: clean main branch from TorMT/FolkNettside-v2
.\Oppdater-FolkNettside.ps1

# Review build, changed file counts and NTNU staging target.
# THEN explicitly deploy. This pulls --ff-only and reruns validation:
.\Oppdater-FolkNettside.ps1 -Apply

# Roll back an exact release using the printed path.
# Dry-run first; neither command changes the V1 root:
.\Oppdater-FolkNettside.ps1 -Rollback "C:\Users\...\FolkNetV2-Releases\FolkNetV2-20261012T203200000Z"
.\Oppdater-FolkNettside.ps1 -Rollback "C:\Users\...\FolkNetV2-Releases\FolkNetV2-20261012T203200000Z" -Apply
```

Features: verified origin/branch/clean tree; git ff-only; public-file audit;
content check; JS unit tests; NTNU backup and rollback tests; isolated
`build_ntnu_staging.py` artifact; SHA-256 diff; atomic file replacement;
rollback records and original files **outside** public NTNU. The V1 homepage,
`semestre/` resources, original `includes/`, and original portfolios are
never modified. Apply copies changed V2 assets and always writes index last.

Builds retain synthetic preview fixtures in `examples/`; V2 **never shows
them as live NTNU courses**. Course data comes from existing semester-specific
`index.json` files via same origin.

## 3. Mandatory staging acceptance in a real browser

1. Visit `https://tormt.folk.ntnu.no/v2-staging/` on desktop and mobile.
   Confirm the application loads and `Courses` shows real semester 1–5
   entries from **NTNU**, not TMR4182's synthetic GitHub fixtures.
2. Open multiple nested PDFs, `.py`, `.ipynb`, quiz JSON, Office and ZIP
   originals from actual semester paths (including non-ASCII filenames).
   Record direct NTNU links, HTTP response and viewer behavior. Protected
   material must be blocked **at the server level** from direct URLs.
3. Test mobile semester tabs, search, resource-tree nesting, and the empty
   course state. A catalog index failure must show a warning.
4. Exercise local Fusion CAD installer, STEP import, KISSsoft sample and
   CoolProp numerical checks. A real Fusion script run needs Fusion installed.
5. Test MedisinTimer private Drive on two devices (including conflicts),
   Dive Log, Brewing/RAPT, Google login and Supabase Folk account only with
   explicit consent and proper credentials. Do not falsely mark them green
   when the accounts are unavailable.
6. Validate site-relative assets, CSP, console errors, browsers' network
   responses and download links; include screenshot evidence.
7. No secrets may appear in `src`, `data`, `index.html`, or any published
   `*.js` asset. Backend secrets remain server-side; never copy the V1
   PHP `includes/` wholesale.

## 4. What Codex should implement *before* proposing cutover

- Read `docs/PRODUCTION_PARITY_GAP_REGISTER.md` and
  `docs/NEXT_STEPS.md`. Work from the numbered outstanding rows, recording
  actual code/test evidence for each item. Do not mark things done from
  screenshots, old code or mock CI alone.
- Maintain a clear distinction: **implemented**, **tested in CI**,
  **tested on webedit**, and **blocked on external account/hardware**.
- Each self-contained fix: separate commit, targeted tests + broad CI,
  no histories rewritten. Do not delete V1 or demo LeseRavnen.
- The final handoff must include: changed files, commit SHA, commands run,
  pass/fail status, staging URL, backup directory, and exact rollback command.

## 5. Production go/no-go

Do **not** run a root cutover automatically. The owner must approve a
specific final candidate *after* NTNU staging end-to-end tests, backup
restoration test, the current application/security check and an explicit
list of remaining intentionally external/unsupported features. The previous
production freeze through **2027-01-01** remains in force unless explicitly
changed by the owner.
