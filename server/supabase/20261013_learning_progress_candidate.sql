-- DEVELOPMENT CANDIDATE ONLY. Not applied to production Supabase.
-- Target: aeuouzkiyddfjtjfdosp (FolkNettside), never the LeseRavnen project.
-- Run only after 2-user RLS and revision-conflict acceptance tests.
-- Progress is non-sensitive summary data. Never store answers, dive details,
-- medicine schedules, OAuth tokens or raw Drive objects in this table.

create table if not exists public.folk_learning_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_key text not null check (resource_key ~ '^[a-f0-9]{64}$'),
  kind text not null check (kind in ('video','quiz','course')),
  progress jsonb not null check (
    jsonb_typeof(progress)='object' and pg_column_size(progress) <= 4096
  ),
  revision bigint not null default 1 check (revision >= 1),
  updated_at timestamptz not null default now(),
  primary key (user_id, resource_key, kind)
);

-- Client updates are conditional on observed revision. The trigger also
-- prevents skipping/reusing revisions and replaces client-provided clock.
create or replace function public.folk_progress_revision_guard()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.revision <> 1 then
      raise exception 'Initial progress revision must be one';
    end if;
  elsif TG_OP = 'UPDATE' then
    if NEW.user_id <> OLD.user_id or NEW.resource_key <> OLD.resource_key
      or NEW.kind <> OLD.kind then
      raise exception 'Resource identity cannot be changed';
    end if;
    if NEW.revision <> OLD.revision + 1 then
      raise exception 'Progress update must increment revision once';
    end if;
  end if;
  NEW.updated_at = now();
  return NEW;
end;
$$;

drop trigger if exists folk_progress_revision_guard_trg
  on public.folk_learning_progress;
create trigger folk_progress_revision_guard_trg
before insert or update on public.folk_learning_progress
for each row execute function public.folk_progress_revision_guard();

create index if not exists folk_learning_progress_updated_idx
  on public.folk_learning_progress (user_id, updated_at desc);

alter table public.folk_learning_progress enable row level security;
revoke all on public.folk_learning_progress from public, anon, authenticated;
grant select, insert, update, delete on public.folk_learning_progress to authenticated;

drop policy if exists folk_progress_self_read on public.folk_learning_progress;
create policy folk_progress_self_read
on public.folk_learning_progress for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists folk_progress_self_insert on public.folk_learning_progress;
create policy folk_progress_self_insert
on public.folk_learning_progress for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists folk_progress_self_update on public.folk_learning_progress;
create policy folk_progress_self_update
on public.folk_learning_progress for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists folk_progress_self_delete on public.folk_learning_progress;
create policy folk_progress_self_delete
on public.folk_learning_progress for delete to authenticated
using (user_id = (select auth.uid()));
