# YDP Automation Demo Guide Design

## Purpose

Create a presenter-friendly PDF that helps the YDP team explain the mentorship automation program from inception through live operation, source control, and deployment.

## Audience

- Internal YDP operations team
- YDP leadership

The guide must be understandable to non-technical leaders while remaining accurate enough for the team members who operate the Google Sheets and Apps Script menus.

## Presentation Context

- Target duration: 20-30 minutes
- Delivery style: live demonstration supported by a landscape PDF
- Reading pattern: one clear idea per page, large type, concise speaking prompts

## Recommended Format

Use a hybrid presenter guide:

1. Begin with the operational problem and leadership value.
2. Explain the three-project architecture in plain English.
3. Walk through the registration and matching automations.
4. Provide exact live-demo clicks, expected results, and safety warnings.
5. Close with Git, clasp, current status, limitations, and next steps.

## Page Structure

The PDF should contain approximately 14-18 landscape pages:

1. Title and demo objective
2. The original problem
3. What YDP decided to automate
4. System overview and three Apps Script projects
5. Mentee registration workflow
6. Mentor registration workflow
7. IDs, duplicate protection, and email safeguards
8. Matching workbook and data flow
9. Gemini-assisted mentee scoring
10. Pair scoring and final matching
11. Live demo checklist with exact clicks
12. GitHub, clasp, and deployment workflow
13. Current status: built, operational testing, and planned
14. Error handling and safe recovery
15. Leadership value and next phase
16. Questions and useful links

## Repeating Presenter Pattern

Where relevant, each page should use these labels:

- **Say:** concise wording the presenter can speak.
- **Show:** the workbook, sheet, file, or screen to display.
- **Do:** the exact menu item, button, or command to use.
- **Expected:** the result the audience should see.
- **Safety:** the control that prevents accidental bulk sends, duplicate emails, lost work, or exposed secrets.

## Content Rules

- Use plain English before technical terms.
- Clearly distinguish what is deployed, what is in operational testing, and what is only planned.
- Explain that Google Sheets is the operational interface, Apps Script performs the automation, Gemini assists with scoring, clasp synchronizes local code to Apps Script, and GitHub stores the source history.
- Explain that mentee and mentor registration automations use separate Apps Script project IDs.
- Explain that the matching automation uses a third Apps Script project ID.
- Explain email duplicate protection and selected-row testing before bulk sending.
- Explain that Gemini errors do not delete completed scoring work.
- Explain that `503 UNAVAILABLE` means the selected Gemini model is temporarily overloaded.
- Include the safe operational order for mentee scoring, pair scoring, auto-matching, email preview, selected sending, and bulk sending.

## Confidentiality Rules

- Do not include Gemini API key values.
- Do not include participant phone numbers or application answers.
- Avoid participant names and email addresses in screenshots or examples.
- Script IDs may be listed because they are project identifiers, not authentication secrets.
- Repository and source-document links may be included as operational references.

## Visual Direction

- Landscape A4 pages for screen presentation and printing.
- White or very light neutral background.
- Dark charcoal text with restrained YDP green, Google blue, and amber status accents.
- Large headings and body text suitable for speaking at a distance.
- No dense paragraphs or decorative illustrations.
- Use simple process diagrams, numbered steps, and status tables.
- Keep code commands in compact monospace blocks.
- Add page numbers and a quiet footer naming the YDP Mentorship Automation Program.

## Source Material

The guide should be generated from the repository documentation and current implementation state:

- `README.md`
- `artifacts/superpowers/README.md`
- `artifacts/superpowers/1. Participant Registration Email Automation.md`
- `artifacts/superpowers/2. YDP Mentorship Program Mentor Registration Email Automation.md`
- `artifacts/superpowers/5. Mentor Mentee Matching Criteria.md`
- `artifacts/superpowers/7. Pair Scores Auto Matching.md`
- the three Apps Script source folders and their current Git history

## Acceptance Criteria

- The PDF is readable while the presenter is speaking.
- The full walkthrough fits a 20-30 minute demo.
- Every live action has an expected result and safety note.
- GitHub and clasp are explained in plain English and demonstrated with exact commands.
- Current limitations and next steps are explicit.
- No secrets or participant data are exposed.
- The PDF opens successfully and all pages render without clipped or overlapping text.
- A source document is retained so future automation changes can be reflected in a regenerated PDF.
