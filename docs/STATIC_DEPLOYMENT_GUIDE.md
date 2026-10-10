# Static-only release architecture (GitHub Pages)

**Hard constraint:** This V2 preview never changes `TorMT/FolkNettside`, the
NTNU production site or the existing Engineering Portfolio URL used in job
applications. Do not merge, redirect or deploy to the FolkNettside domain as
part of this work.

**NTNU difference:** GitHub Pages restrictions are not folk.ntnu.no
restrictions. Official NTNU documentation describes server-side Apache
`.htaccess` authentication through NTNU LDAP or `htpasswd` for individual
directories. See [NTNU hosting and staged build](NTNU_FOLK_HOSTING.md)
for the independently deployed and access-controlled future alternative.
No protected resources are ever copied to this GitHub Pages build.

## 1. Public vs encrypted vs private content

GitHub Pages is static. Files present in the public repository and built
artifact can be downloaded by **anyone**, irrespective of hidden menus, JavaScript
password hashes, CSS, localStorage or route guards. A client-side password hash
is not an access-control system.

For content that may be made public **only as ciphertext**, use Tools →
Encrypted resources (`#/tools/vault`). This encrypts the selected local
file in the browser with PBKDF2-SHA-256 (600 000 iterations), a random salt
and AES-256-GCM (authenticated data). Save the resulting
`protected-resource.vault.json` outside the originals folder, then copy **only
that encrypted file** into the public semester folder. SiteUpdater detects
`.vault.json` as `VAULT`; Courses opens a local passphrase prompt and decrypts
the bytes into memory. Original file names should not be put in the public URL
if they are confidential. Never publish an unencrypted copy.

**Security caveats:** ciphertext is public and permits offline dictionary
attacks; a long high-entropy passphrase is mandatory. There is no user-specific
access control, expiry, password reset, revocation, auditing, anti-sharing
or per-file authorization. This approach is not appropriate for medical,
sensitive personal data or any file that must be absolutely confidential.
Those files must not be hosted on Pages at all.

The release pipeline and PR test both block folders named
`Beskyttet`, `private`, `protected`, etc. and credential-like filenames.
This preflight is a safety net, not a full secret scanner or substitute for
code review of uploaded files.

## 2. Google OAuth and Drive

An OAuth **browser client ID** is publicly shareable, but an OAuth client
secret, refresh token, service account or private key must **never** be
committed. V2 may read `./data/google-auth.json` in the deployed static
site. Its configuration is optional. Use a configuration object like:

```json
{
  "googleDriveAuth": {
    "clientId": "YOUR_PUBLIC_BROWSER_CLIENT_ID.apps.googleusercontent.com"
  }
}
```

Register the exact GitHub Pages origin as an authorized JavaScript origin in
the Google Cloud project. The client ID alone does not grant Drive access:
each user must sign in and consent. Use `drive.file` and user-owned files.
Cross-device behavior and authorization/privacy isolation require live test
accounts; no local CI test can verify this automatically. If public client
configuration is absent, show an unavailable state, do not claim signed in.
The legacy PHP configuration path is only considered outside GitHub Pages.

## 3. Brewing and external APIs

GitHub Pages cannot run PHP, keep server secrets, proxy RAPT credentials or
expose safe private API tokens. V2 offers a local inventory with import/export.
Legacy Brewing/recipe/log/RAPT API parity must be obtained with a separate
authorized HTTPS API origin or left as an explicit legacy fallback; don't
invent success and don't embed server tokens in browser JS.

## 4. Static viewers and tools

- KISSsoft Z014 and compatible Z012 use conceptual gear layouts and
  relative kinematics; actual involute geometry and strength checks require
  real KISSsoft exports.
- LaTeX uses client-side KaTeX when available and a limited locally rendered
  math fallback offline; unsupported TeX packages remain accessible via
  **Show LaTeX source**.
- Structure offers an interactive 3D beam illustration, mouse and touch
  orbit/pan/zoom and a separate 2D FEM reference. Solver remains linear 2D.
- A full browser test does **not** constitute native CAD conversion parity.

## 5. Pre-release acceptance

1. Verify the original Engineering Portfolio application URL still resolves
   unchanged and save a snapshot/rollback plan.
2. Audit all actual course data; copy only public files and deliberately
   encrypted archives into the V2 static tree. Run SiteUpdater with the real
   source path, then CI static security guard.
3. Check V2 mobile/desktop functionality, vault unlock, full course nesting,
   CV/contact, engineering tools, file upload/download, search and themes.
4. Test Google sign-in and Brewing live integrations **only if** their
   authorized external services exist.
5. Validate preview and go/no-go. Domain cutover is a distinct task and
   requires explicit owner approval.
