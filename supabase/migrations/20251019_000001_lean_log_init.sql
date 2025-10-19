-- Lean Log baseline schema (tables, indexes, RLS, triggers)
-- Safe to run multiple times in isolated environments

-- Extensions
create extension if not exists pgcrypto with schema public;

-- Enums
do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where t.typname = 'sex' and n.nspname = 'public') then
    create type public.sex as enum ('male','female');
  end if;
end $$;

-- Helper: updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  age integer,
  sex public.sex,
  height_cm integer,
  current_weight_kg numeric(6,2),
  goal_weight_kg numeric(6,2),
  target_calories integer,
  suggested_calories integer,
  activity_factor numeric(3,2),
  deficit_choice integer,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- user_settings
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text,
  units text,
  suggested_calories_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at
before update on public.user_settings
for each row execute procedure public.set_updated_at();

-- meals (template per user)
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  order_index integer not null default 0,
  target_protein_g integer,
  target_carbs_g integer,
  target_fat_g integer,
  target_calories integer,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- unique (user_id, name) for active meals only
create unique index if not exists meals_user_name_active_uidx
  on public.meals (user_id, name)
  where archived = false;
drop trigger if exists trg_meals_updated_at on public.meals;
create trigger trg_meals_updated_at
before update on public.meals
for each row execute procedure public.set_updated_at();

-- day_logs
create table if not exists public.day_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  target_calories_override integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);
drop trigger if exists trg_day_logs_updated_at on public.day_logs;
create trigger trg_day_logs_updated_at
before update on public.day_logs
for each row execute procedure public.set_updated_at();

