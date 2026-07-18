const YDP_MENTOR_CONFIG = {
  sheetName: 'Form_Responses',
  senderName: 'YDP Mentorship Team',
  startDateText: 'Saturday, July 18, 2026',
  menuName: 'YDP Automation',
  idPrefix: 'YDP-C2-Mentor-',
  duplicateColor: '#d9ead3',
  headers: {
    email: 'Email Address',
    firstName: 'First Name',
    lastName: 'Last Name',
    personId: 'Mentor ID',
    duplicateStatus: 'Duplicate Status',
    originalRow: 'Original Row',
    idAssignedAt: 'ID Assigned At',
    registrationStatus: 'Mentor Registration Email Status',
    registrationSentAt: 'Mentor Registration Email Sent At',
    alreadyRegisteredStatus: 'Already Registered Email Status',
    alreadyRegisteredSentAt: 'Already Registered Email Sent At',
    onboardingReminderStatus: 'Onboarding Details Email Status',
    onboardingReminderSentAt: 'Onboarding Details Email Sent At',
    lastError: 'Email Last Error'
  },
  statuses: {
    sent: 'SENT',
    error: 'ERROR',
    skippedDuplicate: 'SKIPPED_DUPLICATE'
  }
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(YDP_MENTOR_CONFIG.menuName)
    .addItem('Setup email tracking columns', 'setupYdpMentorEmailTrackingColumns')
    .addItem('Install form submit trigger', 'installYdpMentorFormSubmitTrigger')
    .addItem('Assign IDs and mark duplicates', 'assignYdpMentorIdsAndMarkDuplicates')
    .addItem('Create data dictionary', 'createYdpMentorDataDictionary')
    .addSeparator()
    .addItem('Send test mentor email', 'sendTestYdpMentorEmail')
    .addItem('Preview selected row email', 'previewSelectedYdpMentorEmail')
    .addSeparator()
    .addItem('Send mentor email to selected row', 'sendYdpMentorRegistrationEmailToSelectedRow')
    .addItem('Send mentor email to all unsent rows', 'sendYdpMentorRegistrationEmailsToAllUnsentRows')
    .addItem('Send already registered mentor update to all unsent rows', 'sendYdpAlreadyRegisteredMentorEmailsToAllUnsentRows')
    .addItem("Send today's onboarding details to all unsent rows", 'sendYdpMentorOnboardingRemindersToAllUnsentRows')
    .addItem('Repair missing sent date for selected row', 'repairSelectedYdpMentorSentDates')
    .addItem('Resend email to selected row', 'resendYdpMentorEmailToSelectedRow')
    .addToUi();
}

function onFormSubmit(e) {
  handleYdpMentorFormSubmit(e);
}

function handleYdpMentorFormSubmit(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    setupYdpMentorEmailTrackingColumns();
    setupYdpMentorIdTrackingColumns();
    const sheet = getYdpMentorSheet_();
    const row = e && e.range ? e.range.getRow() : sheet.getLastRow();

    if (row <= 1) {
      return;
    }

    assignYdpMentorIdsAndMarkDuplicates({ silent: true });
    sendYdpMentorEmailForRow_(sheet, row, 'REGISTRATION', { force: false });
  } finally {
    lock.releaseLock();
  }
}

function installYdpMentorFormSubmitTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const alreadyInstalled = triggers.some(function(trigger) {
    return trigger.getHandlerFunction() === 'handleYdpMentorFormSubmit' &&
      trigger.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT;
  });

  if (!alreadyInstalled) {
    ScriptApp.newTrigger('handleYdpMentorFormSubmit')
      .forSpreadsheet(SpreadsheetApp.getActive())
      .onFormSubmit()
      .create();
  }

  SpreadsheetApp.getUi().alert('YDP mentor form-submit trigger is installed.');
}

function setupYdpMentorEmailTrackingColumns() {
  const sheet = getYdpMentorSheet_();
  const trackingHeaders = [
    YDP_MENTOR_CONFIG.headers.registrationStatus,
    YDP_MENTOR_CONFIG.headers.registrationSentAt,
    YDP_MENTOR_CONFIG.headers.alreadyRegisteredStatus,
    YDP_MENTOR_CONFIG.headers.alreadyRegisteredSentAt,
    YDP_MENTOR_CONFIG.headers.onboardingReminderStatus,
    YDP_MENTOR_CONFIG.headers.onboardingReminderSentAt,
    YDP_MENTOR_CONFIG.headers.lastError
  ];

  const headerMap = getYdpHeaderMap_(sheet);
  trackingHeaders.forEach(function(header) {
    ensureYdpHeader_(sheet, headerMap, header);
  });

  SpreadsheetApp.getActive().toast('YDP email tracking columns are ready.');
}

function setupYdpMentorIdTrackingColumns() {
  const sheet = getYdpMentorSheet_();
  const idHeaders = [
    YDP_MENTOR_CONFIG.headers.personId,
    YDP_MENTOR_CONFIG.headers.duplicateStatus,
    YDP_MENTOR_CONFIG.headers.originalRow,
    YDP_MENTOR_CONFIG.headers.idAssignedAt
  ];

  const headerMap = getYdpHeaderMap_(sheet);
  idHeaders.forEach(function(header) {
    ensureYdpHeader_(sheet, headerMap, header);
  });
}

