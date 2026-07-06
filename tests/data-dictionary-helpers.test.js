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
  return context;
}

const mentee = loadScript('YDP Mentee Email.gs');
assert.strictEqual(typeof mentee.getYdpMenteeDataDictionaryRows_, 'function');
const menteeRows = mentee.getYdpMenteeDataDictionaryRows_();
assert.ok(menteeRows.some((row) => row.includes('Mentee ID')));
assert.ok(menteeRows.some((row) => row.includes('Assign IDs and mark duplicates')));

const mentor = loadScript(path.join('mentor', 'YDP Mentor Email.gs'));
assert.strictEqual(typeof mentor.getYdpMentorDataDictionaryRows_, 'function');
const mentorRows = mentor.getYdpMentorDataDictionaryRows_();
assert.ok(mentorRows.some((row) => row.includes('Mentor ID')));
assert.ok(mentorRows.some((row) => row.includes('Assign IDs and mark duplicates')));

const matching = loadScript(path.join('matching', 'YDP Matching Automation.gs'));
assert.strictEqual(typeof matching.getYdpMatchingDataDictionaryRows_, 'function');
const matchingRows = matching.getYdpMatchingDataDictionaryRows_();
assert.ok(matchingRows.some((row) => row.includes('Gemini Review Status')));
assert.ok(matchingRows.some((row) => row.includes('Generate pair scores batch')));

console.log('data dictionary helper tests passed');
