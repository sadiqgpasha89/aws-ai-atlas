/* AWS for AI systems — atlas app. Plain JS, no build step, hash-routed. */
(function () {
  'use strict';
  var A = window.ATLAS;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  var byId = {}, catById = {}, archById = {};
  A.services.forEach(function (s) { byId[s.id] = s; });
  A.categories.forEach(function (c) { catById[c.id] = c; c.items = A.services.filter(function (s) { return s.cat === c.id; }); });
  A.architectures.forEach(function (a) { archById[a.id] = a; });

  /* ---------- text helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, function (m, id, label) {
        var sv = byId[id];
        if (!sv) return label || id;
        return '<a href="#/s/' + id + '">' + (label || sv.name) + '</a>';
      });
  }
  function paras(s) { return String(s).split(/\n\n+/).map(function (p) { return '<p>' + fmt(p) + '</p>'; }).join(''); }
  function ul(items) { return '<ul>' + items.map(function (i) { return '<li>' + fmt(i) + '</li>'; }).join('') + '</ul>'; }
  function hueOf(catId) { return catById[catId] ? catById[catId].hue : 25; }

  /* ---------- isometric drawing ---------- */
  function miniCube(h) {
    return '<svg class="iso" viewBox="-30 -16 60 56" style="--h:' + h + '" aria-hidden="true"><g class="node">' +
      '<path class="face f-left" d="M-26 0L0 13V35L-26 22Z"/><path class="face f-right" d="M0 13L26 0V22L0 35Z"/><path class="face f-top" d="M0-13L26 0L0 13L-26 0Z"/></g></svg>';
  }
  function slab(cx, cy, w, d, label, sub, h, lx) {
    var hh = w / 2;
    return '<g style="--h:' + h + '" class="node" tabindex="-1">' +
      '<path class="face f-left" d="M' + (cx - w) + ' ' + cy + 'L' + cx + ' ' + (cy + hh) + 'V' + (cy + hh + d) + 'L' + (cx - w) + ' ' + (cy + d) + 'Z"/>' +
      '<path class="face f-right" d="M' + cx + ' ' + (cy + hh) + 'L' + (cx + w) + ' ' + cy + 'V' + (cy + d) + 'L' + cx + ' ' + (cy + hh + d) + 'Z"/>' +
      '<path class="face f-top" d="M' + cx + ' ' + (cy - hh) + 'L' + (cx + w) + ' ' + cy + 'L' + cx + ' ' + (cy + hh) + 'L' + (cx - w) + ' ' + cy + 'Z"/>' +
      '<path d="M' + (cx + w * 0.55) + ' ' + (cy - 2) + 'L' + (lx - 8) + ' ' + (cy - 2) + '" stroke="var(--line2)" stroke-dasharray="3 4" fill="none"/>' +
      '<text x="' + lx + '" y="' + (cy + 2) + '" style="text-anchor:start;font-size:16px;font-family:var(--serif)">' + label + '</text>' +
      '<text x="' + lx + '" y="' + (cy + 20) + '" style="text-anchor:start;font-size:11px;font-weight:400;fill:var(--muted)">' + sub + '</text></g>';
  }
  function heroSVG() {
    var layers = [
      { l: 'Foundation', s: 'EC2 · Trainium · S3 · FSx', h: 18, w: 140 },
      { l: 'Data', s: 'Glue · Athena · Kinesis · vectors', h: 175, w: 120 },
      { l: 'Models', s: 'Bedrock · SageMaker', h: 265, w: 100 },
      { l: 'Apps & agents', s: 'API GW · Lambda · AgentCore', h: 305, w: 80 }
    ];
    var out = '<svg viewBox="0 0 560 420" role="img" aria-label="Isometric stack: foundation, data, models, apps and agents">';
    layers.forEach(function (L, i) { out += slab(150, 320 - i * 80, L.w, 24, L.l, L.s, L.h, 318); });
    return out + '</svg>';
  }

  /* ---------- stepper ---------- */
  function mountStepper(host, spec) {
    var flow = spec.flow.map(function (f) { return typeof f === 'string' ? { l: f } : f; });
    var steps = spec.steps.map(function (s) { return { n: s[0], t: s[1] }; });
    var cur = 0, timer = null, narrow = null, W = 0, pts = [];

    host.innerHTML =
      '<div class="stage"></div>' +
      '<div class="ctrl"><button data-a="prev">← Prev</button><button data-a="play">▶ Play</button><button data-a="next">Next →</button><span class="count" aria-live="polite"></span></div>' +
      '<ol class="steps">' + steps.map(function (s, i) { return '<li data-i="' + i + '" tabindex="0">' + '<span>' + fmt(s.t) + '</span></li>'; }).join('') + '</ol>';
    var stage = $('.stage', host);

    function wrap(label, max) {
      var words = label.split(' '), lines = [''], k = 0;
      words.forEach(function (w) {
        if ((lines[k] + ' ' + w).trim().length > max && lines[k]) { lines.push(w); k++; } else lines[k] = (lines[k] + ' ' + w).trim();
      });
      return lines;
    }
    function compute() {
      var n = flow.length; pts = [];
      if (!narrow) {
        W = 760; var pad = 84, dy = n > 1 ? Math.min(30, 150 / (n - 1)) : 0;
        for (var i = 0; i < n; i++) pts.push({ x: n === 1 ? W / 2 : pad + i * (W - 2 * pad) / (n - 1), y: 54 + i * dy });
        return W + ' ' + (pts[n - 1].y + 118);
      }
      W = 360;
      for (var j = 0; j < n; j++) pts.push({ x: j % 2 ? 250 : 110, y: 50 + j * 86 });
      return W + ' ' + (pts[n - 1].y + 68);
    }
    function draw() {
      var wh = compute().split(' ');
      var svg = '<svg viewBox="0 0 ' + wh[0] + ' ' + wh[1] + '" role="img" aria-label="Flow diagram">';
      for (var i = 0; i < pts.length - 1; i++) svg += '<path class="edge" d="M' + pts[i].x + ' ' + (pts[i].y + 12) + 'L' + pts[i + 1].x + ' ' + (pts[i + 1].y + 12) + '"/>';
      flow.forEach(function (f, i) {
        var p = pts[i], hue = f.s && byId[f.s] ? hueOf(byId[f.s].cat) : (spec.hue || 25);
        var lines = wrap(f.l, narrow ? 24 : 15), t = '';
        lines.forEach(function (ln, k) {
          if (!narrow) t += '<text x="0" y="' + (54 + k * 14) + '">' + esc(ln) + '</text>';
          else t += '<text x="' + (i % 2 ? -42 : 42) + '" y="' + (12 + k * 14 - (lines.length - 1) * 7) + '" style="text-anchor:' + (i % 2 ? 'end' : 'start') + '">' + esc(ln) + '</text>';
        });
        var body = '<g class="node" data-i="' + i + '" style="--h:' + hue + '"><path class="face f-left" d="M-26 0L0 13V35L-26 22Z"/><path class="face f-right" d="M0 13L26 0V22L0 35Z"/><path class="face f-top" d="M0-13L26 0L0 13L-26 0Z"/>' + t + '</g>';
        svg += '<g transform="translate(' + p.x + ' ' + p.y + ')">' + (f.s && byId[f.s] ? '<a href="#/s/' + f.s + '" aria-label="' + esc(byId[f.s].name) + '">' + body + '</a>' : body) + '</g>';
      });
      svg += '<g class="packet"><circle class="ring" r="7"/><circle r="7"/></g></svg>';
      stage.innerHTML = svg;
      place(false);
    }
    function place() {
      var s = steps[cur], p = pts[s.n] || pts[0], visited = {};
      for (var i = 0; i <= cur; i++) visited[steps[i].n] = 1;
      $$('.node[data-i]', stage).forEach(function (g) {
        var i = +g.getAttribute('data-i');
        g.classList.toggle('on', i === s.n);
        g.classList.toggle('dim', !visited[i]);
      });
      var pk = $('.packet', stage);
      pk.style.transform = 'translate(' + p.x + 'px,' + (p.y + 12) + 'px)';
      $$('ol.steps li', host).forEach(function (li, i) {
        li.classList.toggle('on', i === cur);
        li.classList.toggle('done', i < cur);
        if (i === cur) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      });
      $('.count', host).textContent = 'Step ' + (cur + 1) + ' / ' + steps.length;
      $('[data-a=prev]', host).disabled = cur === 0;
      $('[data-a=next]', host).disabled = cur === steps.length - 1;
    }
    function go(i) { cur = Math.max(0, Math.min(steps.length - 1, i)); place(); }
    function stop() { if (timer) { clearInterval(timer); timer = null; $('[data-a=play]', host).textContent = '▶ Play'; } }
    function play() {
      if (timer) return stop();
      if (cur === steps.length - 1) go(0);
      $('[data-a=play]', host).textContent = '❚❚ Pause';
      timer = setInterval(function () { if (cur >= steps.length - 1) stop(); else go(cur + 1); }, 2600);
    }
    host.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-a]'), li = e.target.closest('ol.steps li');
      if (b) { var a = b.getAttribute('data-a'); if (a === 'play') play(); else { stop(); go(cur + (a === 'next' ? 1 : -1)); } }
      else if (li && !e.target.closest('a')) { stop(); go(+li.getAttribute('data-i')); }
    });
    host.addEventListener('keydown', function (e) {
      if (e.target.closest('a')) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); stop(); go(cur + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); stop(); go(cur - 1); }
      else if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('ol.steps li')) { e.preventDefault(); stop(); go(+e.target.getAttribute('data-i')); }
    });
    function measure() { var nw = stage.clientWidth < 560; if (nw !== narrow) { narrow = nw; draw(); } }
    measure();
    if (window.ResizeObserver) new ResizeObserver(measure).observe(stage); else window.addEventListener('resize', measure);
    host._stop = stop;
    go(0);
  }

  var pendingSteppers = [];
  function stepperHost(spec) { pendingSteppers.push(spec); return '<div class="stepper" data-sp="' + (pendingSteppers.length - 1) + '"></div>'; }

  /* ---------- pages ---------- */
  function pageHome() {
    var n = A.services.length;
    var h = '<div class="wide"><section class="hero"><div>' +
      '<div class="eyebrow">An interactive atlas · ' + n + ' services · ' + A.categories.length + ' categories</div>' +
      '<h1>Build AI systems on AWS, one block at a time.</h1>' +
      '<p class="lede">What each service is, how it actually works step by step, where it bites, and how to compose it into larger ML and GenAI systems.</p>' +
      '<div class="btns"><a class="btn primary" href="#/c/genai">Start with GenAI →</a><a class="btn" href="#/a">See full architectures</a></div>' +
      '</div>' + heroSVG() + '</section>';
    h += '<h2>The map</h2><p style="max-width:62ch">Services are grouped by the job they do in an AI/ML system. Each page ends with how to use the service in that setting, and what it pairs with.</p><div class="grid">';
    A.categories.forEach(function (c) {
      h += '<a class="card catcard" style="--h:' + c.hue + '" href="#/c/' + c.id + '">' + miniCube(c.hue) + '<div class="mini">' + c.items.length + ' services</div><h3>' + esc(c.name) + '</h3><p>' + esc(c.short) + '</p></a>';
    });
    h += '</div><h2>Start from a system</h2><p style="max-width:62ch">Prefer to learn top-down? Each architecture is a step-through diagram where every box links to the service behind it.</p><div class="grid">';
    A.architectures.forEach(function (a) {
      h += '<a class="card" style="--h:25" href="#/a/' + a.id + '"><div class="mini">Architecture</div><h3>' + esc(a.name) + '</h3><p>' + esc(a.short) + '</p></a>';
    });
    h += '</div><h2>How to read a service page</h2><div class="lists two" style="max-width:860px">' +
      '<div class="box"><h3>Every page has</h3>' + ul(['**What it is**: the job it does, in plain terms.', '**How it works**: a stepper you can click through or play.', '**Gotchas** and **edge cases**: the things that surprise people in production.', '**In AI/ML systems**: concrete ways to use it.']) + '</div>' +
      '<div class="box"><h3>A note on numbers</h3><p style="margin-top:10px">Limits and prices are given for orientation, and AWS changes them. Where a number matters to your design, confirm it on the linked docs page and in your account\'s Service Quotas console.</p></div></div></div>';
    return h;
  }

  function serviceCard(s) {
    return '<a class="card" style="--h:' + hueOf(s.cat) + '" href="#/s/' + s.id + '">' + miniCube(hueOf(s.cat)) + '<h3>' + esc(s.name) + '</h3><p>' + esc(s.tag) + '</p></a>';
  }

  function pageCategory(id) {
    var c = catById[id]; if (!c) return notFound();
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Category</div><h1>' + esc(c.name) + '</h1><p class="lede">' + esc(c.short) + '</p>';
    h += paras(c.intro);
    h += '<div class="callout"><b>Design lens</b>' + fmt(c.lens) + '</div>';
    h += '<h2>Services</h2><div class="grid">' + c.items.map(serviceCard).join('') + '</div>';
    return h;
  }

  function pageService(id) {
    var s = byId[id]; if (!s) return notFound();
    var c = catById[s.cat], hue = c.hue, i = c.items.indexOf(s);
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a class="chip" style="--h:' + hue + '" href="#/c/' + c.id + '">' + esc(c.name) + '</a>' +
      (s.doc ? '<a href="https://docs.aws.amazon.com/' + esc(s.doc) + '" target="_blank" rel="noopener">AWS docs ↗</a>' : '') + '</div>';
    h += '<h1>' + esc(s.name) + '</h1><p class="lede">' + esc(s.tag) + '</p>';
    h += '<h2 style="margin-top:28px">What it is</h2>' + paras(s.what);
    h += '<h2>How it works</h2>' + stepperHost({ flow: s.flow, steps: s.steps, hue: hue });
    h += '<div class="lists two" style="margin-top:34px"><div class="box warn"><h3>Gotchas</h3>' + ul(s.gotchas) + '</div><div class="box"><h3>Edge cases</h3>' + ul(s.edges) + '</div></div>';
    h += '<h2>Using it in AI/ML systems</h2><div class="box ml" style="padding-top:2px">' + ul(s.ml) + '</div>';
    if (s.pairs && s.pairs.length) {
      h += '<h2>Pairs well with</h2><div class="pairs">' + s.pairs.filter(function (p) { return byId[p]; }).map(function (p) { return '<a href="#/s/' + p + '">' + esc(byId[p].name) + '</a>'; }).join('') + '</div>';
    }
    if (s.cost) h += '<div class="callout" style="margin-top:28px"><b>Cost model</b>' + fmt(s.cost) + '</div>';
    var prev = c.items[i - 1], next = c.items[i + 1];
    h += '<div class="pn">' + (prev ? '<a href="#/s/' + prev.id + '"><small>← Previous</small>' + esc(prev.name) + '</a>' : '<span></span>') + (next ? '<a href="#/s/' + next.id + '"><small>Next →</small>' + esc(next.name) + '</a>' : '') + '</div>';
    return h;
  }

  function pageArchIndex() {
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Architectures</div><h1>Reference architectures</h1><p class="lede">Services are only useful in combination. These are the shapes that keep showing up in production AI/ML systems.</p><div class="grid">';
    A.architectures.forEach(function (a) { h += '<a class="card" style="--h:25" href="#/a/' + a.id + '"><div class="mini">Architecture</div><h3>' + esc(a.name) + '</h3><p>' + esc(a.short) + '</p></a>'; });
    return h + '</div>';
  }

  function pageArch(id) {
    var a = archById[id]; if (!a) return notFound();
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/a">Architectures</a></div><h1>' + esc(a.name) + '</h1><p class="lede">' + esc(a.short) + '</p>';
    h += '<div class="callout"><b>Use it when</b>' + fmt(a.when) + '</div>';
    h += '<h2>Walkthrough</h2><p>Click a step, or press Play. Every box is a link to its service page.</p>' + stepperHost({ flow: a.flow, steps: a.steps, hue: 25 });
    h += '<div class="lists two" style="margin-top:34px"><div class="box"><h3>Why this shape</h3>' + ul(a.why) + '</div><div class="box warn"><h3>How it fails</h3>' + ul(a.fails) + '</div></div>';
    var used = {}; a.flow.forEach(function (f) { if (f.s) used[f.s] = 1; });
    var ids = Object.keys(used);
    if (ids.length) h += '<h2>Services involved</h2><div class="pairs">' + ids.map(function (p) { return '<a href="#/s/' + p + '">' + esc(byId[p].name) + '</a>'; }).join('') + '</div>';
    return h;
  }

  function pageDecisions() {
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Decisions</div><h1>Decision tables</h1><p class="lede">The choices that come up in nearly every design review, laid out side by side.</p>';
    A.decisions.forEach(function (d) {
      h += '<h2>' + esc(d.title) + '</h2><p>' + fmt(d.intro) + '</p><div class="tablewrap"><table><thead><tr>' + d.cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        d.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + fmt(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
      if (d.rule) h += '<div class="callout"><b>Rule of thumb</b>' + fmt(d.rule) + '</div>';
    });
    return h;
  }

  function notFound() { return '<h1>Not found</h1><p class="lede">That page does not exist. <a href="#/">Back to the atlas</a>.</p>'; }

  /* ---------- sidebar ---------- */
  function renderSide(kind, id) {
    var cur = kind === 's' && byId[id] ? byId[id].cat : (kind === 'c' ? id : null);
    var h = '<h3>Explore</h3><a href="#/" style="display:block;padding:6px 8px;color:var(--ink);text-decoration:none;font-weight:600">Home</a>' +
      '<a href="#/a" ' + (kind === 'a' ? 'aria-current="page"' : '') + ' style="display:block;padding:6px 8px;color:var(--ink);text-decoration:none;font-weight:600">Architectures</a>' +
      '<a href="#/d" ' + (kind === 'd' ? 'aria-current="page"' : '') + ' style="display:block;padding:6px 8px;color:var(--ink);text-decoration:none;font-weight:600">Decision tables</a><h3>Services</h3>';
    A.categories.forEach(function (c) {
      h += '<details' + (cur === c.id ? ' open' : '') + '><summary style="--h:' + c.hue + '"><span class="dot"></span><a href="#/c/' + c.id + '"' + (kind === 'c' && id === c.id ? ' aria-current="page"' : '') + '>' + esc(c.name) + '</a><span class="n">' + c.items.length + '</span></summary><ul>' +
        c.items.map(function (s) { return '<li><a href="#/s/' + s.id + '"' + (kind === 's' && id === s.id ? ' aria-current="page"' : '') + '>' + esc(s.name) + '</a></li>'; }).join('') + '</ul></details>';
    });
    $('#side').innerHTML = h;
  }

  /* ---------- router ---------- */
  function render() {
    $$('.stepper').forEach(function (el) { if (el._stop) el._stop(); });
    var parts = location.hash.replace(/^#\/?/, '').split('/'), kind = parts[0] || '', id = parts[1] || '';
    pendingSteppers = [];
    var html, title = 'AWS for AI/ML Systems — an interactive atlas';
    if (kind === 's' && byId[id]) { html = pageService(id); title = byId[id].name + ' — AWS for AI/ML Systems'; }
    else if (kind === 'c' && catById[id]) { html = pageCategory(id); title = catById[id].name + ' — AWS for AI/ML Systems'; }
    else if (kind === 'a') { if (id && archById[id]) { html = pageArch(id); title = archById[id].name + ' — AWS for AI/ML Systems'; } else html = pageArchIndex(); }
    else if (kind === 'd') { html = pageDecisions(); title = 'Decision tables — AWS for AI/ML Systems'; }
    else if (!kind) html = pageHome();
    else html = notFound();
    var main = $('#main'); main.innerHTML = html;
    pendingSteppers.forEach(function (spec, i) { mountStepper($('[data-sp="' + i + '"]', main), spec); });
    renderSide(kind, id);
    document.title = title;
    window.scrollTo(0, 0);
    document.body.classList.remove('nav-open');
    $('#menuBtn').setAttribute('aria-expanded', 'false');
    var cs = $('.side a[aria-current=page]'); if (cs && cs.scrollIntoView) cs.scrollIntoView({ block: 'nearest' });
  }
  window.addEventListener('hashchange', render);

  /* ---------- chrome: nav, theme, search ---------- */
  $('#menuBtn').addEventListener('click', function () {
    var open = document.body.classList.toggle('nav-open'); this.setAttribute('aria-expanded', open);
  });
  $('#scrim').addEventListener('click', function () { document.body.classList.remove('nav-open'); });
  $('#themeBtn').addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('atlas-theme', next); } catch (e) {}
  });

  var overlay = $('#overlay'), q = $('#q'), resultsEl = $('#results'), sel = 0, hits = [];
  var index = A.services.map(function (s) {
    return { type: 'Service', href: '#/s/' + s.id, name: s.name, id: s.id, tag: s.tag, cat: catById[s.cat].name,
      hay: [s.name, s.id, s.tag, s.what, s.ml.join(' '), s.gotchas.join(' '), s.edges.join(' ')].join(' ').toLowerCase() };
  }).concat(A.architectures.map(function (a) {
    return { type: 'Architecture', href: '#/a/' + a.id, name: a.name, id: a.id, tag: a.short, cat: 'Architecture', hay: (a.name + ' ' + a.short + ' ' + a.why.join(' ')).toLowerCase() };
  }));
  function openSearch() { overlay.hidden = false; q.value = ''; runSearch(); q.focus(); }
  function closeSearch() { overlay.hidden = true; }
  function runSearch() {
    var terms = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    hits = index.map(function (it) {
      var score = 0, ok = true;
      terms.forEach(function (t) {
        var nm = it.name.toLowerCase(), s = 0;
        if (nm.indexOf(t) === 0) s = 100; else if (nm.indexOf(t) > -1) s = 70; else if (it.id.indexOf(t) > -1) s = 55;
        else if (it.tag.toLowerCase().indexOf(t) > -1) s = 30; else if (it.hay.indexOf(t) > -1) s = 10;
        if (!s) ok = false; score += s;
      });
      return { it: it, score: terms.length ? (ok ? score : 0) : 1 };
    }).filter(function (h) { return h.score > 0; }).sort(function (a, b) { return b.score - a.score || a.it.name.localeCompare(b.it.name); }).slice(0, 12);
    sel = 0; paint();
  }
  function paint() {
    resultsEl.innerHTML = hits.length ? hits.map(function (h, i) {
      return '<li role="option"><a href="' + h.it.href + '" class="' + (i === sel ? 'sel' : '') + '"><b>' + esc(h.it.name) + ' <small style="font-weight:400;color:var(--muted)">· ' + esc(h.it.cat) + '</small></b><span>' + esc(h.it.tag) + '</span></a></li>';
    }).join('') : '<li class="none">No matches. Try a service name or a concept like “vector” or “throttling”.</li>';
  }
  $('#searchBtn').addEventListener('click', openSearch);
  overlay.addEventListener('click', function (e) { if (e.target === overlay || e.target.closest('a')) closeSearch(); });
  q.addEventListener('input', runSearch);
  q.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(hits.length - 1, sel + 1); paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); paint(); }
    else if (e.key === 'Enter' && hits[sel]) { location.hash = hits[sel].it.href; closeSearch(); }
  });
  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''));
    if (e.key === 'Escape') closeSearch();
    else if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); openSearch(); }
  });

  render();
})();
