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
    sending: 'SENDING',
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
    .addItem('Preview selected selection email', 'previewSelectedYdpMenteeSelectionEmail')
    .addItem('Send test selection email', 'sendTestYdpMenteeSelectionEmail')
    .addItem('Send selection email to selected mentee', 'sendYdpMenteeSelectionEmailToSelectedRow')
    .addItem('Send selection emails to all eligible unsent mentees', 'sendYdpMenteeSelectionEmailsToAllEligibleUnsent')
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
  const menteeScoresSheet = ensureYdpSheetWithHeaders_(
    spreadsheet,
    YDP_MATCHING_CONFIG.sheets.menteeScores,
    getYdpMenteeScoresHeaders_()
  );
  migrateYdpMenteeScoreReviewStatus_(menteeScoresSheet);
  ensureYdpAdditionalHeaders_(menteeScoresSheet, getYdpMenteeSelectionEmailTrackingHeaders_());
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
  const spreadsheet = SpreadsheetApp.getActive();
  const dictionarySheet = getOrCreateYdpSheet_(spreadsheet, 'Data Dictionary');
  const buttonGuideSheet = getOrCreateYdpSheet_(spreadsheet, 'Button Guide');
  const snapshotHeaders = getYdpMatchingSnapshotHeadersForDictionary_(spreadsheet);

  writeYdpMatchingDataDictionary_(dictionarySheet, getYdpMatchingDataDictionaryRows_(snapshotHeaders));
  writeYdpMatchingButtonGuide_(buttonGuideSheet, getYdpMatchingButtonGuideRows_());
  SpreadsheetApp.getUi().alert(
    'Matching documentation was refreshed in the "Data Dictionary" and "Button Guide" tabs. Participant, score, match, and email data were not changed.'
  );
}

function getYdpMatchingLegacyDataDictionaryRows_() {
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
    ['Sheet', YDP_MATCHING_CONFIG.sheets.menteeScores, 'Selection Email Status', 'Whether the program selection email was sent.', 'SENDING is protected from retries; SENT prevents duplicates; ERROR means sending failed.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.menteeScores, 'Selection Email Sent At', 'When the selection email was successfully sent.', 'Use as the communication audit date.'],
    ['Sheet', YDP_MATCHING_CONFIG.sheets.menteeScores, 'Selection Email Last Error', 'The latest selection-email sending error for this mentee.', 'Check when Selection Email Status is ERROR.'],
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
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Preview selected selection email', 'Shows the selection email for one selected Can Pair mentee without sending it.', 'Use before any live selection email.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Send test selection email', 'Sends the selected Can Pair mentee template to an email address you enter without updating participant status.', 'Use to inspect the real inbox version safely.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Send selection email to selected mentee', 'Sends the live selection email to one selected Can Pair mentee and records SENT.', 'Use as the controlled first live send.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Send selection emails to all eligible unsent mentees', 'Sends only to Can Pair mentees whose Selection Email Status is not SENT.', 'Use after preview, test, and one-row live verification.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Preview selected match emails', 'Shows the mentee and mentor match emails for one selected row.', 'Use before sending match emails.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Send match emails to selected pair', 'Sends match emails for one selected final pair if not already sent.', 'Use for controlled testing or one-off sends.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Send match emails to all unsent matched pairs', 'Sends match emails for every final pair that has not already been notified.', 'Use only after selected-row testing works.'],
    ['Button', YDP_MATCHING_CONFIG.menuName, 'Test Gemini connection', 'Checks that the Gemini API key works.', 'Run after changing the API key or model.']
  ];
}

function writeYdpMatchingDataDictionary_(sheet, rows) {
  resetYdpMatchingDocumentationSheet_(sheet);
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows).setWrap(true).setVerticalAlignment('top');
  formatYdpMatchingDocumentationHeader_(sheet, rows[0].length);
  applyYdpMatchingDocumentationFilter_(sheet, rows);
  [180, 310, 240, 400, 360, 180, 380].forEach(function(width, index) { sheet.setColumnWidth(index + 1, width); });
}

function getYdpMatchingDataDictionaryRows_(snapshotHeaders) {
  const rows = [
    ['Sheet Name', 'Sheet Purpose', 'Column Name', 'Column Meaning', 'Automation Use', 'Can Team Edit?', 'Notes']
  ];

  addYdpMatchingDictionaryColumns_(rows, YDP_MATCHING_CONFIG.sheets.sourceConfig,
    'Stores the source workbook IDs, source tab preference, and Gemini model used by the matching automation.',
    ['Setting', 'Value', 'Notes'], {
      Setting: ['Configuration name.', 'Identifies the value the script must read.', 'No - use setup unless instructed', 'Includes source spreadsheet IDs, source tab name, and Gemini model.'],
      Value: ['Current configuration value.', 'Controls where data comes from and which Gemini model is used.', 'Only with technical approval', 'A wrong value can stop source sync or Gemini scoring.'],
      Notes: ['Plain-language explanation of the setting.', 'Helps operators understand configuration.', 'Yes', 'Documentation only.']
    });

  addYdpMatchingSnapshotDictionaryRows_(rows, YDP_MATCHING_CONFIG.sheets.menteeSnapshot,
    'Latest copied view of the live mentee application response sheet.',
    snapshotHeaders && snapshotHeaders.mentee);
  addYdpMatchingSnapshotDictionaryRows_(rows, YDP_MATCHING_CONFIG.sheets.mentorSnapshot,
    'Latest copied view of the live mentor application response sheet.',
    snapshotHeaders && snapshotHeaders.mentor);

  addYdpMatchingDictionaryColumns_(rows, YDP_MATCHING_CONFIG.sheets.menteeScores,
    'Stores Gemini-assisted mentee eligibility scores, explanations, and selection-email tracking.',
    getYdpMenteeScoresHeaders_().concat(getYdpMenteeSelectionEmailTrackingHeaders_()), getYdpMenteeScoreColumnDocumentation_());
  addYdpMatchingDictionaryColumns_(rows, YDP_MATCHING_CONFIG.sheets.pairScores,
    'Stores every eligible mentee compared with every available mentor before final assignment.',
    getYdpPairScoresHeaders_(), getYdpPairScoreColumnDocumentation_());
  addYdpMatchingDictionaryColumns_(rows, YDP_MATCHING_CONFIG.sheets.matchRecommendations,
    'Shows the system recommendation or the reason a mentee cannot yet be matched.',
    getYdpMatchRecommendationHeaders_(), getYdpMatchRecommendationColumnDocumentation_());
  addYdpMatchingDictionaryColumns_(rows, YDP_MATCHING_CONFIG.sheets.matchedPairs,
    'Stores final mentor and mentee assignments, program tracking, and match-email delivery history.',
    getYdpMatchedPairsHeaders_(), getYdpMatchedPairColumnDocumentation_());
  addYdpMatchingDictionaryColumns_(rows, YDP_MATCHING_CONFIG.sheets.runLog,
    'Records each automation run, result, and troubleshooting message.',
    getYdpRunLogHeaders_(), getYdpRunLogColumnDocumentation_());
  addYdpMatchingDocumentationDictionaryRows_(rows);

  return rows;
}

