# External services and secrets for the V2 preview

The browser is hosted as a static site. **Never put private API keys, refresh
tokens, service account JSON, or API secrets in the repository, HTML or JavaScript.**

## Google Analytics 4

The original FolkNettside GA4 measurement ID is configured in `index.html`
(`G-BJ41MZJP0L`). This ID is a *public client identifier*, not a password.
The optional integration lives in `src/platform/analytics.js`. The external
Google Tag script loads before user consent in denied analytics-storage mode;
V2's GA4 configuration and manual page_view measurement are deferred until
opt-in via Settings -> Privacy & data. V2 adds the manifest-verified public
course code as `course_code` (and semester as `course_semester`) to consented
course page views, never document names or visitor identifiers. Real GA4
reports require private owner access and are not embedded on the public site.
See `docs/INTEGRATION_CONFIGURATION_REGISTER.md` for client/server setup.

## Google account and Drive

The shared account consumer reads `window.__FOLK_GOOGLE_AUTH_CONFIG__`
or V2's own optional `./data/google-auth.json` public browser configuration.
**It no longer falls back to the V1 NTNU PHP storage endpoint**, including when
V2 runs under `folk.ntnu.no/v2-staging/`. A valid **public OAuth browser client
ID** is required for sign-in; client secrets stay server-side. The V2 client
requests only `openid email profile drive.file` rather than accepting extra
OAuth scopes from a legacy server config.
Register the actual GitHub Pages origin under authorized JavaScript origins
in Google Cloud OAuth settings. Do not commit an OAuth client secret.

Use the browser user's access token and narrow `drive.file` scope; backend
service credentials stay server-side. A signed-out user must still be able to
browse public pages.

## Brewing and RAPT

Legacy `/includes/rapt/api/*` and `/includes/brewing/api/*` are PHP
endpoints, not GitHub Pages features. They require a deployed HTTPS backend and
server-side credential configuration. Do not ship a dummy success response.
Keep the visible legacy fallback while backend parity and raw-material data are
not recovered and verified. Use a narrowly scoped, authenticated reverse proxy
if cross-origin browser access is needed, with explicit CORS and rate limits.

## Required verification

- Sign-in, token refresh and sign-out from deployed GitHub Pages.
- Brewing data, recipes, logs and raw materials against the real backend.
- MedisinTimer and Dive Log isolation between two different Google accounts.
- Upload/download conflict behavior when two devices edit the same document.
- Consent enabled, consent denied and Analytics network loading behavior.

These are release gates, not assumed completed features.

## V2 Brewing/RAPT endpoint isolation (2026-10-10)

Brewing uses V2's own `data/service-endpoints.json`, with
`brewing: {enabled:false, raptBase:null, brewingBase:null}` by default.
RAPT telemetry, recipe search and log/storage PHP calls **must not** silently
point to the old V1 `/includes/` root when V2 runs on `folk.ntnu.no`.
Only when a separately deployed V2 backend exists and its same-origin
subfolder was verified may the public configuration be set to:

```json
{
  "brewing": {
    "enabled": true,
    "raptBase": "./includes/rapt/api/",
    "brewingBase": "./includes/brewing/api/"
  }
}
```

These path values contain **no keys**. They resolve against V2's own
`index.html` base directory. Merely enabling them does not create PHP
endpoints; the NTNU candidate builder leaves them disabled by default.
Until an authorized backend is deployed, the browser displays a visible
unavailable notice while local raw-material inventory remains usable.
This avoids cross-version data access and accidental reuse of V1's
PHP/account storage. Test real log/recipe/telemetry functionality and secret
management separately before enabling the adapter.

### MedisinTimer-kryptering og Drive-mappe – 2026-10-10

V2-kopien til Google Drive er nå ende-til-ende-kryptert i nettleseren med
AES-256-GCM og en PBKDF2-avledet passfrasenøkkel. Brukeren kan velge en
eksplisitt Google Drive-mappe-ID, inkludert en delt mappe ved riktige
Google-tillatelser. Passfrasen lagres ikke; hver ny nettlesersesjon må
låses opp. Den tidligere ukrypterte Drive-filen `folk-medisin-v2.json`
forblir urørt. **Lokale nettleserdata og manuelle JSON-eksporter er fortsatt
ukrypterte**, og fler-enhetskonflikter uten atomisk revisjonskontroll gjenstår.
Alle begrensninger og manuelt migreringsløp er i
[MEDISINTIMER_ENCRYPTED_DRIVE.md](MEDISINTIMER_ENCRYPTED_DRIVE.md).
