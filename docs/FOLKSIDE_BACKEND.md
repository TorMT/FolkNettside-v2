# FolkNettside V2 — Supabase backend

## Active destination (12 October 2026)

- **Project reference:** `glfuvfmppkjmarujjqwg`
- **API base:** `https://glfuvfmppkjmarujjqwg.supabase.co`
- **Database:** PostgreSQL 17, EU West
- **Existing unrelated project:** LeseRavnen, not modified
- **GitHub:** `TorMT/FolkNettside-v2`; source files are committed individually
- **Deployed function:** `folk-core` (ACTIVE)
- **Backend authentication status:** Supabase Auth integration with the site's existing Google Drive login is NOT completed. A Google access token from GIS is **not** a Supabase Auth JWT.

This file is an implementation record, **not** permission to remove or migrate
existing V1/Drive data. V1 is unchanged.

## Installed schema

The SQL applied to the verified destination project is versioned as
`server/supabase/folkside_backend_schema.sql`. Current objects:

| Resource | Intended use | Exposure |
| --- | --- | --- |
| `public.folk_user_settings` | Per-user UI and module settings (small JSON only) | Authenticated self rows only (RLS) |
| `public.folk_user_files` | Per-user metadata / private object references | Authenticated self rows only (RLS) |
| Storage `folk-private` | Private general/engineering/course/dive/brewing/encrypted medicine files | Private bucket, user UUID path prefix, RLS |
| `private.folk_oauth_connections` | Encrypted external OAuth token record | Server/service role only; no public Data API |
| `private.folk_oauth_pending` | Time-limited encrypted PKCE state | Server/service role only; no public Data API |

The public file metadata validates a category, owner-prefixed object path,
and encryption format. Medicine files require `folk-medisin-vault` metadata.
The policy **cannot prove that user-provided bytes were encrypted**, so
client-side encryption and envelope checks must still be performed before
upload. `folk-v2-private-vault` is also supported for other private modules.
No medicine data has been uploaded or migrated.

`private` is a non-exposed Postgres schema. RLS is enabled there in
addition to denying anonymous and authenticated direct grants. No browser
may store an Autodesk refresh token or a database service-role credential.

### Security verification completed

The active database was queried after installation. All four new tables
have RLS enabled and `folk-private` is confirmed private. Eight user-table
policies and four storage policies restrict access to `auth.uid()` (for
objects, the first path segment must match that UUID). The private OAuth
tables intentionally have no end-user RLS policies.

Supabase security advisor reported only informational "RLS enabled no policy"
for the two private, intentionally server-only token tables. The performance
advisor identified a missing index for the pending OAuth `user_id` foreign
key; the index was added. Newly created unused indexes may be informational
until traffic begins.

### Authenticated Edge Function

Versioned files: `supabase/functions/folk-core/core.js` and `index.ts`.

- `GET /functions/v1/folk-core/health`: authenticated backend capabilities,
  not publicly enumerable account data.
- `GET /functions/v1/folk-core/session`: reports whether the supplied
  **Supabase Auth** access token belongs to an actual user.
- `OPTIONS`: permitted CORS preflight for `https://tormt.github.io`.
- Other methods are rejected. Unauthorized requests return 401.

The function sets `verify_jwt=false` at the gateway **only** so an
unauthenticated CORS preflight can succeed. Actual GET calls independently
validate bearer JWTs with the project's `/auth/v1/user` endpoint before
returning data. Tokens are never echoed in responses. This is covered by
`tests/folk-core.test.mjs`. The deployment exists in the correct project;
a live browser session with a real user JWT has **not yet been tested**.

Do not mistake this function for the Autodesk OAuth backend: Autodesk
client registration, secret configuration, consent, token refresh,
encrypted token storage and callback completion remain to be implemented.

## Intended migration sequence

1. Configure Supabase Auth provider(s), allowlisted callback URLs and
   user identity model for V2. Avoid replacing existing Google Drive OAuth
   credentials with Supabase credentials: they are different sessions.
2. Configure a frontend Supabase **publishable** key (safe to expose) only.
   Keep server secret keys, database password and encryption keys out of
   GitHub and published V2 files.
3. Test per-user settings and private object storage on two real test
   accounts, including rejected cross-account reads/writes and storage
   upserts. Prevent anonymous session leakage and accidental public share.
4. Connect the Autodesk hub client to an authenticated server-side OAuth
   service, with robust state/PKCE and encrypted refresh tokens, but keep
   read-only Autodesk scopes until validated.
5. Migrate existing modules **one at a time**, with encrypted exports,
   conflict resolution and explicit opt-in; retain Google Drive backups
   until data parity is verified. Prioritize MedisinTimer security,
   diving logs, brewing and engineering files before optional convenience
   modules.
6. Only then consider the final V1 → V2 cutover with separate acceptance
   criteria. Do not edit or delete V1 or the LeseRavnen backend.

**Database migration history:** The initial SQL was applied directly
after verifying the target project, and the version-controlled SQL is
retained as the initial baseline. Do not independently replay the
`CREATE POLICY` statements with automated Git deployment on this existing
database until the schema and migration history have been reconciled.
Connected GitHub source control does not itself prove a Supabase migration
pipeline was run successfully.

**Security action:** A database password was posted in chat during setup.
Rotate it in Supabase project settings. No password is needed by the
Supabase/GitHub connectors; never copy it into committed configuration.
