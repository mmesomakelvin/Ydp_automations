const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scriptPath = path.join(__dirname, '..', 'matching', 'YDP Matching Automation.gs');
const scriptSource = fs.readFileSync(scriptPath, 'utf8');
const context = {
  console,
};

vm.createContext(context);
vm.runInContext(scriptSource, context);

assert.strictEqual(typeof context.getYdpPairScoresHeaders_, 'function');

const headers = context.getYdpPairScoresHeaders_();
assert.strictEqual(JSON.stringify(headers), JSON.stringify([
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
]));

assert.strictEqual(typeof context.getYdpMenteeScoresHeaders_, 'function');
const menteeHeaders = context.getYdpMenteeScoresHeaders_();
assert.ok(menteeHeaders.includes('Gemini Review Status'));
assert.strictEqual(menteeHeaders.includes('Review Status'), false);

assert.strictEqual(typeof context.getYdpGeminiReviewStatusForScore_, 'function');
assert.strictEqual(context.getYdpGeminiReviewStatusForScore_(60), 'Can Pair');
assert.strictEqual(context.getYdpGeminiReviewStatusForScore_(100), 'Can Pair');
assert.strictEqual(context.getYdpGeminiReviewStatusForScore_(59), 'Do Not Pair');
assert.strictEqual(context.getYdpGeminiReviewStatusForScore_(''), 'Do Not Pair');

assert.strictEqual(typeof context.describeYdpPairScoreError_, 'function');

const longError = 'Gemini API HTTP 503 UNAVAILABLE: ' + 'x'.repeat(1000);
const describedError = context.describeYdpPairScoreError_(new Error(longError));
assert.ok(describedError.startsWith('Gemini API HTTP 503 UNAVAILABLE'));
assert.ok(describedError.length <= 900);

assert.strictEqual(typeof context.getYdpDefaultPairScoringBatchSize_, 'function');
assert.strictEqual(context.getYdpDefaultPairScoringBatchSize_(), 5);
assert.strictEqual(typeof context.getYdpDefaultMenteeScoringBatchSize_, 'function');
assert.strictEqual(context.getYdpDefaultMenteeScoringBatchSize_(), 3);
assert.strictEqual(typeof context.getYdpMenteeScoringRunLimitMilliseconds_, 'function');
assert.strictEqual(context.getYdpMenteeScoringRunLimitMilliseconds_(), 90000);

assert.strictEqual(typeof context.getYdpGeminiApiKeySlotsFromMap_, 'function');
const geminiKeySlots = context.getYdpGeminiApiKeySlotsFromMap_({
  GEMINI_API_KEY: 'primary-key',
  GEMINI_API_KEY_2: 'second-key',
  GEMINI_API_KEY_3: 'third-key',
  GEMINI_API_KEY_4: '   '
});
assert.strictEqual(JSON.stringify(geminiKeySlots.map(slot => ({
  index: slot.index,
  propertyName: slot.propertyName
}))), JSON.stringify([
  { index: 1, propertyName: 'GEMINI_API_KEY' },
  { index: 2, propertyName: 'GEMINI_API_KEY_2' },
  { index: 3, propertyName: 'GEMINI_API_KEY_3' }
]));

assert.strictEqual(typeof context.getYdpGeminiKeyAttemptOrder_, 'function');
assert.strictEqual(
  JSON.stringify(context.getYdpGeminiKeyAttemptOrder_(geminiKeySlots, '2').map(slot => slot.index)),
  JSON.stringify([2, 3, 1])
);
assert.strictEqual(
  JSON.stringify(context.getYdpGeminiKeyAttemptOrder_(geminiKeySlots, '99').map(slot => slot.index)),
  JSON.stringify([1, 2, 3])
);

assert.strictEqual(typeof context.callYdpGeminiWithKeySlots_, 'function');
const attemptedSlots = [];
let rememberedSlot = null;
const failoverResult = context.callYdpGeminiWithKeySlots_(
  geminiKeySlots,
  '1',
  slot => {
    attemptedSlots.push(slot.index);
    if (slot.index === 1) {
      throw new Error('Gemini quota/rate limit reached.');
    }
    return 'success from slot ' + slot.index;
  },
  index => {
    rememberedSlot = index;
  }
);
assert.strictEqual(failoverResult, 'success from slot 2');
assert.strictEqual(JSON.stringify(attemptedSlots), JSON.stringify([1, 2]));
assert.strictEqual(rememberedSlot, 2);

assert.throws(
  () => context.callYdpGeminiWithKeySlots_(
    geminiKeySlots,
    '1',
    () => {
      throw new Error('Gemini API HTTP 400 INVALID_ARGUMENT: bad request');
    },
    () => {}
  ),
  /INVALID_ARGUMENT/
);

assert.throws(
  () => context.callYdpGeminiWithKeySlots_(
    geminiKeySlots,
    '1',
    () => {
      throw new Error('Gemini API HTTP 429 RESOURCE_EXHAUSTED');
    },
    () => {}
  ),
  /all 3 configured API keys/i
);

assert.strictEqual(typeof context.formatYdpGeminiMissingKeyMessage_, 'function');
assert.ok(context.formatYdpGeminiMissingKeyMessage_().includes('GEMINI_API_KEY_2'));