function assignYdpMentorIdsAndMarkDuplicates(options) {
  const settings = options || {};
  setupYdpMentorIdTrackingColumns();

  const sheet = getYdpMentorSheet_();
  const summary = assignYdpMentorIdsAndMarkDuplicates_(sheet);

  if (!settings.silent) {
    SpreadsheetApp.getUi().alert(
      'YDP mentor ID assignment complete.\n\n' +
      'New IDs assigned: ' + summary.newIds + '\n' +
      'Original rows: ' + summary.originals + '\n' +
      'Duplicate rows marked green: ' + summary.duplicates + '\n' +
      'Rows skipped because email was missing: ' + summary.skipped
    );
  }

  return summary;
}

function createYdpMentorDataDictionary() {
  const dictionarySheet = getOrCreateYdpMentorDictionarySheet_();
  const buttonGuideSheet = getOrCreateYdpMentorButtonGuideSheet_();
  const sourceHeaders = getYdpMentorSourceHeadersForDictionary_();

  writeYdpMentorDataDictionary_(dictionarySheet, getYdpMentorDataDictionaryRows_(sourceHeaders));
  writeYdpMentorButtonGuide_(buttonGuideSheet, getYdpMentorButtonGuideRows_());
  SpreadsheetApp.getUi().alert(
    'Mentor documentation was refreshed in the "Data Dictionary" and "Button Guide" tabs. Participant data was not changed.'
  );
}

