# YDP Automation Superpowers

This folder contains the planning artifacts for YDP Mentorship Program automations.

Each numbered file is one automation capability, written in plain language before or alongside implementation.

## Build Tracker

| # | Superpower/System | Status | What has been done | What is left |
| --- | --- | --- | --- | --- |
| 1 | Participant Registration Email Automation | Deployed | Mentee registration email automation is built and deployed. It sends new-registration emails, already-registered updates, adds tracking columns, supports tests/previews/bulk sends/selected-row sends/resends, and has a form-submit trigger installer. | Confirm the form-submit trigger is installed in the live sheet. Send tests after any future change. |
| 2 | Mentor Registration Email Automation | Deployed | Mentor registration email automation is built and deployed in its own Apps Script project. It mirrors the mentee controls for tests, previews, bulk sends, selected-row sends, resends, tracking columns, and trigger installation. | Confirm the form-submit trigger is installed in the live sheet. Send tests after any future change. |
| 3 | Reminders, Nudges, and Weekly KPI Digest | Brainstorming | Major version 1 decisions are captured: email-only, monthly mentee activities, reminder timing, no-show rules, feedback form rules, Google Sheets dashboard first, PDF report, chart snapshots, and Gemini-assisted write-up. | Finalize exact sheet names, sheet columns, stakeholder recipients, sender name, report check time, and Gemini privacy level. Then design/build the Apps Script and dashboard. |
| 4 | YDP Program Control Center | Brainstorming | Internal Vercel portal direction is captured: Google login allowlist, hybrid Google Sheet + GitHub docs source, view-only first, status dashboard plus documentation library. | Finalize tracker columns, allowed users, website framework, page structure, and GitHub/Sheet reading method. Then build the tracker and portal. |

## Implementation Links

| # | System | Main files | Apps Script / Hosting |
| --- | --- | --- | --- |
| 1 | Participant Registration Email Automation | `YDP Mentee Email.gs`, root `.clasp.json` | Apps Script ID: `1HnM-PC5rnLXOmbN-DW9mZBTITdeL2cFyFaX6KJ3_iVyT94iQHKN9520u` |
| 2 | Mentor Registration Email Automation | `mentor/YDP Mentor Email.gs`, `mentor/.clasp.json` | Apps Script ID: `1TyZ8bcZaKDAVBVOu_cl6xbVTsdZ9-4KCgQ4OTF2iB34e24kx49XIILp1` |
| 3 | Reminders, Nudges, and Weekly KPI Digest | Not built yet | Planned Apps Script + Google Sheets dashboard |
| 4 | YDP Program Control Center | Not built yet | Planned Vercel internal website |

## What Is Left

### For Registration Automations

- Install or confirm form-submit triggers from the Google Sheet menus if not already done.
- Send test emails after any future changes.
- Keep the GitHub repo and Apps Script projects synced when edits are made.

### For Reminders, Nudges, and KPI Digest

Still to decide:

- Exact sheet names.
- Exact Program Calendar columns.
- Exact Matched Pairs columns.
- Exact Attendance Form response columns.
- Exact Monthly Feedback Form response columns.
- Stakeholder recipient email addresses.
- Sender name for operational emails.
- Report check time and timezone.
- Gemini privacy level: KPI numbers only, or KPI numbers plus summarized feedback text.

Still to build:

- Program Calendar sheet structure.
- Matched Pairs operations structure.
- Attendance response reader.
- Feedback response reader.
- Reminder email templates.
- No-show nudge email template.
- KPI calculation logic.
- Google Sheets dashboard.
- PDF export workflow.
- Gemini summary generation.
- Apps Script time-driven triggers.

### For YDP Program Control Center

Still to decide:

- Exact Google Sheet tracker columns for `Automations`.
- Exact Google Sheet tracker columns for `Tasks`.
- First allowed user emails.
- Vercel website framework.
- Whether the portal should read GitHub Markdown content directly or link to the Markdown files.
- Whether charts are needed in version 1.

Still to build:

- Google Sheet tracker.
- Internal Vercel website.
- Google login allowlist.
- Automation status dashboard.
- Documentation library.
- Quick links section.
- Recent updates section.
- Open decisions section.
