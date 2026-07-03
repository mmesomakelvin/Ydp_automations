const YDP_MATCHING_CONFIG = {
  menuName: 'YDP Matching',
  defaultMenteeSpreadsheetId: '1XkXpLf6y7qhpJJvn9Afg4EvO9J_a482OBdeHZxuM0Nk',
  defaultMentorSpreadsheetId: '1xKEca0gDJCkfkkI00QmhymfPfvn6o-fP-k8CF_LKaAU',
  defaultResponseTabName: 'Form_Responses',
  defaultGeminiModel: 'gemini-3.5-flash',
  sheets: {
    sourceConfig: 'Source Config',
    menteeSnapshot: 'Mentee Source Snapshot',
    mentorSnapshot: 'Mentor Source Snapshot',
    menteeScores: 'Mentee Scores',
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
    geminiApiKey: 'GEMINI_API_KEY'
  }
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(YDP_MATCHING_CONFIG.menuName)
    .addItem('Setup matching workbook', 'setupYdpMatchingWorkbook')
    .addItem('Sync source snapshots', 'syncYdpMatchingSourceSnapshots')
    .addSeparator()
    .addItem('Test Gemini connection', 'testYdpGeminiConnection')
    .addToUi();
}

function setupYdpMatchingWorkbook() {
  const spreadsheet = SpreadsheetApp.getActive();

  setupYdpSourceConfigSheet_(spreadsheet);
  ensureYdpSheetWithHeaders_(spreadsheet, YDP_MATCHING_CONFIG.sheets.menteeSnapshot, []);
  ensureYdpSheetWithHeaders_(spreadsheet, YDP_MATCHING_CONFIG.sheets.mentorSnapshot, []);
  ensureYdpSheetWithHeaders_(spreadsheet, YDP_MATCHING_CONFIG.sheets.menteeScores, getYdpMenteeScoresHeaders_());
  ensureYdpSheetWithHeaders_(spreadsheet, YDP_MATCHING_CONFIG.sheets.matchRecommendations, getYdpMatchRecommendationHeaders_());
  ensureYdpSheetWithHeaders_(spreadsheet, YDP_MATCHING_CONFIG.sheets.matchedPairs, getYdpMatchedPairsHeaders_());
  ensureYdpSheetWithHeaders_(spreadsheet, YDP_MATCHING_CONFIG.sheets.runLog, getYdpRunLogHeaders_());

  logYdpMatchingRun_('SETUP', 'SUCCESS', 'Matching workbook tabs are ready.');
  SpreadsheetApp.getUi().alert('YDP matching workbook setup is complete.');
}

function syncYdpMatchingSourceSnapshots() {
  setupYdpMatchingWorkbook();

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
      existing[YDP_MATCHING_CONFIG.configKeys.menteeSpreadsheetId] || YDP_MATCHING_CONFIG.defaultMenteeSpreadsheetId,
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
      'Response tab name used in both source spreadsheets.'
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
  const sourceSheet = sourceSpreadsheet.getSheetByName(sourceTabName);

  if (!sourceSheet) {
    throw new Error('Source tab not found: ' + sourceTabName + ' in ' + sourceSpreadsheetId);
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

function callYdpGemini_(prompt) {
  const apiKey = PropertiesService.getScriptProperties().getProperty(
    YDP_MATCHING_CONFIG.scriptProperties.geminiApiKey
  );

  if (!apiKey) {
    throw new Error('Missing Script Property: ' + YDP_MATCHING_CONFIG.scriptProperties.geminiApiKey);
  }

  const config = getYdpMatchingRuntimeConfig_();
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(config.geminiModel) +
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
    throw new Error('Gemini API returned HTTP ' + statusCode + ': ' + bodyText);
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

function getOrCreateYdpSheet_(spreadsheet, sheetName) {
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function getYdpMenteeScoresHeaders_() {
  return [
    'Mentee ID',
    'Mentee Name',
    'Mentee Email',
    'Learning Commitment Score',
    'Community Engagement Score',
    'Career Goals Score',
    'Soft Skills Score',
    'Final Score',
    'Selection Status',
    'Reviewer Notes',
    'Gemini Summary'
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
  ];
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
