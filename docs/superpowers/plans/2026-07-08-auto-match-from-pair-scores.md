# Auto-Match From Pair Scores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Auto-match from pair scores` button that creates match recommendations and matched-pair rows from completed Gemini pair scores.

**Architecture:** Extend `matching/YDP Matching Automation.gs`. The button reads eligible mentees, available mentors, and scored pair rows, selects the highest-scoring available mentor per mentee, respects flexible mentor capacity, and writes output to `Match Recommendations` and `Matched Pairs`.

**Tech Stack:** Google Apps Script, Google Sheets, local Node helper tests.

---

### Task 1: Pure Auto-Match Selection

**Files:**
- Modify: `matching/YDP Matching Automation.gs`
- Modify: `tests/pair-scores-helpers.test.js`

- [ ] Add a failing Node test proving the selector picks the highest-scoring mentor and respects capacity.
- [ ] Implement the selector as a pure helper that does not require SpreadsheetApp.
- [ ] Run `node tests\pair-scores-helpers.test.js`.

### Task 2: Workbook Button

**Files:**
- Modify: `matching/YDP Matching Automation.gs`
- Modify: `README.md`
- Modify: `artifacts/superpowers/7. Pair Scores Auto Matching.md`

- [ ] Add `Auto-match from pair scores` to the `YDP Matching` menu.
- [ ] Read `Mentee Scores`, `Mentor Source Snapshot`, and `Pair Scores`.
- [ ] Write selected rows into `Match Recommendations` and `Matched Pairs`.
- [ ] Skip mentees whose full set of mentor pair scores is not ready yet.
- [ ] Update docs with how to test.
- [ ] Push to Apps Script and GitHub.
