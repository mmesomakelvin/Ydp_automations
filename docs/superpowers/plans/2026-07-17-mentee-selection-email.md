# Mentee Selection Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe, tracked selection-email campaign for mentees marked `Can Pair` in the matching workbook.

**Architecture:** Extend the existing matching Apps Script with pure helpers for eligibility, email content, and send planning, then add thin Google Sheets UI and MailApp orchestration functions. Store campaign state on the existing `Mentee Scores` rows so selection decisions and notification status stay together.

**Tech Stack:** Google Apps Script, Google Sheets, MailApp, Node.js `assert`/`vm` tests, clasp, Git.

## Global Constraints

- Send only when `Gemini Review Status` is exactly `Can Pair`.
- Bulk sends must skip rows already marked `SENT`.
- Live sends must use a document lock, and `SENDING` must prevent an uncertain delivery from being retried automatically.
- Preview and test sends must not update participant tracking columns.
- Setup must preserve all existing workbook data.
- Do not expose participant data or API keys in documentation or tests.

---

### Task 1: Selection Email Helpers

**Files:**
- Create: `tests/mentee-selection-email.test.js`
- Modify: `matching/YDP Matching Automation.gs`

**Interfaces:**
- Produces: `getYdpMenteeSelectionEmailTrackingHeaders_()`, `isYdpMenteeEligibleForSelectionEmail_(rowData)`, `buildYdpMenteeSelectionEmail_(rowData)`, and `buildYdpMenteeSelectionEmailSendPlan_(rowData, options)`.

- [ ] Write assertions for the three tracking headers, `Can Pair` eligibility, personalized copy, and already-sent/ineligible send plans.
- [ ] Run `node tests/mentee-selection-email.test.js` and confirm failure because the helpers do not exist.
- [ ] Implement the minimal pure helpers.
- [ ] Run `node tests/mentee-selection-email.test.js` and confirm it passes.

### Task 2: Spreadsheet Actions And Tracking

**Files:**
- Modify: `matching/YDP Matching Automation.gs`
- Modify: `tests/mentee-selection-email.test.js`

**Interfaces:**
- Consumes: Task 1 helpers.
- Produces: `previewSelectedYdpMenteeSelectionEmail()`, `sendTestYdpMenteeSelectionEmail()`, `sendYdpMenteeSelectionEmailToSelectedRow()`, and `sendYdpMenteeSelectionEmailsToAllEligibleUnsent()`.

- [ ] Add failing source assertions for the four menu items and public action functions.
- [ ] Run the focused test and confirm the new assertions fail.
- [ ] Add non-destructive column setup, selected-row validation, preview/test behavior, one-row live sending, bulk sending, status timestamps, error recording, confirmation dialogs, and run logging.
- [ ] Update the data dictionary rows for the new columns and buttons.
- [ ] Run the focused test and confirm it passes.

### Task 3: Verification And Deployment

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: completed matching script.
- Produces: deployed Apps Script and operator instructions.

- [ ] Document the four actions, the tracking values, and the safe test order in `README.md`.
- [ ] Run every `tests/*.test.js` file with Node and confirm all pass.
- [ ] Run a syntax check by loading the Apps Script through the existing VM test harness.
- [ ] Inspect `git diff` to confirm no unrelated files or secrets are included.
- [ ] Push the `matching` project with clasp.
- [ ] Commit only the feature files and push `main` to GitHub.
