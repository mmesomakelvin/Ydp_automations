-- YDP Mentorship Hub — access control
-- Run in the Supabase SQL Editor AFTER schema.sql and seed.sql.
--
-- BEFORE RUNNING: replace CHANGE_ME_TO_YOUR_PASSWORD below with the password
-- you'll share with the cohort in the Tuesday email.
--
-- What this does: removes public read access to `matches`, and exposes the data
-- only through a function that requires the password. Without it, the API
-- returns nothing — the gate is enforced in the database, not in the browser.

create extension if not exists pgcrypto;

-- Password store. RLS is on with no policies, so the anon key can never read
-- this table — the hash is only reachable from inside the function below.
create table if not exists public.app_config (
  key   text primary key,
  value text not null
);
alter table public.app_config enable row level security;

insert into public.app_config (key, value)
values ('site_password', crypt('CHANGE_ME_TO_YOUR_PASSWORD', gen_salt('bf')))
on conflict (key) do update set value = excluded.value;

-- Remove the open read policy from seed time. With RLS enabled and no policy,
-- direct reads of public.matches by the anon key now return zero rows.
drop policy if exists "Public read access" on public.matches;

-- The only way in. SECURITY DEFINER lets this run as the owner (bypassing RLS)
-- but only after the password check passes.
create or replace function public.get_matches(p_password text)
returns setof public.matches
language plpgsql
security definer
set search_path = public
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
