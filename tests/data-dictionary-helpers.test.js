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
assert.strictEqual(typeof mentee.context.getYdpMenteeDataDictionaryRows_, 'function');
const menteeRows = mentee.context.getYdpMenteeDataDictionaryRows_();
assert.ok(menteeRows.some((row) => row.includes('Mentee ID')));
assert.ok(menteeRows.some((row) => row.includes('Assign IDs and mark duplicates')));

const mentor = loadScript(path.join('mentor', 'YDP Mentor Email.gs'));
assert.strictEqual(typeof mentor.context.getYdpMentorDataDictionaryRows_, 'function');
const mentorRows = mentor.context.getYdpMentorDataDictionaryRows_();
assert.ok(mentorRows.some((row) => row.includes('Mentor ID')));
assert.ok(mentorRows.some((row) => row.includes('Assign IDs and mark duplicates')));

const matching = loadScript(path.join('matching', 'YDP Matching Automation.gs'));
assert.strictEqual(typeof matching.context.getYdpMatchingDataDictionaryRows_, 'function');
const matchingRows = matching.context.getYdpMatchingDataDictionaryRows_();
assert.ok(matchingRows.some((row) => row.includes('Gemini Review Status')));
assert.ok(matchingRows.some((row) => row.includes('Generate pair scores batch')));

const dictionaryHeader = [
  'Sheet Name',
  'Sheet Purpose',
  'Column Name',
  'Column Meaning',
  'Automation Use',
  'Can Team Edit?',
  'Notes'
];

const buttonGuideHeader = [
  'Safety Level',
  'Menu Name',
  'Button Name',
  'What It Does',
  'When To Run',
  'Before Running',
  'What It Changes',
  'Recommended Frequency'
];

const safetyColors = {
  SAFE: '#d9ead3',
  CAUTION: '#fff2cc',
  'LIVE ACTION': '#f4cccc'
};

function getMenuLabels(source) {
  const labels = [];
  const expression = /\.addItem\((['"])(.*?)\1\s*,/g;
  let match;

  while ((match = expression.exec(source)) !== null) {
    labels.push(match[2]);
  }

  return labels;
}

function assertWorkbookDocumentation(options) {
  const dictionaryRows = options.context[options.dictionaryFunction]();
  assert.deepStrictEqual(Array.from(dictionaryRows[0]), dictionaryHeader);
  dictionaryRows.slice(1).forEach((row) => {
    assert.strictEqual(row.length, dictionaryHeader.length);
    assert.ok(row[0], 'Every dictionary row needs a sheet name.');
    assert.ok(row[1], `Missing sheet purpose for ${row[0]}.`);
    assert.ok(row[2], `Missing column name for ${row[0]}.`);
  });

  assert.strictEqual(typeof options.context[options.guideFunction], 'function');
  assert.strictEqual(typeof options.context[options.colorFunction], 'function');

  const guideRows = options.context[options.guideFunction]();
  assert.deepStrictEqual(Array.from(guideRows[0]), buttonGuideHeader);
  guideRows.slice(1).forEach((row) => {
    assert.strictEqual(row.length, buttonGuideHeader.length);
    row.forEach((cell) => assert.ok(String(cell).trim(), 'Button Guide cells cannot be blank.'));
    assert.ok(Object.prototype.hasOwnProperty.call(safetyColors, row[0]), `Unknown safety level: ${row[0]}`);
  });

  Object.entries(safetyColors).forEach(([level, color]) => {
    assert.strictEqual(options.context[options.colorFunction](level), color);
  });

  const guideLabels = guideRows.slice(1).map((row) => row[2]);
  getMenuLabels(options.source).forEach((label) => {
    assert.strictEqual(
      guideLabels.filter((guideLabel) => guideLabel === label).length,
      1,
      `Button Guide must define menu item exactly once: ${label}`
    );
  });

  assert.ok(options.source.includes("'Button Guide'"), 'Documentation refresh must create a Button Guide tab.');
}

assertWorkbookDocumentation({
  context: mentee.context,
  source: mentee.source,
  dictionaryFunction: 'getYdpMenteeDataDictionaryRows_',
  guideFunction: 'getYdpMenteeButtonGuideRows_',
  colorFunction: 'getYdpMenteeButtonGuideColor_'
});

assertWorkbookDocumentation({
  context: mentor.context,
  source: mentor.source,
  dictionaryFunction: 'getYdpMentorDataDictionaryRows_',
  guideFunction: 'getYdpMentorButtonGuideRows_',
  colorFunction: 'getYdpMentorButtonGuideColor_'
});

assertWorkbookDocumentation({
  context: matching.context,
  source: matching.source,
  dictionaryFunction: 'getYdpMatchingDataDictionaryRows_',
  guideFunction: 'getYdpMatchingButtonGuideRows_',
  colorFunction: 'getYdpMatchingButtonGuideColor_'
});

console.log('data dictionary helper tests passed');
