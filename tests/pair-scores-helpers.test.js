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
assert.strictEqual(context.getYdpDefaultMenteeScoringBatchSize_(), 5);
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
