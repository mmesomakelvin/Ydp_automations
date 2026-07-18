const YDP_MENTEE_CONFIG = {
  sheetName: 'Form_Responses',
  senderName: 'YDP Mentorship Team',
  startDateText: 'Saturday, July 18, 2026',
  menuName: 'YDP Automation',
  idPrefix: 'YDP-C2-Mentee-',
  duplicateColor: '#d9ead3',
  headers: {
    email: 'Email Address',
    firstName: 'First Name',
    lastName: 'Last Name',
    personId: 'Mentee ID',
    duplicateStatus: 'Duplicate Status',
    originalRow: 'Original Row',
    idAssignedAt: 'ID Assigned At',
    registrationStatus: 'Mentee Registration Email Status',
    registrationSentAt: 'Mentee Registration Email Sent At',
    alreadyRegisteredStatus: 'Already Registered Email Status',
    alreadyRegisteredSentAt: 'Already Registered Email Sent At',
    onboardingReminderStatus: 'Onboarding Reminder Email Status',
    onboardingReminderSentAt: 'Onboarding Reminder Email Sent At',
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
    .createMenu(YDP_MENTEE_CONFIG.menuName)
    .addItem('Setup email tracking columns', 'setupYdpMenteeEmailTrackingColumns')
    .addItem('Install form submit trigger', 'installYdpMenteeFormSubmitTrigger')
    .addItem('Assign IDs and mark duplicates', 'assignYdpMenteeIdsAndMarkDuplicates')
    .addItem('Create data dictionary', 'createYdpMenteeDataDictionary')
    .addSeparator()
    .addItem('Send test mentee email', 'sendTestYdpMenteeEmail')
    .addItem('Preview selected row email', 'previewSelectedYdpMenteeEmail')
    .addSeparator()
    .addItem('Send mentee email to selected row', 'sendYdpMenteeRegistrationEmailToSelectedRow')
    .addItem('Send mentee email to all unsent rows', 'sendYdpMenteeRegistrationEmailsToAllUnsentRows')
    .addItem('Send already registered mentee update to all unsent rows', 'sendYdpAlreadyRegisteredMenteeEmailsToAllUnsentRows')
    .addItem('Send onboarding reminder to all unsent rows', 'sendYdpMenteeOnboardingRemindersToAllUnsentRows')
    .addItem('Repair missing sent date for selected row', 'repairSelectedYdpMenteeSentDates')
    .addItem('Resend email to selected row', 'resendYdpMenteeEmailToSelectedRow')
    .addToUi();
}

function onFormSubmit(e) {
  handleYdpMenteeFormSubmit(e);
}

function handleYdpMenteeFormSubmit(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    setupYdpMenteeEmailTrackingColumns();
    setupYdpMenteeIdTrackingColumns();
    const sheet = getYdpMenteeSheet_();
    const row = e && e.range ? e.range.getRow() : sheet.getLastRow();

    if (row <= 1) {
      return;
    }

    assignYdpMenteeIdsAndMarkDuplicates({ silent: true });
    sendYdpMenteeEmailForRow_(sheet, row, 'REGISTRATION', { force: false });
  } finally {
    lock.releaseLock();
  }
}

function installYdpMenteeFormSubmitTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const alreadyInstalled = triggers.some(function(trigger) {
    return trigger.getHandlerFunction() === 'handleYdpMenteeFormSubmit' &&
      trigger.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT;
  });

  if (!alreadyInstalled) {
    ScriptApp.newTrigger('handleYdpMenteeFormSubmit')
      .forSpreadsheet(SpreadsheetApp.getActive())
      .onFormSubmit()
      .create();
  }

  SpreadsheetApp.getUi().alert('YDP mentee form-submit trigger is installed.');
}

function setupYdpMenteeEmailTrackingColumns() {
  const sheet = getYdpMenteeSheet_();
  const trackingHeaders = [
    YDP_MENTEE_CONFIG.headers.registrationStatus,
    YDP_MENTEE_CONFIG.headers.registrationSentAt,
    YDP_MENTEE_CONFIG.headers.alreadyRegisteredStatus,
    YDP_MENTEE_CONFIG.headers.alreadyRegisteredSentAt,
    YDP_MENTEE_CONFIG.headers.onboardingReminderStatus,
    YDP_MENTEE_CONFIG.headers.onboardingReminderSentAt,
    YDP_MENTEE_CONFIG.headers.lastError
  ];

  const headerMap = getYdpHeaderMap_(sheet);
  trackingHeaders.forEach(function(header) {
    ensureYdpHeader_(sheet, headerMap, header);
  });

  SpreadsheetApp.getActive().toast('YDP email tracking columns are ready.');
}

