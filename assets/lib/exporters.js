/* CSV and Markdown exporters (plan §37). Pure string builders; the browser layer handles download/print. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.ATLAS = root.ATLAS || {}; root.ATLAS.lib = root.ATLAS.lib || {}; root.ATLAS.lib.exporters = api; }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  /* One CSV cell. Quotes when needed (RFC 4180) and neutralises spreadsheet formulas (=, +, -, @, tab, CR)
     so an imported or typed value cannot execute when the CSV is opened in Excel or Sheets. */
  function cell(v) {
    if (v === null || v === undefined) return '';
    var s = Array.isArray(v) ? v.join('; ') : String(v);
    if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = "'" + s;
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  /* columns: [{key, label, get?(row)}] */
  function toCSV(rows, columns, meta) {
    var lines = [];
    if (meta && meta.length) meta.forEach(function (m) { lines.push(cell('# ' + m)); });
    lines.push(columns.map(function (c) { return cell(c.label); }).join(','));
    rows.forEach(function (r) { lines.push(columns.map(function (c) { return cell(c.get ? c.get(r) : r[c.key]); }).join(',')); });
    return lines.join('\r\n') + '\r\n';
  }

  function mdEscape(s) { return String(s === null || s === undefined ? '' : s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' '); }

  /* Weekly/monthly summary built only from the dashboard summary object. */
  function summaryMarkdown(sum, opts) {
    opts = opts || {};
    var L = [];
    L.push('# AI Engineering Summary');
    L.push('');
    L.push('- Generated: ' + (opts.generatedAt || sum.scope.today));
    L.push('- Data source: ' + (opts.sample ? '**SAMPLE DATA. Not real projects or telemetry.**' : 'Personal workspace (browser-local records entered by the user)'));
    L.push('- Scope: ' + (sum.scope.stage || sum.scope.status ? ['stage=' + (sum.scope.stage || 'all'), 'status=' + (sum.scope.status || 'all')].join(', ') : 'all active initiatives') + '; look-ahead window ' + sum.scope.windowDays + ' days; archived projects excluded');
    L.push('- Assumptions: figures are derived from the records listed below; costs are entered estimates, not actual spend; nothing is read from AWS or any live system.');
    L.push('');
    L.push('## Headline numbers');
    sum.kpis.forEach(function (k) { L.push('- ' + k.label + ': **' + k.value + '** (' + k.sub + ')'); });
    L.push('');
    L.push('## Portfolio by stage');
    Object.keys(sum.portfolio.byStage).forEach(function (s) { if (sum.portfolio.byStage[s]) L.push('- ' + s + ': ' + sum.portfolio.byStage[s]); });
    L.push('');
    L.push('## Needs attention');
    if (!sum.attention.length) L.push('- Nothing flagged by the current records.');
    sum.attention.forEach(function (a) { L.push('- [' + a.severity.toUpperCase() + '] ' + a.title + ': ' + a.detail); });
    L.push('');
    var c = sum.cost;
    L.push('## Cost and value (entered estimates)');
    L.push('- Build cost estimates: ' + c.buildEstimate + '; run cost estimates per month: ' + c.runEstimateMonthly + '; forecast benefit per month: ' + c.forecastBenefitMonthly);
    L.push(c.realizedVsForecastPct === null ? '- Realised benefit: no project has both forecast and realised values yet.' : '- Realised vs forecast benefit (' + c.projectsWithRealized + ' project(s)): ' + (Math.round(c.realizedVsForecastPct * 10) / 10) + '%');
    if (c.currencies.length > 1) L.push('- Note: projects use more than one currency label (' + c.currencies.map(function (x) { return x || 'unlabelled'; }).join(', ') + '); totals are not converted.');
    L.push('');
    L.push('_Not tracked in this summary: production telemetry, SLOs, evaluation runs and team capacity (no data source in the Atlas yet)._');
    return L.join('\n');
  }

  /* Prioritisation table as Markdown for review packs. rows: [{name, stage, total, quadrant, recommendation}] */
  function tableMarkdown(headers, rows) {
    var L = ['| ' + headers.map(mdEscape).join(' | ') + ' |', '| ' + headers.map(function () { return '---'; }).join(' | ') + ' |'];
    rows.forEach(function (r) { L.push('| ' + r.map(mdEscape).join(' | ') + ' |'); });
    return L.join('\n');
  }

  return { cell: cell, toCSV: toCSV, summaryMarkdown: summaryMarkdown, tableMarkdown: tableMarkdown };
});
