const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scriptPath = path.join(__dirname, '..', 'matching', 'YDP Matching Automation.gs');
const scriptSource = fs.readFileSync(scriptPath, 'utf8');
const context = { console };
vm.createContext(context);
vm.runInContext(scriptSource, context);

const cfg = vm.runInContext('YDP_FEEDBACK_FOLLOWUP', context);
const rules = vm.runInContext('YDP_FOLLOWUP_COLUMN_RULES', context);
assert.strictEqual(cfg.programEndLabel, 'October 27');
assert.strictEqual(cfg.responsesSheetName, 'October Feedback Responses');

// Experience label -> template.
assert.strictEqual(context.getYdpFollowupCategory_('Good Experience'), 'good');
assert.strictEqual(context.getYdpFollowupCategory_('Somewhat good'), 'somewhat');
assert.strictEqual(context.getYdpFollowupCategory_('Bad Experience'), 'bad');
assert.strictEqual(context.getYdpFollowupCategory_(''), '');
assert.strictEqual(context.getYdpFollowupCategory_('Not sure'), '');
assert.strictEqual(context.getYdpFollowupTracker_('good'), 'Green');
assert.strictEqual(context.getYdpFollowupTracker_('somewhat'), 'Amber');
assert.strictEqual(context.getYdpFollowupTracker_('bad'), 'Red');

// Headers as they appear on the October responses tab.
const headers = [
  'Timestamp', 'Mentee ID', 'Mentee Email address', 'Mentee Name',
  'In the past month, how many sessions have you had with your mentor?',
  'Right now, is your mentor easy to reach and engaged?',
  'How much progress have you made toward what you wanted from the program?',
  'Right now, how would you rate your mentorship experience?',
  'Is there anything you need from your mentor or the YDP team before the program ends on October 31?',
  'Anything going well, or anything else you would like to share?',
  'Experience', 'Mail Status Column', 'Mentor ID', 'Mentor Name', 'Mentor Email', 'Track',
  'Follow-up Status', 'Follow-up Sent At', 'Follow-up Email Text'
];
const trackingMap = {};
headers.forEach((h, i) => { trackingMap[h] = i + 1; });
// "Experience" must match the label column, not the rating question that contains the word.
assert.strictEqual(context.findYdpFollowupColumn_(headers, rules.experience), 10);
assert.strictEqual(context.findYdpFollowupColumn_(['Right now, how would you rate your mentorship experience?'], rules.experience), -1);

const lookup = {
  'YDP-C2-MENTEE-021': { 'Mentor ID': 'YDP-C2-Mentor-010', 'Mentor Name': 'Kolawole Kushimo', 'Mentor Email': 'k@example.com', 'Track': 'Analytics Engineer' }
};
const row = [
  '10/4/2026', 'YDP-C2-Mentee-021', 'f@example.com', 'Fatai Omoniyi', '1', 'Rarely responds', 'Not much yet', 2,
  'I plan to create two end to end analytic engineering projects', 'Need active mentor',
  'Bad Experience', '', '', '', '', '', '', '', ''
];
const r = context.readYdpFollowupResponse_(headers, row, 3, lookup, trackingMap);
assert.strictEqual(r.rowNumber, 3);
assert.strictEqual(r.firstName, 'Fatai');
assert.strictEqual(r.category, 'bad');
assert.strictEqual(r.reach, 'Rarely responds');
assert.strictEqual(r.rating, '2');
assert.strictEqual(r.needs, 'I plan to create two end to end analytic engineering projects');
assert.strictEqual(r.comments, 'Need active mentor');
assert.strictEqual(r.mentorFirstName, 'Kolawole');
assert.strictEqual(r.track, 'Analytics Engineer');
assert.strictEqual(r.status, '');
assert.strictEqual(context.getYdpFollowupSkipReason_(r), '');

// Skip rules.
const skip = (overrides) => context.getYdpFollowupSkipReason_(Object.assign({}, r, overrides));
assert.strictEqual(skip({ status: 'SENT' }), 'already sent');
assert.ok(skip({ status: 'SENDING' }).startsWith('stuck in SENDING'));
assert.strictEqual(skip({ manualMailStatus: 'Mail Sent' }), 'already emailed by hand');
assert.strictEqual(skip({ email: 'not-an-email' }), 'no valid email');
assert.strictEqual(skip({ name: '' }), 'no mentee name');
assert.strictEqual(skip({ category: '' }), 'Experience not set');
assert.strictEqual(skip({ menteeId: '', email: '', name: '' }), 'empty row');
assert.strictEqual(skip({ status: 'DRAFTED' }), '');
assert.strictEqual(skip({ status: 'ERROR' }), '');

