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

const mentor = loadScript(path.join('mentor', 'YDP Mentor Email.gs'));
assert.strictEqual(typeof mentor.context.getYdpMentorDataDictionaryRows_, 'function');
const mentorRows = mentor.context.getYdpMentorDataDictionaryRows_();
assert.ok(mentorRows.some((row) => row.includes('Mentor ID')));

const matching = loadScript(path.join('matching', 'YDP Matching Automation.gs'));
assert.strictEqual(typeof matching.context.getYdpMatchingDataDictionaryRows_, 'function');
const matchingRows = matching.context.getYdpMatchingDataDictionaryRows_();
assert.ok(matchingRows.some((row) => row.includes('Gemini Review Status')));

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

function createFakeSpreadsheet(initialSheets) {
  class FakeRange {
    constructor(sheet, row, column, rowCount, columnCount) {
      this.sheet = sheet;
      this.row = row;
      this.column = column;
      this.rowCount = rowCount;
      this.columnCount = columnCount;
    }

    getValues() {
      return Array.from({ length: this.rowCount }, (_, rowOffset) =>
        Array.from({ length: this.columnCount }, (_, columnOffset) =>
          (this.sheet.values[this.row - 1 + rowOffset] || [])[this.column - 1 + columnOffset] || ''
        )
      );
    }

    setValues(values) {
      values.forEach((sourceRow, rowOffset) => {
        const targetRow = this.row - 1 + rowOffset;
        this.sheet.values[targetRow] = this.sheet.values[targetRow] || [];
        sourceRow.forEach((value, columnOffset) => {
          this.sheet.values[targetRow][this.column - 1 + columnOffset] = value;
        });
      });
      this.sheet.writeCount += 1;
      return this;
    }

    setBackgrounds(backgrounds) {
      this.sheet.backgroundWrites.push(backgrounds.map((row) => Array.from(row)));
      return this;
    }

    setWrap() { return this; }
    setVerticalAlignment() { return this; }
    setFontWeight() { return this; }
    setFontColor() { return this; }
    setBackground() { return this; }
    createFilter() {
      this.sheet.filter = { remove: () => { this.sheet.filter = null; } };
      return this.sheet.filter;
    }
  }

  class FakeSheet {
    constructor(name, values = [[]], protectedParticipantData = false) {
      this.name = name;
      this.values = values.map((row) => Array.from(row));
      this.protectedParticipantData = protectedParticipantData;
      this.writeCount = 0;
      this.backgroundWrites = [];
      this.filter = null;
    }

    getName() { return this.name; }
    getLastRow() { return this.values.length; }
    getLastColumn() { return this.values.reduce((maximum, row) => Math.max(maximum, row.length), 0); }
    getRange(row, column, rowCount = 1, columnCount = 1) { return new FakeRange(this, row, column, rowCount, columnCount); }
    getFilter() { return this.filter; }
    clearContents() {
      assert.ok(!this.protectedParticipantData, `Documentation refresh must not clear ${this.name}.`);
      this.values = [];
      this.writeCount += 1;
      return this;
    }
    clearFormats() { return this; }
    setFrozenRows() { return this; }
    setColumnWidth() { return this; }
  }

  const sheets = initialSheets.map((specification) =>
    new FakeSheet(specification.name, specification.values, specification.protectedParticipantData)
  );
  const spreadsheet = {
    getSheetByName: (name) => sheets.find((sheet) => sheet.name === name) || null,
    insertSheet: (name) => {
      const sheet = new FakeSheet(name);
      sheets.push(sheet);
      return sheet;
    },
    getActiveSheet: () => sheets.find((sheet) => sheet.protectedParticipantData) || sheets[0],
    getSheets: () => sheets
  };

  return { spreadsheet, sheets };
}

function assertDocumentationRefresh(options) {
  const fake = createFakeSpreadsheet(options.initialSheets);
  const alerts = [];
  options.context.SpreadsheetApp = {
    getActive: () => fake.spreadsheet,
    getUi: () => ({ alert: (message) => alerts.push(message) })
  };

  options.context[options.createFunction]();

  const dictionarySheet = fake.spreadsheet.getSheetByName('Data Dictionary');
  const guideSheet = fake.spreadsheet.getSheetByName('Button Guide');
  assert.ok(dictionarySheet && dictionarySheet.writeCount > 0, 'Documentation refresh must write Data Dictionary.');
  assert.ok(guideSheet && guideSheet.writeCount > 0, 'Documentation refresh must write Button Guide.');
  assert.ok(dictionarySheet.backgroundWrites.length > 0, 'Data Dictionary must use alternating body shading.');
  assert.ok(guideSheet.backgroundWrites.length > 0, 'Button Guide must color full safety rows.');
  assert.ok(alerts.some((message) => /not changed/i.test(message)), 'Refresh alert must confirm operational data was not changed.');
  options.initialSheets.filter((sheet) => sheet.protectedParticipantData).forEach((sourceSheet) => {
    const runtimeSheet = fake.spreadsheet.getSheetByName(sourceSheet.name);
    assert.strictEqual(runtimeSheet.writeCount, 0, `Documentation refresh must not write ${sourceSheet.name}.`);
  });
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

assertDocumentationRefresh({
  context: mentee.context,
  createFunction: 'createYdpMenteeDataDictionary',
  initialSheets: [{ name: 'Form_Responses', values: [['Timestamp', 'Email Address', 'First Name']], protectedParticipantData: true }]
});

assertDocumentationRefresh({
  context: mentor.context,
  createFunction: 'createYdpMentorDataDictionary',
  initialSheets: [{ name: 'Form_Responses', values: [['Timestamp', 'Email Address', 'First Name']], protectedParticipantData: true }]
});

assertDocumentationRefresh({
  context: matching.context,
  createFunction: 'createYdpMatchingDataDictionary',
  initialSheets: [
    { name: 'Mentee Source Snapshot', values: [['Timestamp', 'Email Address']], protectedParticipantData: true },
    { name: 'Mentor Source Snapshot', values: [['Timestamp', 'Email Address']], protectedParticipantData: true }
  ]
});

console.log('data dictionary helper tests passed');
