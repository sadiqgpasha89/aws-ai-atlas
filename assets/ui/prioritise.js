/* Prioritisation: weighted scoring, matrix, sensitivity, comparison, export (plan §6.3). Route: #/portfolio/prioritise. */
(function () {
  'use strict';
  var A = window.ATLAS, L = A.lib, U = A.ui, esc = U.esc, R = L.rules;

  function eligible(store, includeRejected) {
    return store.list('projects').filter(function (p) { return includeRejected || p.stage !== 'Sunset/Rejected'; });
  }

  function matrixSvg(ranked) {
    var W = 520, H = 400, m = { l: 56, r: 20, t: 20, b: 52 };
    function x(v) { return m.l + (v - 1) / 4 * (W - m.l - m.r); }
    function y(v) { return H - m.b - (v - 1) / 4 * (H - m.t - m.b); }
    var seen = {}, dots = '';
    ranked.forEach(function (it, i) {
      var q = it.quad, key = q.feasibility + ':' + q.value, n = seen[key] = (seen[key] || 0) + 1, ang = (n - 1) * 2.1, off = n === 1 ? 0 : 14;
      var cx = x(q.feasibility) + Math.cos(ang) * off, cy = y(q.value) + Math.sin(ang) * off;
      dots += '<g><title>' + esc(it.p.name + ': value ' + q.value + ', feasibility ' + q.feasibility + ' (' + q.name + ')') + '</title><circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="11" class="mdot"/><text x="' + cx.toFixed(1) + '" y="' + (cy + 4).toFixed(1) + '" text-anchor="middle" class="mnum">' + (i + 1) + '</text></g>';
    });
    var grid = '';
    for (var v = 1; v <= 5; v++) grid += '<text x="' + (m.l - 10) + '" y="' + (y(v) + 4) + '" text-anchor="end" class="maxis">' + v + '</text><text x="' + x(v) + '" y="' + (H - m.b + 18) + '" text-anchor="middle" class="maxis">' + v + '</text>';
    return '<svg class="wmatrix" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="mx-t mx-d"><title id="mx-t">Business value versus feasibility matrix</title><desc id="mx-d">' + ranked.length + ' initiatives plotted by business value (vertical) and feasibility, the mean of technical feasibility and data readiness (horizontal). The same numbers are in the ranking table.</desc>' +
      '<rect x="' + x(3) + '" y="' + m.t + '" width="' + (W - m.r - x(3)) + '" height="' + (y(3) - m.t) + '" class="mq win"/>' +
      '<line x1="' + x(3) + '" y1="' + m.t + '" x2="' + x(3) + '" y2="' + (H - m.b) + '" class="mline"/><line x1="' + m.l + '" y1="' + y(3) + '" x2="' + (W - m.r) + '" y2="' + y(3) + '" class="mline"/>' +
      '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" class="mframe"/>' + grid +
      '<text x="' + (x(3) + (W - m.r - x(3)) / 2) + '" y="' + (m.t + 16) + '" text-anchor="middle" class="mlabel">Quick win</text><text x="' + (m.l + (x(3) - m.l) / 2) + '" y="' + (m.t + 16) + '" text-anchor="middle" class="mlabel">Strategic bet</text>' +
      '<text x="' + (x(3) + (W - m.r - x(3)) / 2) + '" y="' + (H - m.b - 8) + '" text-anchor="middle" class="mlabel">Low-value fill-in</text><text x="' + (m.l + (x(3) - m.l) / 2) + '" y="' + (H - m.b - 8) + '" text-anchor="middle" class="mlabel">Deprioritise</text>' +
      '<text x="' + ((m.l + W - m.r) / 2) + '" y="' + (H - 10) + '" text-anchor="middle" class="maxis">Feasibility (mean of technical feasibility and data readiness) →</text>' +
      '<text transform="translate(14 ' + ((m.t + H - m.b) / 2) + ') rotate(-90)" text-anchor="middle" class="maxis">Business value →</text>' + dots + '</svg>';
  }

  A.ui.prioritisePage = function (qs) {
    var q = U.parseQuery(qs), store = U.ws.store(), crit = store.getCriteria() || R.DEFAULT_CRITERIA, v = R.validateCriteria(crit);
    var items = eligible(store, q.rejected === '1'), scored = items.map(function (p) { return { p: p, s: R.scoreUseCase(p.scores, crit), quad: R.quadrant(p.scores) }; });
    var ranked = scored.filter(function (x) { return x.s.complete; }).sort(function (a, b) { return b.s.total - a.s.total || a.p.name.localeCompare(b.p.name); });
    var incomplete = scored.filter(function (x) { return !x.s.complete; });
    var stab = R.rankStability(ranked.map(function (x) { return { id: x.p.id, scores: x.p.scores }; }), crit, 5);

    var h = '<div class="wide">' + U.banner() + '<div class="eyebrow">Portfolio</div><h1>Prioritisation</h1>' + U.subnav('Portfolio sections', U.PORTFOLIO_NAV, 'prioritise');
    h += '<p class="lede">A transparent weighted score for comparing initiatives. It supports a conversation; it does not make the decision. Scores are stakeholder judgements, so record the reasoning behind each one.</p>';
    h += '<details class="wdetails"><summary>How the score is calculated</summary><ol><li>Each criterion is scored 1–5 on the initiative page.</li><li>Each score is normalised to 0–100: (score − 1) ÷ 4 × 100. Risk is inverted, so a risk score of 1 is 100 and 5 is 0.</li>' +
      '<li>Total = Σ (weight ÷ 100 × normalised score). Weights must add up to 100%.</li><li>If any criterion is unscored the initiative is listed as incomplete. Missing scores are never counted as zero.</li><li>Matrix: value is the business-value score; feasibility is the mean of technical feasibility and data readiness; the dividing line is 3 of 5.</li>' +
      '<li>Rank stability shows the best and worst rank if any single weight moves by 5 percentage points (others rescaled).</li></ol></details>';

    /* weights */
    h += '<section class="wsec"><h2>Scoring weights</h2><form class="wf" data-weights novalidate><div class="wsummary" role="alert" hidden></div><div class="tablewrap"><table class="wtable"><thead><tr><th scope="col">Criterion</th><th scope="col">Weight (%)</th><th scope="col">Direction</th></tr></thead><tbody>' +
      crit.map(function (c) { return '<tr><th scope="row"><label for="w-' + c.id + '">' + esc(c.label) + '</label></th><td><input id="w-' + c.id + '" name="w_' + c.id + '" type="number" min="0" max="100" step="any" value="' + esc(c.weight) + '" aria-describedby="w-sum"></td><td>' + (c.invert ? 'Lower is better (inverted)' : 'Higher is better') + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><th scope="row">Total</th><td colspan="2"><b id="w-sum" aria-live="polite">' + U.num(v.sum, 2) + '%</b> <span id="w-msg" class="fine">' + (v.ok ? 'OK' : esc(v.errors[0])) + '</span></td></tr></tfoot></table></div>' +
      '<div class="btns"><button class="btn primary" type="submit">Save weights</button><button class="btn" type="button" data-act="reset-weights">Reset to default model (25/15/15/15/10/10/10)</button></div></form></section>';
    if (!v.ok) h += '<div class="wbanner warn" role="alert">The saved weights are not valid (' + esc(v.errors[0]) + '). No scores are shown until they add up to 100%.</div>';

    h += '<section class="wsec"><h2>Ranking</h2>';
    if (!items.length) h += '<p>No initiatives to rank. <a href="#/portfolio/new">Add an initiative</a>.</p>';
    else if (!ranked.length) h += '<p>No initiative has a complete set of scores yet. Open an initiative and fill in its scores.</p>';
    else {
      h += '<div class="tablewrap"><table class="wtable"><caption class="sr-only">Initiatives ranked by weighted score</caption><thead><tr><th scope="col">#</th><th scope="col">Initiative</th><th scope="col">Score /100</th>' +
        crit.map(function (c) { return '<th scope="col" title="' + esc(c.label + ' contribution') + '">' + esc(c.label.split(' ')[0]) + '</th>'; }).join('') + '<th scope="col">Quadrant</th><th scope="col">Recommendation</th><th scope="col">Rank if weights shift ±5</th></tr></thead><tbody>' +
        ranked.map(function (x, i) {
          var st = stab[x.p.id];
          return '<tr><td>' + (i + 1) + '</td><td><a href="#/portfolio/p/' + esc(x.p.id) + '"><b>' + esc(x.p.name) + '</b></a><br><small>' + esc(x.p.stage) + '</small></td><td><b>' + U.num(x.s.total, 1) + '</b></td>' +
            x.s.breakdown.map(function (b) { return '<td>' + U.num(b.contribution, 1) + '</td>'; }).join('') + '<td>' + esc(x.quad ? x.quad.name : '—') + '</td><td>' + (x.p.recommendation ? U.badge(x.p.recommendation) : '—') + '</td><td>' + (st.min === st.max ? 'stable (' + st.base + ')' : '<span class="wbadge warn"><span aria-hidden="true">≈</span> ' + st.min + '–' + st.max + '</span>') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      h += '<p class="fine">Contribution columns add up to the score. "stable" means no single ±5 point weight change alters the rank.</p>';
    }
    if (incomplete.length) h += '<h3>Not yet scored completely (' + incomplete.length + ')</h3><ul class="wlist">' + incomplete.map(function (x) { return '<li><a href="#/portfolio/p/' + esc(x.p.id) + '">' + esc(x.p.name) + '</a> — missing: ' + esc(x.s.missing.map(function (id) { var c = crit.filter(function (k) { return k.id === id; })[0]; return c ? c.label : id; }).join(', ')) + '</li>'; }).join('') + '</ul>';
    h += '<p class="fine"><a href="#/portfolio/prioritise' + (q.rejected === '1' ? '' : '?rejected=1') + '">' + (q.rejected === '1' ? 'Hide' : 'Include') + ' rejected / sunset initiatives</a></p></section>';

    if (ranked.length) {
      h += '<section class="wsec"><h2>Value vs feasibility</h2><p class="fine">Numbers on the chart match the # column in the ranking table.</p>' + matrixSvg(ranked) + '</section>';
      var opts = ranked.map(function (x) { return [x.p.id, x.p.name]; });
      var a = ranked.filter(function (x) { return x.p.id === q.a; })[0] || ranked[0], b = ranked.filter(function (x) { return x.p.id === q.b; })[0] || ranked[1] || ranked[0];
      h += '<section class="wsec"><h2>Compare two initiatives</h2><form class="wfilters" data-compare aria-label="Choose initiatives to compare"><div class="wrow">' + U.field('cmp-a', 'First', U.select('cmp-a', 'a', opts, a.p.id, { blank: false })) + U.field('cmp-b', 'Second', U.select('cmp-b', 'b', opts, b.p.id, { blank: false })) + '</div></form>' +
        '<div class="tablewrap"><table class="wtable"><thead><tr><th scope="col">Criterion</th><th scope="col">' + esc(a.p.name) + '</th><th scope="col">' + esc(b.p.name) + '</th><th scope="col">Difference</th></tr></thead><tbody>' +
        a.s.breakdown.map(function (ba, i) { var bb = b.s.breakdown[i]; return '<tr><th scope="row">' + esc(ba.label) + ' (' + ba.weight + '%)</th><td>' + ba.score + ' → ' + U.num(ba.contribution, 1) + '</td><td>' + bb.score + ' → ' + U.num(bb.contribution, 1) + '</td><td>' + (ba.contribution - bb.contribution >= 0 ? '+' : '') + U.num(ba.contribution - bb.contribution, 1) + '</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><th scope="row">Total</th><td><b>' + U.num(a.s.total, 1) + '</b></td><td><b>' + U.num(b.s.total, 1) + '</b></td><td><b>' + (a.s.total - b.s.total >= 0 ? '+' : '') + U.num(a.s.total - b.s.total, 1) + '</b></td></tr></tfoot></table></div></section>';
      h += '<section class="wsec"><h2>Export</h2><div class="btns"><button class="btn" type="button" data-act="csv">Download ranking (CSV)</button><button class="btn" type="button" data-act="md">Copy as Markdown table</button></div></section>';
    }
    h += '</div>';
    return { html: h, title: 'Prioritisation — AWS AI Atlas', mount: function (root) { mount(root, crit, ranked); } };
  };

  function mount(root, crit, ranked) {
    var store = U.ws.store(), form = root.querySelector('[data-weights]');
    function read() { return crit.map(function (c) { return { id: c.id, label: c.label, weight: form.elements['w_' + c.id].value === '' ? NaN : Number(form.elements['w_' + c.id].value), invert: c.invert, help: c.help }; }); }
    function live() {
      var v = R.validateCriteria(read().map(function (c) { return Object.assign({}, c, { weight: isNaN(c.weight) ? -1 : c.weight }); }));
      root.querySelector('#w-sum').textContent = U.num(v.sum, 2) + '%'; root.querySelector('#w-msg').textContent = v.ok ? 'OK' : v.errors[0];
    }
    form.addEventListener('input', live);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var next = read(), v = R.validateCriteria(next.map(function (c) { return Object.assign({}, c, { weight: isNaN(c.weight) ? -1 : c.weight }); }));
      if (!v.ok) return U.showErrors(form, v.errors.map(function (m) { return { path: '', message: m }; }));
      store.setCriteria(next); U.announce('Weights saved'); A.rerender();
    });
    var cmp = root.querySelector('[data-compare]');
    if (cmp) cmp.addEventListener('change', function () { location.hash = '#/portfolio/prioritise' + U.buildQuery({ a: cmp.elements.a.value, b: cmp.elements.b.value }); });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return; var act = b.getAttribute('data-act');
      if (act === 'reset-weights') { store.setCriteria(null); U.announce('Weights reset to the default model'); A.rerender(); }
      if (act === 'csv') {
        var cols = [{ label: 'Rank', get: function (r) { return ranked.indexOf(r) + 1; } }, { label: 'Initiative', get: function (r) { return r.p.name; } }, { label: 'Stage', get: function (r) { return r.p.stage; } }, { label: 'Score (0-100)', get: function (r) { return Math.round(r.s.total * 10) / 10; } }]
          .concat(crit.map(function (c, i) { return { label: c.label + ' (score 1-5)', get: function (r) { return r.s.breakdown[i].score; } }; })).concat([{ label: 'Quadrant', get: function (r) { return r.quad ? r.quad.name : ''; } }, { label: 'Recommendation', get: function (r) { return r.p.recommendation || ''; } }]);
        U.download(U.fileName('prioritisation', 'csv'), L.exporters.toCSV(ranked, cols, ['Generated ' + U.ws.today(), U.ws.isSample() ? 'SAMPLE DATA - fictional records' : 'Personal workspace records', 'Weights: ' + crit.map(function (c) { return c.label + ' ' + c.weight + '%'; }).join(', '), 'Scores are stakeholder judgements, not measured facts']), 'text/csv;charset=utf-8');
      }
      if (act === 'md') {
        var md = '_Generated ' + U.ws.today() + (U.ws.isSample() ? ' from SAMPLE DATA (fictional)' : '') + '. Scores are stakeholder judgements; weights: ' + crit.map(function (c) { return c.label + ' ' + c.weight + '%'; }).join(', ') + '._\n\n' +
          L.exporters.tableMarkdown(['#', 'Initiative', 'Stage', 'Score', 'Quadrant', 'Recommendation'], ranked.map(function (r, i) { return [i + 1, r.p.name, r.p.stage, Math.round(r.s.total * 10) / 10, r.quad ? r.quad.name : '', r.p.recommendation || '']; }));
        U.copy(md, function (ok) { U.announce(ok ? 'Table copied' : 'Copy failed'); b.textContent = ok ? 'Copied' : 'Copy failed'; setTimeout(function () { b.textContent = 'Copy as Markdown table'; }, 1500); });
      }
    });
  }
})();
