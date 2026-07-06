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

The matching script reads the Gemini key from Apps Script Script Properties:

```text
GEMINI_API_KEY
```

Do not store the Gemini API key in code or GitHub.

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
| `Repair missing sent date for selected row` | Fills a missing sent-at date when the status already says `SENT`. It does not send an email. | Use when a row says `SENT` but the matching date column is blank. | Select the affected row first. This writes today's date as the repair date. |
| `Resend email to selected row` | Forces a resend to the selected row and asks which email type to resend. | Use only when someone says they did not receive the email, or you intentionally want to resend. | This bypasses normal duplicate protection for that selected row. |

Recommended mentee setup order:

1. `Setup email tracking columns`
2. `Assign IDs and mark duplicates`
3. `Install form submit trigger`
4. `Send test mentee email`
5. For old registrations, use `Send already registered mentee update to all unsent rows`
6. For future registrations, let the trigger send automatically

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
| `Repair missing sent date for selected row` | Fills a missing sent-at date when the status already says `SENT`. It does not send an email. | Use when a row says `SENT` but the matching date column is blank. | Select the affected row first. This writes today's date as the repair date. |
| `Resend email to selected row` | Forces a resend to the selected row and asks which email type to resend. | Use only when someone says they did not receive the email, or you intentionally want to resend. | This bypasses normal duplicate protection for that selected row. |

Recommended mentor setup order:

1. `Setup email tracking columns`
2. `Assign IDs and mark duplicates`
3. `Install form submit trigger`
4. `Send test mentor email`
5. For old registrations, use `Send already registered mentor update to all unsent rows`
6. For future registrations, let the trigger send automatically

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
8. Open `YDP Matching > Generate next pair score`.
9. After the first pair score works, use `YDP Matching > Generate pair scores batch` to score several unscored pairs at a time.

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
| `Generate next pair score` | Uses Gemini to score one eligible mentee against one available mentor and writes the comparison into `Pair Scores`. | Use after mentee scores and mentor snapshots exist. Run it again later to continue pair scoring. | This can hit Gemini quota. Existing pair scores are preserved. If a row says `Error`, read `Gemini Concern`; running the button again retries that same pair. |
| `Generate pair scores batch` | Uses Gemini to score up to 5 unscored mentee/mentor pairs in one run and writes them into `Pair Scores`. | Use after the one-pair test works. This is the normal button for moving faster. | It still may stop because of Gemini quota or Apps Script time limits. Nothing already scored is deleted. Run it again later to continue. |
| `Test Gemini connection` | Checks that the Gemini API key is working. | Use after setting or changing the API key. | The API key must stay in Apps Script Script Properties, not in GitHub. |

## Mentee Scoring

The `Generate next mentee score` button scores mentees in `Mentee Source Snapshot` one at a time.

It is intentionally one-at-a-time because Gemini can hit quota/rate limits if too many people are scored in one run. The script keeps completed scores, skips already-scored mentees, retries rows marked `ERROR`, and stops safely when quota is reached.

It writes these review columns into `Mentee Scores`:

- `Learning Commitment Score`
- `Community Engagement Score`
- `Career Goals Score`
- `Soft Skills Score`
- `Final Score`
- `Review Status`
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

The matching automation currently sets scored rows to `Pending Review`. The program team still reviews before anyone is selected or matched.

If you see a quota message, do not delete the sheet. Wait for the quota window to reset, then run `Generate next mentee score` again. It will continue from the unscored or `ERROR` rows.

The current build sets up the matching workbook, source snapshots, Gemini connection test, and mentee scoring. It does not finalize mentor-mentee matches yet.

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
- `Review Status = Pending Review`,
- a mentee ID,
- an email address.

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
