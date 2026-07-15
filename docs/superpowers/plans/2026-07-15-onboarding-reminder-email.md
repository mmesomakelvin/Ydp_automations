# YDP Onboarding Reminder Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a separately tracked July 18, 2026 onboarding reminder campaign to the existing mentee and mentor registration automations.

**Architecture:** Extend each existing Apps Script file with an `ONBOARDING` email type, campaign-specific status columns, preview/test support, and an unsent-only bulk menu action. Keep registration and already-registered tracking unchanged while making duplicate protection campaign-aware.

**Tech Stack:** Google Apps Script, Node.js `vm`-based tests, clasp, Git.

## Global Constraints

- Sender name remains `YDP Mentorship Team`.
- Onboarding is Saturday, July 18, 2026.
- Existing registration and already-registered statuses must not block the new campaign.
- An onboarding reminder already marked `SENT` for the same email must be skipped.
- No automatic send trigger is added; the team starts this campaign from a menu button.

---

### Task 1: Campaign Contract Tests

**Files:**
- Create: `tests/onboarding-reminder-email.test.js`
- Test: `YDP Mentee Email.gs`
- Test: `mentor/YDP Mentor Email.gs`

**Interfaces:**
- Consumes: `buildYdpMenteeEmail_(rowData, type)`, `buildYdpMentorEmail_(rowData, type)`, both config objects, and status-header helpers.
- Produces: executable requirements for `ONBOARDING` templates and campaign tracking.

- [ ] Write a test that loads both Apps Script files in isolated VM contexts and asserts the July 18 date, new status headers, onboarding subject, gratitude wording, mentee selection wording, mentor assignment wording, sender name, and campaign-specific status-header mapping.
- [ ] Run `node tests/onboarding-reminder-email.test.js` and confirm it fails because the `ONBOARDING` campaign does not exist.

### Task 2: Mentee And Mentor Campaign Implementation

**Files:**
- Modify: `YDP Mentee Email.gs`
- Modify: `mentor/YDP Mentor Email.gs`
- Modify: `README.md`
- Modify: `artifacts/superpowers/README.md`

**Interfaces:**
- Consumes: existing bulk send, row send, status repair, duplicate detection, preview, and data dictionary helpers.
- Produces: `sendYdpMenteeOnboardingRemindersToAllUnsentRows()` and `sendYdpMentorOnboardingRemindersToAllUnsentRows()`.

- [ ] Add `Onboarding Reminder Email Status` and `Onboarding Reminder Email Sent At` to both configs and setup functions.
- [ ] Add the two menu actions and route them through the existing bulk send functions with type `ONBOARDING`.
- [ ] Add role-specific `ONBOARDING` email bodies and update `startDateText` to `July 18, 2026`.
- [ ] Make preview, test, resend, status mapping, duplicate checking, and sent-date repair understand `ONBOARDING`.
- [ ] Add plain-English data dictionary rows and README instructions for the new campaign button.
- [ ] Run `node tests/onboarding-reminder-email.test.js`, all existing Node tests, and `git diff --check`.
- [ ] Push the root clasp project and the `mentor` clasp project from their respective folders.
- [ ] Commit only the onboarding campaign files and push `main` to GitHub.
