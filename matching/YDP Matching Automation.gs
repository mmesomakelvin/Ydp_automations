const YDP_MATCHING_CONFIG = {
  menuName: 'YDP Matching',
  defaultMenteeSpreadsheetId: '1XkXpLf6y7qhpJJvn9Afg4EvO9J_a482OBdeHZxuM0Nk',
  oldMenteeSpreadsheetIds: [
    '1XkXpLf6y7qhpJyn9Afg4EvO9J_a482OBdeHZxuM0Nk'
  ],
  defaultMentorSpreadsheetId: '1xKEca0gDJCkfkkI00QmhymfPfvn6o-fP-k8CF_LKaAU',
  defaultResponseTabName: 'Form_Responses',
  defaultGeminiModel: 'gemini-3.5-flash',
  defaultMenteeScoringBatchSize: 3,
  defaultPairScoringBatchSize: 5,
  maxMenteeScoringRunMilliseconds: 90000,
  maxManualRunMilliseconds: 240000,
  senderName: 'YDP Mentorship Team',
  statuses: {
    sent: 'SENT',
    error: 'ERROR'
  },
  sheets: {
    sourceConfig: 'Source Config',
    menteeSnapshot: 'Mentee Source Snapshot',
    mentorSnapshot: 'Mentor Source Snapshot',
    menteeScores: 'Mentee Scores',
    pairScores: 'Pair Scores',
    matchRecommendations: 'Match Recommendations',
    matchedPairs: 'Matched Pairs',
    runLog: 'Run Log'
  },
  configKeys: {
    menteeSpreadsheetId: 'MENTEE_SOURCE_SPREADSHEET_ID',
    mentorSpreadsheetId: 'MENTOR_SOURCE_SPREADSHEET_ID',
    responseTabName: 'SOURCE_RESPONSE_TAB_NAME',
    geminiModel: 'GEMINI_MODEL'
  },
  scriptProperties: {
    geminiApiKey: 'GEMINI_API_KEY',
    geminiApiKeyPrefix: 'GEMINI_API_KEY_',
    geminiActiveApiKeyIndex: 'GEMINI_ACTIVE_API_KEY_INDEX'
  },
  maxGeminiApiKeys: 10
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(YDP_MATCHING_CONFIG.menuName)
    .addItem('Setup matching workbook', 'setupYdpMatchingWorkbook')
    .addItem('Sync source snapshots from forms', 'syncYdpMatchingSourceSnapshots')
    .addItem('Create data dictionary', 'createYdpMatchingDataDictionary')
    .addSeparator()
    .addItem('Generate next mentee score', 'generateYdpMenteeScores')
    .addItem('Generate mentee scores batch', 'generateYdpMenteeScoresBatch')
    .addItem('Generate next pair score', 'generateYdpNextPairScore')
    .addItem('Generate pair scores batch', 'generateYdpPairScoresBatch')
    .addItem('Auto-match from pair scores', 'autoMatchYdpFromPairScores')
    .addSeparator()
    .addItem('Preview selected match emails', 'previewSelectedYdpMatchEmails')
    .addItem('Send match emails to selected pair', 'sendYdpMatchEmailsToSelectedPair')
    .addItem('Send match emails to all unsent matched pairs', 'sendYdpMatchEmailsToAllUnsentPairs')
    .addSeparator()
    .addItem('Test Gemini connection', 'testYdpGeminiConnection')
    .addToUi();
}

function setupYdpMatchingWorkbook() {
  const spreadsheet = SpreadsheetApp.getActive();

  setupYdpMatchingWorkbookTabs_(spreadsheet);
  logYdpMatchingRun_('SETUP', 'SUCCESS', 'Matching workbook tabs are ready.');
  SpreadsheetApp.getUi().alert('YDP matching workbook setup is complete. Next, run "Sync source snapshots from forms" to import mentor and mentee rows.');
}

function setupYdpMatchingWorkbookTabs_(spreadsheet) {
  setupYdpSourceConfigSheet_(spreadsheet);
  ensureYdpSheetWithHeaders_(spreadsheet, YDP_MATCHING_CONFIG.sheets.menteeSnapshot, []);
  ensureYdpSheetWithHeaders_(spreadsheet, YDP_MATCHING_CONFIG.sheets.mentorSnapshot, []);
  migrateYdpMenteeScoreReviewStatus_(
    ensureYdpSheetWithHeaders_(spreadsheet, YDP_MATCHING_CONFIG.sheets.menteeScores, getYdpMenteeScoresHeaders_())
  );
  ensureYdpSheetWithHeaders_(spreadsheet, YDP_MATCHING_CONFIG.sheets.pairScores, getYdpPairScoresHeaders_());
  ensureYdpSheetWithHeaders_(spreadsheet, YDP_MATCHING_CONFIG.sheets.matchRecommendations, getYdpMatchRecommendationHeaders_());
  ensureYdpSheetWithHeaders_(spreadsheet, YDP_MATCHING_CONFIG.sheets.matchedPairs, getYdpMatchedPairsHeaders_());
  ensureYdpSheetWithHeaders_(spreadsheet, YDP_MATCHING_CONFIG.sheets.runLog, getYdpRunLogHeaders_());
}

function syncYdpMatchingSourceSnapshots() {
  try {
    setupYdpMatchingWorkbookTabs_(SpreadsheetApp.getActive());

    const config = getYdpMatchingRuntimeConfig_();
    const menteeCount = syncYdpSourceSheetToSnapshot_(
      config.menteeSpreadsheetId,
      config.responseTabName,
      YDP_MATCHING_CONFIG.sheets.menteeSnapshot
    );
    const mentorCount = syncYdpSourceSheetToSnapshot_(
      config.mentorSpreadsheetId,
      config.responseTabName,
      YDP_MATCHING_CONFIG.sheets.mentorSnapshot
    );

    const message = 'Synced ' + menteeCount + ' mentee rows and ' + mentorCount + ' mentor rows.';
    logYdpMatchingRun_('SYNC_SOURCE_SNAPSHOTS', 'SUCCESS', message);
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    logYdpMatchingRun_('SYNC_SOURCE_SNAPSHOTS', 'ERROR', error.message);
    SpreadsheetApp.getUi().alert('Source sync failed:\n\n' + error.message);
  }
}

function createYdpMatchingDataDictionary() {
  const sheet = getOrCreateYdpSheet_(SpreadsheetApp.getActive(), 'Data Dictionary');
  writeYdpMatchingDataDictionary_(sheet, getYdpMatchingDataDictionaryRows_());
  SpreadsheetApp.getUi().alert('Matching data dictionary created/updated in the "Data Dictionary" tab.');
}

function getYdpMatchingDataDictionaryRows_() {
  return [
    ['Section', 'Sheet / Button', 'Column / Action', 'Plain English Meaning', 'When To Use'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.sourceConfig, 'MENTEE_SOURCE_SPREADSHEET_ID', 'The Google Sheet ID for the live mentee form responses.', 'Used by source sync.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.sourceConfig, 'MENTOR_SOURCE_SPREADSHEET_ID', 'The Google Sheet ID for the live mentor form responses.', 'Used by source sync.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.sourceConfig, 'SOURCE_RESPONSE_TAB_NAME', 'Preferred source tab name. The script can still auto-detect common form tabs.', 'Usually leave as-is.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.sourceConfig, 'GEMINI_MODEL', 'Gemini model used for scoring and explanations.', 'Only change intentionally.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.menteeSnapshot, 'All copied source columns', 'Latest copied view of the mentee response sheet.', 'Refresh using source sync. Do not manually score here.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.mentorSnapshot, 'All copied source columns', 'Latest copied view of the mentor response sheet.', 'Refresh using source sync. Do not manually match here.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.menteeScores, 'Mentee ID', 'Stable mentee identifier.', 'Used for matching and tracking.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.menteeScores, 'Mentee Name', 'Readable mentee name.', 'Reference.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.menteeScores, 'Mentee Email', 'Mentee email address.', 'Reference and final communications.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.menteeScores, 'Career Path Interest', 'The mentee target data career path.', 'Used by matching.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.menteeScores, 'Learning Commitment Score', 'Gemini-assisted score from 0 to 5 for effort, learning, courses, and projects.', 'Part of final score.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.menteeScores, 'Community Engagement Score', 'Gemini-assisted score from 0 to 5 for YDP/community engagement.', 'Part of final score.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.menteeScores, 'Career Goals Score', 'Gemini-assisted score from 0 to 5 for clarity of goals and fit.', 'Part of final score.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.menteeScores, 'Soft Skills Score', 'Gemini-assisted score from 0 to 5 for commitment, teamwork, and ownership.', 'Part of final score.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.menteeScores, 'Final Score', 'Weighted score out of 100.', 'Mentees need 60 or above to be marked Can Pair.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.menteeScores, 'Gemini Review Status', 'Can Pair, Do Not Pair, or ERROR.', 'Only Can Pair mentees go into Pair Scores.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.menteeScores, 'Reviewer Notes', 'Optional human notes.', 'Use when overriding or explaining decisions.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.menteeScores, 'Gemini Summary', 'Gemini explanation of the mentee score.', 'Read for context.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.menteeScores, 'Gemini Concerns', 'Gemini concern or risk note.', 'Check before final decisions.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.menteeScores, 'Scored At', 'When Gemini scored the row.', 'Audit trail.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.pairScores, 'Pair ID', 'Unique ID for one mentee plus one mentor comparison.', 'Audit trail.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.pairScores, 'Skill Fit Score', 'Score out of 40 for mentor skill fit.', 'Part of total pair score.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.pairScores, 'Career Fit Score', 'Score out of 30 for career/background fit.', 'Part of total pair score.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.pairScores, 'Availability Fit Score', 'Score out of 15 for practical availability and communication fit.', 'Part of total pair score.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.pairScores, 'Capacity Fit Score', 'Score out of 15 for mentor capacity support.', 'Part of total pair score.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.pairScores, 'Total Pair Score', 'Overall mentor/mentee fit score out of 100.', 'Used later to auto-select matches.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.pairScores, 'Gemini Reason', 'Why Gemini thinks the pair works or does not work.', 'Review before final matching.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.pairScores, 'Gemini Concern', 'Any issue or error for the pair.', 'Check when status is Error.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.pairScores, 'Pair Score Status', 'Scored or Error.', 'Only Scored rows are considered complete.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.matchRecommendations, 'Recommendation ID', 'Unique ID for a recommended match.', 'Future auto-match output.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.matchRecommendations, 'Recommended Mentor ID', 'The mentor selected for a mentee.', 'Future auto-match output.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.matchRecommendations, 'Review Status', 'Team review state for the recommendation.', 'Use after auto-matching is built.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.matchedPairs, 'Match ID', 'Unique ID for a final mentor/mentee assignment.', 'Final matching tracker.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.matchedPairs, 'Match Status', 'Auto-Matched or later manual status.', 'Use after auto-matching is built.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.matchedPairs, 'Active Status', 'Whether the pair is active.', 'Used during the mentorship program.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.matchedPairs, 'Risk Status', 'Risk flag for inactive/no-show/problem pairs.', 'Used later for monitoring.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.matchedPairs, 'Mentee Match Email Status', 'Whether the mentee match email was sent.', 'Prevents duplicate match emails.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.matchedPairs, 'Mentee Match Email Sent At', 'When the mentee match email was sent.', 'Audit trail.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.matchedPairs, 'Mentor Match Email Status', 'Whether the mentor match email was sent.', 'Prevents duplicate match emails.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.matchedPairs, 'Mentor Match Email Sent At', 'When the mentor match email was sent.', 'Audit trail.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.matchedPairs, 'Match Email Last Error', 'Last error from sending match emails for this pair.', 'Check when a match email fails.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.runLog, 'Timestamp', 'When an automation action ran.', 'Audit trail.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.runLog, 'Action', 'The automation action name.', 'Audit trail.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.runLog, 'Status', 'SUCCESS, PARTIAL_SUCCESS, or ERROR.', 'Check when troubleshooting.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.runLog, 'Message', 'Detailed result or error from the automation.', 'Read when something fails.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Setup matching workbook', 'Creates/repairs matching tabs and migrates old status wording.', 'Run once, or when tabs/headers need repair.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Sync source snapshots from forms', 'Copies latest mentor and mentee source rows into this workbook.', 'Run before scoring after new form responses arrive.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Create data dictionary', 'Creates this explanation tab.', 'Run whenever you want to refresh documentation.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Generate next mentee score', 'Scores one unscored mentee with Gemini.', 'Use as a safe one-row test.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Generate mentee scores batch', 'Scores up to 3 unscored mentees with Gemini.', 'Use after the one-row test works.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Generate next pair score', 'Scores one mentee/mentor pair with Gemini.', 'Use as a safe one-pair test.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Generate pair scores batch', 'Scores up to 5 unscored mentee/mentor pairs with Gemini.', 'Use to move matching comparisons forward.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Auto-match from pair scores', 'Selects the best available mentor for each fully scored eligible mentee.', 'Run after pair scores are complete enough for matching.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Preview selected match emails', 'Shows the mentee and mentor match emails for one selected row.', 'Use before sending match emails.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Send match emails to selected pair', 'Sends match emails for one selected final pair if not already sent.', 'Use for controlled testing or one-off sends.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Send match emails to all unsent matched pairs', 'Sends match emails for every final pair that has not already been notified.', 'Use only after selected-row testing works.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Test Gemini connection', 'Checks that the Gemini API key works.', 'Run after changing the API key or model.']
  ];
}

