-- YDP Mentorship Hub — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- It creates the `matches` table (one row per mentee↔mentor pairing),
-- mirroring the columns from the matches Google Sheet, plus a dedicated
-- numeric `pair_score` column.

create table if not exists public.matches (
  match_id                     text primary key,
  mentee_id                    text not null,
  mentee_name                  text not null,
  mentee_email                 text,
  mentor_id                    text not null,
  mentor_name                  text not null,
  mentor_email                 text,
  track                        text,
  match_status                 text,
  active_status                text,
  start_date                   date,
  last_check_in_date           date,
  missed_sessions_count        integer not null default 0,
  feedback_completion_count    integer not null default 0,
  mentor_rating_average        numeric,
  risk_status                  text,
  notes                        text,
  -- Dedicated score (0–100). Populate from the sheet, or from the number in
  -- the Notes text ("Total pair score: 97") during import.
  pair_score                   integer,
  mentee_match_email_status    text,
  mentee_match_email_sent_at   timestamptz,
  mentor_match_email_status    text,
  mentor_match_email_sent_at   timestamptz,
  match_email_last_error       text,
  created_at                   timestamptz not null default now()
);

-- Fast lookups by mentee and mentor.
create index if not exists matches_mentee_id_idx on public.matches (mentee_id);
create index if not exists matches_mentor_id_idx on public.matches (mentor_id);
create index if not exists matches_track_idx     on public.matches (track);

-- Row Level Security: allow the public anon key to READ matches only.
-- (No insert/update/delete from the browser — manage data in Supabase.)
alter table public.matches enable row level security;

drop policy if exists "Public read access" on public.matches;
create policy "Public read access"
  on public.matches
  for select
  to anon
  using (true);

-- Optional helper: backfill pair_score from the Notes text where it's null.
-- update public.matches
--   set pair_score = (regexp_match(notes, 'pair score:\s*(\d+)', 'i'))[1]::int
--   where pair_score is null and notes ~* 'pair score:\s*\d+';
