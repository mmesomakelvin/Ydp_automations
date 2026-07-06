# Pair Scores Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first working Pair Scores slice: setup creates the `Pair Scores` tab and the menu can score one eligible mentee/mentor pair with Gemini.

**Architecture:** Extend the existing matching Apps Script project. `Mentee Scores` supplies eligible mentees, `Mentor Source Snapshot` supplies mentors, and `Pair Scores` stores one Gemini-scored row per mentee/mentor pair. Scoring runs one pair per click to avoid Gemini quota issues.

**Tech Stack:** Google Apps Script V8, Google Sheets, Gemini API via `UrlFetchApp`, clasp, GitHub.

---

### Task 1: Pair Scores Workbook Structure

**Files:**
- Modify: `matching/YDP Matching Automation.gs`
- Modify: `README.md`
- Modify: `artifacts/superpowers/7. Pair Scores Auto Matching.md`

- [ ] Add `pairScores: 'Pair Scores'` to the matching sheet config.
- [ ] Add `Pair Scores` creation to `setupYdpMatchingWorkbookTabs_`.
- [ ] Add Pair Scores headers:
  - `Pair ID`
  - `Mentee ID`
  - `Mentee Name`
  - `Mentee Email`
  - `Mentor ID`
  - `Mentor Name`
  - `Mentor Email`
  - `Skill Fit Score`
  - `Career Fit Score`
  - `Availability Fit Score`
  - `Capacity Fit Score`
  - `Total Pair Score`
  - `Gemini Reason`
  - `Gemini Concern`
  - `Pair Score Status`
  - `Scored At`

### Task 2: Generate Next Pair Score

**Files:**
- Modify: `matching/YDP Matching Automation.gs`

- [ ] Add menu item `Generate next pair score`.
- [ ] Read eligible mentees from `Mentee Scores`.
- [ ] Read mentor profiles from `Mentor Source Snapshot`.
- [ ] Build deterministic `Pair ID` from mentee ID and mentor ID.
- [ ] Skip already-scored pair IDs.
- [ ] Send one unscored pair to Gemini.
- [ ] Parse JSON response with category scores.
- [ ] Clamp category scores to their max values.
- [ ] Write/update one row in `Pair Scores`.
- [ ] Stop safely if Gemini quota is reached.

### Task 3: Verification And Deployment

**Files:**
- Modify: `README.md`
- Modify: `artifacts/superpowers/7. Pair Scores Auto Matching.md`

- [ ] Syntax-check Apps Script through a temporary `.js` copy.
- [ ] Push matching project with `clasp.cmd push --force`.
- [ ] User test:
  - refresh matching sheet,
  - run `YDP Matching > Setup matching workbook`,
  - confirm `Pair Scores` tab exists,
  - run `YDP Matching > Generate next pair score`,
  - confirm one row appears in `Pair Scores` or a clean quota message appears.
- [ ] Commit and push GitHub.
