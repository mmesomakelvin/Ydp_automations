-- YDP Mentorship Hub — access control
-- Run in the Supabase SQL Editor AFTER schema.sql and seed.sql.
--
-- What this does: removes public read access to `matches`, and exposes the data
-- only through a function that requires a password. Without it, the API returns
-- nothing — the gate is enforced in the database, not in the browser.
--
-- NOTE: this file never contains the real password. It seeds an unusable
-- placeholder; you set the actual password afterwards by running set-password.sql
-- (untracked) in the SQL Editor. Keep it that way — this file is public on GitHub.

create extension if not exists pgcrypto;

-- Password store. RLS is on with no policies, so the anon key can never read
-- this table — the hash is only reachable from inside the function below.
create table if not exists public.app_config (
  key   text primary key,
  value text not null
);
alter table public.app_config enable row level security;

-- Seeds a deliberately unusable placeholder. Set the real password with
-- set-password.sql — never by editing this line.
insert into public.app_config (key, value)
values ('site_password', crypt(gen_random_uuid()::text, gen_salt('bf')))
on conflict (key) do nothing;

-- Remove the open read policy from seed time. With RLS enabled and no policy,
-- direct reads of public.matches by the anon key now return zero rows.
drop policy if exists "Public read access" on public.matches;

-- The only way in. SECURITY DEFINER lets this run as the owner (bypassing RLS)
-- but only after the password check passes.
create or replace function public.get_matches(p_password text)
returns setof public.matches
language plpgsql
security definer
-- `extensions` must be on the path: Supabase installs pgcrypto there, so
-- crypt() is not resolvable from a search_path pinned to public alone.
set search_path = public, extensions
as $$
begin
  if not exists (
    select 1 from public.app_config
    where key = 'site_password'
      and value = crypt(p_password, value)
  ) then
    raise exception 'Invalid password';
  end if;

  return query select * from public.matches;
end;
$$;

grant execute on function public.get_matches(text) to anon;

-- To change the password later, run just this with a new value:
-- update public.app_config
--   set value = crypt('YOUR_NEW_PASSWORD', gen_salt('bf'))
--   where key = 'site_password';