function addYdpMatchingDictionaryColumns_(rows, sheetName, sheetPurpose, headers, documentation) {
  headers.forEach(function(header) {
    const details = documentation[header] || [
      'Stores the ' + header + ' value for this record.',
      'Used by the ' + sheetName + ' workflow.',
      'Only with technical approval',
      'Automation-managed field.'
    ];
    rows.push([sheetName, sheetPurpose, header, details[0], details[1], details[2], details[3]]);
  });
}

function addYdpMatchingSnapshotDictionaryRows_(rows, sheetName, sheetPurpose, headers) {
  const sourceHeaders = (headers || []).filter(function(header) { return String(header || '').trim(); });
  if (sourceHeaders.length === 0) {
    rows.push([sheetName, sheetPurpose, 'Source columns appear after sync', 'Columns copied from the corresponding live application form.', 'Provides the source data used for scoring and matching.', 'No - edit the source form response instead', 'Run Sync source snapshots from forms, then refresh this dictionary to list every live column.']);
    return;
  }

  sourceHeaders.forEach(function(header) {
    rows.push([sheetName, sheetPurpose, String(header), 'Copied response for this application question or tracking field.', 'Available to scoring and matching when relevant.', 'No - edit the source form response instead', 'A later source sync replaces snapshot contents.']);
  });
}

function getYdpMenteeScoreColumnDocumentation_() {
  return {
    'Mentee ID': ['Stable mentee identifier.', 'Links the mentee across scores, pairs, matches, and emails.', 'No - automation managed', 'Created in the mentee response workbook.'],
    'Mentee Name': ['Readable mentee full name.', 'Personalizes reviews and emails.', 'Only to correct a confirmed typo', 'Keep aligned with the source response.'],
    'Mentee Email': ['Mentee email address.', 'Used for identity and selection or match emails.', 'Only to correct a confirmed typo', 'Changing it can affect communication tracking.'],
    'Career Path Interest': ['Data career path the mentee wants to pursue.', 'Used in mentor career and skill matching.', 'No - source managed', 'Comes from the application.'],
    'Learning Commitment Score': ['Gemini-assisted score from 0 to 5 for learning effort, courses, and projects.', 'Contributes to Final Score.', 'No - Gemini managed', 'Review Gemini Summary for context.'],
    'Community Engagement Score': ['Gemini-assisted score from 0 to 5 for YDP and community engagement.', 'Contributes to Final Score.', 'No - Gemini managed', 'A low score does not by itself reject a mentee.'],
    'Career Goals Score': ['Gemini-assisted score from 0 to 5 for clear, relevant goals.', 'Contributes to Final Score.', 'No - Gemini managed', 'Based on application responses.'],
    'Soft Skills Score': ['Gemini-assisted score from 0 to 5 for commitment, teamwork, and ownership.', 'Contributes to Final Score.', 'No - Gemini managed', 'Based on written evidence.'],
    'Final Score': ['Weighted eligibility score out of 100.', 'Determines Can Pair at 60 or above.', 'No - automation managed', 'Used before pair scoring begins.'],
    'Gemini Review Status': ['Can Pair, Do Not Pair, or ERROR.', 'Only Can Pair mentees enter pair scoring.', 'Only with approved override', 'ERROR means scoring must be retried.'],
    'Reviewer Notes': ['Optional internal notes.', 'Records an approved manual observation or override.', 'Yes', 'Do not place secrets here.'],
    'Gemini Summary': ['Gemini explanation of the eligibility score.', 'Provides review context.', 'No - Gemini managed', 'Not sent to participants.'],
    'Gemini Concerns': ['Gemini risk or concern note.', 'Supports internal review.', 'No - Gemini managed', 'Not sent to participants.'],
    'Scored At': ['Date and time the mentee was scored.', 'Provides the scoring audit trail.', 'No - automation managed', 'Blank means no completed score.'],
    'Selection Email Status': ['SENDING, SENT, or ERROR for the mentee selection email.', 'Prevents duplicate selection emails.', 'No - automation managed', 'Only Can Pair mentees are eligible.'],
    'Selection Email Sent At': ['Date and time the selection email was sent.', 'Provides communication audit history.', 'No - automation managed', 'Do not clear after sending.'],
    'Selection Email Last Error': ['Most recent selection-email error.', 'Explains a failed send.', 'No - automation managed', 'Check before retrying.']
  };
}

