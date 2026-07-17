# Mentee Selection Email Design

## Purpose

Notify selected YDP mentees that they have been chosen for the program while preventing emails from going to ineligible or already-contacted applicants.

## Source Of Truth

The feature lives in the YDP Matching Automation Apps Script and reads the `Mentee Scores` sheet. A row is eligible only when `Gemini Review Status` is exactly `Can Pair`.

The feature does not modify Gemini scores, review decisions, source snapshots, pair scores, match recommendations, or matched pairs.

## Tracking Columns

The setup process adds these columns to `Mentee Scores` without clearing existing data:

- `Selection Email Status`: blank before sending, `SENDING` while protected by the send lock, `SENT` after success, or `ERROR` after a confirmed failure. A stale `SENDING` row must be reviewed before retrying.
- `Selection Email Sent At`: the date and time of a successful send.
- `Selection Email Last Error`: the latest send error for that row.

## Menu Actions

- `Preview selected selection email`: displays the selected mentee's message without sending or changing tracking columns.
- `Send test selection email`: sends a personalized sample to an operator-supplied email address without changing tracking columns.
- `Send selection email to selected mentee`: sends to one selected eligible mentee and updates tracking.
- `Send selection emails to all eligible unsent mentees`: sends to all `Can Pair` rows that are not already marked `SENT`.

The selected-row and bulk actions skip ineligible rows. The bulk action also skips rows marked `SENT` or `SENDING`. A document lock prevents overlapping live-send runs. Invalid recipient addresses and confirmed send failures are recorded as `ERROR` with a readable message.

## Email

Subject: `You've been selected for the YDP Mentorship Program`

The message congratulates the mentee, thanks them for completing the application process, confirms the Saturday, July 18, 2026 onboarding session, asks for commitment, and explains that mentor details and next steps will arrive separately.

Sender name: `YDP Mentorship Team`.

## Safe Testing Sequence

1. Select a `Can Pair` row and preview the email.
2. Send a test copy to the operator's email; verify that no participant tracking status changes.
3. Send to one selected eligible mentee; verify `SENT` and the sent timestamp.
4. Run the selected-row send again; verify it is skipped as already sent.
5. Only then run the bulk action.
