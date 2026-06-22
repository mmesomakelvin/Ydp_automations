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

## Sheet Menu

After the script is pushed and the spreadsheet is refreshed, the sheet shows a custom menu:

```text
YDP Automation
```

Menu actions:

- `Setup email tracking columns`
- `Install form submit trigger`
- `Send test mentee email`
- `Preview selected row email`
- `Send mentee email to selected row`
- `Send mentee email to all unsent rows`
- `Send already registered mentee update to all unsent rows`
- `Resend email to selected row`

## Tracking Columns

The script creates these columns if they do not already exist:

- `Mentee Registration Email Status`
- `Mentee Registration Email Sent At`
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
artifacts/
```
