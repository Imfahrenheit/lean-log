-- Invites table for invite-only authentication
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for code lookups
create index if not exists invites_code_idx on public.invites (code) where revoked_at is null;
-- Index for creator lookups
create index if not exists invites_created_by_idx on public.invites (created_by);
-- Index for checking unused invites
create index if not exists invites_unused_idx on public.invites (code, used_at, revoked_at, expires_at) 
  where used_at is null and revoked_at is null;

drop trigger if exists trg_invites_updated_at on public.invites;
create trigger trg_invites_updated_at
before update on public.invites
for each row execute procedure public.set_updated_at();

-- RLS enablement
alter table public.invites enable row level security;

-- RLS policies
-- Users can view invites they created
drop policy if exists invites_select_own on public.invites;
create policy invites_select_own on public.invites for select
  using (created_by = auth.uid());

-- Allow anonymous users to validate invite codes (for signup flow)
-- This is needed so unauthenticated users can check if an invite code is valid
drop policy if exists invites_select_public_validation on public.invites;
create policy invites_select_public_validation on public.invites for select
  using (
    used_at is null 
    and revoked_at is null 
    and (expires_at is null or expires_at > now())
  );

-- Users can insert invites (they become the creator)
drop policy if exists invites_insert_own on public.invites;
create policy invites_insert_own on public.invites for insert
  with check (created_by = auth.uid());

-- Only creators can update their invites (to revoke)
drop policy if exists invites_update_own on public.invites;
create policy invites_update_own on public.invites for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- Service role can mark invites as used (via server-side function)
-- This will be done through a security definer function

-- Function to mark invite as used (callable by service role)
create or replace function public.mark_invite_used(
  invite_code text,
  user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_record public.invites;
begin
  -- Find the invite
  select * into invite_record
  from public.invites
  where code = invite_code
    and used_at is null
    and revoked_at is null
    and (expires_at is null or expires_at > now())
  limit 1;

  -- If invite not found or already used, return false
  if invite_record.id is null then
    return false;
  end if;

  -- Mark as used
  update public.invites
  set used_by = user_id,
      used_at = now(),
      updated_at = now()
  where id = invite_record.id;

  return true;
end;
$$;

