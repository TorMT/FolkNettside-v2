# Read-only bridge to frozen V1 PHP services

The V2 Brewing page may use an optional, explicitly enabled Supabase Edge
Function named `legacy-brewing`. **No V1 source, server config or secret was
changed or copied.** The relay reads the *existing* V1 PHP HTTP responses;
it does not migrate RAPT/Brewfather/APS keys.

## Security model

- Only HTTPS `https://tormt.folk.ntnu.no/includes/` is contacted server-side.
- Allowed upstream GET paths: `rapt/api/dashboard.php`,
  `brewing/api/recipes.php`, `brewing/api/reference.php`,
  `brewing/api/logs.php`.
- For the relay to fetch data, every request must have a real
  FolkNet **Supabase Auth** bearer; the function revalidates this using
  `/auth/v1/user`, then queries `folk_site_admins` with the *user's own
  JWT* and its existing self-read RLS policy. Only the owner in admin slot
  1 is permitted. A Google Drive OAuth token **does not** satisfy this.
- Only GET permitted. No proxy access to `storage.php`, `export.php`,
  arbitrary V1 paths, unrestricted query parameters, or secret files.
  V1 remains unchanged. No cookies/Authorization header are forwarded.
- Fixed browser origins, blocked redirects, bounded upstream fetch and 4 MiB
  streaming response limit. No raw upstream errors are reflected. Redacts
  key/token/secret-like JSON fields, limits top-level response shape, sets
  private no-store headers.
- Maximum hydrometer lookback via relay is 60 days (the UI's Max label says
  `60 d max` in this mode). Large histories require an explicit
  separately reviewed design, not an unbounded GET to V1.
- V1's raw PHP endpoints may themselves be publicly callable. **A secure
  V2 proxy does not make V1 private**. Inspect V1's actual exposure separately
  and protect/rotate as appropriate without changing frozen production until
  approved.

## Activating and testing

Target **only** Supabase project `aeuouzkiyddfjtjfdosp` in TorMT's
organization, not LeseRavnen or the prior `glfuvf...` project.

Deploy `supabase/functions/legacy-brewing/index.ts` with the sibling
`core.js` and gateway JWT verification **disabled only because CORS
preflight has no Authorization header**. Every GET still verifies Auth and
admin membership in code. No new secrets are required for the function:
Supabase provides URL and publishable/anon key.

Then, and only after deployment, V2's public
`data/service-endpoints.json` can opt in with:

```json
{
  "legacyReadProxy": {
    "enabled": true,
    "base": "https://aeuouzkiyddfjtjfdosp.supabase.co/functions/v1/legacy-brewing/"
  }
}
```

The browser's `folkBrewingFetch` attaches a FolkNet bearer only to that
precise backend origin/path. Existing same-origin V2 PHP is unchanged when
this configuration is disabled. Browsing without a verified owner account
returns a clear sign-in/403 error, not private data. Dashboard private
telemetry is not put into legacy `localStorage` cache.

**Current prerequisites / known blockers (2026-10-26):**
- Actual V1 PHP HTTP success and real data have **not** been verified here.
- Live Supabase project had **zero Auth users and zero admin rows** at the
  last check; an actual owner login must be created/verified securely before
  any relay GET can succeed.
- No real RAPT/Brewfather live responses, account isolation, user login or
  NTNU-browser tests have been completed.
- Read-only mode does not implement V1 POST for export, saving brew logs,
  updating storage, or modifying recipes. Local inventory and the existing
  legacy-page fallback remain separate.
- Backend CORS and authenticated requests need a real browser smoke test at
  320/390/768 px, keyboard-only navigation and distinct owner/guest users.

### Verification checklist

1. Node: `node --test tests/legacy-brewing-*.test.mjs` for fixed route
   allowlist, auth, admin denial, sensitive field redaction, response bounds,
   no cross-host bearer leakage and logout race.
2. Supabase public preflight `OPTIONS` should return 204 for the approved
   origin; anonymous GET must return 401 and a non-admin real session 403.
3. After the owner is provisioned, GET `/rapt/dashboard.php?days=1` using
   the browser V2 Brewing page. A result of 502 indicates unreachable or
   malformed V1 HTTP response, not a successful hookup.
4. Verify recipes/reference/log list + log detail independently; verify
   XSS-safe rendering and no localStorage telemetry entries.
5. Try POST, `storage.php`, traversal, unknown params, too many days and
   non-admin identities; all must fail without contacting V1.
6. If V1 endpoints cannot be safely exposed, the approved long-term option
   is to migrate credentials to separate server-only secrets and implement
   a V2-native backend rather than bypass access controls.
