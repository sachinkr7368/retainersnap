-- RetainerSnap schema. Run once in the Supabase SQL editor (or via the Supabase CLI).
-- Authenticated users can read their workspace. Writes go through service-role
-- server actions and the security-definer functions below, which enforce plan limits.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.site_platform as enum ('framer', 'webflow', 'nextjs');
create type public.member_role as enum ('owner', 'member');
create type public.job_kind as enum ('uptime', 'ssl', 'domain', 'pagespeed', 'crawl_page');
create type public.job_status as enum ('pending', 'running', 'done', 'failed');
create type public.check_kind as enum ('uptime', 'ssl', 'domain');
create type public.report_status as enum ('draft', 'published');
create type public.report_item_kind as enum ('work_done', 'recommendation');
create type public.plan_tier as enum ('free', 'solo', 'studio');
create type public.billing_interval as enum ('month', 'year');
create type public.subscription_status as enum (
  'active',
  'trialing',
  'past_due',
  'cancelled',
  'expired',
  'on_hold',
  'failed',
  'incomplete'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 3 and 40),
  logo_url text,
  brand_color text not null default '#1f6b45' check (brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  report_footer text check (report_footer is null or char_length(report_footer) <= 280),
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null check (char_length(email) between 3 and 200),
  token uuid not null default gen_random_uuid() unique,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index workspace_invites_open_email
  on public.workspace_invites (workspace_id, email)
  where accepted_at is null;

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  contact_email text check (contact_email is null or char_length(contact_email) <= 200),
  created_at timestamptz not null default now()
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  url text not null check (char_length(url) between 4 and 2000),
  hostname text not null check (char_length(hostname) between 1 and 253),
  platform public.site_platform not null,
  last_uptime_at timestamptz,
  last_ssl_at timestamptz,
  last_domain_at timestamptz,
  last_pagespeed_at timestamptz,
  last_crawl_at timestamptz,
  alert_down_at timestamptz,
  alert_ssl_at timestamptz,
  alert_domain_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, url)
);

create index sites_workspace_idx on public.sites (workspace_id);
create index sites_client_idx on public.sites (client_id);

create table public.check_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  kind public.job_kind not null,
  url text,
  payload jsonb not null default '{}'::jsonb,
  run_after timestamptz not null default now(),
  status public.job_status not null default 'pending',
  attempts int not null default 0 check (attempts >= 0),
  last_error text,
  locked_at timestamptz,
  created_at timestamptz not null default now()
);

create index check_jobs_pending_idx
  on public.check_jobs (run_after, created_at)
  where status = 'pending';

create index check_jobs_site_idx on public.check_jobs (site_id, status);

create table public.check_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  kind public.check_kind not null,
  ok boolean not null,
  status_code int,
  latency_ms int,
  expires_at timestamptz,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index check_runs_site_idx on public.check_runs (site_id, kind, created_at desc);

create table public.pagespeed_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  strategy text not null default 'mobile',
  performance int,
  seo int,
  accessibility int,
  best_practices int,
  lcp_ms int,
  inp_ms int,
  cls double precision,
  raw_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index pagespeed_site_idx on public.pagespeed_snapshots (site_id, created_at desc);

create table public.link_checks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  pages_crawled int not null default 0 check (pages_crawled >= 0),
  broken jsonb not null default '[]'::jsonb,
  crawl_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index link_checks_site_idx on public.link_checks (site_id, created_at desc);

create table public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  site_id uuid references public.sites (id) on delete set null,
  period_start date not null,
  status public.report_status not null default 'draft',
  share_token uuid not null default gen_random_uuid() unique,
  summary text not null default '',
  uptime_ratio double precision,
  brand_name text,
  brand_color text,
  logo_url text,
  show_watermark boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (site_id, period_start)
);

create index monthly_reports_workspace_idx on public.monthly_reports (workspace_id, period_start desc);

create table public.report_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  report_id uuid not null references public.monthly_reports (id) on delete cascade,
  kind public.report_item_kind not null,
  title text not null check (char_length(title) between 1 and 140),
  body text check (body is null or char_length(body) <= 2000),
  price_cents int check (price_cents is null or (price_cents >= 0 and price_cents <= 100000000)),
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create index report_items_report_idx on public.report_items (report_id, sort);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  provider text not null check (provider in ('dodo', 'stripe')),
  provider_customer_id text,
  provider_subscription_id text not null,
  plan public.plan_tier not null,
  interval public.billing_interval not null default 'month',
  status public.subscription_status not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subscription_id)
);

