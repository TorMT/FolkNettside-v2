# FolkNet course editor — one admin, NTNU file server

## Architecture

- NTNU remains the file server for the approved public course files. Course
  URLs continue to point to `https://tormt.folk.ntnu.no/semestre/...`.
  This feature never uploads, renames, deletes or copies NTNU files.
- GitHub Pages hosts the V2 UI and the indexed public metadata.
- The dedicated FolkNet Supabase project `aeuouzkiyddfjtjfdosp` stores
  public cosmetic labels; **no course files or quiz answer content**.
- Supabase Auth provides email/password sign-in already available under
  Settings → Account & connections. The editor is at `#/admin/courses`.

## Én forhåndsopprettet konto

V2 viser nå kun **Logg inn** i Innstillinger → Konto og tilkoblinger.
En innlogget bruker får lenke til kursadministrasjon, men tilgang avgjøres
fremdeles av serverens RLS og tabellen `folk_site_admins`.

**Viktig:** Å skjule registreringsknappen deaktiverer ikke Supabase sitt
registrerings-API. Deaktiver offentlig registrering eller begrens den til
invitasjoner under Auth-innstillingene i **riktig FolkNet-prosjekt**.
Opprett/verifiser først eierens konto der og registrer den faktiske Auth-UUID
i admin-tabellen. Ingen passord, kontoeieridentitet eller adminrettigheter
skal hardkodes i GitHub Pages.

## Database installed in TorMT's Org — owner account pending

The SQL candidate is `server/supabase/20261024_folk_course_labels_candidate.sql`.
The RLS-protected admin/label schema is already installed in the new FolkNet project
as migration `20261025173633` (`folk_course_admin_labels_20261025`).
The project's Auth currently has **zero users** and `folk_site_admins` has
**zero admins**, so a real, verified owner account must still be provisioned.
Never insert an invented UUID or use LeseRavnen's Auth users.

For owner provisioning, open the new FolkNet project in Supabase and verify its existing RLS policies. Use an authenticated owner account with a verified
email; do not publish a password, service-role key or database password.

The two tables:

- `folk_site_admins`: a single slot makes it impossible to grant more than
  one admin concurrently. No INSERT/UPDATE/DELETE grants for site clients.
  Administrators are added/rotated only through privileged database access.
- `folk_course_labels`: everyone can SELECT public labels, but only the
  UID recorded in `folk_site_admins` may insert/update/delete them.
  RLS and grants independently enforce this. User-editable metadata and
  email matching are never used for authorization.

After the account exists, an operator may seed the UUID (not the email
or password) in the correct project's SQL Editor:

```sql
insert into public.folk_site_admins(user_id)
values ('<uuid-of-your-verified-FolkNet-auth-user>');
```

Do not seed until the exact account has been checked and the project
reference is verified. If the command reports a unique slot violation, an
admin already exists; inspect before replacing the administrator.

## Verify before enabling edits

1. On the FolkNet project, confirm RLS is enabled on **both** tables.
2. An unauthenticated visitor can read labels but cannot write.
3. A signed-in non-admin can read labels but cannot insert/update/delete.
4. The nominated admin can create, modify and delete a test label.
5. Verify changes appear on another browser after reloading. Check that
   file links still point to NTNU, and that all legacy names return when
   the Supabase API is unavailable.
6. Check the Supabase security and performance advisors, especially RLS
   and grants. Keep project signups constrained to your intended policy;
   successful login alone is not an admin role.
7. Confirm no personal or protected course data is stored in public labels.

The checked-in `config/ntnu-display-names.json` is a safe fallback if the
database is unavailable. The admin can edit a course title, description,
section label or file label. Keys are the original NTNU path identifiers.
On saving, the editor reloads the page so the browser rebuilds its catalog.

## What this does not do

- No registration or verification of an admin account is performed here.
- The database schema was deployed directly to FolkNet before this frontend switch; no verified owner identity or admin grants have been provisioned yet.
- No direct NTNU upload/edit/delete. Those require separate access-control
  and content-rights checks before adding any future file operations.

## Live verification 2026-10-28 — owner account still required

A read-only check of the **active FolkNet project** `aeuouzkiyddfjtjfdosp`
returned `auth.users = 0`, `folk_site_admins = 0`, and
`folk_course_labels = 0`. Both public tables have RLS enabled. Database
grants allow anonymous **SELECT only** for `folk_course_labels`;
authenticated users have SELECT of their own administrator row, but cannot
insert/update/delete `folk_site_admins`. Label writes have RLS policies
requiring their authenticated UUID to be present in that administrator table.
The security advisor reported only informational no-policy notices on two
private, non-exposed OAuth tables; these are not public write grants.

**Only the owner can finish initial identity provisioning securely:**

1. Open [FolkNet Authentication → Users](https://supabase.com/dashboard/project/aeuouzkiyddfjtjfdosp/auth/users).
   Provision one owner email/password identity through the trusted dashboard,
   then complete email verification. An invitation is an option, but do not
   rely on invitation redirects as a substitute for testing normal password
   sign-in in the V2 Settings page.
2. Under [Auth settings](https://supabase.com/dashboard/project/aeuouzkiyddfjtjfdosp/auth/providers),
   confirm public signup is disabled, email confirmation is required and the
   intended V2 Pages URL/redirect settings are correct. Hiding the UI signup
   button is not sufficient. Do not put the password in chat or GitHub.
3. Verify that the account's exact `auth.users.id` belongs to the intended
   verified owner in this project. Seed that UUID using the single-admin SQL
   already documented above. Never generate a synthetic Auth UUID.
4. Sign in from Settings → Account & connections; check the editor on a
   second browser, verify a harmless label save/restore, and check signed-out,
   non-admin and two-account isolation. Run the security advisor again.
   The full B01 requirement remains **open** until this passes with a real
   session. The client-only stale-auth hardening merged in PR #176 does not
   grant admin permissions.

2026-10-28 PR #176 regression evidence: an expired account context or a
delayed Supabase response cannot confirm old administrator privileges or
report a label change with a mismatched key/value. The server's RLS remains
the actual authorization boundary.