function getYdpPairScoreColumnDocumentation_() {
  return {
    'Pair ID': ['Unique ID for one mentee and one mentor comparison.', 'Prevents the same comparison from being scored twice.', 'No - automation managed', 'Every eligible mentee is compared with every available mentor.'],
    'Mentee ID': ['Stable mentee identifier.', 'Groups all mentor comparisons for one mentee.', 'No - automation managed', 'Must match Mentee Scores.'],
    'Mentee Name': ['Readable mentee name.', 'Makes comparisons easy to review.', 'No - automation managed', 'Copied from Mentee Scores.'],
    'Mentee Email': ['Mentee email address.', 'Carries the identity into final matching.', 'No - automation managed', 'Copied from Mentee Scores.'],
    'Mentor ID': ['Stable mentor identifier.', 'Tracks capacity and assignments.', 'No - automation managed', 'Must match Mentor Source Snapshot.'],
    'Mentor Name': ['Readable mentor name.', 'Makes comparisons easy to review.', 'No - automation managed', 'Copied from the mentor snapshot.'],
    'Mentor Email': ['Mentor email address.', 'Carries the identity into match notifications.', 'No - automation managed', 'Copied from the mentor snapshot.'],
    'Skill Fit Score': ['Gemini score out of 40 for expertise and skill alignment.', 'Largest component of Total Pair Score.', 'No - Gemini managed', 'Higher is better.'],
    'Career Fit Score': ['Gemini score out of 30 for career-path and background fit.', 'Contributes to Total Pair Score.', 'No - Gemini managed', 'Higher is better.'],
    'Availability Fit Score': ['Gemini score out of 15 for schedule and communication compatibility.', 'Contributes to Total Pair Score.', 'No - Gemini managed', 'Missing availability can reduce this score.'],
    'Capacity Fit Score': ['Gemini score out of 15 for practical mentor capacity.', 'Contributes to Total Pair Score.', 'No - Gemini managed', 'Final assignment also enforces stated capacity and the approved +2 overflow.'],
    'Total Pair Score': ['Overall mentor and mentee fit score out of 100.', 'Ranks mentors for automatic assignment.', 'No - automation managed', 'The highest available fit is selected after all mentors are scored.'],
    'Gemini Reason': ['Why Gemini believes the pair is or is not suitable.', 'Explains the numerical score.', 'No - Gemini managed', 'Internal context only.'],
    'Gemini Concern': ['Risk, mismatch, or API error note.', 'Supports troubleshooting and review.', 'No - Gemini managed', 'Check when status is Error.'],
    'Pair Score Status': ['Scored or Error.', 'Only Scored comparisons count as complete.', 'No - automation managed', 'Rerunning continues from unscored or failed pairs.'],
    'Scored At': ['Date and time the pair was scored.', 'Provides the comparison audit trail.', 'No - automation managed', 'Blank means no completed score.']
  };
}

function getYdpMatchRecommendationColumnDocumentation_() {
  return {
    'Recommendation ID': ['Unique ID for one mentee recommendation.', 'Tracks the auto-match result.', 'No - automation managed', 'One recommendation row per eligible mentee.'],
    'Mentee ID': ['Stable mentee identifier.', 'Links to scores and final pair.', 'No - automation managed', 'Reference key.'],
    'Mentee Name': ['Readable mentee name.', 'Supports review.', 'No - automation managed', 'Reference field.'],
    'Mentee Career Path': ['Mentee target career path.', 'Explains the matching context.', 'No - automation managed', 'Copied from Mentee Scores.'],
    'Recommended Mentor ID': ['Mentor chosen by the capacity-aware ranking.', 'Becomes the final mentor assignment.', 'No - automation managed', 'Blank when more pair scores are needed.'],
    'Recommended Mentor Name': ['Readable chosen mentor name.', 'Supports review and communication.', 'No - automation managed', 'Blank when no assignment is ready.'],
    'Match Score': ['Winning Total Pair Score.', 'Shows the strength of the recommendation.', 'No - automation managed', 'Higher is better.'],
    'Skill Match Reason': ['Gemini skill-fit explanation.', 'Explains expertise alignment.', 'No - automation managed', 'Copied from Pair Scores.'],
    'Career Match Reason': ['Gemini career-fit explanation.', 'Explains career alignment.', 'No - automation managed', 'Copied from Pair Scores.'],
    'Availability Notes': ['Availability and capacity score summary.', 'Explains practical fit.', 'No - automation managed', 'Internal review context.'],
    'Gemini Explanation': ['Overall Gemini explanation for the selected pair or incomplete result.', 'Provides the matching rationale.', 'No - automation managed', 'Internal context only.'],
    'Gemini Concerns': ['Concern associated with the selected pair.', 'Highlights review risks.', 'No - automation managed', 'May be blank.'],
    'Review Status': ['Auto-Selected or Needs More Pair Scores.', 'Shows whether a recommendation is ready.', 'No - automation managed', 'Needs More Pair Scores means do not notify participants.'],
    'Final Decision Notes': ['Optional internal decision note.', 'Records approved changes or context.', 'Yes', 'May be overwritten if auto-match outputs are rebuilt.']
  };
}

