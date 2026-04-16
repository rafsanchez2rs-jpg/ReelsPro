-- ReelShopee Pro - Supabase Schema (PostgreSQL)
-- Objetivo: multi-tenant seguro com isolamento por RLS, pronto para SaaS.

begin;

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- =========================================================
-- ENUMS
-- =========================================================

create type public.app_role as enum ('owner', 'admin', 'editor', 'analyst');
create type public.plan_tier as enum ('free', 'pro', 'enterprise');
create type public.subscription_status as enum (
  'incomplete',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid'
);
create type public.onboarding_step as enum (
  'account',
  'instagram',
  'branding',
  'voice',
  'plan',
  'completed'
);
create type public.media_kind as enum ('product_photo', 'screenshot', 'thumbnail', 'rendered_video', 'audio', 'music');
create type public.reel_status as enum (
  'draft',
  'analyzing',
  'generated',
  'review_pending',
  'scheduled',
  'publishing',
  'published',
  'failed',
  'archived'
);
create type public.voice_provider as enum ('elevenlabs', 'cartesia');
create type public.publication_status as enum ('queued', 'scheduled', 'publishing', 'published', 'failed');

-- =========================================================
-- CORE TABLES
-- =========================================================

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  display_name text not null,
  timezone text not null default 'America/Sao_Paulo',
  locale text not null default 'pt-BR',
  white_label_enabled boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  preferred_language text not null default 'pt-BR',
  default_tenant_id uuid references public.tenants(id) on delete set null,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  unique (tenant_id, user_id)
);

create table public.tenant_branding (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  primary_color text,
  secondary_color text,
  accent_color text,
  logo_url text,
  watermark_enabled boolean not null default false,
  custom_domain text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  current_step public.onboarding_step not null default 'account',
  steps_data jsonb not null default '{}'::jsonb,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- =========================================================
-- BILLING / PLANS
-- =========================================================

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  tier public.plan_tier not null unique,
  stripe_price_id text unique,
  max_reels_per_month integer not null,
  max_team_members integer not null,
  max_connected_instagram_accounts integer not null,
  max_storage_mb integer not null,
  realtime_metrics_enabled boolean not null default true,
  scheduler_enabled boolean not null default true,
  advanced_editor_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.tenant_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  plan_tier public.plan_tier not null default 'free',
  status public.subscription_status not null default 'incomplete',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_current_period_start timestamptz,
  stripe_current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.usage_counters_monthly (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  ref_month date not null,
  reels_generated_count integer not null default 0,
  reels_published_count integer not null default 0,
  storage_used_bytes bigint not null default 0,
  ai_tokens_used bigint not null default 0,
  voice_chars_used bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, ref_month)
);

-- =========================================================
-- INSTAGRAM / SOCIAL
-- =========================================================

create table public.instagram_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  connected_by uuid not null references auth.users(id) on delete restrict,
  instagram_user_id text not null,
  instagram_username text not null,
  instagram_account_type text,
  page_id text,
  business_account_id text,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  is_primary boolean not null default false,
  scopes text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  unique (tenant_id, instagram_user_id)
);

create unique index idx_instagram_connections_primary_per_tenant
  on public.instagram_connections (tenant_id)
  where is_primary = true and deleted_at is null;

-- =========================================================
-- CONTENT PIPELINE
-- =========================================================

create table public.product_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  storage_path text not null,
  kind public.media_kind not null default 'product_photo',
  mime_type text not null,
  size_bytes bigint not null,
  width integer,
  height integer,
  checksum_sha256 text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.product_analyses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  asset_id uuid not null references public.product_assets(id) on delete cascade,
  model_name text not null,
  product_name text,
  product_price numeric(12,2),
  currency text not null default 'BRL',
  short_description text,
  benefits text[] not null default '{}',
  attributes jsonb not null default '{}'::jsonb,
  confidence_score numeric(4,3),
  raw_vision_response jsonb not null default '{}'::jsonb,
  analyzed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.reels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null,
  status public.reel_status not null default 'draft',
  source_asset_id uuid references public.product_assets(id) on delete set null,
  analysis_id uuid references public.product_analyses(id) on delete set null,
  hook_text text,
  caption text,
  hashtags text[] not null default '{}',
  narration_script text,
  duration_seconds integer check (duration_seconds between 15 and 30),
  voice_provider public.voice_provider,
  voice_id text,
  trending_audio_label text,
  thumbnail_storage_path text,
  video_storage_path text,
  edit_payload jsonb not null default '{}'::jsonb,
  error_message text,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.reel_overlays (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  reel_id uuid not null references public.reels(id) on delete cascade,
  sequence integer not null,
  text_content text not null,
  animation text not null default 'slide-up',
  start_ms integer not null check (start_ms >= 0),
  end_ms integer not null check (end_ms > start_ms),
  position jsonb not null default '{"x":0.5,"y":0.8}'::jsonb,
  style jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (reel_id, sequence)
);

