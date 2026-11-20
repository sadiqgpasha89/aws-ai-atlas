/* Risk, decision and action registers (plan §6, §14.7). Routes: #/registers/risks|decisions|actions[?new=1|edit=ID|focus=ID|filters]. */
(function () {
  'use strict';
  var A = window.ATLAS, L = A.lib, U = A.ui, esc = U.esc, R = L.rules, E = L.schema.ENUMS;

  function projName(map, id) { return id && map[id] ? '<a href="#/portfolio/p/' + esc(id) + '">' + esc(map[id].name) + '</a>' : '—'; }
  function sevOf(r) { var s = R.riskScore(r.probability, r.impact); return { score: s, sev: R.riskSeverity(s) }; }
  function dueCell(date, today, open) { return date ? esc(date) + (open && date < today ? ' <span class="wbadge bad"><span aria-hidden="true">▲</span> overdue</span>' : '') : '—'; }

  var CONFIG = {
    risks: {
      entity: 'risk', coll: 'risks', title: 'Risk register', sing: 'risk', lede: 'Score = probability × impact (1–25). Critical 15+, High 10–14, Medium 5–9, Low 1–4. Open means status Open or Mitigating.',
      filters: function (q) { return [['status', 'Status', E.riskStatus, q.status], ['category', 'Category', E.riskCategory, q.category]]; },
      match: function (r, q, ctx) {
        if (q.status && r.status !== q.status) return false; if (q.category && r.category !== q.category) return false; if (q.project && r.projectId !== q.project) return false;
        if (q.severity === 'high') { var s = sevOf(r).sev; if (!(R.isOpenRisk(r) && (s === 'High' || s === 'Critical'))) return false; }
        if (q.filter === 'overdue' && !(R.isOpenRisk(r) && r.dueDate && r.dueDate < ctx.today)) return false;
        return true;
      },
      sort: function (a, b) { return (sevOf(b).score || 0) - (sevOf(a).score || 0); },
      heads: ['Risk', 'Severity', 'Status', 'Owner', 'Mitigation due', 'Next review', 'Initiative'],
      row: function (r, ctx) { var s = sevOf(r); return '<td><b>' + esc(r.title) + '</b>' + (r.category ? '<br><small>' + esc(r.category) + '</small>' : '') + (r.mitigation ? '<br><small>Mitigation: ' + esc(r.mitigation) + '</small>' : '') + '</td><td>' + U.badge(s.sev) + ' ' + s.score + '/25<br><small>P' + r.probability + ' × I' + r.impact + '</small></td><td>' + U.badge(r.status) + '</td><td>' + esc(r.owner || '—') + '</td><td>' + dueCell(r.dueDate, ctx.today, R.isOpenRisk(r)) + '</td><td>' + dueCell(r.reviewDate, ctx.today, r.status !== 'Closed') + '</td><td>' + projName(ctx.projects, r.projectId) + '</td>'; },
      csv: [['Title', 'title'], ['Category', 'category'], ['Probability', 'probability'], ['Impact', 'impact'], ['Score', function (r) { return sevOf(r).score; }], ['Severity', function (r) { return sevOf(r).sev; }], ['Status', 'status'], ['Owner', 'owner'], ['Mitigation', 'mitigation'], ['Mitigation due', 'dueDate'], ['Review date', 'reviewDate'], ['Residual risk', 'residualRisk'], ['Initiative id', 'projectId']]
    },
    decisions: {
      entity: 'decision', coll: 'decisions', title: 'Decision log', sing: 'decision', lede: 'Record what was decided, the options considered and when to revisit it. An approved decision past its review date is flagged on the Command Centre.',
      filters: function (q) { return [['status', 'Status', E.decisionStatus, q.status]]; },
      match: function (d, q) { return (!q.status || d.status === q.status) && (!q.project || d.projectId === q.project); },
      sort: function (a, b) { return a.updatedAt < b.updatedAt ? 1 : -1; },
      heads: ['Decision', 'Status', 'Approver', 'Decided', 'Review', 'Initiative'],
      row: function (d, ctx) { return '<td><b>' + esc(d.title) + '</b>' + (d.selectedOption ? '<br><small>Selected: ' + esc(d.selectedOption) + '</small>' : '') + ((d.options || []).length ? '<br><small>Options: ' + esc(d.options.join(' · ')) + '</small>' : '') + (d.rationale ? '<br><small>Why: ' + esc(d.rationale) + '</small>' : '') + '</td><td>' + U.badge(d.status) + '</td><td>' + esc(d.approver || '—') + '</td><td>' + esc(d.decisionDate || '—') + '</td><td>' + dueCell(d.reviewDate, ctx.today, d.status === 'Approved') + '</td><td>' + projName(ctx.projects, d.projectId) + '</td>'; },
      csv: [['Title', 'title'], ['Status', 'status'], ['Options', 'options'], ['Selected option', 'selectedOption'], ['Rationale', 'rationale'], ['Consequences', 'consequences'], ['Approver', 'approver'], ['Decision date', 'decisionDate'], ['Review date', 'reviewDate'], ['Initiative id', 'projectId']]
    },
    actions: {
      entity: 'action', coll: 'actions', title: 'Action tracker', sing: 'action', lede: 'Follow-ups with an owner and a date. Overdue means open or in progress with a due date before today.',
      filters: function (q) { return [['status', 'Status', E.actionStatus, q.status], ['priority', 'Priority', E.priority, q.priority]]; },
      match: function (a, q, ctx) {
        if (q.status && a.status !== q.status) return false; if (q.priority && a.priority !== q.priority) return false;
        if (q.filter === 'overdue' && !((a.status === 'Open' || a.status === 'In progress') && a.dueDate && a.dueDate < ctx.today)) return false;
        if (q.filter === 'open' && !(a.status === 'Open' || a.status === 'In progress')) return false;
        return true;
      },
      sort: function (a, b) { return (a.dueDate || '9999') < (b.dueDate || '9999') ? -1 : 1; },
      heads: ['Action', 'Owner', 'Due', 'Priority', 'Status', 'Related to'],
      row: function (a, ctx) {
        var rel = '—'; if (a.sourceType === 'project' && ctx.projects[a.sourceId]) rel = projName(ctx.projects, a.sourceId); else if (a.sourceType === 'risk' && ctx.risks[a.sourceId]) rel = '<a href="#/registers/risks?focus=' + esc(a.sourceId) + '">Risk: ' + esc(ctx.risks[a.sourceId].title) + '</a>';
        return '<td><b>' + esc(a.title) + '</b>' + (a.description ? '<br><small>' + esc(a.description) + '</small>' : '') + '</td><td>' + esc(a.owner || '—') + '</td><td>' + dueCell(a.dueDate, ctx.today, a.status === 'Open' || a.status === 'In progress') + '</td><td>' + esc(a.priority || '—') + '</td><td>' + U.badge(a.status) + '</td><td>' + rel + '</td>';
      },
      csv: [['Action', 'title'], ['Details', 'description'], ['Owner', 'owner'], ['Due date', 'dueDate'], ['Priority', 'priority'], ['Status', 'status'], ['Related type', 'sourceType'], ['Related id', 'sourceId']]
    }
  };

  function page(kind, qs) {
    var cfg = CONFIG[kind]; if (!cfg) return U.notFound('That register');
    var q = U.parseQuery(qs), store = U.ws.store(), ctx = { today: U.ws.today(), projects: {}, risks: {} };
    store.list('projects', { includeArchived: true }).forEach(function (p) { ctx.projects[p.id] = p; });
    store.list('risks').forEach(function (r) { ctx.risks[r.id] = r; });
    var all = store.list(cfg.coll), rows = all.filter(function (r) { return cfg.match(r, q, ctx); }).sort(cfg.sort);
    var editing = q.edit ? store.get(cfg.coll, q.edit) : null;
    var h = '<div class="wide">' + U.banner() + '<div class="eyebrow">Registers</div><h1>' + esc(cfg.title) + '</h1>' + U.subnav('Registers', U.REGISTER_NAV, kind) + '<p class="lede">' + esc(cfg.lede) + '</p>';

    if (q.new === '1' || q.edit) {
      if (q.edit && !editing) h += '<p>That record no longer exists. <a href="#/registers/' + kind + '">Back to the list</a>.</p>';
      else {
        var defaults = { projectId: q.project || '' }; if (q.ref) defaults.ref = q.ref; defaults.projectId = q.project || '';
        h += '<section class="wsec wformbox"><h2>' + (editing ? 'Edit ' + cfg.sing : 'New ' + cfg.sing) + '</h2><p class="fine">Do not enter credentials, customer personal data or other sensitive records: browser-local data is not encrypted.</p>' +
          U.forms.formHtml(cfg.entity, editing, { cancelHref: '#/registers/' + kind, createLabel: 'Add ' + cfg.sing, defaults: defaults }) + '</section>';
      }
    }

    var fl = cfg.filters(q);
    h += '<form class="wfilters" data-filters aria-label="Filter ' + kind + '"><div class="wrow">' + fl.map(function (f) { return U.field('rf-' + f[0], f[1], U.select('rf-' + f[0], f[0], f[2], f[3] || '', { blankLabel: 'Any' })); }).join('') +
      U.field('rf-project', 'Initiative', U.select('rf-project', 'project', Object.keys(ctx.projects).map(function (id) { return [id, ctx.projects[id].name]; }), q.project || '', { blankLabel: 'Any' })) + '</div></form>';
    var extra = []; if (q.severity === 'high') extra.push('open critical and high risks only'); if (q.filter === 'overdue') extra.push('overdue only'); if (q.filter === 'open') extra.push('open only');
    h += '<p class="fine" aria-live="polite">' + rows.length + ' of ' + all.length + ' ' + kind + ' shown' + (extra.length ? ' (' + extra.join(', ') + ')' : '') + '. ' + (extra.length || q.project || q.status ? '<a href="#/registers/' + kind + '">Clear filters</a>' : '') + '</p>';

    if (!all.length) h += '<section class="wempty"><h2>No ' + kind + ' yet</h2><p>' + (kind === 'risks' ? 'Capture what could go wrong, how likely and how severe it is, who owns the mitigation and when it is due.' : kind === 'decisions' ? 'Log decisions with their options and rationale so they can be reviewed later.' : 'Capture follow-ups with an owner and a date.') + '</p><a class="btn primary" href="#/registers/' + kind + '?new=1">Add the first ' + cfg.sing + '</a></section>';
    else if (!rows.length) h += '<p>Nothing matches these filters.</p>';
    else {
      h += '<div class="tablewrap"><table class="wtable"><thead><tr>' + cfg.heads.map(function (x) { return '<th scope="col">' + esc(x) + '</th>'; }).join('') + '<th scope="col">Manage</th></tr></thead><tbody>' +
        rows.map(function (r) {
          var quick = kind === 'actions' && (r.status === 'Open' || r.status === 'In progress') ? ' <button class="btn sm" type="button" data-act="done" data-id="' + esc(r.id) + '">Mark done</button>' : '';
          return '<tr id="row-' + esc(r.id) + '"' + (q.focus === r.id ? ' class="focus" tabindex="-1"' : '') + '>' + cfg.row(r, ctx) + '<td><a class="btn sm" href="#/registers/' + kind + '?edit=' + esc(r.id) + '">Edit</a>' + quick + ' <button class="btn sm" type="button" data-act="delete" data-id="' + esc(r.id) + '" aria-label="Delete ' + esc(r.title) + '">Delete</button></td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    h += '<div class="btns"><a class="btn primary" href="#/registers/' + kind + '?new=1">Add ' + cfg.sing + '</a>' + (all.length ? '<button class="btn" type="button" data-act="csv">Download CSV</button>' : '') + '</div></div>';
    return { html: h, title: cfg.title + ' — AWS AI Atlas', mount: function (root) { mount(root, kind, cfg, rows); } };
  }

  function mount(root, kind, cfg, rows) {
    var store = U.ws.store(), f = root.querySelector('[data-filters]'), q = U.parseQuery((location.hash.split('?')[1]) || '');
    if (f) f.addEventListener('change', function () {
      var d = {}; Array.prototype.forEach.call(f.elements, function (el) { if (el.name) d[el.name] = el.value; }); if (q.filter) d.filter = q.filter; if (q.severity) d.severity = q.severity;
      location.hash = '#/registers/' + kind + U.buildQuery(d);
    });
    var form = root.querySelector('form.wf');
    if (form) {
      U.forms.bind(form, { done: function () { location.hash = '#/registers/' + kind; } });
      var first = form.querySelector('input[name=title]'); if (first) first.focus();
    }
    if (q.focus) { var row = root.querySelector('#row-' + q.focus.replace(/[^A-Za-z0-9_-]/g, '')); if (row) { row.scrollIntoView({ block: 'center' }); row.focus({ preventScroll: true }); } }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return; var act = b.getAttribute('data-act'), id = b.getAttribute('data-id');
      if (act === 'delete') { var rec = store.get(cfg.coll, id); if (rec && window.confirm('Delete "' + rec.title + '"? This cannot be undone.')) { store.remove(cfg.coll, id); U.announce('Deleted'); A.rerender(); } }
      else if (act === 'done') { store.update('actions', id, { status: 'Done' }); U.announce('Marked done'); A.rerender(); }
      else if (act === 'csv') {
        var cols = cfg.csv.map(function (c) { return { label: c[0], get: typeof c[1] === 'function' ? c[1] : function (r) { return r[c[1]]; } }; });
        U.download(U.fileName(kind, 'csv'), L.exporters.toCSV(rows, cols, ['Generated ' + U.ws.today(), U.ws.isSample() ? 'SAMPLE DATA - fictional records' : 'Personal workspace records']), 'text/csv;charset=utf-8');
      }
    });
  }

  A.routes.registers = { render: function (parts, qs) { return page(parts[0] || 'risks', qs); } };
})();
