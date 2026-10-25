-- FOLKNET ONLY: schema for project aeuouzkiyddfjtjfdosp (already installed via 20261025173633).
-- Not installed by GitHub Pages. Review and apply to the correct Supabase
-- project, NEVER to LeseRavnen.
--
-- Insert the actual ADMIN auth.users.id separately from a privileged
-- Supabase SQL session after the owner has logged in at least once.

create table if not exists public.folk_site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  slot smallint not null default 1 unique check (slot = 1)
);
alter table public.folk_site_admins enable row level security;
revoke all on public.folk_site_admins from anon, authenticated;
grant select on public.folk_site_admins to authenticated;
create policy folk_admin_read_self on public.folk_site_admins
  for select to authenticated
  using (user_id = (select auth.uid()));

create table if not exists public.folk_course_labels (
  kind text not null check (kind in ('course-title','course-description','section','file')),
  key text not null check (char_length(key) between 3 and 1600),
  label text not null check (
    char_length(btrim(label)) between 1 and
      case kind when 'course-title' then 130
                when 'course-description' then 300
                else 160 end
    and label !~ '[<>[:cntrl:]]'
  ),
  updated_at timestamptz not null default now(),
  primary key (kind,key)
);
alter table public.folk_course_labels enable row level security;
revoke all on public.folk_course_labels from anon, authenticated;
grant select on public.folk_course_labels to anon, authenticated;
grant insert, update, delete on public.folk_course_labels to authenticated;

create policy folk_labels_public_read on public.folk_course_labels
  for select to anon, authenticated using (true);
create policy folk_labels_admin_insert on public.folk_course_labels
  for insert to authenticated
  with check (exists (select 1 from public.folk_site_admins a
    where a.user_id = (select auth.uid())));
create policy folk_labels_admin_update on public.folk_course_labels
  for update to authenticated
  using (exists (select 1 from public.folk_site_admins a
    where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.folk_site_admins a
    where a.user_id = (select auth.uid())));
create policy folk_labels_admin_delete on public.folk_course_labels
  for delete to authenticated
  using (exists (select 1 from public.folk_site_admins a
    where a.user_id = (select auth.uid())));

-- PRIVILEGED operator only, AFTER auth user exists (replace placeholder):
-- insert into public.folk_site_admins(user_id)
-- values ('<the-owner-auth-uuid>');
-- SELECT only verified admin after seeding:
-- select user_id from public.folk_site_admins;