function setupYdpMenteeIdTrackingColumns() {
  const sheet = getYdpMenteeSheet_();
  const idHeaders = [
    YDP_MENTEE_CONFIG.headers.personId,
    YDP_MENTEE_CONFIG.headers.duplicateStatus,
    YDP_MENTEE_CONFIG.headers.originalRow,
    YDP_MENTEE_CONFIG.headers.idAssignedAt
  ];

  const headerMap = getYdpHeaderMap_(sheet);
  idHeaders.forEach(function(header) {
    ensureYdpHeader_(sheet, headerMap, header);
  });
}

function assignYdpMenteeIdsAndMarkDuplicates(options) {
  const settings = options || {};
  setupYdpMenteeIdTrackingColumns();

  const sheet = getYdpMenteeSheet_();
  const summary = assignYdpMenteeIdsAndMarkDuplicates_(sheet);

  if (!settings.silent) {
    SpreadsheetApp.getUi().alert(
      'YDP mentee ID assignment complete.\n\n' +
      'New IDs assigned: ' + summary.newIds + '\n' +
      'Original rows: ' + summary.originals + '\n' +
      'Duplicate rows marked green: ' + summary.duplicates + '\n' +
      'Rows skipped because email was missing: ' + summary.skipped
    );
  }

  return summary;
}

function createYdpMenteeDataDictionary() {
  const dictionarySheet = getOrCreateYdpMenteeDictionarySheet_();
  const buttonGuideSheet = getOrCreateYdpMenteeButtonGuideSheet_();
  const sourceHeaders = getYdpMenteeSourceHeadersForDictionary_();

  writeYdpMenteeDataDictionary_(dictionarySheet, getYdpMenteeDataDictionaryRows_(sourceHeaders));
  writeYdpMenteeButtonGuide_(buttonGuideSheet, getYdpMenteeButtonGuideRows_());
  SpreadsheetApp.getUi().alert(
    'Mentee documentation was refreshed in the "Data Dictionary" and "Button Guide" tabs. Participant data was not changed.'
  );
}

function getYdpMenteeDataDictionaryRows_(sourceHeaders) {
  const responsePurpose = 'Stores the live mentee application responses and automation tracking fields.';
  const rows = [
    ['Sheet Name', 'Sheet Purpose', 'Column Name', 'Column Meaning', 'Automation Use', 'Can Team Edit?', 'Notes'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, 'Timestamp', 'Date and time the mentee submitted the form.', 'Used as the original application audit time.', 'No - use the form', 'Reference field from Google Forms.'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, 'Email Address', 'Mentee email address and unique identity key.', 'Used for IDs, duplicate checks, and email delivery.', 'Only to correct a confirmed typo', 'Changing this can affect identity and duplicate detection.'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, 'First Name', 'Mentee first name.', 'Personalizes participant emails.', 'Only to correct a confirmed typo', 'The email greeting uses this value.'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, 'Last Name', 'Mentee surname.', 'Used in records, scoring, and matching.', 'Only to correct a confirmed typo', 'Keep the participant spelling.'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, 'Phone', 'Mentee phone number.', 'Available for participant contact and duplicate review.', 'Only to correct a confirmed typo', 'Email remains the primary unique key.'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, 'Location (City, Country)', 'Where the mentee is based.', 'Supports timezone and location-aware matching decisions.', 'Only to correct a confirmed typo', 'Use city and country where possible.'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, 'LinkedIn Profile URL', 'Link to the mentee LinkedIn profile.', 'Supports application review.', 'Only to correct a confirmed typo', 'May be blank or invalid if the applicant entered it incorrectly.'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, 'Preferred Communication Method', 'How the mentee prefers to communicate.', 'Used as context when matching and planning engagement.', 'No - use the form', 'A preference, not a guaranteed channel.'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, YDP_MENTEE_CONFIG.headers.personId, 'Stable ID assigned to the first application for each unique email.', 'Links this mentee across scoring, matching, and program tracking.', 'No - automation managed', 'Duplicate submissions receive the original ID.'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, YDP_MENTEE_CONFIG.headers.duplicateStatus, 'Shows ORIGINAL or DUPLICATE.', 'Prevents the same person from being counted twice.', 'No - automation managed', 'Duplicate rows are also colored green.'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, YDP_MENTEE_CONFIG.headers.originalRow, 'Row number of the first application for this email.', 'Connects duplicate submissions to the original row.', 'No - automation managed', 'Original rows point to themselves.'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, YDP_MENTEE_CONFIG.headers.idAssignedAt, 'Date and time the mentee ID was assigned.', 'Provides an ID-assignment audit trail.', 'No - automation managed', 'Do not clear this value.'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, YDP_MENTEE_CONFIG.headers.registrationStatus, 'Status of the first registration email.', 'SENT prevents duplicate registration emails; ERROR marks a failure.', 'No - automation managed', 'Use the resend command for an intentional duplicate send.'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, YDP_MENTEE_CONFIG.headers.registrationSentAt, 'Date and time the first registration email was sent.', 'Provides the registration-email audit time.', 'No - automation managed', 'Repair only with the dedicated menu command.'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, YDP_MENTEE_CONFIG.headers.alreadyRegisteredStatus, 'Status of the older-applicant update email.', 'Prevents duplicate already-registered updates.', 'No - automation managed', 'Independent from the normal registration campaign.'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, YDP_MENTEE_CONFIG.headers.alreadyRegisteredSentAt, 'Date and time the older-applicant update was sent.', 'Provides the update-email audit time.', 'No - automation managed', 'Do not clear after sending.'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, YDP_MENTEE_CONFIG.headers.onboardingReminderStatus, 'Status of the July 18 onboarding reminder.', 'Prevents duplicate onboarding reminders.', 'No - automation managed', 'Independent from registration email status.'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, YDP_MENTEE_CONFIG.headers.onboardingReminderSentAt, 'Date and time the onboarding reminder was sent.', 'Provides the onboarding campaign audit time.', 'No - automation managed', 'Do not clear after sending.'],
    [YDP_MENTEE_CONFIG.sheetName, responsePurpose, YDP_MENTEE_CONFIG.headers.lastError, 'Most recent email error for this row.', 'Explains why a send failed.', 'No - automation managed', 'Check this when an email status is ERROR.']
  ];

  addYdpMenteeUndocumentedSourceHeaders_(rows, sourceHeaders || [], responsePurpose);
  addYdpMenteeDocumentationDictionaryRows_(rows);
  return rows;
}