create table public.reel_audio_tracks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  reel_id uuid not null references public.reels(id) on delete cascade,
  provider public.voice_provider not null,
  provider_voice_id text,
  script text not null,
  storage_path text,
  duration_ms integer,
  chars_count integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.reel_publications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  reel_id uuid not null references public.reels(id) on delete cascade,
  instagram_connection_id uuid not null references public.instagram_connections(id) on delete restrict,
  status public.publication_status not null default 'queued',
  scheduled_for timestamptz,
  published_at timestamptz,
  instagram_creation_id text,
  instagram_media_id text,
  instagram_permalink text,
  published_caption text,
  response_payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.reel_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  reel_id uuid not null references public.reels(id) on delete cascade,
  publication_id uuid references public.reel_publications(id) on delete set null,
  metric_date date not null,
  views integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  saves integer not null default 0,
  reach integer not null default 0,
  interactions integer not null default 0,
  estimated_ctr numeric(6,3) not null default 0,
  engagement_rate numeric(6,3) not null default 0,
  raw_insights jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (reel_id, metric_date)
);

create table public.reel_drafts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  reel_id uuid not null unique references public.reels(id) on delete cascade,
  draft_payload jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

-- =========================================================
-- INDEXES
-- =========================================================

create index idx_tenant_memberships_user_id on public.tenant_memberships(user_id) where deleted_at is null;
create index idx_tenant_memberships_tenant_id on public.tenant_memberships(tenant_id) where deleted_at is null;
create index idx_instagram_connections_tenant_id on public.instagram_connections(tenant_id) where deleted_at is null;
create index idx_product_assets_tenant_created on public.product_assets(tenant_id, created_at desc);
create index idx_product_analyses_tenant_created on public.product_analyses(tenant_id, created_at desc);
create index idx_reels_tenant_status_created on public.reels(tenant_id, status, created_at desc) where deleted_at is null;
create index idx_reel_publications_schedule on public.reel_publications(tenant_id, status, scheduled_for);
create index idx_reel_metrics_daily_tenant_date on public.reel_metrics_daily(tenant_id, metric_date desc);
create index idx_usage_counters_monthly_tenant_ref on public.usage_counters_monthly(tenant_id, ref_month desc);
create index idx_audit_events_tenant_created on public.audit_events(tenant_id, created_at desc);

-- =========================================================
-- GENERIC TRIGGERS
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

-- =========================================================
-- AUTH HELPER FUNCTIONS
-- =========================================================

create or replace function public.is_tenant_member(target_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = target_tenant
      and tm.user_id = auth.uid()
      and tm.deleted_at is null
  );
$$;

create or replace function public.has_tenant_role(target_tenant uuid, accepted_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = target_tenant
      and tm.user_id = auth.uid()
      and tm.role = any(accepted_roles)
      and tm.deleted_at is null
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

-- Updated-at triggers

do $$
declare
  t text;
begin
  foreach t in array array[
    'tenants',
    'profiles',
    'tenant_memberships',
    'tenant_branding',
    'onboarding_progress',
    'subscription_plans',
    'tenant_subscriptions',
    'usage_counters_monthly',
    'instagram_connections',
    'product_assets',
    'product_analyses',
    'reels',
    'reel_overlays',
    'reel_audio_tracks',
    'reel_publications',
    'reel_metrics_daily',
    'reel_drafts'
  ]
  loop
    execute format('drop trigger if exists trg_%s_updated_at on public.%I', t, t);
    execute format('create trigger trg_%s_updated_at before update on public.%I for each row execute procedure public.set_updated_at()', t, t);
  end loop;
end;
$$;

-- =========================================================
-- PLAN SEED
-- =========================================================

insert into public.subscription_plans (
  tier,
  stripe_price_id,
  max_reels_per_month,
  max_team_members,
  max_connected_instagram_accounts,
  max_storage_mb,
  realtime_metrics_enabled,
  scheduler_enabled,
  advanced_editor_enabled
)
values
  ('free', null, 10, 1, 1, 1024, false, false, false),
  ('pro', null, 300, 5, 3, 20480, true, true, true),
  ('enterprise', null, 5000, 50, 25, 204800, true, true, true)
on conflict (tier) do update
set
  max_reels_per_month = excluded.max_reels_per_month,
  max_team_members = excluded.max_team_members,
  max_connected_instagram_accounts = excluded.max_connected_instagram_accounts,
  max_storage_mb = excluded.max_storage_mb,
  realtime_metrics_enabled = excluded.realtime_metrics_enabled,
  scheduler_enabled = excluded.scheduler_enabled,
  advanced_editor_enabled = excluded.advanced_editor_enabled,
  updated_at = timezone('utc', now());

-- =========================================================
-- STORAGE BUCKET + POLICIES
-- Convenção: caminho inicia com <tenant_id>/...
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reelshopee-assets',
  'reelshopee-assets',
  false,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'audio/mpeg',
    'audio/wav'
  ]
)
on conflict (id) do nothing;