function writeYdpMatchingDataDictionary_(sheet, rows) {
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
  sheet.autoResizeColumns(1, rows[0].length);
}

function testYdpGeminiConnection() {
  const prompt = [
    'Return one short sentence confirming that Gemini is connected.',
    'Do not include markdown.'
  ].join(' ');

  try {
    const responseText = callYdpGemini_(prompt);
    logYdpMatchingRun_('TEST_GEMINI', 'SUCCESS', responseText);
    SpreadsheetApp.getUi().alert('Gemini connection works:\n\n' + responseText);
  } catch (error) {
    logYdpMatchingRun_('TEST_GEMINI', 'ERROR', error.message);
    SpreadsheetApp.getUi().alert('Gemini connection failed:\n\n' + error.message);
  }
}

function generateYdpMenteeScores() {
  generateYdpMenteeScores_(1, 'GENERATE_MENTEE_SCORE');
}

function generateYdpMenteeScoresBatch() {
  generateYdpMenteeScores_(getYdpDefaultMenteeScoringBatchSize_(), 'GENERATE_MENTEE_SCORES_BATCH');
}

function generateYdpMenteeScores_(maxMenteesToScore, actionName) {
  const runStartedAt = Date.now();

  try {
    setupYdpMatchingWorkbookTabs_(SpreadsheetApp.getActive());

    const spreadsheet = SpreadsheetApp.getActive();
    const sourceSheet = spreadsheet.getSheetByName(YDP_MATCHING_CONFIG.sheets.menteeSnapshot);
    const scoreSheet = ensureYdpSheetWithHeaders_(
      spreadsheet,
      YDP_MATCHING_CONFIG.sheets.menteeScores,
      getYdpMenteeScoresHeaders_()
    );

    if (!sourceSheet || sourceSheet.getLastRow() <= 1) {
      throw new Error('No mentee snapshot rows found. Run "Sync source snapshots from forms" first.');
    }

    const sourceValues = sourceSheet.getRange(1, 1, sourceSheet.getLastRow(), sourceSheet.getLastColumn()).getValues();
    const sourceHeaders = sourceValues[0].map(function(header) {
      return String(header || '').trim();
    });
    const existingScoreMap = getYdpExistingMenteeScoreMap_(scoreSheet);
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let quotaHit = false;
    let quotaMessage = '';
    let stoppedForTime = false;

    for (let rowIndex = 0; rowIndex < sourceValues.slice(1).length; rowIndex++) {
      if (Date.now() - runStartedAt > getYdpMenteeScoringRunLimitMilliseconds_()) {
        stoppedForTime = true;
        break;
      }

      if (successCount >= maxMenteesToScore) {
        break;
      }

      const row = sourceValues[rowIndex + 1];

      if (isYdpBlankSourceRow_(row)) {
        continue;
      }

      const mentee = buildYdpMenteeScoringProfile_(sourceHeaders, row, rowIndex + 2);
      const menteeKey = getYdpMenteeScoreKey_(mentee);
      const existingScore = existingScoreMap[menteeKey];

      if (existingScore && existingScore.reviewStatus !== 'ERROR' && existingScore.finalScore !== '') {
        skippedCount++;
        continue;
      }

      try {
        const scoring = scoreYdpMenteeWithGemini_(mentee);
        const learningScore = clampYdpScore_(scoring.learningScore);
        const communityScore = clampYdpScore_(scoring.communityScore);
        const careerScore = clampYdpScore_(scoring.careerScore);
        const softSkillsScore = clampYdpScore_(scoring.softSkillsScore);
        const finalScore = learningScore * 8 + communityScore * 4 + careerScore * 4 + softSkillsScore * 4;

        existingScoreMap[menteeKey] = upsertYdpMenteeScoreRow_(scoreSheet, existingScore, [
          mentee.id,
          mentee.name,
          mentee.email,
          mentee.careerPath,
          learningScore,
          communityScore,
          careerScore,
          softSkillsScore,
          finalScore,
          getYdpGeminiReviewStatusForScore_(finalScore),
          '',
          String(scoring.summary || '').trim(),
          String(scoring.concerns || '').trim(),
          new Date()
        ]);
        successCount++;
      } catch (error) {
        if (isYdpGeminiQuotaError_(error)) {
          quotaHit = true;
          quotaMessage = error.message;
          break;
        }

        existingScoreMap[menteeKey] = upsertYdpMenteeScoreRow_(scoreSheet, existingScore, [
          mentee.id,
          mentee.name,
          mentee.email,
          mentee.careerPath,
          '',
          '',
          '',
          '',
          '',
          'ERROR',
          '',
          '',
          shortenYdpErrorMessage_(error.message),
          new Date()
        ]);
        errorCount++;
      }
    }

    scoreSheet.autoResizeColumns(1, getYdpMenteeScoresHeaders_().length);

    const message = buildYdpMenteeScoreBatchMessage_({
      successCount: successCount,
      skippedCount: skippedCount,
      errorCount: errorCount,
      quotaHit: quotaHit,
      quotaMessage: quotaMessage,
      stoppedForTime: stoppedForTime,
      completedAll: successCount === 0 && !quotaHit && !stoppedForTime && errorCount === 0
    });

    logYdpMatchingRun_(actionName, quotaHit || stoppedForTime || errorCount ? 'PARTIAL_SUCCESS' : 'SUCCESS', message);
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    logYdpMatchingRun_(actionName, 'ERROR', error.message);
    SpreadsheetApp.getUi().alert('Mentee scoring failed:\n\n' + error.message);
  }
}

function generateYdpNextPairScore() {
  generateYdpPairScores_(1, 'GENERATE_PAIR_SCORE');
}

function generateYdpPairScoresBatch() {
  generateYdpPairScores_(getYdpDefaultPairScoringBatchSize_(), 'GENERATE_PAIR_SCORE_BATCH');
}

function autoMatchYdpFromPairScores() {
  try {
    const spreadsheet = SpreadsheetApp.getActive();
    setupYdpMatchingWorkbookTabs_(spreadsheet);

    const menteeScoresSheet = spreadsheet.getSheetByName(YDP_MATCHING_CONFIG.sheets.menteeScores);
    const mentorSnapshotSheet = spreadsheet.getSheetByName(YDP_MATCHING_CONFIG.sheets.mentorSnapshot);
    const pairScoresSheet = spreadsheet.getSheetByName(YDP_MATCHING_CONFIG.sheets.pairScores);

    if (!menteeScoresSheet || menteeScoresSheet.getLastRow() <= 1) {
      throw new Error('No mentee scores found. Score mentees before auto-matching.');
    }

    if (!mentorSnapshotSheet || mentorSnapshotSheet.getLastRow() <= 1) {
      throw new Error('No mentor snapshot rows found. Run "Sync source snapshots from forms" first.');
    }

    if (!pairScoresSheet || pairScoresSheet.getLastRow() <= 1) {
      throw new Error('No pair scores found. Run "Generate pair scores batch" before auto-matching.');
    }

    const mentees = getYdpEligibleMenteesForPairScoring_(menteeScoresSheet);
    const mentors = getYdpMentorProfilesForPairScoring_(mentorSnapshotSheet);
    const pairScores = getYdpPairScoreRowsForAutoMatching_(pairScoresSheet);
    const result = selectYdpAutoMatchesFromPairScores_(mentees, mentors, pairScores);

    writeYdpAutoMatchOutputs_(spreadsheet, result);

    const message = [
      'Auto-match complete.',
      '',
      'Matched pairs created: ' + result.matches.length,
      'Skipped mentees: ' + result.skipped.length,
      '',
      result.skipped.length > 0
        ? 'Some mentees still need more pair scores before they can be auto-matched.'
        : 'All fully-scored eligible mentees were matched.'
    ].join('\n');

    logYdpMatchingRun_('AUTO_MATCH_FROM_PAIR_SCORES', result.skipped.length > 0 ? 'PARTIAL_SUCCESS' : 'SUCCESS', message);
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    logYdpMatchingRun_('AUTO_MATCH_FROM_PAIR_SCORES', 'ERROR', error.message);
    SpreadsheetApp.getUi().alert('Auto-match failed:\n\n' + error.message);
  }
}