function getYdpMentorDataDictionaryRows_(sourceHeaders) {
  const responsePurpose = 'Stores live mentor applications, matching preferences, and email tracking fields.';
  const rows = [
    ['Sheet Name', 'Sheet Purpose', 'Column Name', 'Column Meaning', 'Automation Use', 'Can Team Edit?', 'Notes'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, 'Timestamp', 'Date and time the mentor submitted the form.', 'Used as the original application audit time.', 'No - use the form', 'Reference field from Google Forms.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, 'Email Address', 'Mentor email address and unique identity key.', 'Used for IDs, duplicate checks, matching, and email delivery.', 'Only to correct a confirmed typo', 'Changing this can affect identity and duplicate detection.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, 'First Name', 'Mentor first name.', 'Personalizes mentor emails.', 'Only to correct a confirmed typo', 'The email greeting uses this value.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, 'Last Name', 'Mentor surname.', 'Used in records and matching.', 'Only to correct a confirmed typo', 'Keep the mentor spelling.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, 'Phone Number', 'Mentor phone number.', 'Available for contact and duplicate review.', 'Only to correct a confirmed typo', 'Email remains the primary unique key.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, 'Location (city, country)', 'Where the mentor is based.', 'Supports timezone and location-aware matching.', 'Only to correct a confirmed typo', 'Use city and country where possible.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, 'LinkedIn Profile URL', 'Link to the mentor LinkedIn profile.', 'Supports mentor review.', 'Only to correct a confirmed typo', 'May be blank or invalid if entered incorrectly.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, 'Preferred Communication Method', 'How the mentor prefers to communicate.', 'Used as matching and engagement context.', 'No - use the form', 'A preference, not a guaranteed channel.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, 'Years of Experience in Data', 'Mentor experience range.', 'Contributes to career and seniority fit.', 'No - use the form', 'Used by matching.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, 'Current Role', 'Current job title or professional role.', 'Contributes to career-path matching.', 'No - use the form', 'Used by matching.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, 'Areas of Expertise', 'Skills and data areas the mentor can support.', 'Contributes strongly to skill fit.', 'No - use the form', 'Used heavily by pair scoring.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, 'How many mentees are you willing to take on', 'Number of mentees requested by the mentor.', 'Sets stated matching capacity.', 'No - use the form', 'Auto-match fills stated capacity first, then permits at most 2 overflow mentees.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, 'Availability', 'Hours the mentor can commit.', 'Contributes to practical availability fit.', 'No - use the form', 'Used by matching.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, 'Preferred Days and Times for Session', 'Days and times the mentor prefers to meet.', 'Contributes to scheduling compatibility.', 'No - use the form', 'Used when available in source data.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, YDP_MENTOR_CONFIG.headers.personId, 'Stable ID assigned to the first application for each unique email.', 'Links the mentor across matching and program tracking.', 'No - automation managed', 'Duplicate submissions receive the original ID.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, YDP_MENTOR_CONFIG.headers.duplicateStatus, 'Shows ORIGINAL or DUPLICATE.', 'Prevents the same mentor from being counted twice.', 'No - automation managed', 'Duplicate rows are also colored green.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, YDP_MENTOR_CONFIG.headers.originalRow, 'Row number of the first application for this email.', 'Connects duplicate submissions to the original row.', 'No - automation managed', 'Original rows point to themselves.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, YDP_MENTOR_CONFIG.headers.idAssignedAt, 'Date and time the mentor ID was assigned.', 'Provides an ID-assignment audit trail.', 'No - automation managed', 'Do not clear this value.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, YDP_MENTOR_CONFIG.headers.registrationStatus, 'Status of the first registration email.', 'SENT prevents duplicates; ERROR marks a failure.', 'No - automation managed', 'Use the resend command for an intentional duplicate send.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, YDP_MENTOR_CONFIG.headers.registrationSentAt, 'Date and time the first registration email was sent.', 'Provides the registration-email audit time.', 'No - automation managed', 'Repair only with the dedicated command.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, YDP_MENTOR_CONFIG.headers.alreadyRegisteredStatus, 'Status of the older-applicant update email.', 'Prevents duplicate already-registered updates.', 'No - automation managed', 'Independent from the normal registration campaign.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, YDP_MENTOR_CONFIG.headers.alreadyRegisteredSentAt, 'Date and time the older-applicant update was sent.', 'Provides the update-email audit time.', 'No - automation managed', 'Do not clear after sending.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, YDP_MENTOR_CONFIG.headers.onboardingReminderStatus, "Status of today's July 18 onboarding-details email.", 'Prevents duplicate sends for this campaign.', 'No - automation managed', 'Independent from the earlier reminder history.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, YDP_MENTOR_CONFIG.headers.onboardingReminderSentAt, "Date and time today's onboarding-details email was sent.", 'Provides the campaign audit time.', 'No - automation managed', 'Do not clear after sending.'],
    [YDP_MENTOR_CONFIG.sheetName, responsePurpose, YDP_MENTOR_CONFIG.headers.lastError, 'Most recent email error for this row.', 'Explains why a send failed.', 'No - automation managed', 'Check this when an email status is ERROR.']
  ];

  addYdpMentorUndocumentedSourceHeaders_(rows, sourceHeaders || [], responsePurpose);
  addYdpMentorDocumentationDictionaryRows_(rows);
  return rows;
}

function addYdpMentorUndocumentedSourceHeaders_(rows, sourceHeaders, responsePurpose) {
  const documented = {};
  rows.slice(1).forEach(function(row) {
    if (row[0] === YDP_MENTOR_CONFIG.sheetName) {
      documented[String(row[2]).trim().toLowerCase()] = true;
    }
  });

  sourceHeaders.forEach(function(header) {
    const columnName = String(header || '').trim();
    const key = columnName.toLowerCase();
    if (!columnName || documented[key]) {
      return;
    }

    rows.push([
      YDP_MENTOR_CONFIG.sheetName,
      responsePurpose,
      columnName,
      'The mentor response to this application question.',
      'Available for mentor review, pair scoring, or matching when relevant.',
      'No - use the form',
      'Automatically included from the live sheet header.'
    ]);
    documented[key] = true;
  });
}

function addYdpMentorDocumentationDictionaryRows_(rows) {
  const dictionaryPurpose = 'Explains each workbook sheet and column in plain English.';
  const guidePurpose = 'Explains every YDP Automation menu command and its safety level.';
  const documentation = {
    'Data Dictionary': [
      ['Sheet Name', 'Worksheet tab being documented.'], ['Sheet Purpose', 'Reason the worksheet exists.'],
      ['Column Name', 'Exact header used in the worksheet.'], ['Column Meaning', 'Plain-English definition of the value.'],
      ['Automation Use', 'How the scripts use the value.'], ['Can Team Edit?', 'Whether manual editing is safe.'],
      ['Notes', 'Warnings and extra operating guidance.']
    ],
    'Button Guide': [
      ['Safety Level', 'SAFE, CAUTION, or LIVE ACTION classification.'], ['Menu Name', 'Google Sheets menu containing the command.'],
      ['Button Name', 'Exact menu command label.'], ['What It Does', 'Result of running the command.'],
      ['When To Run', 'Correct situation for using the command.'], ['Before Running', 'Checks required before using the command.'],
      ['What It Changes', 'Workbook data or communications affected.'], ['Recommended Frequency', 'How often the command normally runs.']
    ]
  };

  Object.keys(documentation).forEach(function(sheetName) {
    const purpose = sheetName === 'Data Dictionary' ? dictionaryPurpose : guidePurpose;
    documentation[sheetName].forEach(function(column) {
      rows.push([sheetName, purpose, column[0], column[1], 'Documentation only.', 'No - regenerate from menu', 'Refreshed by Create data dictionary.']);
    });
  });
}

function getYdpMentorButtonGuideRows_() {
  const menu = YDP_MENTOR_CONFIG.menuName;
  return [
    ['Safety Level', 'Menu Name', 'Button Name', 'What It Does', 'When To Run', 'Before Running', 'What It Changes', 'Recommended Frequency'],
    ['SAFE', menu, 'Setup email tracking columns', 'Creates missing mentor email-status and sent-date columns.', 'During initial setup or after a tracking column was removed.', 'Confirm you are in the mentor response workbook.', 'Adds missing headers only; it does not send email.', 'Once, then as needed'],
    ['SAFE', menu, 'Install form submit trigger', 'Turns on automatic handling for future mentor form submissions.', 'After the script is first deployed or the trigger was removed.', 'Confirm the correct mentor response workbook is open.', 'Creates one Apps Script form-submit trigger.', 'Once'],
    ['CAUTION', menu, 'Assign IDs and mark duplicates', 'Assigns stable mentor IDs and marks repeated email submissions.', 'After importing applications or when checking duplicates.', 'Confirm Email Address values are correct.', 'Writes ID, duplicate status, original row, timestamp, and duplicate row color.', 'After imports or as needed'],
    ['SAFE', menu, 'Create data dictionary', 'Refreshes the Data Dictionary and Button Guide tabs.', 'When documentation is missing or the automation changes.', 'No preparation is required.', 'Rebuilds documentation tabs only.', 'After each automation update'],
    ['SAFE', menu, 'Send test mentor email', 'Sends a chosen mentor template to a test address.', 'Before any live mentor email campaign.', 'Use an internal test address and choose the correct email type.', 'Sends one test email; mentor tracking is not updated.', 'Before every campaign'],
    ['SAFE', menu, 'Preview selected row email', 'Displays all templates personalized for the selected mentor.', 'Before a test or live send.', 'Select a real mentor row, not the header.', 'Opens a preview only; no email or status changes.', 'Before every campaign'],
    ['LIVE ACTION', menu, 'Send mentor email to selected row', 'Sends the registration email to one selected mentor if not already sent.', 'For a controlled first send or a single applicant.', 'Preview and test; select the intended mentor row.', 'Sends one live email and updates registration tracking.', 'As needed'],
    ['LIVE ACTION', menu, 'Send mentor email to all unsent rows', 'Sends registration emails to all mentor rows not already marked SENT.', 'For an approved registration campaign.', 'Preview, test, verify recipients, and obtain approval.', 'Sends multiple live emails and updates registration tracking.', 'Once per campaign'],
    ['LIVE ACTION', menu, 'Send already registered mentor update to all unsent rows', 'Sends the older-applicant update to unsent mentor rows.', 'For mentors who registered before automation started.', 'Preview, test, verify recipients, and obtain approval.', 'Sends multiple live emails and updates already-registered tracking.', 'Once per update campaign'],
    ['LIVE ACTION', menu, "Send today's onboarding details to all unsent rows", "Sends today's onboarding date, time, Meet link, and Notion link to unsent mentors.", 'Only for the approved July 18 mentor onboarding campaign.', 'Preview, send a test using ONBOARDING, verify links, and obtain approval.', 'Sends multiple live emails and updates Onboarding Details tracking.', 'Once for this campaign'],
    ['CAUTION', menu, 'Repair missing sent date for selected row', 'Adds a sent timestamp when a SENT status exists without a date.', 'Only when auditing a confirmed tracking inconsistency.', 'Select the row and confirm the email really was sent.', 'Writes the current date into a missing sent-at field; sends no email.', 'Only when repairing data'],
    ['LIVE ACTION', menu, 'Resend email to selected row', 'Forces one selected mentor email template to be sent again.', 'Only when a mentor needs an intentional resend.', 'Select the row, preview the template, and confirm a duplicate send is intended.', 'Sends one live duplicate email and refreshes tracking fields.', 'Exceptional use only']
  ];
}

function getYdpMentorButtonGuideColor_(safetyLevel) {
  return { SAFE: '#d9ead3', CAUTION: '#fff2cc', 'LIVE ACTION': '#f4cccc' }[safetyLevel] || '#ffffff';
}

function getYdpMentorSourceHeadersForDictionary_() {
  const sourceSheet = getYdpMentorSheet_();
  if (sourceSheet.getLastColumn() < 1) {
    return [];
  }
  return sourceSheet.getRange(1, 1, 1, sourceSheet.getLastColumn()).getValues()[0];
}

function getOrCreateYdpMentorDictionarySheet_() {
  return SpreadsheetApp.getActive().getSheetByName('Data Dictionary') || SpreadsheetApp.getActive().insertSheet('Data Dictionary');
}

function getOrCreateYdpMentorButtonGuideSheet_() {
  return SpreadsheetApp.getActive().getSheetByName('Button Guide') || SpreadsheetApp.getActive().insertSheet('Button Guide');
}

function writeYdpMentorDataDictionary_(sheet, rows) {
  resetYdpMentorDocumentationSheet_(sheet);
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows).setWrap(true).setVerticalAlignment('top');
  formatYdpMentorDocumentationHeader_(sheet, rows[0].length);
  applyYdpMentorDictionaryShading_(sheet, rows);
  applyYdpMentorDocumentationFilter_(sheet, rows);
  [170, 270, 230, 380, 340, 180, 360].forEach(function(width, index) { sheet.setColumnWidth(index + 1, width); });
}

