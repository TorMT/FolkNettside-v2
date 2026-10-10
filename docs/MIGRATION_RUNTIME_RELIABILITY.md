# V2 runtime and migration reliability – 2026-10-10

V2 is being built to replace V1 eventually, not reproduce every older workaround. The current GitHub Pages address is a **static preview**; production V1 on NTNU remains untouched until explicitly approved after the agreed freeze.

## Resolved by this release

### CoolProp is no longer hosted by V1

- `src/vendor/coolprop/coolprop.wasm` is a **checked-in, immutable 4,175,872-byte WebAssembly file**, Git blob SHA-1 `db4c724c417c9614a600c5105946be1605a02106`.
- `scripts/fetch_coolprop_wasm.py` remains named this way for compatibility with older automation, but is now **offline only**. It fails closed when the local file is missing or its size, magic or pinned Git blob digest differs.
- `.github/workflows/pages.yml` verifies it before running the numeric CoolProp regression tests; the browser and deployment load the local binary. A V1 website outage cannot block CoolProp in the V2 build.

### SiteUpdater migration source is persistent

- After the original sample manifest is intentionally switched to real `site-content/semesters` resources, ordinary `python scripts/update_site.py` and Pages builds use the source recorded in the manifest rather than silently rebuilding from `examples/semesters`.
- If that recorded source disappears or points outside V2, the rebuild **fails** instead of overwriting a real course index with the synthetic example.
- `--source` still overrides the default explicitly. `--interactive`, `--semester`, `--course`, `--dry-run`, and `--check` remain supported.

**Important:** All source directories must exist in the V2 repository checkout during the Pages build. The original V1 NTNU files are not yet copied. The source switch is *not* the final course migration.

### Local V2 index snapshots and rollback

Before a substantive change to `data/content-manifest.json`, SiteUpdater snapshots the existing manifest into `.siteupdater-backups/v2-manifests/` (ignored by Git), then writes the new JSON atomically. An unchanged manifest doesn't create a new snapshot. To restore a chosen snapshot:

```bash
python scripts/update_site.py --restore-manifest ".siteupdater-backups/v2-manifests/<STAMP>-content-manifest.json"
```

The restore checks the snapshot's source and protected-resource paths and backs up the current manifest first. **This rolls back only the JSON index, never the underlying course files or PHP data.** A full migration needs the separate V1 backup/playbook in `docs/PRODUCTION_MIGRATION_PLAYBOOK.md`.

### Static preview external service failures

- Matpris requires an authorized PHP proxy. GitHub Pages is incapable of executing it: the V2 Matpris UI now explains this immediately, disables unavailable price searches rather than firing pointless PHP requests, and keeps the browser-local shortlist accessible.
- With an explicitly configured backend endpoint or compatible server host, Matpris's normal search/compare flow continues.
- Brewing/RAPT, quiz PHP leaderboard, native Autodesk APS and cross-device Google workflows are **not declared migrated by this change**. Their backend hosts/credentials and live service contracts remain release blockers.
- Kekule chemistry runtime is pinned to the exact published `1.0.4` CDN path. Remaining external dependencies are tracked for later pinning/SRI/vendor auditing.

## Release-gate caution

Do not use the preview's HTTPS URLs to imply that PHP-backed features work. Before production cutover, decide whether V2 is served from the existing NTNU PHP-capable origin or uses an authorized remote API origin. Use server secret storage, not public HTML or JavaScript.

A restored index is **not** a verified whole-site backup. It is safe to update V2 development without moving, deleting or rewriting the original NTNU course archive. 

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
