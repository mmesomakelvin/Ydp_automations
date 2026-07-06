const YDP_MATCHING_CONFIG = {
  menuName: 'YDP Matching',
  defaultMenteeSpreadsheetId: '1XkXpLf6y7qhpJJvn9Afg4EvO9J_a482OBdeHZxuM0Nk',
  oldMenteeSpreadsheetIds: [
    '1XkXpLf6y7qhpJyn9Afg4EvO9J_a482OBdeHZxuM0Nk'
  ],
  defaultMentorSpreadsheetId: '1xKEca0gDJCkfkkI00QmhymfPfvn6o-fP-k8CF_LKaAU',
  defaultResponseTabName: 'Form_Responses',
  defaultGeminiModel: 'gemini-3.5-flash',
  defaultMenteeScoringBatchSize: 1,
  maxManualRunMilliseconds: 240000,
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
    geminiApiKey: 'GEMINI_API_KEY'
  }
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(YDP_MATCHING_CONFIG.menuName)
    .addItem('Setup matching workbook', 'setupYdpMatchingWorkbook')
    .addItem('Sync source snapshots from forms', 'syncYdpMatchingSourceSnapshots')
    .addSeparator()
    .addItem('Generate next mentee score', 'generateYdpMenteeScores')
    .addItem('Generate next pair score', 'generateYdpNextPairScore')
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

    for (let rowIndex = 0; rowIndex < sourceValues.slice(1).length; rowIndex++) {
      if (Date.now() - runStartedAt > YDP_MATCHING_CONFIG.maxManualRunMilliseconds) {
        break;
      }

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
      message += '\n\nGemini quota was reached, so scoring stopped safely. Wait and run this button again later. ' + quotaMessage;
    } else if (successCount >= YDP_MATCHING_CONFIG.defaultMenteeScoringBatchSize) {
      message += '\n\nOne mentee was scored. Run this button again when you want to score the next unscored mentee.';
    }

    logYdpMatchingRun_('GENERATE_MENTEE_SCORES', quotaHit || errorCount ? 'PARTIAL_SUCCESS' : 'SUCCESS', message);
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    logYdpMatchingRun_('GENERATE_MENTEE_SCORES', 'ERROR', error.message);
    SpreadsheetApp.getUi().alert('Mentee scoring failed:\n\n' + error.message);
  }
}

function generateYdpNextPairScore() {
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

    if (mentees.length === 0) {
      throw new Error('No eligible mentees found. Eligible mentees need Final Score >= 60 and Review Status = Pending Review.');
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

        if (existingPair && existingPair.status === 'Scored') {
          continue;
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
          const message = 'Generated pair score: ' + mentee.name + ' + ' + mentor.name + ' = ' + totalPairScore + '/100.';
          logYdpMatchingRun_('GENERATE_PAIR_SCORE', 'SUCCESS', message);
          SpreadsheetApp.getUi().alert(message);
          return;
        } catch (error) {
          if (isYdpGeminiQuotaError_(error)) {
            const quotaMessage = 'Gemini quota was reached, so pair scoring stopped safely. ' + error.message;
            logYdpMatchingRun_('GENERATE_PAIR_SCORE', 'PARTIAL_SUCCESS', quotaMessage);
            SpreadsheetApp.getUi().alert(quotaMessage);
            return;
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
          logYdpMatchingRun_('GENERATE_PAIR_SCORE', 'PARTIAL_SUCCESS', message);
          SpreadsheetApp.getUi().alert(message);
          return;
        }
      }
    }

    const completeMessage = 'All eligible mentee/mentor pairs already have pair scores.';
    logYdpMatchingRun_('GENERATE_PAIR_SCORE', 'SUCCESS', completeMessage);
    SpreadsheetApp.getUi().alert(completeMessage);
  } catch (error) {
    logYdpMatchingRun_('GENERATE_PAIR_SCORE', 'ERROR', error.message);
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
  const reviewStatusIndex = headers.indexOf('Review Status');
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
      mentee.reviewStatus === 'Pending Review';
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

function describeYdpPairScoreError_(error) {
  const message = String(error && error.message ? error.message : error || '').trim();

  if (!message) {
    return 'Unknown pair scoring error.';
  }

  if (message.indexOf('Missing Script Property') !== -1) {
    return 'Gemini API key is missing from Script Properties. Add GEMINI_API_KEY in the matching Apps Script settings.';
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