function applyYdpMentorDictionaryShading_(sheet, rows) {
  if (rows.length <= 1) {
    return;
  }
  const backgrounds = rows.slice(1).map(function(row, index) {
    return new Array(rows[0].length).fill(index % 2 === 0 ? '#ffffff' : '#f3f6f4');
  });
  sheet.getRange(2, 1, backgrounds.length, rows[0].length).setBackgrounds(backgrounds);
}

function writeYdpMentorButtonGuide_(sheet, rows) {
  resetYdpMentorDocumentationSheet_(sheet);
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows).setWrap(true).setVerticalAlignment('top');
  formatYdpMentorDocumentationHeader_(sheet, rows[0].length);
  if (rows.length > 1) {
    const backgrounds = rows.slice(1).map(function(row) {
      return new Array(rows[0].length).fill(getYdpMentorButtonGuideColor_(row[0]));
    });
    sheet.getRange(2, 1, backgrounds.length, rows[0].length).setBackgrounds(backgrounds);
  }
  applyYdpMentorDocumentationFilter_(sheet, rows);
  [120, 160, 310, 390, 350, 350, 370, 190].forEach(function(width, index) { sheet.setColumnWidth(index + 1, width); });
}

function resetYdpMentorDocumentationSheet_(sheet) {
  const filter = sheet.getFilter();
  if (filter) {
    filter.remove();
  }
  sheet.clearContents();
  sheet.clearFormats();
  sheet.setFrozenRows(1);
}

function formatYdpMentorDocumentationHeader_(sheet, columnCount) {
  sheet.getRange(1, 1, 1, columnCount).setFontWeight('bold').setFontColor('#ffffff').setBackground('#274e13');
}

function applyYdpMentorDocumentationFilter_(sheet, rows) {
  if (rows.length > 1) {
    sheet.getRange(1, 1, rows.length, rows[0].length).createFilter();
  }
}