// Prompt uses the right template, the follow-up end date, and the answers.
const prompt = context.buildYdpFollowupPrompt_(r);
assert.ok(prompt.includes('labelled this mentee: Bad Experience'));
assert.ok(prompt.includes('The programme ends on October 27.'));
assert.ok(prompt.includes('We are sorry that your experience has not been as valuable'));
assert.ok(prompt.includes('Rarely responds'));
assert.ok(prompt.includes('"mentorFirstName":"Kolawole"'));
assert.ok(!prompt.includes('October 31'), 'the follow-up must not repeat the form end date');
const goodPrompt = context.buildYdpFollowupPrompt_(Object.assign({}, r, { category: 'good' }));
assert.ok(goodPrompt.includes('labelled this mentee: Good Experience'));
const somewhatPrompt = context.buildYdpFollowupPrompt_(Object.assign({}, r, { category: 'somewhat' }));
assert.ok(somewhatPrompt.includes('labelled this mentee: Somewhat good'));

// Draft: the script adds greeting and sign-off around Gemini's paragraphs.
const good = {
  paragraphs: [
    'Thank you for taking the time to share your feedback with us regarding your experience in the YDP Mentorship Programme.',
    'We noted your concern that you have only had one session with your mentor so far.',
    'As we approach the end of the programme on October 27, we would like to understand where you are stuck.',
    'Thank you again for being open with your feedback.'
  ],
  nextAction: 'Follow up on project guidance',
  mentorFollowUp: ''
};
const draft = context.buildYdpFollowupDraft_(good, r);
assert.ok(draft.text.startsWith('Dear Fatai,\n\nThank you for taking the time'));
assert.ok(draft.text.endsWith('Warm regards,\nYDP Mentorship Team'));
assert.strictEqual(draft.tracker, 'Red');
assert.strictEqual(draft.nextAction, 'Follow up on project guidance');
assert.ok(draft.mentorFollowUp.startsWith('Yes'), 'bad experiences always flag the mentor');
assert.strictEqual(
  context.buildYdpFollowupDraft_(good, Object.assign({}, r, { category: 'good' })).mentorFollowUp,
  'No'
);

// Unusable Gemini replies are rejected so nothing is sent.
const bad = (paragraphs) => () => context.buildYdpFollowupDraft_({ paragraphs }, r);
assert.throws(bad(['Only one paragraph here.', 'Two.']), /expected 3 to 6/);
assert.throws(bad(good.paragraphs.concat(['Hello [Mentor Name], thanks.'])), /brackets or a placeholder/);
assert.throws(bad(['Dear Fatai,'].concat(good.paragraphs)), /greeting or sign-off/);
assert.throws(bad(good.paragraphs.concat(['Warm regards, the team'])), /greeting or sign-off/);
assert.throws(bad(good.paragraphs.concat(['The programme ends on October 31.'])), /date other than October 27/);
assert.throws(() => context.buildYdpFollowupDraft_({}, r), /expected 3 to 6/);

// Email built from saved text.
const email = context.buildYdpFollowupEmail_(draft.text, 'data:image/png;base64,AAAA');
assert.strictEqual(email.subject, 'Thank you for your YDP Mentorship feedback');
assert.strictEqual(email.body, draft.text);
assert.ok(email.htmlBody.includes('<p style="margin:0 0 16px 0;">Dear Fatai,</p>'));
assert.ok(email.htmlBody.includes('Warm regards,<br>YDP Mentorship Team'));
assert.ok(context.buildYdpFollowupEmail_('Dear A,\n\n<script>x</script>').htmlBody.includes('&lt;script&gt;'));

