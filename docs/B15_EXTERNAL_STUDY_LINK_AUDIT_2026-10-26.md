# B15 — LAOS / AndreKokSider external-link audit (2026-10-26)

## Scope

Read-only inspection of the **29 public student-site URLs** already captured in `data/diverse/kok-sites.json`, plus the original LAOS JSON index at `https://tormt.folk.ntnu.no/diverse/LAOS/filer/index.json`. The source catalogue is **unchanged**. External pages were visited through a public content-fetch service without any NTNU account or credentials. For initial `folk.ntnu.no/<username>/` nonresponses, a second attempt used `https://<username>.folk.ntnu.no/`. Automated requests may experience access restrictions; a network error is **not** proof of deleted content.

## Results on 26 October 2026

| Observation | Number | Entries |
| --- | ---: | --- |
| Some HTTP page content returned at the original URL or direct subdomain | **25** | Includes Danieabr, Vegargje, Gavinmk via direct subdomain after first timeout |
| HTTP 410 returned on original and direct-subdomain attempt | **3** | Erlesorl, Jakobra, Aleksaci |
| Indeterminate: timeout at original + empty-content response at direct subdomain | **1** | Pauljg |
| Total source-backed student sites | **29** | No records added, removed or rewritten |

The 25 returned pages are **not all certified as functional course archives**: for example, Madshart returned a “Locked Page” landing and Mayate a page titled “Papaya error”. A successful fetch confirms a site responded but does not imply its entire catalogue or links work. HTTP 410 was actually observed twice for the three named sites, but pages can migrate or return site-specific denial statuses; those links remain clickable with a dated caution. Pauljg remains explicitly **inconclusive**, not labelled dead.

The original LAOS index responded to the public fetch. All three *local V2 mirrored* LAOS PDFs and their welcome JPEG are independently checked in CI with recorded SHA-256 digests in `tests/laos-source-data.test.mjs`. **Individual live upstream PDFs were not re-downloaded or separately health-checked.** A working JSON index is not a guarantee of availability of every upstream PDF.

## Implemented website behavior

- Store a **separate, versioned observation file** `data/diverse/kok-link-audit-2026-10-26.json`, referencing the original 29 URLs with observations `responded`, `http_410` or `inconclusive`. It is not a replacement for `kok-sites.json`.
- The native AndreKokSider page shows a dated summary and a short warning for the three HTTP 410 observations and the inconclusive Pauljg entry. All original source URLs continue to be offered; no link is auto-redirected, hidden or claimed permanently dead.
- Warning data is validated against the current **published** URL list. A missing, mismatched or invalid JSON document is ignored without breaking the directory, and locally imported catalogue previews do not inherit warnings meant for unrelated sites. An older but structurally valid observation remains visible **with its original date** rather than being presented as a current or continuously verified result.
- No client-side cross-origin HEAD/GET scanner is used: CORS, bot rules and NTNU redirect policies would create false broken-link reports. Regular CI is deterministic/offline with fixture and Chrome UI checks, **not** dependent on third-party uptime.

## Manual refresh procedure

1. On a future date, visit each existing source URL with a permitted, read-only public HTTP checker. For timeouts, also inspect the direct NTNU subdomain, but do not treat its failure as a permanent deletion.
2. Record actual date, HTTP status vs. timed-out/blocked/empty vs. responding (and note pages that require a login or display an error). **No credentials** should be included in reports.
3. Create a *new dated* `kok-link-audit-YYYY-MM-DD.json` after human review; update only the optional audit file path in `src/diverse/study-catalog-pages.js`. Avoid silently overwriting historical evidence. Never change source URLs, ratings, cohorts or authors in `kok-sites.json` just because a scan failed.
4. Run `node --test tests/kok-link-audit.test.mjs` and the Chrome study-catalog smoke + full PR CI, then merge only on green latest-head CI.

## Remaining B15 acceptance

Physical-browser access to the individual NTNU student content, full upstream LAOS PDF check, and any password-protected areas **not tested**. Historical URL availability can change after 2026-10-26. No V1, course resources, source catalogues, private drive files or credentials were changed.
