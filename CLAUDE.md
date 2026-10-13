# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Automations for the YDP Mentorship Program (currently Cohort 2, which ends 2026-10-31). It contains three separate **Google Apps Script** projects bound to Google Sheets, plus a **React "Mentorship Hub" website** where participants see their matches. `README.md` is the operator manual (every menu button, tracking column, and run order) and should be kept in sync when behavior changes.

| Part | Path | Deploys to |
| --- | --- | --- |
| Mentee registration emails | `YDP Mentee Email.gs` (repo root) | Apps Script `1HnM-...` via root `.clasp.json` |
| Mentor registration emails | `mentor/YDP Mentor Email.gs` | Apps Script `1TyZ8...` via `mentor/.clasp.json` |
| Matching, scoring, and all post-match emails | `matching/YDP Matching Automation.gs` (~7,400 lines) | Apps Script `1svZu...` via `matching/.clasp.json` |
| Mentorship Hub site | `YDP Website Metric Builder/` | Vercel (auto-deploys on push to `main`) |

The root `.claspignore` excludes `matching/`, `mentor/`, `tests/`, docs, etc., so a root push only uploads the mentee script. Each subfolder is its own clasp project.

## Commands

Apps Script deploys (PowerShell, use `clasp.cmd` on Windows). Run from the folder that owns the `.clasp.json`:

```powershell
clasp.cmd push --force             # root: mentee project
cd matching; clasp.cmd push --force
cd mentor;   clasp.cmd push --force
```

After pushing, the user must refresh the Google Sheet for menu changes to appear. Pushing is outward-facing (it changes the live sheets the team uses), so confirm before doing it.

Tests are plain Node scripts using `assert` (no test runner, no `package.json` at the root). Run one file at a time:

```powershell
node tests/pair-scores-helpers.test.js
node "Demo 1/tests/demo-guide.test.js"
```

They load a `.gs` file into a `vm` context and call its functions directly (or check function source text), so any top-level code in a `.gs` file must run without Apps Script globals. Known issue: `tests/pair-scores-helpers.test.js` still expects a pair batch size of `5`, but `defaultPairScoringBatchSize` is now `80`, so it fails.

Hub site (run inside `YDP Website Metric Builder/`):

```powershell
npm run dev      # Vite dev server: Design OS planning tool at /, live Hub at /app
npm run build    # tsc -b && vite build
npm run lint     # eslint
```

`Demo 1/scripts/build-demo-guide.ps1` renders the presenter guide HTML to PDF with headless Chrome or Edge.

## Apps Script architecture

All three scripts share one control pattern, and new features should follow it:

- **Menu-driven.** `onOpen()` builds a custom menu (`YDP Automation` or `YDP Matching`). Every action is a menu item, usually as a set: `Preview ...` (sends nothing), `... TEST to me` (sends to the operator, changes no tracking), then the live `Send ... to ALL ...` with a confirmation dialog.
- **Sheet columns are the state.** Each email campaign has its own `... Status` / `... Sent At` columns (statuses `SENDING` / `SENT` / `ERROR`), created idempotently by the setup action. Bulk sends skip anything already `SENT`, so re-running after a partial failure is safe. A new campaign gets **new** columns rather than reusing old ones, so history is never overwritten. `SENDING` is a safeguard against duplicate sends: a row stuck in that state means a run was interrupted.
- **Config lives in top-level `const YDP_*` objects** (e.g. `YDP_MATCHING_CONFIG`, `YDP_FEEDBACK_FORM`, `YDP_MENTOR_COUNTDOWN`, `YDP_HUB_URL`). Cohort-specific values (dates, Meet links, "Cohort 2" text, form names) live there. See "Before the Next Cohort" in `README.md`.
- **Triggers** (`ScriptApp.newTrigger`) are installed and removed by menu items with matching `Turn ON` / `Turn OFF` handlers. Several remove themselves when their job is done.
- Emails go through `MailApp.sendEmail`. Bulk senders check `MailApp.getRemainingDailyQuota()` first, and writes are serialized with `LockService`.
- Participant IDs (`YDP-C2-Mentee-###`, `YDP-C2-Mentor-###`) are keyed on unique email. Duplicate registrations share the original row's ID.

