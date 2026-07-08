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
| 5 | Mentor-Mentee Matching Criteria | Built / operational testing | Source Google Doc was read and converted into mentee selection criteria, weighted scoring, and mentor-mentee pairing priorities. Matching workbook setup, source snapshot sync, Gemini connection test, Gemini-assisted mentee scoring, pair scoring, pair score batching, and auto-matching from saved pair scores are built. | Continue operational scoring in the live workbook: score remaining mentees, generate remaining pair scores, then run auto-match when each eligible mentee has been scored against all available mentors. |
| 6 | Mentee Application Intake Automation | Brainstorming | Mentee-first intake design captured: same response sheet, intake score/status/recommendation/notes, email+phone duplicate checks, and `Intake Dictionary` helper tab. | Confirm required fields and phone-normalization rules, then extend the existing mentee Apps Script. |
| 7 | Pair Scores Auto Matching | Built / operational testing | Final matching design is documented separately: every eligible mentee is compared against every available mentor, Gemini scores each pair, and the system selects final matches. `Pair Scores`, `Generate next pair score`, `Generate pair scores batch`, and `Auto-match from pair scores` are built in the matching Apps Script. | Use the batch scorer until pair scores are complete enough, then run auto-match. Next build after this is match notification email sending from `Matched Pairs`. |

## Implementation Links

| # | System | Main files | Apps Script / Hosting |
| --- | --- | --- | --- |
| 1 | Participant Registration Email Automation | `YDP Mentee Email.gs`, root `.clasp.json` | Apps Script ID: `1HnM-PC5rnLXOmbN-DW9mZBTITdeL2cFyFaX6KJ3_iVyT94iQHKN9520u` |
| 2 | Mentor Registration Email Automation | `mentor/YDP Mentor Email.gs`, `mentor/.clasp.json` | Apps Script ID: `1TyZ8bcZaKDAVBVOu_cl6xbVTsdZ9-4KCgQ4OTF2iB34e24kx49XIILp1` |
| 3 | Reminders, Nudges, and Weekly KPI Digest | Not built yet | Planned Apps Script + Google Sheets dashboard |
| 4 | YDP Program Control Center | Not built yet | Planned Vercel internal website |
| 5 | Mentor-Mentee Matching Criteria | `matching/YDP Matching Automation.gs`, `matching/.clasp.json` | Apps Script ID: `1svZufkQfd0cKRBv75BuxTOqs6QIMQWA214SLU5d69QF_x8Z1IjM7DCYf`; source doc: `https://docs.google.com/document/d/1ytuSV7vLncZbyLF_6ebbXijYoYt9ZYyZTo7rzPmuOqE/edit?usp=sharing` |
| 6 | Mentee Application Intake Automation | Planned extension to `YDP Mentee Email.gs` | Uses existing mentee Apps Script ID: `1HnM-PC5rnLXOmbN-DW9mZBTITdeL2cFyFaX6KJ3_iVyT94iQHKN9520u` |
| 7 | Pair Scores Auto Matching | `matching/YDP Matching Automation.gs`, `matching/.clasp.json` | Apps Script ID: `1svZufkQfd0cKRBv75BuxTOqs6QIMQWA214SLU5d69QF_x8Z1IjM7DCYf` |

## What Is Left

### For Registration Automations

- Install or confirm form-submit triggers from the Google Sheet menus if not already done.
- Send test emails after any future changes.
- Keep the GitHub repo and Apps Script projects synced when edits are made.

### For Matching Automations

Built:

- Matching workbook setup and source snapshot sync.
- Gemini mentee scoring, including `Gemini Review Status`.
- Batch mentee scoring.
- Gemini pair scoring into `Pair Scores`.
- Batch pair scoring.
- Auto-match from saved pair scores into `Match Recommendations` and `Matched Pairs`.
- Matching workbook data dictionary.

Still to run in the live workbook:

- Continue `Generate mentee scores batch` until all desired mentees are scored.
- Continue `Generate pair scores batch` until each `Can Pair` mentee has scored rows against all available mentors.
- Run `Auto-match from pair scores` after pair scoring is complete enough.

Still to build next:

- Match notification emails from the final `Matched Pairs` sheet.
- Email tracking columns for match notifications.
- Preview, selected-send, and bulk-send buttons for match emails.

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
