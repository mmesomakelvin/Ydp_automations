# YDP Workbook Data Dictionary and Button Guide Design

## Goal

Make every YDP automation workbook understandable and safer for the internal team to operate without reading Apps Script code.

The change applies to:

- Mentee registration workbook
- Mentor registration workbook
- Mentor/mentee matching workbook

## Documentation Tabs

Each workbook will contain two generated documentation tabs.

### Data Dictionary

The `Data Dictionary` tab explains the workbook's sheets and their columns. It will include:

| Field | Purpose |
| --- | --- |
| Sheet Name | Exact worksheet tab name. |
| Sheet Purpose | Plain-English explanation of why the sheet exists. |
| Column Name | Exact column heading. |
| Column Meaning | What the value represents. |
| Automation Use | How the scripts use the column. |
| Can Team Edit? | Whether normal manual editing is safe. |
| Notes | Warnings, status meanings, or operating details. |

Every operational sheet must have a purpose and every automation-managed column must have a definition. Form-response and source-snapshot columns will be documented individually where their headers are present.

### Button Guide

The new `Button Guide` tab explains every item in the workbook's custom automation menu. It will include:

| Field | Purpose |
| --- | --- |
| Safety Level | SAFE, CAUTION, or LIVE ACTION. |
| Menu Name | The Google Sheets menu containing the command. |
| Button Name | Exact command label shown to the user. |
| What It Does | Plain-English result of running it. |
| When To Run | The correct stage or situation for the command. |
| Before Running | Required checks or prerequisite commands. |
| What It Changes | Sheets, statuses, emails, or records affected. |
| Recommended Frequency | Once, as needed, per batch, or only after approval. |

## Safety Colors

- Green: `SAFE` actions such as previews, tests, setup, and documentation refreshes.
- Yellow: `CAUTION` actions such as syncing source data, assigning IDs, Gemini scoring, and repair operations.
- Red: `LIVE ACTION` commands such as bulk emails, force resends, auto-matching, and final match notifications.

The color applies to the full button row. The Safety Level text remains present so the guide is understandable without relying only on color.

## Refresh Behavior

The existing `Create data dictionary` menu command will refresh both documentation tabs. It will:

1. Rebuild the `Data Dictionary` tab.
2. Rebuild the `Button Guide` tab.
3. Apply headers, filters, frozen rows, wrapping, widths, and safety colors.
4. Leave participant responses, IDs, scores, matches, statuses, and email records unchanged.

The documentation refresh itself must never send an email or call Gemini.

## Formatting

Both tabs will use:

- Frozen header row
- Bold high-contrast header styling
- Filters
- Wrapped text
- Practical fixed column widths
- Alternating row shading where it does not conflict with safety colors

## Testing

Automated tests will verify that:

- Each workbook produces a separate button-guide dataset.
- Every current custom-menu command has a guide row.
- Every guide row has a safety level and operating instructions.
- SAFE, CAUTION, and LIVE ACTION rows receive the correct colors.
- Creating documentation writes both tabs without invoking email or Gemini actions.

After local tests pass, each Apps Script project will be pushed separately and the changes will be committed to GitHub.
