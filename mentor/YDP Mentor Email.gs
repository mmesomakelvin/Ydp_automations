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
    .addItem('Send onboarding reminder to all unsent rows', 'sendYdpMentorOnboardingRemindersToAllUnsentRows')
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
  const sheet = getOrCreateYdpMentorDictionarySheet_();
  writeYdpMentorDataDictionary_(sheet, getYdpMentorDataDictionaryRows_());
  SpreadsheetApp.getUi().alert('Mentor data dictionary created/updated in the "Data Dictionary" tab.');
}

function getYdpMentorDataDictionaryRows_() {
  return [
    ['Section', 'Sheet / Button', 'Column / Action', 'Plain English Meaning', 'When To Use'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, 'Timestamp', 'When the mentor submitted the application form.', 'Reference only.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, 'Email Address', 'The mentor email address. This is used as the unique identity key.', 'Required for IDs and emails.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, 'First Name', 'The mentor first name used for email personalization.', 'Required for cleaner emails.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, 'Last Name', 'The mentor last name used for records and matching.', 'Reference and matching.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, 'Phone Number', 'The mentor phone number from the form.', 'Reference only for now.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, 'Location (city, country)', 'Where the mentor is based.', 'Useful later for timezone or cohort context.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, 'LinkedIn Profile URL', 'The mentor LinkedIn profile link.', 'Reference for review.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, 'Preferred Communication Method', 'How the mentor prefers to be contacted.', 'Useful later for engagement planning.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, 'Years of Experience in Data', 'Mentor experience range.', 'Used by matching.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, 'Current Role', 'Current job title or professional role.', 'Used by matching.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, 'Areas of Expertise', 'Skills or data areas the mentor can support.', 'Used heavily by matching.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, 'How many mentees are you willing to take on', 'Stated mentor capacity.', 'Matching uses this plus a flexible buffer of 2.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, 'Availability', 'How many hours the mentor can give.', 'Used by matching.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, 'Preferred Days and Times for Session', 'When the mentor prefers to meet.', 'Used by matching if available.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, YDP_MENTOR_CONFIG.headers.personId, 'Stable mentor ID created by the automation.', 'Use this instead of names when matching or tracking.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, YDP_MENTOR_CONFIG.headers.duplicateStatus, 'Shows ORIGINAL for first application and DUPLICATE for repeated email submissions.', 'Use this to avoid counting the same mentor twice.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, YDP_MENTOR_CONFIG.headers.originalRow, 'For duplicate rows, this points back to the original row number.', 'Use when cleaning duplicate applications.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, YDP_MENTOR_CONFIG.headers.idAssignedAt, 'Timestamp when the mentor ID was assigned.', 'Audit trail.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, YDP_MENTOR_CONFIG.headers.registrationStatus, 'Whether the first registration email was sent.', 'Do not edit unless correcting a mistake.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, YDP_MENTOR_CONFIG.headers.registrationSentAt, 'Date/time the first registration email was sent.', 'Audit trail.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, YDP_MENTOR_CONFIG.headers.alreadyRegisteredStatus, 'Whether the already-registered update email was sent.', 'Used for older existing applicants.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, YDP_MENTOR_CONFIG.headers.alreadyRegisteredSentAt, 'Date/time the already-registered update email was sent.', 'Audit trail.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, YDP_MENTOR_CONFIG.headers.onboardingReminderStatus, 'Whether the July 18 onboarding reminder was sent.', 'Prevents duplicate onboarding reminders.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, YDP_MENTOR_CONFIG.headers.onboardingReminderSentAt, 'Date/time the onboarding reminder was sent.', 'Audit trail.'],
    ['Sheet', YDP_MENTOR_CONFIG.sheetName, YDP_MENTOR_CONFIG.headers.lastError, 'Last email error message for that row.', 'Check this if an email did not send.'],
    ['Button', YDP_MENTOR_CONFIG.menuName, 'Setup email tracking columns', 'Creates the email tracking columns if they are missing.', 'Run once, or if columns are missing.'],
    ['Button', YDP_MENTOR_CONFIG.menuName, 'Install form submit trigger', 'Makes the automation run when a new form response arrives.', 'Run once after deploying the script.'],
    ['Button', YDP_MENTOR_CONFIG.menuName, 'Assign IDs and mark duplicates', 'Creates mentor IDs and marks repeated email submissions as duplicates.', 'Run after importing or receiving new form rows.'],
    ['Button', YDP_MENTOR_CONFIG.menuName, 'Create data dictionary', 'Creates this explanation tab.', 'Run whenever you want to refresh documentation.'],
    ['Button', YDP_MENTOR_CONFIG.menuName, 'Send test mentor email', 'Sends a test email to an address you enter.', 'Use before real sends.'],
    ['Button', YDP_MENTOR_CONFIG.menuName, 'Preview selected row email', 'Shows the email content for the selected row without sending.', 'Use when checking wording.'],
    ['Button', YDP_MENTOR_CONFIG.menuName, 'Send mentor email to selected row', 'Sends the registration email to one selected mentor if not already sent.', 'Use for a single controlled send.'],
    ['Button', YDP_MENTOR_CONFIG.menuName, 'Send mentor email to all unsent rows', 'Sends registration emails only to rows not already marked SENT.', 'Use carefully for bulk sends.'],
    ['Button', YDP_MENTOR_CONFIG.menuName, 'Send already registered mentor update to all unsent rows', 'Sends the already-registered update to older rows that have not received it.', 'Use for existing applicants.'],
    ['Button', YDP_MENTOR_CONFIG.menuName, 'Send onboarding reminder to all unsent rows', 'Sends the July 18 onboarding reminder only to mentors who have not received this reminder.', 'Preview and test first, then use for the approved campaign.'],
    ['Button', YDP_MENTOR_CONFIG.menuName, 'Repair missing sent date for selected row', 'Adds a missing sent date where status already says SENT.', 'Use only to repair tracking.'],
    ['Button', YDP_MENTOR_CONFIG.menuName, 'Resend email to selected row', 'Force resends one selected row.', 'Use only when you intentionally want a duplicate email sent.']
  ];
}

function getOrCreateYdpMentorDictionarySheet_() {
  return SpreadsheetApp.getActive().getSheetByName('Data Dictionary') || SpreadsheetApp.getActive().insertSheet('Data Dictionary');
}

function writeYdpMentorDataDictionary_(sheet, rows) {
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
  sheet.autoResizeColumns(1, rows[0].length);
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
    '<h2>Onboarding Reminder</h2>',
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
      subject: 'YDP Mentorship onboarding is this Saturday',
      body: [
        'Hi ' + firstName + ',',
        '',
        'Thank you for coming this far with the YDP Mentorship Program.',
        '',
        'Our onboarding session is this Saturday, July 18, 2026.',
        '',
        'Before the onboarding session, you will receive your assigned mentee details, including information for every mentee assigned to you.',
        '',
        'Please keep an eye on your email for the assignment update and the onboarding details.',
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

