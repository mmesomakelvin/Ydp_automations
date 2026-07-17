# YDP Mentor/Mentee Automations

Google Apps Script automations for the YDP Mentorship Program.

## Current Automation

### Mentee Registration Email

The current script sends email updates to mentees in the Google Sheet response tab.

It supports:

- automatic email sending for new mentee form submissions
- manual batch email sending for mentees who registered before the automation was installed
- test emails
- email preview for a selected row
- duplicate protection through status columns
- force resend for a selected row
- stable mentee IDs based on unique email addresses
- duplicate row marking for repeat registrations

### Mentor Registration Email

The mentor script sends email updates to mentors in the Google Sheet response tab.

It supports the same control pattern as the mentee automation:

- automatic email sending for new mentor form submissions
- manual batch email sending for mentors who registered before the automation was installed
- test emails
- email preview for a selected row
- duplicate protection through status columns
- force resend for a selected row
- stable mentor IDs based on unique email addresses
- duplicate row marking for repeat registrations

## Apps Script Projects

Each Apps Script project has its own `.clasp.json` and script ID.

### Mentee Project

Script ID:

```text
1HnM-PC5rnLXOmbN-DW9mZBTITdeL2cFyFaX6KJ3_iVyT94iQHKN9520u
```

Main script file:

```text
YDP Mentee Email.gs
```

Push from the repository root:

```powershell
clasp.cmd push --force
```

### Mentor Project

Script ID:

```text
1TyZ8bcZaKDAVBVOu_cl6xbVTsdZ9-4KCgQ4OTF2iB34e24kx49XIILp1
```

Local project folder:

```text
mentor/
```

Push from the mentor folder:

```powershell
cd mentor
clasp.cmd push --force
```

### Matching Project

Script ID:

```text
1svZufkQfd0cKRBv75BuxTOqs6QIMQWA214SLU5d69QF_x8Z1IjM7DCYf
```

Local project folder:

```text
matching/
```

Push from the matching folder:

```powershell
cd matching
clasp.cmd push --force
```

The matching script reads Gemini keys from Apps Script Script Properties. The current key ownership is:

| Script Property | Account that owns the key | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | YDP Mentorship account | Primary key used first. |
| `GEMINI_API_KEY_2` | Mmesoma Okoronkwo account | First backup key. |
| `GEMINI_API_KEY_3` | EduBridge Academy account | Second backup key. |
| `GEMINI_ACTIVE_API_KEY_INDEX` | Managed automatically by the script | Remembers the last key slot that worked. Do not enter an API key in this property. |

When the active key reaches a Gemini quota or rate limit, the script tries the next configured key and remembers the working slot. It cycles through the configured slots in order and only shows a quota error after all available keys have been tried. Other errors, such as an invalid request, remain visible instead of being hidden by key rotation.

Keep every API key value only in Apps Script Script Properties. Do not store key values in the code, README, screenshots committed to GitHub, or any other GitHub file. Each key still follows the quota, billing, and usage rules of the Google Cloud or AI Studio project that issued it.

## Sheet Menu Buttons

After the script is pushed and the spreadsheet is refreshed, the sheet shows a custom menu:

```text
YDP Automation
```

### Mentee Sheet Buttons

