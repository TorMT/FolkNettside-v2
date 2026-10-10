# Agent guidelines for FolkNettside V2

These rules apply to coding agents operating inside this repository, including
local Codex on a workstation with the NTNU `webedit` share mounted.

## Production and privacy invariants

- **Do not edit V1 production or the existing Engineering Portfolio.** The
  original website is frozen until at least **2027-01-01** and the owner
  separately approves an exact production cutover.
- The NTNU webedit directory, any backups, private folders, password files,
  student material and API credentials are **outside this Git repository**.
  Do not add them to Git, a PR, an issue, an agent transcript, or GitHub Pages.
- Do not use delete-capable sync commands (especially `robocopy /MIR`,
  `robocopy /PURGE`, `rsync --delete`) against V1, backups or NTNU staging.
  No `git clean -fdx` against user course directories.
- Do not copy course files to `examples/`, `src/`, or a Pages build. Even
  if the V1 website linked a file publicly, that does **not** prove reuse
  rights or that its HTTP access was authenticated.
- Source paths and destination paths must be inspected and matched to an
  allowlist before copying any bytes. `UNKNOWN` classification stays out
  of public packages; treat directories marked `beskyttet`, `private`,
  etc. as private pending explicit access-control verification.
- The previous client-side V1 password prompt/hash is **not** an access
  control mechanism. Never replicate it in V2.
- For casual password barriers to a **whole folder**, use Apache Basic
  authentication with a non-public `htpasswd` database (or NTNU LDAP)
  on the server, **not** a client-side JavaScript password check.
  `deploy/ntnu/shared-password-folder.htaccess.example` is uninstalled;
  verify non-public credential storage, NTNU Apache support and unauthenticated
  direct-URL denial first. Do not put any password/hash in source code.
- Never print or commit credentials, OAuth refresh tokens, `.env` content,
  private medical data, or server debugging output containing such data.
- Server-side LDAP/htpasswd protection needs a dedicated NTNU test directory
  and a verified direct unauthenticated HTTP response of 401/403 *before*
  placing sensitive real data there. Do not modify existing V1 `.htaccess`.

## Workflow for local migration work

Read [docs/LOCAL_CODEX_FOLK_MIGRATION.md](docs/LOCAL_CODEX_FOLK_MIGRATION.md)
and [docs/NTNU_FOLK_HOSTING.md](docs/NTNU_FOLK_HOSTING.md) first.

1. **Read-only discovery:** Identify and validate local V1 source, actual
   NTNU `semestre/` tree, webedit root, V2 clone, existing staging target.
   Produce a file/feature inventory with an explicit `UNKNOWN` status.
2. **Backup gate:** Make a dated offline, private, non-destructive copy of
   the entire live V1 site, its Git history, and service data where available.
   Verify restored samples and hashes. Never use Git alone as the course backup.
3. **Planning:** Map old semester/course slugs to reviewed V2 course codes,
   record legacy URLs, permissions, type, dependency, intended new URL.
   Review rather than guess ambiguous course codes.
4. **Staging:** Prepare an external, local, **public-approved-only**
   `site-content/semesters/` source and manifest. Use
   `scripts/build_ntnu_staging.py` offline to make a candidate. Private
   resources use an entirely separate, manually approved server-protected
   directory; do not place them in the candidate.
5. **Testing:** Verify every old public file is mapped, hash-compatible and
   opens in V2's correct viewer; cover backend PHP, mobile, redirects, nested
   file paths, video, quiz and authentication. Run V2 CI tests.
6. **Review:** Report what changed and what remains blocked. **Do not**
   upload anything to NTNU production, change redirects, replace old files
   or retire V1 without the owner's explicit deployment approval.

## Engineering constraints

- Keep static V2 preview functional without NTNU or PHP. The public
  `data/service-endpoints.json` defaults to disabled services.
- Never point V2 staging's PHP calls implicitly at root-relative V1
  `/includes/`; configure and test a distinct V2 subdirectory endpoint.
- SiteUpdater must preserve an already-reviewed source and fail closed if
  it goes missing. Test large/nested directory names and collision handling.
- Treat all file metadata as untrusted. Escape HTML; validate URLs and paths.
- Use targeted PRs, unit and browser regression tests, green CI, and report
  remaining limitations. A passing unit test is not proof of live NTNU or
  third-party service support.
