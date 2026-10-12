# Architecture decision — automatic NTNU indexing and unified account identity

**Date:** 2026-10-12  
**Status:** Proposed development direction; no NTNU file moves, V1 edits, changes to existing user data or real OAuth configuration have been authorized.

## Executive decision

- **NTNU = original course file store**; GitHub = application source and automated CI; Supabase = identities and **per-user** app data.
- Prefer serving V2's *small static application* from `tormt.folk.ntnu.no` so its JavaScript and NTNU `/semestre` resources remain **same-origin**. GitHub Pages continues as an independent development preview. No semester archives in GitHub.
- An HTTP `index.html` redirect from NTNU to `tormt.github.io` would change origin. The current V2 NTNU loader explicitly uses `mode:"same-origin"` and selects real NTNU courses only on the exact NTNU host. Redirecting **currently yields demo courses**; rewriting the loader alone cannot bypass NTNU CORS and private-resource access controls. Do not choose this solely to reduce webedit clutter.
- **Do not regenerate `index.html` hourly.** HTML is application code and changes only upon a GitHub release. Generate a **public JSON catalog** on file changes or an hourly fallback timer; the browser reads it with a bounded cache lifetime or `cache:"no-store"`.
- Avoid requiring Supabase or ChatGPT to scan webedit. Cloud jobs cannot enumerate NTNU file paths via standard HTTPS unless a properly authenticated listing service is deliberately provided; do not enable unrestricted Apache directory listing.

## 1. Usable filesystem layout

First, **preserve every current course slug and direct file URL** in production.
Introduce logical categories *within existing public `filer/` folders*
for new resources. Example, intentionally not a migration instruction:

```text
webedit/ (unchanged NTNU site root)
  index.html                 # existing V1 homepage — frozen
  semestre/
    5/
      Marin-Dynamikk/        # existing stable course slug
        filer/
          01-forelesninger/
          02-oving/
          03-lab/
          04-formelark/
          05-eksamen/
          06-kode-og-data/
          07-modeller-og-cad/
        quiz/
      marin-teknikk-4-propulsjon/
        filer/
          ...
  v2-staging/
    index.html               # V2 code artifact, built from GitHub
    data/
      ntnu-autocatalog.json  # generated PUBLIC metadata; no course bytes
```

The folder vocabulary is **optional**; existing loose files continue to work.
In V2 presentation, we can classify and sort old files without moving them.
Consider mapping folder labels in UI rather than putting numbers in actual
paths to avoid moving files again in the future.

**Later, if physically moving all NTNU resources:** make a SHA-256 inventory,
record old-to-new URLs, verify references in course pages/quiz JSON/Python imports,
test path aliases/redirects, migrate in reviewable batches with rollback.
Do not rename public directories as a side-effect of catalog-generation.
The NTNU server is also used by original V1 links, so 100% restructuring has
higher blast radius than changing *virtual* folders in V2.

## 2. One canonical identity for both email and Google

Use **Supabase Auth user UUID** (`auth.users.id`) as the account's stable
primary key, regardless of chosen sign-in method:

```text
 FolkNet (email/password) ──┐
                            ├─ Supabase Auth user UUID ─┬─ course progress
 Google identity (OAuth) ───┘                           ├─ quiz attempts
                                                        ├─ video progress
 Optional Google Drive authorization ──────────────────┼─ private dive log
   (separately granted drive.file scope)                └─ user settings
```

Supabase supports `linkIdentity({provider:"google"})` after the user
authenticates to their **existing** FolkNet account, when Google provider and
manual linking are enabled for this Supabase project. Do **not** assume a
Google Identity Services Drive access token is a Supabase JWT.

UI workflow:
1. Sign in using existing FolkNet username/password or Google.
2. Go to **Settings → Account & connections → Link Google**. Confirm the
   actual Google account and its verified identity before OAuth redirect.