| Button | What it does in plain English | When to use it | Be careful |
| --- | --- | --- | --- |
| `Setup email tracking columns` | Adds the status columns the script needs to know who has already received emails. | Use once after installing/pushing the script, or if tracking columns were deleted. | Safe to run again. It should not duplicate existing columns. |
| `Install form submit trigger` | Turns on automatic sending for future new mentee registrations. | Use once when setting up the sheet automation. | If unsure, running it again is okay; the script checks if it already exists. |
| `Assign IDs and mark duplicates` | Creates a stable `YDP-C2-Mentee-###` ID for each unique email. If the same email appears more than once, it gives the duplicate row the same ID and colors that duplicate row green. | Use once for all existing rows, and use again anytime you want to clean/check duplicates manually. | Email is the unique key. Do not delete the first/original row until you confirm the duplicate is not needed. |
| `Send test mentee email` | Sends a sample mentee email to an address you enter. | Use before sending real emails, especially after editing the script. | Use your own email or a test email. |
| `Preview selected row email` | Shows the email text for the selected mentee row before sending. | Use when you want to confirm the message for a specific person. | Select a real data row, not the header row. |
| `Send mentee email to selected row` | Sends the new-registration email to only the selected mentee row. | Use for one person who just needs the normal registration email. | It will skip if either mentee email status already says `SENT`, unless you use resend. |
| `Send mentee email to all unsent rows` | Sends the new-registration email to every row where no mentee email has been sent yet. | Use only when you want to send the normal new-registration email in bulk. | It skips rows where either normal registration or already-registered status already says `SENT`. |
| `Send already registered mentee update to all unsent rows` | Sends the already-registered update email to old mentee registrations where no mentee email has been sent yet. | Use for applicants who registered before the automation was installed. | It skips rows where either normal registration or already-registered status already says `SENT`. |
| `Send onboarding reminder to all unsent rows` | Sends the Saturday, July 18 onboarding reminder to mentees who have not received this campaign. | Use for the approved onboarding reminder after previewing and testing it. | It uses separate onboarding status columns, so do not clear the earlier registration statuses. |
| `Repair missing sent date for selected row` | Fills a missing sent-at date when the status already says `SENT`. It does not send an email. | Use when a row says `SENT` but the matching date column is blank. | Select the affected row first. This writes today's date as the repair date. |
| `Resend email to selected row` | Forces a resend to the selected row and asks which email type to resend. | Use only when someone says they did not receive the email, or you intentionally want to resend. | This bypasses normal duplicate protection for that selected row. |

Recommended mentee setup order:

1. `Setup email tracking columns`
2. `Assign IDs and mark duplicates`
3. `Install form submit trigger`
4. `Send test mentee email`
5. For old registrations, use `Send already registered mentee update to all unsent rows`
6. For future registrations, let the trigger send automatically

For the July 18 reminder campaign: run `Setup email tracking columns`, preview a selected row, send a test with type `ONBOARDING`, then run `Send onboarding reminder to all unsent rows`. Running the onboarding bulk button again skips rows already marked `SENT` for this campaign.

### Mentor Sheet Buttons

| Button | What it does in plain English | When to use it | Be careful |
| --- | --- | --- | --- |
| `Setup email tracking columns` | Adds the status columns the script needs to know who has already received mentor emails. | Use once after installing/pushing the mentor script, or if tracking columns were deleted. | Safe to run again. It should not duplicate existing columns. |
| `Install form submit trigger` | Turns on automatic sending for future new mentor registrations. | Use once when setting up the mentor sheet automation. | If unsure, running it again is okay; the script checks if it already exists. |
| `Assign IDs and mark duplicates` | Creates a stable `YDP-C2-Mentor-###` ID for each unique email. If the same email appears more than once, it gives the duplicate row the same ID and colors that duplicate row green. | Use once for all existing rows, and use again anytime you want to clean/check duplicates manually. | Email is the unique key. Do not delete the first/original row until you confirm the duplicate is not needed. |
| `Send test mentor email` | Sends a sample mentor email to an address you enter. | Use before sending real mentor emails, especially after editing the script. | Use your own email or a test email. |
| `Preview selected row email` | Shows the email text for the selected mentor row before sending. | Use when you want to confirm the message for a specific mentor. | Select a real data row, not the header row. |
| `Send mentor email to selected row` | Sends the new-registration email to only the selected mentor row. | Use for one person who just needs the normal mentor registration email. | It will skip if either mentor email status already says `SENT`, unless you use resend. |
| `Send mentor email to all unsent rows` | Sends the new-registration mentor email to every row where no mentor email has been sent yet. | Use only when you want to send the normal new-registration email in bulk. | It skips rows where either normal registration or already-registered status already says `SENT`. |
| `Send already registered mentor update to all unsent rows` | Sends the already-registered update email to old mentor registrations where no mentor email has been sent yet. | Use for mentors who registered before the automation was installed. | It skips rows where either normal registration or already-registered status already says `SENT`. |
| `Send onboarding reminder to all unsent rows` | Sends the Saturday, July 18 onboarding reminder to mentors who have not received this campaign. | Use for the approved onboarding reminder after previewing and testing it. | It uses separate onboarding status columns, so do not clear the earlier registration statuses. |
| `Repair missing sent date for selected row` | Fills a missing sent-at date when the status already says `SENT`. It does not send an email. | Use when a row says `SENT` but the matching date column is blank. | Select the affected row first. This writes today's date as the repair date. |
| `Resend email to selected row` | Forces a resend to the selected row and asks which email type to resend. | Use only when someone says they did not receive the email, or you intentionally want to resend. | This bypasses normal duplicate protection for that selected row. |

