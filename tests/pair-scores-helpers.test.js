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

console.log('pair score helper tests passed');
