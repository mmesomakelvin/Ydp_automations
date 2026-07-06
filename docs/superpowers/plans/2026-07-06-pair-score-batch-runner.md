# Pair Score Batch Runner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safer button that scores multiple mentor/mentee pairs per run while preserving all existing pair scores.

**Architecture:** Extend the existing matching Apps Script file. Keep `Generate next pair score` for one-pair testing, then add `Generate pair scores batch` for short resumable batches that stop on quota, errors, or time limits.

**Tech Stack:** Google Apps Script, Google Sheets, Gemini API, local Node helper tests.

---

### Task 1: Batch Pair Score Button

**Files:**
- Modify: `matching/YDP Matching Automation.gs`
- Test: `tests/pair-scores-helpers.test.js`
- Modify: `README.md`
- Modify: `artifacts/superpowers/7. Pair Scores Auto Matching.md`

- [ ] Add a failing helper test for batch pair scoring defaults and skip behavior.
- [ ] Add `defaultPairScoringBatchSize` to the matching config.
- [ ] Add `Generate pair scores batch` to the `YDP Matching` menu.
- [ ] Extract pair scoring into a reusable helper so the one-pair and batch buttons use the same logic.
- [ ] Make the batch button score up to the configured number of unscored pairs and stop safely on Gemini quota.
- [ ] Update README and artifact docs with layman usage instructions.
- [ ] Run `node tests\pair-scores-helpers.test.js`.
- [ ] Push the matching Apps Script with `clasp push`.
- [ ] Commit and push to GitHub.