function addYdpMenteeUndocumentedSourceHeaders_(rows, sourceHeaders, responsePurpose) {
  const documented = {};
  rows.slice(1).forEach(function(row) {
    if (row[0] === YDP_MENTEE_CONFIG.sheetName) {
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
      YDP_MENTEE_CONFIG.sheetName,
      responsePurpose,
      columnName,
      'The mentee response to this application question.',
      'Available for application review, scoring, or matching when relevant.',
      'No - use the form',
      'Automatically included from the live sheet header.'
    ]);
    documented[key] = true;
  });
}

function addYdpMenteeDocumentationDictionaryRows_(rows) {
  const dictionaryPurpose = 'Explains each workbook sheet and column in plain English.';
  const guidePurpose = 'Explains every YDP Automation menu command and its safety level.';
  const dictionaryColumns = [
    ['Sheet Name', 'Worksheet tab being documented.'],
    ['Sheet Purpose', 'Reason the worksheet exists.'],
    ['Column Name', 'Exact header used in the worksheet.'],
    ['Column Meaning', 'Plain-English definition of the value.'],
    ['Automation Use', 'How the scripts use the value.'],
    ['Can Team Edit?', 'Whether manual editing is safe.'],
    ['Notes', 'Warnings and extra operating guidance.']
  ];
  const guideColumns = [
    ['Safety Level', 'SAFE, CAUTION, or LIVE ACTION classification.'],
    ['Menu Name', 'Google Sheets menu containing the command.'],
    ['Button Name', 'Exact menu command label.'],
    ['What It Does', 'Result of running the command.'],
    ['When To Run', 'Correct situation for using the command.'],
    ['Before Running', 'Checks required before using the command.'],
    ['What It Changes', 'Workbook data or communications affected.'],
    ['Recommended Frequency', 'How often the command normally runs.']
  ];

  dictionaryColumns.forEach(function(column) {
    rows.push(['Data Dictionary', dictionaryPurpose, column[0], column[1], 'Documentation only.', 'No - regenerate from menu', 'Refreshed by Create data dictionary.']);
  });
  guideColumns.forEach(function(column) {
    rows.push(['Button Guide', guidePurpose, column[0], column[1], 'Helps the team operate the automation safely.', 'No - regenerate from menu', 'Refreshed by Create data dictionary.']);
  });
}

