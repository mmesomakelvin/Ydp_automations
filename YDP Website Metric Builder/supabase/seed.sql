-- YDP Mentorship Hub — seed data
-- Generated from the "Matched Pairs" tab of the YDP Matching Automation sheet.
-- Run in the Supabase SQL Editor AFTER schema.sql.
--
-- Safe to re-run: rows upsert on match_id, so regenerating this file after the
-- matching script finishes will update existing pairs rather than erroring.
--
-- pair_score is extracted from the Notes text ("Total pair score: 97.").

insert into public.matches (
  match_id, mentee_id, mentee_name, mentee_email,
  mentor_id, mentor_name, mentor_email,
  track, match_status, active_status, risk_status,
  missed_sessions_count, feedback_completion_count, pair_score, notes
) values
  ('match-ydp-c2-mentee-006-ydp-c2-mentor-007','YDP-C2-Mentee-006','Chibuike Omenukor','omenukorchibuike@gmail.com','YDP-C2-Mentor-007','Joseph Abubakar','joseph.itopaa@gmail.com','Data engineer and Analytics engineer','Auto-Matched','Pending Review','Not Started',0,0,97,'Auto-selected from Pair Scores. Total pair score: 97.'),
  ('match-ydp-c2-mentee-023-ydp-c2-mentor-004','YDP-C2-Mentee-023','Olaide Daramola','kehindeolaide24@gmail.com','YDP-C2-Mentor-004','Adeyemi Adenuga','pearlxta@gmail.com','Data Analyst','Auto-Matched','Pending Review','Not Started',0,0,100,'Auto-selected from Pair Scores. Total pair score: 100.'),
  ('match-ydp-c2-mentee-025-ydp-c2-mentor-004','YDP-C2-Mentee-025','Ibukun Egwuogu','ibk.egwu@gmail.com','YDP-C2-Mentor-004','Adeyemi Adenuga','pearlxta@gmail.com','Data Analyst','Auto-Matched','Pending Review','Not Started',0,0,100,'Auto-selected from Pair Scores. Total pair score: 100.'),
  ('match-ydp-c2-mentee-043-ydp-c2-mentor-018','YDP-C2-Mentee-043','Abdullah Bankole','abdullahbankole17@gmail.com','YDP-C2-Mentor-018','Oluwatobi Ojo','ojotobitemitayo@gmail.com','Analytics Engineer','Auto-Matched','Pending Review','Not Started',0,0,95,'Auto-selected from Pair Scores. Total pair score: 95.'),
  ('match-ydp-c2-mentee-007-ydp-c2-mentor-016','YDP-C2-Mentee-007','Joshua Emeghai','emeghaijoshua@gmail.com','YDP-C2-Mentor-016','Emmanuel Ugochukwu','hemma.ugo@gmail.com','Data Scientist','Auto-Matched','Pending Review','Not Started',0,0,99,'Auto-selected from Pair Scores. Total pair score: 99.'),
  ('match-ydp-c2-mentee-009-ydp-c2-mentor-007','YDP-C2-Mentee-009','Nurudeen Ibrahim','ibrahimnurudeen151@gmail.com','YDP-C2-Mentor-007','Joseph Abubakar','joseph.itopaa@gmail.com','Data Engineer','Auto-Matched','Pending Review','Not Started',0,0,96,'Auto-selected from Pair Scores. Total pair score: 96.'),
  ('match-ydp-c2-mentee-015-ydp-c2-mentor-001','YDP-C2-Mentee-015','Tiamiyu Hamzat','hamzattiamiyu@gmail.com','YDP-C2-Mentor-001','Israel Odeajo','iodeajo@gmail.com','Machine Learning/AI Engineer','Auto-Matched','Pending Review','Not Started',0,0,100,'Auto-selected from Pair Scores. Total pair score: 100.'),
  ('match-ydp-c2-mentee-017-ydp-c2-mentor-004','YDP-C2-Mentee-017','Sharon Johnson','sharondolapojohnson2@gmail.com','YDP-C2-Mentor-004','Adeyemi Adenuga','pearlxta@gmail.com','Data Analyst','Auto-Matched','Pending Review','Not Started',0,0,100,'Auto-selected from Pair Scores. Total pair score: 100.'),
  ('match-ydp-c2-mentee-019-ydp-c2-mentor-001','YDP-C2-Mentee-019','Ibrahim Aremu','ibrahimaremu135@gmail.com','YDP-C2-Mentor-001','Israel Odeajo','iodeajo@gmail.com','Machine Learning/AI Engineer','Auto-Matched','Pending Review','Not Started',0,0,100,'Auto-selected from Pair Scores. Total pair score: 100.'),
  ('match-ydp-c2-mentee-027-ydp-c2-mentor-004','YDP-C2-Mentee-027','Eromosele Ainyanbhor','ainyanbhorstanley@gmail.com','YDP-C2-Mentor-004','Adeyemi Adenuga','pearlxta@gmail.com','Data Analyst','Auto-Matched','Pending Review','Not Started',0,0,100,'Auto-selected from Pair Scores. Total pair score: 100.'),
  ('match-ydp-c2-mentee-048-ydp-c2-mentor-008','YDP-C2-Mentee-048','Tosin Akinbinu','tosin.akinbinu2@gmail.com','YDP-C2-Mentor-008','Ikechukwu Chilaka','chilaka.ig@gmail.com','Data Engineer','Auto-Matched','Pending Review','Not Started',0,0,100,'Auto-selected from Pair Scores. Total pair score: 100.'),
  ('match-ydp-c2-mentee-057-ydp-c2-mentor-001','YDP-C2-Mentee-057','Oluwakayode Aje','oluwakayodeaje@gmail.com','YDP-C2-Mentor-001','Israel Odeajo','iodeajo@gmail.com','Machine Learning/AI Engineer','Auto-Matched','Pending Review','Not Started',0,0,100,'Auto-selected from Pair Scores. Total pair score: 100.'),
  ('match-ydp-c2-mentee-026-ydp-c2-mentor-007','YDP-C2-Mentee-026','Ifeanyi Njoku','njokuifeanyi911@gmail.com','YDP-C2-Mentor-007','Joseph Abubakar','joseph.itopaa@gmail.com','Machine Learning/AI Engineer','Auto-Matched','Pending Review','Not Started',0,0,100,'Auto-selected from Pair Scores. Total pair score: 100.')
on conflict (match_id) do update set
  mentee_name  = excluded.mentee_name,
  mentee_email = excluded.mentee_email,
  mentor_name  = excluded.mentor_name,
  mentor_email = excluded.mentor_email,
  track        = excluded.track,
  pair_score   = excluded.pair_score,
  notes        = excluded.notes;