3. After successful return, refresh the authenticated Supabase identity
   list; show linked providers and a safe unlink option only while another
   sign-in method is available.
4. Only if the user enables Drive sync: ask for `drive.file` consent.
   Keep independent Google Drive token scopes and encryption separate from
   Supabase login.

**Avoid blind merges.** If two prior Supabase accounts already contain data,
linking can fail; require an authenticated export/import with clear source,
destination, record counts and conflict preview. Google-sub-based local
keys (e.g. today's Dive Log and quiz/video progress) must be **migrated
with explicit consent** to Supabase UUID keys, not silently erased or
attached to any email match. Guest data stays isolated until approval.

### Suggested progressive data model

| Data | Storage of record | Rules |
| --- | --- | --- |
| User profile / theme | RLS-protected Supabase user settings | Small JSON; explicit consent for sync |
| Course completion, watched position, quiz scores | `folk_learning_progress` keyed by `(user_id,resource_id,kind)` | Stable resource IDs independent of title, changed path aliases maintained; small payload, revision/CAS, retention/export |
| Dive entries | Private RLS Supabase table or encrypted object bucket under UUID | Each dive has stable `entry_id`; create/edit/delete versioned, tombstone and per-row conflict handling |
| Brewing inventory / recipes | Private versioned module store | No leaking original RAPT tokens or raw private logs |
| MedisinTimer | Retain client-side AES-GCM encryption before private remote storage | No medicine schedules in general settings or analytics; assess privacy/security separately |
| Google Drive | Optional encrypted backups | Not a second silently competing source of truth |

New DB schema must use strict Row Level Security for each table, self-only
select/insert/update/delete, limited types/sizes and server-side checked
revision increments (compare-and-swap) where concurrent edits matter.
Never expose the Supabase service-role key to the browser. Before live
deployment: test two unrelated accounts, two devices and lost-password/
expired-token, concurrent change, import, deletion and restore.

## 3. Automatic indexing (recommended)

The user should upload a document into `semestre/N/<course>/filer/...`
without opening any `index.html` or editing `index.json`.

**Producer:** a small Python scanner running where a **mounted webedit
filesystem** is available:
- Uses `os.scandir` metadata (name, mtime, size); never reads PDF/video/CAD contents.
- Reads an **explicit owner-reviewed allowlist** of public semester/course
  slugs and subfolders. Public flags must be positive, not inferred solely
  from the lack of `(beskyttet)`; unknown/new course directories are
  intentionally excluded until approved. Ignore all symlinks, hidden files,
  code/config/secrets, any protected nested directory and temporary files.
- Validates each filename and path. Never outputs protected names to JSON or
  logs, follows symlinks, or exposes course material whose access policy is
  uncertain.
- Maintains optional human-friendly `course.meta.json` (title, code, year,
  display groups) for approved public courses; no HTML page generation.
- Builds V2-specific `v2-staging/data/ntnu-autocatalog.json` with stable
  resource IDs and original links. During development, does **not** replace
  the V1 `/semestre/index.json` or per-course indexes.
- Writes a temporary JSON file, fsyncs, then atomically replaces the V2
  catalog when supported by the mounted filesystem. Compares digest first:
  unchanged content means **no rewrite**.
- Fail closed on unavailable mount, unexpected permissions, index parse
  errors, suspicious paths, or inexplicable disappearance of many public
  files. Keep last known good catalog and an external backup.
- Uses a bounded size/time/file-count budget, dry-run and detailed summary.

**Trigger:** on each file upload through a local VS Code task/upload script;
also optionally every 60 minutes via **Windows Task Scheduler** (only while
PC is running, NTNU VPN/mount accessible). Watchers on network shares can
miss notifications, so periodic reconciliation remains useful. Alternative
is authorized NTNU server-side job if available; don't assume cron rights.
A Supabase Cron Edge Function can periodically **fetch an already-published
index**, but cannot list private/mounted NTNU files by itself.

**Consumer:** V2 on NTNU loads the generated catalog with a freshness marker
and rigorous validation; when missing/invalid, falls back to the current
verified public per-semester indexes, with a visible stale-status notice.
GitHub Pages keeps preview fixture data. Resource file bytes stay on NTNU
at their same-origin paths.

ChatGPT scheduled tasks are useful for a **separate** check on whether
published index counts or data freshness changed, not for the primary
publishing pipeline. A ChatGPT task has no implicit access to webedit,
cannot read private network shares from a public URL, and isn't as
deterministic as a local OS task.

## Implemented first step (development only)

A dedicated scanner is now available at
`scripts/preview_ntnu_autocatalog.py`. It is an **opt-in local preview**
and does not update `v2-staging`, the existing V1 `index.json` files,
the live `index.html`, Supabase, or the browser's catalog reader.

Run against a **verified** locally mounted NTNU webedit path. Copy
`data/ntnu-index-allowlist.example.json` to a private local allowlist
and review every public course/section explicitly:

```powershell
# Metadata-only dry run; no writes anywhere:
py -3 scripts/preview_ntnu_autocatalog.py `
    --webroot "<verified-NTNU-webedit-root>" `
    --allowlist "data/ntnu-index-allowlist.example.json"

# Explicitly write the candidate JSON OUTSIDE NTNU/webedit:
py -3 scripts/preview_ntnu_autocatalog.py `
    --webroot "<verified-NTNU-webedit-root>" `
    --allowlist "data/ntnu-index-allowlist.example.json" `
    --output "$env:TEMP\\ntnu-autocatalog-preview.json"
```

The public semester index must explicitly mark the course public, and
the course index must independently mark each scanned section public
(or explicitly reference its quiz). This protects against accidentally
indexing a protected course even if it is present on the disk. Suspicious
names, links, hidden content and unapproved folders are never included.
Only paths, sizes and modification times of approved public resources
are considered. Review the generated candidate before adding a V2
consumer or scheduled publishing. Tests:
`tests/test_ntnu_autocatalog.py`.

**Not implemented yet:** schedule, writing live/staging catalog, browser
consumer/fallback, Google↔Folk identity linking, and Supabase
per-user course/dive progress migration. Do not imply they work
from the existence of the scanner.

## 4. Implementation sequence while V2 remains in development

1. Add the **read-only scanner + fixture tests**, measuring path, number
   of resources and exclusion correctness. Do not write production indexes.
2. Introduce an opt-in V2-only generated catalog in `v2-staging` with
   fallback to legacy index; verify no users see another person's materials.
3. Integrate a VS Code file-upload task and scheduled **local** reconciliation.
   No schedule created in ChatGPT until explicitly requested.
4. Complete Google↔Supabase linking (secure redirects, nonce/state, callback,
   signed-in verified identity, unlink, rollback). No credentials in repo.
5. Add account-scoped course/quiz/video progress as the **first non-sensitive**
   cross-device sync and test conflict behavior.
6. Add a per-entry private dive log and explicit migration from legacy
   Google-sub local keys. Preserve existing Google Drive encrypted backups.
7. Treat Brewing/MedisinTimer as separately gated migrations.
8. Only after real data tests, UI acceptance and owner approval, consider
   updating homepage routing. **Do not redirect NTNU to GitHub Pages by
   default**.

## Decisions that remain to be tested

- Does the actual webedit path stay mounted while Windows Task Scheduler
  runs, and is VPN necessary off campus?
- Is NTNU-hosted browser `fetch()` allowed to read all intended *public*
  course files? Confirm `.htaccess` access control for private direct URLs.
- Is Google OAuth enabled in the existing Supabase project (manual linking
  and redirect origins); avoid creating or changing auth configuration
  without account-owner approval.
- Account migration semantics when existing Google-sub data and FolkNet UUID
  data conflict.
- Whether large file lists justify a small cached delta endpoint (probably
  not initially, with only hundreds of resources).
