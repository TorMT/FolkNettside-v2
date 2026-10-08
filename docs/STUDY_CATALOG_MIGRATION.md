# Study catalogs – completed source-backed v2 migration

## LAOS

Source of truth: `https://tormt.folk.ntnu.no/diverse/LAOS/filer/index.json`.

The public index lists three unprotected PDFs and one welcome image, all mirrored into `data/diverse/laos-files/` and referenced by the native v2 LAOS page:

- `Gruppemodul_MTKJ.pdf` (140,126 bytes)
- `Refleksjon Lab Del.pdf` (37,252 bytes)
- `Refleksjon Øving Del.pdf` (26,906 bytes)
- `Laos-meme.jpg` (welcome image)

`data/diverse/laos-assignments.json` records the authoritative source URLs and per-file SHA-256 digests. `tests/laos-source-data.test.mjs` compares the committed bytes to the pinned digests, verifies PDF headers and checks the welcome image. Native LAOS also links to existing exercise-like resources indexed independently in Courses; these are clearly separated from the copied LAOS archive.

The original source index and page remain available via a plain reference link, not an embedded legacy iframe. Do not pull non-public/password-protected resources into the public build.

## AndreKokSider

Source of truth: the `const pages = [...]` array embedded in
`https://tormt.folk.ntnu.no/diverse/AndreKokSider/`.

The original directory has **29 distinct records**, including exact title, site ID, study, specialization, cohort, password-protection boolean and 0–10 rating. All 29 are in `data/diverse/kok-sites.json`. The source page constructs destination links as `https://folk.ntnu.no/${page.title.toLowerCase()}/`; the v2 URLs use the same rule. This is source-derived URL construction rather than proof each destination is currently online.

**26 descriptions** are supplemented from `https://perrur.folk.ntnu.no/script.js` where the titles match. These have `descriptionSource` pointing to the secondary origin and **never override original ratings, study, cohorts or site membership**. Perrur's list is different; the original TorMT directory determines membership.

The v2 directory offers search, study/specialization/cohort filtering and alphabetical, cohort and rating sorts, all against the local versioned catalog.

## Safety and regression

- Native v2 routes replace the previous embedded legacy views; the old NTNU site itself was not changed.
- Explicit source links remain for traceability.
- Catalog links are URL-validated and text is HTML-escaped in cards.
- Regression fixtures check original record count/IDs, metadata, sorting/filtering, the copied local PDFs/JPEG, and the absence of legacy iframes. Browser smoke tests exercise both native catalogs and Viewer integration.
- `LeseRavnen` remains a direct independent link to `https://tormt.github.io/LeseRavnen/`; no demo code or test-data collection was touched.
- Temporary GitHub Actions source-inspection and migration workflows were deleted after the one-time import. Content changes must go through a normal reviewed repository update.
