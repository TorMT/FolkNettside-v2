# External services and secrets for the V2 preview

The browser is hosted as a static site. **Never put private API keys, refresh
tokens, service account JSON, or API secrets in the repository, HTML or JavaScript.**

## Google Analytics 4

The original FolkNettside GA4 measurement ID is configured in `index.html`
(`G-BJ41MZJP0L`). This ID is a *public client identifier*, not a password.
The optional integration lives in `src/platform/analytics.js`. Visitors must
explicitly enable page-view analytics in Settings -> Privacy & data. A decline
never initializes the script. Actual GA4 reports require access to the Google
Analytics property and must not be proxied to the public site.

## Google account and Drive

The shared account consumer reads `window.__FOLK_GOOGLE_AUTH_CONFIG__` or the
existing NTNU `/includes/brewing/api/storage.php` config endpoint.
GitHub Pages does not execute PHP, so a valid **public OAuth browser client ID**
must be injected by deployment configuration for sign-in to work in the preview.
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