function previewSelectedYdpMatchEmails() {
  setupYdpMatchingWorkbookTabs_(SpreadsheetApp.getActive());

  const sheet = getYdpMatchedPairsSheet_();
  const row = getSelectedYdpMatchedPairRow_(sheet);
  const pair = getYdpMatchedPairDataForRow_(sheet, row);
  const messages = buildYdpMatchEmailMessages_(pair);
  const html = [
    '<div style="font-family:Arial,sans-serif;line-height:1.5;padding:8px;">',
    '<h2>Mentee Match Email</h2>',
    '<p><strong>To:</strong> ' + escapeYdpHtml_(messages.mentee.to) + '</p>',
    '<p><strong>Subject:</strong> ' + escapeYdpHtml_(messages.mentee.subject) + '</p>',
    '<pre style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:6px;">' + escapeYdpHtml_(messages.mentee.body) + '</pre>',
    '<h2>Mentor Match Email</h2>',
    '<p><strong>To:</strong> ' + escapeYdpHtml_(messages.mentor.to) + '</p>',
    '<p><strong>Subject:</strong> ' + escapeYdpHtml_(messages.mentor.subject) + '</p>',
    '<pre style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:6px;">' + escapeYdpHtml_(messages.mentor.body) + '</pre>',
    '</div>'
  ].join('');

  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(760).setHeight(700),
    'YDP Match Email Preview'
  );
}

function sendYdpMatchEmailsToSelectedPair() {
  setupYdpMatchingWorkbookTabs_(SpreadsheetApp.getActive());

  const sheet = getYdpMatchedPairsSheet_();
  const row = getSelectedYdpMatchedPairRow_(sheet);
  const result = sendYdpMatchEmailsForRow_(sheet, row);

  SpreadsheetApp.getUi().alert(buildYdpMatchEmailSingleSendMessage_(result));
}

function sendYdpMatchEmailsToAllUnsentPairs() {
  setupYdpMatchingWorkbookTabs_(SpreadsheetApp.getActive());

  const sheet = getYdpMatchedPairsSheet_();
  const lastRow = sheet.getLastRow();
  const summary = {
    menteeSent: 0,
    mentorSent: 0,
    skipped: 0,
    errors: 0
  };

  if (lastRow <= 1) {
    SpreadsheetApp.getUi().alert('No matched pair rows found.');
    return;
  }

  for (let row = 2; row <= lastRow; row += 1) {
    const result = sendYdpMatchEmailsForRow_(sheet, row);

    summary.menteeSent += result.menteeSent ? 1 : 0;
    summary.mentorSent += result.mentorSent ? 1 : 0;

    if (result.error) {
      summary.errors += 1;
    } else if (!result.menteeSent && !result.mentorSent) {
      summary.skipped += 1;
    }
  }

  SpreadsheetApp.getUi().alert(
    'YDP match email send complete.\n\n' +
    'Mentee emails sent: ' + summary.menteeSent + '\n' +
    'Mentor emails sent: ' + summary.mentorSent + '\n' +
    'Skipped rows: ' + summary.skipped + '\n' +
    'Errors: ' + summary.errors
  );
}

function generateYdpPairScores_(maxPairsToScore, actionName) {
  const runStartedAt = Date.now();

  try {
    setupYdpMatchingWorkbookTabs_(SpreadsheetApp.getActive());

    const spreadsheet = SpreadsheetApp.getActive();
    const menteeScoresSheet = spreadsheet.getSheetByName(YDP_MATCHING_CONFIG.sheets.menteeScores);
    const mentorSnapshotSheet = spreadsheet.getSheetByName(YDP_MATCHING_CONFIG.sheets.mentorSnapshot);
    const pairScoresSheet = ensureYdpSheetWithHeaders_(
      spreadsheet,
      YDP_MATCHING_CONFIG.sheets.pairScores,
      getYdpPairScoresHeaders_()
    );

    if (!menteeScoresSheet || menteeScoresSheet.getLastRow() <= 1) {
      throw new Error('No mentee scores found. Score mentees before generating pair scores.');
    }

    if (!mentorSnapshotSheet || mentorSnapshotSheet.getLastRow() <= 1) {
      throw new Error('No mentor snapshot rows found. Run "Sync source snapshots from forms" first.');
    }

    const mentees = getYdpEligibleMenteesForPairScoring_(menteeScoresSheet);
    const mentors = getYdpMentorProfilesForPairScoring_(mentorSnapshotSheet);
    const existingPairMap = getYdpExistingPairScoreMap_(pairScoresSheet);
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let quotaHit = false;
    let quotaMessage = '';
    let stoppedForTime = false;

    if (mentees.length === 0) {
      throw new Error('No eligible mentees found. Eligible mentees need Final Score >= 60 and Gemini Review Status = Can Pair.');
    }

    if (mentors.length === 0) {
      throw new Error('No usable mentors found in Mentor Source Snapshot.');
    }

    for (let menteeIndex = 0; menteeIndex < mentees.length; menteeIndex++) {
      const mentee = mentees[menteeIndex];

      for (let mentorIndex = 0; mentorIndex < mentors.length; mentorIndex++) {
        const mentor = mentors[mentorIndex];
        const pairId = buildYdpPairId_(mentee.id, mentor.id);
        const existingPair = existingPairMap[pairId];

        if (shouldYdpSkipExistingPairScore_(existingPair)) {
          skippedCount++;
          continue;
        }

        if (Date.now() - runStartedAt > YDP_MATCHING_CONFIG.maxManualRunMilliseconds) {
          stoppedForTime = true;
          break;
        }

        if (successCount >= maxPairsToScore) {
          break;
        }

        try {
          const scoring = scoreYdpMentorMenteePairWithGemini_(mentee, mentor);
          const skillFitScore = clampYdpWeightedScore_(scoring.skillFitScore, 40);
          const careerFitScore = clampYdpWeightedScore_(scoring.careerFitScore, 30);
          const availabilityFitScore = clampYdpWeightedScore_(scoring.availabilityFitScore, 15);
          const capacityFitScore = clampYdpWeightedScore_(scoring.capacityFitScore, 15);
          const totalPairScore = skillFitScore + careerFitScore + availabilityFitScore + capacityFitScore;

          existingPairMap[pairId] = upsertYdpPairScoreRow_(pairScoresSheet, existingPair, [
            pairId,
            mentee.id,
            mentee.name,
            mentee.email,
            mentor.id,
            mentor.name,
            mentor.email,
            skillFitScore,
            careerFitScore,
            availabilityFitScore,
            capacityFitScore,
            totalPairScore,
            String(scoring.reason || '').trim(),
            String(scoring.concern || '').trim(),
            'Scored',
            new Date()
          ]);

          pairScoresSheet.autoResizeColumns(1, getYdpPairScoresHeaders_().length);
          successCount++;

          if (successCount >= maxPairsToScore) {
            break;
          }
        } catch (error) {
          if (isYdpGeminiQuotaError_(error)) {
            quotaHit = true;
            quotaMessage = error.message;
            break;
          }

          const readableError = describeYdpPairScoreError_(error);
          existingPairMap[pairId] = upsertYdpPairScoreRow_(pairScoresSheet, existingPair, [
            pairId,
            mentee.id,
            mentee.name,
            mentee.email,
            mentor.id,
            mentor.name,
            mentor.email,
            '',
            '',
            '',
            '',
            '',
            '',
            readableError,
            'Error',
            new Date()
          ]);

          pairScoresSheet.autoResizeColumns(1, getYdpPairScoresHeaders_().length);
          pairScoresSheet.getRange(existingPairMap[pairId].rowNumber, 13, 1, 2).setWrap(true);

          const message = [
            'Pair score failed for ' + mentee.name + ' + ' + mentor.name + '.',
            '',
            'What happened:',
            readableError,
            '',
            'This was saved in Pair Scores with status "Error". Run "Generate next pair score" again to retry this same pair.'
          ].join('\n');
          logYdpMatchingRun_(actionName, 'PARTIAL_SUCCESS', message);
          SpreadsheetApp.getUi().alert(message);
          return;
        }
      }

      if (successCount >= maxPairsToScore || quotaHit || stoppedForTime) {
        break;
      }
    }

    const completedAll = !quotaHit && !stoppedForTime && successCount === 0;
    const message = buildYdpPairScoreBatchMessage_({
      successCount: successCount,
      skippedCount: skippedCount,
      errorCount: errorCount,
      quotaHit: quotaHit,
      quotaMessage: quotaMessage,
      stoppedForTime: stoppedForTime,
      completedAll: completedAll
    });
    logYdpMatchingRun_(actionName, quotaHit || stoppedForTime || errorCount ? 'PARTIAL_SUCCESS' : 'SUCCESS', message);
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    logYdpMatchingRun_(actionName, 'ERROR', error.message);
    SpreadsheetApp.getUi().alert('Pair scoring failed:\n\n' + error.message);
  }
}

function setupYdpSourceConfigSheet_(spreadsheet) {
  const sheet = ensureYdpSheetWithHeaders_(spreadsheet, YDP_MATCHING_CONFIG.sheets.sourceConfig, [
    'Setting',
    'Value',
    'Notes'
  ]);
  const existing = getYdpConfigMap_(sheet);
  const rows = [
    [
      YDP_MATCHING_CONFIG.configKeys.menteeSpreadsheetId,
      getYdpCurrentOrDefaultSourceId_(
        existing[YDP_MATCHING_CONFIG.configKeys.menteeSpreadsheetId],
        YDP_MATCHING_CONFIG.defaultMenteeSpreadsheetId,
        YDP_MATCHING_CONFIG.oldMenteeSpreadsheetIds
      ),
      'Mentee application response spreadsheet ID.'
    ],
    [
      YDP_MATCHING_CONFIG.configKeys.mentorSpreadsheetId,
      existing[YDP_MATCHING_CONFIG.configKeys.mentorSpreadsheetId] || YDP_MATCHING_CONFIG.defaultMentorSpreadsheetId,
      'Mentor application response spreadsheet ID.'
    ],
    [
      YDP_MATCHING_CONFIG.configKeys.responseTabName,
      existing[YDP_MATCHING_CONFIG.configKeys.responseTabName] || YDP_MATCHING_CONFIG.defaultResponseTabName,
      'Preferred response tab name. The script can also auto-detect tabs like Form Responses 1.'
    ],
    [
      YDP_MATCHING_CONFIG.configKeys.geminiModel,
      existing[YDP_MATCHING_CONFIG.configKeys.geminiModel] || YDP_MATCHING_CONFIG.defaultGeminiModel,
      'Gemini model used for explanations. API key stays in Script Properties.'
    ]
  ];

  sheet.getRange(2, 1, Math.max(sheet.getMaxRows() - 1, 1), 3).clearContent();
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  sheet.autoResizeColumns(1, 3);
  return sheet;
}

