# FolkNettside V2 — ACTIVE HANDOFF / START HERE

**Updated:** 2026-10-24. **Repository:** `TorMT/FolkNettside-v2`, branch `main`.  
**Purpose:** Durable single entry point for ChatGPT/Codex/other coding agents when a conversation is truncated, ends, or times out. Read this file *first* and update it after every merged work unit. Do not claim asynchronous work has been performed.

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

## Active backlog (status is deliberately conservative)

| ID | Priority | Area / acceptance criterion | Status as of 2026-10-24 | External blocker |
| --- | --- | --- | --- | --- |
| B01 | P0 | **One working admin**: Supabase `folk_site_admins` / `folk_course_labels` installed, seed verified owner UUID, RLS negative/positive tests, real cross-browser edit | UI + SQL **candidate** only | Correct FolkNet Supabase project access and owner's verified Auth user needed |
| B02 | P0 | NTNU catalog: approved new files automatically appear, no private disclosure, test with real nested files / custom pages / case variants and index guard | Scheduled crawler + safe ITGK fallback **implemented**; edge cases remain | Public listing or independently refreshed public metadata required |
| B03 | P0 | Fully usable file viewers for real NTNU PDF/IPYNB/PY/Office/F3Z with deep folders, import fallback, retries, mobile | Many adapters + CI; CORS still restricts GitHub Pages | NTNUs CORS or a **separate approved V2 same-origin** staging |
| B04 | P0 | Identity: one account identity with Supabase login and optional explicit Google link. Verify token renewal, two accounts, no cross-user access | Client pieces only; live link unverified | Real OAuth config/consent, credentials, account |
| B05 | P0 | Private storage: MedisinTimer/Brewing/Dive log use safe encrypted two-device synchronization with conflict protection and recovery | Local/Drive encryption code; no atomic concurrent CAS | Real two devices and backend/versioning |
| B06 | P0 | Secure NTNU SiteUpdater: target semester/course, non-destructive indexes, files with/without index.json, safe rollbacks and real webedit acceptance | Scripts + tests; live acceptance missing | Mounted webedit and owner approval |
| B07 | P1 | Quiz PHP leaderboard: same-origin PHP installed separately, server score verification, rate limits, real tests | Disabled PHP candidate, no verified deployment | NTNU PHP staging or other secure same-origin backend |
| B08 | P1 | Study progress: quiz/video local data and optional Supabase cloud summary, RLS, multi-device tests | Local + SQL candidate | FolkNet DB integration |
| B09 | P1 | Munin **optimized GLB**, real skrog/thrusters, mobile direct preview with material/unit checks and fallback | Source F3Z + STEP verified; **no optimized GLB** | Actual mesh conversion from authorized source + performance tests |
| B10 | P1 | Autodesk Fusion local and optional Hub import + F3Z-to-neutral conversion and physical-properties report | Local scripts/edge scaffolding; real integration unverified | Real Fusion installation, APS consent/secrets |
| B11 | P1 | KISSsoft true user file parser comparison and sign/helix/planetary controls | Parser/educational 3D CI; real comparison needed | Owner's genuine files/references |
| B12 | P1 | Hydro/Structure/Gunnerus: real watertight hull, independent hydro/GZ/loads benchmarks and correct structural idealization | Strong numerical fixture tests; **no certified vessel validation** | Approved hull-only geometry, vessel mass/loading |
| B13 | P1 | CoolProp native tables, diagrams, fluid switching and mobile edge-case comparison against reference | WASM and core tests; wider real task matrix needed | Reference cases from legacy, review |
| B14 | P1 | Brewing/RAPT/matpris live integrations and secure API; calibrate fermentation against live SG history | UI and formulas, endpoints disabled or incomplete | Backend/API keys & authorized access |
| B15 | P1 | Diverses: validate dive coordinates, log, LAOS/Kok external links, Medisin reminder limits | Implemented UI, incomplete external validation | Live data/accounts |
| B16 | P2 | Portfolio/CV/LinkedIn: check real photos and references, no fabricated CV, optional *reviewed* update flow | Data-driven CV + 8 project entries | Owner review, LinkedIn permitted access |
| B17 | P2 | GA4: consent and page-view privacy, owner-only reports and live realtime check | Client configured; realtime unverified | Owner Analytics access |
| B18 | P2 | Whole-site accessibility, dark/high-contrast/reduced-motion, actual phone testing, perf/large files | Chrome responsive CI; physical devices unverified | Real devices optional |
| B19 | P2 | Production staging + rollback + penetration/basic auth checks, no V1 cutover | Deploy scripts and docs | Mounted NTNU staging and explicit release approval |
| B20 | P2 | Owner-facing CMS for project/gallery/sections/settings beyond course labels | Course-label editor only | B01 must be completed securely |

### Explicit non-goals until separate engineering scope

No representation that this project provides certified stability, exact shell/solid FEM, full diffraction/RAO solver, ISO-grade KISSsoft strength, native editable Fusion B-Rep, production medical decision support, or fully seamless cross-origin browser access. Keep scientific limitations visible.

## Current security/architecture facts

- Public static site: `https://tormt.github.io/FolkNettside-v2/`.
- NTNU original source: `https://tormt.folk.ntnu.no/`. **No V1 modifications.**
- FolkNet Supabase project reference: `glfuvfmppkjmarujjqwg` (public project identifier; **never put secret keys in Git**).
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

## Copy/paste kickoff for a NEW chat

> Continue FolkNettside V2 from the GitHub repository `TorMT/FolkNettside-v2`. Read `AGENTS.md` and `docs/ACTIVE_WORK_HANDOFF.md` **first**. Inspect live `main`, PRs and CI; choose the highest-priority incomplete unblocked backlog item. Perform fixes **one independent commit/PR at a time**, add tests, wait for green CI and merge. Update the handoff file with exact SHAs, results and outstanding blockers before ending. Keep NTNU V1 and its files unchanged. Never invent live integration success; mobile-first 320/390/768 required. No need to repeat earlier conversation.

## Work journal

| Date | Work unit | Commit / PR | CI and external acceptance |
| --- | --- | --- | --- |
| 2026-10-24 | Create durable handoff and backlog for context-independent continuation | this file's creating commit | documentation only; external blockers explicitly preserved |

> **Agent instruction:** Add a row after each completed PR and update the matching B-number. Incomplete commits/branches also belong in the journal so a new session can resume rather than restart.
