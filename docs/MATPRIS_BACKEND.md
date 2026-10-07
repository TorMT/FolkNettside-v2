# Matpris backend

The v2 Matpris client never receives the Kassalapp API key. The browser calls a same-origin proxy, while the proxy authenticates to Kassalapp.

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
