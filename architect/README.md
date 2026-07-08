# YDP Automation Architecture Index

This folder defines the recommended tech stack for each YDP automation artifact.

Use this as the build guardrail before implementation so we do not mix script IDs, data sources, APIs, or hosting choices.

## Tech Stack Summary

| # | Artifact/System | Primary Stack | Status |
| --- | --- | --- | --- |
| 1 | Participant Registration Email Automation | Google Sheets + Apps Script + MailApp + clasp | Built and deployed |
| 2 | Mentor Registration Email Automation | Google Sheets + separate Apps Script project + MailApp + clasp | Built and deployed |
| 3 | Reminders, Nudges, and Weekly KPI Digest | Google Sheets + Apps Script time triggers + MailApp + Google Sheets dashboard + Gemini API + PDF export | Design in progress |
| 4 | YDP Program Control Center | Vercel web app + Google login allowlist + Google Sheets tracker + GitHub Markdown docs | Design in progress |
| 5 | Mentor-Mentee Matching Criteria | Google Sheets + Apps Script + mentor/mentee IDs + Gemini scoring + auto-match review outputs + match emails | Built / operational testing |
| 6 | Mentee Application Intake Automation | Existing mentee Google Sheet + Apps Script form-submit trigger + rule-based scoring + intake dictionary tab | Design in progress |
| 7 | Pair Scores Auto Matching | Matching workbook + Apps Script + Gemini pair scoring + resumable pair scores + auto-matched final pairs | Built / operational testing |

## Build Rules

- Each Apps Script automation must keep its own `.clasp.json` and script ID.
- Google Sheets should remain the operational backend unless there is a clear reason to add a database.
- GitHub Markdown files should remain the documentation source.
- The Vercel portal should be view-only in version 1.
- Do not add WhatsApp automation until a WhatsApp Cloud API or Twilio setup is confirmed.
- Do not use Gemini to calculate raw metrics. Calculate metrics first, then use Gemini only for narrative summaries.

## Current Build Priority

1. Finish operational matching runs in the live workbook:
   - score remaining mentees,
   - generate remaining pair scores,
   - run auto-match after enough pair scores exist.
2. Test match notification emails from `Matched Pairs`:
   - preview one selected matched pair,
   - send one selected matched pair,
   - then bulk send unsent matched pairs only after the selected test works.
3. Build reminders, nudges, and weekly KPI digest.
4. Build the internal Vercel Program Control Center.