Recommended mentor setup order:

1. `Setup email tracking columns`
2. `Assign IDs and mark duplicates`
3. `Install form submit trigger`
4. `Send test mentor email`
5. For old registrations, use `Send already registered mentor update to all unsent rows`
6. For future registrations, let the trigger send automatically

For the July 18 reminder campaign: run `Setup email tracking columns`, preview a selected row, send a test with type `ONBOARDING`, then run `Send onboarding reminder to all unsent rows`. Running the onboarding bulk button again skips rows already marked `SENT` for this campaign.

## Tracking Columns

The mentee script creates these columns if they do not already exist:

- `Mentee ID`
- `Duplicate Status`
- `Original Row`
- `ID Assigned At`
- `Mentee Registration Email Status`
- `Mentee Registration Email Sent At`
- `Already Registered Email Status`
- `Already Registered Email Sent At`
- `Onboarding Reminder Email Status`
- `Onboarding Reminder Email Sent At`
- `Email Last Error`

The mentor script creates these columns if they do not already exist:

- `Mentor ID`
- `Duplicate Status`
- `Original Row`
- `ID Assigned At`
- `Mentor Registration Email Status`
- `Mentor Registration Email Sent At`
- `Already Registered Email Status`
- `Already Registered Email Sent At`
- `Onboarding Reminder Email Status`
- `Onboarding Reminder Email Sent At`
- `Email Last Error`

## Mentee Deployment

Push the local Apps Script files to Google Apps Script with:

```powershell
clasp.cmd push --force
```

The Google account must have the Apps Script API enabled:

```text
https://script.google.com/home/usersettings
```

## Setup After Push

1. Refresh the Google Sheet.
2. Open `YDP Automation > Setup email tracking columns`.
3. Open `YDP Automation > Install form submit trigger`.
4. Send a test email before sending to real mentees.

## Artifacts

Planning artifacts are stored in:

```text
artifacts/superpowers/
```

Start with:

```text
artifacts/superpowers/README.md
```

## Source Documents

| Document | Purpose | Link |
| --- | --- | --- |
| Mentor-Mentee Matching Criteria | Mentee selection scoring and mentor-mentee pairing rules | https://docs.google.com/document/d/1ytuSV7vLncZbyLF_6ebbXijYoYt9ZYyZTo7rzPmuOqE/edit?usp=sharing |

## Matching Automation Setup

The matching automation is separate from the mentee and mentor email automations.

Use this order:

1. Open the `YDP Matching Automation` Google Sheet.
2. Refresh the sheet after the script is pushed.
3. Open `YDP Matching > Setup matching workbook`.
4. Confirm the `Source Config` tab has the correct source spreadsheet IDs. Running setup again is safe; it also repairs the old incorrect mentee source ID if it is still present.
5. Open `YDP Matching > Sync source snapshots from forms`.
6. Open `YDP Matching > Test Gemini connection`.
7. Open `YDP Matching > Generate next mentee score`.
8. After the first mentee score works, use `YDP Matching > Generate mentee scores batch` to score several unscored mentees at a time.
9. Open `YDP Matching > Generate next pair score`.
10. After the first pair score works, use `YDP Matching > Generate pair scores batch` to score several unscored pairs at a time.

Important: `Setup matching workbook` only creates the tabs. It does not import the mentor or mentee rows. The `Mentee Source Snapshot` and `Mentor Source Snapshot` tabs stay blank until `Sync source snapshots from forms` is run successfully.

The source form tab does not have to be named exactly `Form_Responses`. The script first checks the configured tab name, then auto-detects common Google Forms tabs like `Form Responses 1`.

