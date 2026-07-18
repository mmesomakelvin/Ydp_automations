# YDP Workbook Button Guides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the mentee, mentor, and matching workbooks a complete `Data Dictionary` tab and a separate, safety-colored `Button Guide` tab.

**Architecture:** Each Apps Script project will retain its local documentation data because the projects deploy independently. The existing `Create data dictionary` command will call one documentation refresh function that writes both tabs. Pure row-data and color-mapping helpers will make completeness and safety behavior testable without Google Sheets.

**Tech Stack:** Google Apps Script, Google Sheets, Node.js assertion tests, clasp, GitHub.

## Global Constraints

- Documentation refreshes must never send email, invoke Gemini, assign IDs, score rows, or modify participant records.
- The three safety levels are exactly `SAFE`, `CAUTION`, and `LIVE ACTION`.
- Safety colors are green `#d9ead3`, yellow `#fff2cc`, and red `#f4cccc`.
- Every custom menu command must appear exactly once in its workbook's Button Guide.
- The existing unrelated `YDP Website Metric Builder/src/app/` worktree content must remain untouched.

---

### Task 1: Define the documentation contract in tests

**Files:**
- Modify: `tests/data-dictionary-helpers.test.js`

**Interfaces:**
- Consumes: `getYdpMenteeDataDictionaryRows_`, `getYdpMentorDataDictionaryRows_`, `getYdpMatchingDataDictionaryRows_`
- Produces: expected interfaces `getYdpMenteeButtonGuideRows_`, `getYdpMentorButtonGuideRows_`, `getYdpMatchingButtonGuideRows_`, and workbook-specific safety-color helpers

- [ ] **Step 1: Add failing contract tests**

Add assertions that each dictionary header equals:

```javascript
[
  'Sheet Name',
  'Sheet Purpose',
  'Column Name',
  'Column Meaning',
  'Automation Use',
  'Can Team Edit?',
  'Notes'
]
```

Add assertions that each Button Guide header equals:

```javascript
[
  'Safety Level',
  'Menu Name',
  'Button Name',
  'What It Does',
  'When To Run',
  'Before Running',
  'What It Changes',
  'Recommended Frequency'
]
```

Extract every `.addItem(...)` label from each source file and assert that it appears exactly once in that script's guide rows. Assert that non-header guide rows use only `SAFE`, `CAUTION`, or `LIVE ACTION`, and that every cell in each row is non-empty.

- [ ] **Step 2: Run the test and verify the missing-interface failure**

Run:

```powershell
node tests/data-dictionary-helpers.test.js
```

Expected: FAIL because the Button Guide row helpers do not exist and the old dictionary header has five columns.

- [ ] **Step 3: Commit the failing test contract**

```powershell
git add tests/data-dictionary-helpers.test.js
git commit -m "Test workbook documentation guides"
git push origin main
```

---

### Task 2: Implement the mentee workbook documentation tabs

**Files:**
- Modify: `YDP Mentee Email.gs`
- Test: `tests/data-dictionary-helpers.test.js`

**Interfaces:**
- Produces: `getYdpMenteeButtonGuideRows_(): string[][]`
- Produces: `getYdpMenteeButtonGuideColor_(safetyLevel: string): string`
- Produces: `writeYdpMenteeButtonGuide_(sheet, rows): void`

- [ ] **Step 1: Separate dictionary and button data**

Change `getYdpMenteeDataDictionaryRows_()` to return only the seven-column sheet/column table. Move all existing button entries into `getYdpMenteeButtonGuideRows_()` and give each row complete operating guidance.

Classify preview, test, setup, trigger installation, and dictionary refresh as `SAFE`; ID assignment and date repair as `CAUTION`; all participant sends, bulk sends, and force resend as `LIVE ACTION`.

- [ ] **Step 2: Add formatting and safety colors**

Implement the pure mapping:

```javascript
function getYdpMenteeButtonGuideColor_(safetyLevel) {
  return {
    SAFE: '#d9ead3',
    CAUTION: '#fff2cc',
    'LIVE ACTION': '#f4cccc'
  }[safetyLevel] || '#ffffff';
}
```

Write full-row colors from row 2 down, freeze row 1, add a filter, wrap text, and set practical column widths. Apply equivalent readable formatting to `Data Dictionary`.

- [ ] **Step 3: Refresh both tabs from one safe command**

Update `createYdpMenteeDataDictionary()` to write `Data Dictionary` and create or refresh `Button Guide`. Its alert must say both tabs were updated and participant data was not changed.

- [ ] **Step 4: Run tests**

```powershell
node tests/data-dictionary-helpers.test.js
node tests/onboarding-reminder-email.test.js
```

Expected: the mentee assertions pass; mentor or matching contract assertions remain failing until their tasks are implemented.

- [ ] **Step 5: Deploy and commit the mentee implementation**