function getYdpMenteeButtonGuideRows_() {
  const menu = YDP_MENTEE_CONFIG.menuName;
  return [
    ['Safety Level', 'Menu Name', 'Button Name', 'What It Does', 'When To Run', 'Before Running', 'What It Changes', 'Recommended Frequency'],
    ['SAFE', menu, 'Setup email tracking columns', 'Creates any missing email-status and sent-date columns.', 'During initial setup or after a tracking column was removed.', 'Confirm you are in the mentee response workbook.', 'Adds missing headers only; it does not send email.', 'Once, then as needed'],
    ['SAFE', menu, 'Install form submit trigger', 'Turns on automatic handling for future form submissions.', 'After the script is first deployed or the trigger was removed.', 'Confirm the correct mentee form response workbook is open.', 'Creates one Apps Script form-submit trigger.', 'Once'],
    ['CAUTION', menu, 'Assign IDs and mark duplicates', 'Assigns stable mentee IDs and marks repeated email submissions.', 'After importing existing applications or when checking new duplicates.', 'Confirm Email Address values are correct.', 'Writes ID, duplicate status, original row, timestamp, and duplicate row color.', 'After imports or as needed'],
    ['SAFE', menu, 'Create data dictionary', 'Refreshes the Data Dictionary and Button Guide tabs.', 'When documentation is missing or the automation changes.', 'No preparation is required.', 'Rebuilds documentation tabs only.', 'After each automation update'],
    ['SAFE', menu, 'Send test mentee email', 'Sends a selected email template to a test address you enter.', 'Before any live email campaign.', 'Use your own internal test email and choose the correct email type.', 'Sends one test email; participant tracking is not updated.', 'Before every campaign'],
    ['SAFE', menu, 'Preview selected row email', 'Displays all email templates personalized for the selected mentee.', 'Before a test or live send.', 'Select a real mentee row, not the header.', 'Opens a preview only; no email or status changes.', 'Before every campaign'],
    ['LIVE ACTION', menu, 'Send mentee email to selected row', 'Sends the registration email to one selected mentee if it was not already sent.', 'For a controlled first send or a single new applicant.', 'Preview and test the registration template; select the intended row.', 'Sends one live email and updates registration status, sent time, and last error.', 'As needed'],
    ['LIVE ACTION', menu, 'Send mentee email to all unsent rows', 'Sends registration emails to every eligible row not already marked SENT.', 'For the approved registration campaign.', 'Preview, test, verify recipients, and obtain campaign approval.', 'Sends multiple live emails and updates registration tracking columns.', 'Once per registration campaign'],
    ['LIVE ACTION', menu, 'Send already registered mentee update to all unsent rows', 'Sends the older-applicant update to rows that have not received it.', 'When communicating with applications received before automation started.', 'Preview, test, verify recipients, and obtain campaign approval.', 'Sends multiple live emails and updates already-registered tracking columns.', 'Once per update campaign'],
    ['LIVE ACTION', menu, 'Send onboarding reminder to all unsent rows', 'Sends the onboarding reminder to mentees who have not received that campaign.', 'Only for the approved onboarding reminder campaign.', 'Preview, test, verify date details, and obtain campaign approval.', 'Sends multiple live emails and updates onboarding reminder tracking columns.', 'Once per onboarding campaign'],
    ['CAUTION', menu, 'Repair missing sent date for selected row', 'Adds a sent timestamp when a SENT status exists without a date.', 'Only when auditing a confirmed tracking inconsistency.', 'Select the affected row and confirm the email really was sent.', 'Writes the current date into a missing sent-at field; sends no email.', 'Only when repairing data'],
    ['LIVE ACTION', menu, 'Resend email to selected row', 'Forces one selected email template to be sent again.', 'Only when a recipient needs an intentional resend.', 'Select the correct row, preview the template, and confirm a duplicate send is intended.', 'Sends one live duplicate email and refreshes its tracking fields.', 'Exceptional use only']
  ];
}

function getYdpMenteeButtonGuideColor_(safetyLevel) {
  return {
    SAFE: '#d9ead3',
    CAUTION: '#fff2cc',
    'LIVE ACTION': '#f4cccc'
  }[safetyLevel] || '#ffffff';
}

function getYdpMenteeSourceHeadersForDictionary_() {
  const sourceSheet = getYdpMenteeSheet_();
  if (sourceSheet.getLastColumn() < 1) {
    return [];
  }

  return sourceSheet.getRange(1, 1, 1, sourceSheet.getLastColumn()).getValues()[0];
}

function getOrCreateYdpMenteeDictionarySheet_() {
  return SpreadsheetApp.getActive().getSheetByName('Data Dictionary') || SpreadsheetApp.getActive().insertSheet('Data Dictionary');
}

function getOrCreateYdpMenteeButtonGuideSheet_() {
  return SpreadsheetApp.getActive().getSheetByName('Button Guide') || SpreadsheetApp.getActive().insertSheet('Button Guide');
}