If the snapshot tabs stay blank after syncing, open `Run Log`. A successful sync should say how many mentee and mentor rows were copied. If there is an error, the log explains whether the issue is sheet access, source spreadsheet ID, or tab name.

The setup creates these tabs:

- `Source Config`
- `Mentee Source Snapshot`
- `Mentor Source Snapshot`
- `Mentee Scores`
- `Pair Scores`
- `Match Recommendations`
- `Matched Pairs`
- `Run Log`

## Matching Menu Buttons

| Button | What it does in plain English | When to use it | Be careful |
| --- | --- | --- | --- |
| `Setup matching workbook` | Creates the matching tabs and configuration area. | Use once at the start, or rerun if tabs are missing. | This does not import mentor/mentee data. |
| `Sync source snapshots from forms` | Copies the latest rows from the live mentee and mentor form response sheets into this matching workbook. | Use before scoring or matching, especially after new people register. | For now this is manual. A scheduled auto-sync will be added after scoring/matching is stable. |
| `Generate next mentee score` | Uses Gemini to score one unscored mentee against the YDP selection criteria and writes the result into `Mentee Scores`. | Use after the source snapshots have data. Run it again to continue scoring remaining mentees. | Gemini gives a review recommendation; it does not make the final decision for the team. If Gemini quota is reached, wait and run it again later. |
| `Generate mentee scores batch` | Uses Gemini to score up to 3 unscored mentees in one run and writes them into `Mentee Scores`. | Use after the one-mentee test works. This is the normal safer button for moving faster. | If Gemini returns `503` because the model is busy, the batch stops after that first failed request instead of waiting on more rows. Nothing already scored is deleted. Run it again later to continue. |
| `Generate next pair score` | Uses Gemini to score one eligible mentee against one available mentor and writes the comparison into `Pair Scores`. | Use after mentee scores and mentor snapshots exist. Run it again later to continue pair scoring. | This can hit Gemini quota. Existing pair scores are preserved. If a row says `Error`, read `Gemini Concern`; running the button again retries that same pair. |
| `Generate pair scores batch` | Uses Gemini to score up to 5 unscored mentee/mentor pairs in one run and writes them into `Pair Scores`. | Use after the one-pair test works. This is the normal button for moving faster. | It still may stop because of Gemini quota or Apps Script time limits. Nothing already scored is deleted. Run it again later to continue. |
| `Auto-match from pair scores` | Uses saved pair scores to select the best available mentor for each fully scored mentee. | Use after enough pair scores have been generated. | It does not call Gemini. It replaces the current generated rows in `Match Recommendations` and `Matched Pairs`. |
| `Preview selected selection email` | Shows the program-selection email for one selected `Can Pair` mentee without sending it. | Use first to review the wording and recipient. | Select a data row in `Mentee Scores`, not the header. |
| `Send test selection email` | Sends the selected mentee's personalized template to an email address you enter. | Use after previewing and before any live participant send. | It does not update the mentee's selection-email status or sent date. |
| `Send selection email to selected mentee` | Sends the real selection email to one selected `Can Pair` mentee. | Use as the first controlled live send. | It records `SENT` and will not send the same campaign twice. |
| `Send selection emails to all eligible unsent mentees` | Sends the real selection email to every valid `Can Pair` mentee not already marked `SENT`. | Use only after the preview, test copy, and selected live send succeed. | `Do Not Pair`, `ERROR`, invalid-email, and already-sent rows are not emailed. |
| `Preview selected match emails` | Shows the mentee and mentor match emails for the selected row in `Matched Pairs`. | Use before sending any match emails. | Select a real matched pair row, not the header row. |
| `Send match emails to selected pair` | Sends match emails for one selected final pair if they have not already been sent. | Use first for controlled testing. | It writes separate `SENT` statuses for mentee and mentor. It skips sides already marked `SENT`. |
| `Send match emails to all unsent matched pairs` | Sends match emails for every final matched pair that has not already been notified. | Use only after selected-row testing works. | This sends real emails in bulk. Status columns protect against duplicate sends. |
| `Test Gemini connection` | Checks the configured Gemini keys and automatically moves to the next key if the active one is quota-limited. | Use after adding or changing any Gemini API key. | API key values must stay in Apps Script Script Properties, not in GitHub. |

