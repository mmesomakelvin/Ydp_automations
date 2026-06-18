const YDP_MENTEE_CONFIG = {
  sheetName: 'Form_Responses',
  senderName: 'YDP Mentorship Team',
  startDateText: 'July 10, 2026',
  menuName: 'YDP Automation',
  headers: {
    email: 'Email Address',
    firstName: 'First Name',
    lastName: 'Last Name',
    registrationStatus: 'Mentee Registration Email Status',
    registrationSentAt: 'Mentee Registration Email Sent At',
    alreadyRegisteredStatus: 'Already Registered Email Status',
    alreadyRegisteredSentAt: 'Already Registered Email Sent At',
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
    .addSeparator()
    .addItem('Send test mentee email', 'sendTestYdpMenteeEmail')
    .addItem('Preview selected row email', 'previewSelectedYdpMenteeEmail')
    .addSeparator()
    .addItem('Send mentee email to selected row', 'sendYdpMenteeRegistrationEmailToSelectedRow')
    .addItem('Send mentee email to all unsent rows', 'sendYdpMenteeRegistrationEmailsToAllUnsentRows')
    .addItem('Send already registered mentee update to all unsent rows', 'sendYdpAlreadyRegisteredMenteeEmailsToAllUnsentRows')
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
    const sheet = getYdpMenteeSheet_();
    const row = e && e.range ? e.range.getRow() : sheet.getLastRow();

    if (row <= 1) {
      return;
    }

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
    YDP_MENTEE_CONFIG.headers.lastError
  ];

  const headerMap = getYdpHeaderMap_(sheet);
  trackingHeaders.forEach(function(header) {
    ensureYdpHeader_(sheet, headerMap, header);
  });

  SpreadsheetApp.getActive().toast('YDP email tracking columns are ready.');
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

  const type = promptForYdpEmailType_('Which test email should be sent? Type REGISTRATION or ALREADY.');
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
  const html = [
    '<div style="font-family:Arial,sans-serif;line-height:1.5;padding:8px;">',
    '<h2>Registration Email</h2>',
    '<p><strong>Subject:</strong> ' + escapeYdpHtml_(registrationEmail.subject) + '</p>',
    '<pre style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:6px;">' + escapeYdpHtml_(registrationEmail.body) + '</pre>',
    '<h2>Already Registered Update</h2>',
    '<p><strong>Subject:</strong> ' + escapeYdpHtml_(alreadyRegisteredEmail.subject) + '</p>',
    '<pre style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:6px;">' + escapeYdpHtml_(alreadyRegisteredEmail.body) + '</pre>',
    '</div>'
  ].join('');

  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(720).setHeight(620),
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

function resendYdpMenteeEmailToSelectedRow() {
  const type = promptForYdpEmailType_('Which email should be resent? Type REGISTRATION or ALREADY.');
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
  const lastErrorColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.lastError);
  const rowData = getYdpRowData_(sheet, row);
  const recipient = String(rowData[YDP_MENTEE_CONFIG.headers.email] || '').trim();
  const currentStatus = String(sheet.getRange(row, statusColumn).getValue() || '').trim();

  if (!isValidYdpEmail_(recipient)) {
    sheet.getRange(row, statusColumn).setValue(YDP_MENTEE_CONFIG.statuses.error);
    sheet.getRange(row, lastErrorColumn).setValue('Missing or invalid email address.');
    return { row: row, sent: false, skipped: false, error: 'Missing or invalid email address.' };
  }

  if (!settings.force && currentStatus === YDP_MENTEE_CONFIG.statuses.sent) {
    return { row: row, sent: false, skipped: true, reason: 'Already sent.' };
  }

  if (!settings.force && hasYdpMenteeEmailAlreadyBeenSent_(sheet, recipient, row)) {
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
  return type === 'ALREADY'
    ? YDP_MENTEE_CONFIG.headers.alreadyRegisteredStatus
    : YDP_MENTEE_CONFIG.headers.registrationStatus;
}

function getYdpSentAtHeaderForType_(type) {
  return type === 'ALREADY'
    ? YDP_MENTEE_CONFIG.headers.alreadyRegisteredSentAt
    : YDP_MENTEE_CONFIG.headers.registrationSentAt;
}

function hasYdpMenteeEmailAlreadyBeenSent_(sheet, recipient, currentRow) {
  const headerMap = getYdpHeaderMap_(sheet);
  const emailColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.email);
  const registrationStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.registrationStatus);
  const alreadyRegisteredStatusColumn = getYdpHeaderColumn_(headerMap, YDP_MENTEE_CONFIG.headers.alreadyRegisteredStatus);
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

    return email === normalizedRecipient &&
      (registrationStatus === YDP_MENTEE_CONFIG.statuses.sent ||
        alreadyRegisteredStatus === YDP_MENTEE_CONFIG.statuses.sent);
  });
}

function promptForYdpEmailType_(message) {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('YDP mentee email type', message, ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() !== ui.Button.OK) {
    return null;
  }

  const type = response.getResponseText().trim().toUpperCase();
  if (type !== 'REGISTRATION' && type !== 'ALREADY') {
    ui.alert('Please type REGISTRATION or ALREADY.');
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
