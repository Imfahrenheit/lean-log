-- MCP per-user API keys
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  hashed_key text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz null,
  revoked_at timestamptz null
);

create index if not exists api_keys_user_id_idx on public.api_keys (user_id);
create unique index if not exists api_keys_user_name_unique
  on public.api_keys (user_id, name) where revoked_at is null;

alter table public.api_keys enable row level security;

-- RLS policies (conservative initial set):
-- Allow users to manage their own key metadata via authenticated session.
-- Note: exposing hashed_key is undesirable; consider a view for safe listing later.
create policy "api_keys_select_own" on public.api_keys
  for select using (auth.uid() = user_id);

create policy "api_keys_modify_own" on public.api_keys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


