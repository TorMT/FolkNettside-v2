-- FolkNettside V2 / active Supabase project: FolkNettside in TorMT's Org
-- Dedicated Supabase project ref: aeuouzkiyddfjtjfdosp (verified 2026-10-25).
-- Version-controlled deployment schema. Apply only to this verified project.
-- Public tables use RLS. "private" contains only server-held encrypted
-- external-service credentials; no browser Data API grants.
--
-- Important: medical data must be encrypted client-side BEFORE uploading.
-- The format label is provenance metadata, not a substitute for validating ciphertext.
-- Do not store plaintext medicine schedules in user_settings JSON.

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;
grant usage on schema private to service_role;

create table if not exists public.folk_user_settings (
    user_id uuid not null references auth.users(id) on delete cascade,
    setting_key text not null check (
      length(setting_key) between 1 and 96 and
      setting_key ~ '^[a-z0-9][a-z0-9._-]*$'
    ),
    setting_value jsonb not null default '{}'::jsonb,
    revision bigint not null default 1 check (revision > 0),
    updated_at timestamptz not null default now(),
    primary key (user_id, setting_key),
    constraint setting_payload_limited check (
      pg_column_size(setting_value) <= 32768
    ),
    constraint no_sensitive_settings check (
      setting_key !~ '(^medicine\.|^autodesk\.|^oauth\.|^token\.)'
    )
);

create table if not exists public.folk_user_files (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    category text not null check (
      category in ('general','course','engineering','dive','brewing','medicine')
    ),
    title text not null check (length(title) between 1 and 240),
    storage_path text not null check (length(storage_path) between 1 and 500),
    is_encrypted boolean not null default false,
    encryption_format text,
    revision bigint not null default 1 check (revision > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, storage_path),
    constraint own_storage_namespace check (
      split_part(storage_path, '/', 1) = user_id::text
    ),
    constraint medicine_requires_encryption check (
      category <> 'medicine' or (
        is_encrypted and encryption_format = 'folk-medisin-vault'
      )
    ),
    constraint consistent_encryption_format check (
      (is_encrypted and encryption_format in ('folk-medisin-vault','folk-v2-private-vault'))
      or (not is_encrypted and encryption_format is null)
    )
);

create index if not exists folk_user_files_user_category_idx
  on public.folk_user_files (user_id, category, updated_at desc);

create table if not exists private.folk_oauth_connections (
    user_id uuid not null references auth.users(id) on delete cascade,
    provider text not null check (provider in ('autodesk','rapt','other')),
    -- Encrypted token material is produced by the backend, never frontend.
    -- AES-GCM key is supplied via Edge Function secret, never stored here.
    token_ciphertext bytea not null,
    token_nonce bytea not null check (octet_length(token_nonce)=12),
    token_key_version integer not null check (token_key_version>0),
    token_expires_at timestamptz,
    provider_subject text,
    updated_at timestamptz not null default now(),
    primary key (user_id, provider)
);
create table if not exists private.folk_oauth_pending (
    state_hash text primary key check (
      length(state_hash)=64 and state_hash ~ '^[a-f0-9]{64}$'
    ),
    user_id uuid not null references auth.users(id) on delete cascade,
    pkce_verifier_ciphertext bytea not null,
    nonce bytea not null check (octet_length(nonce)=12),
    key_version integer not null check (key_version>0),
    return_to text not null check (length(return_to)<=500),
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
);
create index if not exists folk_oauth_pending_expiry_idx
  on private.folk_oauth_pending (expires_at);
create index if not exists folk_oauth_pending_user_idx
  on private.folk_oauth_pending (user_id);

alter table public.folk_user_settings enable row level security;
alter table public.folk_user_files enable row level security;
alter table private.folk_oauth_connections enable row level security;
alter table private.folk_oauth_pending enable row level security;

revoke all on public.folk_user_settings from anon, authenticated;
revoke all on public.folk_user_files from anon, authenticated;
grant select, insert, update, delete
  on public.folk_user_settings, public.folk_user_files to authenticated;
revoke all on all tables in schema private from public, anon, authenticated;
grant select, insert, update, delete on all tables in schema private to service_role;

create policy folk_settings_select_self on public.folk_user_settings
  for select to authenticated using ((select auth.uid())=user_id);
create policy folk_settings_insert_self on public.folk_user_settings
  for insert to authenticated with check ((select auth.uid())=user_id);
create policy folk_settings_update_self on public.folk_user_settings
  for update to authenticated
  using ((select auth.uid())=user_id)
  with check ((select auth.uid())=user_id);
create policy folk_settings_delete_self on public.folk_user_settings
  for delete to authenticated using ((select auth.uid())=user_id);

create policy folk_files_select_self on public.folk_user_files
  for select to authenticated using ((select auth.uid())=user_id);
create policy folk_files_insert_self on public.folk_user_files
  for insert to authenticated with check ((select auth.uid())=user_id);
create policy folk_files_update_self on public.folk_user_files
  for update to authenticated
  using ((select auth.uid())=user_id)
  with check ((select auth.uid())=user_id);
create policy folk_files_delete_self on public.folk_user_files
  for delete to authenticated using ((select auth.uid())=user_id);

-- Private object bucket: only authenticated user-owned prefixes.
insert into storage.buckets (id, name, public, file_size_limit)
values ('folk-private','folk-private',false,52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

create policy folk_storage_select_self on storage.objects
  for select to authenticated
  using (
    bucket_id='folk-private'
    and (storage.foldername(name))[1]=(select auth.uid())::text
  );
create policy folk_storage_insert_self on storage.objects
  for insert to authenticated
  with check (
    bucket_id='folk-private'
    and (storage.foldername(name))[1]=(select auth.uid())::text
  );
create policy folk_storage_update_self on storage.objects
  for update to authenticated
  using (
    bucket_id='folk-private'
    and (storage.foldername(name))[1]=(select auth.uid())::text
  )
  with check (
    bucket_id='folk-private'
    and (storage.foldername(name))[1]=(select auth.uid())::text
  );
create policy folk_storage_delete_self on storage.objects
  for delete to authenticated
  using (
    bucket_id='folk-private'
    and (storage.foldername(name))[1]=(select auth.uid())::text
  );
