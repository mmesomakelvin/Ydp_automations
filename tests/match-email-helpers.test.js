const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scriptPath = path.join(__dirname, '..', 'matching', 'YDP Matching Automation.gs');
const scriptSource = fs.readFileSync(scriptPath, 'utf8');
const context = { console };

vm.createContext(context);
vm.runInContext(scriptSource, context);

assert.strictEqual(typeof context.getYdpMatchEmailTrackingHeaders_, 'function');
assert.strictEqual(JSON.stringify(context.getYdpMatchEmailTrackingHeaders_()), JSON.stringify([
  'Mentee Match Email Status',
  'Mentee Match Email Sent At',
  'Mentor Match Email Status',
  'Mentor Match Email Sent At',
  'Match Email Last Error'
]));

const matchedPairHeaders = context.getYdpMatchedPairsHeaders_();
assert.ok(matchedPairHeaders.includes('Mentee Match Email Status'));
assert.ok(matchedPairHeaders.includes('Mentor Match Email Status'));
assert.ok(matchedPairHeaders.includes('Match Email Last Error'));

assert.strictEqual(typeof context.buildYdpMatchEmailMessages_, 'function');
const messages = context.buildYdpMatchEmailMessages_({
  menteeName: 'Ada Mentee',
  menteeEmail: 'ada@example.com',
  mentorName: 'Musa Mentor',
  mentorEmail: 'musa@example.com',
  track: 'Data Analyst'
});

assert.strictEqual(messages.mentee.to, 'ada@example.com');
assert.ok(messages.mentee.subject.includes('YDP Mentorship Match'));
assert.ok(messages.mentee.body.includes('Musa Mentor'));
assert.ok(messages.mentee.body.includes('musa@example.com'));
assert.ok(messages.mentee.body.includes('YDP Mentorship Team'));

assert.strictEqual(messages.mentor.to, 'musa@example.com');
assert.ok(messages.mentor.subject.includes('YDP Mentorship Mentee Assignment'));
assert.ok(messages.mentor.body.includes('Ada Mentee'));
assert.ok(messages.mentor.body.includes('ada@example.com'));
assert.ok(messages.mentor.body.includes('Data Analyst'));

assert.strictEqual(typeof context.buildYdpMatchEmailSendPlan_, 'function');
assert.strictEqual(JSON.stringify(context.buildYdpMatchEmailSendPlan_({
  menteeEmail: 'ada@example.com',
  mentorEmail: 'musa@example.com',
  menteeMatchEmailStatus: '',
  mentorMatchEmailStatus: ''
})), JSON.stringify({
  sendMentee: true,
  sendMentor: true,
  skippedReason: ''
}));

assert.strictEqual(JSON.stringify(context.buildYdpMatchEmailSendPlan_({
  menteeEmail: 'ada@example.com',
  mentorEmail: 'musa@example.com',
  menteeMatchEmailStatus: 'SENT',
  mentorMatchEmailStatus: ''
})), JSON.stringify({
  sendMentee: false,
  sendMentor: true,
  skippedReason: ''
}));

assert.strictEqual(JSON.stringify(context.buildYdpMatchEmailSendPlan_({
  menteeEmail: 'ada@example.com',
  mentorEmail: 'musa@example.com',
  menteeMatchEmailStatus: 'SENT',
  mentorMatchEmailStatus: 'SENT'
})), JSON.stringify({
  sendMentee: false,
  sendMentor: false,
  skippedReason: 'Both match emails have already been sent.'
}));

assert.strictEqual(JSON.stringify(context.buildYdpMatchEmailSendPlan_({
  menteeEmail: '',
  mentorEmail: 'musa@example.com',
  menteeMatchEmailStatus: '',
  mentorMatchEmailStatus: ''
})), JSON.stringify({
  sendMentee: false,
  sendMentor: false,
  skippedReason: 'Missing or invalid mentee/mentor email address.'
}));

console.log('match email helper tests passed');