function sendTestYdpMentorEmail() {
  const ui = SpreadsheetApp.getUi();
  const emailResponse = ui.prompt('Send test mentor email', 'Enter the test recipient email address:', ui.ButtonSet.OK_CANCEL);

  if (emailResponse.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const recipient = emailResponse.getResponseText().trim();
  if (!isValidYdpEmail_(recipient)) {
    ui.alert('Please enter a valid email address.');
    return;
  }

  const type = promptForYdpEmailType_('Which test email should be sent? Type REGISTRATION, ALREADY, or ONBOARDING.');
  if (!type) {
    return;
  }

  const email = buildYdpMentorEmail_({ firstName: 'Test' }, type);
  sendYdpMentorEmail_(recipient, email);
  ui.alert('Test email sent to ' + recipient + '.');
}

function previewSelectedYdpMentorEmail() {
  const sheet = getYdpMentorSheet_();
  const row = getSelectedYdpDataRow_(sheet);
  const rowData = getYdpRowData_(sheet, row);
  const registrationEmail = buildYdpMentorEmail_(rowData, 'REGISTRATION');
  const alreadyRegisteredEmail = buildYdpMentorEmail_(rowData, 'ALREADY');
  const onboardingReminderEmail = buildYdpMentorEmail_(rowData, 'ONBOARDING');
  const html = [
    '<div style="font-family:Arial,sans-serif;line-height:1.5;padding:8px;">',
    '<h2>Registration Email</h2>',
    '<p><strong>Subject:</strong> ' + escapeYdpHtml_(registrationEmail.subject) + '</p>',
    '<pre style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:6px;">' + escapeYdpHtml_(registrationEmail.body) + '</pre>',
    '<h2>Already Registered Update</h2>',
    '<p><strong>Subject:</strong> ' + escapeYdpHtml_(alreadyRegisteredEmail.subject) + '</p>',
    '<pre style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:6px;">' + escapeYdpHtml_(alreadyRegisteredEmail.body) + '</pre>',
    "<h2>Today's Onboarding Details</h2>",
    '<p><strong>Subject:</strong> ' + escapeYdpHtml_(onboardingReminderEmail.subject) + '</p>',
    '<pre style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:6px;">' + escapeYdpHtml_(onboardingReminderEmail.body) + '</pre>',
    '</div>'
  ].join('');

  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(720).setHeight(760),
    'YDP Mentor Email Preview'
  );
}

function sendYdpMentorRegistrationEmailToSelectedRow() {
  const sheet = getYdpMentorSheet_();
  const row = getSelectedYdpDataRow_(sheet);
  const result = sendYdpMentorEmailForRow_(sheet, row, 'REGISTRATION', { force: false });
  showYdpSingleSendResult_(result);
}

function sendYdpMentorRegistrationEmailsToAllUnsentRows() {
  sendYdpMentorBulkEmails_('REGISTRATION');
}

function sendYdpAlreadyRegisteredMentorEmailsToAllUnsentRows() {
  sendYdpMentorBulkEmails_('ALREADY');
}

function sendYdpMentorOnboardingRemindersToAllUnsentRows() {
  sendYdpMentorBulkEmails_('ONBOARDING');
}

function repairSelectedYdpMentorSentDates() {
  const sheet = getYdpMentorSheet_();
  const row = getSelectedYdpDataRow_(sheet);
  const repaired = repairYdpMentorSentDatesForRow_(sheet, row);

  SpreadsheetApp.getUi().alert(
    repaired > 0
      ? 'Repaired ' + repaired + ' missing sent date(s) for row ' + row + '.'
      : 'No missing sent dates found for row ' + row + '.'
  );
}

function resendYdpMentorEmailToSelectedRow() {
  const type = promptForYdpEmailType_('Which email should be resent? Type REGISTRATION, ALREADY, or ONBOARDING.');
  if (!type) {
    return;
  }

  const sheet = getYdpMentorSheet_();
  const row = getSelectedYdpDataRow_(sheet);
  const result = sendYdpMentorEmailForRow_(sheet, row, type, { force: true });
  showYdpSingleSendResult_(result);
}

function sendYdpMentorBulkEmails_(type) {
  setupYdpMentorEmailTrackingColumns();

  const sheet = getYdpMentorSheet_();
  const lastRow = sheet.getLastRow();
  const summary = {
    sent: 0,
    skipped: 0,
    errors: 0
  };

  if (lastRow <= 1) {
    SpreadsheetApp.getUi().alert('No mentor rows found.');
    return;
  }

  for (let row = 2; row <= lastRow; row += 1) {
    const result = sendYdpMentorEmailForRow_(sheet, row, type, { force: false });

    if (result.sent) {
      summary.sent += 1;
    } else if (result.error) {
      summary.errors += 1;
    } else {
      summary.skipped += 1;
    }
  }

  SpreadsheetApp.getUi().alert(
    'YDP mentor email send complete.\n\n' +
    'Sent: ' + summary.sent + '\n' +
    'Skipped: ' + summary.skipped + '\n' +
    'Errors: ' + summary.errors
  );
}