-- meal_entries
create table if not exists public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  day_log_id uuid not null references public.day_logs(id) on delete cascade,
  meal_id uuid references public.meals(id) on delete set null,
  name text not null,
  protein_g integer not null default 0,
  carbs_g integer not null default 0,
  fat_g integer not null default 0,
  calories_override integer,
  order_index integer not null default 0,
  calories_calculated integer generated always as ((protein_g*4) + (carbs_g*4) + (fat_g*9)) stored,
  total_calories integer generated always as (coalesce(calories_override, (protein_g*4) + (carbs_g*4) + (fat_g*9))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists meal_entries_day_meal_order_idx
  on public.meal_entries (day_log_id, meal_id, order_index);
drop trigger if exists trg_meal_entries_updated_at on public.meal_entries;
create trigger trg_meal_entries_updated_at
before update on public.meal_entries
for each row execute procedure public.set_updated_at();

-- weight_entries
create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  weight_kg numeric(6,2) not null,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists weight_entries_user_date_idx
  on public.weight_entries (user_id, entry_date);
drop trigger if exists trg_weight_entries_updated_at on public.weight_entries;
create trigger trg_weight_entries_updated_at
before update on public.weight_entries
for each row execute procedure public.set_updated_at();

-- meal_order_snapshots
create table if not exists public.meal_order_snapshots (
  id uuid primary key default gen_random_uuid(),
  day_log_id uuid not null references public.day_logs(id) on delete cascade,
  meals_order jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists meal_order_snapshots_day_idx
  on public.meal_order_snapshots (day_log_id);

-- export_jobs
create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued',
  storage_path text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists export_jobs_user_status_idx
  on public.export_jobs (user_id, status, created_at);
drop trigger if exists trg_export_jobs_updated_at on public.export_jobs;
create trigger trg_export_jobs_updated_at
before update on public.export_jobs
for each row execute procedure public.set_updated_at();

-- import_jobs
create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued',
  storage_path text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists import_jobs_user_status_idx
  on public.import_jobs (user_id, status, created_at);
drop trigger if exists trg_import_jobs_updated_at on public.import_jobs;
create trigger trg_import_jobs_updated_at
before update on public.import_jobs
for each row execute procedure public.set_updated_at();

-- sync_events (for offline reconciliation)
create table if not exists public.sync_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  status text not null default 'queued',
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sync_events_user_status_idx
  on public.sync_events (user_id, status, created_at);
drop trigger if exists trg_sync_events_updated_at on public.sync_events;
create trigger trg_sync_events_updated_at
before update on public.sync_events
for each row execute procedure public.set_updated_at();

-- RLS enablement
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.meals enable row level security;
alter table public.day_logs enable row level security;
alter table public.meal_entries enable row level security;
alter table public.weight_entries enable row level security;
alter table public.meal_order_snapshots enable row level security;
alter table public.export_jobs enable row level security;
alter table public.import_jobs enable row level security;
alter table public.sync_events enable row level security;

-- RLS policies
-- profiles
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles for select
  using (id = auth.uid());
drop policy if exists profiles_modify_self on public.profiles;
create policy profiles_modify_self on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

-- user_settings
drop policy if exists user_settings_select_self on public.user_settings;
create policy user_settings_select_self on public.user_settings for select
  using (user_id = auth.uid());
drop policy if exists user_settings_modify_self on public.user_settings;
create policy user_settings_modify_self on public.user_settings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- meals
drop policy if exists meals_select_self on public.meals;
create policy meals_select_self on public.meals for select
  using (user_id = auth.uid());
drop policy if exists meals_modify_self on public.meals;
create policy meals_modify_self on public.meals for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- day_logs
drop policy if exists day_logs_select_self on public.day_logs;
create policy day_logs_select_self on public.day_logs for select
  using (user_id = auth.uid());
drop policy if exists day_logs_modify_self on public.day_logs;
create policy day_logs_modify_self on public.day_logs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- meal_entries (joins to day_logs for ownership)
drop policy if exists meal_entries_select_self on public.meal_entries;
create policy meal_entries_select_self on public.meal_entries for select
  using (exists (
    select 1 from public.day_logs dl where dl.id = meal_entries.day_log_id and dl.user_id = auth.uid()
  ));
drop policy if exists meal_entries_insert_self on public.meal_entries;
create policy meal_entries_insert_self on public.meal_entries for insert
  with check (
    exists (select 1 from public.day_logs dl where dl.id = meal_entries.day_log_id and dl.user_id = auth.uid())
    and (meal_entries.meal_id is null or exists (select 1 from public.meals m where m.id = meal_entries.meal_id and m.user_id = auth.uid()))
  );
drop policy if exists meal_entries_modify_self on public.meal_entries;
create policy meal_entries_modify_self on public.meal_entries for update using (
  exists (select 1 from public.day_logs dl where dl.id = meal_entries.day_log_id and dl.user_id = auth.uid())
) with check (
  exists (select 1 from public.day_logs dl where dl.id = meal_entries.day_log_id and dl.user_id = auth.uid())
);
drop policy if exists meal_entries_delete_self on public.meal_entries;
create policy meal_entries_delete_self on public.meal_entries for delete using (
  exists (select 1 from public.day_logs dl where dl.id = meal_entries.day_log_id and dl.user_id = auth.uid())
);

-- weight_entries
drop policy if exists weight_entries_select_self on public.weight_entries;
create policy weight_entries_select_self on public.weight_entries for select
  using (user_id = auth.uid());
drop policy if exists weight_entries_modify_self on public.weight_entries;
create policy weight_entries_modify_self on public.weight_entries for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- meal_order_snapshots (join to day_logs)
drop policy if exists meal_order_snapshots_select_self on public.meal_order_snapshots;
create policy meal_order_snapshots_select_self on public.meal_order_snapshots for select
  using (exists (select 1 from public.day_logs dl where dl.id = meal_order_snapshots.day_log_id and dl.user_id = auth.uid()));
drop policy if exists meal_order_snapshots_modify_self on public.meal_order_snapshots;
create policy meal_order_snapshots_modify_self on public.meal_order_snapshots for all
  using (exists (select 1 from public.day_logs dl where dl.id = meal_order_snapshots.day_log_id and dl.user_id = auth.uid()))
  with check (exists (select 1 from public.day_logs dl where dl.id = meal_order_snapshots.day_log_id and dl.user_id = auth.uid()));

-- export/import jobs
drop policy if exists export_jobs_select_self on public.export_jobs;
create policy export_jobs_select_self on public.export_jobs for select
  using (user_id = auth.uid());
drop policy if exists export_jobs_modify_self on public.export_jobs;
create policy export_jobs_modify_self on public.export_jobs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists import_jobs_select_self on public.import_jobs;
create policy import_jobs_select_self on public.import_jobs for select
  using (user_id = auth.uid());
drop policy if exists import_jobs_modify_self on public.import_jobs;
create policy import_jobs_modify_self on public.import_jobs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- sync_events
drop policy if exists sync_events_select_self on public.sync_events;
create policy sync_events_select_self on public.sync_events for select
  using (user_id = auth.uid());
drop policy if exists sync_events_modify_self on public.sync_events;
create policy sync_events_modify_self on public.sync_events for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Bootstrap: create profile and settings on new auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  insert into public.user_settings (user_id, theme, units)
  values (new.id, 'system', 'metric')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
  end if;
end $$;


