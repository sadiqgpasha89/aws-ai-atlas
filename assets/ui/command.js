/* Command Centre: derived from the active workspace (plan §5). Route: #/ and #/command. */
(function () {
  'use strict';
  var A = window.ATLAS, L = A.lib, U = A.ui, esc = U.esc;

  function kpiTile(k) {
    var cls = k.value > 0 && /overdue|risks|attention/.test(k.id) ? ' alert' : '';
    return '<a class="wkpi' + cls + '" href="' + esc(k.href) + '"><small>' + esc(k.label) + '</small><b>' + esc(k.value) + '</b><span>' + esc(k.sub) + '</span><i>View records →</i></a>';
  }
  function sevBadge(sev) { return U.badge(sev === 'critical' ? 'Critical' : sev === 'high' ? 'High' : sev === 'medium' ? 'Medium' : 'Low'); }

  function emptyState() {
    return '<section class="wempty"><h2>Your workspace is empty</h2>' +
      '<p>The Command Centre shows only records you enter. Nothing here is read from AWS or any live system, and no example numbers are shown as if they were real. Start with one of these:</p>' +
      '<div class="btns"><a class="btn primary" href="#/portfolio/new">Add your first initiative</a><a class="btn" href="#/registers/risks?new=1">Add a risk</a><a class="btn" href="#/registers/actions?new=1">Add an action</a>' +
      '<a class="btn" href="#/workspace">Import a backup</a><button class="btn" type="button" data-act="sample">Explore with sample data</button></div>' +
      '<p class="fine">Records are saved in this browser only. They are not synchronised or backed up, so use Export in <a href="#/workspace">Workspace</a> to keep a copy.</p>' +
      '<p class="fine">Looking for the earlier illustrative page? It is kept at <a href="#/command/sample">the static example Command Centre</a>.</p></section>';
  }

  function section(title, intro, body) { return '<section class="wsec"><h2>' + esc(title) + '</h2>' + (intro ? '<p class="fine">' + esc(intro) + '</p>' : '') + body + '</section>'; }
  function table(heads, rows, empty) {
    if (!rows.length) return '<p class="fine">' + esc(empty) + '</p>';
    return '<div class="tablewrap"><table class="wtable"><thead><tr>' + heads.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
  }

  function dashboard(qs) {
    var q = U.parseQuery(qs), store = U.ws.store(), snap = store.snapshot();
    var win = [7, 14, 30, 90].indexOf(parseInt(q.window, 10)) > -1 ? parseInt(q.window, 10) : 14;
    var stage = L.rules.STAGES.indexOf(q.stage) > -1 ? q.stage : '', status = L.schema.ENUMS.projectStatus.indexOf(q.status) > -1 ? q.status : '';
    var s = L.dashboard.summarize(snap, { today: U.ws.today(), windowDays: win, stage: stage, status: status });
    var byId = {}; snap.projects.forEach(function (p) { byId[p.id] = p; });
    var cur = s.cost.currencies.length === 1 ? s.cost.currencies[0] : '';

    var h = '<div class="wide wdash">' + U.banner();
    h += '<div class="eyebrow">AI Engineering Manager · ' + (U.ws.isSample() ? 'Sample workspace' : 'My workspace') + ' · ' + esc(s.scope.today) + '</div>';
    h += '<h1>Command Centre' + (U.ws.isSample() ? ' <span class="wtag">SAMPLE DATA</span>' : '') + '</h1>';
    h += '<p class="lede">A daily view built only from the initiatives, risks, decisions and actions in the workspace. Each number links to the records behind it. It does not read AWS, CloudWatch or any production system.</p>';

    if (s.empty) return { html: h + emptyState() + '</div>', md: '', snap: snap };

    h += '<form class="wfilters" aria-label="Dashboard filters" data-filters><div class="wrow">' +
      U.field('f-window', 'Look-ahead window', U.select('f-window', 'window', [[7, 'Next 7 days'], [14, 'Next 14 days'], [30, 'Next 30 days'], [90, 'Next 90 days']], win, { blank: false })) +
      U.field('f-stage', 'Stage', U.select('f-stage', 'stage', L.rules.STAGES, stage, { blankLabel: 'All stages' })) +
      U.field('f-status', 'Recorded status', U.select('f-status', 'status', L.schema.ENUMS.projectStatus, status, { blankLabel: 'All statuses' })) +
      '</div><p class="fine" id="scope-note">Scope: ' + s.scope.projectCount + ' initiative(s)' + (stage || status ? ' matching ' + esc([stage && 'stage ' + stage, status && 'status ' + status].filter(Boolean).join(' and ')) : '') +
      (s.scope.archivedExcluded ? '; ' + s.scope.archivedExcluded + ' archived excluded' : '') + '. The look-ahead window affects "upcoming" and "due soon" only.</p></form>';

    h += '<div class="wkpis">' + s.kpis.map(kpiTile).join('') + '</div>';

    /* attention */
    h += section('Needs attention today', 'A deterministic list: critical and high risks, blocked or late work, overdue actions, decisions waiting. Ordered by severity, then name.',
      s.attention.length ? '<ol class="wattn">' + s.attention.slice(0, 12).map(function (a) {
        return '<li>' + sevBadge(a.severity) + ' <a href="' + esc(a.href) + '"><b>' + esc(a.title) + '</b></a><span>' + esc(a.detail) + '</span></li>';
      }).join('') + '</ol>' + (s.attention.length > 12 ? '<p class="fine">Showing 12 of ' + s.attention.length + '. Open the linked registers for the rest.</p>' : '')
        : '<p class="fine">Nothing is flagged by the current records. That is a statement about the records, not about the real systems.</p>');

    /* portfolio */
    h += section('Portfolio by stage', 'Initiative counts per lifecycle stage. Select a stage to filter the list.', table(['Stage', 'Initiatives'], L.rules.STAGES.filter(function (st) { return s.portfolio.byStage[st]; }).map(function (st) {
      return '<tr><td><a href="#/portfolio' + U.buildQuery({ stage: st }) + '">' + esc(st) + '</a></td><td>' + s.portfolio.byStage[st] + '</td></tr>';
    }), 'No initiatives in scope.'));

    /* delivery */
    function msRow(m, late) { return '<tr><td><a href="#/portfolio/p/' + esc(m.projectId) + '">' + esc(m.projectName) + '</a></td><td>' + esc(m.title) + '</td><td>' + esc(m.dueDate) + '</td><td>' + (late ? '<span class="wbadge bad"><span aria-hidden="true">▲</span> ' + m.daysOverdue + ' day' + (m.daysOverdue === 1 ? '' : 's') + ' late</span>' : 'in ' + m.daysUntil + ' day' + (m.daysUntil === 1 ? '' : 's')) + '</td></tr>'; }
    h += section('Delivery health', 'Milestones that are not marked done. Overdue means the due date is before today.',
      '<h3>Overdue milestones (' + s.delivery.overdueMilestones.length + ')</h3>' + table(['Initiative', 'Milestone', 'Due', 'Timing'], s.delivery.overdueMilestones.map(function (m) { return msRow(m, true); }), 'None overdue.') +
      '<h3>Upcoming in the next ' + win + ' days (' + s.delivery.upcomingMilestones.length + ')</h3>' + table(['Initiative', 'Milestone', 'Due', 'Timing'], s.delivery.upcomingMilestones.map(function (m) { return msRow(m, false); }), 'None due in this window.') +
      (s.delivery.blocked.length ? '<h3>Blocked (' + s.delivery.blocked.length + ')</h3><ul>' + s.delivery.blocked.map(function (id) { return '<li><a href="#/portfolio/p/' + esc(id) + '">' + esc(byId[id].name) + '</a>' + (byId[id].technicalOwner ? ' (tech owner ' + esc(byId[id].technicalOwner) + ')' : '') + '</li>'; }).join('') + '</ul>' : ''));

    /* risks */
    var riskById = {}; snap.risks.forEach(function (r) { riskById[r.id] = r; });
    var topRisks = s.risks.critical.concat(s.risks.high);
    h += section('Risk and governance', 'Open means status Open or Mitigating. Severity = probability × impact (15+ critical, 10–14 high, 5–9 medium).',
      '<p><b>' + s.risks.open.length + '</b> open · <b>' + s.risks.critical.length + '</b> critical · <b>' + s.risks.high.length + '</b> high · <b>' + s.risks.overdueMitigations.length + '</b> mitigation(s) overdue · <b>' + s.risks.reviewDue.length + '</b> review(s) due</p>' +
      table(['Risk', 'Severity', 'Status', 'Owner', 'Mitigation due'], topRisks.map(function (id) {
        var r = riskById[id], sc = L.rules.riskScore(r.probability, r.impact);
        return '<tr><td><a href="#/registers/risks?focus=' + esc(id) + '">' + esc(r.title) + '</a></td><td>' + U.badge(L.rules.riskSeverity(sc)) + ' ' + sc + '/25</td><td>' + U.badge(r.status) + '</td><td>' + esc(r.owner || '—') + '</td><td>' + esc(r.dueDate || '—') + '</td></tr>';
      }), 'No open critical or high risks.'));

    /* actions and decisions */
    h += section('Actions and decisions', null,
      '<p><b>' + s.actions.open.length + '</b> open actions · <b>' + s.actions.overdue.length + '</b> overdue · <b>' + s.actions.dueSoon.length + '</b> due in ' + win + ' days · <b>' + s.decisions.pending.length + '</b> decision(s) awaiting approval · <b>' + s.decisions.reviewDue.length + '</b> approved decision(s) due for review</p>' +
      '<div class="btns"><a class="btn" href="#/registers/actions?filter=overdue">Overdue actions</a><a class="btn" href="#/registers/decisions?status=Proposed">Pending decisions</a><a class="btn" href="#/registers/risks">Risk register</a></div>');

    /* cost and value */
    var c = s.cost;
    h += section('Cost and value (entered estimates)', 'Totals of the estimates entered on each active initiative. These are not actual spend and are not read from billing. Amounts are not currency-converted.',
      '<div class="wkpis small"><div class="wkpi static"><small>Build cost estimates</small><b>' + U.money(c.buildEstimate, cur, 0) + '</b></div><div class="wkpi static"><small>Run cost estimates / month</small><b>' + U.money(c.runEstimateMonthly, cur, 0) + '</b></div>' +
      '<div class="wkpi static"><small>Forecast benefit / month</small><b>' + U.money(c.forecastBenefitMonthly, cur, 0) + '</b></div>' +
      '<div class="wkpi static"><small>Realised vs forecast benefit</small><b>' + (c.realizedVsForecastPct === null ? '—' : U.pct(c.realizedVsForecastPct, 0)) + '</b><span>' + (c.projectsWithRealized ? 'across ' + c.projectsWithRealized + ' initiative(s) with both values' : 'enter realised benefit after launch') + '</span></div></div>' +
      (c.currencies.length > 1 ? '<p class="fine">Initiatives use more than one currency label (' + esc(c.currencies.map(function (x) { return x || 'unlabelled'; }).join(', ')) + '); totals are simple sums, not conversions.</p>' : ''));

    h += section('Not tracked here yet', null, '<p class="fine">Production health and SLOs, evaluation run results, and team capacity have no data entry in the Atlas yet, so they are deliberately not shown. See <a href="#/eval">Evaluation</a>, <a href="#/ops">Operations</a> and <a href="#/leadership">Leadership</a> for reference guidance, and <a href="#/command/sample">the static example Command Centre</a> for an illustration of what those views could contain.</p>');

    /* summary and export */
    var md = L.exporters.summaryMarkdown(s, { sample: U.ws.isSample(), generatedAt: U.ws.today() });
    h += '<section class="wsec"><h2>Summary and export</h2><p class="fine">Generated from the records above, with the scope and assumptions stated in the text.</p>' +
      '<div class="btns"><button class="btn primary" type="button" data-act="dl-md">Download summary (Markdown)</button><button class="btn" type="button" data-act="copy-md">Copy summary</button><button class="btn" type="button" data-act="dl-csv">Download initiatives (CSV)</button><button class="btn" type="button" data-act="print">Print this page</button></div>' +
      '<details><summary>Preview summary text</summary><pre class="wpre" id="md-preview">' + esc(md) + '</pre></details></section>';
    h += '</div>';
    return { html: h, md: md, snap: snap };
  }

  function projectsCsv(snap, sample) {
    var rules = L.rules;
    return L.exporters.toCSV(snap.projects.filter(function (p) { return !p.archived; }), [
      { key: 'name', label: 'Name' }, { key: 'stage', label: 'Stage' }, { key: 'status', label: 'Status' }, { key: 'priority', label: 'Priority' }, { key: 'businessUnit', label: 'Business unit' },
      { key: 'technicalOwner', label: 'Technical owner' }, { key: 'businessOwner', label: 'Business owner' },
      { label: 'Priority score (0-100)', get: function (p) { var r = rules.scoreUseCase(p.scores, rules.DEFAULT_CRITERIA); return r.total === null ? '' : Math.round(r.total * 10) / 10; } },
      { key: 'buildCost', label: 'Build cost estimate' }, { key: 'runCostMonthly', label: 'Run cost estimate / month' }, { key: 'forecastBenefitMonthly', label: 'Forecast benefit / month' }, { key: 'realizedBenefitMonthly', label: 'Realised benefit / month' }, { key: 'currency', label: 'Currency' }
    ], ['Generated ' + U.ws.today(), sample ? 'SAMPLE DATA - fictional records' : 'Personal workspace records', 'Priority score uses the default weights; costs are entered estimates']);
  }

  A.routes.command = {
    render: function (parts, qs) {
      if (parts[0] === 'sample') {
        return { title: 'Static example Command Centre — AWS AI Atlas',
          html: '<div class="wide"><div class="wbanner sample" role="note"><b>ILLUSTRATIVE STATIC CONTENT.</b> The projects, incidents, spend and health figures below are invented examples kept from the original Atlas to show what a command centre could contain. They are not your data and not live telemetry. <a href="#/command">Go to the Command Centre built from your workspace</a>.</div></div>' + A.legacy.pageCommandCentre() };
      }
      var d = dashboard(qs);
      return { title: 'Command Centre — AWS AI Atlas', html: d.html, mount: function (root) { mount(root, d); } };
    }
  };

  function mount(root, d) {
    var f = root.querySelector('[data-filters]');
    if (f) f.addEventListener('change', function () {
      var data = {}; ['window', 'stage', 'status'].forEach(function (k) { data[k] = f.elements[k].value; });
      if (data.window === '14') data.window = '';
      location.hash = '#/command' + U.buildQuery(data);
    });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'sample') { U.ws.setMode('sample'); A.rerender(); U.announce('Showing sample data'); }
      else if (act === 'dl-md') U.download(U.fileName('ai-engineering-summary', 'md'), d.md, 'text/markdown;charset=utf-8');
      else if (act === 'dl-csv') U.download(U.fileName('initiatives', 'csv'), projectsCsv(d.snap, U.ws.isSample()), 'text/csv;charset=utf-8');
      else if (act === 'copy-md') U.copy(d.md, function (ok) { U.announce(ok ? 'Summary copied' : 'Copy failed'); b.textContent = ok ? 'Copied' : 'Copy failed'; setTimeout(function () { b.textContent = 'Copy summary'; }, 1500); });
      else if (act === 'print') window.print();
    });
  }

  A.ui.projectsCsv = projectsCsv;
})();
