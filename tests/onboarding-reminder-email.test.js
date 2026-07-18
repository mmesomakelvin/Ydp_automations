const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadScript(relativePath) {
  const scriptPath = path.join(__dirname, '..', relativePath);
  const source = fs.readFileSync(scriptPath, 'utf8');
  const context = { console };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { context, source };
}

const mentee = loadScript('YDP Mentee Email.gs');
const menteeEmail = mentee.context.buildYdpMenteeEmail_({ firstName: 'Ada' }, 'ONBOARDING');

assert.strictEqual(mentee.context.getYdpStatusHeaderForType_('ONBOARDING'), 'Onboarding Reminder Email Status');
assert.strictEqual(mentee.context.getYdpSentAtHeaderForType_('ONBOARDING'), 'Onboarding Reminder Email Sent At');
assert.strictEqual(typeof mentee.context.sendYdpMenteeOnboardingRemindersToAllUnsentRows, 'function');
assert.ok(mentee.source.includes(".addItem('Send onboarding reminder to all unsent rows'"));
assert.ok(menteeEmail.subject.includes('onboarding is this Saturday'));
assert.ok(menteeEmail.body.includes('Thank you for coming this far'));
assert.ok(menteeEmail.body.includes('Saturday, July 18, 2026'));
assert.ok(menteeEmail.body.includes('whether you have been selected'));
assert.ok(menteeEmail.body.includes('mentor details'));
assert.ok(menteeEmail.body.includes('YDP Mentorship Team'));
assert.ok(mentee.context.getYdpMenteeDataDictionaryRows_().some((row) => row.includes('Onboarding Reminder Email Status')));

const mentor = loadScript(path.join('mentor', 'YDP Mentor Email.gs'));
const mentorEmail = mentor.context.buildYdpMentorEmail_({ firstName: 'Musa' }, 'ONBOARDING');

assert.strictEqual(mentor.context.getYdpStatusHeaderForType_('ONBOARDING'), 'Onboarding Reminder Email Status');
assert.strictEqual(mentor.context.getYdpSentAtHeaderForType_('ONBOARDING'), 'Onboarding Reminder Email Sent At');
assert.strictEqual(typeof mentor.context.sendYdpMentorOnboardingRemindersToAllUnsentRows, 'function');
assert.ok(mentor.source.includes(".addItem('Send onboarding reminder to all unsent rows'"));
assert.ok(mentorEmail.subject.includes('onboarding is today'));
assert.ok(mentorEmail.body.includes('sincere apologies for the delay'));
assert.ok(mentorEmail.body.includes('Saturday, July 18, 2026'));
assert.ok(mentorEmail.body.includes('YDP Mentor Onboarding - Cohort 2'));
assert.ok(mentorEmail.body.includes('4:00 PM - 4:30 PM'));
assert.ok(mentorEmail.body.includes('Africa/Lagos'));
assert.ok(mentorEmail.body.includes('https://meet.google.com/sdy-fnow-sdn'));
assert.ok(mentorEmail.body.includes('https://parallel-energy-ffe.notion.site/YDP-Mentoring-Program-Cohort-II-39a03cfeb35b80ecbf89daaaf6059f3d'));
assert.ok(mentorEmail.body.includes('deeply valued'));
assert.ok(mentorEmail.body.includes('important part of this program'));
assert.ok(mentorEmail.body.includes('continue to update'));
assert.ok(mentorEmail.body.includes('look forward to beginning this journey with you'));
assert.ok(mentorEmail.body.includes('YDP Mentorship Team'));
const mentorEmailHtml = mentor.context.convertYdpPlainTextToHtml_(mentorEmail.body);
assert.ok(mentorEmailHtml.includes('<a href="https://meet.google.com/sdy-fnow-sdn"'));
assert.ok(mentorEmailHtml.includes('<a href="https://parallel-energy-ffe.notion.site/YDP-Mentoring-Program-Cohort-II-39a03cfeb35b80ecbf89daaaf6059f3d"'));
assert.ok(mentor.context.getYdpMentorDataDictionaryRows_().some((row) => row.includes('Onboarding Reminder Email Status')));

console.log('onboarding reminder email tests passed');