assert.strictEqual(typeof context.isYdpGeminiServiceUnavailableError_, 'function');
assert.strictEqual(
  context.isYdpGeminiServiceUnavailableError_(new Error('Gemini API HTTP 503 UNAVAILABLE: This model is currently experiencing high demand.')),
  true
);
assert.strictEqual(
  context.isYdpGeminiServiceUnavailableError_(new Error('Gemini API HTTP 429 RESOURCE_EXHAUSTED')),
  false
);
assert.strictEqual(
  context.isYdpGeminiServiceUnavailableError_(new Error('Gemini returned invalid JSON.')),
  false
);
assert.strictEqual(typeof context.shouldYdpSkipExistingPairScore_, 'function');
assert.strictEqual(context.shouldYdpSkipExistingPairScore_({ status: 'Scored' }), true);
assert.strictEqual(context.shouldYdpSkipExistingPairScore_({ status: 'scored' }), true);
assert.strictEqual(context.shouldYdpSkipExistingPairScore_({ status: 'Error' }), false);
assert.strictEqual(context.shouldYdpSkipExistingPairScore_(null), false);

assert.strictEqual(typeof context.buildYdpPairScoreBatchMessage_, 'function');
const batchMessage = context.buildYdpPairScoreBatchMessage_({
  successCount: 3,
  skippedCount: 7,
  errorCount: 1,
  quotaHit: false,
  completedAll: false
});
assert.ok(batchMessage.includes('Generated pair scores for 3 pairs.'));
assert.ok(batchMessage.includes('Skipped already-scored pairs: 7.'));
assert.ok(batchMessage.includes('Errors: 1.'));

assert.strictEqual(typeof context.buildYdpMenteeScoreBatchMessage_, 'function');
const menteeBatchMessage = context.buildYdpMenteeScoreBatchMessage_({
  successCount: 5,
  skippedCount: 12,
  errorCount: 0,
  quotaHit: false,
  completedAll: false
});
assert.ok(menteeBatchMessage.includes('Generated mentee scores for 5 mentees.'));
assert.ok(menteeBatchMessage.includes('Skipped already-scored rows: 12.'));
assert.ok(menteeBatchMessage.includes('Errors: 0.'));

const menteeStoppedForTimeMessage = context.buildYdpMenteeScoreBatchMessage_({
  successCount: 2,
  skippedCount: 30,
  errorCount: 0,
  quotaHit: false,
  stoppedForTime: true,
  completedAll: false
});
assert.ok(menteeStoppedForTimeMessage.includes('Generated mentee scores for 2 mentees.'));
assert.ok(menteeStoppedForTimeMessage.includes('mentee scoring stopped safely'));

const menteeServiceUnavailableMessage = context.buildYdpMenteeScoreBatchMessage_({
  successCount: 0,
  skippedCount: 80,
  errorCount: 1,
  quotaHit: false,
  serviceUnavailableHit: true,
  serviceUnavailableMessage: 'Gemini API HTTP 503 UNAVAILABLE: high demand',
  stoppedForTime: false,
  completedAll: false
});
assert.ok(menteeServiceUnavailableMessage.includes('stopped after the first failed request'));
assert.ok(menteeServiceUnavailableMessage.includes('HTTP 503 UNAVAILABLE'));

assert.strictEqual(typeof context.selectYdpAutoMatchesFromPairScores_, 'function');
const autoMatchResult = context.selectYdpAutoMatchesFromPairScores_(
  [
    { id: 'm1', name: 'Ada One', email: 'ada@example.com', careerPath: 'Data Analyst', finalScore: 95 },
    { id: 'm2', name: 'Ben Two', email: 'ben@example.com', careerPath: 'Data Analyst', finalScore: 90 }
  ],
  [
    { id: 'mentor-a', name: 'Mentor A', email: 'a@example.com', flexibleCapacity: 1 },
    { id: 'mentor-b', name: 'Mentor B', email: 'b@example.com', flexibleCapacity: 3 }
  ],
  [
    { menteeId: 'm1', mentorId: 'mentor-a', mentorName: 'Mentor A', mentorEmail: 'a@example.com', totalPairScore: 95, skillFitScore: 35, careerFitScore: 30, availabilityFitScore: 15, capacityFitScore: 15, reason: 'Best fit', concern: '', status: 'Scored' },
    { menteeId: 'm1', mentorId: 'mentor-b', mentorName: 'Mentor B', mentorEmail: 'b@example.com', totalPairScore: 80, skillFitScore: 30, careerFitScore: 25, availabilityFitScore: 10, capacityFitScore: 15, reason: 'Good fit', concern: '', status: 'Scored' },
    { menteeId: 'm2', mentorId: 'mentor-a', mentorName: 'Mentor A', mentorEmail: 'a@example.com', totalPairScore: 99, skillFitScore: 40, careerFitScore: 30, availabilityFitScore: 14, capacityFitScore: 15, reason: 'Strong but full', concern: '', status: 'Scored' },
    { menteeId: 'm2', mentorId: 'mentor-b', mentorName: 'Mentor B', mentorEmail: 'b@example.com', totalPairScore: 70, skillFitScore: 25, careerFitScore: 20, availabilityFitScore: 10, capacityFitScore: 15, reason: 'Available fit', concern: '', status: 'Scored' }
  ]
);
assert.strictEqual(autoMatchResult.matches.length, 2);
assert.strictEqual(autoMatchResult.matches[0].mentor.id, 'mentor-a');
assert.strictEqual(autoMatchResult.matches[1].mentor.id, 'mentor-b');
assert.strictEqual(autoMatchResult.skipped.length, 0);

console.log('pair score helper tests passed');
