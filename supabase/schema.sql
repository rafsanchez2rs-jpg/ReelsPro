-- ReelFlow - Schema Simplificado
-- Limite: 5 usuários máximos

begin;

create extension if not exists "pgcrypto";

-- =========================================================
-- ENUMS
-- =========================================================

create type public.user_status as enum ('pending', 'active', 'suspended');
create type public.reel_status as enum ('draft', 'analyzing', 'generating', 'ready', 'failed');
create type public.voice_mode as enum ('text', 'elevenlabs', 'cartesia');

-- =========================================================
-- TABELAS CORE
-- =========================================================

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  avatar_url text,
  api_keys jsonb not null default '{}'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  status public.user_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  device_name text,
  ip_address inet,
  last_active_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  current_step integer not null default 0,
  step_data jsonb not null default '{"brand":{},"voice":{}}'::jsonb,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- =========================================================
-- CONTENT PIPELINE
-- =========================================================

create table public.product_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  width integer,
  height integer,
  original_filename text,
  checksum_sha256 text,
  is_uploaded boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.product_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  asset_id uuid not null references public.product_assets(id) on delete cascade,
  model_name text not null,
  product_name text,
  product_price numeric(12,2),
  currency text not null default 'BRL',
  short_description text,
  benefits text[] not null default '{}',
  attributes jsonb not null default '{}'::jsonb,
  confidence_score numeric(4,3),
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.reels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  status public.reel_status not null default 'draft',
  asset_id uuid references public.product_assets(id) on delete set null,
  analysis_id uuid references public.product_analyses(id) on delete set null,
  hook_text text,
  caption text,
  hashtags text[] not null default '{}',
  narration_script text,
  duration_seconds integer check (duration_seconds between 15 and 30),
  voice_mode public.voice_mode not null default 'text',
  voice_id text,
  thumbnail_storage_path text,
  video_storage_path text,
  video_url text,
  render_payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.reel_overlays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  reel_id uuid not null references public.reels(id) on delete cascade,
  sequence integer not null,
  text_content text not null,
  animation text not null default 'fade-in',
  start_ms integer not null check (start_ms >= 0),
  end_ms integer not null check (end_ms > start_ms),
  position_x numeric(4,3) not null default 0.5,
  position_y numeric(4,3) not null default 0.8,
  style jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (reel_id, sequence)
);

create table public.reel_audio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  reel_id uuid not null references public.reels(id) on delete cascade,
  script text not null,
  audio_storage_path text,
  audio_url text,
  voice_provider text,
  voice_id text,
  duration_ms integer,
  chars_count integer,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- =========================================================
-- AUDIT
-- =========================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  event_name text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

-- =========================================================
-- ÍNDICES
-- =========================================================

create index idx_users_email on public.users(email) where status = 'active';
create index idx_product_assets_user_created on public.product_assets(user_id, created_at desc);
create index idx_product_analyses_user_created on public.product_analyses(user_id, created_at desc);
create index idx_reels_user_status_created on public.reels(user_id, status, created_at desc) where deleted_at is null;
create index idx_reel_overlays_reel on public.reel_overlays(reel_id, sequence);
create index idx_reel_audio_reel on public.reel_audio(reel_id);
create index idx_audit_logs_user_created on public.audit_logs(user_id, created_at desc);

-- =========================================================
-- TRIGGERS
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'users',
    'user_sessions',
    'onboarding_progress',
    'product_assets',
    'product_analyses',
    'reels',
    'reel_overlays',
    'reel_audio'
  ]
  loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute procedure public.set_updated_at()', t, t);
  end loop;
end;
$$;

-- =========================================================
-- LIMITE DE USUÁRIOS - CHECK E FUNÇÃO
-- =========================================================

create or replace function public.check_user_limit()
returns trigger
language plpgsql
as $$
declare
  current_count integer;
  max_users constant integer := 5;
begin
  if TG_OP = 'INSERT' and new.status = 'active' then
    select count(*) into current_count
    from public.users
    where status = 'active';

    if current_count >= max_users then
      raise exception 'Limite máximo de % usuários alcanzado', max_users;
    end if;
  end if;
  return new;
end;
$$;

create constraint chk_user_limit check (
  (select count(*) from public.users where status = 'active') <= 5
);

-- =========================================================
-- STORAGE
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reelflow-assets',
  'reelflow-assets',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/wav']
)
on conflict (id) do nothing;

