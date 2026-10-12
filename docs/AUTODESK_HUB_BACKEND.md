# Autodesk Fusion Hub OAuth on FolkNet Supabase

## Status and scope

The **backend implementation is deployed** to the verified FolkNet Supabase project as `autodesk-hub` (ACTIVE, v1 on 2026-10-12) and version-controlled in `supabase/functions/autodesk-hub/`. Deployment is distinct from working Autodesk authorization: APS app secrets and live consent tests are still pending.
It uses the existing FolkNet Supabase Auth account as its *first-party user identity*.
The Autodesk three-legged authorization flow is a **separate consent step** and
only requests `data:read`. Read-only hub → project → folder → file →
version browsing uses the allowlisted APS Data Management API.

This does not claim that an arbitrary F3Z can be automatically converted into
an engineering-ready STEP assembly or that an Autodesk OAuth connection is
already enabled. Do **not** copy the example hub config into
`data/autodesk-hub.json` until the correct Edge Function is deployed,
credentials have been provisioned and two-account access tests have passed.

## Legacy compatibility note

The frozen V1 repository's `includes/aps/api/common.php` obtains APS
`client_credentials` (**two-legged**) tokens with `data:read` /
`viewables:read` for its PHP proxy workflow. Such a token does **not**
establish the signed-in FolkNet user's personal Fusion Hub authorization.
V2 intentionally uses a separate three-legged, user-consent OAuth flow.
An existing APS app registration may be reused only if it is configured
for the correct confidential OAuth redirect; never copy the V1 local
secret file into GitHub or browser JSON.

## Configuration (operator only)

- Target: Supabase project `glfuvfmppkjmarujjqwg` only. Never target LeseRavnen.
- Autodesk APS app: register an appropriate confidential Web Application.
- Exact Autodesk redirect URI:
  `https://glfuvfmppkjmarujjqwg.supabase.co/functions/v1/autodesk-hub/callback`
- Add these as **Supabase Edge secrets**, never files in GitHub or the client:
  `APS_CLIENT_ID`, `APS_CLIENT_SECRET`, `APS_REDIRECT_URI` (exact URI
  above), and `FOLK_AUTODESK_TOKEN_KEY` (cryptographically random 32 bytes,
  base64url encoded). Do not reuse your Supabase database password as this key.
- The function additionally requires Supabase-managed `SUPABASE_DB_URL`,
  `SUPABASE_URL`, and `SUPABASE_ANON_KEY` (or
  `SUPABASE_PUBLISHABLE_KEY`) in its environment.
- Database prerequisites already exist in
  `server/supabase/folkside_backend_schema.sql`:
  `private.folk_oauth_pending` and
  `private.folk_oauth_connections`. Private tables are not available to
  the browser Data API. The Edge Function accesses them with its own trusted
  PostgreSQL connection. No schema mutation is performed by the Edge handler.
- Deploy the Edge Function as `autodesk-hub` with gateway
  `verify_jwt=false`: this is required solely because Autodesk must access
  `GET /callback` without a Supabase bearer. Every session, catalogue,
  authorization-start and disconnect request independently verifies
  its bearer via Supabase Auth's `/auth/v1/user` endpoint.

For a production run, confirm the confidential APS app accepts authorization
code with PKCE (`S256`). Autodesk's v2 token endpoint receives the client
credentials in a Basic header; the code verifier is in the form body.

## First-party API

All endpoints share the prefix `/functions/v1/autodesk-hub/`:

| Method/route | Authentication | Behavior |
| --- | --- | --- |
| `GET session` | Supabase bearer | Connection/configuration status, no APS tokens |
| `POST authorize` | Supabase bearer | Create random state and PKCE, return Autodesk consent URL |
| `GET callback` | One-time state | Atomically consume state, exchange code and encrypt tokens; safe return redirect |
| `GET catalog` | Supabase bearer + APS connection | Read-only normalized hubs/projects/folders/items/versions |
| `DELETE session` | Supabase bearer | Remove that user's Autodesk connection |

The callback is safe without a logged-in browser because a cryptographically
random, expiring one-time state maps to a validated Supabase user ID in the
private database. It never uses an unauthenticated `user_id` query parameter.
The pending verifier and stored tokens are AES-256-GCM encrypted with separate
additional authenticated data (state hash vs user ID). Refresh-token rotation
is serialized using a PostgreSQL advisory transaction lock. No Autodesk
credential, token or raw signed download URL is exposed to GitHub Pages.

Pagination cursors are HMAC-signed, user-bound, tied to the requested IDs
and expire after 10 minutes. A signed cursor is *not* an access grant:
each page is fetched again with that user's authorized Autodesk token and
the upstream APS next link is checked against the fixed Autodesk endpoint.

### Activating the browser only after live verification

After backend deployment, copy
`data/autodesk-hub.example.json` to `data/autodesk-hub.json`. It contains
only the public API base and `"authMode":"folknet"`, never keys. The browser
then adds the **current FolkNet Supabase Auth** bearer only to the fixed
`glfuvfmppkjmarujjqwg.supabase.co` host and exact `autodesk-hub` path.
It never sends a Google Drive token, or the Autodesk access token, to this
API. If the FolkNet user is signed out, they must sign in via Settings first.
Because GitHub Pages uses `sessionStorage` for the FolkNet Auth session,
start the Autodesk redirect in the same browser tab.

Recommended authorization return route:
`https://tormt.github.io/FolkNettside-v2/#/engineering/cad`.

## Verification gates

Automated test suite:
`node --test tests/autodesk-oauth-core.test.mjs tests/autodesk-hub-client.test.mjs`.
These cover PKCE, one-time callback, encryption AAD, forbidden origins, signed
cursors, no browser-held APS tokens, and distinct Supabase account isolation.

**Still required for acceptance:** real APS confidential application ID and
secret, secret provisioning, live callback, real user consent, two separate
Supabase/Autodesk accounts, access-token expiration and refresh, cancellation,
concurrent requests, disconnect and access-revocation behavior. Reject
privilege escalation or cross-account data exposure as a launch blocker.
Real Fusion F3Z-to-STEP analysis remains a separate engineering task.

Official API specifications:
- https://aps.autodesk.com/en/docs/oauth/v2/tutorials/get-3-legged-token
- https://aps.autodesk.com/en/docs/data/v2/reference/http/hubs-GET
- https://supabase.com/docs/guides/functions/connect-to-postgres