function writeYdpMenteeDataDictionary_(sheet, rows) {
  resetYdpMenteeDocumentationSheet_(sheet);
  const range = sheet.getRange(1, 1, rows.length, rows[0].length);
  range.setValues(rows).setWrap(true).setVerticalAlignment('top');
  formatYdpMenteeDocumentationHeader_(sheet, rows[0].length);
  applyYdpMenteeDictionaryShading_(sheet, rows);
  applyYdpMenteeDocumentationFilter_(sheet, rows);
  [170, 270, 230, 380, 340, 180, 360].forEach(function(width, index) {
    sheet.setColumnWidth(index + 1, width);
  });
}

function applyYdpMenteeDictionaryShading_(sheet, rows) {
  if (rows.length <= 1) {
    return;
  }
  const backgrounds = rows.slice(1).map(function(row, index) {
    return new Array(rows[0].length).fill(index % 2 === 0 ? '#ffffff' : '#f3f6f4');
  });
  sheet.getRange(2, 1, backgrounds.length, rows[0].length).setBackgrounds(backgrounds);
}

function writeYdpMenteeButtonGuide_(sheet, rows) {
  resetYdpMenteeDocumentationSheet_(sheet);
  const range = sheet.getRange(1, 1, rows.length, rows[0].length);
  range.setValues(rows).setWrap(true).setVerticalAlignment('top');
  formatYdpMenteeDocumentationHeader_(sheet, rows[0].length);

  if (rows.length > 1) {
    const backgrounds = rows.slice(1).map(function(row) {
      return new Array(rows[0].length).fill(getYdpMenteeButtonGuideColor_(row[0]));
    });
    sheet.getRange(2, 1, backgrounds.length, rows[0].length).setBackgrounds(backgrounds);
  }

  applyYdpMenteeDocumentationFilter_(sheet, rows);
  [120, 160, 310, 390, 350, 350, 370, 190].forEach(function(width, index) {
    sheet.setColumnWidth(index + 1, width);
  });
}

function resetYdpMenteeDocumentationSheet_(sheet) {
  const filter = sheet.getFilter();
  if (filter) {
    filter.remove();
  }
  sheet.clearContents();
  sheet.clearFormats();
  sheet.setFrozenRows(1);
}

function formatYdpMenteeDocumentationHeader_(sheet, columnCount) {
  sheet.getRange(1, 1, 1, columnCount)
    .setFontWeight('bold')
    .setFontColor('#ffffff')
    .setBackground('#274e13');
}

function applyYdpMenteeDocumentationFilter_(sheet, rows) {
  if (rows.length > 1) {
    sheet.getRange(1, 1, rows.length, rows[0].length).createFilter();
  }
}

function sendTestYdpMenteeEmail() {
  const ui = SpreadsheetApp.getUi();
  const emailResponse = ui.prompt('Send test mentee email', 'Enter the test recipient email address:', ui.ButtonSet.OK_CANCEL);

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

  const email = buildYdpMenteeEmail_({ firstName: 'Test' }, type);
  sendYdpMenteeEmail_(recipient, email);
  ui.alert('Test email sent to ' + recipient + '.');
}

function previewSelectedYdpMenteeEmail() {
  const sheet = getYdpMenteeSheet_();
  const row = getSelectedYdpDataRow_(sheet);
  const rowData = getYdpRowData_(sheet, row);
  const registrationEmail = buildYdpMenteeEmail_(rowData, 'REGISTRATION');
  const alreadyRegisteredEmail = buildYdpMenteeEmail_(rowData, 'ALREADY');
  const onboardingReminderEmail = buildYdpMenteeEmail_(rowData, 'ONBOARDING');
  const html = [
    '<div style="font-family:Arial,sans-serif;line-height:1.5;padding:8px;">',
    '<h2>Registration Email</h2>',
    '<p><strong>Subject:</strong> ' + escapeYdpHtml_(registrationEmail.subject) + '</p>',
    '<pre style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:6px;">' + escapeYdpHtml_(registrationEmail.body) + '</pre>',
    '<h2>Already Registered Update</h2>',
    '<p><strong>Subject:</strong> ' + escapeYdpHtml_(alreadyRegisteredEmail.subject) + '</p>',
    '<pre style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:6px;">' + escapeYdpHtml_(alreadyRegisteredEmail.body) + '</pre>',
    '<h2>Onboarding Reminder</h2>',
    '<p><strong>Subject:</strong> ' + escapeYdpHtml_(onboardingReminderEmail.subject) + '</p>',
    '<pre style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:6px;">' + escapeYdpHtml_(onboardingReminderEmail.body) + '</pre>',
    '</div>'
  ].join('');

  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(720).setHeight(760),
    'YDP Mentee Email Preview'
  );
}

