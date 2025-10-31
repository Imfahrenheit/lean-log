-- Add admin field to profiles table
alter table public.profiles
add column if not exists is_admin boolean not null default false;

-- Create index for admin lookups (useful for checking admin status)
create index if not exists profiles_is_admin_idx on public.profiles (is_admin) where is_admin = true;

-- Note: RLS policies remain unchanged
-- Users can still only read their own profile, but the is_admin field
-- is accessible to them (though app logic will restrict admin features server-side)