// Model fallback with retries and a time limit (fake clock: each request takes 2s).
const busy = () => new Error('Gemini API HTTP 503 UNAVAILABLE: This model is currently experiencing high demand.');
const notFound = () => new Error('Gemini API HTTP 404 NOT_FOUND: models/x is not found.');
function fakeClock() {
  const clock = { t: 0 };
  clock.now = () => clock.t;
  clock.sleeps = [];
  clock.sleep = (ms) => { clock.sleeps.push(ms); clock.t += ms; };
  return clock;
}
assert.deepStrictEqual(Array.from(cfg.busyRetryWaitsMs), [5000, 10000]);
assert.deepStrictEqual(Array.from(cfg.fallbackModels), ['gemini-3.8-flash', 'gemini-3.5-flash-lite']);
assert.ok(cfg.previewTimeBudgetMs < 360000 && cfg.sendRunHardStopMs < 360000, 'limits stay under the 6-minute cutoff');

// Busy model retried twice, missing model skipped, third model answers.
let clock = fakeClock();
const tried = [];
const fallback = context.callYdpGeminiAcrossModels_(['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite'], (model) => {
  tried.push(model);
  clock.t += 2000;
  if (model === 'gemini-3.5-flash') throw busy();
  if (model === 'gemini-3.8-flash') throw notFound();
  return { paragraphs: [] };
}, { waitsMs: [5000, 10000], deadline: 150000, now: clock.now, sleep: clock.sleep });
assert.strictEqual(fallback.model, 'gemini-3.5-flash-lite');
assert.deepStrictEqual(tried, ['gemini-3.5-flash', 'gemini-3.5-flash', 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite']);
assert.deepStrictEqual(clock.sleeps, [5000, 10000]);
assert.strictEqual(fallback.attempts, 'gemini-3.5-flash busy 2s, busy 2s, busy 2s; gemini-3.8-flash not available 2s; gemini-3.5-flash-lite ok 2s');

// All busy: the error is still a "busy" error, so Send ALL stops the run.
clock = fakeClock();
assert.throws(() => context.callYdpGeminiAcrossModels_(['a', 'b'], () => { clock.t += 1000; throw busy(); },
  { waitsMs: [1000], deadline: 100000, now: clock.now, sleep: clock.sleep }),
  (error) => /^Gemini is busy right now \(a busy 1s, busy 1s; b busy 1s, busy 1s\)/.test(error.message) &&
    context.isYdpGeminiServiceUnavailableError_(error));

// Deadline: no new request starts after it, and waits never run past it.
clock = fakeClock();
let slowCalls = 0;
assert.throws(() => context.callYdpGeminiAcrossModels_(['a', 'b', 'c'], () => { slowCalls++; clock.t += 60000; throw busy(); },
  { waitsMs: [5000, 10000], deadline: 150000, now: clock.now, sleep: clock.sleep }),
  (error) => /Stopped to stay inside the Apps Script time limit/.test(error.message) && context.isYdpGeminiServiceUnavailableError_(error));
assert.ok(clock.t <= 150000 + 60000, 'at most one request runs past the deadline');
assert.strictEqual(slowCalls, 3);

// Other errors are thrown straight away without trying more models.
clock = fakeClock();
let otherCalls = 0;
assert.throws(() => context.callYdpGeminiAcrossModels_(['a', 'b'], () => { otherCalls++; throw new Error('Gemini returned invalid JSON.'); },
  { waitsMs: [1000], deadline: 100000, now: clock.now, sleep: clock.sleep }), /invalid JSON/);
assert.strictEqual(otherCalls, 1, 'other errors do not try more models');
assert.strictEqual(typeof context.retryYdpGeminiWhenBusy_, 'undefined');

// Menu, dictionary, and button guide list all three buttons.
[
  ['Preview follow-up email (selected row)', 'previewYdpFeedbackFollowup'],
  ['Send follow-up email — TEST to me (selected row)', 'sendYdpFeedbackFollowupTest'],
  ['Send follow-up emails to ALL unsent responses', 'sendYdpFeedbackFollowupToAll']
].forEach(([label, fn]) => {
  assert.ok(scriptSource.includes(".addItem('" + label + "', '" + fn + "')"), 'menu: ' + label);
  assert.strictEqual(typeof context[fn], 'function');
  assert.ok(context.getYdpMatchingDataDictionaryRows_().some((row) => row.includes(label)), 'dictionary: ' + label);
  assert.ok(context.getYdpButtonGuideRows_().some((row) => row.includes(label)), 'guide: ' + label);
});

console.log('feedback follow-up email tests passed');
