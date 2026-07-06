# Mentee Scoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a matching workbook button that scores all synced mentees using the documented YDP selection criteria.

**Architecture:** The matching Apps Script reads rows from `Mentee Source Snapshot`, sends each mentee's relevant answers to Gemini for structured category scores, calculates the weighted final score, and writes reviewable results into `Mentee Scores`. Scoring runs one mentee at a time, preserves completed scores, and stops cleanly when Gemini quota is reached. The workflow remains human-review-first; no mentee is selected or rejected automatically.

**Tech Stack:** Google Apps Script, Google Sheets, Gemini API via `UrlFetchApp`, CLASP, GitHub.

---

### Task 1: Add Scoring Menu And Output Columns

**Files:**
- Modify: `matching/YDP Matching Automation.gs`

- [ ] Add `Generate next mentee score` to the `YDP Matching` menu.
- [ ] Expand `Mentee Scores` headers to include category scores, final score, scoring status, reviewer notes, Gemini summary, Gemini concerns, and scored timestamp.
- [ ] Keep existing setup behavior safe to rerun.

### Task 2: Score All Synced Mentees

**Files:**
- Modify: `matching/YDP Matching Automation.gs`

- [ ] Read all rows from `Mentee Source Snapshot`.
- [ ] Find columns by flexible header matching so long Google Form questions still work.
- [ ] For each mentee row, build a concise scoring prompt using the four documented criteria.
- [ ] Ask Gemini for JSON only:
  - `learningScore`
  - `communityScore`
  - `careerScore`
  - `softSkillsScore`
  - `summary`
  - `concerns`
- [ ] Clamp category scores to `0-5`.
- [ ] Calculate final score as:

```text
learningScore * 8 + communityScore * 4 + careerScore * 4 + softSkillsScore * 4
```

- [ ] Write one output row per mentee.
- [ ] Skip already-scored mentees.
- [ ] Retry rows marked `ERROR` on the next run.
- [ ] If Gemini quota is reached, stop the run instead of creating error rows for all remaining mentees.
- [ ] If one non-quota mentee fails, write that row as `ERROR` and continue with the next mentee.

### Task 3: Documentation And Verification

**Files:**
- Modify: `README.md`
- Modify: `artifacts/superpowers/5. Mentor Mentee Matching Criteria.md`

- [ ] Explain the new button in plain language.
- [ ] Explain that scoring uses Gemini but does not make the final selection decision.
- [ ] Syntax-check the Apps Script through a temporary `.js` copy.
- [ ] Push the matching Apps Script with `clasp.cmd push --force`.
- [ ] Commit and push the repository.
