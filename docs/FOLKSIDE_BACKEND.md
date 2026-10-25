# FolkNettside V2 — Supabase backend

## Active destination (25 October 2026)

- **Project reference:** `aeuouzkiyddfjtjfdosp`
- **API base:** `https://aeuouzkiyddfjtjfdosp.supabase.co`
- **Database:** PostgreSQL 17, EU Central (Frankfurt), TorMT's Org
- **Existing unrelated project:** LeseRavnen, not modified
- **GitHub:** `TorMT/FolkNettside-v2`; source files are committed individually
- **Deployed functions:** `folk-core` is ACTIVE (v2) in the new project, deployed from `supabase/functions/folk-core/` on 25 October 2026. Unauthenticated endpoint behavior and a real signed-in-user round trip still need verification. `autodesk-hub` is **not deployed** in this replacement project and requires separate APS credentials/consent. Older deployment notes below can refer to the superseded FolkNet project.
- **Backend authentication status:** Supabase Auth integration with the site's existing Google Drive login is NOT completed. A Google access token from GIS is **not** a Supabase Auth JWT.

This file is an implementation record, **not** permission to remove or migrate
existing V1/Drive data. V1 is unchanged.

## Installed schema (new project; verified 25 October 2026)

The new project contains RLS-protected user settings/files, private OAuth tables and `folk-private` storage (migrations `20261025173633`, `20261025173751`).
**Zero Auth users and zero admins** were present at verification. The schema's
source counterpart is `server/supabase/folkside_backend_schema.sql`. Current objects:

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

### Authenticated Edge Function (folk-core deployed; owner sign-in acceptance pending)

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

Do not mistake `folk-core` for Autodesk OAuth: the separate
`autodesk-hub` Edge Function now contains an encrypted PKCE token exchange,
refresh and callback implementation. Autodesk client registration and
server-side secrets are still missing, and no real Hub user consent has
been exercised. See `docs/AUTODESK_HUB_BACKEND.md`.

## Current V2 account frontend (implemented 12 October 2026)

The optional FolkNet/Supabase Auth account is now visible under
**Settings → Account & connections**, *separate from the existing
Google/Drive session*. The browser loads public configuration from
`data/folkside-auth.json`, which contains the fixed Supabase URL and
a **publishable key only**. It must never contain the database password,
the secret/service-role key or OAuth tokens.

Files:
- `src/platform/folkside-auth.js`: explicit email/password registration,
  sign-in, single-flight refresh, sign-out, and account snapshot events.
- `src/platform/folkside-cloud.js`: authenticated user-identity check
  against the active `folk-core/session` Edge Function.
- `src/settings/settings-page.js` and `src/app.js`: standalone private
  cloud controls. The **Check backend** action is shown only after FolkNet
  sign-in; it requires the returned user ID to match the current
  authenticated Supabase user ID and reports private bucket readiness.
- `tests/folkside-auth.test.mjs` and
  `tests/folkside-cloud.test.mjs`: mock authentication, session refresh,
  invalid login, rejected backend identity and separation from Google.

The browser stores its Supabase access/refresh session in
`sessionStorage` for **this browser tab** only. Tokens are not included
in account snapshots or settings HTML; passwords are not saved in app
storage. This reduces persistence relative to localStorage but **does not
defend against cross-site scripting**—continue enforcing safe escaping,
CSP and trusted scripts. Refresh tokens are serialized using a
single-flight Promise to avoid accidental reuse in the same tab.
The existing Google Drive scopes, token, data and consent state remain
unchanged.

**Not yet completed:**
- Live email verification and successful sign-in with a real user account,
  plus two-account RLS and private bucket acceptance tests.
- Supabase project's Auth **Site URL / Redirect URLs** must allow
  `https://tormt.github.io/FolkNettside-v2/` to ensure confirmation links
  return to the published site. Default project email sending limits may
  apply; configure a proper SMTP provider before broad use.
- Google → Supabase identity linking must be implemented explicitly before
  treating them as the same person. A Google access token is not a
  Supabase JWT. Never automatically merge user records or data.
- Autodesk OAuth **app registration, Edge secret provisioning** and
  actual live Fusion Hub consent/access. Token exchange and refresh code
  and Hub UI are present but have not been validated with real APS tokens.

### Opt-in cross-device Appearance backup

The first deliberately non-sensitive data path is implemented via
`src/platform/folkside-preferences.js` with an explicit
**Back up appearance / Restore appearance** pair under
Settings → Account & connections. Nothing syncs silently.

- Only the 5 whitelisted UI choices (mode, accent, density, motion, contrast)
  are sent to `public.folk_user_settings` under key `appearance`. Other
  data, including medicine content and OAuth credentials, is excluded.
- The user's Supabase access token is attached only to their API request;
  Postgres RLS further restricts rows by `auth.uid()=user_id`.
- The first save is an INSERT-only attempt. Updates include the previously
  fetched row revision as a compare-and-set condition and raise a conflict
  rather than silently overwriting a parallel write.
- Existing cloud backup replacement and local settings restoration require
  a direct, explicit browser confirmation. Restoring changes only the
  *current device's* appearance; it does not change Drive, cloud archives
  or any medical/engineering data.
- Browser sessionStorage credentials are not placed in exported settings
  JSON, and account settings remain distinct from Google Drive identity.

`tests/folkside-preferences.test.mjs` verifies row ownership scope,
whitelisting, refused unknown values, optimistic revision match, and
the absence of accidental sensitive-property export.
**A real two-account end-to-end RLS validation is still a launch gate**
before turning on broader module sync.

No existing module is automatically migrated. This keeps independent
Drive, medicine and study data intact while the private account layer is
qualified.

### Opt-in Appearance backup in the live site

V2 now offers **Save appearance** and **Restore appearance** under
Settings → Account & connections. These actions use the signed-in FolkNet
Supabase identity, `folk_user_settings` and its per-user RLS policy.
Only the five validated keys (mode, accent, density, motion and contrast)
can be transmitted. The site does not send medicine, study files or Google
Drive credentials through this small settings table.

- Saving is manual, not a background sync. First save uses INSERT only;
  an existing remote row produces a conflict rather than being overwritten.
- Subsequent saves use a compare-and-update `revision` filter and reject
  an out-of-date write rather than silently replacing another device.
- Restoring requires explicit user confirmation before overwriting the
  five local Appearance settings.
- The account must be signed in; anonymous use remains local-first.
- This currently implements a safe first module, not general cloud backup.

`src/platform/folkside-preferences.js` contains the scoped REST client,
with unit tests in `tests/folkside-preferences.test.mjs`.
The first real signed-in two-device acceptance test is still required.

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