create index subscriptions_workspace_idx on public.subscriptions (workspace_id, updated_at desc);

create table public.webhook_events (
  provider text not null,
  event_id text not null,
  received_at timestamptz not null default now(),
  primary key (provider, event_id)
);

create table public.tool_rate_limits (
  ip_hash text not null,
  window_start timestamptz not null,
  hits int not null default 0 check (hits >= 0),
  primary key (ip_hash, window_start)
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  kind text not null,
  sent boolean not null default false,
  detail text,
  created_at timestamptz not null default now()
);

create index alerts_workspace_idx on public.alerts (workspace_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Privileged columns cannot be changed with a user JWT
-- ---------------------------------------------------------------------------

create or replace function public.protect_workspace_privileged()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') = 'authenticated' then
    new.trial_ends_at := old.trial_ends_at;
  end if;
  return new;
end;
$$;

create trigger workspaces_protect_privileged
  before update on public.workspaces
  for each row execute function public.protect_workspace_privileged();

create or replace function public.protect_report_snapshot()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') = 'authenticated' then
    new.show_watermark := old.show_watermark;
    new.brand_name := old.brand_name;
    new.brand_color := old.brand_color;
    new.logo_url := old.logo_url;
    new.uptime_ratio := old.uptime_ratio;
    new.share_token := old.share_token;
    new.workspace_id := old.workspace_id;
    new.site_id := old.site_id;
    new.client_id := old.client_id;
    new.period_start := old.period_start;
  end if;
  return new;
end;
$$;

create trigger monthly_reports_protect_snapshot
  before update on public.monthly_reports
  for each row execute function public.protect_report_snapshot();

-- ---------------------------------------------------------------------------
-- Signup: one workspace, owner membership, 14-day Studio trial, no card
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw text;
  base_slug text;
  final_slug text;
  studio_name text;
  ws_id uuid;
  n int := 0;
begin
  raw := coalesce(
    nullif(trim(new.raw_user_meta_data->>'studio_name'), ''),
    split_part(new.email, '@', 1),
    'studio'
  );
  studio_name := left(raw, 80);
  base_slug := left(trim(both '-' from lower(regexp_replace(raw, '[^a-zA-Z0-9]+', '-', 'g'))), 24);
  if base_slug is null or char_length(base_slug) < 3 then
    base_slug := 'studio';
  end if;
  final_slug := base_slug;
  while exists (select 1 from public.workspaces where slug = final_slug) loop
    n := n + 1;
    final_slug := left(base_slug, 20) || '-' || n::text;
  end loop;

  insert into public.workspaces (name, slug, trial_ends_at)
  values (studio_name, final_slug, now() + interval '14 days')
  returning id into ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Plan resolution (kept in lockstep with src/lib/plans.ts)
-- active, trialing, past_due grant access. cancelled grants access until period end.
-- Otherwise an unexpired trial is Studio. Otherwise free.
-- ---------------------------------------------------------------------------

create or replace function public.effective_plan(p_workspace uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  sub_plan text;
  sub_status text;
  sub_end timestamptz;
  trial timestamptz;
begin
  select s.plan::text, s.status::text, s.current_period_end
    into sub_plan, sub_status, sub_end
  from public.subscriptions s
  where s.workspace_id = p_workspace
    and (
      s.status in ('active', 'trialing', 'past_due')
      or (s.status = 'cancelled' and s.current_period_end is not null and s.current_period_end > now())
    )
  order by s.updated_at desc
  limit 1;

  if sub_plan is not null then
    return sub_plan;
  end if;

  select w.trial_ends_at into trial from public.workspaces w where w.id = p_workspace;
  if trial is not null and trial > now() then
    return 'studio';
  end if;
  return 'free';
end;
$$;

create or replace function public.insert_site(
  p_workspace uuid,
  p_client uuid,
  p_url text,
  p_hostname text,
  p_platform public.site_platform
)
returns public.sites
language plpgsql
security definer
set search_path = public
as $$
declare
  lim int;
  current_count int;
  plan text;
  row public.sites;
begin
  if not exists (
    select 1 from public.clients c
    where c.id = p_client and c.workspace_id = p_workspace
  ) then
    raise exception 'client not in workspace';
  end if;

  perform 1 from public.workspaces where id = p_workspace for update;

  select count(*) into current_count from public.sites where workspace_id = p_workspace;
  plan := public.effective_plan(p_workspace);
  lim := case plan when 'studio' then 50 when 'solo' then 15 else 2 end;
  if current_count >= lim then
    raise exception 'site limit reached for % plan', plan;
  end if;

  insert into public.sites (workspace_id, client_id, url, hostname, platform)
  values (p_workspace, p_client, p_url, p_hostname, p_platform)
  returning * into row;

  return row;
end;
$$;

create or replace function public.create_invite(p_workspace uuid, p_email text)
returns public.workspace_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  plan text;
  seats int;
  members int;
  pending int;
  row public.workspace_invites;
  clean_email text := lower(trim(p_email));
begin
  perform 1 from public.workspaces where id = p_workspace for update;
  plan := public.effective_plan(p_workspace);
  seats := case plan when 'studio' then 3 else 1 end;

  select count(*) into members from public.workspace_members where workspace_id = p_workspace;
  select count(*) into pending
  from public.workspace_invites
  where workspace_id = p_workspace and accepted_at is null and expires_at > now();

  if members + pending >= seats then
    raise exception 'seat limit reached';
  end if;

  insert into public.workspace_invites (workspace_id, email)
  values (p_workspace, clean_email)
  returning * into row;

  return row;
end;
$$;

create or replace function public.accept_invite(p_token uuid, p_user uuid, p_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.workspace_invites;
  seats int;
  members int;
  plan text;
begin
  select * into inv from public.workspace_invites where token = p_token for update;
  if inv.id is null then
    raise exception 'invite not found';
  end if;
  if inv.accepted_at is not null then
    raise exception 'invite already used';
  end if;
  if inv.expires_at < now() then
    raise exception 'invite expired';
  end if;
  if lower(inv.email) <> lower(trim(p_email)) then
    raise exception 'invite email mismatch';
  end if;

  if exists (
    select 1 from public.workspace_members
    where workspace_id = inv.workspace_id and user_id = p_user
  ) then
    update public.workspace_invites set accepted_at = now() where id = inv.id;
    return inv.workspace_id;
  end if;

  perform 1 from public.workspaces where id = inv.workspace_id for update;
  plan := public.effective_plan(inv.workspace_id);
  seats := case plan when 'studio' then 3 else 1 end;
  select count(*) into members from public.workspace_members where workspace_id = inv.workspace_id;
  if members >= seats then
    raise exception 'seat limit reached';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (inv.workspace_id, p_user, 'member');

  update public.workspace_invites set accepted_at = now() where id = inv.id;
  return inv.workspace_id;
end;
$$;

create or replace function public.claim_check_jobs(batch_size int, site_filter uuid default null)
returns setof public.check_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  batch_size := least(greatest(coalesce(batch_size, 1), 1), 8);

  update public.check_jobs
  set status = 'pending', locked_at = null
  where status = 'running'
    and locked_at is not null
    and locked_at < now() - interval '15 minutes';

  return query
  update public.check_jobs as job
  set status = 'running',
      locked_at = now(),
      attempts = job.attempts + 1
  from (
    select id
    from public.check_jobs
    where status = 'pending'
      and run_after <= now()
      and (site_filter is null or site_id = site_filter)
    order by run_after, created_at
    limit batch_size
    for update skip locked
  ) as picked
  where job.id = picked.id
  returning job.*;
end;
$$;

create or replace function public.bump_tool_rate(p_hash text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  bucket timestamptz := to_timestamp(floor(extract(epoch from now()) / 3600) * 3600);
  current_hits int;
begin
  if p_hash is null or char_length(p_hash) < 16 then
    raise exception 'bad hash';
  end if;

  delete from public.tool_rate_limits where window_start < now() - interval '2 days';

  insert into public.tool_rate_limits as existing (ip_hash, window_start, hits)
  values (p_hash, bucket, 1)
  on conflict (ip_hash, window_start)
  do update set hits = existing.hits + 1
  returning hits into current_hits;

  return current_hits;
end;
$$;

-- ---------------------------------------------------------------------------
-- Access for the API roles. Service role writes. Members read.
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
grant select on
  public.workspaces,
  public.workspace_members,
  public.workspace_invites,
  public.clients,
  public.sites,
  public.check_jobs,
  public.check_runs,
  public.pagespeed_snapshots,
  public.link_checks,
  public.monthly_reports,
  public.report_items,
  public.subscriptions,
  public.alerts
to authenticated;

grant all privileges on all tables in schema public to service_role;

revoke all on function public.effective_plan(uuid) from public, anon, authenticated;
revoke all on function public.insert_site(uuid, uuid, text, text, public.site_platform) from public, anon, authenticated;
revoke all on function public.create_invite(uuid, text) from public, anon, authenticated;
revoke all on function public.accept_invite(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.claim_check_jobs(int, uuid) from public, anon, authenticated;
revoke all on function public.bump_tool_rate(text) from public, anon, authenticated;

grant execute on function public.effective_plan(uuid) to service_role;
grant execute on function public.insert_site(uuid, uuid, text, text, public.site_platform) to service_role;
grant execute on function public.create_invite(uuid, text) to service_role;
grant execute on function public.accept_invite(uuid, uuid, text) to service_role;
grant execute on function public.claim_check_jobs(int, uuid) to service_role;
grant execute on function public.bump_tool_rate(text) to service_role;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

create schema if not exists private;

create or replace function private.is_member(wid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = wid
      and m.user_id = auth.uid()
  );
$$;

revoke all on function private.is_member(uuid) from public, anon;
grant execute on function private.is_member(uuid) to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invites enable row level security;
alter table public.clients enable row level security;
alter table public.sites enable row level security;
alter table public.check_jobs enable row level security;
alter table public.check_runs enable row level security;
alter table public.pagespeed_snapshots enable row level security;
alter table public.link_checks enable row level security;
alter table public.monthly_reports enable row level security;
alter table public.report_items enable row level security;
alter table public.subscriptions enable row level security;
alter table public.webhook_events enable row level security;
alter table public.tool_rate_limits enable row level security;
alter table public.alerts enable row level security;

create policy workspaces_select on public.workspaces
  for select to authenticated using (private.is_member(id));

create policy members_select on public.workspace_members
  for select to authenticated using (private.is_member(workspace_id));

create policy invites_select on public.workspace_invites
  for select to authenticated using (private.is_member(workspace_id));

create policy clients_select on public.clients
  for select to authenticated using (private.is_member(workspace_id));

create policy sites_select on public.sites
  for select to authenticated using (private.is_member(workspace_id));

create policy jobs_select on public.check_jobs
  for select to authenticated using (private.is_member(workspace_id));

create policy runs_select on public.check_runs
  for select to authenticated using (private.is_member(workspace_id));

create policy psi_select on public.pagespeed_snapshots
  for select to authenticated using (private.is_member(workspace_id));

create policy links_select on public.link_checks
  for select to authenticated using (private.is_member(workspace_id));

create policy reports_select on public.monthly_reports
  for select to authenticated using (private.is_member(workspace_id));

create policy items_select on public.report_items
  for select to authenticated using (private.is_member(workspace_id));

create policy subs_select on public.subscriptions
  for select to authenticated using (private.is_member(workspace_id));

create policy alerts_select on public.alerts
  for select to authenticated using (private.is_member(workspace_id));

-- No policies on webhook_events or tool_rate_limits: service role only.

-- ---------------------------------------------------------------------------
-- Logo bucket. Path is {workspace_id}/logo.ext
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'branding',
  'branding',
  true,
  1048576,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy branding_public_read on storage.objects
  for select to public
  using (bucket_id = 'branding');

create policy branding_member_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'branding'
    and private.is_member(((storage.foldername(name))[1])::uuid)
  );

create policy branding_member_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'branding'
    and private.is_member(((storage.foldername(name))[1])::uuid)
  );

create policy branding_member_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'branding'
    and private.is_member(((storage.foldername(name))[1])::uuid)
  );