function getYdpMatchedPairColumnDocumentation_() {
  return {
    'Match ID': ['Unique ID for the final mentor and mentee assignment.', 'Tracks the relationship throughout the program.', 'No - automation managed', 'Primary match key.'],
    'Mentee ID': ['Stable mentee identifier.', 'Links back to mentee scores and source data.', 'No - automation managed', 'Reference key.'],
    'Mentee Name': ['Readable mentee name.', 'Used in match communication and operations.', 'No - automation managed', 'Copied from Mentee Scores.'],
    'Mentee Email': ['Mentee email address.', 'Receives the mentee match email.', 'Only to correct a confirmed typo', 'Changing it affects communication.'],
    'Mentor ID': ['Stable mentor identifier.', 'Links to capacity and mentor source data.', 'No - automation managed', 'Reference key.'],
    'Mentor Name': ['Readable mentor name.', 'Used in match communication and operations.', 'No - automation managed', 'Copied from the mentor snapshot.'],
    'Mentor Email': ['Mentor email address.', 'Receives the mentor match email.', 'Only to correct a confirmed typo', 'Changing it affects communication.'],
    Track: ['Mentee career track.', 'Provides program and workshop context.', 'No - automation managed', 'Copied from the mentee career path.'],
    'Match Status': ['Current assignment state, initially Auto-Matched.', 'Shows how the match was created or changed.', 'Only with team approval', 'Keep an explanation in Notes.'],
    'Active Status': ['Operational state of the pair.', 'Used for program monitoring.', 'Yes', 'Starts as Pending Review.'],
    'Start Date': ['Date the mentorship relationship starts.', 'Supports program timelines.', 'Yes', 'Enter after confirmation.'],
    'Last Check-in Date': ['Most recent recorded check-in.', 'Supports follow-up and risk monitoring.', 'Yes', 'Update after confirmed check-ins.'],
    'Missed Sessions Count': ['Number of known missed sessions.', 'Supports no-show and risk tracking.', 'Yes', 'Use whole numbers.'],
    'Feedback Completion Count': ['Number of feedback forms completed.', 'Supports engagement reporting.', 'Yes or future automation', 'Use whole numbers.'],
    'Mentor Rating Average': ['Average mentee rating for the mentor.', 'Supports quality monitoring.', 'Yes or future automation', 'Use the agreed rating scale.'],
    'Risk Status': ['Current operational risk flag.', 'Supports interventions and reporting.', 'Yes', 'Starts as Not Started.'],
    Notes: ['Internal notes about the match.', 'Stores approved operational context.', 'Yes', 'Do not place secrets here.'],
    'Mentee Match Email Status': ['SENDING, SENT, or ERROR for the mentee match email.', 'Prevents duplicate mentee notifications.', 'No - automation managed', 'Preview and test before live sends.'],
    'Mentee Match Email Sent At': ['Date and time the mentee match email was sent.', 'Provides communication audit history.', 'No - automation managed', 'Do not clear after sending.'],
    'Mentor Match Email Status': ['SENDING, SENT, or ERROR for the mentor match email.', 'Prevents duplicate mentor notifications.', 'No - automation managed', 'Independent from the mentee email status.'],
    'Mentor Match Email Sent At': ['Date and time the mentor match email was sent.', 'Provides communication audit history.', 'No - automation managed', 'Do not clear after sending.'],
    'Match Email Last Error': ['Most recent match-email sending error.', 'Explains why a match notification failed.', 'No - automation managed', 'Check before retrying.']
  };
}

function getYdpRunLogColumnDocumentation_() {
  return {
    Timestamp: ['Date and time an automation action ran.', 'Provides an audit timeline.', 'No - automation managed', 'Newest entries are appended.'],
    Action: ['Internal name of the action that ran.', 'Identifies the workflow step.', 'No - automation managed', 'Useful for troubleshooting.'],
    Status: ['SUCCESS, PARTIAL_SUCCESS, or ERROR.', 'Shows the outcome of the run.', 'No - automation managed', 'PARTIAL_SUCCESS often means rerun to continue.'],
    Message: ['Detailed result, progress, or error message.', 'Explains what happened and what to do next.', 'No - automation managed', 'Read this before retrying a failed action.']
  };
}

function addYdpMatchingDocumentationDictionaryRows_(rows) {
  const documentation = {
    'Data Dictionary': ['Explains each matching workbook sheet and column in plain English.', ['Sheet Name', 'Sheet Purpose', 'Column Name', 'Column Meaning', 'Automation Use', 'Can Team Edit?', 'Notes']],
    'Button Guide': ['Explains every YDP Matching menu command, its safety level, and operating instructions.', ['Safety Level', 'Menu Name', 'Button Name', 'What It Does', 'When To Run', 'Before Running', 'What It Changes', 'Recommended Frequency']]
  };

  Object.keys(documentation).forEach(function(sheetName) {
    documentation[sheetName][1].forEach(function(header) {
      rows.push([sheetName, documentation[sheetName][0], header, 'Documentation field: ' + header + '.', 'Documentation only.', 'No - regenerate from menu', 'Refreshed by Create data dictionary.']);
    });
  });
}

