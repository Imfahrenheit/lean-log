-- Change invites from code-based to email-based
-- Drop the code column and add email column

-- First, drop the old function
drop function if exists public.mark_invite_used(text, uuid);

-- Drop old indexes that reference code
drop index if exists public.invites_code_idx;
drop index if exists public.invites_unused_idx;

-- Delete any existing invites (since they're code-based and can't be migrated)
-- This is safe because we're transitioning to a new system
delete from public.invites;

-- Drop the code column
alter table public.invites
drop column if exists code;

-- Add email column (not null)
alter table public.invites
add column if not exists email text not null;

-- Add unique constraint on email (only for unused, non-revoked invites)
create unique index if not exists invites_email_unique_active
on public.invites (lower(email))
where used_at is null and revoked_at is null;

-- Index for email lookups
create index if not exists invites_email_idx on public.invites (lower(email));

-- Index for checking unused invites by email
create index if not exists invites_unused_email_idx on public.invites (lower(email), used_at, revoked_at, expires_at) 
  where used_at is null and revoked_at is null;

-- Update RLS policy for public validation to check by email
drop policy if exists invites_select_public_validation on public.invites;
create policy invites_select_public_validation on public.invites for select
  using (
    used_at is null 
    and revoked_at is null 
    and (expires_at is null or expires_at > now())
  );

-- Create new function to mark invite as used by email
create or replace function public.mark_invite_used_by_email(
  invite_email text,
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
  -- Find the invite by email (case-insensitive)
  select * into invite_record
  from public.invites
  where lower(email) = lower(invite_email)
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

