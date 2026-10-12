# V2 release gates (no production cutover)

**Architecture update (12 October 2026):** There is NO semester-file
migration to GitHub. Existing NTNU `/semestre/` remains the authoritative
course archive. V2 code may be staged in `/v2-staging/` via
`Oppdater-FolkNettside.ps1`, with protected-file filtering and external
backups/rollback. A full offline backup is still necessary before a
**future V1 homepage/root replacement**, not for showing existing NTNU
semester files in a separate staging path. See
[Codex webedit handoff](CODEX_NTNU_RELEASE_HANDOFF.md).

Production FolkNettside must remain unchanged. GitHub is the intended source of truth for the eventual deployment; do not set up reverse sync or delete/move legacy files before a separate, approved migration pass.

**2026-10-10 migration evidence:** The public V1 navbar lists 24 legacy
course paths across semesters 1–5, and some public indexes name
`(beskyttet)` paths. The GitHub V1 repo does **not** contain this full
`semestre/` tree. The V2 manifest is still primarily example content.
The **staging** deployment does not require copying public semester files:
V2 consumes the original same-origin NTNU `index.json` indexes and keeps
those files on the existing server. `v2-staging` still needs real browser,
permission and API acceptance. A complete offline production backup and
rollback rehearsal are required **later**, before any change to the live
V1 homepage or PHP/private data. A UI card or green CI is insufficient.

See [full production migration instructions](PRODUCTION_MIGRATION_PLAYBOOK.md),
[parity blockers](PRODUCTION_PARITY_GAP_REGISTER.md) and
[secrets/API checklist](INTEGRATION_CONFIGURATION_REGISTER.md).
No production cutover is authorized by these documents.

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

**Google-sesjon (2026-10-10):** V2s browser-konfigurasjon er nå isolert fra
V1s PHP-login og scope-listen er begrenset til identitet og `drive.file`.
Uttesting på ekte Google-kontoer og enheter gjenstår; automatiserte tester
bekrefter bare frontend-logikken.


### Historisk samtykketrinn (erstattet 2026-10-10)

Den tidligere ukrypterte MedisinTimer-synken er deaktivert. Nåværende V2 benytter kun eksplisitt samtykke og AES-256-GCM-kryptert Drive-backup. Gamle ukrypterte filer slettes ikke automatisk. Se [PRIVATE_ACCOUNT_SYNC.md](PRIVATE_ACCOUNT_SYNC.md).

### MedisinTimer-kryptering og Drive-mappe – 2026-10-10

V2-kopien til Google Drive er nå ende-til-ende-kryptert i nettleseren med
AES-256-GCM og en PBKDF2-avledet passfrasenøkkel. Brukeren kan velge en
eksplisitt Google Drive-mappe-ID, inkludert en delt mappe ved riktige
Google-tillatelser. Passfrasen lagres ikke; hver ny nettlesersesjon må
låses opp. Den tidligere ukrypterte Drive-filen `folk-medisin-v2.json`
forblir urørt. **Lokale nettleserdata og manuelle JSON-eksporter er fortsatt
ukrypterte**, og fler-enhetskonflikter uten atomisk revisjonskontroll gjenstår.
Alle begrensninger og manuelt migreringsløp er i
[MEDISINTIMER_ENCRYPTED_DRIVE.md](MEDISINTIMER_ENCRYPTED_DRIVE.md).


**Videreføring:** Brygging råvarelager og personlig dykkelogg har nå separate konto- og formålsbundne krypterte Drive-kopier. Live OAuth/Drive, delt mappe og to-enhetskonflikter er fortsatt release gates. SiteUpdater-kode er videreutviklet uten å migrere faktiske kursfiler. Se [PRIVATE_ACCOUNT_SYNC.md](PRIVATE_ACCOUNT_SYNC.md).
