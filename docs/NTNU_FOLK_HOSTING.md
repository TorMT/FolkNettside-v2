# NTNU folk.ntnu.no hosting – validated constraints and V2 staging architecture

**Reviewed:** 12 October 2026. **Status:** NTNU same-origin course index reader and code-only sync added in V2; candidate package still LOCAL only. Nothing has been deployed to NTNU and V1 stays untouched. The earliest previously agreed production cutover is **1 January 2027**, subject to separate owner approval, complete backups, privacy/reuse rights and end-to-end parity.

## Official NTNU documentation: what is and is not supported

1. [Lag nettside på folk.ntnu.no](https://i.ntnu.no/wiki/-/wiki/Norsk/Lag+nettside+på+folk-ntnu-no): NTNU personal web pages are published by placing files on the webedit drive `//webedit.ntnu.no/<username>` (also Q: on NTNU computers), or through SFTP/SCP to `/web/folk/<username>/`. They are publicly readable by default. The platform documentation refers to PHP. File/directory permissions may be repaired overnight after errors.
2. [Passordbeskytte deler av nettside](https://i.ntnu.no/wiki/-/wiki/Norsk/Passordbeskytte+deler+av+nettside): **Apache `.htaccess` directory access control is supported**, including NTNU LDAP (`AuthType Basic`, `AuthBasicProvider ldap`, `Require ldap-user <specific username>`) or an `htpasswd` password file. The file `.htaccess` itself must be world-readable so Apache can inspect it before switching user identity. A directory that merely has Unix owner-only read permission can STILL be served over HTTP because the server runs as that owner. Therefore `chmod 700` **alone does not protect** student material.
3. [Filrettigheter](https://i.ntnu.no/wiki/-/wiki/Norsk/Filrettigheter) documents the webedit permissions model and its broad web-readability.
4. NTNU's article specifically states support for **advanced access control configuration is not provided** by the IT helpdesk; this requires an operator test.

**Not established from official online documentation:** exact disk/user storage quota, maximum upload size, PHP version/extensions or whether `getenv()` is populated for PHP web requests, server-side persistent file/database access, outbound HTTPS/cURL/API restrictions, memory/time limits, or allowed scheduling/cron. Do not invent these values. The publicly observable V1 PHP endpoints suggest PHP has been used, but **are not a substitute for a controlled capability test** in the staging folder. If credentials cannot be exposed to PHP securely, use a remote authorized backend instead.

## Architecture decision for now

| Location | Role | Security expectation |
|---|---|---|
| `TorMT/FolkNettside-v2` GitHub `main` | Code, documented API contracts, client-side regression fixtures | **No NTNU course archive, private material or secrets** |
| `https://tormt.github.io/FolkNettside-v2/` | CI-tested public preview | Static. No PHP, LDAP or truly protected files. All published source bytes readable. |
| Owner's **local** `.deploy-ntnu-staging/` | Separate V2 webedit code candidate | Default is code-only, with NO course files copied from NTNU or GitHub. An older optional reviewed-manifest import workflow remains separate. NOT auto-uploaded. |
| Future `https://tormt.folk.ntnu.no/v2-staging/` | Manual staging when the user decides | Must not overlap original `index.html`, `semestre/`, `includes/` or existing Engineering Portfolio paths. |
| Future restricted NTNU folder (distinct from public V2 package) | Actual private course files | Apache LDAP or `htpasswd` server-side checks before **every HTTP download**; verified 401 without credentials and success only for allowed account(s). |
| Future `includes/matpris/api.php` **inside V2 staging subdirectory** | Opt-in, same-origin PHP adapter | Credentials set only via protected server configuration or environment. Not assumed present or working. |

**Decision 12.10.2026:** No migration of five semesters into GitHub. Existing `/semestre/` resources remain on NTNU; V2 reads the original public per-semester indexes on the same host. Follow [code-only Git → NTNU webedit publishing](NTNU_CODE_ONLY_DEPLOY.md) for the safe update path. For now this is **NTNU-first architecture conditional on live checks**, not a commitment to move production. If NTNU cannot execute the required PHP/cURL/secret isolation or a PHP backend with restricted data, then keep the frontend deployment independent and move API functions to an authorized external backend. GitHub Pages remains a preview.

## Build a local candidate (without private course material)

From the V2 checkout:

```bash
python scripts/update_site.py --check
npm test
python scripts/build_ntnu_staging.py --version "$(git rev-parse HEAD)"
```

The result appears under `.deploy-ntnu-staging/`. It is **not** uploaded by GitHub Actions, contains no `.htpasswd`, private course archive or server keys, and Matpris is disabled by default in `data/service-endpoints.json`.

### After public course content has been separately reviewed

A prepared, private-to-you local folder **outside GitHub** must have this shape:

```text
<reviewed-public-root>/
  site-content/
    semesters/
      3/
        TEP4100/
          Forelesninger/
            Lecture.pdf
          ...
```

A separate reviewed manifest (`reviewed-content-manifest.json`) lists **only files explicitly approved for unrestricted public sharing** using paths such as `./site-content/semesters/3/TEP4100/Forelesninger/Lecture.pdf`; source must be `site-content/semesters`. Use it as follows:

```bash
python scripts/build_ntnu_staging.py --version "$(git rev-parse HEAD)" \
  --manifest "/path/to/reviewed-content-manifest.json" \
  --approved-root "/path/to/reviewed-public-root"
```

The builder copies exactly the allowed local files, preserves the original relative paths, rejects private/protected/secret-like names, unsupported assets, path escapes, symlinks, missing files, and unmarked output folders, and writes a complete matched manifest into the candidate. All other local files are ignored; the original NTNU production tree is never read or modified.

**Additional local Codex gate:** Run `scripts/verify_ntnu_public_assets.py`
with the reviewed manifest, approved local root and staged build root.
Save its SHA-256 report **outside Git** and refuse to deploy while it reports
missing/modified files. Read the [local Codex handoff](LOCAL_CODEX_FOLK_MIGRATION.md)
for the complete safe discovery, backup, source-mapping and acceptance flow.

**Important:** File-name/extension checks are not proof of ownership or permission, nor do they scan document contents for secrets. Review every source file and externally linked URL before approving. At production cutover remove temporary `examples/` fixtures from the final public webroot after confirming no code depends on them; the preview builder currently includes public examples for browser tests.

## Optional PHP adapter – Matpris

Only if approved and after PHP capability is confirmed:

```bash
python scripts/build_ntnu_staging.py --version "$(git rev-parse HEAD)" --enable-matpris
```

This **packages** `server/matpris.php` at `includes/matpris/api.php` **within the V2 staging folder** and updates **public, non-secret** `data/service-endpoints.json` to `{"matpris":{"enabled":true,"endpoint":"./includes/matpris/api.php"}}`.

The native V2 Matpris page reads that configuration **before it ever requests an API**. With no opt-in or when the config is missing, it displays «not available» and never silently requests V1 `/includes/matpris/api.php`. The relative `./includes` path stays inside `/v2-staging/`, preventing accidental calls into the existing production backend. **Enabling the adapter does NOT provide a secret**: the actual PHP process needs `KASSALAPP_API_KEY` in a secure server environment, outbound HTTPS/cURL, suitable PHP version/extensions, rate limits and documented privacy treatment; otherwise it returns a controlled 503.

For all other Brewing/RAPT, leaderboard and APS PHP API paths: implement and test their **own** V2 adapters and contracts. **Never** blindly copy V1's 14 PHP files or credentials into the staging build and never make `/includes/` requests to the V1 origin by accident.

## Simple shared password for a full course folder

For the intended **low-friction V1-like password prompt**, the easiest
reasonable solution on NTNU is Apache Basic authentication backed by an
`htpasswd` credential file. This is simpler for visitors than Google OAuth
or individual file encryption and — unlike the old V1 JavaScript prompt —
**blocks direct URLs to PDFs, ZIPs and nested files too**.

Use the uninstalled template
[`deploy/ntnu/shared-password-folder.htaccess.example`](../deploy/ntnu/shared-password-folder.htaccess.example)
for a single shared visitor account or a small set of approved accounts:

```apache
AuthName "FolkNettside protected folder"
AuthType Basic
AuthBasicProvider file
AuthUserFile "/VERIFIED/NONPUBLIC/ABSOLUTE/PATH/folk-v2-users.htpasswd"
Require valid-user
```

The `htpasswd` database contains **one-way password hashes, not plaintext**
but must nevertheless remain outside any HTTP-served directory, outside
GitHub, and readable by Apache. Verify whether NTNU permits a secure
non-public directory and the `htpasswd` utility/approved hash format on
the account before enabling it. Use a **new unique passphrase**; do not
reuse a password previously written in a chat or used elsewhere.
The owner supplies it directly to the local setup tool, not the agent,
GitHub Actions or the V2 source. Never hardcode it in HTML or JavaScript.

The protection is inherited by nested directories *unless overridden by
other Apache rules*. Test a **non-sensitive** nested PDF/direct URL while
logged out and while signed in before storing files. A single shared
password has obvious limits: it can be forwarded, there is no per-person
revocation or audit, and a browser may cache authenticated content.
This is acceptable as a casual barrier for low-risk material, **not**
a suitable authorization system for medical data, personal data,
licensed materials requiring individual access or secrets.

Apache/NTNU LDAP (the adjacent template) is still preferable when each
reader should use their own NTNU credentials. The two templates are
**alternatives**, not meant to be pasted together. None is auto-installed.

## Server-protected course folders: documented Apache method

The repo includes [`deploy/ntnu/protected-folder.htaccess.example`](../deploy/ntnu/protected-folder.htaccess.example) as an **uninstalled template only**, based on the NTNU documentation. For a single approved NTNU account, the essential restrictions are:

```apache
AuthName "FolkNettside private resources"
AuthType Basic
AuthBasicProvider ldap
Require ldap-user REPLACE_WITH_AUTHORIZED_NTNU_USERNAME
```

Do not use `Require valid-user` for private personal material: according to NTNU it would admit **any NTNU user**. An alternative is a server-side `htpasswd` store, with the password file protected from HTTP access and readable by the Apache authentication module. NTNU documents how to create it, but **we have not tested local permissions or the path on this user's account**.

After the user creates a dedicated staging-only protected folder, start with a **non-sensitive sentinel file**:

1. Deploy the tested `.htaccess` with `chmod a+r .htaccess` (NTNU's explicit requirement).
2. In an incognito browser **without credentials**, request the full sentinel URL. It must return **401 or 403**; if it returns 200, stop immediately. Do not test with real private files yet.
3. Sign in with the explicitly allowed NTNU account. Confirm the test file is accessible; check a second **unauthorized** NTNU user cannot get it.
4. Test a nested folder, a direct guessed URL, query variants, cache-control and logout behavior; direct HTTP requests must be denied independently of the V2 JavaScript UI.
5. Only after tests and a backup: import separately reviewed restricted files into that protected directory, **not** into V2 public `site-content` or GitHub.

Server-provided NTNU Basic/LDAP authentication is separate from Google OAuth; Google sign-in to V2 **does not grant** NTNU file access. If seamless account sharing is required later, that needs an explicitly designed server SSO layer; never pretend Google and NTNU auth are interchangeable.

## Operational capability checks before any NTNU upload

- [ ] Confirm the exact `webedit` network path and verify whether a parallel `v2-staging/` directory is allowed without changing the V1 root.
- [ ] Check actual disk quota and file-size restrictions using the account's authorized tools.
- [ ] Confirm HTTPS and PHP execution **only** with a tiny staging script that reveals no private environment variables, credentials or server paths. Verify PHP extensions: `curl`, `mbstring`, `json` and any future `PDO`/SQLite requirements.
- [ ] Test whether `getenv('KASSALAPP_API_KEY')` can be configured securely **without** a publicly downloadable `.env` file. If not, stop server-backed Matpris and select an external backend.
- [ ] Confirm outbound HTTPS/cURL restrictions, timeouts, rate limits and write permissions in a non-web-accessible cache folder.
- [ ] Verify Apache `.htaccess` LDAP/htpasswd rule with a disposable non-sensitive test file and **two accounts**.
- [ ] Verify custom response headers, CSP, clickjacking and CORS mechanisms only if NTNU supports the required Apache directives.
- [ ] Use the full [production migration playbook](PRODUCTION_MIGRATION_PLAYBOOK.md): full site backup, separate database/API data backup, per-feature parity, rollback, explicit final GO.

## Refined release blockers

The local package and source documentation resolve the **build/deployment design**, not server parity. Still blocked: actual NTNU PHP environment confirmation, protected folder test, 24-course webedit backup, rights-reviewed migration of course content outside Git, V2 PHP/RAPT/Brewing/leaderboard contract implementations, Google OAuth/Drive cross-device verification, Autodesk real conversion, and full desktop/mobile accessibility parity.

**No changes to `TorMT/FolkNettside`, original NTNU `semestre/`, public live V1 homepage or existing portfolio before the agreed date and separate authorization.**
