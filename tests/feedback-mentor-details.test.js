const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scriptPath = path.join(__dirname, '..', 'matching', 'YDP Matching Automation.gs');
const context = { console };
vm.createContext(context);
vm.runInContext(fs.readFileSync(scriptPath, 'utf8'), context);

assert.strictEqual(typeof context.buildYdpMentorDetailsByMentee_, 'function');
assert.strictEqual(typeof context.fillYdpFeedbackMentorDetails_, 'function');
assert.strictEqual(typeof context.fillYdpFeedbackMentorDetails, 'function');

const matchedHeaderMap = {
  'Match ID': 1, 'Mentee ID': 2, 'Mentee Name': 3, 'Mentee Email': 4,
  'Mentor ID': 5, 'Mentor Name': 6, 'Mentor Email': 7, 'Track': 8
};
const matchedRows = [
  ['M1', 'YDP-C2-Mentee-057', 'Oluwakayode Aje', 'o@example.com', 'YDP-C2-Mentor-001', 'Israel Odeajo', 'iodeajo@example.com', 'Machine Learning/AI Engineer'],
  ['M2', 'YDP-C2-Mentee-021', 'Fatai Omoniyi', 'f@example.com', 'YDP-C2-Mentor-010', 'Kolawole Kushimo', 'k@example.com', 'Analytics Engineer'],
  ['M3', '', '', '', 'YDP-C2-Mentor-099', 'No Mentee', 'n@example.com', 'Data Analyst']
];

const lookup = context.buildYdpMentorDetailsByMentee_(matchedRows, matchedHeaderMap);
assert.deepStrictEqual(Object.keys(lookup).sort(), ['YDP-C2-MENTEE-021', 'YDP-C2-MENTEE-057']);
assert.strictEqual(lookup['YDP-C2-MENTEE-057']['Mentor Name'], 'Israel Odeajo');
assert.strictEqual(lookup['YDP-C2-MENTEE-021']['Track'], 'Analytics Engineer');

// Response rows: Mentee ID in column index 1.
const responseRows = [
  ['10/4/2026', 'YDP-C2-Mentee-057'],   // already correct
  ['10/4/2026', 'ydp-c2-mentee-021 '],  // blank details, case/space differences
  ['10/4/2026', 'YDP-C2-Mentee-999'],   // not in Matched Pairs
  ['10/4/2026', '']                     // no Mentee ID
];
const existingColumns = [
  ['YDP-C2-Mentor-001', '', 'keep-me', ''],
  ['Israel Odeajo', '', 'keep-me', ''],
  ['iodeajo@example.com', '', 'keep-me', ''],
  ['Machine Learning/AI Engineer', '', 'keep-me', '']
];

const result = context.fillYdpFeedbackMentorDetails_(responseRows, 1, existingColumns, lookup);
assert.strictEqual(result.filled, 1);
assert.strictEqual(result.unchanged, 1);
assert.strictEqual(result.blank, 1);
assert.deepStrictEqual(Array.from(result.notFound), ['YDP-C2-Mentee-999']);
assert.deepStrictEqual(Array.from(result.columns[0]), ['YDP-C2-Mentor-001', 'YDP-C2-Mentor-010', 'keep-me', '']);
assert.deepStrictEqual(Array.from(result.columns[1]), ['Israel Odeajo', 'Kolawole Kushimo', 'keep-me', '']);
assert.deepStrictEqual(Array.from(result.columns[3]), ['Machine Learning/AI Engineer', 'Analytics Engineer', 'keep-me', '']);
// The input columns are not mutated.
assert.strictEqual(existingColumns[0][1], '');

// A stale mentor (e.g. after a reassignment) is refreshed from Matched Pairs.
const refreshed = context.fillYdpFeedbackMentorDetails_(
  [['10/5/2026', 'YDP-C2-Mentee-021']], 1,
  [['YDP-C2-Mentor-003'], ['Old Mentor'], ['old@example.com'], ['Data Analyst']],
  lookup
);
assert.strictEqual(refreshed.filled, 1);
assert.strictEqual(refreshed.columns[0][0], 'YDP-C2-Mentor-010');

const scriptSource = fs.readFileSync(scriptPath, 'utf8');
assert.ok(scriptSource.includes(".addItem('Pull mentor details into feedback responses', 'fillYdpFeedbackMentorDetails')"));
assert.ok(context.getYdpMatchingDataDictionaryRows_().some((row) => row.includes('Pull mentor details into feedback responses')));
assert.ok(context.getYdpButtonGuideRows_().some((row) => row.includes('Pull mentor details into feedback responses')));

console.log('feedback mentor details tests passed');