### Matching pipeline (`matching/`)

The data flows one way through tabs in the matching workbook:

1. `Sync source snapshots from forms` copies the live mentee and mentor form-response spreadsheets (IDs in the `Source Config` tab) into `Mentee Source Snapshot` / `Mentor Source Snapshot`.
2. **Mentee scoring** (Gemini): four 0-5 category scores, combined as `LC*8 + CE*4 + CG*4 + SS*4`, out of 100. `Final Score >= 60` gives `Gemini Review Status = Can Pair`.
3. **Pair scoring** (Gemini): every `Can Pair` mentee is scored against every mentor (skill 40 / career 30 / availability 15 / capacity 15), written to `Pair Scores`. Batches are time-boxed (`maxManualRunMilliseconds` = 4 min). The Gemini rate limit, not the batch size, sets throughput. Only `Scored` rows are skipped, so `Error` rows retry.
4. **Auto-match** (no Gemini): a mentee is matched only once all of its pairs are scored. It picks the highest total and fills mentors to their stated capacity before giving any mentor up to +2 overflow. It **rebuilds** `Match Recommendations` and `Matched Pairs`, wiping hand edits. Scheduled auto-match switches itself off once any match email is `SENT`.
5. Everything after that runs from `Matched Pairs`: match emails, Hub invites, reassignments (edit `Recommended Mentor ID` on `Match Recommendations`, then sync), mentor nudges (an `x` in `Needs Nudge`, with tone escalating by `Nudge Count`), spotlight requests, and feedback check-ins.

**Gemini keys** are read only from Script Properties: `GEMINI_API_KEY`, then `GEMINI_API_KEY_2` ... `_10`. On quota or rate-limit errors the script moves to the next key and remembers it in `GEMINI_ACTIVE_API_KEY_INDEX`. Other errors are surfaced, not rotated. Never put key values in code or committed files. The model defaults to `defaultGeminiModel` and can be overridden by `GEMINI_MODEL` in `Source Config`.

**Feedback check-ins** use `FormApp` to build a Google Form per round, with prefilled-link fields (ID, email, name) and answers linked to a dedicated responses tab. Each round has its own form, tab, Script Property keys, and tracking columns. To start a new mentee round, rename the values in `YDP_FEEDBACK_FORM` / `YDP_FEEDBACK_TRACKING`; don't reuse the old ones. Mentor feedback sends one email per mentor (grouped from `Matched Pairs`) and never emails unpaired mentors.

## Hub website (`YDP Website Metric Builder/`)

This started as a **Design OS** planning workspace, and its own `claude.md` / `agents.md` describe that workflow (`product/` specs, `src/sections/*` screen designs, `/design-os:*` commands). The real product lives in `src/app/` (`LiveApp`, `PasswordGate`, `ParticipantMatch`, `use*` hooks) and reuses the section components from `src/sections/`.

- `src/lib/router.tsx` serves **only** `LiveApp` in production builds (`import.meta.env.PROD`). The planning routes exist only in dev, where the Hub is at `/app`.
- Data comes from Supabase through `src/lib/matches.ts`, which calls security-definer RPCs: `get_matches` / `get_mentor_roster` (staff, site password) and `get_my_matches` / `get_my_peers` (participant email + ID). Direct table reads return nothing because of RLS. The access gate is enforced in the database (`supabase/access-control.sql`), not in the browser.
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `.env.local`. Without them the app falls back to sample data.
- **The Hub does not sync from the sheet.** After any change to `Matched Pairs` (matching, reassignment), Supabase must be re-seeded by hand, usually by regenerating `supabase/seed.sql` from the live sheet and running it in the Supabase SQL Editor. `seed.sql` (real participant data) and `set-password.sql` (real password) are gitignored and must never be committed. The script that builds `seed.sql` is not in the repo.

## Planning docs

Feature designs and implementation plans live in `docs/superpowers/specs/` and `docs/superpowers/plans/`, with earlier artifacts in `artifacts/superpowers/` and `architect/`. Check them for the reasoning behind a feature before changing it.