function getYdpMatchingButtonGuideRows_() {
  const menu = YDP_MATCHING_CONFIG.menuName;
  return [
    ['Safety Level', 'Menu Name', 'Button Name', 'What It Does', 'When To Run', 'Before Running', 'What It Changes', 'Recommended Frequency'],
    ['SAFE', menu, 'Setup matching workbook', 'Creates missing matching tabs and headers without clearing completed score rows.', 'During initial setup or when a required tab/header is missing.', 'Confirm this is the YDP Matching Automation workbook.', 'Adds or repairs workbook structure; does not send emails.', 'Once, then only for repair'],
    ['CAUTION', menu, 'Sync source snapshots from forms', 'Refreshes mentor and mentee snapshot tabs from the live form workbooks.', 'After new form responses arrive and before new scoring.', 'Confirm Source Config IDs and response tab settings.', 'Replaces snapshot contents only; completed Mentee Scores and Pair Scores remain.', 'After new applications'],
    ['SAFE', menu, 'Create data dictionary', 'Refreshes the Data Dictionary and Button Guide tabs.', 'When documentation is missing or automation changes.', 'No preparation is required.', 'Rebuilds documentation tabs only.', 'After each automation update'],
    ['CAUTION', menu, 'Generate next mentee score', 'Uses Gemini to score the next one unscored mentee.', 'For a controlled scoring test or a single retry.', 'Sync sources and confirm Gemini connection.', 'Adds or retries one Mentee Scores row; skips completed scores.', 'As needed'],
    ['CAUTION', menu, 'Generate mentee scores batch', 'Uses Gemini to score a small batch of unscored mentees.', 'After the one-row test works.', 'Sync sources and confirm Gemini connection and quota.', 'Adds or retries the next batch; reruns continue from remaining rows.', 'Repeat until complete'],
    ['CAUTION', menu, 'Generate next pair score', 'Compares one eligible mentee with one mentor using Gemini.', 'For a controlled pair-scoring test or retry.', 'Finish mentee scoring and confirm mentor snapshot data.', 'Adds or retries one Pair Scores row.', 'As needed'],
    ['CAUTION', menu, 'Generate pair scores batch', 'Scores a small batch of unscored mentee and mentor comparisons.', 'After the one-pair test works.', 'Ensure Can Pair mentees and mentors have IDs; confirm Gemini quota.', 'Adds or retries pair rows; reruns continue until every eligible mentee has every mentor scored.', 'Repeat until complete'],
    ['LIVE ACTION', menu, 'Auto-match from pair scores', 'Selects the highest-scoring available mentor for each fully scored eligible mentee.', 'Only after all available mentors are scored for each mentee.', 'Review Pair Scores and confirm mentor capacity data.', 'Rebuilds Match Recommendations and Matched Pairs; fills stated capacity first, then permits at most +2 overflow.', 'Once per approved matching round'],
    ['SAFE', menu, 'Preview selected selection email', 'Shows the personalized selection email for one Can Pair mentee.', 'Before test or live selection sends.', 'Select a row in Mentee Scores with Can Pair status.', 'Opens a preview only; no email or tracking changes.', 'Before every selection campaign'],
    ['SAFE', menu, 'Send test selection email', 'Sends the selected mentee template to an internal test address.', 'After preview and before live selection sends.', 'Select a Can Pair mentee and use an internal email address.', 'Sends one test email; participant tracking is not updated.', 'Before every selection campaign'],
    ['LIVE ACTION', menu, 'Send selection email to selected mentee', 'Sends the live program-selection email to one selected eligible mentee.', 'For the controlled first live send or a one-off recipient.', 'Preview, test, and select the intended Can Pair row.', 'Sends one live email and updates selection-email tracking.', 'As needed'],
    ['LIVE ACTION', menu, 'Send selection emails to all eligible unsent mentees', 'Sends selection emails only to Can Pair mentees not already marked SENT.', 'After the selected-row live send is verified.', 'Preview, test, verify Can Pair statuses, and obtain approval.', 'Sends multiple live emails and updates selection-email tracking.', 'Once per selection campaign'],
    ['SAFE', menu, 'Preview selected match emails', 'Shows both mentor and mentee emails for one final matched pair.', 'Before any live match notification.', 'Select a complete row in Matched Pairs.', 'Opens previews only; no email or tracking changes.', 'Before every match campaign'],
    ['LIVE ACTION', menu, 'Send match emails to selected pair', 'Sends live match notifications for one selected final pair.', 'For the controlled first match send or a one-off pair.', 'Preview both emails and confirm names, emails, and assignment.', 'Sends up to two live emails and updates separate mentor/mentee tracking.', 'As needed'],
    ['LIVE ACTION', menu, 'Send match emails to all unsent matched pairs', 'Sends remaining mentor and mentee notifications for final matched pairs.', 'After the selected-pair send is verified.', 'Review Matched Pairs, preview, test, and obtain approval.', 'Sends multiple live emails and updates match-email tracking.', 'Once per matching round'],
    ['SAFE', menu, 'Test Gemini connection', 'Checks the configured Gemini model and available API keys.', 'After changing a key/model or when scoring fails.', 'Confirm Script Properties contain the approved Gemini keys.', 'Makes one Gemini test request and writes a Run Log entry.', 'When configuration changes or troubleshooting']
  ];
}

function getYdpMatchingButtonGuideColor_(safetyLevel) {
  return { SAFE: '#d9ead3', CAUTION: '#fff2cc', 'LIVE ACTION': '#f4cccc' }[safetyLevel] || '#ffffff';
}

function getYdpMatchingSnapshotHeadersForDictionary_(spreadsheet) {
  return {
    mentee: getYdpMatchingSheetHeadersForDictionary_(spreadsheet.getSheetByName(YDP_MATCHING_CONFIG.sheets.menteeSnapshot)),
    mentor: getYdpMatchingSheetHeadersForDictionary_(spreadsheet.getSheetByName(YDP_MATCHING_CONFIG.sheets.mentorSnapshot))
  };
}

function getYdpMatchingSheetHeadersForDictionary_(sheet) {
  if (!sheet || sheet.getLastColumn() < 1 || sheet.getLastRow() < 1) {
    return [];
  }
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function writeYdpMatchingButtonGuide_(sheet, rows) {
  resetYdpMatchingDocumentationSheet_(sheet);
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows).setWrap(true).setVerticalAlignment('top');
  formatYdpMatchingDocumentationHeader_(sheet, rows[0].length);
  if (rows.length > 1) {
    const backgrounds = rows.slice(1).map(function(row) {
      return new Array(rows[0].length).fill(getYdpMatchingButtonGuideColor_(row[0]));
    });
    sheet.getRange(2, 1, backgrounds.length, rows[0].length).setBackgrounds(backgrounds);
  }
  applyYdpMatchingDocumentationFilter_(sheet, rows);
  [120, 160, 330, 410, 370, 370, 410, 200].forEach(function(width, index) { sheet.setColumnWidth(index + 1, width); });
}

function resetYdpMatchingDocumentationSheet_(sheet) {
  const filter = sheet.getFilter();
  if (filter) {
    filter.remove();
  }
  sheet.clearContents();
  sheet.clearFormats();
  sheet.setFrozenRows(1);
}

function formatYdpMatchingDocumentationHeader_(sheet, columnCount) {
  sheet.getRange(1, 1, 1, columnCount).setFontWeight('bold').setFontColor('#ffffff').setBackground('#274e13');
}

