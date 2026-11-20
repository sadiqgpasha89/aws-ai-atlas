import test from 'node:test';
import assert from 'node:assert/strict';
import { exporters as ex } from './helpers.mjs';

test('CSV quoting and escaping', () => {
  assert.equal(ex.cell('plain'), 'plain');
  assert.equal(ex.cell('a,b'), '"a,b"');
  assert.equal(ex.cell('say "hi"'), '"say ""hi"""');
  assert.equal(ex.cell('line1\nline2'), '"line1\nline2"');
  assert.equal(ex.cell(null), ''); assert.equal(ex.cell(['x', 'y']), 'x; y'); assert.equal(ex.cell(0), '0');
});
test('CSV neutralises spreadsheet formula injection but keeps negative numbers', () => {
  assert.equal(ex.cell('=HYPERLINK("http://evil")'), `"'=HYPERLINK(""http://evil"")"`);
  assert.equal(ex.cell('+1+1'), "'+1+1"); assert.equal(ex.cell('@SUM(A1)'), "'@SUM(A1)"); assert.equal(ex.cell('-cmd'), "'-cmd");
  assert.equal(ex.cell(-5), '-5'); assert.equal(ex.cell('-12.5'), '-12.5');
});
test('toCSV writes metadata comments, header and rows', () => {
  const out = ex.toCSV([{ a: 1, b: 'x,y' }], [{ key: 'a', label: 'A' }, { key: 'b', label: 'B', get: (r) => r.b.toUpperCase() }], ['Generated 2026-03-10', 'SAMPLE DATA']);
  assert.equal(out, '# Generated 2026-03-10\r\n# SAMPLE DATA\r\nA,B\r\n1,"X,Y"\r\n');
});
test('tableMarkdown escapes pipes', () => {
  assert.match(ex.tableMarkdown(['H'], [['a|b']]), /a\\\|b/);
});
