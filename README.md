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
