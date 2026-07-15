# YDP Onboarding Reminder Email Design

## Goal

Send a new, separately tracked onboarding reminder to existing mentors and mentees without changing or clearing their earlier registration-email history.

## Campaign

- Onboarding date: Saturday, July 18, 2026.
- Sender: YDP Mentorship Team.
- Mentees are thanked for coming this far and told they will learn whether they were selected before onboarding. Selected mentees will also receive their mentor details before then.
- Mentors are thanked for coming this far and told they will receive their assigned mentee details before onboarding.

## Workbook Controls

Each registration workbook receives two dedicated columns:

- `Onboarding Reminder Email Status`
- `Onboarding Reminder Email Sent At`

Each workbook menu receives a new bulk action:

- Mentee: `Send onboarding reminder to all unsent rows`
- Mentor: `Send onboarding reminder to all unsent rows`

The actions send only to valid, non-duplicate rows whose onboarding reminder status is not `SENT`. Successful sends record `SENT` and a timestamp. Failures record `ERROR` using the existing last-error column.

## Existing Behavior

Registration and already-registered email templates, statuses, and sent dates remain intact. The configured program start date is updated to July 18, 2026 so future registration messages do not mention the old date.

## Verification

- Automated tests load both Apps Script files and verify the new headers, menu actions, subjects, date, role-specific wording, and sender.
- Existing helper tests continue to pass.
- Both Apps Script projects are pushed from their correct clasp folders.