function applyYdpMatchingDocumentationFilter_(sheet, rows) {
  if (rows.length > 1) {
    sheet.getRange(1, 1, rows.length, rows[0].length).createFilter();
  }
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
    let serviceUnavailableHit = false;
    let serviceUnavailableMessage = '';
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

        const readableError = shortenYdpErrorMessage_(error.message);
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
          readableError,
          new Date()
        ]);
        errorCount++;

        if (isYdpGeminiServiceUnavailableError_(error)) {
          serviceUnavailableHit = true;
          serviceUnavailableMessage = readableError;
          break;
        }
      }
    }

    scoreSheet.autoResizeColumns(1, getYdpMenteeScoresHeaders_().length);

    const message = buildYdpMenteeScoreBatchMessage_({
      successCount: successCount,
      skippedCount: skippedCount,
      errorCount: errorCount,
      quotaHit: quotaHit,
      quotaMessage: quotaMessage,
      serviceUnavailableHit: serviceUnavailableHit,
      serviceUnavailableMessage: serviceUnavailableMessage,
      stoppedForTime: stoppedForTime,
      completedAll: successCount === 0 && !quotaHit && !serviceUnavailableHit && !stoppedForTime && errorCount === 0
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

function getYdpMenteeSelectionEmailTrackingHeaders_() {
  return [
    'Selection Email Status',
    'Selection Email Sent At',
    'Selection Email Last Error'
  ];
}

function isYdpMenteeEligibleForSelectionEmail_(mentee) {
  return String(mentee && mentee.geminiReviewStatus || '').trim() === 'Can Pair';
}

function buildYdpMenteeSelectionEmail_(mentee) {
  const menteeName = String(mentee.menteeName || '').trim() || 'Mentee';
  const firstName = getYdpFirstName_(menteeName);
  const body = [
    'Hi ' + firstName + ',',
    '',
    'Congratulations! We are pleased to let you know that you have been selected as a mentee for the YDP Mentorship Program.',
    '',
    'Thank you for the time and effort you put into your application and for coming this far in the process. We are happy to have you join this cohort.',
    '',
    'Our onboarding session takes place on Saturday, July 18, 2026. Please be prepared to participate fully and commit to the mentorship journey.',
    '',
    'Your mentor match is currently being finalized. You will receive your mentor details and the next steps in a separate email.',
    '',
    'Please keep an eye on your email for the onboarding information and further updates.',
    '',
    'Warm regards,',
    YDP_MATCHING_CONFIG.senderName
  ].join('\n');

  return {
    to: String(mentee.menteeEmail || '').trim(),
    subject: "You've been selected for the YDP Mentorship Program",
    body: body,
    htmlBody: convertYdpPlainTextToHtml_(body)
  };
}

function buildYdpMenteeSelectionEmailSendPlan_(mentee) {
  if (!isYdpMenteeEligibleForSelectionEmail_(mentee)) {
    return {
      send: false,
      skippedReason: 'This mentee is not marked Can Pair.'
    };
  }

  const selectionEmailStatus = String(mentee.selectionEmailStatus || '').trim().toUpperCase();

  if (selectionEmailStatus === YDP_MATCHING_CONFIG.statuses.sent) {
    return {
      send: false,
      skippedReason: 'The selection email has already been sent.'
    };
  }

  if (selectionEmailStatus === YDP_MATCHING_CONFIG.statuses.sending) {
    return {
      send: false,
      skippedReason: 'The selection email is currently being processed. Review the row before retrying.'
    };
  }

  if (!isValidYdpEmail_(mentee.menteeEmail)) {
    return {
      send: false,
      skippedReason: 'Missing or invalid mentee email address.'
    };
  }

  return {
    send: true,
    skippedReason: ''
  };
}

function previewSelectedYdpMenteeSelectionEmail() {
  setupYdpMatchingWorkbookTabs_(SpreadsheetApp.getActive());

  const sheet = getYdpMenteeScoresSheet_();
  const row = getSelectedYdpMenteeScoreRow_(sheet);
  const mentee = getYdpMenteeScoreDataForRow_(sheet, row);

  if (!isYdpMenteeEligibleForSelectionEmail_(mentee)) {
    SpreadsheetApp.getUi().alert('This row is not marked Can Pair. No selection email can be previewed for it.');
    return;
  }

  if (!isValidYdpEmail_(mentee.menteeEmail)) {
    SpreadsheetApp.getUi().alert('This mentee has a missing or invalid email address.');
    return;
  }

  const email = buildYdpMenteeSelectionEmail_(mentee);
  const html = [
    '<div style="font-family:Arial,sans-serif;line-height:1.5;padding:8px;">',
    '<p><strong>To:</strong> ' + escapeYdpHtml_(email.to) + '</p>',
    '<p><strong>Subject:</strong> ' + escapeYdpHtml_(email.subject) + '</p>',
    '<pre style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:6px;">' + escapeYdpHtml_(email.body) + '</pre>',
    '</div>'
  ].join('');

  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(720).setHeight(620),
    'Mentee Selection Email Preview'
  );
}

function sendTestYdpMenteeSelectionEmail() {
  setupYdpMatchingWorkbookTabs_(SpreadsheetApp.getActive());

  const sheet = getYdpMenteeScoresSheet_();
  const row = getSelectedYdpMenteeScoreRow_(sheet);
  const mentee = getYdpMenteeScoreDataForRow_(sheet, row);
  const ui = SpreadsheetApp.getUi();

  if (!isYdpMenteeEligibleForSelectionEmail_(mentee)) {
    ui.alert('Select a row marked Can Pair before sending a test selection email.');
    return;
  }

  const response = ui.prompt(
    'Send Test Selection Email',
    'Enter the email address that should receive the test copy:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const testRecipient = String(response.getResponseText() || '').trim();

  if (!isValidYdpEmail_(testRecipient)) {
    ui.alert('Enter a valid test email address. No email was sent.');
    return;
  }

  const email = buildYdpMenteeSelectionEmail_(mentee);
  email.to = testRecipient;
  email.subject = '[TEST] ' + email.subject;
  sendYdpMenteeSelectionEmail_(email);

  ui.alert(
    'Test selection email sent to ' + testRecipient + '.\n\n' +
    'No participant status or sent date was changed.'
  );
}

function sendYdpMenteeSelectionEmailToSelectedRow() {
  setupYdpMatchingWorkbookTabs_(SpreadsheetApp.getActive());

  const sheet = getYdpMenteeScoresSheet_();
  const row = getSelectedYdpMenteeScoreRow_(sheet);
  const mentee = getYdpMenteeScoreDataForRow_(sheet, row);
  const plan = buildYdpMenteeSelectionEmailSendPlan_(mentee);
  const ui = SpreadsheetApp.getUi();

  if (!plan.send) {
    ui.alert('Selection email not sent:\n\n' + plan.skippedReason);
    return;
  }

  const confirmation = ui.alert(
    'Send Live Selection Email',
    'Send the real selection email to ' + mentee.menteeName + ' at ' + mentee.menteeEmail + '?',
    ui.ButtonSet.YES_NO
  );

  if (confirmation !== ui.Button.YES) {
    return;
  }

  const lock = LockService.getDocumentLock();

  if (!lock.tryLock(5000)) {
    ui.alert('Another selection-email send is already running. Wait for it to finish, then try again.');
    return;
  }

  try {
    const result = sendYdpMenteeSelectionEmailForRow_(sheet, row);
    logYdpMatchingRun_('SEND_SELECTED_MENTEE_SELECTION_EMAIL', result.error ? 'ERROR' : 'SUCCESS', buildYdpMenteeSelectionEmailSingleSendMessage_(result));
    ui.alert(buildYdpMenteeSelectionEmailSingleSendMessage_(result));
  } finally {
    lock.releaseLock();
  }
}

function sendYdpMenteeSelectionEmailsToAllEligibleUnsent() {
  setupYdpMatchingWorkbookTabs_(SpreadsheetApp.getActive());

  const sheet = getYdpMenteeScoresSheet_();
  const lastRow = sheet.getLastRow();
  const ui = SpreadsheetApp.getUi();
  const pendingRows = [];
  let validRecipientCount = 0;

  for (let row = 2; row <= lastRow; row += 1) {
    const mentee = getYdpMenteeScoreDataForRow_(sheet, row);
    const currentStatus = String(mentee.selectionEmailStatus || '').trim().toUpperCase();
    const isProtectedFromResend = currentStatus === YDP_MATCHING_CONFIG.statuses.sent ||
      currentStatus === YDP_MATCHING_CONFIG.statuses.sending;

    if (isYdpMenteeEligibleForSelectionEmail_(mentee) && !isProtectedFromResend) {
      pendingRows.push(row);
      validRecipientCount += isValidYdpEmail_(mentee.menteeEmail) ? 1 : 0;
    }
  }

  if (pendingRows.length === 0) {
    ui.alert('No eligible unsent mentees were found. Only Can Pair rows without a SENT status qualify.');
    return;
  }

  const remainingQuota = MailApp.getRemainingDailyQuota();
  if (validRecipientCount > remainingQuota) {
    ui.alert(
      'Bulk selection email stopped before sending.\n\n' +
      'Valid eligible recipients: ' + validRecipientCount + '\n' +
      'Remaining email quota today: ' + remainingQuota + '\n\n' +
      'Wait for the email quota to reset before trying again.'
    );
    return;
  }

  const confirmation = ui.alert(
    'Send Live Selection Emails',
    'This will send the real selection email to ' + validRecipientCount + ' eligible unsent mentees marked Can Pair. ' +
    (pendingRows.length - validRecipientCount) + ' invalid email row(s) will be marked ERROR. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (confirmation !== ui.Button.YES) {
    return;
  }

  const lock = LockService.getDocumentLock();

  if (!lock.tryLock(5000)) {
    ui.alert('Another selection-email send is already running. Wait for it to finish, then try again.');
    return;
  }

  const summary = {
    sent: 0,
    skipped: 0,
    errors: 0
  };

  try {
    pendingRows.forEach(function(row) {
      const result = sendYdpMenteeSelectionEmailForRow_(sheet, row);

      if (result.sent) {
        summary.sent++;
      } else if (result.error) {
        summary.errors++;
      } else {
        summary.skipped++;
      }
    });
  } finally {
    lock.releaseLock();
  }

  const message = [
    'YDP mentee selection email send complete.',
    '',
    'Emails sent: ' + summary.sent,
    'Skipped rows: ' + summary.skipped,
    'Errors: ' + summary.errors
  ].join('\n');

  logYdpMatchingRun_('SEND_ALL_ELIGIBLE_MENTEE_SELECTION_EMAILS', summary.errors ? 'PARTIAL_SUCCESS' : 'SUCCESS', message);
  ui.alert(message);
}

function getYdpMenteeScoresSheet_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(YDP_MATCHING_CONFIG.sheets.menteeScores);

  if (!sheet) {
    throw new Error('Mentee Scores sheet not found. Run "Setup matching workbook" first.');
  }

  return sheet;
}

function getSelectedYdpMenteeScoreRow_(sheet) {
  const activeSheet = SpreadsheetApp.getActive().getActiveSheet();
  const activeRange = activeSheet ? activeSheet.getActiveRange() : null;

  if (!activeSheet || activeSheet.getName() !== sheet.getName() || !activeRange) {
    throw new Error('Select a row inside the Mentee Scores sheet first.');
  }

  const row = activeRange.getRow();
  if (row <= 1) {
    throw new Error('Select a mentee data row, not the header row.');
  }

  return row;
}

function getYdpMenteeScoreDataForRow_(sheet, row) {
  const headerMap = getYdpMatchingHeaderMap_(sheet);
  const values = sheet.getRange(row, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];

  return {
    menteeId: getYdpRowValueByHeader_(values, headerMap, 'Mentee ID'),
    menteeName: getYdpRowValueByHeader_(values, headerMap, 'Mentee Name'),
    menteeEmail: getYdpRowValueByHeader_(values, headerMap, 'Mentee Email'),
    geminiReviewStatus: getYdpRowValueByHeader_(values, headerMap, 'Gemini Review Status'),
    selectionEmailStatus: getYdpRowValueByHeader_(values, headerMap, 'Selection Email Status')
  };
}

function sendYdpMenteeSelectionEmailForRow_(sheet, row) {
  const headerMap = getYdpMatchingHeaderMap_(sheet);
  const mentee = getYdpMenteeScoreDataForRow_(sheet, row);
  const plan = buildYdpMenteeSelectionEmailSendPlan_(mentee);
  const statusColumn = getYdpMatchingHeaderColumn_(headerMap, 'Selection Email Status');
  const sentAtColumn = getYdpMatchingHeaderColumn_(headerMap, 'Selection Email Sent At');
  const lastErrorColumn = getYdpMatchingHeaderColumn_(headerMap, 'Selection Email Last Error');

  if (!plan.send) {
    if (plan.skippedReason === 'Missing or invalid mentee email address.') {
      sheet.getRange(row, statusColumn).setValue(YDP_MATCHING_CONFIG.statuses.error);
      sheet.getRange(row, lastErrorColumn).setValue(plan.skippedReason);
      return { row: row, sent: false, skipped: false, error: plan.skippedReason };
    }

    return { row: row, sent: false, skipped: true, reason: plan.skippedReason };
  }

  let emailDispatched = false;

  try {
    sheet.getRange(row, statusColumn).setValue(YDP_MATCHING_CONFIG.statuses.sending);
    sheet.getRange(row, lastErrorColumn).setValue('');
    sendYdpMenteeSelectionEmail_(buildYdpMenteeSelectionEmail_(mentee));
    emailDispatched = true;
    sheet.getRange(row, sentAtColumn).setValue(new Date());
    sheet.getRange(row, statusColumn).setValue(YDP_MATCHING_CONFIG.statuses.sent);
    sheet.getRange(row, lastErrorColumn).setValue('');
    return { row: row, sent: true, skipped: false };
  } catch (error) {
    const errorMessage = String(error.message || error);

    if (emailDispatched) {
      sheet.getRange(row, lastErrorColumn).setValue(
        'The email was dispatched, but the final tracking update failed. Review this SENDING row before retrying. ' + errorMessage
      );
    } else {
      sheet.getRange(row, statusColumn).setValue(YDP_MATCHING_CONFIG.statuses.error);
      sheet.getRange(row, lastErrorColumn).setValue(errorMessage);
    }

    return { row: row, sent: false, skipped: false, error: errorMessage };
  }
}

function sendYdpMenteeSelectionEmail_(email) {
  MailApp.sendEmail({
    to: email.to,
    subject: email.subject,
    body: email.body,
    htmlBody: email.htmlBody,
    name: YDP_MATCHING_CONFIG.senderName
  });
}

function buildYdpMenteeSelectionEmailSingleSendMessage_(result) {
  if (result.error) {
    return 'Selection email failed for row ' + result.row + ':\n\n' + result.error;
  }

  if (result.skipped) {
    return 'Selection email skipped for row ' + result.row + ':\n\n' + result.reason;
  }

  return 'Selection email sent successfully for row ' + result.row + '.';
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
  const eligibleMentees = [];
  const overflowMentees = [];

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

    eligibleMentees.push(mentee);
  });

  function getCandidatesForMentee(mentee, useOverflowCapacity) {
    const menteePairs = pairsByMentee[mentee.id] || {};

    return Object.keys(menteePairs).map(function(mentorId) {
      const mentor = mentorMap[mentorId];
      const statedCapacity = Math.max(1, Number(mentor.statedCapacity) || 1);
      const flexibleCapacity = Math.max(
        statedCapacity,
        Number(mentor.flexibleCapacity) || statedCapacity + 2
      );
      const capacityLimit = useOverflowCapacity ? flexibleCapacity : statedCapacity;

      return {
        mentor: mentor,
        pair: menteePairs[mentorId],
        availableSlots: capacityLimit - (assignedCounts[mentorId] || 0)
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
  }

  function assignCandidate(mentee, selected, capacityStage) {
    assignedCounts[selected.mentor.id] = (assignedCounts[selected.mentor.id] || 0) + 1;
    matches.push({
      mentee: mentee,
      mentor: selected.mentor,
      pair: selected.pair,
      capacityStage: capacityStage
    });
  }

  eligibleMentees.forEach(function(mentee) {
    const candidates = getCandidatesForMentee(mentee, false);

    if (candidates.length === 0) {
      overflowMentees.push(mentee);
      return;
    }

    assignCandidate(mentee, candidates[0], 'STATED');
  });

  overflowMentees.forEach(function(mentee) {
    const candidates = getCandidatesForMentee(mentee, true);

    if (candidates.length === 0) {
      skipped.push({
        mentee: mentee,
        reason: 'No mentor has remaining flexible capacity.'
      });
      return;
    }

    assignCandidate(mentee, candidates[0], 'OVERFLOW');
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
  } else if (summary.serviceUnavailableHit) {
    lines.push('');
    lines.push('Gemini is temporarily busy, so this batch stopped after the first failed request instead of waiting on more rows. Run the button again later.');

    if (summary.serviceUnavailableMessage) {
      lines.push(summary.serviceUnavailableMessage);
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

function isYdpGeminiServiceUnavailableError_(error) {
  const message = String(error && error.message ? error.message : error || '').toLowerCase();
  return message.indexOf('http 503') !== -1 ||
    message.indexOf('503 unavailable') !== -1 ||
    message.indexOf('model is currently experiencing high demand') !== -1;
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

function ensureYdpAdditionalHeaders_(sheet, headers) {
  const existingHeaders = getYdpMatchingHeaderMap_(sheet);
  let nextColumn = Math.max(sheet.getLastColumn(), 0) + 1;

  headers.forEach(function(header) {
    if (existingHeaders[header]) {
      return;
    }

    sheet.getRange(1, nextColumn).setValue(header);
    existingHeaders[header] = nextColumn;
    nextColumn++;
  });
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