## Mentee Selection Emails

Selection emails are controlled from `Mentee Scores`, because this is where the final `Gemini Review Status` is stored. The campaign does not change scores, source snapshots, pair scores, or matches.

Running `Setup matching workbook` adds these columns without clearing existing data:

- `Selection Email Status`: blank before sending, briefly `SENDING` during delivery, `SENT` after success, or `ERROR` after a confirmed failure.
- `Selection Email Sent At`: the successful send date and time.
- `Selection Email Last Error`: the latest sending problem for that row.

Safe testing order:

1. Open `Mentee Scores` and select one row marked `Can Pair`.
2. Run `YDP Matching > Preview selected selection email`. This sends nothing.
3. Run `YDP Matching > Send test selection email` and enter your own email address. This does not change participant tracking.
4. Check the test message in your inbox.
5. Keep the same eligible row selected and run `Send selection email to selected mentee`.
6. Confirm that row shows `SENT` and a value in `Selection Email Sent At`.
7. Try the selected-row action again and confirm it is skipped as already sent.
8. Run `Send selection emails to all eligible unsent mentees` only after those checks pass.

The bulk action counts eligible recipients and shows a confirmation before sending. It also checks the remaining Apps Script email quota before sending anything.

`SENDING` is a duplicate-send safety state. If it remains after an interrupted run, read `Selection Email Last Error` and verify the recipient's delivery before manually clearing or retrying that row.

## Data Dictionaries

Each automation workbook now has a `Create data dictionary` button. It creates or refreshes a `Data Dictionary` tab that explains the key sheets, columns, and menu buttons in plain English.

Run them here:

| Workbook | Menu path |
| --- | --- |
| Mentee response sheet | `YDP Automation > Create data dictionary` |
| Mentor response sheet | `YDP Automation > Create data dictionary` |
| Matching workbook | `YDP Matching > Create data dictionary` |

This is safe to run. It only updates the `Data Dictionary` tab. It does not send emails, assign IDs, score mentees, score pairs, send match emails, or change response data.

## Mentee Scoring

The `Generate next mentee score` button scores mentees in `Mentee Source Snapshot` one at a time.

The `Generate mentee scores batch` button does the same work, but tries up to 3 mentees in one run. In plain English:

- `Generate next mentee score` = test or retry one mentee.
- `Generate mentee scores batch` = move faster once the test works, without keeping Apps Script running too long.
- Neither button deletes existing mentee scores.
- Already-scored mentees are skipped.
- Rows marked `ERROR` are retried, because the issue may have been temporary.

The script keeps completed scores, skips already-scored mentees, retries rows marked `ERROR`, and stops safely when quota or the Apps Script time window is reached.

It writes these review columns into `Mentee Scores`:

- `Learning Commitment Score`
- `Community Engagement Score`
- `Career Goals Score`
- `Soft Skills Score`
- `Final Score`
- `Gemini Review Status`
- `Gemini Summary`
- `Gemini Concerns`
- `Scored At`

The category scores are from `0` to `5`. The final score is calculated as:

```text
Learning Commitment Score * 8
+ Community Engagement Score * 4
+ Career Goals Score * 4
+ Soft Skills Score * 4
= Final Score out of 100
```

The matching automation sets `Gemini Review Status` automatically:

| Status | Meaning |
| --- | --- |
| `Can Pair` | The mentee crossed the automated threshold and can be compared with mentors. |
| `Do Not Pair` | The mentee did not cross the automated threshold for matching. |
| `ERROR` | Gemini could not score the row; the script will retry it. |

For now, the crossing line is `Final Score >= 60`.

If you see a quota message, do not delete the sheet. Wait for the quota window to reset, then run `Generate next mentee score` again. It will continue from the unscored or `ERROR` rows. If Gemini returns `503 UNAVAILABLE`, the selected model is temporarily busy. The mentee batch stops after the first failed request so it does not spend the full Apps Script window retrying more rows.

The current build sets up the matching workbook, source snapshots, Gemini connection test, mentee scoring, pair scoring, and auto-matching from saved pair scores.

