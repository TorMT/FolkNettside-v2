# V2 pre-release audit and blockers — 2026-10-09

**Absolute deployment constraint:** Leave `TorMT/FolkNettside`, the NTNU
production tree, and the currently-used Engineering Portfolio URL **unchanged**.
That portfolio URL has been used in active job applications. No production
rewrite, DNS change, redirect, route replacement or access-policy change is
authorized by this audit. The old V1 roadmap explicitly freezes that entry
point through 2027-01-01. All work belongs to the V2 preview branch only.

This document distinguishes **automated test pass**, **source inspection**,
**real-browser check** and **production service verification**. A passing unit
test never proves feature parity against a live proprietary provider.

## Completed in the current audit branch (pending CI confirmation)

- CV, About and Contact remain versioned in `data/cv.json` and linked from
  desktop navigation. Added mobile More menu links for About, CV, Contact and
  Settings, while retaining mobile search.
- Reworked the mobile bottom bar for six discoverable destinations; tested
  full mobile profile pages and horizontal scrolling at a narrow viewport.
- Added a static resource security guard for protected / private course folders
  and credential-like files in the public manifest and source tree.
- Replaced unqualified KISSsoft "unsupported" for valid Z012 external pairs
  with an approximate helical 2D / 3D model, ideal tooth-count ratio and
  pitch-center check. Existing Z014 planetary concept gets twisted
  (visually helical) teeth. Neither is exact involute CAD.
- Added model wave display behavior: anchored (unchanged model pose) or a
  simplified vertical follow mode tracking the regular-wave elevation at the
  model origin. Hydrostatics remain still-water and **this is not a computed
  RAO, wave-loading or moored-vessel response**.
- Added a mesh-derived underwater sectional-area curve (SAC) and CSV export to
  Hydro. It is gated by the same hull mesh preflight, has triangle/station
  limits, and is numerically tested against an analytical barge.

## Static-only remediation completed after the initial audit

- Introduced **Tools / Encrypted resources** to produce an AES-GCM encrypted
  `.vault.json` archive entirely in the browser without uploading the source
  or passphrase. Courses now detects encrypted files and decrypts only in the
  visitor's browser; PBKDF2 work factor and authenticated envelope checks have
  Node and Chrome roundtrip/wrong-password tests. This is *offline passphrase
  encryption*, not individual account access control. See
  `docs/STATIC_DEPLOYMENT_GUIDE.md`.
- The old browser-readable password-hash scheme is **not reused**. Original
  unencrypted private files remain excluded by the Pages publication guard.
  The old site stays untouched. Server-enforced login and access revocation
  cannot be supplied by plain GitHub Pages.
- V2 Google session now looks for optional `data/google-auth.json` containing
  a **public OAuth browser client ID**, rather than requiring PHP on GitHub
  Pages. A template is in `data/google-auth.example.json`; real cloud origin
  authorization and cross-device consent testing remain open.
- LaTeX viewer now recognizes display, inline, equation/align/gather and
  provides a limited native rendered math fallback when KaTeX CDN is blocked,
  plus a source toggle. Native `<script>` or TeX HTML is never evaluated.
- The 2D FEM structure reference has an optional WebGL **3D conceptual beam**
  with mouse/touch orbit, right-drag pan, wheel/pinch zoom, reset and an
  explicit 2D diagram switch. FEM remains a 2D beam calculation.
- Both LaTeX and interactive beam controls have dedicated unit/browser tests.
  Mobile layout CSS and visible labels have been updated.

## Release blockers (must be resolved or deliberately deferred with V1 link)