function sendYdpMentorEmailForRow_(sheet, row, type, options) {
  const settings = options || {};
  const headerMap = getYdpHeaderMap_(sheet);
  const statusHeader = getYdpStatusHeaderForType_(type);
  const sentAtHeader = getYdpSentAtHeaderForType_(type);
  const statusColumn = getYdpHeaderColumn_(headerMap, statusHeader);
  const sentAtColumn = getYdpHeaderColumn_(headerMap, sentAtHeader);
  const registrationStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.registrationStatus);
  const alreadyRegisteredStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.alreadyRegisteredStatus);
  const onboardingReminderStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.onboardingReminderStatus);
  const lastErrorColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.lastError);
  const rowData = getYdpRowData_(sheet, row);
  const recipient = String(rowData[YDP_MENTOR_CONFIG.headers.email] || '').trim();
  const registrationStatus = String(sheet.getRange(row, registrationStatusColumn).getValue() || '').trim();
  const alreadyRegisteredStatus = String(sheet.getRange(row, alreadyRegisteredStatusColumn).getValue() || '').trim();
  const onboardingReminderStatus = String(sheet.getRange(row, onboardingReminderStatusColumn).getValue() || '').trim();

  if (!isValidYdpEmail_(recipient)) {
    sheet.getRange(row, statusColumn).setValue(YDP_MENTOR_CONFIG.statuses.error);
    sheet.getRange(row, lastErrorColumn).setValue('Missing or invalid email address.');
    return { row: row, sent: false, skipped: false, error: 'Missing or invalid email address.' };
  }

  const currentCampaignWasSent = type === 'ONBOARDING'
    ? onboardingReminderStatus === YDP_MENTOR_CONFIG.statuses.sent
    : registrationStatus === YDP_MENTOR_CONFIG.statuses.sent ||
      alreadyRegisteredStatus === YDP_MENTOR_CONFIG.statuses.sent;

  if (!settings.force && currentCampaignWasSent) {
    const repaired = repairYdpMentorSentDatesForRow_(sheet, row);
    return {
      row: row,
      sent: false,
      skipped: true,
      reason: repaired > 0
        ? 'This mentor campaign email has already been sent for this row. Repaired ' + repaired + ' missing sent date(s).'
        : 'This mentor campaign email has already been sent for this row.'
    };
  }

  if (!settings.force && hasYdpMentorEmailAlreadyBeenSent_(sheet, recipient, row, type)) {
    sheet.getRange(row, statusColumn).setValue(YDP_MENTOR_CONFIG.statuses.skippedDuplicate);
    sheet.getRange(row, lastErrorColumn).setValue('');
    return { row: row, sent: false, skipped: true, reason: 'Duplicate email address already received a mentor email.' };
  }

  try {
    const email = buildYdpMentorEmail_(rowData, type);
    sendYdpMentorEmail_(recipient, email);
    sheet.getRange(row, statusColumn).setValue(YDP_MENTOR_CONFIG.statuses.sent);
    sheet.getRange(row, sentAtColumn).setValue(new Date());
    sheet.getRange(row, lastErrorColumn).setValue('');

    return { row: row, sent: true, skipped: false };
  } catch (error) {
    sheet.getRange(row, statusColumn).setValue(YDP_MENTOR_CONFIG.statuses.error);
    sheet.getRange(row, lastErrorColumn).setValue(error.message);
    return { row: row, sent: false, skipped: false, error: error.message };
  }
}

function buildYdpMentorEmail_(rowData, type) {
  const firstName = String(rowData.firstName || rowData[YDP_MENTOR_CONFIG.headers.firstName] || '').trim() || 'there';

  if (type === 'ONBOARDING') {
    return {
      subject: 'Your YDP Mentorship Program mentor onboarding is today',
      body: [
        'Hi ' + firstName + ',',
        '',
        'Thank you for your patience, and please accept our sincere apologies for the delay in sharing this update.',
        '',
        'We are pleased to proceed with the YDP Mentorship Program and to welcome you to the mentor onboarding session taking place today, Saturday, July 18, 2026.',
        '',
        'Your willingness to share your knowledge, experience, and time with emerging data professionals is deeply valued. You are an important part of this program, and we are grateful to have you join us as we proceed with this mentorship cohort.',
        '',
        'Session details:',
        'YDP Mentor Onboarding - Cohort 2',
        'Date: Saturday, July 18, 2026',
        'Time: 4:00 PM - 4:30 PM',
        'Time zone: Africa/Lagos',
        'Google Meet: https://meet.google.com/sdy-fnow-sdn',
        '',
        'For more information about the program, please visit:',
        'https://parallel-energy-ffe.notion.site/YDP-Mentoring-Program-Cohort-II-39a03cfeb35b80ecbf89daaaf6059f3d',
        '',
        'We will continue to update this page, so please bookmark it and check it regularly for new information and resources.',
        '',
        'Please join the session a few minutes early so we can begin promptly.',
        '',
        'Thank you again for choosing to be part of the YDP Mentorship Program. We look forward to beginning this journey with you.',
        '',
        'Warm regards,',
        YDP_MENTOR_CONFIG.senderName
      ].join('\n')
    };
  }

  if (type === 'ALREADY') {
    return {
      subject: 'Update on your YDP Mentorship Program registration',
      body: [
        'Hi ' + firstName + ',',
        '',
        'Thank you for registering for the YDP Mentorship Program.',
        '',
        'We are happy to have you as a mentor, and we are writing to confirm that your registration has been received.',
        '',
        'The program starts with onboarding on ' + YDP_MENTOR_CONFIG.startDateText + '. Please keep an eye on your email, as we will get back to you soon with details about your mentee matching.',
        '',
        'As we move into the matching stage, we ask that you remain ready to commit fully to the mentorship program and make the most of the opportunity when matched.',
        '',
        'Warm regards,',
        YDP_MENTOR_CONFIG.senderName
      ].join('\n')
    };
  }

  return {
    subject: 'Your YDP Mentorship Program registration has been received',
    body: [
      'Hi ' + firstName + ',',
      '',
      'Thank you for registering for the YDP Mentorship Program.',
      '',
      'We are happy to have you as a mentor.',
      '',
      'We have received your registration and our team will review your submission. Please keep an eye on your email, as we will get back to you soon with details about your mentee matching.',
      '',
      'The program starts with onboarding on ' + YDP_MENTOR_CONFIG.startDateText + '. As we move into the matching stage, we ask that you remain ready to commit fully to the mentorship program and make the most of the opportunity when matched.',
      '',
      'Warm regards,',
      YDP_MENTOR_CONFIG.senderName
    ].join('\n')
  };
}

