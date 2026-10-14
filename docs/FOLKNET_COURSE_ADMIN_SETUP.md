# FolkNet V2 – administrator and published course labels

This implementation is **not activated** until the owner bootstraps the
**FolkNet** Supabase project (`glfuvfmppkjmarujjqwg`). Do not apply the
SQL to the separate LeseRavnen database.

## One-time setup

1. In the FolkNet Supabase Dashboard, confirm that Email/Password Auth is
   enabled and configure the project's site/redirect URLs.
2. In Auth → Users, **create a dedicated verified admin email account** or
   use the owner's existing verified FolkNet Auth identity. Choose the
   password there; never copy any password or password hash into the Git
   repository, frontend configuration, GitHub Actions, or SQL.
3. Execute `supabase/sql/course_display_admin_setup.sql` in the FolkNet
   project's SQL editor. It creates RLS-controlled admin membership and
   a public-read/admin-write JSON document.
4. Assign admin permission to the *exact* intended Auth UID using a
   manually reviewed statement in that SQL file. Verify it affects one
   user. Do not give other accounts admin status by default.
5. Sign in at `/src/courses/name-editor.html` with that **email**
   and password. Edit a name and select **Publiser navn**. Reload
   `#/courses/1` (or the affected semester) to see it.
6. Sign out and confirm direct writes without an admin session are blocked.
   Confirm an ordinary authenticated user also gets HTTP 403. Public
   readers must still be able to GET published labels.

## Design and recovery

- Admin authentication uses the existing FolkNet Supabase email/password
  flow; no frontend username/password pair is accepted as proof of admin.
- The `folk_admins` membership row plus Postgres RLS authorize writes.
  The admin editor verifies membership to give feedback; hiding UI is
  **not** access control.
- Published aliases live at `public.course_display_config` (row
  `id='main'`). The checked-in `config/ntnu-display-names.json`
  remains the fallback if the REST API is offline, missing or invalid.
- Updating aliases does **not** rename or move NTNU files, nor does it
  modify the original V1 website or any source folders.
- All public browsers fetch alias updates on a fresh page load. A page
  that is already open may need to be reloaded.
- The publish action sends a complete document; simultaneous admin edits
  currently use last-write-wins. Add revision/CAS semantics before adding
  multiple editors.
- Only public course metadata belongs in this table. Do not store personal
  information or private NTNU files in published aliases.

## Viewer scope

- PDF pages embed the original HTTPS URL and always show an open-original link.
- Viewers that fetch file bytes (Python, Office, ZIP, CAD, etc.) need the NTNU
  server to permit cross-origin reads from GitHub Pages. The original link
  remains available when browser preview fails.
- Server-side permission checks are **never** bypassed with a public proxy.
- Do not copy NTNU teaching files into the GitHub repository just to work
  around CORS. Coordinate narrowly scoped CORS headers on **approved public**
  NTNU directories with the server administrators.

## Rollout gate

Code checks passing is not enough. Before merging into the published V2,
apply the SQL to the correct project, verify real admin login and RLS
denial, then smoke-test browser navigation and representative PDF/Python
resources. The connected Supabase integration must target the FolkNet project
to perform this verification.
