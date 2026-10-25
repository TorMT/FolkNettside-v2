# FolkNettside V2 — ACTIVE HANDOFF / START HERE

**Updated:** 2026-10-25. **Repository:** `TorMT/FolkNettside-v2`, branch `main`.  
**Purpose:** Durable single entry point for ChatGPT/Codex/other coding agents when a conversation is truncated, ends, or times out. **Tracking issue:** [#107](https://github.com/TorMT/FolkNettside-v2/issues/107). Read this file *first* and update it after every merged work unit. Do not claim asynchronous work has been performed.

## Request from owner

Continue finishing **all existing V2 capabilities**, incrementally. **One independently reviewable task and commit at a time**, with tests and GitHub persistence so that interrupted work can resume. The site must be **mobile-first**. NTNU remains the source of course files. User wants **one admin account** for content edits. The old NTNU V1 site is not to be changed. The user has permitted reuse of their own **Munin catamaran model** for a mobile CAD example, subject to artifact size/security and actual conversion tests.

## Resume protocol (must follow)

1. Read `AGENTS.md` and this handoff, then `docs/NEXT_STEPS.md`, `docs/PRODUCTION_PARITY_GAP_REGISTER.md`, `docs/V2_QUALITY_ROADMAP_2026-10-12.md`.
2. Query actual `main`, GitHub Actions, and open PRs **now**. Docs other than this one may predate later commits. Reconcile stale statuses.
3. Select the **first incomplete, unblocked** task below. Create a short branch, make an individual commit per concrete fix, run unit/browser tests, open a focused PR, wait for **green latest-head CI**, merge. Record the PR/commit and outcomes here; do not repeat completed work.
4. If time is short, **commit a tested or clearly marked partial change** on a branch and update this file describing the exact blocker. Never claim it was deployed if the PR is only open.
5. Preserve both independent sources of truth: (a) GitHub contains V2 app and approved public metadata; (b) NTNU holds original course files. Do not copy the entire semester archive to GitHub or delete/rewrite V1. Do not add secrets, personal medical records, raw tokens, protected material or passwords.
6. Distinguish **implemented**, **unit-tested**, **Chrome-tested**, **real NTNU-tested**, and **real-account/server-tested**. Never equate these.
7. Every PR must address mobile behavior at 320px, 390px, 768px (or explain why N/A), plus reduced motion, dark mode, keyboard/accessibility where relevant.

## Verified foundation as of 2026-10-24

- `main` deploy workflow succeeded after PR #105; GitHub Pages is the development preview.
- The V2 course catalog references 24 public NTNU courses and about 709 metadata entries as of the last read; **not** a guarantee that 709 URLs are accessible.
- PR #97: render course pages with directory slugs not NTNU course codes.
- PR #98: optional PHP quiz leaderboard code, disabled until separate backend accepted.
- PR #99: clickable breadcrumbs, group flat Øving files.
- PR #100: Supabase cosmetic course-name admin editor + **candidate, unapplied** SQL schema.
- PR #101: reviewed ITGK JSON fallback when HTML directory listing hides new files; ordinary public Apache listing remains primary for other approved folders.
- PR #102: previous/next file in same course section.
- PR #103: sandboxed read-only fallback when Pages JS viewer cannot fetch public NTNU code.
- PR #104: Munin original F3Z/STEP/drawing source links, local import, compact mobile CAD inspector.
- PR #105: major mobile route matrix at 320/390/768, medisin navigation cleanup fix, KISSsoft, crystal, tablet navbar, touch targets, original file link.
- PR #112: align public NTNU scanner and same-origin legacy course parser with existing V2 KISSsoft, CAD, media and structured-text viewer formats; no per-file `index.json` needed with approved Apache listing. CI green after rerun of unrelated ChromeDriver startup failure.
- PR #113: downloadable-file fallback for CORS-blocked public NTNU viewers, with local-only browser `blob:` preview, filename/type/size constraints, cleanup and real Chrome regression. CI green; not a CORS/server fix.
- PR #114: fix six original-URL-first viewer adapters to honor locally selected file data (Office/Fusion/archive/image/audio/video); extended Chrome test for actual DOCX local retry. CI green.
- PR #115: persistent local-file opener in NTNU viewer header even if image/PDF/video preview silently fails. Chrome test selects local PNG; CI green.
- PR #117: dispose/invalidate active course viewer on all SPA hash route changes, including native breadcrumbs and previous/next navigation; avoids leaked blob URLs, workers and keyboard callbacks. CI green.
- PR #118: require literal `beskyttet:false` at both semester and course levels in legacy fallback; read-only audit excludes unknown statuses. Full Node/Chrome/mobile CI green.
- PR #130: byte-bounded (4 MB) streaming UTF-8 fetch of same-origin public NTNU JSON indexes, regardless of missing/inaccurate Content-Length; abort oversized/malformed streams. Node regression and full Chrome/mobile CI green. Public NTNU root + S5 index fetched read-only; full individual-file/browser acceptance still open.
- PR #131: reused same 4 MB byte-limited reader for auto-generated `ntnu-autocatalog.json`; streamed overflows cancel and fall back to existing NTNU semester indexes. Latest-head Node/Chrome/mobile CI green.
- PR #132: read-only live NTNU catalog health audit no longer fetches semesters of unknown/string/publicness status; reuses 4 MB bounded streaming response. Dedicated isolated tests and latest-head CI green.
- PR #134: optional CLI to check representative, approved public NTNU asset URLs with HEAD-only, no file bytes/redirects and no printed filenames or URLs. Browser-CORS and real content rendering still unverified.
- PR #120: FolkNet owner-managed login UI removes public signup button and adds signed-in course admin link, with Node and full Chrome/mobile CI; Supabase Auth signup API must separately be restricted in the **correct** project. No backend provisioning.
- PR #121: Auth HTTP deadline (10 s), blocked redirects and stale-login protection; Node and full Chrome/mobile CI green.
- PR #126: **rebind to actual active FolkNettside project `aeuouzkiyddfjtjfdosp` in TorMT's Org** with matching publishable key and client pin, CLI ref, tests/docs; latest-head full Chrome/Node CI green. Four public RLS tables plus private storage and OAuth tables already provisioned (two migrations); `folk-core` deployed ACTIVE. **No registered Auth users or admins yet.**

## Active backlog (status is deliberately conservative)

| ID | Priority | Area / acceptance criterion | Status as of 2026-10-24 | External blocker |
| --- | --- | --- | --- | --- |
| B01 | P0 | **One working admin**: Supabase `folk_site_admins` / `folk_course_labels` installed, seed verified owner UUID, RLS negative/positive tests, real cross-browser edit | UI + SQL **candidate**; PRs #110, #120 and #121 harden editor, make owner-managed Settings sign-in and prevent hung/racing Auth calls. **Database + RLS now installed in TorMT's Org (`aeuouzkiyddfjtjfdosp`), but 0 Auth users and 0 admins; verified owner and real-user RLS test pending** | Only owner's verified Auth user and single-slot privileged admin seed remain; secure signup setting / two-browser acceptance must be checked |
| B02 | P0 | NTNU catalog: approved new files automatically appear, no private disclosure, test with real nested files / custom pages / case variants and index guard | Scheduled crawler + safe ITGK fallback implemented; **PR #112** covers KISSsoft/CAD/media filenames, and **PR #118** enforces fail-closed public flags in legacy fallback and health audit (CI green). **PR #130** bounds index HTTP reads by bytes before JSON parse, including split UTF-8 and oversized responses (CI green). **PR #131** applies the same bounded streaming reader to generated V2 auto-index files and preserves legacy fallback (latest-head full CI green). **PR #132** aligns read-only live health audit with explicit public semester flags and bounded reads (full CI green). Custom pages without approved metadata and real new-file acceptance remain | Public listing or independently refreshed public metadata required |
| B03 | P0 | Fully usable file viewers for real NTNU PDF/IPYNB/PY/Office/F3Z with deep folders, import fallback, retries, mobile | Many adapters + CI; **PRs #113–#115 and #117** support local downloaded copies, persistent header action and route-level cleanup (Python/DOCX/PNG and breadcrumb Chrome tests); **live CORS remains restricted**; **PR #134** adds a strictly opt-in, HEAD-only, redacted HTTP health sample across validated public NTNU files and nested directories (CI green; HEAD is not an interactive viewer test) | NTNUs CORS or a **separate approved V2 same-origin** staging |
| B04 | P0 | Identity: one account identity with Supabase login and optional explicit Google link. Verify token renewal, two accounts, no cross-user access | Replacement Supabase project active and folk-core deployed; user identity/OAuth linking still unverified | Real OAuth config/consent, credentials, account |
| B05 | P0 | Private storage: MedisinTimer/Brewing/Dive log use safe encrypted two-device synchronization with conflict protection and recovery | Replacement Supabase RLS user storage + private bucket installed; local/Drive encryption code present; no atomic concurrent CAS or two-device proof | Real two devices and backend/versioning |
| B06 | P0 | Secure NTNU SiteUpdater: target semester/course, non-destructive indexes, files with/without index.json, safe rollbacks and real webedit acceptance | Scripts + tests; live acceptance missing | Mounted webedit and owner approval |
| B07 | P1 | Quiz PHP leaderboard: same-origin PHP installed separately, server score verification, rate limits, real tests | **PR #106** adds real PHP HTTP integration CI; **PR #108** adds server-scored V1 random-subset rounds; backend still **disabled/uninstalled** | NTNU PHP staging or other secure same-origin backend |
| B08 | P1 | Study progress: quiz/video local data and optional Supabase cloud summary, RLS, multi-device tests | Local + SQL candidate, FolkNet DB active but optional learning-progress tables not migrated | Learning-progress schema and two-device acceptance |
| B09 | P1 | Munin optimized GLB, source-backed component groups and mobile direct preview | **Completed in PR #123**, merge `e2b4e4db`: actual 4.58 MB GLB, 130 parts, drawing scale/silhouette checked; hull/structure/T200/sensor/electrical groups; lazy Z-up preview, retry/cancel. 798 Node tests and latest-head full Chrome CI pass; screenshots reviewed at 320/390/768 and desktop | Physical iOS/Android not tested; ten overlapping structure parts explicitly marked unresolved subgroup; exact materials/thrust data not asserted |
| B10 | P1 | Autodesk Fusion local and optional Hub import + F3Z-to-neutral conversion and physical-properties report | Local scripts/edge scaffolding; real integration unverified | Real Fusion installation, APS consent/secrets |
| B11 | P1 | KISSsoft true user file parser comparison and sign/helix/planetary controls | Parser/educational 3D CI; real comparison needed | Owner's genuine files/references |
| B12 | P1 | Hydro/Structure/Gunnerus: real watertight hull, independent hydro/GZ/loads benchmarks and correct structural idealization | Strong numerical fixture tests; **no certified vessel validation** | Approved hull-only geometry, vessel mass/loading |
| B13 | P1 | CoolProp native tables, diagrams, fluid switching and mobile edge-case comparison against reference | WASM and core tests; wider real task matrix needed | Reference cases from legacy, review |
| B14 | P1 | Brewing/RAPT/matpris live integrations and secure API; calibrate fermentation against live SG history | UI and formulas, endpoints disabled or incomplete | Backend/API keys & authorized access |
| B15 | P1 | Diverses: validate dive coordinates, log, LAOS/Kok external links, Medisin reminder limits | Implemented UI, incomplete external validation | Live data/accounts |
| B16 | P2 | Portfolio/CV/LinkedIn: check real photos and references, no fabricated CV, optional *reviewed* update flow | Data-driven CV + 8 project entries | Owner review, LinkedIn permitted access |
| B17 | P2 | GA4: consent and page-view privacy, owner-only reports and live realtime check | Client configured; realtime unverified | Owner Analytics access |
| B18 | P2 | Whole-site accessibility, dark/high-contrast/reduced-motion, actual phone testing, perf/large files | **PRs #116, #119, #122, #124, #127 merged:** keyboard shell/skip link, inert offscreen mobile Engineering drawers, focus/ARIA/close behavior, CSS reduced-motion and forced-colors focus indicators; Settings high contrast/reduced motion now take real effect with dark accent swatch fixes; 10 light/dark × accent combinations browser-measured at 320/390/768; custom Theme Studio calculates WCAG text contrast, safely adjusts extreme gradients in preview/CSS, preserves source palette and reports eight verified contrast pairs at 320/390/768 (PR #124); CAD/Model Inspector now reflow on zoom-sized screens with visible keyboard component lists, escape/focus-managed mobile panels and wrapped long labels; Chrome 320/390/768 and 50-step CI green (#127). 24-route Chrome semantic survey at 390 and 768 gives **0 flagged controls/IDs/landmarks**, CI 49/49 green, 320/390/768 drawer/browser matrix pass. **Remaining:** physical iOS/Android VoiceOver/TalkBack, full WCAG/across-component/imported-theme contrast + zoom/device validation and large-file perf. See `docs/ACCESSIBILITY_AUDIT_2026-10-25.md` | Real devices optional |
| B19 | P2 | Production staging + rollback + penetration/basic auth checks, no V1 cutover | Deploy scripts and docs | Mounted NTNU staging and explicit release approval |
| B20 | P2 | Owner-facing CMS for project/gallery/sections/settings beyond course labels | Course-label editor only | B01 must be completed securely |

### Explicit non-goals until separate engineering scope

No representation that this project provides certified stability, exact shell/solid FEM, full diffraction/RAO solver, ISO-grade KISSsoft strength, native editable Fusion B-Rep, production medical decision support, or fully seamless cross-origin browser access. Keep scientific limitations visible.

## Current security/architecture facts

- Public static site: `https://tormt.github.io/FolkNettside-v2/`.
- NTNU original source: `https://tormt.folk.ntnu.no/`. **No V1 modifications.**
- **Active FolkNet Supabase:** `aeuouzkiyddfjtjfdosp` in TorMT's Org (Frankfurt). Previous project `glfuvfmppkjmarujjqwg` is superseded and must not be used by V2. Only the project's publishable frontend key may be committed; **never put service-role keys or secrets in Git**.
- `folk_core` (`folk-core` Edge Function) deployed active; real signed-in account session test still pending. Existing migrations `20261025173633` (admin/labels) and `20261025173751` (private storage/OAuth) are **already applied**. Do not reapply as new migrations.
- Other connected Supabase project may be LeseRavnen: **never accidentally migrate schemas or seed admin in the wrong project**.
- Backend files for B01: `server/supabase/20261024_folk_course_labels_candidate.sql` and `docs/FOLK_COURSE_ADMIN.md`.
- Config `data/service-endpoints.json` keeps unfinished live services disabled, including leaderboard, brewing and matpris.
- The copy of original Munin files may be used for an *explicitly reviewed* optimized example; see `src/engineering/cad-tool.js`. Do not redistribute entire other courses/NTNU archives.
- `AGENTS.md` freezes V1 production until at least 2027-01-01.

## Commands / evidence gates

- `npm test` — unit regressions.
- GitHub Actions `v2-pull-request-checks` runs Chrome smoke tests (including responsive route matrix at 320, 390 and 768px).
- `node scripts/audit_ntnu_catalog.mjs --live` — read-only metadata catalog health.
- `python3 -m unittest discover -s tests -p 'test_*.py'` for relevant Python tests.
- Before each merge, inspect **latest head SHA** and **latest-head passing CI**, not earlier green runs.
- After merge, verify Pages deployment and (where possible) public test route. Record separately if browser/service cannot be verified.

## Next executable work after PR #126

- **B09 completed:** [PR #123](https://github.com/TorMT/FolkNettside-v2/pull/123), real Munin GLB and source-backed grouping. Chrome CI run `40216733042` passed on head `0cc45286`; screenshots reviewed. No further task started by the B09 chat.
- **B01 NEXT (owner action required):** The **active** project is `aeuouzkiyddfjtjfdosp` (TorMT's Org), not the obsolete `glfuvfmppkjmarujjqwg`. Admin labels, private RLS tables and bucket **are already installed**; `folk-core` is deployed. No user/admin yet. In [Supabase Auth → Users](https://supabase.com/dashboard/project/aeuouzkiyddfjtjfdosp/auth/users), **create or invite and verify the intended owner account**, restrict public signup and configure the GitHub Pages Auth site/redirect URLs. Confirm its actual Auth UUID before privileged single-slot `folk_site_admins` seeding; never invent it or save passwords. Then test signed-in admin edits, denied non-admin writes and cross-browser persistence. Do not rerun migrations or modify LeseRavnen. Unsigned `folk-core` GET tested HTTP 401; real user JWT still untested.
- **B07:** The PHP endpoint and V1 `select` subset scoring are CI-tested but **still disabled**. Real PHP hosting/staging and server environment configuration are a separate gate.
- **B02/B03 (next unblocked):** Audit representative real NTNU URLs, browser CORS headers, nested content and new-file propagation. PR #112 adds supported filename types; PR #113 supports manually reopened local copies. Neither verifies actual NTNU file rendering in Pages. Do not fetch protected/student materials; keep the existing NTNU archive and V1 unchanged.

## Copy/paste kickoff for a NEW chat

> Continue FolkNettside V2 from the GitHub repository `TorMT/FolkNettside-v2`. Read `AGENTS.md` and `docs/ACTIVE_WORK_HANDOFF.md` **first**. Inspect live `main`, PRs and CI; choose the highest-priority incomplete unblocked backlog item. Perform fixes **one independent commit/PR at a time**, add tests, wait for green CI and merge. Update the handoff file with exact SHAs, results and outstanding blockers before ending. Keep NTNU V1 and its files unchanged. Never invent live integration success; mobile-first 320/390/768 required. No need to repeat earlier conversation.

## Work journal

| Date | Work unit | Commit / PR | CI and external acceptance |
| --- | --- | --- | --- |
| 2026-10-24 | Create durable handoff and backlog for context-independent continuation | this file's creating commit | documentation only; external blockers explicitly preserved |
| 2026-10-24 | Link this handoff from mandatory AGENTS.md | `55d6f2d` | documented, merged |
| 2026-10-24 | Permanent open tracking issue for context recovery | [#107](https://github.com/TorMT/FolkNettside-v2/issues/107) | issue active |
| 2026-10-24 | Isolated PHP HTTP tests, server recomputed scores, origin/storage/rate limits | [#106](https://github.com/TorMT/FolkNettside-v2/pull/106), `30d5bdf` | CI green, merged; live PHP disabled |
| 2026-10-24 | Allow leaderboard of real NTNU `select:N` quiz rounds with PHP revalidation | [#108](https://github.com/TorMT/FolkNettside-v2/pull/108), `5768ea9` | CI green, merged; PHP deployment still blocked |
| 2026-10-24 | Munin real STEP to GLB conversion candidate with isolated manual artifact workflow | [#109](https://github.com/TorMT/FolkNettside-v2/pull/109), `cdc3b827` | CI green, merged; **workflow not run on real source** |
| 2026-10-24 | Single-admin editor validation: per-field SQL limits, request timeout, confirmed delete, Settings entry | [#110](https://github.com/TorMT/FolkNettside-v2/pull/110), merge `adaf31ee0f1c2b0c71c1bde514746b5fbd3ee61d` | Latest-head CI success; Supabase installation **still blocked** |
| 2026-10-24 | B02: include previously skipped public KISSsoft, CAD, audio/video and text formats in hourly NTNU index and live legacy parser | [#112](https://github.com/TorMT/FolkNettside-v2/pull/112), source `dbe1a40`, merge `89edd9aacc2e859a8494a2ef432a90ef9346c160` | Python/JS tests pass; full CI **success** on attempt 2 (attempt 1 ChromeDriver startup infrastructure error); no NTNU originals touched |
| 2026-10-24 | B03: local-only retry for CORS-blocked public NTNU files in same viewer; preserve original URL and revoke blob after view | [#113](https://github.com/TorMT/FolkNettside-v2/pull/113), source `41ef1039`, merge `228b73eb14255367ff327e4fa097975410ecc9e5` | Node + browser simulation with locally selected `.py`, standard Chrome/mobile CI **success**. Real NTNU cross-origin fetch remains server-blocked |
| 2026-10-24 | B03: fix original-first binary/media adapters to read local object URL and retain original NTNU address; Fusion type by original filename | [#114](https://github.com/TorMT/FolkNettside-v2/pull/114), source `0ceeac66`, merge `b9ae778ce3927c136b5fbeb8999faafd146d118f` | Node + real Chrome DOCX local retry; latest-head full CI **success**; no NTNU files or V1 altered |
| 2026-10-25 | B03: show local downloaded-file opener in persistent header; silent native-image/PDF failures no longer hide fallback | [#115](https://github.com/TorMT/FolkNettside-v2/pull/115), source `8b25519f`, merge `52530083113e9bad1bf18b7992d6c77cd005a615` | Latest-head full CI **success**, PNG local-file Chrome regression + existing mobile 320/390/768; no V1 changes |
| 2026-10-25 | B03: dispose course viewer on native breadcrumb/next file navigation; invalidate async adapters and clean up browser resources | [#117](https://github.com/TorMT/FolkNettside-v2/pull/117), source `66c7103d`, merge `e677c880bee3f75349cc6ea0327f4050cbb16816` | Latest-head full CI **success**; native breadcrumb cleanup Chrome regression and mobile matrix. No NTNU/V1 edits |
| 2026-10-25 | B02: fail-closed legacy NTNU course + semester public-status validation and consistent read-only health metrics | [#118](https://github.com/TorMT/FolkNettside-v2/pull/118), source `8e9e9718` + fixtures `10d3a45c`, merge `555e981d1c77521faa9186a5ca45a1d21179f379` | First CI identified stale test fixtures; all fixed with explicit approved flags. Latest-head full Node/Chrome/mobile CI **success**; NTNU untouched |
| 2026-10-25 | B01: owner-managed login interface and direct course admin link; no public registration in UI | [#120](https://github.com/TorMT/FolkNettside-v2/pull/120), merge `f156da35e168cc821dedf01519cb8c1ac9ebf921` | Full CI **success** on final head; backend **not installed**: Supabase connector exposes only LeseRavnen, direct FolkNet project access permission denied; no DB writes |
| 2026-10-25 | B01/B04: bounded Supabase Auth requests, redirect denial and stale-login rejection | [#121](https://github.com/TorMT/FolkNettside-v2/pull/121), merge `2900d5cf011230d57f5f4605f895a47c83958ebf` | Latest-head Node and Chrome/mobile CI **success**, no real-account test due FolkNet connector authorization missing |

| 2026-10-25 | B18: keyboard and screen-reader semantics for shell navigation; close mobile More on Escape/outside focus/click/route | [#116](https://github.com/TorMT/FolkNettside-v2/pull/116), source `a66f6d7`, merge `1c0dceae9bc922bebf73eab9f6487dd3ab3fe668` | Full 49-step latest-head PR CI **success** including Chrome at 320, 390, 768. Physical-device/screen-reader audit remains |
| 2026-10-25 | B18: skip-to-content, accessible offcanvas Engineering drawers/focus return, prefers-reduced-motion and bounded 24-route semantic audit; label 4 missing controls | [#119](https://github.com/TorMT/FolkNettside-v2/pull/119), source `02a30af`, merge `38e5521b493efa1ecb00d8234c2c73404d780039` | Full latest-head CI [40214399727](https://github.com/TorMT/FolkNettside-v2/actions/runs/40214399727) **49/49 success**; 24-route heuristic Chrome audit zero at 390 and 768; independent 320/390/768 mobile drawer Chrome checks. Not physical phone/screen-reader WCAG certification |
| 2026-10-25 | B18: activate Settings high contrast/reduced motion, correct dark-mode accent swatch precedence, verify all 10 default mode/accent pairs at mobile/tablet widths | [#122](https://github.com/TorMT/FolkNettside-v2/pull/122), source `67310a50`, merge `1640542a04c1c9e758413331a75c8552b3371f34` | Latest-head full [CI run 40215966024](https://github.com/TorMT/FolkNettside-v2/actions/runs/40215966024) **49/49 success**. Chrome tested 320/390/768, 4.5:1 shared token text and 3:1 borders, motion persistence. Physical phones, full custom-theme/OS contrast, canvas animation remain open |

| 2026-10-25 | B02: byte-bounded streamed NTNU semester/root index downloads; UTF-8 split, oversized/no Content-Length and partial semester regressions | [#130](https://github.com/TorMT/FolkNettside-v2/pull/130), merge `a47b0660d66be142e6d11464c67ab316d5f94002` | Latest-head [CI 40219342911](https://github.com/TorMT/FolkNettside-v2/actions/runs/40219342911) SUCCESS. Public root + S5 metadata endpoints fetched read-only. No browser/live individual-file or NTNU V1 changes. |

| 2026-10-25 | B02: auto-generated public metadata also uses bounded reader, preserves validated legacy fallback on streaming overflow | [#131](https://github.com/TorMT/FolkNettside-v2/pull/131), merge `48975b0ceb4945502f58223fe46edda944b239eb` | Latest-head [CI 40219756956](https://github.com/TorMT/FolkNettside-v2/actions/runs/40219756956) SUCCESS (including Chrome/mobile matrix), no V1 or NTNU source changes. Live file content/viewer acceptance still outstanding. |

| 2026-10-25 | B02: fail-closed live metadata-audit requests (`beskyttet: false` only) and bounded response reads | [#132](https://github.com/TorMT/FolkNettside-v2/pull/132), merge `93c51a9ec39df9dd75862e8e2072639ecdd7d0e5` | Latest-head [CI 40220546623](https://github.com/TorMT/FolkNettside-v2/actions/runs/40220546623) SUCCESS including Chrome/mobile. Test-only HTTP fixtures; no live NTNU file download, RLS or V1 changes. |

| 2026-10-25 | B03: strictly opt-in public NTNU file header smoke with approved URL validation, diverse semester/deep-folder sampling, no GET and redacted status-only reports | [#134](https://github.com/TorMT/FolkNettside-v2/pull/134), merge `6579e44096be500c7c0b643d3313056d4b731598` | Latest-head [CI 40221214167](https://github.com/TorMT/FolkNettside-v2/actions/runs/40221214167) SUCCESS (Node + full browser/mobile). CLI live HEAD not executed from this chat; does not prove browser CORS or protected-resource denial. |

> **Agent instruction:** Add a row after each completed PR and update the matching B-number. Incomplete commits/branches also belong in the journal so a new session can resume rather than restart.

| 2026-10-25 | B09 isolated work: real Munin STEP → 15 mm GLB (4.58 MB, 130 parts); drawing dimensions/silhouette checked, lazy Z-up preview and mobile regression | `work/b09-munin-mobile-isolated` | Node tests and asset provenance check pass; latest-head Chrome CI/screenshots pending; no V1 modifications |

| 2026-10-25 | B09 finished: authorized actual Munin GLB, source-derived groups, Z-up lazy preview with error/retry/cancel and true mobile viewport checks | [#123](https://github.com/TorMT/FolkNettside-v2/pull/123), merge `e2b4e4db3eca785d7ba5da3bfbc7f8ef321cf8c5` | 798 Node tests; full latest-head CI success `40216733042`; actual WebGL screenshots reviewed at 320/390/768/1400. Physical devices untested. V1 unchanged. |
| 2026-10-25 | B18: Theme Studio custom bright/dark palettes now use readable text colors for preview and generated CSS; source palette/JSON preserved, automatic adjustments explained | [#124](https://github.com/TorMT/FolkNettside-v2/pull/124), source `e636215f`, merge `520fc612140469f3fd3baf73d69bf0fca2dc4fec` | Latest-head [CI run 40217316066](https://github.com/TorMT/FolkNettside-v2/actions/runs/40217316066) **50/50 success**, unit WCAG/adversarial palettes, real Chrome preview at 320/390/768; no live physical screen-reader, import-theme exhaustive contrast or V1 change |
| 2026-10-25 | B01: FolkNettside in TorMT's Org verified active at 0 USD/mo; frontend reconfigured to new project, runtime pin + public publishable key, two RLS migrations and bucket inspected, folk-core deployed active | [#126](https://github.com/TorMT/FolkNettside-v2/pull/126), merge `147b200fd8fa2ad17fc5101436c7b76d3deb6f36` | Full latest-head CI [40218388434](https://github.com/TorMT/FolkNettside-v2/actions/runs/40218388434) SUCCESS (mobile 320/390/768); 0 Auth users and 0 admins, live owner login not verifiable yet, Autodesk function unprovisioned; security advisors informational only |
| 2026-10-25 | B18: advanced Model Inspector component tree available with keyboard at narrow zoom widths; CAD compact panel Escape/focus/ARIA, long names, constrained wave controls/native file input at 320px | [#127](https://github.com/TorMT/FolkNettside-v2/pull/127), source `6564cbfe`, merge `9f227c0035f93c85f02e5f4d20c40d9e9f0b2afb` | Latest-head full [CI 40218979471](https://github.com/TorMT/FolkNettside-v2/actions/runs/40218979471) **50/50 passed**; real Chrome 320/390/768 scene, keyboard, long labels, overflow and drawer focus verified. Actual browser zoom 200/400%, VoiceOver/TalkBack, physical low-memory hardware and giant file performance remain open |
