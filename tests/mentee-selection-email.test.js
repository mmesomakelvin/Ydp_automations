const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scriptPath = path.join(__dirname, '..', 'matching', 'YDP Matching Automation.gs');
const scriptSource = fs.readFileSync(scriptPath, 'utf8');
const context = { console };

vm.createContext(context);
vm.runInContext(scriptSource, context);

assert.strictEqual(typeof context.getYdpMenteeSelectionEmailTrackingHeaders_, 'function');
assert.strictEqual(JSON.stringify(context.getYdpMenteeSelectionEmailTrackingHeaders_()), JSON.stringify([
  'Selection Email Status',
  'Selection Email Sent At',
  'Selection Email Last Error'
]));
assert.strictEqual(
  context.getYdpMenteeScoresHeaders_().includes('Selection Email Status'),
  false,
  'Selection tracking must stay outside the scoring write range so rescoring cannot erase it.'
);
assert.ok(
  scriptSource.includes('ensureYdpAdditionalHeaders_(menteeScoresSheet, getYdpMenteeSelectionEmailTrackingHeaders_())'),
  'Matching setup must append the selection tracking columns non-destructively.'
);

assert.strictEqual(typeof context.isYdpMenteeEligibleForSelectionEmail_, 'function');
assert.strictEqual(context.isYdpMenteeEligibleForSelectionEmail_({ geminiReviewStatus: 'Can Pair' }), true);
assert.strictEqual(context.isYdpMenteeEligibleForSelectionEmail_({ geminiReviewStatus: 'Do Not Pair' }), false);
assert.strictEqual(context.isYdpMenteeEligibleForSelectionEmail_({ geminiReviewStatus: 'ERROR' }), false);

assert.strictEqual(typeof context.buildYdpMenteeSelectionEmail_, 'function');
const email = context.buildYdpMenteeSelectionEmail_({
  menteeName: 'Ada Mentee',
  menteeEmail: 'ada@example.com'
});

assert.strictEqual(email.to, 'ada@example.com');
assert.strictEqual(email.subject, "You've been selected for the YDP Mentorship Program");
assert.ok(email.body.includes('Hi Ada,'));
assert.ok(email.body.includes('selected as a mentee'));
assert.ok(email.body.includes('Saturday, July 18, 2026'));
assert.ok(email.body.includes('mentor match'));
assert.ok(email.body.includes('YDP Mentorship Team'));

assert.strictEqual(typeof context.buildYdpMenteeSelectionEmailSendPlan_, 'function');
assert.strictEqual(JSON.stringify(context.buildYdpMenteeSelectionEmailSendPlan_({
  menteeEmail: 'ada@example.com',
  geminiReviewStatus: 'Can Pair',
  selectionEmailStatus: ''
})), JSON.stringify({
  send: true,
  skippedReason: ''
}));

assert.strictEqual(JSON.stringify(context.buildYdpMenteeSelectionEmailSendPlan_({
  menteeEmail: 'ada@example.com',
  geminiReviewStatus: 'Do Not Pair',
  selectionEmailStatus: ''
})), JSON.stringify({
  send: false,
  skippedReason: 'This mentee is not marked Can Pair.'
}));

assert.strictEqual(JSON.stringify(context.buildYdpMenteeSelectionEmailSendPlan_({
  menteeEmail: 'ada@example.com',
  geminiReviewStatus: 'Can Pair',
  selectionEmailStatus: 'SENT'
})), JSON.stringify({
  send: false,
  skippedReason: 'The selection email has already been sent.'
}));

assert.strictEqual(JSON.stringify(context.buildYdpMenteeSelectionEmailSendPlan_({
  menteeEmail: 'ada@example.com',
  geminiReviewStatus: 'Can Pair',
  selectionEmailStatus: 'sent'
})), JSON.stringify({
  send: false,
  skippedReason: 'The selection email has already been sent.'
}));

assert.strictEqual(JSON.stringify(context.buildYdpMenteeSelectionEmailSendPlan_({
  menteeEmail: 'ada@example.com',
  geminiReviewStatus: 'Can Pair',
  selectionEmailStatus: 'SENDING'
})), JSON.stringify({
  send: false,
  skippedReason: 'The selection email is currently being processed. Review the row before retrying.'
}));

assert.strictEqual(JSON.stringify(context.buildYdpMenteeSelectionEmailSendPlan_({
  menteeEmail: 'not-an-email',
  geminiReviewStatus: 'Can Pair',
  selectionEmailStatus: ''
})), JSON.stringify({
  send: false,
  skippedReason: 'Missing or invalid mentee email address.'
}));

assert.strictEqual(typeof context.previewSelectedYdpMenteeSelectionEmail, 'function');
assert.strictEqual(typeof context.sendTestYdpMenteeSelectionEmail, 'function');
assert.strictEqual(typeof context.sendYdpMenteeSelectionEmailToSelectedRow, 'function');
assert.strictEqual(typeof context.sendYdpMenteeSelectionEmailsToAllEligibleUnsent, 'function');

