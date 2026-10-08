# V2 release gates (no production cutover)

Production FolkNettside must remain unchanged. GitHub is the intended source of truth for the eventual deployment; do not set up reverse sync or delete/move legacy files before a separate, approved migration pass.

## Required before public V2 release

- [ ] Check each listed legacy feature against V2 in a real browser, including mobile and failure states; keep the old link while parity is incomplete.
- [ ] Brewing: replace remaining legacy globals/scripts with maintained modules; validate hydrometer endpoints, recipes, raw-material view and external API configuration with secret-free tests. Never commit tokens, API keys or credentials.
- [ ] Viewers: verify imports from nested folders, large files, unsupported formats and malformed archives. Render filenames as text, enforce URL/path boundaries, and do not execute uploaded scripts on open. Verify code, notebook, PDF, Office, model and TeX adapters separately.
- [ ] SiteUpdater: exercise full rebuild, targeted semester/course updates, cancellation, nonexistent selections, nested folders, symlinks, large resource metadata-only scans, and CI manifest checks. The Windows launcher is `Run SiteUpdater.cmd`; CLI remains supported.
- [ ] Analytics: reuse the existing site's measurement ID only after verifying ownership and consent requirements. Inject public measurement ID from deploy config; restrict dashboard/report access to the owner, not by hiding a public HTML link. Do not ship service-account credentials or a private dashboard client-side.
- [ ] Portfolio: review general CV text, contact channels, LinkedIn URL and About Me copy with the owner before publication. Do not invent education, experience, credentials or personal contact details.
- [ ] Google session: test signed-out and multi-device workflows for Brewing, Dive Log and MedisinTimer. Explicitly assess sensitive MedisinTimer Drive data, storage access and cross-device conflict handling.
- [ ] Validate Core Tools, CoolProp numerical reference tables and Engineering numerical tests against pinned fixtures.
- [ ] Add/verify security headers, least-privilege Google scopes, secret scanning, dependency pinning, CI checks, accessibility, mobile navigation, broken-link tests and a rollback route.
- [ ] Publish repository/source and contribution instructions including a visibly labelled link to the *old* GitHub repository.

## Later cutover with local Codex

1. Snapshot and inventory all old files; keep original backups and provenance.
2. Group migration into public course resources, portfolio, tools, data, and private configuration.
3. Resolve naming collisions and relative paths before moving anything.
4. Make GitHub -> deployment the only supported direction and preview on a staging target.
5. Compare new and old outputs and run automated smoke tests.
6. Switch production only after explicit go/no-go review; retain rollback.
