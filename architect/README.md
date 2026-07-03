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
| 5 | Mentor-Mentee Matching Criteria | Google Sheets + Apps Script + mentor/mentee IDs + optional Gemini assistance + human review | Design in progress |

## Build Rules

- Each Apps Script automation must keep its own `.clasp.json` and script ID.
- Google Sheets should remain the operational backend unless there is a clear reason to add a database.
- GitHub Markdown files should remain the documentation source.
- The Vercel portal should be view-only in version 1.
- Do not add WhatsApp automation until a WhatsApp Cloud API or Twilio setup is confirmed.
- Do not use Gemini to calculate raw metrics. Calculate metrics first, then use Gemini only for narrative summaries.
