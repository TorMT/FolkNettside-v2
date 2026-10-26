# FolkNet learning progress — development-only backend candidate

This module is the first building block for Google/Folk account-linked
course progress. **The new SQL migration has not been deployed.** Neither
quiz/video progress nor private dive log is automatically uploaded by
importing this file. The existing local and optional Google Drive backups
remain untouched.

## Current files

- `src/platform/folk-learning-progress.js`: authenticated private
  Supabase PostgREST helper with explicit `read` and `save` calls.
- `server/supabase/20261013_learning_progress_candidate.sql`: candidate
  RLS table `folk_learning_progress`, row revision trigger, small JSON
  payload constraint and self-owned policies.
- `tests/folk-learning-progress.test.mjs`: mock two-device
  conflict-avoidance, identity isolation, whitelist and URL validation.

**Identity:** One Supabase `auth.users.id` must be the primary account.
A Google Identity Services `drive.file` token is **not** a Supabase JWT.
The Google provider and optional manual identity linking must be configured
and separately verified in the FolkNet project before sign-in can be
unified. No automatic merge by matching emails.

## Safe progress summary schema

- `kind=video`: `position`, `duration`, `watched`, `updatedAt`.
- `kind=quiz`: `answered`, `total`, `correct`, `completed`,
  `updatedAt`. **Never raw answers or quiz content.**
- `kind=course`: `completed`, `updatedAt`.

Approved public NTNU files can be identified by either the original
`https://tormt.folk.ntnu.no/semestre/...` URL or their absolute
`/semestre/...` path. Both normalize to the same canonical URI-encoded path;
a local CORS-retry `blob:` URL **never** changes the progress key. Unknown
origins, hidden, protected, credential-like or malformed paths fail closed.
This identification change is CI-tested; cloud syncing is still opt-in and
the production progress table is **not yet deployed**.

Each resource key is a SHA-256 digest of `kind` and a stable approved
resource ID or full NTNU path. Resource titles are not used to key progress.
Renaming or moving a live NTNU resource needs an explicit old→new alias
mapping before keys are changed, otherwise progress would appear missing.

The new endpoint requires an authenticated FolkNet bearer token. All
requests contain the current user's UUID; RLS independently protects that
UUID. First insert uses a unique composite PK; subsequent saves use
`revision=eq.<expected>` and increment by exactly one. A 0-row PATCH
or duplicate INSERT is a **conflict**, not permission to overwrite.

## Mandatory gates before cloud data use

1. Review the migration and its SQL trigger on a **separate test project**
   or local database; then only if approved apply it to
   `aeuouzkiyddfjtjfdosp`. Never run on LeseRavnen.
2. Verify anonymous, user A and user B cannot read/change each other's
   records, including direct PostgREST calls.
3. Verify 2 devices updating one record produce a conflict on stale
   revision rather than silently overwriting.
4. Link Google identity only after the existing FolkNet account is signed in;
   show linked providers and return-to-site validation.
5. Add explicit, opt-in import/reconciliation from local quiz/video stores
   with a preview of changes, backups and rejection of invalid input.
6. Integrate Settings and viewer controls only after the tests above;
   no background cloud sync until conflict/recovery UX is ready.
7. Move Dive Log next with per-dive record IDs, tombstones and encrypted
   backups, not into the learning-progress summary table.

This development work is independent of NTNU semester indexing. Course
files stay on NTNU, application code stays in GitHub and only consented
user progress summaries may later be stored in Supabase.
