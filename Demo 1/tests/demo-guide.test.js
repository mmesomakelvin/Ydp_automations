const assert = require('assert');
const fs = require('fs');
const path = require('path');

const guidePath = path.join(__dirname, '..', 'deliverables', 'YDP_Automation_Demo_Guide.html');

assert.ok(fs.existsSync(guidePath), 'The presenter-guide HTML source must exist.');

const source = fs.readFileSync(guidePath, 'utf8');
const pageCount = (source.match(/<section class="page(?:\s|\")/g) || []).length;

assert.strictEqual(pageCount, 2, 'The guide must contain exactly 2 presentation pages.');

[
  'From Manual Work to a Controlled Mentorship System',
  'What We Built and Why',
  'Three Apps Script Projects',
  'How the Matching Flow Works',
  '20-30 Minute Demo Run Sheet',
  'GitHub and clasp',
  'Safe Demo Rules'
].forEach((requiredText) => {
  assert.ok(source.includes(requiredText), `Missing required section: ${requiredText}`);
});

['Say', 'Show', 'Do', 'Safety'].forEach((label) => {
  assert.ok(source.includes(`>${label}<`), `Missing presenter label: ${label}`);
});

[
  'Setup email tracking columns',
  'Install form submit trigger',
  'Assign IDs and mark duplicates',
  'Generate mentee scores batch',
  'Generate pair scores batch',
  'Auto-match from pair scores',
  'Preview selected match emails',
  'Send match emails to selected pair',
  'clasp push --force',
  'git push origin main',
  '503 UNAVAILABLE'
].forEach((requiredText) => {
  assert.ok(source.includes(requiredText), `Missing required operational detail: ${requiredText}`);
});

assert.strictEqual(/AQ\.[A-Za-z0-9_-]{15,}/.test(source), false, 'The guide must not contain Gemini API key values.');
assert.strictEqual(/@[a-z0-9.-]+\.(com|org|net|co\.uk)/i.test(source), false, 'The guide must not contain participant email addresses.');
assert.strictEqual(/\b0\d{9,10}\b/.test(source), false, 'The guide must not contain participant phone numbers.');

console.log('demo guide source tests passed');
