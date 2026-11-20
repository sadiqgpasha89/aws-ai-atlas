/* Portfolio and use-case management (plan §6). Routes: #/portfolio, #/portfolio/new, #/portfolio/p/:id[/edit]. */
(function () {
  'use strict';
  var A = window.ATLAS, L = A.lib, U = A.ui, esc = U.esc, R = L.rules, E = L.schema.ENUMS;

  function criteria() { return U.ws.store().getCriteria() || R.DEFAULT_CRITERIA; }
  function score(p) { return R.scoreUseCase(p.scores, criteria()); }
  function ctxFor(store) { return { today: U.ws.today(), risks: store.list('risks'), actions: store.list('actions') }; }
  function nextMilestone(p) {
    var open = (p.milestones || []).filter(function (m) { return !m.done; }).sort(function (a, b) { return a.dueDate < b.dueDate ? -1 : 1; })[0];
    return open ? open : null;
  }
  function scoreCell(p) { var s = score(p); return s.complete ? '<b>' + U.num(s.total, 1) + '</b>/100' : '<span class="fine">' + U.badge('Incomplete', 'Missing: ' + s.missing.join(', ')) + '</span>'; }
  function healthCell(p, ctx) {
    var h = R.deriveHealth(p, ctx);
    return U.badge(p.status) + (h.differs && h.derived !== 'Healthy' ? ' <span class="wbadge warn" title="' + esc('Records suggest ' + h.derived + ': ' + h.reasons.join(', ')) + '"><span aria-hidden="true">?</span> records suggest ' + esc(h.derived) + '</span>' : '');
  }

  /* ---------- list ---------- */
  function listPage(qs) {
    var q = U.parseQuery(qs), store = U.ws.store(), ctx = ctxFor(store);
    if (q.view === 'milestones') return milestonesPage(store);
    var all = store.list('projects', { includeArchived: q.archived === '1' });
    var text = (q.q || '').toLowerCase();
    var statuses = q.status ? q.status.split(',') : [];
    var rows = all.filter(function (p) {
      return (!q.stage || p.stage === q.stage) && (!statuses.length || statuses.indexOf(p.status) > -1) && (q.active !== '1' || p.stage !== 'Sunset/Rejected') && (!text || (p.name + ' ' + (p.problem || '') + ' ' + (p.businessUnit || '')).toLowerCase().indexOf(text) > -1);
    });
    var sort = q.sort || 'updated';
    rows.sort(function (a, b) {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'score') { var x = score(a).total, y = score(b).total; return (y === null ? -1 : y) - (x === null ? -1 : x); }
      if (sort === 'stage') return R.STAGES.indexOf(a.stage) - R.STAGES.indexOf(b.stage);
      if (sort === 'status') return E.projectStatus.indexOf(b.status) - E.projectStatus.indexOf(a.status);
      return a.updatedAt < b.updatedAt ? 1 : -1;
    });
    var h = '<div class="wide">' + U.banner() + '<div class="eyebrow">Portfolio</div><h1>AI initiatives</h1>' +
      '<p class="lede">Track use cases from idea to scale, score them against a transparent model, and keep the history of every stage change.</p>' + U.subnav('Portfolio sections', U.PORTFOLIO_NAV, 'list');
    h += '<form class="wfilters" data-filters aria-label="Filter initiatives"><div class="wrow">' +
      U.field('pf-q', 'Search', U.input('pf-q', 'q', 'search', q.q || '')) +
      U.field('pf-stage', 'Stage', U.select('pf-stage', 'stage', R.STAGES, q.stage || '', { blankLabel: 'All stages' })) +
      U.field('pf-status', 'Status', U.select('pf-status', 'status', E.projectStatus, statuses.length === 1 ? q.status : '', { blankLabel: statuses.length > 1 ? 'Several (' + statuses.join(', ') + ')' : 'All statuses' })) +
      U.field('pf-sort', 'Sort by', U.select('pf-sort', 'sort', [['updated', 'Recently updated'], ['score', 'Priority score'], ['name', 'Name'], ['stage', 'Stage'], ['status', 'Status (worst first)']], sort, { blank: false })) +
      '<div class="wfield"><label for="pf-arch"><input type="checkbox" id="pf-arch" name="archived" value="1"' + (q.archived === '1' ? ' checked' : '') + '> Show archived</label></div></div></form>';
    h += '<p class="fine" aria-live="polite">' + rows.length + ' of ' + all.length + ' initiative(s) shown' + (q.active === '1' ? ' (active only: rejected and archived excluded)' : '') + '. ' + (statuses.length > 1 || q.active === '1' ? '<a href="#/portfolio">Clear filters</a>' : '') + '</p>';
    if (!all.length) {
      h += '<section class="wempty"><h2>No initiatives yet</h2><p>Add the first one with the intake form. You can score and prioritise once you have two or more.</p><div class="btns"><a class="btn primary" href="#/portfolio/new">New initiative</a>' +
        (U.ws.isSample() ? '' : '<button class="btn" type="button" data-act="sample">Explore with sample data</button>') + '</div></section>';
    } else if (!rows.length) {
      h += '<p>No initiatives match these filters. <a href="#/portfolio">Clear filters</a>.</p>';
    } else {
      h += '<div class="tablewrap"><table class="wtable"><thead><tr><th scope="col">Initiative</th><th scope="col">Stage</th><th scope="col">Status</th><th scope="col">Priority</th><th scope="col">Score</th><th scope="col">Recommendation</th><th scope="col">Next milestone</th></tr></thead><tbody>' +
        rows.map(function (p) {
          var nm = nextMilestone(p);
          return '<tr><td><a href="#/portfolio/p/' + esc(p.id) + '"><b>' + esc(p.name) + '</b></a>' + (p.archived ? ' <span class="wbadge muted">archived</span>' : '') + '<br><small>' + esc(p.businessUnit || '') + '</small></td><td>' + esc(p.stage) + '</td><td>' + healthCell(p, ctx) + '</td><td>' + esc(p.priority || '—') +
            '</td><td>' + scoreCell(p) + '</td><td>' + (p.recommendation ? U.badge(p.recommendation) : '—') + '</td><td>' + (nm ? esc(nm.title) + '<br><small>' + esc(nm.dueDate) + (nm.dueDate < ctx.today ? ' — overdue' : '') + '</small>' : '—') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    h += '<div class="btns"><a class="btn primary" href="#/portfolio/new">New initiative</a><button class="btn" type="button" data-act="csv">Download CSV</button></div></div>';
    return { html: h, title: 'AI initiatives — AWS AI Atlas', mount: function (root) { mountList(root); } };
  }

  function milestonesPage(store) {
    var today = U.ws.today(), rows = [];
    store.list('projects').forEach(function (p) { if (p.stage === 'Sunset/Rejected') return; (p.milestones || []).forEach(function (m) { if (!m.done) rows.push({ p: p, m: m }); }); });
    rows.sort(function (a, b) { return a.m.dueDate < b.m.dueDate ? -1 : 1; });
    var h = '<div class="wide">' + U.banner() + '<div class="eyebrow">Portfolio</div><h1>Open milestones</h1>' + U.subnav('Portfolio sections', U.PORTFOLIO_NAV, 'list') +
      '<p class="fine">All milestones not marked done, earliest first. <a href="#/portfolio">Back to initiatives</a></p>' +
      (rows.length ? '<div class="tablewrap"><table class="wtable"><thead><tr><th scope="col">Due</th><th scope="col">Milestone</th><th scope="col">Initiative</th><th scope="col">Timing</th></tr></thead><tbody>' + rows.map(function (r) {
        var late = r.m.dueDate < today;
        return '<tr><td>' + esc(r.m.dueDate) + '</td><td>' + esc(r.m.title) + '</td><td><a href="#/portfolio/p/' + esc(r.p.id) + '">' + esc(r.p.name) + '</a></td><td>' + (late ? '<span class="wbadge bad"><span aria-hidden="true">▲</span> ' + R.daysBetween(r.m.dueDate, today) + ' days late</span>' : 'in ' + R.daysBetween(today, r.m.dueDate) + ' days') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<p>No open milestones.</p>') + '</div>';
    return { html: h, title: 'Open milestones — AWS AI Atlas' };
  }

  function mountList(root) {
    var f = root.querySelector('[data-filters]');
    if (f) {
      var go = function () { var d = {}; ['q', 'stage', 'status', 'sort'].forEach(function (k) { d[k] = f.elements[k].value; }); if (d.sort === 'updated') d.sort = ''; d.archived = f.elements.archived.checked ? '1' : ''; var cur = U.parseQuery((location.hash.split('?')[1]) || ''); if (cur.active === '1') d.active = '1'; location.hash = '#/portfolio' + U.buildQuery(d); };
      f.addEventListener('change', go); f.addEventListener('submit', function (e) { e.preventDefault(); go(); });
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      if (b.getAttribute('data-act') === 'sample') { U.ws.setMode('sample'); A.rerender(); }
      if (b.getAttribute('data-act') === 'csv') U.download(U.fileName('initiatives', 'csv'), U.projectsCsv(U.ws.store().snapshot(), U.ws.isSample()), 'text/csv;charset=utf-8');
    });
  }

  /* ---------- new / edit ---------- */
  function formPage(id) {
    var store = U.ws.store(), rec = id ? store.get('projects', id) : null;
    if (id && !rec) return U.notFound('That initiative');
    var h = '<div class="wide">' + U.banner() + '<div class="eyebrow">Portfolio</div><h1>' + (rec ? 'Edit initiative' : 'New initiative') + '</h1>' + U.subnav('Portfolio sections', U.PORTFOLIO_NAV, rec ? 'list' : 'new') +
      '<p class="fine">Fields marked * are required. Everything else can be filled in later. Do not enter credentials, customer personal data or other sensitive records here: browser-local data is not encrypted.</p>' +
      U.forms.formHtml('project', rec, { cancelHref: rec ? '#/portfolio/p/' + id : '#/portfolio', createLabel: 'Create initiative' }) + '</div>';
    return { html: h, title: (rec ? 'Edit ' + rec.name : 'New initiative') + ' — AWS AI Atlas', mount: function (root) {
      U.forms.bind(root.querySelector('form.wf'), { done: function (r) { location.hash = '#/portfolio/p/' + r.id; } });
      var first = root.querySelector('input[name=name]'); if (first) first.focus();
    } };
  }

  /* ---------- detail ---------- */
  function kv(label, value) { return value ? '<div class="wkv"><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd></div>' : ''; }

  function detailPage(id, parts) {
    if (parts[0] === 'edit') return formPage(id);
    var store = U.ws.store(), p = store.get('projects', id);
    if (!p) return U.notFound('That initiative');
    var ctx = ctxFor(store), crit = criteria(), sc = score(p), quad = R.quadrant(p.scores), sens = sc.complete ? R.sensitivity(p.scores, crit) : [];
    var risks = store.list('risks').filter(function (r) { return r.projectId === id; }), decisions = store.list('decisions').filter(function (d) { return d.projectId === id; });
    var actions = store.list('actions').filter(function (a) { return a.sourceType === 'project' && a.sourceId === id; });
    var health = R.deriveHealth(p, ctx), cur = p.currency || '';
    var h = '<div class="wide">' + U.banner() + '<div class="eyebrow"><a href="#/portfolio">Portfolio</a> / Initiative</div>';
    h += '<h1>' + esc(p.name) + (p.archived ? ' <span class="wtag">ARCHIVED</span>' : '') + '</h1>';
    h += '<p>' + U.badge(p.status) + ' <span class="wbadge muted">Stage: ' + esc(p.stage) + '</span> ' + (p.priority ? '<span class="wbadge muted">Priority: ' + esc(p.priority) + '</span> ' : '') + (p.recommendation ? U.badge(p.recommendation) : '') + '</p>';
    h += '<div class="btns"><a class="btn primary" href="#/portfolio/p/' + esc(id) + '/edit">Edit details</a><button class="btn" type="button" data-act="archive">' + (p.archived ? 'Restore from archive' : 'Archive') + '</button><button class="btn" type="button" data-act="delete">Delete permanently</button>' +
      '<a class="btn" href="#/calc/roi?project=' + esc(id) + '">Open ROI calculator with these numbers</a></div>';
    if (health.reasons.length) h += '<div class="wbanner ' + (health.differs ? 'warn' : 'info') + '" role="note"><b>Records suggest: ' + esc(health.derived) + '.</b> ' + esc(health.reasons.join('; ')) + '. Recorded status is ' + esc(p.status) + '; this hint never changes it automatically.</div>';

    h += '<section class="wsec"><h2>Overview</h2><dl class="wdl">' + kv('Problem', p.problem) + kv('Business unit', p.businessUnit) + kv('Sponsor', p.sponsor) + kv('Business owner', p.businessOwner) + kv('Technical owner', p.technicalOwner) + kv('Target users', p.targetUsers) +
      kv('Business KPI', p.kpi) + kv('Baseline', p.baseline) + kv('Target', p.target) + kv('Expected benefits', p.benefits) + kv('AI pattern', p.pattern) + kv('Data sources', p.dataSources) + kv('Data owner', p.dataOwner) + kv('Data readiness', p.dataReadiness) + kv('Data sensitivity', p.dataSensitivity) +
      kv('Volume', p.volume) + kv('Latency need', p.latencyNeed) + kv('Human oversight', p.humanOversight) + kv('Risk level', p.riskLevel) + kv('Constraints and dependencies', p.constraints) + kv('Assumptions and alternatives', p.assumptions) + '</dl></section>';

    /* lifecycle */
    var allowed = R.allowedTransitions(p.stage);
    h += '<section class="wsec"><h2>Lifecycle</h2><p>Current stage: <b>' + esc(p.stage) + '</b>. Moving backward, rejecting or reopening requires a rationale; every move is recorded.</p>' +
      '<form class="wf inline" data-stage-form novalidate><div class="wsummary" role="alert" hidden></div><div class="wgrid">' +
      U.field('st-to', 'Move to', U.select('st-to', 'to', allowed, '', { req: true })) + U.field('st-note', 'Rationale / note', U.textarea('st-note', 'note', '', 2), { wide: true }) +
      '</div><button class="btn primary" type="submit">Record stage change</button></form>' +
      '<h3>Stage history</h3><div class="tablewrap"><table class="wtable"><thead><tr><th scope="col">When</th><th scope="col">Stage</th><th scope="col">Note</th></tr></thead><tbody>' +
      (p.stageHistory || []).slice().reverse().map(function (x) { return '<tr><td>' + esc(String(x.at).slice(0, 10)) + '</td><td>' + esc(x.stage) + '</td><td>' + esc(x.note || '') + '</td></tr>'; }).join('') + '</tbody></table></div></section>';

    /* scoring */
    h += '<section class="wsec" id="scoring"><h2>Prioritisation scores</h2><p>Scores are stakeholder judgements from 1 to 5, not measured facts. Write the evidence or reasoning in each rationale so others can challenge it. Weights: <a href="#/portfolio/prioritise">change in Prioritisation</a>.</p>' +
      '<form class="wf" data-score-form novalidate><div class="wsummary" role="alert" hidden></div><div class="wscores">' + crit.map(function (c) {
        var v = p.scores && p.scores[c.id], rat = (p.scoreRationale && p.scoreRationale[c.id]) || '';
        return '<div class="wscore"><label for="sc-' + c.id + '">' + esc(c.label) + ' <small>(' + c.weight + '%' + (c.invert ? ', lower is better' : '') + ')</small></label>' + U.select('sc-' + c.id, 'score_' + c.id, [1, 2, 3, 4, 5], v || '', { blankLabel: 'Not scored' }) +
          '<small id="sc-' + c.id + '-help">' + esc(c.help || '') + '</small><label class="sr-only" for="rt-' + c.id + '">Rationale for ' + esc(c.label) + '</label><input id="rt-' + c.id + '" name="rationale_' + c.id + '" type="text" maxlength="300" placeholder="Evidence or reasoning" value="' + esc(rat) + '"></div>';
      }).join('') + '</div><div class="wgrid">' +
      U.field('sc-rec', 'Recommendation', U.select('sc-rec', 'recommendation', E.recommendation, p.recommendation || '', { blankLabel: 'Not decided' })) +
      U.field('sc-recr', 'Recommendation rationale', U.textarea('sc-recr', 'recommendationRationale', p.recommendationRationale, 2), { wide: true }) + '</div>' +
      '<button class="btn primary" type="submit">Save scores</button></form>';
    if (sc.complete) {
      h += '<h3>Result: ' + U.num(sc.total, 1) + ' / 100' + (quad ? ' · ' + esc(quad.name) : '') + '</h3><div class="tablewrap"><table class="wtable"><caption class="sr-only">Score breakdown</caption><thead><tr><th scope="col">Criterion</th><th scope="col">Weight</th><th scope="col">Score (1–5)</th><th scope="col">Normalised (0–100)</th><th scope="col">Contribution</th></tr></thead><tbody>' +
        sc.breakdown.map(function (b) { return '<tr><td>' + esc(b.label) + '</td><td>' + b.weight + '%</td><td>' + b.score + '</td><td>' + U.num(b.normalized, 0) + '</td><td>' + U.num(b.contribution, 1) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<p class="fine">Total = Σ weight × normalised score. Normalised = (score − 1) / 4 × 100; for risk the scale is inverted, so higher risk lowers the total.</p>' +
        '<h3>What moves the result most</h3><div class="tablewrap"><table class="wtable"><thead><tr><th scope="col">Criterion</th><th scope="col">If score +1</th><th scope="col">If score −1</th></tr></thead><tbody>' +
        sens.map(function (s) { return '<tr><td>' + esc(s.label) + ' (now ' + s.score + ')</td><td>' + (s.ifHigher >= 0 ? '+' : '') + U.num(s.ifHigher, 1) + '</td><td>' + (s.ifLower >= 0 ? '+' : '') + U.num(s.ifLower, 1) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    } else h += '<p class="fine">No total yet: ' + sc.missing.length + ' criterion/criteria not scored (' + esc(sc.missing.join(', ')) + '). Missing scores are never treated as zero.</p>';
    h += '</section>';

    /* milestones */
    h += '<section class="wsec"><h2>Milestones</h2>' + ((p.milestones || []).length ? '<ul class="wlist">' + p.milestones.slice().sort(function (a, b) { return a.dueDate < b.dueDate ? -1 : 1; }).map(function (m) {
      var late = !m.done && m.dueDate < ctx.today;
      return '<li><b>' + esc(m.title) + '</b> — ' + esc(m.dueDate) + ' ' + (m.done ? U.badge('Done') : late ? '<span class="wbadge bad"><span aria-hidden="true">▲</span> overdue</span>' : '<span class="wbadge muted">open</span>') +
        ' <button class="btn sm" type="button" data-act="ms-toggle" data-id="' + esc(m.id) + '">' + (m.done ? 'Reopen' : 'Mark done') + '</button> <button class="btn sm" type="button" data-act="ms-del" data-id="' + esc(m.id) + '" aria-label="Delete milestone ' + esc(m.title) + '">Delete</button></li>';
    }).join('') + '</ul>' : '<p class="fine">No milestones yet.</p>') +
      '<form class="wf inline" data-ms-form novalidate><div class="wsummary" role="alert" hidden></div><div class="wgrid">' + U.field('ms-title', 'New milestone', U.input('ms-title', 'title', 'text', '', { req: true, maxlength: 160 }), { req: true }) + U.field('ms-date', 'Due date', U.input('ms-date', 'dueDate', 'date', '', { req: true }), { req: true }) + '</div><button class="btn" type="submit">Add milestone</button></form></section>';

    /* benefits */
    var f = p.forecastBenefitMonthly, r = p.realizedBenefitMonthly;
    h += '<section class="wsec"><h2>Cost and benefit</h2><p class="fine">Your own entries. Edit them in <a href="#/portfolio/p/' + esc(id) + '/edit">Edit details</a>. Realised benefit is recorded separately from the forecast.</p><div class="tablewrap"><table class="wtable"><tbody>' +
      '<tr><th scope="row">Estimated build cost</th><td>' + U.money(p.buildCost, cur, 0) + '</td></tr><tr><th scope="row">Estimated run cost / month</th><td>' + U.money(p.runCostMonthly, cur, 0) + '</td></tr>' +
      '<tr><th scope="row">Forecast benefit / month</th><td>' + U.money(f, cur, 0) + '</td></tr><tr><th scope="row">Realised benefit / month</th><td>' + U.money(r, cur, 0) + '</td></tr>' +
      '<tr><th scope="row">Realised vs forecast</th><td>' + (typeof f === 'number' && f > 0 && typeof r === 'number' ? U.pct(r / f * 100, 0) + ' (variance ' + U.money(r - f, cur, 0) + ' / month)' : 'Needs both values') + '</td></tr></tbody></table></div></section>';

    /* linked records */
    function linkList(title, items, href, newHref, label) {
      return '<h3>' + esc(title) + ' (' + items.length + ')</h3>' + (items.length ? '<ul class="wlist">' + items.map(function (x) { return '<li><a href="' + href + esc(x.id) + '">' + esc(x.title) + '</a> ' + label(x) + '</li>'; }).join('') + '</ul>' : '<p class="fine">None linked.</p>') + '<a class="btn sm" href="' + newHref + '">Add</a>';
    }
    h += '<section class="wsec"><h2>Linked records</h2>' +
      linkList('Risks', risks, '#/registers/risks?focus=', '#/registers/risks?new=1&project=' + esc(id), function (r) { return U.badge(R.riskSeverity(R.riskScore(r.probability, r.impact))) + ' ' + U.badge(r.status); }) +
      linkList('Decisions', decisions, '#/registers/decisions?focus=', '#/registers/decisions?new=1&project=' + esc(id), function (d) { return U.badge(d.status); }) +
      linkList('Actions', actions, '#/registers/actions?focus=', '#/registers/actions?new=1&ref=project:' + esc(id), function (a) { return U.badge(a.status) + (a.dueDate ? ' due ' + esc(a.dueDate) : ''); }) + '</section></div>';

    return { html: h, title: p.name + ' — AWS AI Atlas', mount: function (root) { mountDetail(root, id, crit); } };
  }

  function mountDetail(root, id, crit) {
    var store = U.ws.store();
    function refresh(msg) { A.rerender(); if (msg) U.announce(msg); }
    var sf = root.querySelector('[data-stage-form]');
    sf.addEventListener('submit', function (e) {
      e.preventDefault();
      var res = store.moveStage(id, sf.elements.to.value, sf.elements.note.value, R);
      if (!res.ok) return U.showErrors(sf, res.errors.map(function (x) { return { path: x.path === 'stage' ? 'to' : x.path, message: x.message }; }));
      refresh('Stage changed to ' + sf.elements.to.value);
    });
    var form = root.querySelector('[data-score-form]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var scores = {}, rat = {};
      crit.forEach(function (c) {
        var v = form.elements['score_' + c.id].value; if (v !== '') scores[c.id] = Number(v);
        var t = form.elements['rationale_' + c.id].value.trim(); if (t) rat[c.id] = t;
      });
      var res = store.update('projects', id, { scores: scores, scoreRationale: rat, recommendation: form.elements.recommendation.value, recommendationRationale: form.elements.recommendationRationale.value.trim() });
      if (!res.ok) return U.showErrors(form, res.errors);
      refresh('Scores saved');
    });
    var mf = root.querySelector('[data-ms-form]');
    mf.addEventListener('submit', function (e) {
      e.preventDefault();
      var p = store.get('projects', id), ms = (p.milestones || []).concat([{ id: 'm-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), title: mf.elements.title.value.trim(), dueDate: mf.elements.dueDate.value, done: false }]);
      var res = store.update('projects', id, { milestones: ms });
      if (!res.ok) return U.showErrors(mf, res.errors.map(function (x) { return { path: /dueDate/.test(x.path) ? 'dueDate' : 'title', message: x.message }; }));
      refresh('Milestone added');
    });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.getAttribute('data-act'), p = store.get('projects', id);
      if (act === 'ms-toggle') { store.update('projects', id, { milestones: p.milestones.map(function (m) { return m.id === b.getAttribute('data-id') ? Object.assign({}, m, { done: !m.done }) : m; }) }); refresh('Milestone updated'); }
      else if (act === 'ms-del') { store.update('projects', id, { milestones: p.milestones.filter(function (m) { return m.id !== b.getAttribute('data-id'); }) }); refresh('Milestone deleted'); }
      else if (act === 'archive') { store.archive(id, !p.archived); refresh(p.archived ? 'Restored' : 'Archived'); }
      else if (act === 'delete') {
        if (window.confirm('Delete "' + p.name + '" permanently? Linked risks, decisions and actions keep their text but lose the link. This cannot be undone.')) {
          ['risks', 'decisions'].forEach(function (c) { store.list(c, { includeArchived: true }).forEach(function (r) { if (r.projectId === id) store.update(c, r.id, { projectId: null }); }); });
          store.list('actions').forEach(function (a) { if (a.sourceType === 'project' && a.sourceId === id) store.update('actions', a.id, { sourceType: 'manual', sourceId: null }); });
          store.remove('projects', id); U.announce('Initiative deleted'); location.hash = '#/portfolio';
        }
      }
    });
  }

  A.routes.portfolio = {
    render: function (parts, qs) {
      if (parts[0] === 'new') return formPage(null);
      if (parts[0] === 'p' && parts[1]) return detailPage(parts[1], parts.slice(2));
      if (parts[0] === 'prioritise') return A.ui.prioritisePage(qs);
      return listPage(qs);
    }
  };
})();