function sendYdpMenteeRegistrationEmailToSelectedRow() {
  const sheet = getYdpMenteeSheet_();
  const row = getSelectedYdpDataRow_(sheet);
  const result = sendYdpMenteeEmailForRow_(sheet, row, 'REGISTRATION', { force: false });
  showYdpSingleSendResult_(result);
}

function sendYdpMenteeRegistrationEmailsToAllUnsentRows() {
  sendYdpMenteeBulkEmails_('REGISTRATION');
}

function sendYdpAlreadyRegisteredMenteeEmailsToAllUnsentRows() {
  sendYdpMenteeBulkEmails_('ALREADY');
}

function sendYdpMenteeOnboardingRemindersToAllUnsentRows() {
  sendYdpMenteeBulkEmails_('ONBOARDING');
}

function repairSelectedYdpMenteeSentDates() {
  const sheet = getYdpMenteeSheet_();
  const row = getSelectedYdpDataRow_(sheet);
  const repaired = repairYdpMenteeSentDatesForRow_(sheet, row);

  SpreadsheetApp.getUi().alert(
    repaired > 0
      ? 'Repaired ' + repaired + ' missing sent date(s) for row ' + row + '.'
      : 'No missing sent dates found for row ' + row + '.'
  );
}

function resendYdpMenteeEmailToSelectedRow() {
  const type = promptForYdpEmailType_('Which email should be resent? Type REGISTRATION, ALREADY, or ONBOARDING.');
  if (!type) {
    return;
  }

  const sheet = getYdpMenteeSheet_();
  const row = getSelectedYdpDataRow_(sheet);
  const result = sendYdpMenteeEmailForRow_(sheet, row, type, { force: true });
  showYdpSingleSendResult_(result);
}

function sendYdpMenteeBulkEmails_(type) {
  setupYdpMenteeEmailTrackingColumns();

  const sheet = getYdpMenteeSheet_();
  const lastRow = sheet.getLastRow();
  const summary = {
    sent: 0,
    skipped: 0,
    errors: 0
  };

  if (lastRow <= 1) {
    SpreadsheetApp.getUi().alert('No mentee rows found.');
    return;
  }

  for (let row = 2; row <= lastRow; row += 1) {
    const result = sendYdpMenteeEmailForRow_(sheet, row, type, { force: false });

    if (result.sent) {
      summary.sent += 1;
    } else if (result.error) {
      summary.errors += 1;
    } else {
      summary.skipped += 1;
    }
  }

  SpreadsheetApp.getUi().alert(
    'YDP mentee email send complete.\n\n' +
    'Sent: ' + summary.sent + '\n' +
    'Skipped: ' + summary.skipped + '\n' +
    'Errors: ' + summary.errors
  );
}

function sendYdpMenteeEmailForRow_(sheet, row, type, options) {
  const settings = options || {};
  const headerMap = getYdpHeaderMap_(sheet);
  const statusHeader = getYdpStatusHeaderForType_(type);
  const sentAtHeader = getYdpSentAtHeaderForType_(type);
  const statusColumn = getYdpHeaderColumn_(headerMap, statusHeader);
  const sentAtColumn = getYdpHeaderColumn_(headerMap, sentAtHeader);
  const registrationStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.registrationStatus);
  const alreadyRegisteredStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.alreadyRegisteredStatus);
  const onboardingReminderStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.onboardingReminderStatus);
  const lastErrorColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.lastError);
  const rowData = getYdpRowData_(sheet, row);
  const recipient = String(rowData[YDP_MENTEE_CONFIG.headers.email] || '').trim();
  const registrationStatus = String(sheet.getRange(row, registrationStatusColumn).getValue() || '').trim();
  const alreadyRegisteredStatus = String(sheet.getRange(row, alreadyRegisteredStatusColumn).getValue() || '').trim();
  const onboardingReminderStatus = String(sheet.getRange(row, onboardingReminderStatusColumn).getValue() || '').trim();

  if (!isValidYdpEmail_(recipient)) {
    sheet.getRange(row, statusColumn).setValue(YDP_MENTEE_CONFIG.statuses.error);
    sheet.getRange(row, lastErrorColumn).setValue('Missing or invalid email address.');
    return { row: row, sent: false, skipped: false, error: 'Missing or invalid email address.' };
  }

  const currentCampaignWasSent = type === 'ONBOARDING'
    ? onboardingReminderStatus === YDP_MENTEE_CONFIG.statuses.sent
    : registrationStatus === YDP_MENTEE_CONFIG.statuses.sent ||
      alreadyRegisteredStatus === YDP_MENTEE_CONFIG.statuses.sent;

  if (!settings.force && currentCampaignWasSent) {
    const repaired = repairYdpMenteeSentDatesForRow_(sheet, row);
    return {
      row: row,
      sent: false,
      skipped: true,
      reason: repaired > 0
        ? 'This mentee campaign email has already been sent for this row. Repaired ' + repaired + ' missing sent date(s).'
        : 'This mentee campaign email has already been sent for this row.'
    };
  }

  if (!settings.force && hasYdpMenteeEmailAlreadyBeenSent_(sheet, recipient, row, type)) {
    sheet.getRange(row, statusColumn).setValue(YDP_MENTEE_CONFIG.statuses.skippedDuplicate);
    sheet.getRange(row, lastErrorColumn).setValue('');
    return { row: row, sent: false, skipped: true, reason: 'Duplicate email address already received a mentee email.' };
  }

  try {
    const email = buildYdpMenteeEmail_(rowData, type);
    sendYdpMenteeEmail_(recipient, email);
    sheet.getRange(row, statusColumn).setValue(YDP_MENTEE_CONFIG.statuses.sent);
    sheet.getRange(row, sentAtColumn).setValue(new Date());
    sheet.getRange(row, lastErrorColumn).setValue('');

    return { row: row, sent: true, skipped: false };
  } catch (error) {
    sheet.getRange(row, statusColumn).setValue(YDP_MENTEE_CONFIG.statuses.error);
    sheet.getRange(row, lastErrorColumn).setValue(error.message);
    return { row: row, sent: false, skipped: false, error: error.message };
  }
}

