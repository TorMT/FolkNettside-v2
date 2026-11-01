# FolkNettside V2 — login acceptance and remaining setup (2026-11-01)

This is a **code/architecture and read-only backend check**, not a declaration
that real-account login is operational. V1/NTNU production has not been changed.

## Verified current state

| Area | Finding | Verification |
| --- | --- | --- |
| FolkNet Supabase project | `aeuouzkiyddfjtjfdosp` is `ACTIVE_HEALTHY`. | Connected project listing 2026-11-01 |
| Auth users | **0 Auth users, 0 identities, 0 admins** in `public.folk_site_admins`. There is currently no real owner who can sign in. | Read-only SQL count 2026-11-01 |
| RLS | `folk_site_admins` and `folk_course_labels` both have RLS enabled. The admin table has only authenticated self-read. Public labels are SELECT-able; insert/update/delete require the authenticated UID in the admin table. | Read-only `pg_policies` check 2026-11-01 |
| Google Identity Services | Public `data/google-auth.json` is **absent from the repo main branch**. V2 can alternatively read operator-provided `window.__FOLK_GOOGLE_AUTH_CONFIG__`; this has **not been verified on the deployed origin**. Never copy a Google client secret. | Repo source, `src/platform/google-session.js` |
| Google sign-in code | A settled OAuth promise no longer pins an expired token; new tokens require a verified Google `sub`, and silent refresh cannot silently change Google accounts. | [#189](https://github.com/TorMT/FolkNettside-v2/pull/189), CI **41350314168 success 51/51** |
| FolkNet sign-in code | Failed account switching drops previous bearer credentials, stale refresh responses cannot replace a new session, and login errors are shown inline without retaining rejected passwords. | [#190](https://github.com/TorMT/FolkNettside-v2/pull/190), CI **41350592794 success 51/51** |
| FolkNet initialization retry | An offline/unavailable first configuration load no longer permanently disables later login attempts; sign-out during configuration prevents a delayed cached-session restoration. | [#191](https://github.com/TorMT/FolkNettside-v2/pull/191), [CI 41351397837](https://github.com/TorMT/FolkNettside-v2/actions/runs/41351397837) **success 51/51** |
| Live acceptance | **Not verified** with a real Supabase user or real Google consent. GitHub CI tests use synthetic accounts and browser stubs. | External gate |

Supabase security advisor raised only informational `rls_enabled_no_policy`
notices for **private**, non-client-exposed `folk_oauth_connections` and
`folk_oauth_pending`. Do not add broad client policies to silence them.

## Owner/operator activation — do not paste passwords in issues or chat

1. In [FolkNet Auth Users](https://supabase.com/dashboard/project/aeuouzkiyddfjtjfdosp/auth/users), provision **one intended owner** from a verified email using the dashboard/invitation flow. Complete email confirmation. The account ID must come from this *exact* project's actual Auth user.
2. Confirm Auth **public signup is disabled** on the server. Hiding a signup button in V2 is not an access restriction. Configure the project's Auth site URL and necessary redirect allowlist for the chosen V2 origin; do not whitelist arbitrary third-party domains.
3. Assign the verified owner UUID to the existing single-slot `public.folk_site_admins` through privileged SQL/dashboard tools **after** validating its identity. Do not invent an ID or loosen RLS. The existing setup guide `docs/FOLK_COURSE_ADMIN.md` contains the one-row seed example.
4. Test FolkNet email/password sign-in from **Settings → Account & connections**, reload in the same tab, explicitly sign out, test a second account with **no admin role**, then verify a harmless cosmetic label edit on another browser. Never treat a signed-in client claim as proof of admin rights without server RLS acceptance.
5. In Google Cloud, register a **browser OAuth client ID** with the exact authorized V2 JavaScript origins. Supply only its *public ID* in V2's optional `data/google-auth.json` (`{"clientId":"...apps.googleusercontent.com"}`); do not commit a client secret or user token. Review the unrelated [#158](https://github.com/TorMT/FolkNettside-v2/pull/158) importer separately before reuse of V1 public configuration.
6. Exercise **Sign in with Google**, Google profile verification, Drive access, expiry/refresh, Drive sign-out, re-login with a different Google account, and two real devices. Verify that private data stays per-user and cloud sync remains opt-in. Google Drive OAuth and Supabase Auth remain **separate identities**; checking a linked-provider list does not merge them.
7. Re-run security advisors and actual signed-out/non-admin/admin RLS HTTP acceptance before declaring B01/B04 complete.

## Remaining architecture limitations

- Browser Supabase session is intentionally scoped to `sessionStorage` for a tab;
  Google access tokens are memory-only. Do not equate independent tabs with
  a verified single cross-device identity.
- Neither PR provisions user accounts, modifies auth-provider settings,
  grants administrator privileges, or enables Google OAuth on the published
  origin. These are deliberate credential/ownership gates.
- External backend, redirect and CORS configuration, password recovery,
  Google consent screen status and real account sign-in are **not proven** by CI.
- The original NTNU V1 site remains untouched, as required by `AGENTS.md`.