function syncYdpSourceSheetToSnapshot_(sourceSpreadsheetId, sourceTabName, snapshotSheetName) {
  if (!sourceSpreadsheetId) {
    throw new Error('Missing source spreadsheet ID for ' + snapshotSheetName + '.');
  }

  const sourceSpreadsheet = SpreadsheetApp.openById(sourceSpreadsheetId);
  const sourceSheet = findYdpSourceResponseSheet_(sourceSpreadsheet, sourceTabName);

  if (!sourceSheet) {
    const availableTabs = sourceSpreadsheet.getSheets().map(function(sheet) {
      return sheet.getName();
    }).join(', ');
    throw new Error('Source response tab not found in ' + sourceSpreadsheetId + '. Preferred tab: ' + sourceTabName + '. Available tabs: ' + availableTabs);
  }

  const targetSheet = getOrCreateYdpSheet_(SpreadsheetApp.getActive(), snapshotSheetName);
  const lastRow = sourceSheet.getLastRow();
  const lastColumn = sourceSheet.getLastColumn();
  targetSheet.clearContents();

  if (lastRow < 1 || lastColumn < 1) {
    return 0;
  }

  const values = sourceSheet.getRange(1, 1, lastRow, lastColumn).getValues();
  targetSheet.getRange(1, 1, values.length, values[0].length).setValues(values);
  targetSheet.setFrozenRows(1);
  targetSheet.autoResizeColumns(1, values[0].length);

  return Math.max(lastRow - 1, 0);
}

function findYdpSourceResponseSheet_(spreadsheet, preferredTabName) {
  const preferred = String(preferredTabName || '').trim();

  if (preferred) {
    const exactSheet = spreadsheet.getSheetByName(preferred);

    if (exactSheet) {
      return exactSheet;
    }
  }

  const sheets = spreadsheet.getSheets();
  const normalizedPreferred = normalizeYdpSheetName_(preferred);
  const responseNameMatches = sheets.filter(function(sheet) {
    const normalizedName = normalizeYdpSheetName_(sheet.getName());
    return normalizedName === normalizedPreferred ||
      normalizedName.indexOf('formresponses') === 0 ||
      normalizedName.indexOf('formresponse') === 0;
  });

  if (responseNameMatches.length > 0) {
    return responseNameMatches[0];
  }

  const headerMatches = sheets.filter(function(sheet) {
    return ydpSheetLooksLikeFormResponse_(sheet);
  });

  if (headerMatches.length > 0) {
    return headerMatches[0];
  }

  if (sheets.length === 1) {
    return sheets[0];
  }

  return null;
}

function normalizeYdpSheetName_(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function ydpSheetLooksLikeFormResponse_(sheet) {
  const lastColumn = sheet.getLastColumn();

  if (sheet.getLastRow() < 1 || lastColumn < 2) {
    return false;
  }

  const headers = sheet.getRange(1, 1, 1, Math.min(lastColumn, 10)).getValues()[0].map(function(header) {
    return String(header || '').toLowerCase();
  });

  return headers.indexOf('timestamp') !== -1 && headers.indexOf('email address') !== -1;
}

function buildYdpMenteeScoringProfile_(headers, row, sourceRowNumber) {
  const firstName = getYdpValueByHeaderRules_(headers, row, [
    ['first', 'name']
  ]);
  const lastName = getYdpValueByHeaderRules_(headers, row, [
    ['last', 'name']
  ]);
  const email = getYdpValueByHeaderRules_(headers, row, [
    ['email', 'address']
  ]);

  return {
    id: getYdpValueByHeaderRules_(headers, row, [
      ['mentee', 'id']
    ]) || email || 'Mentee Row ' + sourceRowNumber,
    name: [firstName, lastName].filter(Boolean).join(' ') || 'Mentee Row ' + sourceRowNumber,
    email: email,
    careerPath: getYdpValueByHeaderRules_(headers, row, [
      ['career', 'path'],
      ['interested', 'in']
    ]),
    skills: getYdpValueByHeaderRules_(headers, row, [
      ['skills', 'experience'],
      ['skills', 'currently'],
      ['areas', 'focus']
    ]),
    learningStyle: getYdpValueByHeaderRules_(headers, row, [
      ['learning', 'style']
    ]),
    mentorPreference: getYdpValueByHeaderRules_(headers, row, [
      ['mentor', 'back'],
      ['mentor', 'preference']
    ]),
    coursesTraining: getYdpValueByHeaderRules_(headers, row, [
      ['courses', 'training'],
      ['training', 'related']
    ]),
    personalEffort: getYdpValueByHeaderRules_(headers, row, [
      ['personal', 'efforts'],
      ['hands-on', 'experience'],
      ['hands', 'experience']
    ]),
    goals: getYdpValueByHeaderRules_(headers, row, [
      ['main', 'goals'],
      ['top', 'goals'],
      ['goals', 'mentorship']
    ]),
    currentStage: getYdpValueByHeaderRules_(headers, row, [
      ['current', 'career', 'level'],
      ['best', 'describes', 'current']
    ]),
    ydpMembership: getYdpValueByHeaderRules_(headers, row, [
      ['member', 'young', 'data'],
      ['member', 'ydp']
    ]),
    ydpEngagement: getYdpValueByHeaderRules_(headers, row, [
      ['engaged', 'ydp'],
      ['ydp', 'engaged'],
      ['ydp', 'platform']
    ]),
    commitment: getYdpValueByHeaderRules_(headers, row, [
      ['commit', 'full', 'duration'],
      ['hours', 'per', 'week'],
      ['actively', 'engag']
    ]),
    teamwork: getYdpValueByHeaderRules_(headers, row, [
      ['working', 'teams'],
      ['work', 'teams']
    ]),
    whySelect: getYdpValueByHeaderRules_(headers, row, [
      ['why', 'select'],
      ['selected', 'mentorship']
    ]),
    sourceRowNumber: sourceRowNumber
  };
}

function scoreYdpMenteeWithGemini_(mentee) {
  const compactMentee = {
    name: mentee.name,
    careerPath: mentee.careerPath,
    skills: mentee.skills,
    coursesTraining: mentee.coursesTraining,
    personalEffort: mentee.personalEffort,
    goals: mentee.goals,
    ydpMembership: mentee.ydpMembership,
    ydpEngagement: mentee.ydpEngagement,
    commitment: mentee.commitment,
    teamwork: mentee.teamwork,
    whySelect: mentee.whySelect
  };
  const prompt = [
    'Score this YDP mentee application. Use only provided facts.',
    '',
    'Scores are 0-5:',
    'learningScore: courses, projects, practice, prior effort.',
    'communityScore: YDP/community membership and participation.',
    'careerScore: clear career path, focused goals, mentorship fit.',
    'softSkillsScore: commitment, teamwork, ownership, proactive mindset.',
    '',
    'Return JSON only. No markdown. No extra text.',
    '{"learningScore":0,"communityScore":0,"careerScore":0,"softSkillsScore":0,"summary":"","concerns":""}',
    '',
    JSON.stringify(compactMentee)
  ].join('\n');

  return callYdpGeminiJson_(prompt);
}

function scoreYdpMentorMenteePairWithGemini_(mentee, mentor) {
  const compactPair = {
    mentee: {
      name: mentee.name,
      careerPath: mentee.careerPath,
      finalScore: mentee.finalScore,
      summary: mentee.summary,
      concerns: mentee.concerns
    },
    mentor: {
      name: mentor.name,
      currentRole: mentor.currentRole,
      yearsExperience: mentor.yearsExperience,
      expertise: mentor.expertise,
      availability: mentor.availability,
      preferredTimes: mentor.preferredTimes,
      communication: mentor.communication,
      menteePreferences: mentor.menteePreferences,
      statedCapacity: mentor.statedCapacity,
      flexibleCapacity: mentor.flexibleCapacity
    }
  };
  const prompt = [
    'Score this YDP mentor/mentee pair. Use only provided facts.',
    '',
    'Return JSON only. No markdown. No extra text.',
    '{"skillFitScore":0,"careerFitScore":0,"availabilityFitScore":0,"capacityFitScore":0,"reason":"","concern":""}',
    '',
    'Score limits:',
    'skillFitScore: 0-40 for mentor expertise matching mentee needs.',
    'careerFitScore: 0-30 for mentor role/background matching mentee career path.',
    'availabilityFitScore: 0-15 for practical communication/time fit.',
    'capacityFitScore: 0-15 for stated/flexible capacity support.',
    '',
    JSON.stringify(compactPair)
  ].join('\n');

  return callYdpGeminiJson_(prompt);
}

function callYdpGeminiJson_(prompt) {
  const responseText = callYdpGemini_(prompt);
  const jsonText = extractYdpJsonObject_(responseText);

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    throw new Error('Gemini returned invalid JSON. Raw response: ' + shortenYdpErrorMessage_(responseText, 900));
  }
}

function extractYdpJsonObject_(text) {
  const cleaned = String(text || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Gemini response did not contain a JSON object: ' + text);
  }

  return cleaned.slice(start, end + 1);
}

function getYdpValueByHeaderRules_(headers, row, rules) {
  for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
    const rule = rules[ruleIndex];
    const columnIndex = findYdpHeaderIndexByKeywords_(headers, rule);

    if (columnIndex !== -1) {
      return String(row[columnIndex] || '').trim();
    }
  }

  return '';
}

function findYdpHeaderIndexByKeywords_(headers, keywords) {
  const normalizedKeywords = keywords.map(function(keyword) {
    return normalizeYdpHeaderText_(keyword);
  });

  for (let index = 0; index < headers.length; index++) {
    const normalizedHeader = normalizeYdpHeaderText_(headers[index]);
    const matches = normalizedKeywords.every(function(keyword) {
      return normalizedHeader.indexOf(keyword) !== -1;
    });

    if (matches) {
      return index;
    }
  }

  return -1;
}

