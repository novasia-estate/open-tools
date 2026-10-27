'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const T = require('../docs/tools.js');
test('localized prices preserve input and handle abbreviations', () => {
  assert.equal(T.price('THB 3,5 млн').amount, 3500000);
  assert.equal(T.price('IDR 2.1 billion').amount, 2100000000);
  assert.equal(T.price('€ 1.250.000,50').amount, 1250000.5);
  assert.equal(T.price('USD 1,250,000.50').amount, 1250000.5);
  assert.equal(T.price('฿ 3.5 m').original, '฿ 3.5 m');
});
test('ambiguous separators have explicit overrides', () => {
  assert.equal(T.number('1,500'), 1500);
  assert.equal(T.number('1,500', 'comma'), 1.5);
  assert.equal(T.number('2.500', 'dot'), 2.5);
  assert.throws(() => T.number('1,23,456'));
});
test('invalid, multiple and ambiguous currencies are rejected', () => {
  for (const input of ['-10 USD', 'USD 1–2 million', 'USD Infinity', 'THB 3.5 million million', 'USD 50 IDR']) assert.throws(() => T.price(input));
  assert.throws(() => T.price('$ 100'));
  assert.equal(T.price('$ 100', { currency: 'USD' }).currency, 'USD');
  assert.throws(() => T.price('THB 100', { currency: 'USD' }));
});
test('area conversion and Thai deed notation', () => {
  assert.equal(T.area('1-2-50', 'deed').sqm, 2600);
  assert.equal(T.area('2', 'are').sqm, 200);
  assert.equal(T.area('1', 'sqft').sqm, 0.09290304);
  assert.throws(() => T.area('1-4-0', 'deed'));
  assert.throws(() => T.area('1-0-100', 'deed'));
  assert.throws(() => T.area('0'));
});
test('payment milestones sum exactly including rounding remainders', () => {
  const plan = T.schedule('0.01', 'A | 2026-11-01 | 33.33\nB | 2026-11-01 | 33.33\nC | 2026-11-02 | 33.34');
  assert.deepEqual(plan.rows.map(row => row.amount), [0, 0.01, 0]);
  assert.equal(T.schedule('185000', 'Booking | 2026-11-01 | 10\nHandover | 2027-01-01 | 90').rows[1].amount, 166500);
});
test('planner rejects invalid dates, percentages and ordering', () => {
  for (const data of ['A | 2026-02-30 | 100', 'A | 2026-11-01 | 80', 'A | 2026-11-01 | 100.001', 'A | 2026-12-01 | 50\nB | 2026-11-01 | 50']) assert.throws(() => T.schedule('100', data));
  assert.throws(() => T.schedule('1.001', 'A | 2026-11-01 | 100'));
});
test('calendar uses real dates, stable identities, CRLF and escaping', () => {
  const plan = T.schedule('100', 'Milestone, one; ready | 2026-11-01 | 100');
  const ics = T.calendar(plan, '20261027T120000Z');
  assert.match(ics, /DTSTART;VALUE=DATE:20261101\r\n/);
  assert.match(ics, /SUMMARY:Milestone\\, one\\; ready/);
  assert.equal(ics, T.calendar(plan, '20261027T120000Z'));
  assert.equal(ics.endsWith('END:VCALENDAR\r\n'), true);
});
test('calendar folds UTF-8 lines without breaking multibyte characters', () => {
  const plan = T.schedule('100', 'Платёж '.repeat(20).trim() + ' | 2026-11-01 | 100');
  const ics = T.calendar(plan, '20261027T120000Z');
  for (const line of ics.split('\r\n')) assert(Buffer.byteLength(line) <= 75);
  assert(ics.replace(/\r\n /g, '').includes('SUMMARY:Платёж Платёж'));
});
test('CSV parses quoted separators, escaped quotes and embedded newline', () => {
  const parsed = T.parseCSV('name;note\r\n"Villa; A";"line 1\nline ""2"""\r\n');
  assert.equal(parsed.delimiter, ';');
  assert.deepEqual(parsed.rows[1], ['Villa; A', 'line 1\nline "2"']);
});
test('CSV cleaning preserves columns, reports duplicates and protects formulas', () => {
  const cleaned = T.cleanCSV('name,price\n A ,100\nA,100\n"=SUM(1,2)",200\n');
  assert.equal(cleaned.duplicates, 1);
  assert.equal(cleaned.rows.length, 2);
  assert.equal(cleaned.protectedCells, 1);
  assert.match(cleaned.csv, /"'=SUM\(1,2\)"/);
  assert.deepEqual(T.cleanCSV('a\tb\n1\t2').rows, [['1', '2']]);
});
test('malformed CSV and duplicate headers are rejected rather than truncated', () => {
  for (const csv of ['a,a\n1,2', 'a,b\n1,2,3', 'a,b\n"unclosed,2', 'a,b\n"x"oops,2', 'a,b\nfoo"bar,2']) assert.throws(() => T.cleanCSV(csv));
  assert.equal(T.cleanCSV('a,b\n  x  ,2', { trim: false }).rows[0][0], '  x  ');
});