-- =========================================================
-- RLS ENABLE
-- =========================================================

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.tenant_branding enable row level security;
alter table public.onboarding_progress enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.tenant_subscriptions enable row level security;
alter table public.usage_counters_monthly enable row level security;
alter table public.instagram_connections enable row level security;
alter table public.product_assets enable row level security;
alter table public.product_analyses enable row level security;
alter table public.reels enable row level security;
alter table public.reel_overlays enable row level security;
alter table public.reel_audio_tracks enable row level security;
alter table public.reel_publications enable row level security;
alter table public.reel_metrics_daily enable row level security;
alter table public.reel_drafts enable row level security;
alter table public.audit_events enable row level security;

alter table storage.objects enable row level security;

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- tenants
create policy "tenants_select_member"
  on public.tenants for select
  using (public.is_tenant_member(id));

create policy "tenants_insert_owner"
  on public.tenants for insert
  with check (created_by = auth.uid());

create policy "tenants_update_admin"
  on public.tenants for update
  using (public.has_tenant_role(id, array['owner', 'admin']::public.app_role[]))
  with check (public.has_tenant_role(id, array['owner', 'admin']::public.app_role[]));

-- profiles
create policy "profiles_select_self_or_team"
  on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.tenant_memberships tm_me
      join public.tenant_memberships tm_other
        on tm_other.tenant_id = tm_me.tenant_id
       and tm_other.user_id = profiles.id
      where tm_me.user_id = auth.uid()
        and tm_me.deleted_at is null
        and tm_other.deleted_at is null
    )
  );

create policy "profiles_insert_self"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- tenant_memberships
create policy "memberships_select_member"
  on public.tenant_memberships for select
  using (public.is_tenant_member(tenant_id));

create policy "memberships_insert_admin"
  on public.tenant_memberships for insert
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]));

create policy "memberships_update_admin"
  on public.tenant_memberships for update
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]));

create policy "memberships_delete_owner"
  on public.tenant_memberships for delete
  using (public.has_tenant_role(tenant_id, array['owner']::public.app_role[]));

-- generic tenant tables policies helper
create policy "tenant_branding_rw_member"
  on public.tenant_branding for all
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "onboarding_progress_rw_member"
  on public.onboarding_progress for all
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "tenant_subscriptions_select_member"
  on public.tenant_subscriptions for select
  using (public.is_tenant_member(tenant_id));

create policy "tenant_subscriptions_update_admin"
  on public.tenant_subscriptions for update
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]));

create policy "usage_counters_rw_member"
  on public.usage_counters_monthly for all
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "instagram_connections_rw_member"
  on public.instagram_connections for all
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "product_assets_rw_member"
  on public.product_assets for all
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "product_analyses_rw_member"
  on public.product_analyses for all
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "reels_rw_member"
  on public.reels for all
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "reel_overlays_rw_member"
  on public.reel_overlays for all
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "reel_audio_tracks_rw_member"
  on public.reel_audio_tracks for all
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "reel_publications_rw_member"
  on public.reel_publications for all
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "reel_metrics_daily_rw_member"
  on public.reel_metrics_daily for all
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "reel_drafts_rw_member"
  on public.reel_drafts for all
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy "audit_events_select_member"
  on public.audit_events for select
  using (tenant_id is null or public.is_tenant_member(tenant_id));

create policy "audit_events_insert_member"
  on public.audit_events for insert
  with check (tenant_id is null or public.is_tenant_member(tenant_id));

-- subscription plans podem ser lidos por qualquer usuário autenticado
create policy "subscription_plans_select_authenticated"
  on public.subscription_plans for select
  using (auth.uid() is not null);

-- Storage policies por tenant_id no primeiro segmento do path
create policy "storage_assets_select_member"
  on storage.objects for select
  using (
    bucket_id = 'reelshopee-assets'
    and public.is_tenant_member(((storage.foldername(name))[1])::uuid)
  );

create policy "storage_assets_insert_member"
  on storage.objects for insert
  with check (
    bucket_id = 'reelshopee-assets'
    and auth.uid() is not null
    and public.is_tenant_member(((storage.foldername(name))[1])::uuid)
  );

create policy "storage_assets_update_member"
  on storage.objects for update
  using (
    bucket_id = 'reelshopee-assets'
    and public.is_tenant_member(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'reelshopee-assets'
    and public.is_tenant_member(((storage.foldername(name))[1])::uuid)
  );

create policy "storage_assets_delete_admin"
  on storage.objects for delete
  using (
    bucket_id = 'reelshopee-assets'
    and public.has_tenant_role(((storage.foldername(name))[1])::uuid, array['owner', 'admin']::public.app_role[])
  );

commit;