function normalizeYdpHeaderText_(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function clampYdpScore_(value) {
  const numberValue = Number(value);

  if (isNaN(numberValue)) {
    return 0;
  }

  return Math.max(0, Math.min(5, Math.round(numberValue)));
}

function isYdpBlankSourceRow_(row) {
  return row.every(function(value) {
    return String(value || '').trim() === '';
  });
}

function getYdpEligibleMenteesForPairScoring_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(header) {
    return String(header || '').trim();
  });
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const idIndex = headers.indexOf('Mentee ID');
  const nameIndex = headers.indexOf('Mentee Name');
  const emailIndex = headers.indexOf('Mentee Email');
  const careerPathIndex = headers.indexOf('Career Path Interest');
  const finalScoreIndex = headers.indexOf('Final Score');
  const reviewStatusIndex = getYdpMenteeReviewStatusIndex_(headers);
  const summaryIndex = headers.indexOf('Gemini Summary');
  const concernsIndex = headers.indexOf('Gemini Concerns');

  return rows.map(function(row) {
    return {
      id: String(row[idIndex] || '').trim(),
      name: String(row[nameIndex] || '').trim(),
      email: String(row[emailIndex] || '').trim(),
      careerPath: String(row[careerPathIndex] || '').trim(),
      finalScore: Number(row[finalScoreIndex]),
      reviewStatus: String(row[reviewStatusIndex] || '').trim(),
      summary: String(row[summaryIndex] || '').trim(),
      concerns: String(row[concernsIndex] || '').trim()
    };
  }).filter(function(mentee) {
    return mentee.id &&
      mentee.email &&
      !isNaN(mentee.finalScore) &&
      mentee.finalScore >= 60 &&
      mentee.reviewStatus === 'Can Pair';
  }).sort(function(a, b) {
    return b.finalScore - a.finalScore;
  });
}

function getYdpMentorProfilesForPairScoring_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(header) {
    return String(header || '').trim();
  });
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();

  return rows.map(function(row, rowIndex) {
    const firstName = getYdpValueByHeaderRules_(headers, row, [
      ['first', 'name']
    ]);
    const lastName = getYdpValueByHeaderRules_(headers, row, [
      ['last', 'name']
    ]);
    const email = getYdpValueByHeaderRules_(headers, row, [
      ['email', 'address']
    ]);
    const statedCapacity = parseYdpCapacity_(
      getYdpValueByHeaderRules_(headers, row, [
        ['how', 'many', 'mentees'],
        ['mentees', 'willing']
      ])
    );

    return {
      id: getYdpValueByHeaderRules_(headers, row, [
        ['mentor', 'id']
      ]) || email || 'Mentor Row ' + (rowIndex + 2),
      name: [firstName, lastName].filter(Boolean).join(' ') || 'Mentor Row ' + (rowIndex + 2),
      email: email,
      currentRole: getYdpValueByHeaderRules_(headers, row, [
        ['current', 'role']
      ]),
      yearsExperience: getYdpValueByHeaderRules_(headers, row, [
        ['years', 'experience']
      ]),
      expertise: getYdpValueByHeaderRules_(headers, row, [
        ['areas', 'expertise'],
        ['expertise']
      ]),
      availability: getYdpValueByHeaderRules_(headers, row, [
        ['availability'],
        ['hours', 'per']
      ]),
      preferredTimes: getYdpValueByHeaderRules_(headers, row, [
        ['preferred', 'days'],
        ['preferred', 'times']
      ]),
      communication: getYdpValueByHeaderRules_(headers, row, [
        ['preferred', 'communication']
      ]),
      menteePreferences: getYdpValueByHeaderRules_(headers, row, [
        ['preferences', 'mentee'],
        ['mentee', 'preferences']
      ]),
      statedCapacity: statedCapacity,
      flexibleCapacity: statedCapacity + 2
    };
  }).filter(function(mentor) {
    return mentor.id && mentor.email;
  });
}

function parseYdpCapacity_(value) {
  const match = String(value || '').match(/\d+/);

  if (!match) {
    return 1;
  }

  return Math.max(1, Number(match[0]));
}

function buildYdpPairId_(menteeId, mentorId) {
  return normalizeYdpPairIdPart_(menteeId) + '__' + normalizeYdpPairIdPart_(mentorId);
}