function buildYdpMenteeEmail_(rowData, type) {
  const firstName = String(rowData.firstName || rowData[YDP_MENTEE_CONFIG.headers.firstName] || '').trim() || 'there';

  if (type === 'ONBOARDING') {
    return {
      subject: 'YDP Mentorship onboarding is this Saturday',
      body: [
        'Hi ' + firstName + ',',
        '',
        'Thank you for coming this far with the YDP Mentorship Program.',
        '',
        'Our onboarding session is this Saturday, July 18, 2026.',
        '',
        'Before the onboarding session, we will let you know whether you have been selected for the program. If selected, you will also receive your mentor details before then.',
        '',
        'Please keep an eye on your email for this update and the onboarding details.',
        '',
        'Warm regards,',
        YDP_MENTEE_CONFIG.senderName
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
        'We are happy to have you as a mentee, and we are writing to confirm that your registration has been received.',
        '',
        'The program starts with onboarding on ' + YDP_MENTEE_CONFIG.startDateText + '. Please keep an eye on your email, as we will get back to you soon with details about your mentor matching.',
        '',
        'As we move into the matching stage, we ask that you remain ready to commit fully to the mentorship program and make the most of the opportunity when matched.',
        '',
        'Warm regards,',
        YDP_MENTEE_CONFIG.senderName
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
      'We are happy to have you as a mentee.',
      '',
      'We have received your registration and our team will review your submission. Please keep an eye on your email, as we will get back to you soon with details about your mentor matching.',
      '',
      'The program starts with onboarding on ' + YDP_MENTEE_CONFIG.startDateText + '. As we move into the matching stage, we ask that you remain ready to commit fully to the mentorship program and make the most of the opportunity when matched.',
      '',
      'Warm regards,',
      YDP_MENTEE_CONFIG.senderName
    ].join('\n')
  };
}

function sendYdpMenteeEmail_(recipient, email) {
  MailApp.sendEmail({
    to: recipient,
    subject: email.subject,
    body: email.body,
    htmlBody: convertYdpPlainTextToHtml_(email.body),
    name: YDP_MENTEE_CONFIG.senderName
  });
}

function getYdpMenteeSheet_() {
  const spreadsheet = SpreadsheetApp.getActive();
  const configuredSheet = spreadsheet.getSheetByName(YDP_MENTEE_CONFIG.sheetName);

  if (configuredSheet && isYdpMenteeResponseSheet_(configuredSheet)) {
    return configuredSheet;
  }

  const activeSheet = spreadsheet.getActiveSheet();
  if (activeSheet && isYdpMenteeResponseSheet_(activeSheet)) {
    return activeSheet;
  }

  const matchingSheet = spreadsheet.getSheets().find(function(sheet) {
    return isYdpMenteeResponseSheet_(sheet);
  });

  if (matchingSheet) {
    return matchingSheet;
  }

  throw new Error(
    'Mentee response sheet not found. Open the response tab and make sure row 1 contains "Email Address" and "First Name".'
  );
}

function isYdpMenteeResponseSheet_(sheet) {
  const headerMap = getYdpHeaderMap_(sheet);

  return Boolean(
    headerMap[YDP_MENTEE_CONFIG.headers.email] &&
    headerMap[YDP_MENTEE_CONFIG.headers.firstName]
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
    throw new Error('Select a mentee data row first.');
  }

  return selectedRange.getRow();
}

function getYdpStatusHeaderForType_(type) {
  if (type === 'ONBOARDING') {
    return YDP_MENTEE_CONFIG.headers.onboardingReminderStatus;
  }

  return type === 'ALREADY' ? YDP_MENTEE_CONFIG.headers.alreadyRegisteredStatus : YDP_MENTEE_CONFIG.headers.registrationStatus;
}

function getYdpSentAtHeaderForType_(type) {
  if (type === 'ONBOARDING') {
    return YDP_MENTEE_CONFIG.headers.onboardingReminderSentAt;
  }

  return type === 'ALREADY' ? YDP_MENTEE_CONFIG.headers.alreadyRegisteredSentAt : YDP_MENTEE_CONFIG.headers.registrationSentAt;
}

function hasYdpMenteeEmailAlreadyBeenSent_(sheet, recipient, currentRow, type) {
  const headerMap = getYdpHeaderMap_(sheet);
  const emailColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.email);
  const registrationStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.registrationStatus);
  const alreadyRegisteredStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.alreadyRegisteredStatus);
  const onboardingReminderStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.onboardingReminderStatus);
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
      return email === normalizedRecipient && onboardingReminderStatus === YDP_MENTEE_CONFIG.statuses.sent;
    }

    return email === normalizedRecipient &&
      (registrationStatus === YDP_MENTEE_CONFIG.statuses.sent ||
        alreadyRegisteredStatus === YDP_MENTEE_CONFIG.statuses.sent);
  });
}