| Priority | Area | What remains / acceptance gate |
|---|---|---|
| P0 | **Old Engineering Portfolio URL** | Freeze and test exact live URL before/after all eventual migration steps; no redirect or cutover now |
| P0 | **Private/protected course folders** | Original plaintext private resources must stay **outside** Pages. Static client-side encryption is available for deliberately shareable archives, but does not enforce per-user rights. For genuine revocable private access use an external authenticated service; otherwise defer that feature and retain V1 without making a false parity claim |
| P0 | **Full course content migration** | SiteUpdater still indexes example fixtures by default, not all genuine legacy course resources. Snapshot original tree, classify public/private, import safe public files, preserve exact paths and provenance, check nested folders, no accidental publication of protected content |
| P0 | **Brewing API and data** | Raw-material V2 inventory is local, not migrated live warehouse stock. Legacy recipe, hydrometer, RAPT and server-side PHP endpoints need authorized backend, secrets in server environment, authenticated multi-device test and parity comparison |
| P0 | **Google sign-in and Drive data** | Test from deployed GitHub Pages origins, multiple devices and distinct accounts; resolve OAuth client/origin configuration, permissions, refresh/logout, MedisinTimer sensitive-data storage/security and conflict handling |
| P1 | **Mobile end-to-end QA** | Automated Chrome tests cover routes/viewers and shell at representative widths. Add real-device touch, landscape, onscreen keyboard, drawer, resize, file picker, download, Google OAuth popup and intermittent connection tests |
| P1 | **Engineering SAC / Hydro** | Analytic mesh fixtures do not certify a real vessel; validate loaded real closed hull at several drafts, watertightness, hollow/tunnel sections, external hydro particular references, numerical convergence and high-mesh performance. Dedicated SAC integration must remain labeled exploratory |
| P1 | **Other engineering modes** | FEM remains a 2D beam/frame prototype; Resistance is ITTC friction baseline; Propulsion is ideal actuator-disk/force work; external OpenFOAM and full CFD/total resistance are not migrated |
| P1 | **Wave visualization** | Anchored vs illustrative vertical follow now selectable; real heave/pitch/roll RAOs, hydrodynamic coupling, moorings and incident-wave response validation are not implemented. Do not label follow as physically computed motion |
| P1 | **KISSsoft interoperability** | Conceptual Z014 and external-pair Z012 preview, not precise involute surfaces or strength solver; real W10/KSYS data mappings and other modules need source fixtures. Validate tooth profiles, helix hands, gearing, shaft and bearing geometries against actual exported STL/STEP before claiming CAD parity |
| P1 | **CAD import** | Native F3D/F3Z (APS conversion), STEP/IGES and proprietary CAD still require authorized conversion service and lifecycle tests; never execute or trust arbitrary uploads |
| P1 | **CV content** | Review general CV wording, actual PDF link, company roles, contact email/phone and LinkedIn handle with the owner; ensure details are intended for public indexing. LinkedIn update mirroring remains manual and reviewed |
| P1 | **SiteUpdater reliability** | Interactive Windows launcher currently points to fixture content by default. Confirm real source root, support dry-run, preserve unrelated semesters, block protected files, verify Windows paths, symlinks and rollback |
| P1 | **Analytics privacy** | The old public GA4 measurement ID was reused. Verify property ownership, private dashboard access, consent default and revocation behavior, and absence of tracking before opt-in |
| P2 | **UI/UX and accessibility** | Audit keyboard focus, mobile More state, data tables, screen readers, text wrapping, contrast and responsive layouts across all registered tools. Run real-device checks |
| P2 | **Documentation and release automation** | Resolve outstanding migration matrix prototypes, dead links, required security headers, asset size/performance budgets, branch protections, pinned dependencies, versioned backups and rollback; authorize a separate preview deploy only after go/no-go |

## Password/authorization design — no fake browser security

Never put a password (or password hash used as a verifier), unlock flag or
sensitive document in client HTML/JS or static assets. Hashes visible to the
browser invite offline brute-force attacks. CSS-hidden links also remain
downloadable by direct URL. Genuine protection requires that **GET of the
protected bytes is authorized on the server** before anything is returned.
For a GitHub Pages-only site, private files must not be deployed there at
all; instead, expose authenticated HTTPS links to a separate access-controlled
service. Public courses, ordinary tools and the Engineering Portfolio remain
freely browsable without mandatory sign-in.

## Evidence and limitations

- Migration and tool parity evidence: `docs/MIGRATION_MATRIX.md`,
  `docs/TOOL_PARITY.md`, `docs/VIEWER_PARITY_AND_WAVES.md`
- Release contract: `docs/V2_RELEASE_GATES.md`
- PR CI: JavaScript syntax, `npm test`, public-file audit,
  real Chrome browser routing, KISSsoft, Hydro, wave, viewers, CoolProp.
- **Not yet demonstrated here:** full live old-vs-new comparison of every
  migrated feature, OAuth/Drive cross-device, Brewing production backend,
  proprietary KISSsoft/CAD conversions or physical mobile-device matrix.

**NO production deployment is part of this audit.**
