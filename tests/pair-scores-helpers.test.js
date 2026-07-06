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

console.log('pair score helper tests passed');