function assignYdpMenteeIdsAndMarkDuplicates_(sheet) {
  const headerMap = getYdpHeaderMap_(sheet);
  const emailColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.email);
  const personIdColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.personId);
  const duplicateStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.duplicateStatus);
  const originalRowColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.originalRow);
  const idAssignedAtColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.idAssignedAt);
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
  let nextNumber = getNextYdpIdNumber_(values, personIdColumn, YDP_MENTEE_CONFIG.idPrefix);
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
      const personId = existingId || formatYdpSequentialId_(YDP_MENTEE_CONFIG.idPrefix, nextNumber);
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
    sheet.getRange(row, 1, 1, lastColumn).setBackground(YDP_MENTEE_CONFIG.duplicateColor);
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

function repairYdpMenteeSentDatesForRow_(sheet, row) {
  const headerMap = getYdpHeaderMap_(sheet);
  const registrationStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.registrationStatus);
  const registrationSentAtColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.registrationSentAt);
  const alreadyRegisteredStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.alreadyRegisteredStatus);
  const alreadyRegisteredSentAtColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.alreadyRegisteredSentAt);
  const onboardingReminderStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.onboardingReminderStatus);
  const onboardingReminderSentAtColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.onboardingReminderSentAt);
  const now = new Date();
  let repaired = 0;

  const registrationStatus = String(sheet.getRange(row, registrationStatusColumn).getValue() || '').trim();
  const registrationSentAt = sheet.getRange(row, registrationSentAtColumn).getValue();
  const alreadyRegisteredStatus = String(sheet.getRange(row, alreadyRegisteredStatusColumn).getValue() || '').trim();
  const alreadyRegisteredSentAt = sheet.getRange(row, alreadyRegisteredSentAtColumn).getValue();
  const onboardingReminderStatus = String(sheet.getRange(row, onboardingReminderStatusColumn).getValue() || '').trim();
  const onboardingReminderSentAt = sheet.getRange(row, onboardingReminderSentAtColumn).getValue();

  if (registrationStatus === YDP_MENTEE_CONFIG.statuses.sent && !registrationSentAt) {
    sheet.getRange(row, registrationSentAtColumn).setValue(now);
    repaired += 1;
  }

  if (alreadyRegisteredStatus === YDP_MENTEE_CONFIG.statuses.sent && !alreadyRegisteredSentAt) {
    sheet.getRange(row, alreadyRegisteredSentAtColumn).setValue(now);
    repaired += 1;
  }

  if (onboardingReminderStatus === YDP_MENTEE_CONFIG.statuses.sent && !onboardingReminderSentAt) {
    sheet.getRange(row, onboardingReminderSentAtColumn).setValue(now);
    repaired += 1;
  }

  return repaired;
}

function promptForYdpEmailType_(message) {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('YDP mentee email type', message, ui.ButtonSet.OK_CANCEL);

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