function sendYdpMentorEmail_(recipient, email) {
  MailApp.sendEmail({
    to: recipient,
    subject: email.subject,
    body: email.body,
    htmlBody: convertYdpPlainTextToHtml_(email.body),
    name: YDP_MENTOR_CONFIG.senderName
  });
}

function getYdpMentorSheet_() {
  const spreadsheet = SpreadsheetApp.getActive();
  const configuredSheet = spreadsheet.getSheetByName(YDP_MENTOR_CONFIG.sheetName);

  if (configuredSheet && isYdpMentorResponseSheet_(configuredSheet)) {
    return configuredSheet;
  }

  const activeSheet = spreadsheet.getActiveSheet();
  if (activeSheet && isYdpMentorResponseSheet_(activeSheet)) {
    return activeSheet;
  }

  const matchingSheet = spreadsheet.getSheets().find(function(sheet) {
    return isYdpMentorResponseSheet_(sheet);
  });

  if (matchingSheet) {
    return matchingSheet;
  }

  throw new Error(
    'Mentor response sheet not found. Open the response tab and make sure row 1 contains "Email Address" and "First Name".'
  );
}

function isYdpMentorResponseSheet_(sheet) {
  const headerMap = getYdpHeaderMap_(sheet);

  return Boolean(
    headerMap[YDP_MENTOR_CONFIG.headers.email] &&
    headerMap[YDP_MENTOR_CONFIG.headers.firstName]
  );
}

function getYdpHeaderMap_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const values = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const map = {};

  values.forEach(function(value, index) {
    const header = String(value || '').trim();
    if (header) {
      map[header] = index + 1;
    }
  });

  return map;
}

function ensureYdpHeader_(sheet, headerMap, header) {
  if (headerMap[header]) {
    return headerMap[header];
  }

  const nextColumn = sheet.getLastColumn() + 1;
  sheet.getRange(1, nextColumn).setValue(header);
  headerMap[header] = nextColumn;
  return nextColumn;
}

function getYdpHeaderColumn_(headerMap, header) {
  if (!headerMap[header]) {
    throw new Error('Required column missing: ' + header);
  }

  return headerMap[header];
}

function getYdpRowData_(sheet, row) {
  const headerMap = getYdpHeaderMap_(sheet);
  const lastColumn = sheet.getLastColumn();
  const values = sheet.getRange(row, 1, 1, lastColumn).getValues()[0];
  const data = {};

  Object.keys(headerMap).forEach(function(header) {
    data[header] = values[headerMap[header] - 1];
  });

  return data;
}

function getSelectedYdpDataRow_(sheet) {
  const selectedRange = sheet.getActiveRange();

  if (!selectedRange || selectedRange.getRow() <= 1) {
    throw new Error('Select a mentor data row first.');
  }

  return selectedRange.getRow();
}

function getYdpStatusHeaderForType_(type) {
  if (type === 'ONBOARDING') {
    return YDP_MENTOR_CONFIG.headers.onboardingReminderStatus;
  }

  return type === 'ALREADY' ? YDP_MENTOR_CONFIG.headers.alreadyRegisteredStatus : YDP_MENTOR_CONFIG.headers.registrationStatus;
}

function getYdpSentAtHeaderForType_(type) {
  if (type === 'ONBOARDING') {
    return YDP_MENTOR_CONFIG.headers.onboardingReminderSentAt;
  }

  return type === 'ALREADY' ? YDP_MENTOR_CONFIG.headers.alreadyRegisteredSentAt : YDP_MENTOR_CONFIG.headers.registrationSentAt;
}

function hasYdpMentorEmailAlreadyBeenSent_(sheet, recipient, currentRow, type) {
  const headerMap = getYdpHeaderMap_(sheet);
  const emailColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.email);
  const registrationStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.registrationStatus);
  const alreadyRegisteredStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.alreadyRegisteredStatus);
  const onboardingReminderStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.onboardingReminderStatus);
  const lastRow = sheet.getLastRow();
  const normalizedRecipient = recipient.toLowerCase();

  if (lastRow <= 1) {
    return false;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  return values.some(function(rowValues, index) {
    const rowNumber = index + 2;

    if (rowNumber === currentRow) {
      return false;
    }

    const email = String(rowValues[emailColumn - 1] || '').trim().toLowerCase();
    const registrationStatus = String(rowValues[registrationStatusColumn - 1] || '').trim();
    const alreadyRegisteredStatus = String(rowValues[alreadyRegisteredStatusColumn - 1] || '').trim();
    const onboardingReminderStatus = String(rowValues[onboardingReminderStatusColumn - 1] || '').trim();

    if (type === 'ONBOARDING') {
      return email === normalizedRecipient && onboardingReminderStatus === YDP_MENTOR_CONFIG.statuses.sent;
    }

    return email === normalizedRecipient &&
      (registrationStatus === YDP_MENTOR_CONFIG.statuses.sent ||
        alreadyRegisteredStatus === YDP_MENTOR_CONFIG.statuses.sent);
  });
}