## Pair Scoring

The `Generate next pair score` button creates the `Pair Scores` audit trail one comparison at a time.

The `Generate pair scores batch` button does the same work, but tries up to 5 comparisons in one run. In plain English:

- `Generate next pair score` = test or retry one pair.
- `Generate pair scores batch` = move faster once the test works.
- Neither button deletes existing pair scores.
- Only rows with `Pair Score Status = Scored` are skipped.
- Rows with `Pair Score Status = Error` are retried, because the issue may have been temporary.

It reads:

- eligible mentees from `Mentee Scores`,
- mentors from `Mentor Source Snapshot`.

Eligible mentees must have:

- `Final Score >= 60`,
- `Gemini Review Status = Can Pair`,
- a mentee ID,
- an email address.

`Pair Scores` is related to `Mentee Scores`. It does not match every registered mentee. It only compares mentors against mentees that have crossed the automated review stage, meaning `Gemini Review Status = Can Pair`.

Each pair score contains:

- skill fit score out of `40`,
- career fit score out of `30`,
- availability fit score out of `15`,
- capacity fit score out of `15`,
- total pair score out of `100`,
- Gemini reason,
- Gemini concern.

Testing order:

1. Run `YDP Matching > Setup matching workbook`.
2. Confirm the `Pair Scores` tab exists.
3. Run `YDP Matching > Generate next pair score`.
4. Open `Pair Scores`.
5. Confirm one row was added, or wait and retry if Gemini quota appears.
6. If the one-pair test works, run `YDP Matching > Generate pair scores batch`.
7. Confirm several rows were added, or wait and retry if Gemini quota appears.

If `Pair Score Status` says `Error`, the row is not final. The script saves the reason in `Gemini Concern` and also shows it in the popup. You can run `Generate next pair score` again after fixing the issue or waiting for Gemini to recover; it will retry that pair because only `Scored` rows are skipped.

## Auto-Matching

The `Auto-match from pair scores` button turns completed pair scores into actual match outputs.

It reads:

- `Mentee Scores`,
- `Mentor Source Snapshot`,
- `Pair Scores`.

It writes:

- recommendations into `Match Recommendations`,
- final assignment rows into `Matched Pairs`.

How it decides:

- It only considers mentees marked `Gemini Review Status = Can Pair`.
- It only auto-matches a mentee after that mentee has scored pair rows against all available mentors.
- It chooses the highest `Total Pair Score`.
- It respects each mentor's flexible capacity.
- If a mentee does not have enough pair scores yet, it writes `Needs More Pair Scores` in `Match Recommendations` and does not create a final matched pair for that mentee yet.

Testing order:

1. Confirm `Mentee Scores` has at least one `Can Pair` mentee.
2. Confirm `Pair Scores` has `Scored` rows for that mentee against all mentors.
3. Run `YDP Matching > Auto-match from pair scores`.
4. Open `Match Recommendations`.
5. Open `Matched Pairs`.
6. Confirm selected pairs appear there.

## Match Notification Emails

Match notification emails are sent from `Matched Pairs`, not from `Match Recommendations`.

The script adds these tracking columns to `Matched Pairs`:

- `Mentee Match Email Status`
- `Mentee Match Email Sent At`
- `Mentor Match Email Status`
- `Mentor Match Email Sent At`
- `Match Email Last Error`

Plain-English rule:

- A mentee match email tells the mentee who their mentor is.
- A mentor match email tells the mentor who their mentee is.
- The script skips any side already marked `SENT`.
- If the mentee or mentor email address is missing/invalid, the row is not sent and the issue is written into `Match Email Last Error`.

Testing order:

1. Run `YDP Matching > Setup matching workbook`.
2. Open `Matched Pairs` and confirm the match email tracking columns exist.
3. Select one real matched pair row.
4. Run `YDP Matching > Preview selected match emails`.
5. Read both email previews.
6. If the preview is correct, run `YDP Matching > Send match emails to selected pair`.
7. Confirm the selected row gets `SENT` statuses and sent-at dates.
8. Only after the selected-row test works, use `Send match emails to all unsent matched pairs`.
