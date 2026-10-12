# NTNU catalog health audit

This is a **metadata-only, read-only** inspection of the public
`https://tormt.folk.ntnu.no/semestre/` JSON indexes. Run it from a
local V2 checkout when new courses, PDF, notebooks or nested directories
appear:

```bash
node scripts/audit_ntnu_catalog.mjs --live
```

The script requests only the fixed, public `/semestre/index.json` and
`/semestre/<n>/index.json` endpoints, never PDF, notebook or protected
course bytes. Output contains **only aggregate counts** for per-semester
courses, nested files, parser exclusions and viewer formats; no resource
filenames, passwords or private paths. No data is written or uploaded.

**Interpretation:**

- `visibleResources`: metadata entries accepted by V2's actual
  `parseNTNUSemesterIndex()` and included in the user-facing course catalog.
- `skippedEntries`: public index metadata entries rejected or omitted.
  Investigate unexpectedly large counts without loosening protected filters.
- `withoutNativePreview`: formats categorized as unsupported or
  conversion-only by the current ViewerShell dispatch table; direct download
  may still be available.
- `unavailable`: public index couldn't be fetched; incomplete results
  are never silently treated as a complete semester inventory.

**Not included:** Apache authentication checks, link liveness,
protected paths, actual file integrity, server-side MIME headers,
live rendering/JavaScript, quiz score tests or valid notebook execution.
A zero `withoutNativePreview` count is not full compatibility.
Tests in `tests/ntnu-catalog-health.test.mjs` verify protected names
never reach audit output.

The regular GitHub Pages course view uses synthetic preview data; an
actual NTNU `/v2-staging/` browser run will be a separate later
acceptance task. No planned archive copying to GitHub.
