# Live Google Drive photo feed

The GitHub Pages V2 site is static. To refresh albums when a visitor opens the gallery, deploy `api/photo-feed.js` as a Vercel serverless function and set `data/diverse/photo-feed-config.json` to its HTTPS endpoint.

1. Create a Google Cloud service account with Drive API enabled. Share the exact `FolkNettside/Bilder` folder (ID `1lBkBhTHl7CkVoAaUgWn2RAtKZXqRre3k`) with the service account as Viewer, including access to its subfolders/files.
2. In Vercel set secret `GOOGLE_SERVICE_ACCOUNT_JSON` to the service account JSON. Never commit the key.
3. Deploy the repository as a Vercel project with the `api/photo-feed.js` endpoint.
4. Set `liveEndpoint` in `data/diverse/photo-feed-config.json` to `https://YOUR-VERCEL-HOST/api/photo-feed` and publish V2. Without this value the existing static manifest remains active.
5. Verify a new public image appears after at most five minutes and that private images never appear.

The endpoint checks all direct subfolders, paginates files, verifies each file's explicit or inherited public permission visibility via Drive permissions, limits to 100 images per album, and fails closed on API errors. The browser falls back to the last committed `photo-feed.json` on network or API errors. This fallback may contain older public photos. Neither service account credentials nor photo bytes are sent to GitHub Pages.

Important: Google Drive's permission listing may omit inherited permissions or require additional authorization depending on shared-drive configuration. Test with public and private fixtures before enabling the endpoint. The endpoint is not enabled by default.
