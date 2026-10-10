# Matpris backend

The v2 Matpris client never receives the Kassalapp API key. The browser calls a same-origin proxy, while the proxy authenticates to Kassalapp.

## Runtime opt-in and subfolder isolation

GitHub Pages and unconfigured NTNU V2 staging default to **disabled** in
`data/service-endpoints.json`. The V2 Matpris client uses a server endpoint
only when an explicitly reviewed configuration sets
`{"matpris":{"enabled":true,"endpoint":"./includes/matpris/api.php"}}`.
No default requests to V1 `/includes/matpris/api.php` are made from V2.
The local NTNU staging builder can package this exact route at
`/v2-staging/includes/matpris/api.php` with `--enable-matpris`, but
the configured PHP server still needs the secret and dependencies.
See `docs/NTNU_FOLK_HOSTING.md`.

## Production mapping

Deploy `server/matpris.php` as:

`/includes/matpris/api.php`

Set the server environment variable:

`KASSALAPP_API_KEY=<secret>`

Do not commit the key or expose it through JavaScript/config files.

The proxy currently exposes only the v2 core flow:

- `action=search&q=...` → Kassalapp `GET /api/v1/products`
- `action=compare&ean=...` → Kassalapp `GET /api/v1/products/ean/{ean}`

Search calls are explicit (not per-keystroke), size is capped at 50, and responses are cached server-side for 5–10 minutes. GitHub Pages preview has no PHP runtime, so the native UI will show a controlled backend-unavailable state there until a server-backed preview is added.
