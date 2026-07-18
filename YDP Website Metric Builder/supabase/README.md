# Supabase setup — YDP Mentorship Hub

This connects the app to a Supabase `matches` table (one row per mentee↔mentor
match) instead of Google Sheets. The UI is unchanged — only the data source.

## 1. Create a Supabase project
1. Go to https://supabase.com and sign in (free tier is fine).
2. **New project** → give it a name (e.g. `ydp-mentorship-hub`), set a database
   password, pick the closest region, and create it.
3. Wait ~1 minute for it to provision.

## 2. Create the table
1. In the project, open **SQL Editor → New query**.
2. Paste the contents of [`schema.sql`](./schema.sql) and click **Run**.
   This creates the `matches` table, indexes, and a public **read-only** policy.

## 3. Load your data
Export the matches Google Sheet to CSV, then import it:
1. **Table Editor → `matches` → Insert → Import data from CSV**.
2. Upload the CSV. Map the sheet columns to the table columns
   (the names line up if you rename the sheet headers to match, or map by hand).
3. For **pair_score**: if your sheet doesn't have a numeric score column, run the
   commented backfill query at the bottom of `schema.sql` to pull the number out
   of the Notes text ("Total pair score: 97").

> Column name mapping (sheet → table): Match ID → `match_id`,
> Mentee ID → `mentee_id`, Mentor ID → `mentor_id`, Track → `track`,
> Match Status → `match_status`, Active Status → `active_status`,
> Risk Status → `risk_status`, Notes → `notes`, and so on.

## 4. Connect the app
1. In Supabase: **Project Settings → API**. Copy the **Project URL** and the
   **anon public** key.
2. In the project root, copy `.env.example` to `.env.local` and paste them in:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```
3. Restart the dev server (`npm run dev`).

The app reads these via `src/lib/supabase.ts`. When they're missing, the app
falls back to the built-in sample data, so it always renders.

## How the data flows
- `src/lib/matches.ts` fetches rows (`fetchAllMatches`) and reshapes them into
  exactly what each screen expects:
  - `toDashboardData()` → Overview Dashboard
  - `toMenteeLookupData()` → Mentee Lookup
  - `toMentorLookupData()` → Mentor Lookup
- The `anon` key is safe in the browser: Row Level Security allows **read only**.
  Manage the data in the Supabase dashboard, never from the client.