-- =========================================================
-- RLS
-- =========================================================

alter table public.users enable row level security;
alter table public.user_sessions enable row level security;
alter table public.onboarding_progress enable row level security;
alter table public.product_assets enable row level security;
alter table public.product_analyses enable row level security;
alter table public.reels enable row level security;
alter table public.reel_overlays enable row level security;
alter table public.reel_audio enable row level security;
alter table public.audit_logs enable row level security;
alter table storage.objects enable row level security;

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- USERS: usuário vê e edita apenas seu próprio registro
create policy "users_select_own" on public.users for select using (id = auth.uid());
create policy "users_update_own" on public.users for update using (id = auth.uid());

-- USER_SESSIONS: apenas próprio usuário
create policy "sessions_select_own" on public.user_sessions for select using (user_id = auth.uid());
create policy "sessions_insert_own" on public.user_sessions for insert with check (user_id = auth.uid());
create policy "sessions_update_own" on public.user_sessions for update using (user_id = auth.uid());

-- ONBOARDING_PROGRESS
create policy "onboarding_select_own" on public.onboarding_progress for select using (user_id = auth.uid());
create policy "onboarding_insert_own" on public.onboarding_progress for insert with check (user_id = auth.uid());
create policy "onboarding_update_own" on public.onboarding_progress for update using (user_id = auth.uid());

-- PRODUCT_ASSETS
create policy "assets_select_own" on public.product_assets for select using (user_id = auth.uid());
create policy "assets_insert_own" on public.product_assets for insert with check (user_id = auth.uid());
create policy "assets_update_own" on public.product_assets for update using (user_id = auth.uid());
create policy "assets_delete_own" on public.product_assets for delete using (user_id = auth.uid());

-- PRODUCT_ANALYSES
create policy "analyses_select_own" on public.product_analyses for select using (user_id = auth.uid());
create policy "analyses_insert_own" on public.product_analyses for insert with check (user_id = auth.uid());
create policy "analyses_update_own" on public.product_analyses for update using (user_id = auth.uid());

-- REELS
create policy "reels_select_own" on public.reels for select using (user_id = auth.uid());
create policy "reels_insert_own" on public.reels for insert with check (user_id = auth.uid());
create policy "reels_update_own" on public.reels for update using (user_id = auth.uid());
create policy "reels_delete_own" on public.reels for delete using (user_id = auth.uid());

-- REEL_OVERLAYS
create policy "overlays_select_own" on public.reel_overlays for select using (user_id = auth.uid());
create policy "overlays_insert_own" on public.reel_overlays for insert with check (user_id = auth.uid());
create policy "overlays_update_own" on public.reel_overlays for update using (user_id = auth.uid());
create policy "overlays_delete_own" on public.reel_overlays for delete using (user_id = auth.uid());

-- REEL_AUDIO
create policy "audio_select_own" on public.reel_audio for select using (user_id = auth.uid());
create policy "audio_insert_own" on public.reel_audio for insert with check (user_id = auth.uid());
create policy "audio_update_own" on public.reel_audio for update using (user_id = auth.uid());
create policy "audio_delete_own" on public.reel_audio for delete using (user_id = auth.uid());

-- AUDIT_LOGS
create policy "audit_select_own" on public.audit_logs for select using (user_id = auth.uid());
create policy "audit_insert_own" on public.audit_logs for insert with check (user_id = auth.uid() or user_id is null);

-- STORAGE
create policy "storage_select_own" on storage.objects for select
using (
  bucket_id = 'reelflow-assets'
  and ((storage.foldername(name))[1])::uuid in (select id from public.users where id = auth.uid())
);

create policy "storage_insert_own" on storage.objects for insert
with check (
  bucket_id = 'reelflow-assets'
  and auth.uid() is not null
  and ((storage.foldername(name))[1])::uuid in (select id from public.users where id = auth.uid())
);

create policy "storage_update_own" on storage.objects for update
using (
  bucket_id = 'reelflow-assets'
  and ((storage.foldername(name))[1])::uuid in (select id from public.users where id = auth.uid())
);

create policy "storage_delete_own" on storage.objects for delete
using (
  bucket_id = 'reelflow-assets'
  and ((storage.foldername(name))[1])::uuid in (select id from public.users where id = auth.uid())
);

commit;