function normalizeYdpPairIdPart_(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getYdpExistingPairScoreMap_(sheet) {
  const headers = getYdpPairScoresHeaders_();
  const map = {};

  if (sheet.getLastRow() <= 1) {
    return map;
  }

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  const pairIdIndex = headers.indexOf('Pair ID');
  const statusIndex = headers.indexOf('Pair Score Status');

  values.forEach(function(row, index) {
    const pairId = String(row[pairIdIndex] || '').trim();

    if (pairId) {
      map[pairId] = {
        rowNumber: index + 2,
        pairId: pairId,
        status: String(row[statusIndex] || '').trim()
      };
    }
  });

  return map;
}

function getYdpDefaultPairScoringBatchSize_() {
  return YDP_MATCHING_CONFIG.defaultPairScoringBatchSize;
}

function shouldYdpSkipExistingPairScore_(existingPair) {
  return String(existingPair && existingPair.status ? existingPair.status : '').trim().toLowerCase() === 'scored';
}

function buildYdpPairScoreBatchMessage_(summary) {
  if (summary.completedAll) {
    return 'All eligible mentee/mentor pairs already have pair scores.';
  }

  const lines = [
    'Generated pair scores for ' + summary.successCount + ' pairs.',
    'Skipped already-scored pairs: ' + summary.skippedCount + '.',
    'Errors: ' + summary.errorCount + '.'
  ];

  if (summary.quotaHit) {
    lines.push('');
    lines.push('Gemini quota was reached, so pair scoring stopped safely. Wait and run this button again later.');

    if (summary.quotaMessage) {
      lines.push(summary.quotaMessage);
    }
  } else if (summary.stoppedForTime) {
    lines.push('');
    lines.push('Apps Script time was almost up, so pair scoring stopped safely. Run the button again to continue.');
  } else if (summary.successCount > 0) {
    lines.push('');
    lines.push('Run this button again when you want to continue scoring the next unscored pairs.');
  }

  return lines.join('\n');
}

function getYdpPairScoreRowsForAutoMatching_(sheet) {
  const headers = getYdpPairScoresHeaders_();

  if (sheet.getLastRow() <= 1) {
    return [];
  }

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  return values.map(function(row) {
    return {
      pairId: String(row[headers.indexOf('Pair ID')] || '').trim(),
      menteeId: String(row[headers.indexOf('Mentee ID')] || '').trim(),
      menteeName: String(row[headers.indexOf('Mentee Name')] || '').trim(),
      menteeEmail: String(row[headers.indexOf('Mentee Email')] || '').trim(),
      mentorId: String(row[headers.indexOf('Mentor ID')] || '').trim(),
      mentorName: String(row[headers.indexOf('Mentor Name')] || '').trim(),
      mentorEmail: String(row[headers.indexOf('Mentor Email')] || '').trim(),
      skillFitScore: Number(row[headers.indexOf('Skill Fit Score')]),
      careerFitScore: Number(row[headers.indexOf('Career Fit Score')]),
      availabilityFitScore: Number(row[headers.indexOf('Availability Fit Score')]),
      capacityFitScore: Number(row[headers.indexOf('Capacity Fit Score')]),
      totalPairScore: Number(row[headers.indexOf('Total Pair Score')]),
      reason: String(row[headers.indexOf('Gemini Reason')] || '').trim(),
      concern: String(row[headers.indexOf('Gemini Concern')] || '').trim(),
      status: String(row[headers.indexOf('Pair Score Status')] || '').trim()
    };
  });
}

function selectYdpAutoMatchesFromPairScores_(mentees, mentors, pairScores) {
  const mentorMap = {};
  const assignedCounts = {};
  const matches = [];
  const skipped = [];

  mentors.forEach(function(mentor) {
    if (!mentor || !mentor.id) {
      return;
    }

    mentorMap[mentor.id] = mentor;
    assignedCounts[mentor.id] = 0;
  });

  const expectedMentorCount = Object.keys(mentorMap).length;
  const pairsByMentee = {};

  (pairScores || []).forEach(function(pair) {
    if (!pair || !pair.menteeId || !pair.mentorId || String(pair.status || '').trim().toLowerCase() !== 'scored') {
      return;
    }

    if (!mentorMap[pair.mentorId] || isNaN(Number(pair.totalPairScore))) {
      return;
    }

    if (!pairsByMentee[pair.menteeId]) {
      pairsByMentee[pair.menteeId] = {};
    }

    const existingPair = pairsByMentee[pair.menteeId][pair.mentorId];
    if (!existingPair || Number(pair.totalPairScore) > Number(existingPair.totalPairScore)) {
      pairsByMentee[pair.menteeId][pair.mentorId] = pair;
    }
  });

  (mentees || []).forEach(function(mentee) {
    const menteePairs = pairsByMentee[mentee.id] || {};
    const scoredMentorIds = Object.keys(menteePairs);

    if (expectedMentorCount === 0) {
      skipped.push({
        mentee: mentee,
        reason: 'No available mentors were found.'
      });
      return;
    }

    if (scoredMentorIds.length < expectedMentorCount) {
      skipped.push({
        mentee: mentee,
        reason: 'Needs more pair scores: ' + scoredMentorIds.length + ' of ' + expectedMentorCount + ' mentors scored.'
      });
      return;
    }

    const candidates = scoredMentorIds.map(function(mentorId) {
      const mentor = mentorMap[mentorId];
      const flexibleCapacity = Math.max(1, Number(mentor.flexibleCapacity) || 1);

      return {
        mentor: mentor,
        pair: menteePairs[mentorId],
        availableSlots: flexibleCapacity - (assignedCounts[mentorId] || 0)
      };
    }).filter(function(candidate) {
      return candidate.availableSlots > 0;
    }).sort(function(a, b) {
      const totalDifference = Number(b.pair.totalPairScore) - Number(a.pair.totalPairScore);

      if (totalDifference !== 0) {
        return totalDifference;
      }

      const skillDifference = Number(b.pair.skillFitScore || 0) - Number(a.pair.skillFitScore || 0);

      if (skillDifference !== 0) {
        return skillDifference;
      }

      return String(a.mentor.name || '').localeCompare(String(b.mentor.name || ''));
    });

    if (candidates.length === 0) {
      skipped.push({
        mentee: mentee,
        reason: 'No mentor has remaining flexible capacity.'
      });
      return;
    }

    const selected = candidates[0];
    assignedCounts[selected.mentor.id] = (assignedCounts[selected.mentor.id] || 0) + 1;
    matches.push({
      mentee: mentee,
      mentor: selected.mentor,
      pair: selected.pair
    });
  });

  return {
    matches: matches,
    skipped: skipped,
    assignedCounts: assignedCounts
  };
}

function writeYdpAutoMatchOutputs_(spreadsheet, result) {
  const recommendationSheet = ensureYdpSheetWithHeaders_(
    spreadsheet,
    YDP_MATCHING_CONFIG.sheets.matchRecommendations,
    getYdpMatchRecommendationHeaders_()
  );
  const matchedPairsSheet = ensureYdpSheetWithHeaders_(
    spreadsheet,
    YDP_MATCHING_CONFIG.sheets.matchedPairs,
    getYdpMatchedPairsHeaders_()
  );
  const recommendationRows = buildYdpMatchRecommendationRows_(result);
  const matchedPairRows = buildYdpMatchedPairRows_(result);

  clearYdpSheetBody_(recommendationSheet);
  clearYdpSheetBody_(matchedPairsSheet);

  if (recommendationRows.length > 0) {
    recommendationSheet.getRange(2, 1, recommendationRows.length, getYdpMatchRecommendationHeaders_().length).setValues(recommendationRows);
  }

  if (matchedPairRows.length > 0) {
    matchedPairsSheet.getRange(2, 1, matchedPairRows.length, getYdpMatchedPairsHeaders_().length).setValues(matchedPairRows);
  }

  recommendationSheet.autoResizeColumns(1, getYdpMatchRecommendationHeaders_().length);
  matchedPairsSheet.autoResizeColumns(1, getYdpMatchedPairsHeaders_().length);
}

function buildYdpMatchRecommendationRows_(result) {
  const rows = [];

  (result.matches || []).forEach(function(match) {
    rows.push([
      buildYdpRecommendationId_(match.mentee.id),
      match.mentee.id,
      match.mentee.name,
      match.mentee.careerPath,
      match.mentor.id,
      match.mentor.name,
      Number(match.pair.totalPairScore),
      match.pair.reason,
      match.pair.reason,
      'Availability score: ' + Number(match.pair.availabilityFitScore || 0) + '/15; capacity score: ' + Number(match.pair.capacityFitScore || 0) + '/15.',
      match.pair.reason,
      match.pair.concern,
      'Auto-Selected',
      ''
    ]);
  });

  (result.skipped || []).forEach(function(skip) {
    rows.push([
      buildYdpRecommendationId_(skip.mentee.id),
      skip.mentee.id,
      skip.mentee.name,
      skip.mentee.careerPath,
      '',
      '',
      '',
      '',
      '',
      '',
      skip.reason,
      '',
      'Needs More Pair Scores',
      ''
    ]);
  });

  return rows;
}

function buildYdpMatchedPairRows_(result) {
  return (result.matches || []).map(function(match) {
    return [
      buildYdpMatchId_(match.mentee.id, match.mentor.id),
      match.mentee.id,
      match.mentee.name,
      match.mentee.email,
      match.mentor.id,
      match.mentor.name,
      match.mentor.email,
      match.mentee.careerPath,
      'Auto-Matched',
      'Pending Review',
      '',
      '',
      0,
      0,
      '',
      'Not Started',
      'Auto-selected from Pair Scores. Total pair score: ' + Number(match.pair.totalPairScore) + '.',
      '',
      '',
      '',
      '',
      ''
    ];
  });
}

function getYdpMatchEmailTrackingHeaders_() {
  return [
    'Mentee Match Email Status',
    'Mentee Match Email Sent At',
    'Mentor Match Email Status',
    'Mentor Match Email Sent At',
    'Match Email Last Error'
  ];
}

function buildYdpMatchEmailMessages_(pair) {
  const menteeName = String(pair.menteeName || '').trim() || 'Mentee';
  const menteeFirstName = getYdpFirstName_(menteeName);
  const mentorName = String(pair.mentorName || '').trim() || 'Mentor';
  const mentorFirstName = getYdpFirstName_(mentorName);
  const menteeEmail = String(pair.menteeEmail || '').trim();
  const mentorEmail = String(pair.mentorEmail || '').trim();
  const track = String(pair.track || '').trim() || 'your selected data career path';

  const menteeBody = [
    'Hi ' + menteeFirstName + ',',
    '',
    'We are pleased to let you know that you have been matched with a mentor for the YDP Mentorship Program.',
    '',
    'Your mentor details:',
    'Mentor name: ' + mentorName,
    'Mentor email: ' + mentorEmail,
    'Track: ' + track,
    '',
    'Please watch your email and respond promptly to any next steps from your mentor or the YDP Mentorship Team.',
    '',
    'As you begin this mentorship, we ask that you stay committed, communicate clearly, and make the most of the opportunity.',
    '',
    'Warm regards,',
    YDP_MATCHING_CONFIG.senderName
  ].join('\n');

  const mentorBody = [
    'Hi ' + mentorFirstName + ',',
    '',
    'Thank you again for volunteering to mentor in the YDP Mentorship Program.',
    '',
    'You have been assigned a mentee:',
    'Mentee name: ' + menteeName,
    'Mentee email: ' + menteeEmail,
    'Mentee career path/track: ' + track,
    '',
    'Please watch your email for any next steps from the YDP Mentorship Team and be ready to support your mentee with consistency and care.',
    '',
    'Warm regards,',
    YDP_MATCHING_CONFIG.senderName
  ].join('\n');

  return {
    mentee: {
      to: menteeEmail,
      subject: 'Your YDP Mentorship Match',
      body: menteeBody,
      htmlBody: convertYdpPlainTextToHtml_(menteeBody)
    },
    mentor: {
      to: mentorEmail,
      subject: 'YDP Mentorship Mentee Assignment',
      body: mentorBody,
      htmlBody: convertYdpPlainTextToHtml_(mentorBody)
    }
  };
}

function buildYdpMatchEmailSendPlan_(pair) {
  const menteeStatus = String(pair.menteeMatchEmailStatus || '').trim();
  const mentorStatus = String(pair.mentorMatchEmailStatus || '').trim();
  const hasValidMenteeEmail = isValidYdpEmail_(pair.menteeEmail);
  const hasValidMentorEmail = isValidYdpEmail_(pair.mentorEmail);
  const hasValidPairEmails = hasValidMenteeEmail && hasValidMentorEmail;
  const sendMentee = hasValidPairEmails && menteeStatus !== YDP_MATCHING_CONFIG.statuses.sent;
  const sendMentor = hasValidPairEmails && mentorStatus !== YDP_MATCHING_CONFIG.statuses.sent;
  let skippedReason = '';

  if (menteeStatus === YDP_MATCHING_CONFIG.statuses.sent &&
      mentorStatus === YDP_MATCHING_CONFIG.statuses.sent) {
    skippedReason = 'Both match emails have already been sent.';
  } else if (!hasValidPairEmails) {
    skippedReason = 'Missing or invalid mentee/mentor email address.';
  }

  return {
    sendMentee: sendMentee,
    sendMentor: sendMentor,
    skippedReason: skippedReason
  };
}

function sendYdpMatchEmailsForRow_(sheet, row) {
  const headerMap = getYdpMatchingHeaderMap_(sheet);
  const pair = getYdpMatchedPairDataForRow_(sheet, row);
  const plan = buildYdpMatchEmailSendPlan_(pair);
  const menteeStatusColumn = getYdpMatchingHeaderColumn_(headerMap, 'Mentee Match Email Status');
  const menteeSentAtColumn = getYdpMatchingHeaderColumn_(headerMap, 'Mentee Match Email Sent At');
  const mentorStatusColumn = getYdpMatchingHeaderColumn_(headerMap, 'Mentor Match Email Status');
  const mentorSentAtColumn = getYdpMatchingHeaderColumn_(headerMap, 'Mentor Match Email Sent At');
  const lastErrorColumn = getYdpMatchingHeaderColumn_(headerMap, 'Match Email Last Error');

  if (!plan.sendMentee && !plan.sendMentor) {
    if (plan.skippedReason === 'Missing or invalid mentee/mentor email address.') {
      sheet.getRange(row, lastErrorColumn).setValue(plan.skippedReason);
      return {
        row: row,
        menteeSent: false,
        mentorSent: false,
        skipped: false,
        error: plan.skippedReason
      };
    }

    sheet.getRange(row, lastErrorColumn).setValue('');
    return {
      row: row,
      menteeSent: false,
      mentorSent: false,
      skipped: true,
      reason: plan.skippedReason || 'No unsent match emails for this pair.'
    };
  }

  try {
    const messages = buildYdpMatchEmailMessages_(pair);
    const now = new Date();
    let menteeSent = false;
    let mentorSent = false;

    if (plan.sendMentee) {
      sendYdpMatchEmail_(messages.mentee);
      sheet.getRange(row, menteeStatusColumn).setValue(YDP_MATCHING_CONFIG.statuses.sent);
      sheet.getRange(row, menteeSentAtColumn).setValue(now);
      menteeSent = true;
    }

    if (plan.sendMentor) {
      sendYdpMatchEmail_(messages.mentor);
      sheet.getRange(row, mentorStatusColumn).setValue(YDP_MATCHING_CONFIG.statuses.sent);
      sheet.getRange(row, mentorSentAtColumn).setValue(now);
      mentorSent = true;
    }

    sheet.getRange(row, lastErrorColumn).setValue('');

    return {
      row: row,
      menteeSent: menteeSent,
      mentorSent: mentorSent,
      skipped: false
    };
  } catch (error) {
    if (plan.sendMentee) {
      sheet.getRange(row, menteeStatusColumn).setValue(YDP_MATCHING_CONFIG.statuses.error);
    }

    if (plan.sendMentor) {
      sheet.getRange(row, mentorStatusColumn).setValue(YDP_MATCHING_CONFIG.statuses.error);
    }

    sheet.getRange(row, lastErrorColumn).setValue(error.message);

    return {
      row: row,
      menteeSent: false,
      mentorSent: false,
      skipped: false,
      error: error.message
    };
  }
}

function sendYdpMatchEmail_(message) {
  MailApp.sendEmail({
    to: message.to,
    subject: message.subject,
    body: message.body,
    htmlBody: message.htmlBody,
    name: YDP_MATCHING_CONFIG.senderName
  });
}

function buildYdpMatchEmailSingleSendMessage_(result) {
  if (result.error) {
    return 'Match email failed for row ' + result.row + ':\n\n' + result.error;
  }

  if (result.skipped) {
    return 'Match email skipped for row ' + result.row + ':\n\n' + result.reason;
  }

  return [
    'Match email send complete for row ' + result.row + '.',
    '',
    'Mentee email sent: ' + (result.menteeSent ? 'Yes' : 'No'),
    'Mentor email sent: ' + (result.mentorSent ? 'Yes' : 'No')
  ].join('\n');
}

function getYdpMatchedPairsSheet_() {
  const spreadsheet = SpreadsheetApp.getActive();
  const sheet = spreadsheet.getSheetByName(YDP_MATCHING_CONFIG.sheets.matchedPairs);

  if (!sheet) {
    throw new Error('Matched Pairs sheet not found. Run "Setup matching workbook" first.');
  }

  return sheet;
}

function getSelectedYdpMatchedPairRow_(sheet) {
  const spreadsheet = SpreadsheetApp.getActive();
  const activeSheet = spreadsheet.getActiveSheet();
  const activeRange = activeSheet ? activeSheet.getActiveRange() : null;

  if (!activeSheet || activeSheet.getName() !== sheet.getName() || !activeRange) {
    throw new Error('Select a row inside the Matched Pairs sheet first.');
  }

  const row = activeRange.getRow();

  if (row <= 1) {
    throw new Error('Select a matched pair data row, not the header row.');
  }

  return row;
}

function getYdpMatchedPairDataForRow_(sheet, row) {
  const headerMap = getYdpMatchingHeaderMap_(sheet);
  const values = sheet.getRange(row, 1, 1, Math.max(sheet.getLastColumn(), getYdpMatchedPairsHeaders_().length)).getValues()[0];

  return {
    matchId: getYdpRowValueByHeader_(values, headerMap, 'Match ID'),
    menteeId: getYdpRowValueByHeader_(values, headerMap, 'Mentee ID'),
    menteeName: getYdpRowValueByHeader_(values, headerMap, 'Mentee Name'),
    menteeEmail: getYdpRowValueByHeader_(values, headerMap, 'Mentee Email'),
    mentorId: getYdpRowValueByHeader_(values, headerMap, 'Mentor ID'),
    mentorName: getYdpRowValueByHeader_(values, headerMap, 'Mentor Name'),
    mentorEmail: getYdpRowValueByHeader_(values, headerMap, 'Mentor Email'),
    track: getYdpRowValueByHeader_(values, headerMap, 'Track'),
    menteeMatchEmailStatus: getYdpRowValueByHeader_(values, headerMap, 'Mentee Match Email Status'),
    mentorMatchEmailStatus: getYdpRowValueByHeader_(values, headerMap, 'Mentor Match Email Status')
  };
}

function getYdpMatchingHeaderMap_(sheet) {
  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const map = {};

  headers.forEach(function(header, index) {
    const key = String(header || '').trim();
    if (key) {
      map[key] = index + 1;
    }
  });

  return map;
}

function getYdpMatchingHeaderColumn_(headerMap, header) {
  const column = headerMap[header];

  if (!column) {
    throw new Error('Required column not found in Matched Pairs: ' + header);
  }

  return column;
}

function getYdpRowValueByHeader_(rowValues, headerMap, header) {
  const column = getYdpMatchingHeaderColumn_(headerMap, header);
  return String(rowValues[column - 1] || '').trim();
}

function getYdpFirstName_(name) {
  return String(name || '').trim().split(/\s+/)[0] || 'there';
}

function isValidYdpEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function convertYdpPlainTextToHtml_(text) {
  return String(text)
    .split('\n\n')
    .map(function(paragraph) {
      return '<p>' + escapeYdpHtml_(paragraph).replace(/\n/g, '<br>') + '</p>';
    })
    .join('');
}

function escapeYdpHtml_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildYdpRecommendationId_(menteeId) {
  return 'rec-' + normalizeYdpPairIdPart_(menteeId);
}

function buildYdpMatchId_(menteeId, mentorId) {
  return 'match-' + normalizeYdpPairIdPart_(menteeId) + '-' + normalizeYdpPairIdPart_(mentorId);
}

function clearYdpSheetBody_(sheet) {
  if (sheet.getLastRow() <= 1) {
    return;
  }

  sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.max(sheet.getLastColumn(), 1)).clearContent();
}