[
  'Preview selected selection email',
  'Send test selection email',
  'Send selection email to selected mentee',
  'Send selection emails to all eligible unsent mentees'
].forEach((label) => {
  assert.ok(scriptSource.includes(`.addItem('${label}'`), `Missing menu item: ${label}`);
});

assert.ok(scriptSource.includes('LockService.getDocumentLock()'), 'Live selection sends must use a document lock.');
assert.ok(scriptSource.includes('.tryLock('), 'Live selection sends must refuse overlapping runs.');
assert.ok(scriptSource.includes('.releaseLock()'), 'Live selection sends must always release their document lock.');

const dictionaryRows = context.getYdpMatchingDataDictionaryRows_();
assert.ok(dictionaryRows.some((row) => row.includes('Selection Email Status')));
assert.ok(dictionaryRows.some((row) => row.includes('Send selection emails to all eligible unsent mentees')));

function createFakeMenteeScoresSheet({
  email = 'ada@example.com',
  reviewStatus = 'Can Pair',
  selectionStatus = '',
  failOnHeader = ''
} = {}) {
  const headers = context.getYdpMenteeScoresHeaders_().concat(context.getYdpMenteeSelectionEmailTrackingHeaders_());
  const row = Array(headers.length).fill('');
  row[headers.indexOf('Mentee ID')] = 'YDP-C2-Mentee-001';
  row[headers.indexOf('Mentee Name')] = 'Ada Mentee';
  row[headers.indexOf('Mentee Email')] = email;
  row[headers.indexOf('Gemini Review Status')] = reviewStatus;
  row[headers.indexOf('Selection Email Status')] = selectionStatus;
  const cells = [headers, row];

  return {
    cells,
    getLastColumn() {
      return headers.length;
    },
    getRange(rowNumber, columnNumber, numberOfRows = 1, numberOfColumns = 1) {
      return {
        getValues() {
          return cells
            .slice(rowNumber - 1, rowNumber - 1 + numberOfRows)
            .map((sourceRow) => sourceRow.slice(columnNumber - 1, columnNumber - 1 + numberOfColumns));
        },
        setValue(value) {
          if (rowNumber === 2 && headers[columnNumber - 1] === failOnHeader) {
            throw new Error('Simulated tracking write failure.');
          }
          cells[rowNumber - 1][columnNumber - 1] = value;
          return this;
        }
      };
    }
  };
}

const sentMessages = [];
context.MailApp = {
  sendEmail(message) {
    sentMessages.push(message);
  }
};

const successfulSheet = createFakeMenteeScoresSheet();
const successfulResult = context.sendYdpMenteeSelectionEmailForRow_(successfulSheet, 2);
const successfulHeaders = successfulSheet.cells[0];
assert.strictEqual(successfulResult.sent, true);
assert.strictEqual(sentMessages.length, 1);
assert.strictEqual(sentMessages[0].to, 'ada@example.com');
assert.strictEqual(successfulSheet.cells[1][successfulHeaders.indexOf('Selection Email Status')], 'SENT');
assert.ok(successfulSheet.cells[1][successfulHeaders.indexOf('Selection Email Sent At')]);
assert.strictEqual(successfulSheet.cells[1][successfulHeaders.indexOf('Selection Email Last Error')], '');

const invalidEmailSheet = createFakeMenteeScoresSheet({ email: 'not-an-email' });
const invalidEmailResult = context.sendYdpMenteeSelectionEmailForRow_(invalidEmailSheet, 2);
const invalidHeaders = invalidEmailSheet.cells[0];
assert.ok(invalidEmailResult.error.includes('invalid mentee email'));
assert.strictEqual(sentMessages.length, 1);
assert.strictEqual(invalidEmailSheet.cells[1][invalidHeaders.indexOf('Selection Email Status')], 'ERROR');
assert.ok(invalidEmailSheet.cells[1][invalidHeaders.indexOf('Selection Email Last Error')].includes('invalid mentee email'));

const uncertainDeliverySheet = createFakeMenteeScoresSheet({ failOnHeader: 'Selection Email Sent At' });
const uncertainDeliveryResult = context.sendYdpMenteeSelectionEmailForRow_(uncertainDeliverySheet, 2);
const uncertainHeaders = uncertainDeliverySheet.cells[0];
assert.ok(uncertainDeliveryResult.error.includes('Simulated tracking write failure'));
assert.strictEqual(sentMessages.length, 2, 'The simulated failure happens after MailApp dispatches the email.');
assert.strictEqual(
  uncertainDeliverySheet.cells[1][uncertainHeaders.indexOf('Selection Email Status')],
  'SENDING',
  'An uncertain post-dispatch failure must remain protected from automatic resend.'
);
assert.ok(
  uncertainDeliverySheet.cells[1][uncertainHeaders.indexOf('Selection Email Last Error')].includes('email was dispatched')
);

console.log('mentee selection email tests passed');
