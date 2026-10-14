-- Apply in the FOLKNET Supabase project SQL editor, not LeseRavnen.
-- Passwords are created via Supabase Auth (Dashboard -> Users), never in SQL or Git.
-- This SQL does NOT grant admin privileges until the owner inserts their Auth UID.
begin;

create table if not exists public.folk_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.folk_admins enable row level security;
revoke all on public.folk_admins from anon, authenticated;
grant select on public.folk_admins to authenticated;
drop policy if exists "admin may view own membership" on public.folk_admins;
create policy "admin may view own membership"
on public.folk_admins for select to authenticated
using (user_id = (select auth.uid()));

create table if not exists public.course_display_config (
  id text primary key check (id = 'main'),
  aliases jsonb not null check (
    jsonb_typeof(aliases) = 'object'
    and aliases->>'schemaVersion' = '1'
    and octet_length(aliases::text) <= 1000000
  ),
  updated_at timestamptz not null default now()
);
alter table public.course_display_config enable row level security;
revoke all on public.course_display_config from anon, authenticated;
grant select on public.course_display_config to anon, authenticated;
grant insert (id, aliases), update (id, aliases) on public.course_display_config to authenticated;

drop policy if exists "everyone can read public course labels" on public.course_display_config;
create policy "everyone can read public course labels"
on public.course_display_config for select to anon, authenticated using (true);

drop policy if exists "admins can insert course labels" on public.course_display_config;
create policy "admins can insert course labels"
on public.course_display_config for insert to authenticated
with check (exists (
 select 1 from public.folk_admins
 where user_id = (select auth.uid())
));

drop policy if exists "admins can update course labels" on public.course_display_config;
create policy "admins can update course labels"
on public.course_display_config for update to authenticated
using (exists (
 select 1 from public.folk_admins
 where user_id = (select auth.uid())
))
with check (exists (
 select 1 from public.folk_admins
 where user_id = (select auth.uid())
));

commit;

-- MANUAL BOOTSTRAP, once the owner's Auth user has been created:
-- INSERT INTO public.folk_admins (user_id)
-- SELECT id FROM auth.users WHERE email = 'THE_OWNERS_VERIFIED_EMAIL';
-- The command above must be run only in the intended FolkNet project.