function upsertYdpPairScoreRow_(sheet, existingPair, rowValues) {
  const headers = getYdpPairScoresHeaders_();
  const rowNumber = existingPair && existingPair.rowNumber ? existingPair.rowNumber : sheet.getLastRow() + 1;
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([rowValues]);

  return {
    rowNumber: rowNumber,
    pairId: String(rowValues[headers.indexOf('Pair ID')] || '').trim(),
    status: String(rowValues[headers.indexOf('Pair Score Status')] || '').trim()
  };
}

function clampYdpWeightedScore_(value, maxValue) {
  const numberValue = Number(value);

  if (isNaN(numberValue)) {
    return 0;
  }

  return Math.max(0, Math.min(maxValue, Math.round(numberValue)));
}

function getYdpExistingMenteeScoreMap_(sheet) {
  const headers = getYdpMenteeScoresHeaders_();
  const map = {};

  if (sheet.getLastRow() <= 1) {
    return map;
  }

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  const idIndex = headers.indexOf('Mentee ID');
  const emailIndex = headers.indexOf('Mentee Email');
  const finalScoreIndex = headers.indexOf('Final Score');
  const reviewStatusIndex = getYdpMenteeReviewStatusIndex_(headers);

  values.forEach(function(row, index) {
    const score = {
      rowNumber: index + 2,
      id: String(row[idIndex] || '').trim(),
      email: String(row[emailIndex] || '').trim(),
      finalScore: String(row[finalScoreIndex] || '').trim(),
      reviewStatus: String(row[reviewStatusIndex] || '').trim()
    };
    const key = getYdpMenteeScoreKey_(score);

    if (key) {
      map[key] = score;
    }
  });

  return map;
}

function upsertYdpMenteeScoreRow_(sheet, existingScore, rowValues) {
  const headers = getYdpMenteeScoresHeaders_();
  const rowNumber = existingScore && existingScore.rowNumber ? existingScore.rowNumber : sheet.getLastRow() + 1;
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([rowValues]);

  return {
    rowNumber: rowNumber,
    id: String(rowValues[headers.indexOf('Mentee ID')] || '').trim(),
    email: String(rowValues[headers.indexOf('Mentee Email')] || '').trim(),
    finalScore: String(rowValues[headers.indexOf('Final Score')] || '').trim(),
    reviewStatus: String(rowValues[getYdpMenteeReviewStatusIndex_(headers)] || '').trim()
  };
}

function getYdpMenteeScoreKey_(menteeOrScore) {
  const id = String(menteeOrScore.id || '').trim().toLowerCase();
  const email = String(menteeOrScore.email || '').trim().toLowerCase();

  if (id) {
    return 'id:' + id;
  }

  if (email) {
    return 'email:' + email;
  }

  return '';
}

function getYdpDefaultMenteeScoringBatchSize_() {
  return YDP_MATCHING_CONFIG.defaultMenteeScoringBatchSize;
}

function getYdpMenteeScoringRunLimitMilliseconds_() {
  return YDP_MATCHING_CONFIG.maxMenteeScoringRunMilliseconds ||
    YDP_MATCHING_CONFIG.maxManualRunMilliseconds;
}

function getYdpGeminiReviewStatusForScore_(finalScore) {
  const numberValue = Number(finalScore);

  if (!isNaN(numberValue) && numberValue >= 60) {
    return 'Can Pair';
  }

  return 'Do Not Pair';
}

function getYdpMenteeReviewStatusIndex_(headers) {
  const geminiReviewStatusIndex = headers.indexOf('Gemini Review Status');

  if (geminiReviewStatusIndex !== -1) {
    return geminiReviewStatusIndex;
  }

  return headers.indexOf('Review Status');
}

function buildYdpMenteeScoreBatchMessage_(summary) {
  if (summary.completedAll) {
    return 'All available mentees already have scores.';
  }

  const lines = [
    'Generated mentee scores for ' + summary.successCount + ' mentees.',
    'Skipped already-scored rows: ' + summary.skippedCount + '.',
    'Errors: ' + summary.errorCount + '.'
  ];

  if (summary.quotaHit) {
    lines.push('');
    lines.push('Gemini quota was reached, so scoring stopped safely. Wait and run this button again later.');

    if (summary.quotaMessage) {
      lines.push(summary.quotaMessage);
    }
  } else if (summary.stoppedForTime) {
    lines.push('');
    lines.push('Apps Script time was almost up, so mentee scoring stopped safely. Run the button again to continue.');
  } else if (summary.successCount === 1) {
    lines.push('');
    lines.push('One mentee was scored. Run this button again when you want to score the next unscored mentee.');
  } else if (summary.successCount > 1) {
    lines.push('');
    lines.push('Run this button again when you want to continue scoring the next unscored mentees.');
  }

  return lines.join('\n');
}

function isYdpGeminiQuotaError_(error) {
  const message = String(error && error.message ? error.message : error || '').toLowerCase();
  return message.indexOf('resource_exhausted') !== -1 ||
    message.indexOf('quota') !== -1 ||
    message.indexOf('http 429') !== -1;
}

function describeYdpPairScoreError_(error) {
  const message = String(error && error.message ? error.message : error || '').trim();

  if (!message) {
    return 'Unknown pair scoring error.';
  }

  if (message.indexOf('Missing Script Property') !== -1) {
    return formatYdpGeminiMissingKeyMessage_();
  }

  if (message.indexOf('Gemini API HTTP') !== -1 || message.indexOf('Gemini quota') !== -1) {
    return shortenYdpErrorMessage_(message, 900);
  }

  if (message.indexOf('invalid JSON') !== -1 || message.indexOf('JSON object') !== -1) {
    return shortenYdpErrorMessage_(message, 900);
  }

  return shortenYdpErrorMessage_(message, 900);
}

function shortenYdpErrorMessage_(message, maxLength) {
  const text = String(message || '').replace(/\s+/g, ' ').trim();
  const limit = maxLength || 300;

  if (text.length <= limit) {
    return text;
  }

  return text.slice(0, limit - 3) + '...';
}

function getYdpCurrentOrDefaultSourceId_(currentValue, defaultValue, oldValues) {
  const value = String(currentValue || '').trim();

  if (!value) {
    return defaultValue;
  }

  if ((oldValues || []).indexOf(value) !== -1) {
    return defaultValue;
  }

  return value;
}

function getYdpGeminiApiKeySlotsFromMap_(propertyMap) {
  const properties = propertyMap || {};
  const primaryName = YDP_MATCHING_CONFIG.scriptProperties.geminiApiKey;
  const prefix = YDP_MATCHING_CONFIG.scriptProperties.geminiApiKeyPrefix;
  const primaryKey = String(properties[primaryName] || properties[prefix + '1'] || '').trim();
  const slots = [];

  if (primaryKey) {
    slots.push({
      index: 1,
      propertyName: properties[primaryName] ? primaryName : prefix + '1',
      key: primaryKey
    });
  }

  for (let index = 2; index <= YDP_MATCHING_CONFIG.maxGeminiApiKeys; index++) {
    const propertyName = prefix + index;
    const key = String(properties[propertyName] || '').trim();

    if (key) {
      slots.push({
        index: index,
        propertyName: propertyName,
        key: key
      });
    }
  }

  return slots;
}

