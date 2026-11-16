-- FraudFenceAI schema. Run once in Supabase SQL Editor (safe to re-run).
create extension if not exists pgcrypto;

-- ---------- Tables ----------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My organization',
  plan text not null default 'trial' check (plan in ('trial','starter','growth','scale')),
  plan_status text not null default 'trialing' check (plan_status in ('trialing','active','past_due','canceled')),
  current_period_end timestamptz,
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  review_threshold int not null default 40 check (review_threshold between 1 and 100),
  decline_threshold int not null default 75 check (decline_threshold between 1 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);
create index if not exists profiles_email_idx on public.profiles (lower(email));

create table if not exists public.members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','analyst')),
  primary key (org_id, user_id)
);
create index if not exists members_user_idx on public.members (user_id);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  ref text not null,
  name text,
  email text,
  country text,
  is_pep boolean not null default false,
  sanctions_hit boolean not null default false,
  risk_score int not null default 0,
  risk_level text not null default 'low' check (risk_level in ('low','medium','high')),
  created_at timestamptz not null default now(),
  unique (org_id, ref)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  customer_ref text,
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'USD',
  channel text not null default 'card',
  email text,
  ip text,
  ip_country text,
  billing_country text,
  device_id text,
  merchant text,
  occurred_at timestamptz not null default now(),
  risk_score int not null,
  decision text not null check (decision in ('approve','review','decline')),
  reasons jsonb not null default '[]',
  source text not null default 'dashboard',
  created_at timestamptz not null default now()
);
create index if not exists tx_org_time_idx on public.transactions (org_id, occurred_at desc);
create index if not exists tx_org_customer_idx on public.transactions (org_id, customer_ref, occurred_at desc);
create index if not exists tx_org_device_idx on public.transactions (org_id, device_id);

create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  field text not null,
  op text not null check (op in ('gt','gte','lt','lte','eq','neq','in','contains')),
  value text not null,
  points int not null default 20 check (points between 0 and 100),
  action text not null default 'flag' check (action in ('flag','review','decline')),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.watchlist_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  list_name text not null default 'Custom',
  entry_type text not null check (entry_type in ('sanctions','pep','email','device','ip')),
  value text not null,
  country text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists wl_org_type_idx on public.watchlist_entries (org_id, entry_type);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  title text not null,
  status text not null default 'open' check (status in ('open','investigating','resolved_fraud','resolved_legit')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  ai_summary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cases_org_idx on public.cases (org_id, created_at desc);

create table if not exists public.case_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null check (kind in ('ai_investigation')),
  created_at timestamptz not null default now()
);
create index if not exists usage_org_idx on public.usage_events (org_id, kind, created_at);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete set null,
  email text,
  amount numeric(10,2),
  plan text,
  status text not null default 'received' check (status in ('received','activated','unmatched')),
  raw jsonb,
  created_at timestamptz not null default now()
);

-- ---------- Helper + RLS ----------
create or replace function public.is_member(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members m where m.org_id = o and m.user_id = auth.uid());
$$;

do $$
declare t text;
begin
  foreach t in array array['organizations','profiles','members','customers','transactions','rules',
    'watchlist_entries','cases','case_notes','usage_events','api_keys','payments']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

drop policy if exists org_select on public.organizations;
create policy org_select on public.organizations for select using (public.is_member(id));
drop policy if exists org_update on public.organizations;
create policy org_update on public.organizations for update using (public.is_member(id)) with check (public.is_member(id));

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for select using (id = auth.uid());

drop policy if exists members_select on public.members;
create policy members_select on public.members for select using (user_id = auth.uid());

-- Tenant tables: members may read/write rows of their own org only.
do $$
declare t text;
begin
  foreach t in array array['customers','transactions','rules','watchlist_entries','cases','case_notes','usage_events','api_keys']
  loop
    execute format('drop policy if exists tenant_all on public.%I', t);
    execute format('create policy tenant_all on public.%I for all using (public.is_member(org_id)) with check (public.is_member(org_id))', t);
  end loop;
end $$;
-- payments: no policy => only the service role can read/write.

-- Plan/billing columns may only be changed by the service role (webhook/admin) or SQL editor.
create or replace function public.protect_billing_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') in ('authenticated','anon') then
    if new.plan is distinct from old.plan
       or new.plan_status is distinct from old.plan_status
       or new.current_period_end is distinct from old.current_period_end
       or new.trial_ends_at is distinct from old.trial_ends_at then
      raise exception 'billing fields can only be changed by the billing system';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists protect_billing on public.organizations;
create trigger protect_billing before update on public.organizations
  for each row execute function public.protect_billing_columns();

-- Usage events are written by the server on behalf of members; keep them append-only for members.
drop policy if exists tenant_all on public.usage_events;
drop policy if exists usage_select on public.usage_events;
drop policy if exists usage_insert on public.usage_events;
create policy usage_select on public.usage_events for select using (public.is_member(org_id));
create policy usage_insert on public.usage_events for insert with check (public.is_member(org_id));

-- ---------- Signup bootstrap ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare o uuid;
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  insert into public.organizations (name)
    values (coalesce(nullif(new.raw_user_meta_data->>'company',''), 'My organization'))
    returning id into o;
  insert into public.members (org_id, user_id, role) values (o, new.id, 'owner');
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