```powershell
clasp push --force
git add "YDP Mentee Email.gs"
git commit -m "Add mentee workbook button guide"
git push origin main
```

---

### Task 3: Implement the mentor workbook documentation tabs

**Files:**
- Modify: `mentor/YDP Mentor Email.gs`
- Test: `tests/data-dictionary-helpers.test.js`

**Interfaces:**
- Produces: `getYdpMentorButtonGuideRows_(): string[][]`
- Produces: `getYdpMentorButtonGuideColor_(safetyLevel: string): string`
- Produces: `writeYdpMentorButtonGuide_(sheet, rows): void`

- [ ] **Step 1: Create the mentor dictionary and guide datasets**

Use the same seven-column dictionary and eight-column guide contracts. Include every mentor menu command, including today's onboarding-details campaign. Clearly state that live send rows update email status, sent-at, and last-error columns.

- [ ] **Step 2: Add mentor formatting and refresh behavior**

Use the same three exact safety colors. Update `createYdpMentorDataDictionary()` to refresh both tabs and leave application and email history unchanged.

- [ ] **Step 3: Run tests**

```powershell
node tests/data-dictionary-helpers.test.js
node tests/onboarding-reminder-email.test.js
```

Expected: mentee and mentor documentation assertions pass; matching assertions remain failing until Task 4.

- [ ] **Step 4: Deploy and commit the mentor implementation**

```powershell
Set-Location mentor
clasp push --force
Set-Location ..
git add "mentor/YDP Mentor Email.gs"
git commit -m "Add mentor workbook button guide"
git push origin main
```

---

### Task 4: Implement the matching workbook documentation tabs

**Files:**
- Modify: `matching/YDP Matching Automation.gs`
- Test: `tests/data-dictionary-helpers.test.js`

**Interfaces:**
- Produces: `getYdpMatchingButtonGuideRows_(): string[][]`
- Produces: `getYdpMatchingButtonGuideColor_(safetyLevel: string): string`
- Produces: `writeYdpMatchingButtonGuide_(sheet, rows): void`

- [ ] **Step 1: Complete sheet and column definitions**

Convert the existing matching dictionary to the seven-column contract. Give each operational tab a repeated plain-English purpose and document all configured columns for Source Config, snapshots, Mentee Scores, Pair Scores, Match Recommendations, Matched Pairs, Run Log, Data Dictionary, and Button Guide.

- [ ] **Step 2: Add every matching menu command to Button Guide**

Classify setup, documentation, preview, test email, and Gemini connection checks as `SAFE`; source sync and Gemini scoring as `CAUTION`; auto-match and all live email commands as `LIVE ACTION`.

For auto-match, state that it fills each mentor's stated capacity first and only then permits up to two overflow mentees. For batch scoring, state that reruns continue from unscored rows and may pause when Gemini limits are reached.

- [ ] **Step 3: Add matching formatting and two-tab refresh**

Implement the same filters, frozen headers, wrapping, widths, and safety colors. `createYdpMatchingDataDictionary()` must refresh both tabs without running source sync, scoring, matching, or email sends.

- [ ] **Step 4: Run all tests**

```powershell
Get-ChildItem tests/*.test.js | Sort-Object Name | ForEach-Object {
  node $_.FullName
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
```

Expected: every test exits successfully.

- [ ] **Step 5: Deploy and commit the matching implementation**

```powershell
Set-Location matching
clasp push --force
Set-Location ..
git add "matching/YDP Matching Automation.gs"
git commit -m "Add matching workbook button guide"
git push origin main
```

---

### Task 5: Update operating documentation and verify deployments

**Files:**
- Modify: `README.md`
- Test: all files in `tests/*.test.js`

**Interfaces:**
- Consumes: all three deployed documentation implementations
- Produces: internal operating instructions for refreshing and reading the guides

- [ ] **Step 1: Update README instructions**

Document that `Create data dictionary` refreshes both tabs and explain the three safety levels. Include this operating rule:

```text
Green can be run for setup or inspection. Yellow changes or processes workbook data and should be run deliberately. Red performs live matching or communications and requires preview/testing and approval first.
```

- [ ] **Step 2: Run final verification**

```powershell
Get-ChildItem tests/*.test.js | Sort-Object Name | ForEach-Object {
  node $_.FullName
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
git diff --check
git status --short --branch
```

Expected: all tests pass, `git diff --check` exits successfully, and only intended README changes plus the pre-existing unrelated website folder appear.

- [ ] **Step 3: Commit and push README**

```powershell
git add README.md
git commit -m "Document workbook safety guides"
git push origin main
```

- [ ] **Step 4: Verify Git synchronization**

```powershell
git rev-list --left-right --count origin/main...main
git log --oneline -5
```

Expected: `0 0`, with the documentation-guide commits at the top of the log.