function getYdpGeminiApiKeySlots_(scriptProperties) {
  const properties = scriptProperties || PropertiesService.getScriptProperties();
  return getYdpGeminiApiKeySlotsFromMap_(properties.getProperties());
}

function getYdpGeminiKeyAttemptOrder_(slots, activeIndex) {
  const availableSlots = slots || [];

  if (!availableSlots.length) {
    return [];
  }

  const requestedIndex = parseInt(activeIndex, 10);
  let startPosition = availableSlots.findIndex(function(slot) {
    return slot.index === requestedIndex;
  });

  if (startPosition < 0) {
    startPosition = 0;
  }

  return availableSlots.slice(startPosition).concat(availableSlots.slice(0, startPosition));
}

function formatYdpGeminiMissingKeyMessage_() {
  return 'Missing Script Property: add GEMINI_API_KEY, with optional backup keys GEMINI_API_KEY_2, GEMINI_API_KEY_3, and so on in the matching Apps Script settings.';
}

function callYdpGeminiWithKeySlots_(slots, activeIndex, requestFunction, rememberFunction) {
  const attemptOrder = getYdpGeminiKeyAttemptOrder_(slots, activeIndex);

  if (!attemptOrder.length) {
    throw new Error(formatYdpGeminiMissingKeyMessage_());
  }

  let lastQuotaError = '';

  for (let index = 0; index < attemptOrder.length; index++) {
    const slot = attemptOrder[index];

    try {
      const result = requestFunction(slot);
      rememberFunction(slot.index);
      return result;
    } catch (error) {
      if (!isYdpGeminiQuotaError_(error)) {
        throw error;
      }

      lastQuotaError = String(error && error.message ? error.message : error || '');
    }
  }

  throw new Error(
    'Gemini quota/rate limit reached for all ' + attemptOrder.length +
    ' configured API keys. Last error: ' + shortenYdpErrorMessage_(lastQuotaError, 500)
  );
}

function callYdpGemini_(prompt) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const slots = getYdpGeminiApiKeySlots_(scriptProperties);
  const activeIndex = scriptProperties.getProperty(
    YDP_MATCHING_CONFIG.scriptProperties.geminiActiveApiKeyIndex
  );
  const config = getYdpMatchingRuntimeConfig_();
  return callYdpGeminiWithKeySlots_(
    slots,
    activeIndex,
    function(slot) {
      return fetchYdpGeminiTextWithKey_(prompt, config.geminiModel, slot.key);
    },
    function(slotIndex) {
      scriptProperties.setProperty(
        YDP_MATCHING_CONFIG.scriptProperties.geminiActiveApiKeyIndex,
        String(slotIndex)
      );
    }
  );
}

function fetchYdpGeminiTextWithKey_(prompt, geminiModel, apiKey) {
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(geminiModel) +
    ':generateContent?key=' +
    encodeURIComponent(apiKey);
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  };
  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const statusCode = response.getResponseCode();
  const bodyText = response.getContentText();

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(formatYdpGeminiHttpError_(statusCode, bodyText));
  }

  const body = JSON.parse(bodyText);
  const text = body &&
    body.candidates &&
    body.candidates[0] &&
    body.candidates[0].content &&
    body.candidates[0].content.parts &&
    body.candidates[0].content.parts[0] &&
    body.candidates[0].content.parts[0].text;

  if (!text) {
    throw new Error('Gemini API response did not include text.');
  }

  return String(text).trim();
}

function formatYdpGeminiHttpError_(statusCode, bodyText) {
  try {
    const body = JSON.parse(bodyText);
    const error = body && body.error ? body.error : {};
    const status = error.status ? String(error.status) : 'UNKNOWN';
    const retryInfo = getYdpGeminiRetryInfo_(error.details || []);
    const retrySuffix = retryInfo ? ' Wait about ' + retryInfo + ' before trying again.' : ' Wait a few minutes before trying again.';

    if (statusCode === 429 || status === 'RESOURCE_EXHAUSTED') {
      return 'Gemini quota/rate limit reached.' + retrySuffix;
    }

    const message = error.message ? String(error.message) : String(bodyText || '');
    return 'Gemini API HTTP ' + statusCode + ' ' + status + ': ' + shortenYdpErrorMessage_(message);
  } catch (error) {
    return 'Gemini API HTTP ' + statusCode + ': ' + shortenYdpErrorMessage_(bodyText);
  }
}

function getYdpGeminiRetryInfo_(details) {
  for (let index = 0; index < details.length; index++) {
    const detail = details[index];

    if (detail && detail.retryDelay) {
      return String(detail.retryDelay);
    }
  }

  return '';
}

function getYdpMatchingRuntimeConfig_() {
  const spreadsheet = SpreadsheetApp.getActive();
  const configSheet = spreadsheet.getSheetByName(YDP_MATCHING_CONFIG.sheets.sourceConfig);

  if (!configSheet) {
    throw new Error('Run "Setup matching workbook" first.');
  }

  const configMap = getYdpConfigMap_(configSheet);
  return {
    menteeSpreadsheetId: configMap[YDP_MATCHING_CONFIG.configKeys.menteeSpreadsheetId],
    mentorSpreadsheetId: configMap[YDP_MATCHING_CONFIG.configKeys.mentorSpreadsheetId],
    responseTabName: configMap[YDP_MATCHING_CONFIG.configKeys.responseTabName] || YDP_MATCHING_CONFIG.defaultResponseTabName,
    geminiModel: configMap[YDP_MATCHING_CONFIG.configKeys.geminiModel] || YDP_MATCHING_CONFIG.defaultGeminiModel
  };
}

function getYdpConfigMap_(sheet) {
  const lastRow = sheet.getLastRow();
  const map = {};

  if (lastRow <= 1) {
    return map;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  values.forEach(function(row) {
    const key = String(row[0] || '').trim();
    const value = String(row[1] || '').trim();

    if (key) {
      map[key] = value;
    }
  });

  return map;
}

function ensureYdpSheetWithHeaders_(spreadsheet, sheetName, headers) {
  const sheet = getOrCreateYdpSheet_(spreadsheet, sheetName);

  if (headers.length > 0 && sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  } else if (headers.length > 0) {
    const existingHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
    headers.forEach(function(header, index) {
      if (!existingHeaders[index]) {
        sheet.getRange(1, index + 1).setValue(header);
      }
    });
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function migrateYdpMenteeScoreReviewStatus_(sheet) {
  if (!sheet || sheet.getLastRow() < 1) {
    return;
  }

  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), getYdpMenteeScoresHeaders_().length)).getValues()[0].map(function(header) {
    return String(header || '').trim();
  });
  const oldStatusIndex = headers.indexOf('Review Status');
  const newStatusIndex = headers.indexOf('Gemini Review Status');
  const statusIndex = newStatusIndex !== -1 ? newStatusIndex : oldStatusIndex;

  if (oldStatusIndex !== -1 && newStatusIndex === -1) {
    sheet.getRange(1, oldStatusIndex + 1).setValue('Gemini Review Status');
  }

  if (statusIndex === -1 || sheet.getLastRow() <= 1) {
    return;
  }

  const finalScoreIndex = headers.indexOf('Final Score');

  if (finalScoreIndex === -1) {
    return;
  }

  const rowCount = sheet.getLastRow() - 1;
  const finalScoreValues = sheet.getRange(2, finalScoreIndex + 1, rowCount, 1).getValues();
  const statusRange = sheet.getRange(2, statusIndex + 1, rowCount, 1);
  const statusValues = statusRange.getValues();
  let changed = false;

  for (let index = 0; index < statusValues.length; index++) {
    const currentStatus = String(statusValues[index][0] || '').trim();

    if (currentStatus === 'ERROR' || currentStatus === 'Can Pair' || currentStatus === 'Do Not Pair') {
      continue;
    }

    if (currentStatus === 'Pending Review' || currentStatus === '') {
      statusValues[index][0] = getYdpGeminiReviewStatusForScore_(finalScoreValues[index][0]);
      changed = true;
    }
  }

  if (changed) {
    statusRange.setValues(statusValues);
  }
}

function getOrCreateYdpSheet_(spreadsheet, sheetName) {
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function getYdpMenteeScoresHeaders_() {
  return [
    'Mentee ID',
    'Mentee Name',
    'Mentee Email',
    'Career Path Interest',
    'Learning Commitment Score',
    'Community Engagement Score',
    'Career Goals Score',
    'Soft Skills Score',
    'Final Score',
    'Gemini Review Status',
    'Reviewer Notes',
    'Gemini Summary',
    'Gemini Concerns',
    'Scored At'
  ];
}

function getYdpPairScoresHeaders_() {
  return [
    'Pair ID',
    'Mentee ID',
    'Mentee Name',
    'Mentee Email',
    'Mentor ID',
    'Mentor Name',
    'Mentor Email',
    'Skill Fit Score',
    'Career Fit Score',
    'Availability Fit Score',
    'Capacity Fit Score',
    'Total Pair Score',
    'Gemini Reason',
    'Gemini Concern',
    'Pair Score Status',
    'Scored At'
  ];
}

function getYdpMatchRecommendationHeaders_() {
  return [
    'Recommendation ID',
    'Mentee ID',
    'Mentee Name',
    'Mentee Career Path',
    'Recommended Mentor ID',
    'Recommended Mentor Name',
    'Match Score',
    'Skill Match Reason',
    'Career Match Reason',
    'Availability Notes',
    'Gemini Explanation',
    'Gemini Concerns',
    'Review Status',
    'Final Decision Notes'
  ];
}

function getYdpMatchedPairsHeaders_() {
  return [
    'Match ID',
    'Mentee ID',
    'Mentee Name',
    'Mentee Email',
    'Mentor ID',
    'Mentor Name',
    'Mentor Email',
    'Track',
    'Match Status',
    'Active Status',
    'Start Date',
    'Last Check-in Date',
    'Missed Sessions Count',
    'Feedback Completion Count',
    'Mentor Rating Average',
    'Risk Status',
    'Notes'
  ].concat(getYdpMatchEmailTrackingHeaders_());
}

function getYdpRunLogHeaders_() {
  return [
    'Timestamp',
    'Action',
    'Status',
    'Message'
  ];
}

function logYdpMatchingRun_(action, status, message) {
  const spreadsheet = SpreadsheetApp.getActive();
  const sheet = ensureYdpSheetWithHeaders_(spreadsheet, YDP_MATCHING_CONFIG.sheets.runLog, getYdpRunLogHeaders_());
  sheet.appendRow([
    new Date(),
    action,
    status,
    message
  ]);
}