function assignYdpMentorIdsAndMarkDuplicates_(sheet) {
  const headerMap = getYdpHeaderMap_(sheet);
  const emailColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.email);
  const personIdColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.personId);
  const duplicateStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.duplicateStatus);
  const originalRowColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.originalRow);
  const idAssignedAtColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.idAssignedAt);
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  const summary = {
    newIds: 0,
    originals: 0,
    duplicates: 0,
    skipped: 0
  };

  if (lastRow <= 1) {
    return summary;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  const emailRecords = {};
  let nextNumber = getNextYdpIdNumber_(values, personIdColumn, YDP_MENTOR_CONFIG.idPrefix);
  const now = new Date();

  values.forEach(function(rowValues, index) {
    const row = index + 2;
    const email = normalizeYdpEmail_(rowValues[emailColumn - 1]);
    const existingId = String(rowValues[personIdColumn - 1] || '').trim();
    const existingAssignedAt = rowValues[idAssignedAtColumn - 1];

    if (!email) {
      summary.skipped += 1;
      return;
    }

    if (!emailRecords[email]) {
      const personId = existingId || formatYdpSequentialId_(YDP_MENTOR_CONFIG.idPrefix, nextNumber);
      if (!existingId) {
        nextNumber += 1;
        summary.newIds += 1;
      }

      emailRecords[email] = {
        id: personId,
        originalRow: row
      };

      sheet.getRange(row, personIdColumn).setValue(personId);
      sheet.getRange(row, duplicateStatusColumn).setValue('ORIGINAL');
      sheet.getRange(row, originalRowColumn).setValue(row);
      if (!existingAssignedAt) {
        sheet.getRange(row, idAssignedAtColumn).setValue(now);
      }
      summary.originals += 1;
      return;
    }

    sheet.getRange(row, personIdColumn).setValue(emailRecords[email].id);
    sheet.getRange(row, duplicateStatusColumn).setValue('DUPLICATE');
    sheet.getRange(row, originalRowColumn).setValue(emailRecords[email].originalRow);
    if (!existingAssignedAt) {
      sheet.getRange(row, idAssignedAtColumn).setValue(now);
    }
    sheet.getRange(row, 1, 1, lastColumn).setBackground(YDP_MENTOR_CONFIG.duplicateColor);
    summary.duplicates += 1;
  });

  return summary;
}

function getNextYdpIdNumber_(values, idColumn, prefix) {
  return values.reduce(function(maxNumber, rowValues) {
    const id = String(rowValues[idColumn - 1] || '').trim();
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = id.match(new RegExp('^' + escapedPrefix + '(\\d+)$'));

    if (!match) {
      return maxNumber;
    }

    return Math.max(maxNumber, Number(match[1]) + 1);
  }, 1);
}

function formatYdpSequentialId_(prefix, number) {
  return prefix + String(number).padStart(3, '0');
}

function normalizeYdpEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

function repairYdpMentorSentDatesForRow_(sheet, row) {
  const headerMap = getYdpHeaderMap_(sheet);
  const registrationStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.registrationStatus);
  const registrationSentAtColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.registrationSentAt);
  const alreadyRegisteredStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.alreadyRegisteredStatus);
  const alreadyRegisteredSentAtColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.alreadyRegisteredSentAt);
  const onboardingReminderStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.onboardingReminderStatus);
  const onboardingReminderSentAtColumn = getYdpHeaderColumn_(headerMap, YDP_MENTOR_CONFIG.headers.onboardingReminderSentAt);
  const now = new Date();
  let repaired = 0;

  const registrationStatus = String(sheet.getRange(row, registrationStatusColumn).getValue() || '').trim();
  const registrationSentAt = sheet.getRange(row, registrationSentAtColumn).getValue();
  const alreadyRegisteredStatus = String(sheet.getRange(row, alreadyRegisteredStatusColumn).getValue() || '').trim();
  const alreadyRegisteredSentAt = sheet.getRange(row, alreadyRegisteredSentAtColumn).getValue();
  const onboardingReminderStatus = String(sheet.getRange(row, onboardingReminderStatusColumn).getValue() || '').trim();
  const onboardingReminderSentAt = sheet.getRange(row, onboardingReminderSentAtColumn).getValue();

  if (registrationStatus === YDP_MENTOR_CONFIG.statuses.sent && !registrationSentAt) {
    sheet.getRange(row, registrationSentAtColumn).setValue(now);
    repaired += 1;
  }

  if (alreadyRegisteredStatus === YDP_MENTOR_CONFIG.statuses.sent && !alreadyRegisteredSentAt) {
    sheet.getRange(row, alreadyRegisteredSentAtColumn).setValue(now);
    repaired += 1;
  }

  if (onboardingReminderStatus === YDP_MENTOR_CONFIG.statuses.sent && !onboardingReminderSentAt) {
    sheet.getRange(row, onboardingReminderSentAtColumn).setValue(now);
    repaired += 1;
  }

  return repaired;
}

function promptForYdpEmailType_(message) {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('YDP mentor email type', message, ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() !== ui.Button.OK) {
    return null;
  }

  const type = response.getResponseText().trim().toUpperCase();
  if (type !== 'REGISTRATION' && type !== 'ALREADY' && type !== 'ONBOARDING') {
    ui.alert('Please type REGISTRATION, ALREADY, or ONBOARDING.');
    return null;
  }

  return type;
}

function showYdpSingleSendResult_(result) {
  const ui = SpreadsheetApp.getUi();

  if (result.sent) {
    ui.alert('Email sent for row ' + result.row + '.');
  } else if (result.error) {
    ui.alert('Email failed for row ' + result.row + ':\n\n' + result.error);
  } else {
    ui.alert('Email skipped for row ' + result.row + ':\n\n' + result.reason);
  }
}

function isValidYdpEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function convertYdpPlainTextToHtml_(text) {
  return String(text)
    .split('\n\n')
    .map(function(paragraph) {
      const escapedParagraph = escapeYdpHtml_(paragraph);
      const linkedParagraph = escapedParagraph.replace(
        /(https:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
      );
      return '<p>' + linkedParagraph.replace(/\n/g, '<br>') + '</p>';
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

