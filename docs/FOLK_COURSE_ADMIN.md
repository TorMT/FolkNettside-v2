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

## Database installed on the new project — owner account pending (25 October 2026)

Live target: [FolkNettside in TorMT's Org](https://supabase.com/dashboard/project/aeuouzkiyddfjtjfdosp),
project `aeuouzkiyddfjtjfdosp`, `eu-central-1` (Frankfurt), Free tier (quoted USD 0/month).
Old `glfuvfmppkjmarujjqwg` was not accessible and **was not migrated or modified**.

Successful migrations on the **new** project:
- `folk_course_admin_labels_20261025`: `folk_site_admins` and `folk_course_labels`, RLS and single-owner guard.
- `folk_private_storage_and_oauth_20261025`: private `folk-private` Storage bucket, user settings/files, private OAuth tables and user-prefix policies.
- `folk-core` Edge Function deployed (version 1), with independent JWT verification. Unauthenticated `/session` and `/health` probes returned HTTP 401.

Post-deployment SQL confirmed **4 RLS-enabled public tables** and a private bucket.
`auth.users` and `folk_site_admins` were empty (no account has been invited or assigned).
Security advisor raised INFO-only notices for two intentionally private OAuth tables
with no end-user RLS policies. This is expected; they are not in the Data API.

**Next owner action:** Create or invite a user in **Authentication → Users** in
this exact project, confirm the email, disable unwanted public sign-up in Auth
settings and allow the GitHub Pages site URL. Then verify its actual UUID and
seed only that user as admin. Do not publish a password or a service-role key.
The existence of the UI does not prove real login or RLS enforcement for two accounts.

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
- Core Supabase migrations and `folk-core` have been deployed to the new project; real admin identity and user-based acceptance tests remain.
- No direct NTNU upload/edit/delete. Those require separate access-control
  and content-rights checks before adding any future file operations.
