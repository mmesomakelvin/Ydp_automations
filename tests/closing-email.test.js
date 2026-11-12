const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scriptPath = path.join(__dirname, '..', 'matching', 'YDP Matching Automation.gs');
const source = fs.readFileSync(scriptPath, 'utf8');
const context = { console };
vm.createContext(context);
vm.runInContext(source, context);

// Menu wiring: every closing handler exists and is on the menu.
[
  'buildYdpFinalFeedbackForms', 'resetYdpFinalFeedbackFormLinks',
  'previewYdpMenteeClosing', 'sendYdpMenteeClosingTest', 'sendYdpMenteeClosingToAll',
  'previewYdpMentorClosing', 'sendYdpMentorClosingTest', 'sendYdpMentorClosingToAll'
].forEach(function(name) {
  assert.strictEqual(typeof context[name], 'function', name + ' should exist');
  assert.ok(source.indexOf("'" + name + "')") !== -1, name + ' should be on the menu');
});

// New tabs, properties, and tracking columns never reuse an earlier round's.
const closing = vm.runInContext('YDP_CLOSING', context);
const oldValues = vm.runInContext(
  '[YDP_FEEDBACK_FORM, YDP_FEEDBACK_TRACKING, YDP_MENTOR_FEEDBACK_FORM, YDP_MENTOR_FEEDBACK_TRACKING]' +
  '.map(function(o) { return Object.keys(o).map(function(k) { return o[k]; }); })' +
  '.reduce(function(a, b) { return a.concat(b); }, []).concat(["Feedback Responses", "Feedback Sent", "Feedback Sent At"])',
  context
);
['mentee', 'mentor'].forEach(function(audience) {
  const cfg = closing[audience];
  ['responsesSheetName', 'propFormId', 'propPublishedUrl', 'propEditUrl', 'propPrefill', 'statusHeader', 'sentAtHeader'].forEach(function(key) {
    assert.ok(cfg[key], audience + '.' + key + ' should be set');
    assert.strictEqual(oldValues.indexOf(cfg[key]), -1, audience + '.' + key + ' must not reuse an earlier round');
  });
});
assert.notStrictEqual(closing.mentee.statusHeader, closing.mentor.statusHeader);
assert.notStrictEqual(closing.mentee.responsesSheetName, closing.mentor.responsesSheetName);

// Recipients: one per unique email, all rows kept, partners de-duplicated.
const headerMap = {
  'Mentee ID': 1, 'Mentee Name': 2, 'Mentee Email': 3,
  'Mentor ID': 4, 'Mentor Name': 5, 'Mentor Email': 6
};
const rows = [
  ['YDP-C2-Mentee-001', 'Ada Obi', 'ada@example.com', 'YDP-C2-Mentor-001', 'Israel Odeajo', 'israel@example.com'],
  ['YDP-C2-Mentee-002', 'Fatai Omoniyi', 'fatai@example.com', 'YDP-C2-Mentor-001', 'Israel Odeajo', 'ISRAEL@example.com'],
  ['YDP-C2-Mentee-003', 'Bola Ade', 'not-an-email', 'YDP-C2-Mentor-002', 'Kola Kushimo', 'kola@example.com'],
  ['', 'No Id', 'noid@example.com', '', '', '']
];

const mentees = context.buildYdpClosingRecipients_('mentee', rows, headerMap);
assert.deepStrictEqual(Array.from(mentees, function(r) { return r.email; }), ['ada@example.com', 'fatai@example.com']);
assert.deepStrictEqual(Array.from(mentees[0].rowNumbers), [2]);
assert.deepStrictEqual(Array.from(mentees[0].partnerFirstNames), ['Israel']);
assert.strictEqual(mentees[0].id, 'YDP-C2-Mentee-001');

const mentors = context.buildYdpClosingRecipients_('mentor', rows, headerMap);
assert.deepStrictEqual(Array.from(mentors, function(r) { return r.email; }), ['israel@example.com', 'kola@example.com']);
assert.deepStrictEqual(Array.from(mentors[0].rowNumbers), [2, 3]);
assert.deepStrictEqual(Array.from(mentors[0].partnerFirstNames), ['Ada', 'Fatai']);
assert.deepStrictEqual(Array.from(mentors[1].partnerFirstNames), ['Bola']);

// Prefill link.
const url = context.buildYdpClosingPrefillUrlFrom_(
  { publishedUrl: 'https://docs.google.com/forms/d/e/abc/viewform', prefill: { id: '11', email: '22', name: '33' } },
  'YDP-C2-Mentee-001', 'ada@example.com', 'Ada Obi'
);
assert.strictEqual(url, 'https://docs.google.com/forms/d/e/abc/viewform?usp=pp_url&entry.11=YDP-C2-Mentee-001&entry.22=ada%40example.com&entry.33=Ada%20Obi');

// Email copy: says it has ended, gives next steps, certificate for both audiences.
const formUrl = 'https://example.com/form?x=1&y=2';
const menteeEmail = context.buildYdpClosingEmail_('mentee', mentees[0], formUrl, 'data:image/png;base64,AAA');
assert.strictEqual(menteeEmail.subject, 'The YDP Mentorship Program has officially ended. Thank you, Ada!');
[menteeEmail.body, menteeEmail.htmlBody].forEach(function(text) {
  assert.ok(/officially ended on (<strong>)?Sunday, 1 November 2026/.test(text));
  assert.ok(text.indexOf('certificate of participation') !== -1);
  assert.ok(text.indexOf('alumni group') !== -1);
  assert.ok(text.indexOf('Israel') !== -1);
  assert.ok(text.indexOf('Congratulations!') !== -1);
});
assert.ok(menteeEmail.body.indexOf(formUrl) !== -1);
assert.ok(menteeEmail.htmlBody.indexOf('https://example.com/form?x=1&amp;y=2') !== -1);
assert.ok(menteeEmail.htmlBody.indexOf('data:image/png;base64,AAA') !== -1);

const mentorEmail = context.buildYdpClosingEmail_('mentor', mentors[0], formUrl, 'data:image/png;base64,AAA');
assert.strictEqual(mentorEmail.subject, 'The YDP Mentorship Program has officially ended. Thank you for mentoring, Israel!');
[mentorEmail.body, mentorEmail.htmlBody].forEach(function(text) {
  assert.ok(text.indexOf('Ada and Fatai') !== -1);
  assert.ok(text.indexOf('certificate of participation for mentoring') !== -1);
  assert.ok(text.indexOf('alumni group') !== -1);
  assert.ok(text.indexOf('Congratulations!') === -1);
});
assert.ok(mentorEmail.htmlBody.indexOf('you were a mentor in Cohort 2') !== -1);

// Names are escaped in HTML.
const tricky = context.buildYdpClosingEmail_('mentee',
  { firstName: '<b>X</b>', partnerFirstNames: ['A&B'] }, formUrl, 'data:x');
assert.ok(tricky.htmlBody.indexOf('<b>X</b>') === -1);
assert.ok(tricky.htmlBody.indexOf('A&amp;B') !== -1);

// Missing names fall back gracefully.
const anon = context.buildYdpClosingEmail_('mentor', { firstName: 'there', partnerFirstNames: [] }, formUrl, 'data:x');
assert.strictEqual(anon.subject, 'The YDP Mentorship Program has officially ended. Thank you for mentoring!');
assert.ok(anon.body.indexOf('your mentee(s)') !== -1);

console.log('closing-email tests passed');
