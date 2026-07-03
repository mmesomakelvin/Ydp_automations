const YDP_MATCHING_CONFIG = {
  menuName: 'YDP Matching',
  defaultMenteeSpreadsheetId: '1XkXpLf6y7qhpJJvn9Afg4EvO9J_a482OBdeHZxuM0Nk',
  oldMenteeSpreadsheetIds: [
    '1XkXpLf6y7qhpJyn9Afg4EvO9J_a482OBdeHZxuM0Nk'
  ],
  defaultMentorSpreadsheetId: '1xKEca0gDJCkfkkI00QmhymfPfvn6o-fP-k8CF_LKaAU',
  defaultResponseTabName: 'Form_Responses',
  defaultGeminiModel: 'gemini-3.5-flash',
  defaultMenteeScoringBatchSize: 10,
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
    .addItem('Sync source snapshots from forms', 'syncYdpMatchingSourceSnapshots')
    .addSeparator()
    .addItem('Generate mentee scores', 'generateYdpMenteeScores')
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
  ensureYdpSheetWithHeaders_(spreadsheet, YDP_MATCHING_CONFIG.sheets.menteeScores, getYdpMenteeScoresHeaders_());
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

    for (let rowIndex = 0; rowIndex < sourceValues.slice(1).length; rowIndex++) {
      if (successCount >= YDP_MATCHING_CONFIG.defaultMenteeScoringBatchSize) {
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
          'Pending Review',
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

    let message = 'Generated mentee scores for ' + successCount + ' mentees. Skipped already-scored rows: ' + skippedCount + '. Errors: ' + errorCount + '.';

    if (quotaHit) {
      message += '\n\nGemini quota was reached, so scoring stopped safely. Wait and run this button again later. Last error: ' + quotaMessage;
    } else if (successCount >= YDP_MATCHING_CONFIG.defaultMenteeScoringBatchSize) {
      message += '\n\nBatch limit reached. Run this button again to score the next batch.';
    }

    logYdpMatchingRun_('GENERATE_MENTEE_SCORES', quotaHit || errorCount ? 'PARTIAL_SUCCESS' : 'SUCCESS', message);
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    logYdpMatchingRun_('GENERATE_MENTEE_SCORES', 'ERROR', error.message);
    SpreadsheetApp.getUi().alert('Mentee scoring failed:\n\n' + error.message);
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
  const prompt = [
    'You are scoring a mentee application for the YDP Mentorship Program.',
    'Use only the information provided. Do not invent facts.',
    '',
    'Scoring criteria:',
    '1. Learning Commitment & Prior Effort: 0-5. Strong evidence includes courses, projects, certifications, practice, or real-world application.',
    '2. Community Engagement & Participation: 0-5. Strong evidence includes YDP membership, discussions, volunteering, events, or collaborations.',
    '3. Career Goals & Program Alignment: 0-5. Strong evidence includes clear career path, focused goals, and realistic mentorship expectations.',
    '4. Soft Skills & Mindset: 0-5. Strong evidence includes proactiveness, commitment, teamwork, ownership, and openness to feedback.',
    '',
    'Return JSON only. No markdown. No extra text.',
    'Expected JSON shape:',
    '{"learningScore":0,"communityScore":0,"careerScore":0,"softSkillsScore":0,"summary":"","concerns":""}',
    '',
    'Mentee application:',
    JSON.stringify(mentee)
  ].join('\n');

  return callYdpGeminiJson_(prompt);
}

function callYdpGeminiJson_(prompt) {
  const responseText = callYdpGemini_(prompt);
  const jsonText = extractYdpJsonObject_(responseText);

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    throw new Error('Gemini returned invalid JSON: ' + responseText);
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
  const reviewStatusIndex = headers.indexOf('Review Status');

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
    reviewStatus: String(rowValues[headers.indexOf('Review Status')] || '').trim()
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

function isYdpGeminiQuotaError_(error) {
  const message = String(error && error.message ? error.message : error || '').toLowerCase();
  return message.indexOf('resource_exhausted') !== -1 ||
    message.indexOf('quota') !== -1 ||
    message.indexOf('http 429') !== -1;
}

function shortenYdpErrorMessage_(message) {
  const text = String(message || '').replace(/\s+/g, ' ').trim();

  if (text.length <= 300) {
    return text;
  }

  return text.slice(0, 297) + '...';
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
    const message = error.message ? String(error.message) : String(bodyText || '');
    const retryInfo = getYdpGeminiRetryInfo_(error.details || []);
    const retrySuffix = retryInfo ? ' Retry after: ' + retryInfo + '.' : '';

    return 'Gemini API HTTP ' + statusCode + ' ' + status + ': ' + message + retrySuffix;
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
    'Review Status',
    'Reviewer Notes',
    'Gemini Summary',
    'Gemini Concerns',
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
