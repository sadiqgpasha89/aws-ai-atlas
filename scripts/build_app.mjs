// scripts/build_app.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appJsPath = path.join(root, 'assets', 'app.js');

const appContent = `/* AWS for AI systems — atlas app. Plain JS, no build step, hash-routed.
   AI Engineering Management Operating System. */
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
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(s) {
    return esc(s)
      .replace(/\\\`([^\\\`]+)\\\`/g, '<code>$1</code>')
      .replace(/\\\\*\\\\*([^*]+)\\\\*\\\\*/g, '<strong>$1</strong>')
      .replace(/\\\\\\[\\\\\\[([a-z0-9-]+)(?:\\\\|([^\\\\\\]]+))?\\\\\\]\\\\\\]/g, function (m, id, label) {
        var sv = byId[id];
        if (!sv) return label || id;
        return '<a href="#/s/' + id + '">' + (label || sv.name) + '</a>';
      });
  }
  function paras(s) { return String(s || '').split(/\\\\n\\\\n+/).map(function (p) { return '<p>' + fmt(p) + '</p>'; }).join(''); }
  function ul(items) { return '<ul>' + (items || []).map(function (i) { return '<li>' + fmt(i) + '</li>'; }).join('') + '</ul>'; }
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
      { l: 'Data', s: 'Glue · Athena · Kinesis · OpenSearch', h: 175, w: 120 },
      { l: 'Models', s: 'Bedrock · SageMaker', h: 265, w: 100 },
      { l: 'Apps & agents', s: 'API GW · Lambda · AgentCore', h: 305, w: 80 }
    ];
    var out = '<svg viewBox="0 0 560 420" role="img" aria-label="Isometric stack: foundation, data, models, apps and agents">';
    layers.forEach(function (L, i) { out += slab(150, 320 - i * 80, L.w, 24, L.l, L.s, L.h, 318); });
    return out + '</svg>';
  }

  /* ---------- stepper ---------- */
  function mountStepper(host, spec) {
    if (!host || !spec) return;
    var flow = (spec.flow || []).map(function (f) { return typeof f === 'string' ? { l: f } : f; });
    var steps = (spec.steps || []).map(function (s) { return { n: s[0], t: s[1] }; });
    var cur = 0, timer = null, narrow = null, W = 0, pts = [];

    host.innerHTML =
      '<div class="stage"></div>' +
      '<div class="ctrl"><button data-a="prev">← Prev</button><button data-a="play">▶ Play</button><button data-a="next">Next →</button><span class="count" aria-live="polite"></span></div>' +
      '<ol class="steps">' + steps.map(function (s, i) { return '<li data-i="' + i + '" tabindex="0">' + '<span>' + fmt(s.t) + '</span></li>'; }).join('') + '</ol>';
    var stage = $('.stage', host);

    function wrap(label, max) {
      var words = (label || '').split(' '), lines = [''], k = 0;
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

  var afterRender = null;
  function copyText(text, btn) {
    var label = btn ? (btn.getAttribute('data-l') || btn.textContent) : '';
    if (btn) btn.setAttribute('data-l', label);
    function done(ok) { if (!btn) return; btn.textContent = ok ? 'Copied ✓' : 'Select and copy manually'; setTimeout(function () { btn.textContent = label; }, 1800); }
    function fallback() {
      var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(t); t.select(); var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(t); done(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, fallback); else fallback();
  }

  function money(n) {
    if (!isFinite(n)) return '—';
    if (n >= 100) return '$' + Math.round(n).toLocaleString('en-US');
    if (n >= 1) return '$' + n.toFixed(2);
    if (n >= 0.01) return '$' + n.toFixed(3);
    return '$' + n.toFixed(5);
  }

  /* ==========================================================================
     PAGE 1: AI ENGINEERING MANAGER COMMAND CENTRE (#/ and #/command)
     ========================================================================== */
  function pageCommandCentre() {
    var cc = A.commandCentre;
    var h = '<div class="wide">';
    h += '<section class="hero"><div>' +
      '<div class="eyebrow">Operating System for AI Engineering Leaders · ' + (A.delivery ? A.delivery.projects.length : 12) + ' active initiatives · ₹8.4L monthly spend</div>' +
      '<h1>AI Engineering Manager Command Centre</h1>' +
      '<p class="lede">Daily executive operating rhythm, active project portfolio, live production health, and priority decisions for AI/ML, Generative AI, and Agentic workloads on AWS.</p>' +
      '<div class="btns">' +
        '<a class="btn primary" href="#/delivery">AI Project Lifecycle →</a>' +
        '<a class="btn" href="#/arch-review">Arch Review Board</a>' +
        '<a class="btn" href="#/selector">Service Selector</a>' +
        '<a class="btn" href="#/models">Model Registry</a>' +
        '<a class="btn" href="#/eval">Eval & Quality</a>' +
        '<a class="btn" href="#/finops">FinOps & Budget</a>' +
        '<a class="btn" href="#/ops">Production SRE</a>' +
      '</div>' +
      '</div>' + heroSVG() + '</section>';

    // Section 1: Executive KPIs
    h += '<h2>Executive Portfolio & Production KPIs</h2>' +
      '<div class="cmd-kpis">';
    cc.kpis.forEach(function (k) {
      var cls = k.status === 'warn' ? 'warn' : (k.status === 'ok' ? 'ok' : '');
      h += '<div class="cmd-kpi ' + cls + '">' +
        '<small>' + esc(k.label) + '</small>' +
        '<b>' + esc(k.value) + '</b>' +
        '<span>' + esc(k.sub) + '</span>' +
      '</div>';
    });
    h += '</div>';

    // Section 2: "My Attention Today"
    h += '<h2>🚨 My Attention Today</h2>' +
      '<p style="max-width:68ch">Immediate blockers, quality gate failures, budget spikes, and regulatory action items requiring engineering management intervention before end of day.</p>' +
      '<div class="attention-grid">';
    cc.attentionToday.forEach(function (att) {
      var sev = att.severity || 'high';
      h += '<div class="attention-card ' + esc(sev) + '">' +
        '<div class="attention-top">' +
          '<span class="chip" style="--h:25">' + esc(att.project) + '</span>' +
          '<span class="severity-pill ' + esc(sev) + '">' + esc(att.badge || sev.toUpperCase()) + '</span>' +
        '</div>' +
        '<h4>' + esc(att.issue) + '</h4>' +
        '<div class="attention-impact"><b>Impact:</b> ' + esc(att.impact) + '</div>' +
        '<div class="attention-action"><b>Required EM Action:</b> ' + esc(att.action) + '</div>' +
        '<div style="margin-top:auto;padding-top:10px">' +
          '<a class="btn" style="font-size:12px;padding:4px 10px" href="#/delivery">Open Project in Delivery Tracker →</a>' +
        '</div>' +
      '</div>';
    });
    h += '</div>';

    // Section 3: "Today's Management Decisions"
    h += '<h2>⚖️ Today\\\'s Management Decisions</h2>' +
      '<p style="max-width:68ch">Architectural, vendor, and risk sign-offs currently waiting on your desk.</p>' +
      '<div class="decisions-grid">';
    cc.decisionsToday.forEach(function (dec) {
      h += '<div class="decision-box">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<span class="severity-pill high">' + esc(dec.category) + '</span>' +
          '<small style="font:600 11px var(--mono);color:var(--warn)">' + esc(dec.status) + '</small>' +
        '</div>' +
        '<h4>' + esc(dec.title) + '</h4>' +
        '<div class="decision-context">' + esc(dec.context) + '</div>' +
        '<div class="decision-rec"><b>Recommendation:</b> ' + esc(dec.recommendation) + '</div>' +
        '<div style="font-size:12px;color:var(--muted)"><b>Options:</b> ' + esc((dec.options || []).join(' · ')) + '</div>' +
        '<div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center;padding-top:10px">' +
          '<a class="btn primary" style="font-size:12px;padding:4px 12px" href="#/arch-review">Review in ARB →</a>' +
        '</div>' +
      '</div>';
    });
    h += '</div>';

    // Section 4: "Daily Workflow Schedule"
    h += '<h2>📅 Daily AI Engineering Manager Schedule (09:00 - 17:00)</h2>' +
      '<p style="max-width:68ch">A structured operating rhythm for AI Engineering Managers balancing triage, reviews, 1-on-1s, architecture, and vendor strategy.</p>' +
      '<div class="schedule-timeline">';
    cc.dailySchedule.forEach(function (item) {
      h += '<div class="sched-block">' +
        '<div class="sched-time">' + esc(item.time) + '</div>' +
        '<div class="sched-details">' +
          '<h4>' + esc(item.slot) + '</h4>' +
          '<p>' + esc(item.focus) + '</p>' +
          '<div style="font-size:12px;color:var(--muted);margin-bottom:6px"><b>Artifacts:</b> ' + esc(item.artifacts) + '</div>' +
          '<ul class="sched-checklist">' +
          (item.checklist || []).map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') +
          '</ul>' +
        '</div>' +
      '</div>';
    });
    h += '</div>';

    // Section 5: "Live Production AI Health Matrix"
    h += '<h2>⚡ Live Production AI Health Matrix</h2>' +
      '<p style="max-width:68ch">Real-time operational health of production foundation model and RAG systems.</p>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr>' +
        '<th>Health Metric</th><th>Current Performance</th><th>SLA / Target</th><th>Status</th><th>Measurement Window</th>' +
      '</tr></thead><tbody>';
    cc.productionHealth.forEach(function (sys) {
      var stCls = sys.status === 'ok' ? 'healthy' : 'warn';
      h += '<tr>' +
        '<td><b>' + esc(sys.metric) + '</b></td>' +
        '<td><code>' + esc(sys.current) + '</code></td>' +
        '<td>' + esc(sys.target) + '</td>' +
        '<td><span class="health-badge ' + stCls + '">' + esc(sys.status.toUpperCase()) + '</span></td>' +
        '<td><small style="color:var(--muted)">' + esc(sys.window) + '</small></td>' +
      '</tr>';
    });
    h += '</tbody></table></div>';

    // Section 6: "Recent Incidents"
    h += '<h2>🔥 Recent Incidents & Postmortem Reviews</h2>' +
      '<div class="attention-grid">';
    cc.recentIncidents.forEach(function (inc) {
      h += '<div class="attention-card high">' +
        '<div class="attention-top">' +
          '<span class="severity-pill high">' + esc(inc.severity) + '</span>' +
          '<small style="font:600 11px var(--mono)">' + esc(inc.id) + ' (' + esc(inc.duration) + ')</small>' +
        '</div>' +
        '<h4>' + esc(inc.title) + '</h4>' +
        '<div class="attention-impact"><b>Impact:</b> ' + esc(inc.impact) + '<br><b>Root Cause:</b> ' + esc(inc.rootCause) + '</div>' +
        '<div class="attention-action"><b>Status:</b> ' + esc(inc.status) + '<br><b>Action Item:</b> ' + esc(inc.actionItem) + '</div>' +
        '<div style="margin-top:auto;padding-top:10px"><a class="btn" style="font-size:12px;padding:4px 10px" href="#/ops">Open SRE Postmortem →</a></div>' +
      '</div>';
    });
    h += '</div>';

    h += '</div>';
    return h;
  }

  /* ==========================================================================
     PAGE 2: SERVICES CATALOGUE (#/services and #/c/:id)
     ========================================================================== */
  function serviceCard(s) {
    return '<a class="card" style="--h:' + hueOf(s.cat) + '" href="#/s/' + s.id + '">' + miniCube(hueOf(s.cat)) + '<h3>' + esc(s.name) + '</h3><p>' + esc(s.tag) + '</p></a>';
  }

  function pageServicesCatalog(selectedCat) {
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Services</div>' +
      '<h1>AWS AI & Data Services Catalogue (' + A.services.length + ' Services)</h1>' +
      '<p class="lede">Comprehensive catalog of AWS artificial intelligence, machine learning, data engineering, and infrastructure services with production readiness, pricing notes, and gotchas.</p>';

    h += '<div class="seg" role="group" aria-label="Filter services by category" id="svcFilter" style="margin:18px 0 24px;flex-wrap:wrap">' +
      '<button type="button" data-c="all" class="' + (!selectedCat || selectedCat === 'all' ? 'on' : '') + '">All (' + A.services.length + ')</button>' +
      A.categories.map(function (c) {
        return '<button type="button" data-c="' + c.id + '" class="' + (selectedCat === c.id ? 'on' : '') + '">' + esc(c.name) + ' (' + c.items.length + ')</button>';
      }).join('') +
      '</div>';

    h += '<div id="svcGrid" class="grid">';
    var filtered = selectedCat && selectedCat !== 'all' ? A.services.filter(function (s) { return s.cat === selectedCat; }) : A.services;
    h += filtered.map(serviceCard).join('');
    h += '</div>';

    afterRender = function () {
      var filterBar = $('#svcFilter');
      if (!filterBar) return;
      filterBar.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-c]');
        if (!b) return;
        var cat = b.getAttribute('data-c');
        $$('#svcFilter button').forEach(function (x) { x.classList.toggle('on', x === b); });
        var svcs = cat === 'all' ? A.services : A.services.filter(function (s) { return s.cat === cat; });
        $('#svcGrid').innerHTML = svcs.map(serviceCard).join('');
      });
    };
    return h;
  }

  function pageCategory(id) {
    var c = catById[id]; if (!c) return notFound();
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/services">Services</a> / Category</div><h1>' + esc(c.name) + '</h1><p class="lede">' + esc(c.short) + '</p>';
    h += paras(c.intro);
    h += '<div class="callout"><b>Design lens</b>' + fmt(c.lens) + '</div>';
    h += '<h2>Services (' + c.items.length + ')</h2><div class="grid">' + c.items.map(serviceCard).join('') + '</div>';
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

  /* ==========================================================================
     PAGE 3: REFERENCE ARCHITECTURES (23 ARCHITECTURES) (#/a and #/a/:id)
     ========================================================================== */
  function pageArchIndex() {
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Architectures</div>' +
      '<h1>Reference Architectures (' + A.architectures.length + ' Architectures)</h1>' +
      '<p class="lede">Production blueprints from classic RAG and Multi-Agent swarms to AI Gateways, Evals in CI/CD, and Multi-Region Resilience. Interactive step-through diagrams where every node links to its AWS service.</p>';

    h += '<div class="grid" style="margin-top:24px">';
    A.architectures.forEach(function (a) {
      h += '<a class="card" style="--h:25" href="#/a/' + a.id + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
          '<div class="mini">Reference Architecture</div>' +
          '<span class="freshness-badge needs-review" title="No verification date is recorded for this content. Confirm against the AWS documentation.">Reference · not verified</span>' +
        '</div>' +
        '<h3>' + esc(a.name) + '</h3>' +
        '<p>' + esc(a.short) + '</p>' +
      '</a>';
    });
    h += '</div>';
    return h;
  }

  function pageArch(id) {
    var a = archById[id]; if (!a) return notFound();
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/a">Architectures</a></div><h1>' + esc(a.name) + '</h1><p class="lede">' + esc(a.short) + '</p>';
    h += '<div style="margin:8px 0 16px"><a class="freshness-badge needs-review" href="#/about/content" title="No verification date is recorded for this content. Confirm against the AWS documentation.">Reference · not verified · what this means</a></div>';
    h += '<div class="callout"><b>Use it when</b>' + fmt(a.when) + '</div>';
    h += '<h2>Walkthrough</h2><p>Click a step, or press Play. Every box is a link to its service page.</p>' + stepperHost({ flow: a.flow, steps: a.steps, hue: 25 });
    h += '<div class="lists two" style="margin-top:34px"><div class="box"><h3>Why this shape</h3>' + ul(a.why) + '</div><div class="box warn"><h3>How it fails</h3>' + ul(a.fails) + '</div></div>';
    var used = {}; (a.flow || []).forEach(function (f) { if (f.s) used[f.s] = 1; });
    var ids = Object.keys(used);
    if (ids.length) h += '<h2>Services involved</h2><div class="pairs">' + ids.map(function (p) { return '<a href="#/s/' + p + '">' + esc(byId[p] ? byId[p].name : p) + '</a>'; }).join('') + '</div>';
    return h;
  }

  /* ==========================================================================
     PAGE 4: AI PROJECT LIFECYCLE OPERATING SYSTEM (#/delivery)
     ========================================================================== */
  function pageDelivery() {
    var del = A.delivery;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Delivery Lifecycle</div>' +
      '<h1>AI Project Delivery Lifecycle Centre (12 Phases)</h1>' +
      '<p class="lede">A standard operating framework managing AI and agentic initiatives from problem discovery through architecture review, MVP, production quality gates, and ongoing optimization.</p>';

    // 12-Phase Stepper Tracker
    h += '<h2>The 12 AI Project Delivery Phases</h2>' +
      '<div class="phases-tracker" id="phaseChips">';
    del.phases.forEach(function (ph, idx) {
      h += '<div class="phase-chip ' + (idx === 0 ? 'active' : '') + '" data-p="' + idx + '">' +
        '<span class="pnum">Phase ' + (idx + 1) + '</span>' +
        '<span class="pname">' + esc(ph.name) + '</span>' +
      '</div>';
    });
    h += '</div>';

    // Phase Detail Box
    var p0 = del.phases[0];
    h += '<div class="box" id="phaseDetail" style="margin-bottom:32px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<h3 id="phTitle" style="margin:0">' + esc(p0.name) + '</h3>' +
        '<span class="chip" id="phTag" style="--h:212">' + esc(p0.tag) + '</span>' +
      '</div>' +
      '<p id="phSummary" style="margin:10px 0">' + fmt(p0.summary) + '</p>' +
      '<div class="lists two" style="margin-top:14px">' +
        '<div><h4>Engineering Manager Focus</h4><p id="phFocus">' + fmt(p0.emFocus) + '</p></div>' +
        '<div><h4>Mandatory Exit Gate</h4><p id="phGate"><b>' + fmt(p0.exitGate) + '</b></p></div>' +
      '</div>' +
    '</div>';

    // Portfolio Dashboard
    h += '<h2>Enterprise AI Project Portfolio (12 Initiatives)</h2>' +
      '<p style="max-width:68ch">Active cross-squad AI portfolio health, stage gates, spend vs budget, technical blockers, and required executive actions.</p>';

    h += '<div class="seg" role="group" aria-label="Filter portfolio" id="portFilter" style="margin:14px 0">' +
      '<button type="button" data-f="all" class="on">All Projects (' + del.projects.length + ')</button>' +
      '<button type="button" data-f="On track">On Track</button>' +
      '<button type="button" data-f="At risk">At Risk</button>' +
      '<button type="button" data-f="Critical">Critical</button>' +
      '</div>';

    h += '<div class="projects-table-wrap"><table class="matrix-table" id="portTable"><thead><tr>' +
      '<th>Project Name</th><th>Squad / Leads</th><th>Stage</th><th>Health</th><th>Budget vs Spend</th><th>Primary KPIs</th><th>Risks / Blockers</th><th>Next EM Action</th>' +
      '</tr></thead><tbody>';

    del.projects.forEach(function (pj) {
      var hCls = pj.health === 'On track' ? 'healthy' : (pj.health === 'At risk' ? 'warn' : 'critical');
      h += '<tr data-health="' + esc(pj.health) + '">' +
        '<td><b>' + esc(pj.name) + '</b><br><small style="color:var(--muted)">' + esc(pj.id) + '</small></td>' +
        '<td><small><b>PM:</b> ' + esc(pj.pm) + '<br><b>Tech:</b> ' + esc(pj.techLead) + '</small></td>' +
        '<td><span class="chip" style="--h:25">' + esc(pj.stageName) + '</span></td>' +
        '<td><span class="health-badge ' + hCls + '">' + esc(pj.health) + '</span></td>' +
        '<td><b>' + esc(pj.spend) + '</b> / ' + esc(pj.budget) + '</td>' +
        '<td><small><b>AI:</b> ' + esc(pj.aiKPI) + '<br><b>Biz:</b> ' + esc(pj.businessKPI) + '</small></td>' +
        '<td><small style="color:var(--warn)">' + esc(pj.risks) + '</small></td>' +
        '<td><small><b>Action:</b> ' + esc(pj.nextAction) + '<br><b>Decision:</b> ' + esc(pj.decisionRequired) + '</small></td>' +
      '</tr>';
    });
    h += '</tbody></table></div>';

    afterRender = function () {
      $$('#phaseChips .phase-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          $$('#phaseChips .phase-chip').forEach(function (c) { c.classList.remove('active'); });
          this.classList.add('active');
          var idx = +this.getAttribute('data-p');
          var p = del.phases[idx];
          $('#phTitle').textContent = p.name;
          $('#phTag').textContent = p.tag;
          $('#phSummary').innerHTML = fmt(p.summary);
          $('#phFocus').innerHTML = fmt(p.emFocus);
          $('#phGate').innerHTML = '<b>' + fmt(p.exitGate) + '</b>';
        });
      });

      var portFilter = $('#portFilter');
      if (portFilter) {
        portFilter.addEventListener('click', function (e) {
          var b = e.target.closest('button[data-f]');
          if (!b) return;
          var f = b.getAttribute('data-f');
          $$('#portFilter button').forEach(function (x) { x.classList.toggle('on', x === b); });
          $$('#portTable tbody tr').forEach(function (row) {
            row.hidden = f !== 'all' && row.getAttribute('data-health') !== f;
          });
        });
      }
    };

    return h;
  }

  /* ==========================================================================
     PAGE 5: ENTERPRISE AI ARCHITECTURE REVIEW SYSTEM (#/arch-review)
     ========================================================================== */
  function pageArchReview() {
    var ar = A.archReview;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Architecture Review</div>' +
      '<h1>Enterprise AI Architecture Review System & ARB Scoring</h1>' +
      '<p class="lede">Rigorous 12-dimension architecture governance for multi-agent, RAG, and foundation model systems on AWS. Likelihood × Impact scoring, systemic risk view across squads, and copyable ARB submission artifact.</p>';

    // Interactive ARB Risk Calculator
    h += '<h2>Interactive ARB Risk Calculator (Likelihood × Impact)</h2>' +
      '<div class="risk-calc-box">' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">' +
          '<label class="num"><span class="nl2">Failure Likelihood</span>' +
            '<select id="riskLikelihood" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--line2);background:var(--paper);font:inherit">' +
              ar.riskCalculator.likelihoodLevels.map(function (l) { return '<option value="' + l.level + '">' + l.level + ' - ' + esc(l.label) + ' (' + esc(l.desc) + ')</option>'; }).join('') +
            '</select>' +
          '</label>' +
          '<label class="num"><span class="nl2">Impact Severity</span>' +
            '<select id="riskImpact" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--line2);background:var(--paper);font:inherit">' +
              ar.riskCalculator.impactLevels.map(function (l) { return '<option value="' + l.level + '">' + l.level + ' - ' + esc(l.label) + ' (' + esc(l.desc) + ')</option>'; }).join('') +
            '</select>' +
          '</label>' +
        '</div>' +
        '<div class="risk-score-display">' +
          '<div class="risk-dial low" id="riskDial">1</div>' +
          '<div>' +
            '<h4 id="riskScoreLabel" style="margin:0 0 4px">Score 1: Low Risk</h4>' +
            '<p id="riskScoreDesc" style="margin:0;font-size:13px;color:var(--muted)">Standard review. Proceed with automated evaluations in CI/CD pipeline.</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    // 12 Architecture Review Dimensions
    h += '<h2>The 12 Architecture Review Dimensions</h2>' +
      '<div class="grid" style="margin:16px 0">';
    ar.dimensions.forEach(function (dim) {
      h += '<div class="box" style="display:flex;flex-direction:column;gap:8px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<span class="chip" style="--h:25">Dim ' + dim.num + ' · Weight ' + dim.weight + '</span>' +
          '<span class="freshness-badge">ARB Gate</span>' +
        '</div>' +
        '<h3>' + esc(dim.title) + '</h3>' +
        '<p style="font-size:13px;color:var(--muted)">' + esc(dim.description) + '</p>' +
        '<div style="margin-top:auto">' +
          '<h4>Key Review Questions:</h4>' + ul(dim.keyQuestions.slice(0, 2)) +
          '<h4 style="color:var(--warn);margin-top:8px">Red Flags:</h4>' + ul(dim.redFlags.slice(0, 1)) +
        '</div>' +
      '</div>';
    });
    h += '</div>';

    // Systemic Risk View Across Squads
    h += '<h2>Systemic Risk View Across Engineering Squads</h2>' +
      '<p style="max-width:68ch">Cross-squad architectural risk assessments, recurring anti-patterns, and systemic vulnerabilities across the 5 engineering squads.</p>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr>' +
        '<th>Engineering Squad</th><th>Initiative</th><th>ARB Score</th><th>Risk Level</th><th>Primary Finding</th><th>Top Architectural Risk</th>' +
      '</tr></thead><tbody>';
    ar.systemicRiskView.forEach(function (v) {
      var rCls = v.riskLevel === 'Low' ? 'healthy' : (v.riskLevel === 'Medium' ? 'warn' : 'critical');
      h += '<tr>' +
        '<td><b>' + esc(v.squad) + '</b></td>' +
        '<td>' + esc(v.project) + '</td>' +
        '<td><b>' + esc(v.score) + '/100</b></td>' +
        '<td><span class="health-badge ' + rCls + '">' + esc(v.riskLevel) + '</span></td>' +
        '<td><small>' + esc(v.primaryFinding) + '</small></td>' +
        '<td><small style="color:var(--warn)">' + esc(v.topRisk) + '</small></td>' +
      '</tr>';
    });
    h += '</tbody></table></div>';

    // ARB Document Template
    h += '<h2>Copyable ARB Architecture Review Submission Document</h2>' +
      '<div style="margin:12px 0;display:flex;justify-content:flex-end">' +
        '<button class="copy-btn" type="button" id="copyArbDoc">Copy ARB Template (Markdown)</button>' +
      '</div>' +
      '<pre class="adr" tabindex="0">' + esc(ar.documentTemplate) + '</pre>';

    afterRender = function () {
      var lSel = $('#riskLikelihood'), iSel = $('#riskImpact'), dial = $('#riskDial'), lbl = $('#riskScoreLabel'), dsc = $('#riskScoreDesc');
      function updateRisk() {
        var L = +lSel.value, I = +iSel.value, score = L * I;
        dial.textContent = score;
        dial.className = 'risk-dial ' + (score <= 4 ? 'low' : (score <= 8 ? 'medium' : (score <= 12 ? 'high' : 'critical')));
        if (score <= 4) {
          lbl.textContent = 'Score ' + score + ': Low Risk';
          dsc.textContent = 'Standard review. Proceed with automated evaluations in CI/CD pipeline.';
        } else if (score <= 8) {
          lbl.textContent = 'Score ' + score + ': Medium Risk';
          dsc.textContent = 'Tech Lead review required. Automated security scan and prompt regression harness mandatory.';
        } else if (score <= 12) {
          lbl.textContent = 'Score ' + score + ': High Risk';
          dsc.textContent = 'Formal ARB approval required. Principal Engineer and Security Lead must co-sign decision record.';
        } else {
          lbl.textContent = 'Score ' + score + ': Critical Risk';
          dsc.textContent = 'Hard blocker. Architecture prohibited from production deployment without structural redesign.';
        }
      }
      if (lSel && iSel) {
        lSel.addEventListener('change', updateRisk);
        iSel.addEventListener('change', updateRisk);
      }
      var copyBtn = $('#copyArbDoc');
      if (copyBtn) copyBtn.addEventListener('click', function () { copyText(ar.documentTemplate, this); });
    };

    return h;
  }

  /* ==========================================================================
     PAGE 6: AWS AI SERVICE SELECTION MATRIX (#/selector)
     ========================================================================== */
  function pageSelector() {
    var sel = A.selector;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Service Selector</div>' +
      '<h1>AWS AI Service Selection Matrix (14 Enterprise Workloads)</h1>' +
      '<p class="lede">Comprehensive selection guidance for 14 enterprise AI workloads: recommended AWS service, viable alternatives, trade-offs, and explicit reasons why alternatives were rejected.</p>';

    h += '<div class="selector-grid">';
    sel.workloads.forEach(function (wl) {
      h += '<div class="selector-card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<span class="chip" style="--h:212">' + esc(wl.workloadProfile) + '</span>' +
          '<small style="font:600 11px var(--mono);color:var(--muted)">' + esc(wl.id) + '</small>' +
        '</div>' +
        '<h3 style="margin:10px 0 6px">' + esc(wl.title) + '</h3>' +
        '<p style="font-size:13px;color:var(--muted);margin-bottom:12px"><b>Key Decision:</b> ' + esc(wl.keyDecision) + '</p>' +

        '<div class="selector-rec">' +
          '<h4 style="margin:0 0 4px;color:var(--ok)">✓ Recommended: ' + esc(wl.recommended.service) + '</h4>' +
          '<p style="margin:0 0 6px;font-size:13px">' + esc(wl.recommended.why) + '</p>' +
          '<div style="font-size:12px;color:var(--muted)"><b>Strengths:</b> ' + (wl.recommended.strengths || []).join(' · ') + '</div>' +
        '</div>' +

        '<div style="margin-top:12px">' +
          '<h4 style="margin:0 0 8px;font-size:13px">Alternatives Considered & Rejection Reasons:</h4>' +
          (wl.alternatives || []).map(function (alt) {
            return '<div class="selector-alt">' +
              '<b>' + esc(alt.service) + '</b><br>' +
              '<span style="font-size:12px;color:var(--muted)">Trade-offs: ' + esc(alt.tradeoffs) + '</span><br>' +
              '<span style="font-size:12px;color:var(--warn)"><b>Why Rejected:</b> ' + esc(alt.whyRejected) + '</span>' +
            '</div>';
          }).join('') +
        '</div>' +

        '<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--line2);display:flex;justify-content:space-between;font:600 11px var(--mono);color:var(--muted)">' +
          '<span>Latency: ' + esc(wl.criteria.latency) + '</span>' +
          '<span>Cost: ' + esc(wl.criteria.costTier) + '</span>' +
          '<span>Complexity: ' + esc(wl.criteria.complexity) + '</span>' +
        '</div>' +
      '</div>';
    });
    h += '</div>';
    return h;
  }

  /* ==========================================================================
     PAGE 7: MODEL PORTFOLIO & LIFECYCLE MANAGEMENT (#/models)
     ========================================================================== */
  function pageModels() {
    var md = A.models;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Model Portfolio</div>' +
      '<h1>Enterprise Model Registry & Lifecycle Management (16 Models)</h1>' +
      '<p class="lede">Central governance, performance benchmarks, token unit economics, and promotion policies for foundation models across Amazon Bedrock and SageMaker.</p>';

    var pv = md.provenance;
    h += '<section class="wsec" aria-labelledby="mdl-prov"><h2 id="mdl-prov">Where these numbers come from</h2><ul>' +
      '<li><b>Published specs and prices</b> (model id, context window, input and output price) are hand-entered. Last verified: <b>' + (pv.verifiedOn ? esc(pv.verifiedOn) : 'not recorded') + '</b>. Check them at ' +
      pv.sources.map(function (x) { return '<a href="' + esc(x.url) + '" target="_blank" rel="noopener noreferrer">' + esc(x.label) + ' ↗</a>'; }).join(' and ') + '.</li>' +
      '<li><b>Example governance fields</b> (' + pv.illustrativeFields.map(esc).join(', ') + ') describe a hypothetical organisation. They are not measurements, benchmarks or AWS data. Columns that show them are marked <span class="wbadge muted">example</span>.</li></ul></section>';

    // Lifecycle Stepper
    h += '<h2>6-Stage Model Lifecycle Workflow</h2>' +
      '<div class="grid" style="margin:16px 0">';
    md.lifecycle.forEach(function (st) {
      h += '<div class="box">' +
        '<h4>' + esc(st.stage) + '</h4>' +
        '<p style="font-size:13px;color:var(--muted)">' + esc(st.activities) + '</p>' +
        '<div style="font-size:12px;color:var(--ok)"><b>Exit Gate:</b> ' + esc(st.exitGate) + '</div>' +
      '</div>';
    });
    h += '</div>';

    // Model Registry Table
    h += '<h2>Active Model Portfolio Registry (' + md.registry.length + ' Models)</h2>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr>' +
        '<th>Model Name & ID</th><th>Provider</th><th>Category</th><th>Status <span class="wbadge muted">example</span></th><th>P50 / P95 Latency <span class="wbadge muted">example</span></th><th>Cost (Input / Output 1M)</th><th>Context</th><th>Tools / Multi</th><th>Approved Data <span class="wbadge muted">example</span></th><th>Owner Squad <span class="wbadge muted">example</span></th>' +
      '</tr></thead><tbody>';

    md.registry.forEach(function (m) {
      var stCls = m.status === 'approved' ? 'healthy' : (m.status === 'pilot' ? 'warn' : 'critical');
      h += '<tr>' +
        '<td><b>' + esc(m.name) + '</b><br><small style="color:var(--muted)">' + esc(m.id) + '</small></td>' +
        '<td><small>' + esc(m.provider) + '</small></td>' +
        '<td><small>' + esc(m.category) + '</small></td>' +
        '<td><span class="health-badge ' + stCls + '">' + esc(m.status) + '</span></td>' +
        '<td><code>' + esc(m.latencyP50) + ' / ' + esc(m.latencyP95) + '</code></td>' +
        '<td><code>' + esc(m.costInput1M) + ' / ' + esc(m.costOutput1M) + '</code></td>' +
        '<td><small>' + esc(m.contextWindow) + '</small></td>' +
        '<td><small>' + (m.toolCalling ? 'Tools ✓' : 'No tools') + (m.multimodal ? ' · Vision ✓' : '') + '</small></td>' +
        '<td><small>' + (m.dataClassApproved || []).join(', ') + '</small></td>' +
        '<td><small>' + esc(m.ownerTeam) + '</small></td>' +
      '</tr>';
    });
    h += '</tbody></table></div>';

    // Promotion Policy
    h += '<h2>Model Promotion Policies (Sandbox → Staging → Production)</h2>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr>' +
        '<th>Promotion Tier</th><th>Governance Status</th><th>Allowed AWS Environments</th><th>Data Access Policy</th><th>Mandatory Sign-off</th>' +
      '</tr></thead><tbody>';
    Object.keys(md.promotionPolicy).forEach(function (k) {
      var pol = md.promotionPolicy[k];
      h += '<tr>' +
        '<td><b>' + esc(k.toUpperCase()) + '</b></td>' +
        '<td><span class="chip" style="--h:25">' + esc(pol.status) + '</span></td>' +
        '<td><small>' + esc(pol.allowedEnvironments.join(', ')) + '</small></td>' +
        '<td><small>' + esc(pol.dataAccess) + '</small></td>' +
        '<td><small style="color:var(--ok)">' + esc(pol.approvalRequired) + '</small></td>' +
      '</tr>';
    });
    h += '</tbody></table></div>';

    // Migration Playbook
    h += '<h2>10-Point Model Deprecation & Migration Playbook</h2>' +
      '<div class="box" style="margin:16px 0">' +
        '<ol style="padding-left:20px;line-height:1.6">' +
        md.migrationPlaybook.map(function (step) {
          return '<li style="margin:6px 0"><b>' + esc(step.name) + ':</b> ' + esc(step.action) + '<br><small style="color:var(--ok)"><b>Validation:</b> ' + esc(step.validation) + '</small></li>';
        }).join('') +
        '</ol>' +
      '</div>';

    return h;
  }

  /* ==========================================================================
     PAGE 8: AI EVALUATION & QUALITY ENGINEERING CENTRE (#/eval)
     ========================================================================== */
  function pageEval() {
    var ev = A.eval;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Quality & Evals</div>' +
      '<h1>AI Evaluation & Quality Engineering Centre</h1>' +
      '<p class="lede">Comprehensive quality frameworks, 28-metric dictionary, automated release gates, and golden dataset governance for generative AI and agentic systems on AWS.</p>';

    // 13 Evaluation Layers
    h += '<h2>The 13 AI Evaluation Layers</h2>' +
      '<div class="grid" style="margin:16px 0">';
    ev.layers.forEach(function (L, idx) {
      h += '<div class="box">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<span class="chip" style="--h:25">Layer ' + (idx + 1) + '</span>' +
          '<small style="font:600 11px var(--mono);color:var(--muted)">' + esc(L.frequency) + '</small>' +
        '</div>' +
        '<h3>' + esc(L.name) + '</h3>' +
        '<p style="font-size:13px;color:var(--muted)">' + esc(L.focus) + '</p>' +
        '<div style="font-size:12px;color:var(--ink)"><b>Tooling:</b> ' + fmt(L.tooling) + '</div>' +
      '</div>';
    });
    h += '</div>';

    // 28 Metrics Dictionary
    h += '<h2>Production AI Metrics Dictionary (' + ev.metricsDictionary.length + ' Metrics)</h2>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr>' +
        '<th>Category</th><th>Metric Name</th><th>Measurement Formula</th><th>Target Threshold</th><th>Engineering Significance</th>' +
      '</tr></thead><tbody>';
    ev.metricsDictionary.forEach(function (m) {
      h += '<tr>' +
        '<td><span class="chip" style="--h:212">' + esc(m.category) + '</span></td>' +
        '<td><b>' + esc(m.metric) + '</b></td>' +
        '<td><code>' + esc(m.formula) + '</code></td>' +
        '<td><b>' + esc(m.target) + '</b></td>' +
        '<td><small>' + esc(m.description) + '</small></td>' +
      '</tr>';
    });
    h += '</tbody></table></div>';

    // 12 Production Release Gates
    h += '<h2>Mandatory Production Release Quality Gates (12 Gates)</h2>' +
      '<p style="max-width:68ch">All 12 gates must pass with written proof before any generative AI or agentic workload can be promoted to production.</p>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr>' +
        '<th>Gate ID</th><th>Quality Gate</th><th>Strict Requirement</th><th>Enforcement</th>' +
      '</tr></thead><tbody>';
    ev.productionReleaseGate.forEach(function (g) {
      h += '<tr>' +
        '<td><code>' + esc(g.id) + '</code></td>' +
        '<td><b>' + esc(g.item) + '</b></td>' +
        '<td>' + esc(g.requirement) + '</td>' +
        '<td><span class="severity-pill critical">MANDATORY</span></td>' +
      '</tr>';
    });
    h += '</tbody></table></div>';

    // Golden Dataset Design Guide
    h += '<h2>Golden Dataset Engineering Guide</h2>' +
      '<div class="grid" style="margin:16px 0">';
    ev.goldenDatasetDesign.steps.forEach(function (st) {
      h += '<div class="box">' +
        '<h4>Step ' + st.step + ': ' + esc(st.title) + '</h4>' +
        '<p style="font-size:13px;color:var(--muted)">' + esc(st.desc) + '</p>' +
      '</div>';
    });
    h += '</div>';

    return h;
  }

  /* ==========================================================================
     PAGE 9: AI FINOPS & UNIT ECONOMICS (#/finops)
     ========================================================================== */
  function pageFinOps() {
    var fo = A.finops;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / FinOps & Budget</div>' +
      '<h1>AI FinOps, Unit Economics & Budget Governance</h1>' +
      '<p class="lede">Unit cost modeling, capacity planning, cost reduction levers, and financial governance for production AI workloads on AWS.</p>';

    // 4 EM Metrics
    h += '<h2>The 4 Core AI Engineering Manager FinOps Metrics</h2>' +
      '<div class="grid" style="margin:16px 0">';
    fo.emMetrics.forEach(function (m) {
      h += '<div class="box">' +
        '<small style="font:600 11px var(--mono);text-transform:uppercase;color:var(--accent)">FinOps KPI</small>' +
        '<h3>' + esc(m.title) + '</h3>' +
        '<div style="font:700 16px var(--mono);margin:4px 0">' + esc(m.target) + '</div>' +
        '<p style="font-size:13px;color:var(--muted)"><b>Formula:</b> <code>' + esc(m.formula) + '</code></p>' +
        '<p style="font-size:13px">' + esc(m.why) + '</p>' +
      '</div>';
    });
    h += '</div>';

    // 5 Enterprise Deployment Scenarios
    h += '<h2>Enterprise AI Cost Profiles (5 Production Scenarios)</h2>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr>' +
        '<th>Workload Scenario</th><th>Monthly Volume</th><th>Monthly Spend</th><th>Cost Per Task</th><th>AWS Architecture Stack</th>' +
      '</tr></thead><tbody>';
    fo.scenarios.forEach(function (sc) {
      h += '<tr>' +
        '<td><b>' + esc(sc.name) + '</b></td>' +
        '<td>' + esc(sc.volume) + '</td>' +
        '<td><b>' + esc(sc.monthlySpend) + '</b></td>' +
        '<td><code>' + esc(sc.costPerTask) + '</code></td>' +
        '<td><small>' + esc(sc.stack) + '</small></td>' +
      '</tr>';
    });
    h += '</tbody></table></div>';

    // 17 Cost Categories Breakdown
    h += '<h2>The 17 Cloud Cost Tiers & Drivers</h2>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr>' +
        '<th>Tier ID</th><th>Cost Category</th><th>AWS Service</th><th>Unit of Measure</th><th>EM Optimization Lever</th>' +
      '</tr></thead><tbody>';
    fo.costCategories.forEach(function (cc) {
      h += '<tr>' +
        '<td><code>' + esc(cc.id) + '</code></td>' +
        '<td><b>' + esc(cc.name) + '</b></td>' +
        '<td><small>' + esc(cc.svc) + '</small></td>' +
        '<td><code>' + esc(cc.unit) + '</code></td>' +
        '<td><small style="color:var(--ok)">' + esc(cc.lever) + '</small></td>' +
      '</tr>';
    });
    h += '</tbody></table></div>';

    // 17 Cost Levers
    h += '<h2>The 17 Cost Reduction Levers</h2>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr>' +
        '<th>Optimization Lever</th><th>Savings Potential</th><th>Mechanism & AWS Implementation</th>' +
      '</tr></thead><tbody>';
    fo.costLevers.forEach(function (lv) {
      h += '<tr>' +
        '<td><b>' + esc(lv.lever) + '</b></td>' +
        '<td><span class="health-badge healthy">' + esc(lv.savings) + '</span></td>' +
        '<td><small>' + esc(lv.mechanism) + '</small></td>' +
      '</tr>';
    });
    h += '</tbody></table></div>';

    // Budget Approval Gates
    h += '<h2>Budget Governance & Approval Gates</h2>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr>' +
        '<th>Lifecycle Stage</th><th>Mandatory Financial Requirement</th>' +
      '</tr></thead><tbody>';
    fo.approvalGates.forEach(function (gt) {
      h += '<tr>' +
        '<td><b>' + esc(gt.stage) + '</b></td>' +
        '<td><small>' + esc(gt.requirement) + '</small></td>' +
      '</tr>';
    });
    h += '</tbody></table></div>';

    return h;
  }

  /* ==========================================================================
     PAGE 10: PRODUCTION OPERATIONS & SRE (#/ops)
     ========================================================================== */
  function pageOperations() {
    var op = A.operations, sre = A.sre;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Operations & SRE</div>' +
      '<h1>Production AI Operations & SRE Command Centre</h1>' +
      '<p class="lede">Site Reliability Engineering for non-deterministic AI systems: 12 reliability principles, SLO error budgets, 14 chaos engineering drills, 10-widget CloudWatch dashboards, and incident runbooks.</p>';

    // 12 Reliability Principles
    h += '<h2>12 Reliability Principles for Non-Deterministic AI</h2>' +
      '<div class="grid" style="margin:16px 0">';
    sre.principles.forEach(function (pr, idx) {
      h += '<div class="box">' +
        '<h4>' + (idx + 1) + '. ' + esc(pr.title) + '</h4>' +
        '<p style="font-size:13px;color:var(--muted)">' + esc(pr.desc) + '</p>' +
      '</div>';
    });
    h += '</div>';

    // SLO Error Budget Scorecard
    h += '<h2>Production SLO & Error Budget Scorecards</h2>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr>' +
        '<th>Service Level Indicator (SLI)</th><th>SLO Target</th><th>Measurement Method</th><th>Allowed Error Budget</th>' +
      '</tr></thead><tbody>';
    sre.slos.forEach(function (sl) {
      h += '<tr>' +
        '<td><b>' + esc(sl.sli) + '</b></td>' +
        '<td><span class="health-badge healthy">' + esc(sl.slo) + '</span></td>' +
        '<td><small>' + esc(sl.measurement) + '</small></td>' +
        '<td><small style="color:var(--warn)">' + esc(sl.errorBudget) + '</small></td>' +
      '</tr>';
    });
    h += '</tbody></table></div>';

    // 14 SRE Chaos Engineering Drills
    h += '<h2>14 AI SRE Chaos Engineering Drills</h2>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr>' +
        '<th>Drill ID</th><th>Scenario Name</th><th>Simulated Failure Injection</th><th>Expected System Behavior</th><th>Verification Criteria</th>' +
      '</tr></thead><tbody>';
    sre.chaosDrills.forEach(function (dr) {
      h += '<tr>' +
        '<td><code>' + esc(dr.id) + '</code></td>' +
        '<td><b>' + esc(dr.title) + '</b></td>' +
        '<td><small>' + esc(dr.scenario) + '</small></td>' +
        '<td><small style="color:var(--ok)">' + esc(dr.expectedBehavior) + '</small></td>' +
        '<td><small><b>' + esc(dr.verification) + '</b></small></td>' +
      '</tr>';
    });
    h += '</tbody></table></div>';

    // Dashboard Template
    h += '<h2>' + esc(op.dashboardTemplate.title) + '</h2>' +
      '<p class="fine">' + esc(op.dashboardTemplate.subtitle) + '</p>' +
      '<div class="dash-grid">';
    op.dashboardTemplate.widgets.forEach(function (w) {
      h += '<div class="dash-card">' +
        '<div class="dash-top">' +
          '<h4>' + esc(w.title) + '</h4>' +
          '<span class="status-pill ' + (w.status === 'ok' ? 'ok' : 'warn') + '">● ' + esc(w.status) + '</span>' +
        '</div>' +
        '<div class="dash-metric">' + esc(w.metric) + '</div>' +
        '<div class="dash-sub">' + esc(w.sub) + '</div>' +
        '<div class="dash-target">' + esc(w.target) + '</div>' +
        '<div style="margin-top:auto;padding-top:10px;display:flex;justify-content:space-between;align-items:center">' +
          '<button class="btn-sm" type="button" data-toggle-kql="' + w.id + '">View Query ⤢</button>' +
          '<button class="btn-sm" type="button" data-copy="' + esc(w.kusto || w.query || '') + '">Copy Query</button>' +
        '</div>' +
        '<div class="kql-box" id="kql-' + w.id + '" hidden>' + esc(w.kusto || w.query || '') + '</div>' +
      '</div>';
    });
    h += '</div>';

    // Production Runbooks
    h += '<h2>Production SRE Incident Runbooks</h2>' +
      '<p style="max-width:62ch">Step-by-step remediation procedures for on-call engineers when anomalies trigger high-severity alerts.</p>';
    op.runbooks.forEach(function (rb) {
      var sevColor = rb.severity.indexOf('P1') > -1 ? 'var(--warn)' : 'var(--accent)';
      h += '<div class="box" style="margin:16px 0;border-left:5px solid ' + sevColor + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
          '<h3>' + esc(rb.title) + '</h3>' +
          '<span class="door ' + (rb.severity.indexOf('P1') > -1 ? 'one-way' : 'two-way') + '">' + esc(rb.severity) + '</span>' +
        '</div>' +
        '<p style="margin:8px 0;color:var(--muted)"><b>Trigger Condition:</b> ' + fmt(rb.trigger) + '</p>' +
        '<h4>Remediation Steps:</h4>' +
        '<ol style="margin:8px 0;padding-left:22px">' +
        rb.steps.map(function (st) { return '<li style="margin:6px 0">' + fmt(st) + '</li>'; }).join('') +
        '</ol>' +
      '</div>';
    });

    // Postmortem Template
    var pm = op.postmortemTemplate;
    h += '<h2>' + esc(pm.title) + '</h2>' +
      '<p>' + fmt(pm.intro) + '</p>' +
      '<div style="margin:12px 0 8px;display:flex;justify-content:flex-end">' +
        '<button class="copy-btn" type="button" id="copyPostmortem">Copy Postmortem Template</button>' +
      '</div>' +
      '<pre class="adr" tabindex="0">' + esc(pm.templateMarkdown) + '</pre>';

    afterRender = function () {
      $$('button[data-toggle-kql]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = this.getAttribute('data-toggle-kql');
          var target = $('#kql-' + id);
          if (target) {
            target.hidden = !target.hidden;
            this.textContent = target.hidden ? 'View Query ⤢' : 'Hide Query ⤹';
          }
        });
      });
      $$('button[data-copy]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          copyText(this.getAttribute('data-copy'), this);
        });
      });
      var copyPmBtn = $('#copyPostmortem');
      if (copyPmBtn) copyPmBtn.addEventListener('click', function () { copyText(pm.templateMarkdown, this); });
    };

    return h;
  }

  /* ==========================================================================
     PAGE 11: SECURITY, GOVERNANCE & COMPLIANCE (#/gov)
     ========================================================================== */
  function pageGovernance() {
    var g = A.governance, comp = A.compliance;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Security & Governance</div>' +
      '<h1>Enterprise AI Security, Governance & Regulatory Compliance</h1>' +
      '<p class="lede">AWS Control Tower multi-account landing zones, zero-trust network boundaries, regulatory crosswalks (NIST AI RMF, ISO 42001, EU AI Act, India DPDP Act), and 12 enterprise compliance controls.</p>';

    // Regulatory Frameworks Crosswalk
    h += '<h2>Global AI Regulatory Frameworks Crosswalk</h2>' +
      '<div class="grid" style="margin:16px 0">';
    comp.frameworks.forEach(function (fw) {
      h += '<div class="box">' +
        '<small style="font:600 11px var(--mono);color:var(--accent)">' + esc(fw.scope) + '</small>' +
        '<h3>' + esc(fw.name) + '</h3>' +
        '<h4>Key Mandates:</h4>' + ul(fw.pillars) +
        '<div style="margin-top:8px;font-size:12px;color:var(--ok)"><b>AWS Mapping:</b> ' + esc(fw.awsMapping) + '</div>' +
      '</div>';
    });
    h += '</div>';

    // 12 Enterprise Compliance Controls Matrix
    h += '<h2>The 12 Enterprise Compliance Controls Matrix</h2>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr>' +
        '<th>Compliance Requirement</th><th>Control Description</th><th>AWS Architecture Implementation</th><th>Audit Evidence Required</th>' +
      '</tr></thead><tbody>';
    comp.controlsMatrix.forEach(function (cm) {
      h += '<tr>' +
        '<td><b>' + esc(cm.req) + '</b></td>' +
        '<td><small>' + esc(cm.control) + '</small></td>' +
        '<td><small>' + fmt(cm.awsImpl) + '</small></td>' +
        '<td><small style="color:var(--muted)">' + esc(cm.evidence) + '</small></td>' +
      '</tr>';
    });
    h += '</tbody></table></div>';

    // Landing Zone & Security Framework
    h += '<h2>' + esc(g.landingZones.title) + '</h2>' +
      '<p>' + fmt(g.landingZones.intro) + '</p>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr><th>Management Group Level</th><th>Target Scope</th><th>Architecture Purpose</th></tr></thead><tbody>' +
      g.landingZones.hierarchy.map(function (row) {
        return '<tr><td><b>' + esc(row.level) + '</b></td><td>' + esc(row.scope) + '</td><td>' + fmt(row.purpose) + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    // Tenancy Models
    h += '<h2>' + esc(g.tenancyModels.title) + '</h2>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr><th>Isolation Model</th><th>Best Fit</th><th>Mechanism</th><th>Pros</th><th>Cons</th></tr></thead><tbody>' +
      g.tenancyModels.models.map(function (m) {
        return '<tr><td><b>' + esc(m.name) + '</b></td><td>' + fmt(m.fit) + '</td><td>' + fmt(m.mechanism) + '</td><td><span style="color:var(--ok)">' + fmt(m.pros) + '</span></td><td><span style="color:var(--warn)">' + fmt(m.cons) + '</span></td></tr>';
      }).join('') + '</tbody></table></div>';

    // SCP Policies
    h += '<h2>' + esc(g.policyInitiatives.title) + '</h2>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr><th>Policy / SCP Name</th><th>Enforcement Effect</th><th>Compliance & Security Purpose</th></tr></thead><tbody>' +
      g.policyInitiatives.policies.map(function (pol) {
        var effectColor = pol.effect === 'Deny' ? 'var(--warn)' : 'var(--accent)';
        return '<tr><td><b>' + esc(pol.name) + '</b></td><td><code style="color:' + effectColor + '">' + esc(pol.effect) + '</code></td><td>' + fmt(pol.purpose) + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    return h;
  }

  /* ==========================================================================
     PAGE 12: LEADERSHIP, WORKFORCE & TECHNICAL DEBT (#/leadership)
     ========================================================================== */
  function pageLeadership() {
    var wf = A.workforce;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Leadership</div>' +
      '<h1>AI Engineering Leadership, Workforce Matrix & Technical Debt</h1>' +
      '<p class="lede">Competency ladders from Junior to Principal Engineer, engineering productivity metrics, 13 categories of AI technical debt, and a 5-level organizational maturity model.</p>';

    // 10-Domain Competency Matrix
    h += '<h2>10-Domain AI Engineering Competency Matrix</h2>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr>' +
        '<th>Competency Domain</th><th>Junior Engineer</th><th>Mid-Level Engineer</th><th>Senior Engineer</th><th>Principal / Lead</th>' +
      '</tr></thead><tbody>';
    wf.competencies.forEach(function (c) {
      h += '<tr>' +
        '<td><b>' + esc(c.domain) + '</b></td>' +
        '<td><small>' + esc(c.junior) + '</small></td>' +
        '<td><small>' + esc(c.mid) + '</small></td>' +
        '<td><small>' + esc(c.senior) + '</small></td>' +
        '<td><small style="color:var(--accent)">' + esc(c.principal) + '</small></td>' +
      '</tr>';
    });
    h += '</tbody></table></div>';

    // Productivity Metrics
    h += '<h2>AI Engineering Team Productivity Metrics</h2>' +
      '<div class="grid" style="margin:16px 0">';
    wf.productivityMetrics.forEach(function (pm) {
      h += '<div class="box">' +
        '<h3>' + esc(pm.metric) + '</h3>' +
        '<div style="font:700 16px var(--mono);margin:4px 0">' + esc(pm.target) + ' (' + esc(pm.unit) + ')</div>' +
        '<p style="font-size:13px;color:var(--muted)">' + esc(pm.desc) + '</p>' +
      '</div>';
    });
    h += '</div>';

    // 13 Technical Debt Categories
    h += '<h2>13 Categories of AI Technical Debt & Remediation</h2>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr>' +
        '<th>Debt Category</th><th>Severity</th><th>Symptoms</th><th>Remediation Strategy</th>' +
      '</tr></thead><tbody>';
    wf.technicalDebt.forEach(function (td) {
      h += '<tr>' +
        '<td><b>' + esc(td.category) + '</b></td>' +
        '<td><span class="severity-pill ' + (td.severity === 'High' ? 'critical' : 'medium') + '">' + esc(td.severity) + '</span></td>' +
        '<td><small style="color:var(--warn)">' + esc(td.symptom) + '</small></td>' +
        '<td><small style="color:var(--ok)">' + esc(td.remediation) + '</small></td>' +
      '</tr>';
    });
    h += '</tbody></table></div>';

    // 5-Level Maturity Model
    h += '<h2>5-Level Organizational AI Maturity Ladder</h2>' +
      '<div class="grid" style="margin:16px 0">';
    wf.maturityModel.forEach(function (ml) {
      h += '<div class="box">' +
        '<span class="chip" style="--h:25">Level ' + esc(ml.level) + '</span>' +
        '<h3>' + esc(ml.name) + '</h3>' +
        '<p style="font-size:13px;color:var(--muted)">' + esc(ml.desc) + '</p>' +
        '<div style="font-size:12px;color:var(--ok);margin-top:8px"><b>Next Step to Advance:</b> ' + esc(ml.nextStep) + '</div>' +
      '</div>';
    });
    h += '</div>';

    return h;
  }

  /* ==========================================================================
     PAGE 13: MANAGER TOOLKIT & COPYABLE TEMPLATES (22 TEMPLATES) (#/toolkit)
     ========================================================================== */
  function pageToolkit() {
    var tk = A.toolkit;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Manager Toolkit</div>' +
      '<h1>AI Engineering Manager Toolkit & Templates (22 Templates)</h1>' +
      '<p class="lede">Comprehensive frameworks, RACI matrix, RAID log, use case estimation, and 22 production-ready copyable Markdown templates for engineering leaders.</p>';

    // Assessment & Estimation
    h += '<h2>' + esc(tk.useCaseAssessment.title) + '</h2>' +
      '<p>' + fmt(tk.useCaseAssessment.intro) + '</p>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr><th>Score Range</th><th>Verdict</th><th>Recommended Leadership Action</th></tr></thead><tbody>' +
      tk.useCaseAssessment.scoringMatrix.map(function (row) {
        return '<tr><td><b>' + esc(row.range) + '</b></td><td><span class="door two-way">' + esc(row.verdict) + '</span></td><td>' + fmt(row.action) + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    // RACI Matrix
    h += '<h2>' + esc(tk.raciMatrix.title) + '</h2>' +
      '<div class="tablewrap"><table class="matrix-table"><thead><tr><th>Key Engineering Activity</th>' +
      tk.raciMatrix.roles.map(function (r) { return '<th>' + esc(r) + '</th>'; }).join('') +
      '</tr></thead><tbody>' +
      tk.raciMatrix.matrix.map(function (row) {
        function badge(r) {
          var cls = r === 'R' ? 'raci-r' : (r === 'A' ? 'raci-a' : (r === 'C' ? 'raci-c' : 'raci-i'));
          return '<span class="raci-badge ' + cls + '">' + r + '</span>';
        }
        return '<tr><td><b>' + esc(row.task) + '</b></td>' +
          row.raci.map(function (rc) { return '<td style="text-align:center">' + badge(rc) + '</td>'; }).join('') +
          '</tr>';
      }).join('') + '</tbody></table></div>';

    // 22 Copyable Templates
    h += '<h2>22 Production-Ready Copyable Leadership Templates</h2>' +
      '<p style="max-width:68ch">Production-tested Markdown templates ready for immediate export into GitHub, Confluence, Jira, or ARB dossiers.</p>';

    h += '<div class="seg" role="group" aria-label="Filter templates" id="tmplFilter" style="margin:14px 0;flex-wrap:wrap">' +
      '<button type="button" data-f="all" class="on">All Templates (' + tk.templates.length + ')</button>' +
      '<button type="button" data-f="Delivery">Delivery & Portfolio</button>' +
      '<button type="button" data-f="Architecture">Architecture</button>' +
      '<button type="button" data-f="Governance">Governance & Compliance</button>' +
      '<button type="button" data-f="FinOps">FinOps</button>' +
      '<button type="button" data-f="Operations">Operations & SRE</button>' +
      '<button type="button" data-f="Leadership">Leadership</button>' +
      '</div>';

    h += '<div class="template-grid" id="tmplGrid">';
    tk.templates.forEach(function (tmpl, idx) {
      h += '<div class="template-card" data-cat="' + esc(tmpl.category) + '">' +
        '<div class="template-meta">' +
          '<span class="chip" style="--h:25">' + esc(tmpl.category) + '</span>' +
          '<span>#' + (idx + 1) + '</span>' +
        '</div>' +
        '<h4>' + esc(tmpl.title) + '</h4>' +
        '<p style="font-size:13px;color:var(--muted);margin:0 0 10px">' + esc(tmpl.description) + '</p>' +
        '<div style="display:flex;gap:8px;margin-top:auto">' +
          '<button class="btn-sm" type="button" data-toggle-tmpl="' + tmpl.id + '">View Template ⤢</button>' +
          '<button class="copy-btn" type="button" data-copy-tmpl="' + tmpl.id + '">Copy Template</button>' +
        '</div>' +
        '<pre class="adr" id="tmpl-pre-' + tmpl.id + '" style="margin-top:10px;max-height:300px;overflow-y:auto" hidden tabindex="0">' + esc(tmpl.templateMarkdown) + '</pre>' +
      '</div>';
    });
    h += '</div>';

    afterRender = function () {
      // Toggle view template
      $$('button[data-toggle-tmpl]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = this.getAttribute('data-toggle-tmpl');
          var target = $('#tmpl-pre-' + id);
          if (target) {
            target.hidden = !target.hidden;
            this.textContent = target.hidden ? 'View Template ⤢' : 'Hide Template ⤹';
          }
        });
      });

      // Copy template
      $$('button[data-copy-tmpl]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = this.getAttribute('data-copy-tmpl');
          var tmpl = tk.templates.find(function (t) { return t.id === id; });
          if (tmpl) copyText(tmpl.templateMarkdown, this);
        });
      });

      // Filter templates
      var tmplFilter = $('#tmplFilter');
      if (tmplFilter) {
        tmplFilter.addEventListener('click', function (e) {
          var b = e.target.closest('button[data-f]');
          if (!b) return;
          var f = b.getAttribute('data-f');
          $$('#tmplFilter button').forEach(function (x) { x.classList.toggle('on', x === b); });
          $$('#tmplGrid .template-card').forEach(function (card) {
            card.hidden = f !== 'all' && card.getAttribute('data-cat') !== f;
          });
        });
      }
    };

    return h;
  }

  /* ==========================================================================
     PAGE 14: DECISIONS, TOOLS, SHAPER, CHECKLISTS, CALCULATOR
     ========================================================================== */
  var decById = {}; A.decisions.forEach(function (d) { decById[d.id] = d; });
  var themeById = {}; A.decisionThemes.forEach(function (t) { themeById[t.id] = t; });
  var THEME_HUE = { strategy: 212, architecture: 268, risk: 150 };
  var DOOR = { 'two-way': ['Two-way door', 'Easy to reverse'], 'one-way': ['One-way door', 'Hard to reverse'], 'mixed': ['Mixed door', 'Reversible at first'] };

  function doorBadge(d) { var x = DOOR[d.door]; return '<span class="door ' + d.door + '" title="' + esc(x[1]) + '">' + x[0] + '</span>'; }
  function plain(s) {
    return String(s || '').replace(/\\\\\\[\\\\\\[([a-z0-9-]+)(?:\\\\|([^\\\\\\]]+))?\\\\\\]\\\\\\]/g, function (m, id, label) { return label || (byId[id] ? byId[id].name : id); });
  }

  var roleById = {}; A.roles.forEach(function (r) { roleById[r.id] = r; });
  var ROLE_KEY = 'atlas-role';
  function getRole() { try { var r = localStorage.getItem(ROLE_KEY); return roleById[r] ? r : null; } catch (e) { return null; } }
  function setRole(r) { try { localStorage.setItem(ROLE_KEY, r); } catch (e) {} }
  var LEAD_TEXT = { em: 'Engineering manager leads', pe: 'Principal engineer leads', both: 'Shared decision' };
  function leadChip(d) { return '<span class="lead ' + d.lead + '">' + LEAD_TEXT[d.lead] + '</span>'; }
  function roleChip(d, role) {
    var t = d.lead === role ? 'You lead' : (d.lead === 'both' ? 'You co-own' : 'You advise');
    return '<span class="lead ' + (d.lead === role ? 'mine' : (d.lead === 'both' ? 'both' : 'other')) + '">' + t + '</span>';
  }
  function tabList(label, tabs, active) {
    return '<div class="tabs" role="tablist" aria-label="' + esc(label) + '">' + tabs.map(function (t) {
      var on = t[0] === active;
      return '<button type="button" role="tab" class="tab" id="tab-' + t[0] + '" aria-controls="panel-' + t[0] + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-tab="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div>';
  }
  function tabPanel(id, active, html) {
    return '<div role="tabpanel" class="tabpanel" id="panel-' + id + '" aria-labelledby="tab-' + id + '" tabindex="0"' + (id === active ? '' : ' hidden') + '>' + html + '</div>';
  }
  function mountTabs(root, onChange) {
    var list = $('.tabs', root); if (!list) return;
    function select(id, focus) {
      $$('.tab', list).forEach(function (b) {
        var on = b.getAttribute('data-tab') === id;
        b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      $$('.tabpanel', root).forEach(function (p) { p.hidden = p.id !== 'panel-' + id; });
      if (onChange) onChange(id);
    }
    list.addEventListener('click', function (e) { var b = e.target.closest('.tab'); if (b) select(b.getAttribute('data-tab')); });
  }

  function decisionCard(d, line, chip) {
    return '<a class="card" style="--h:' + THEME_HUE[d.theme] + '" href="#/d/' + d.id + '"><div class="mini">' + esc(themeById[d.theme].name) + '</div><h3>' + esc(d.title) + '</h3><p>' + esc(line) + '</p>' +
      '<div class="badges">' + doorBadge(d) + (chip || '') + '</div></a>';
  }

  function roleView(role) {
    var r = roleById[role], other = role === 'em' ? 'pe' : 'em';
    var h = '<p class="rolelede">' + fmt(r.blurb) + '</p>' +
      '<div class="lists two"><div class="box"><h3>What you decide</h3>' + ul(r.owns) + '</div>' +
      '<div class="box ml"><h3>Your rhythm</h3><ul>' + r.rhythm.map(function (x) { return '<li><b>' + esc(x[0]) + ':</b> ' + fmt(x[1]) + '</li>'; }).join('') + '</ul></div></div>';
    h += '<h3 style="margin-top:30px">Quick calls</h3>' +
      '<div class="tablewrap"><table class="quick"><thead><tr><th>If this is happening</th><th>Default call</th><th>Guide</th></tr></thead><tbody>' +
      r.quick.map(function (q) { var d = decById[q[2]]; return '<tr><td>' + fmt(q[0]) + '</td><td>' + fmt(q[1]) + '</td><td><a href="#/d/' + d.id + '">' + esc(d.title) + '</a></td></tr>'; }).join('') + '</tbody></table></div>';
    var groups = [
      ['You lead these', A.decisions.filter(function (d) { return d.lead === role; })],
      ['You co-own these', A.decisions.filter(function (d) { return d.lead === 'both'; })],
      [role === 'em' ? 'Principal engineers lead; you back them on' : 'Engineering managers lead; you advise on', A.decisions.filter(function (d) { return d.lead === other; })]
    ];
    groups.forEach(function (g) {
      if (!g[1].length) return;
      h += '<h3 style="margin-top:30px">' + esc(g[0]) + ' <span class="cnt">' + g[1].length + '</span></h3><div class="grid">' +
        g[1].map(function (d) { return decisionCard(d, d[role].call, roleChip(d, role)); }).join('') + '</div>';
    });
    return h;
  }

  function allView() {
    var h = '<p class="rolelede">Every guide, grouped by theme. Each is marked with who usually leads it.</p>';
    A.decisionThemes.forEach(function (t) {
      var list = A.decisions.filter(function (d) { return d.theme === t.id; });
      h += '<h3 style="margin-top:26px">' + esc(t.name) + '</h3><p style="max-width:62ch">' + esc(t.blurb) + '</p><div class="grid">' +
        list.map(function (d) { return decisionCard(d, d.question, leadChip(d)); }).join('') + '</div>';
    });
    return h;
  }

  function pageDecisionHub(tab) {
    var active = (tab === 'em' || tab === 'pe' || tab === 'all') ? tab : (getRole() || 'em');
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Decisions</div><h1>Architecture Decision Centre (27 Decision Guides)</h1>' +
      '<p class="lede">For engineering managers and principal engineers deciding how to build agentic and ML systems on AWS.</p>' +
      tabList('Decision guides by role', [['em', 'Engineering managers'], ['pe', 'Principal engineers'], ['all', 'All guides']], active) +
      tabPanel('em', active, roleView('em')) + tabPanel('pe', active, roleView('pe')) + tabPanel('all', active, allView());

    h += '<h2>Tools</h2><div class="grid">' +
      '<a class="card" style="--h:25" href="#/d/shaper"><div class="mini">Interactive</div><h3>Solution shaper</h3><p>Answer seven questions about your use case and get a starting stack, risks, and next decisions.</p></a>' +
      '<a class="card" style="--h:150" href="#/d/checklists"><div class="mini">Checklist</div><h3>Readiness checklists</h3><p>A prototype-to-scale maturity ladder, a production-readiness checklist, and an ADR template.</p></a>' +
      '<a class="card" style="--h:185" href="#/d/calculator"><div class="mini">Calculator</div><h3>Cost per task</h3><p>Model unit economics and see which levers move the bill most.</p></a></div>';

    afterRender = function () {
      mountTabs($('#main'), function (id) {
        if (id !== 'all') setRole(id);
        try { history.replaceState(null, '', '#/d/' + id); } catch (e) {}
        renderSide('d', id);
      });
    };
    return h;
  }

  function roleLens(d, role) {
    var x = d[role], lbl = role === 'em' ? ['You decide', 'Ask your team for'] : ['You own', 'Evidence to demand'];
    return '<div class="callout lens"><b>Default call</b>' + fmt(x.call) + '</div>' +
      '<div class="lists two"><div class="box"><h3>' + lbl[0] + '</h3>' + ul(x.own) + '</div><div class="box ml"><h3>' + lbl[1] + '</h3>' + ul(x.evidence) + '</div></div>';
  }

  function pageDecision(id) {
    var d = decById[id]; if (!d) return notFound();
    var t = themeById[d.theme], i = A.decisions.indexOf(d);
    var active = getRole() || (d.lead === 'pe' ? 'pe' : 'em');
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/d">Decisions</a> / ' + esc(t.name) + '</div><h1>' + esc(d.title) + '</h1><p class="lede">' + esc(d.question) + '</p>';
    h += '<div class="doorline">' + doorBadge(d) + '<span>' + fmt(d.doorNote) + '</span></div>';
    h += '<h2>Decide by role</h2><p class="lead-note">' + leadChip(d) + '</p>';
    h += tabList('Decision lens by role', [['em', 'Engineering manager' + (d.lead === 'em' ? ' <i>leads</i>' : '')], ['pe', 'Principal engineer' + (d.lead === 'pe' ? ' <i>leads</i>' : '')]], active);
    h += tabPanel('em', active, roleLens(d, 'em')) + tabPanel('pe', active, roleLens(d, 'pe'));
    h += '<h2>Why it matters</h2>' + paras(d.why);
    h += '<h2>The options</h2><div class="tablewrap"><table><thead><tr>' + d.cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      d.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + fmt(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    h += '<h2>Decide with these rules</h2><div class="rules">' + d.rules.map(function (r) {
      return '<div class="rule"><div class="if"><small>If</small>' + fmt(r[0]) + '</div><div class="then"><small>Then</small>' + fmt(r[1]) + '</div></div>';
    }).join('') + '</div>';
    h += '<div class="lists two" style="margin-top:34px"><div class="box warn"><h3>Red flags</h3>' + ul(d.redflags) + '</div><div class="box"><h3>Ask in the design review</h3>' + ul(d.ask) + '</div></div>';
    h += '<div class="callout" style="margin-top:22px"><b>Revisit when</b>' + fmt(d.revisit) + '</div>';
    var rel = (d.related || []).filter(function (p) { return byId[p]; });
    if (rel.length) h += '<h2>Services involved</h2><div class="pairs">' + rel.map(function (p) { return '<a href="#/s/' + p + '">' + esc(byId[p].name) + '</a>'; }).join('') + '</div>';
    var prev = A.decisions[i - 1], next = A.decisions[i + 1];
    h += '<div class="pn">' + (prev ? '<a href="#/d/' + prev.id + '"><small>← Previous</small>' + esc(prev.title) + '</a>' : '<span></span>') + (next ? '<a href="#/d/' + next.id + '"><small>Next →</small>' + esc(next.title) + '</a>' : '') + '</div>';
    afterRender = function () { mountTabs($('#main'), function (r) { setRole(r); }); };
    return h;
  }

  /* ----- solution shaper ----- */
  function pageShaper() {
    var Q = A.shaper.questions;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/d">Decisions</a> / Tool</div><h1>Solution shaper</h1>' +
      '<p class="lede">Describe the system. Get a starting shape you can argue with.</p>' +
      '<div class="callout"><b>Read this first</b>This is a rule-based starting point, not an architecture sign-off. It shows the usual shape for your answers and the decisions most worth a conversation. Your evals and constraints override it.</div>' +
      '<div class="shaper"><form id="shForm" class="shform" onsubmit="return false">';
    Q.forEach(function (q) {
      h += '<fieldset data-q="' + q.id + '"><legend>' + esc(q.label) + '</legend>' + q.options.map(function (o) {
        return '<label class="opt"><input type="radio" name="' + q.id + '" value="' + o[0] + '"><span>' + esc(o[1]) + '</span></label>';
      }).join('') + '</fieldset>';
    });
    h += '</form><div id="shOut" class="shout" aria-live="polite"></div></div>';
    afterRender = mountShaper;
    return '<div class="wide">' + h + '</div>';
  }
  function shaperMarkdown(a, r) {
    var Q = A.shaper.questions, L = ['# Solution shape: ' + r.headline, '', '## Inputs'];
    Q.forEach(function (q) {
      if (q.only && a.goal !== q.only) return;
      var o = q.options.filter(function (x) { return x[0] === a[q.id]; })[0];
      L.push('- ' + q.label + ' ' + (o ? o[1] : a[q.id]));
    });
    if (r.arch) L.push('', 'Reference architecture: ' + archById[r.arch].name);
    L.push('', '## Stack');
    r.stack.forEach(function (s) { L.push('- ' + byId[s.id].name + ': ' + s.role + '. ' + s.why); });
    L.push('', '## Risks to design for'); r.risks.forEach(function (x) { L.push('- ' + x); });
    L.push('', '## Decisions to make next'); r.next.forEach(function (n) { L.push('- ' + decById[n.id].title + ': ' + n.why); });
    L.push('', '## Phasing'); r.phases.forEach(function (p, i) { L.push((i + 1) + '. ' + p); });
    L.push('', 'Generated by the AWS for AI systems atlas. A starting point only: validate with your own evals.');
    return L.join('\\n');
  }
  function mountShaper() {
    var form = $('#shForm'), out = $('#shOut'), a = {}, k;
    for (k in A.shaper.defaults) a[k] = A.shaper.defaults[k];
    $$('input[type=radio]', form).forEach(function (r) { r.checked = a[r.name] === r.value; });
    function paint() {
      var fs = $('fieldset[data-q=action]', form); if (fs) fs.hidden = a.goal !== 'agent';
      var r = A.shaper.recommend(a), h = '<div class="eyebrow">Suggested starting shape</div><h2 style="margin-top:0">' + esc(r.headline) + '</h2>';
      if (r.arch && archById[r.arch]) h += '<p>Reference architecture: <a href="#/a/' + r.arch + '">' + esc(archById[r.arch].name) + '</a></p>';
      h += '<h3>Stack</h3><ul class="stack">' + r.stack.map(function (s) {
        var sv = byId[s.id];
        return '<li style="--h:' + hueOf(sv.cat) + '"><a class="svc" href="#/s/' + s.id + '">' + esc(sv.name) + '</a><span><b>' + esc(s.role) + '.</b> ' + esc(s.why) + '</span></li>';
      }).join('') + '</ul>';
      h += '<h3>Risks to design for</h3><div class="box warn" style="padding-top:2px">' + ul(r.risks) + '</div>';
      h += '<h3>Decide next</h3><ul class="nextl">' + r.next.map(function (n) {
        var d = decById[n.id]; return '<li><a href="#/d/' + d.id + '">' + esc(d.title) + '</a> ' + doorBadge(d) + '<br><span>' + esc(n.why) + '</span></li>';
      }).join('') + '</ul>';
      h += '<h3>Phasing</h3><ol class="phases">' + r.phases.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>';
      h += '<div class="btns" style="margin-top:18px"><button class="btn" type="button" data-copy>Copy as markdown</button><a class="btn" href="#/d/checklists">Readiness checklists</a></div>';
      out.innerHTML = h; out._md = shaperMarkdown(a, r);
    }
    form.addEventListener('change', function (e) { if (e.target.name) { a[e.target.name] = e.target.value; paint(); } });
    out.addEventListener('click', function (e) { var b = e.target.closest('[data-copy]'); if (b) copyText(out._md, b); });
    paint();
  }

  /* ----- checklists ----- */
  var READY_KEY = 'atlas-ready-v1';
  function loadReady() { try { return JSON.parse(localStorage.getItem(READY_KEY)) || {}; } catch (e) { return {}; } }
  function saveReady(o) { try { localStorage.setItem(READY_KEY, JSON.stringify(o)); } catch (e) {} }

  function pageChecklists() {
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/d">Decisions</a> / Tool</div><h1>Readiness checklists</h1>' +
      '<p class="lede">What has to be true before you move up a stage, and before you go live.</p>';
    h += '<h2>The maturity ladder</h2><p style="max-width:62ch">Most failed AI projects skipped a stage. Each stage has a different goal, and each has things you should not do yet.</p><div class="ladder">';
    A.ladder.forEach(function (s, i) {
      h += '<div class="rung"><div class="rn">' + (i + 1) + '</div><h3>' + esc(s.stage) + '</h3><div class="mini">' + esc(s.time) + '</div><p>' + esc(s.goal) + '</p>' +
        '<h4>Exit when</h4>' + ul(s.exit) + '<h4 class="no">Not yet</h4><p class="nope">' + s.skip.map(esc).join(' · ') + '</p></div>';
    });
    h += '</div><h2>Production readiness</h2>' +
      '<div class="ready-bar"><div class="seg" role="group" aria-label="Filter checklist" id="rdFilter">' +
      '<button type="button" data-f="all" aria-pressed="true">All</button><button type="button" data-f="agent" aria-pressed="false">Agentic</button><button type="button" data-f="ml" aria-pressed="false">Classic ML</button></div>' +
      '<div class="prog" aria-live="polite"><div class="track"><div class="fill" id="rdFill"></div></div><span id="rdNum"></span></div></div><div id="rdList"></div>' +
      '<div class="btns" style="margin-top:16px"><button class="btn" type="button" id="rdCopy">Copy open items as markdown</button><button class="btn" type="button" id="rdReset">Reset</button></div>';
    h += '<h2>Decision record template</h2><div class="codebar"><button class="btn" type="button" id="adrCopy">Copy template</button></div><pre class="adr" tabindex="0">' + esc(A.adrTemplate) + '</pre>';
    afterRender = mountChecklists;
    return h;
  }
  function mountChecklists() {
    var state = loadReady(), filter = 'all', list = $('#rdList');
    function visible(it) { return filter === 'all' || it.kind === 'both' || it.kind === filter; }
    function paint() {
      var total = 0, done = 0, h = '';
      A.readiness.forEach(function (g) {
        var items = g.items.filter(visible); if (!items.length) return;
        h += '<h3>' + esc(g.name) + '</h3><ul class="chklist">';
        items.forEach(function (it) {
          total++; if (state[it.id]) done++;
          h += '<li><label class="chk"><input type="checkbox" data-id="' + it.id + '"' + (state[it.id] ? ' checked' : '') + '><span><span class="t">' + fmt(it.t) + '</span>' +
            '<span class="w">' + esc(it.why) + '</span></span></label></li>';
        });
        h += '</ul>';
      });
      list.innerHTML = h;
      $('#rdNum').textContent = done + ' of ' + total;
      $('#rdFill').style.width = (total ? Math.round(done / total * 100) : 0) + '%';
    }
    list.addEventListener('change', function (e) {
      var id = e.target.getAttribute('data-id'); if (!id) return;
      if (e.target.checked) state[id] = 1; else delete state[id];
      saveReady(state);
      paint();
    });
    $('#rdFilter').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-f]'); if (!b) return; filter = b.getAttribute('data-f');
      $$('#rdFilter button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      paint();
    });
    $('#rdReset').addEventListener('click', function () { state = {}; saveReady(state); paint(); });
    $('#rdCopy').addEventListener('click', function () {
      var L = ['# Production readiness: open items', ''];
      A.readiness.forEach(function (g) {
        var open = g.items.filter(function (it) { return visible(it) && !state[it.id]; }); if (!open.length) return;
        L.push('## ' + g.name); open.forEach(function (it) { L.push('- [ ] ' + plain(it.t)); }); L.push('');
      });
      copyText(L.join('\\n'), this);
    });
    $('#adrCopy').addEventListener('click', function () { copyText(A.adrTemplate, this); });
    paint();
  }

  /* ----- cost calculator ----- */
  var CALC_DEFAULTS = { req: 20000, inTok: 3000, outTok: 500, pIn: 3, pOut: 15, calls: 1, success: 85, sem: 0, cacheFrac: 0, cacheDisc: 90, batchShare: 0, batchDisc: 50, infra: 0.0005 };
  var CALC_FIELDS = [
    ['Traffic and task shape', [
      ['req', 'Tasks per day', '', 'A task is one user request that your system completes.'],
      ['calls', 'Model calls per task', '', 'Agents often make 3 to 10. A plain chat answer makes 1.'],
      ['inTok', 'Input tokens per call', '', 'System prompt, history, retrieved passages and tool results all count.'],
      ['outTok', 'Output tokens per call', '', 'Reasoning tokens usually bill as output.'],
      ['success', 'Tasks completed successfully', '%', 'Failures still cost money. Measure this with your evals.']]],
    ['Prices (example values: replace with current pricing)', [
      ['pIn', 'Input price per 1M tokens', '$', 'Take this from the pricing page for your model.'],
      ['pOut', 'Output price per 1M tokens', '$', 'Output is typically several times the input price.'],
      ['infra', 'Other cost per task', '$', 'Retrieval, gateway, storage, orchestration, logging.']]],
    ['Levers', [
      ['sem', 'Answered from semantic cache', '%', 'Share of tasks that skip the model entirely.'],
      ['cacheFrac', 'Input tokens served from prompt cache', '%', 'Stable prefixes such as system prompts and shared documents.'],
      ['cacheDisc', 'Prompt-cache discount', '%', 'Cached input is billed at a reduced rate.'],
      ['batchShare', 'Share of calls sent to batch', '%', 'Only for work that can wait.'],
      ['batchDisc', 'Batch discount', '%', 'Confirm the current discount for your model.']]]
  ];
  function calcCost(p) {
    var bf = 1 - p.batchShare / 100 * p.batchDisc / 100, keep = 1 - p.sem / 100;
    var inC = p.inTok / 1e6 * p.pIn * (1 - p.cacheFrac / 100 * p.cacheDisc / 100) * bf * p.calls * keep;
    var outC = p.outTok / 1e6 * p.pOut * bf * p.calls * keep;
    var task = inC + outC + p.infra;
    return { inC: inC, outC: outC, infra: p.infra, task: task, ok: p.success > 0 ? task / (p.success / 100) : Infinity, month: task * p.req * 30 };
  }
  function pageCalculator() {
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/d">Decisions</a> / Tool</div><h1>Cost per task</h1>' +
      '<p class="lede">Unit economics for an LLM feature, and which levers move them.</p>' +
      '<div class="wide"><div class="calc"><form id="calcForm" class="calcform" onsubmit="return false">';
    CALC_FIELDS.forEach(function (g) {
      h += '<fieldset><legend>' + esc(g[0]) + '</legend>';
      g[1].forEach(function (f) {
        h += '<label class="num"><span class="nl2">' + esc(f[1]) + '</span><span class="inp">' + (f[2] === '$' ? '<i>$</i>' : '') +
          '<input type="number" inputmode="decimal" min="0" step="any" name="' + f[0] + '" aria-describedby="h-' + f[0] + '">' + (f[2] === '%' ? '<i>%</i>' : '') + '</span><small id="h-' + f[0] + '">' + esc(f[3]) + '</small></label>';
      });
      h += '</fieldset>';
    });
    h += '<button class="btn" type="button" id="calcReset">Reset to defaults</button></form><div id="calcOut" class="calcout" aria-live="polite"></div></div></div>';
    afterRender = mountCalculator;
    return h;
  }
  function mountCalculator() {
    var form = $('#calcForm'), out = $('#calcOut'), p = {}, k;
    function fill() { for (k in CALC_DEFAULTS) { p[k] = CALC_DEFAULTS[k]; form.elements[k].value = CALC_DEFAULTS[k]; } }
    function read() {
      for (k in CALC_DEFAULTS) {
        var v = parseFloat(form.elements[k].value); if (!isFinite(v) || v < 0) v = 0;
        if (/^(success|sem|cacheFrac|cacheDisc|batchShare|batchDisc)$/.test(k)) v = Math.min(100, v);
        p[k] = v;
      }
      if (p.calls < 1) p.calls = 1;
    }
    function clone() { var o = {}; for (var x in p) o[x] = p[x]; return o; }
    function paint() {
      var c = calcCost(p), tot = c.inC + c.outC + c.infra || 1;
      var h = '<div class="eyebrow">Result</div><div class="kpis">' +
        '<div class="kpi"><small>Per task</small><b>' + money(c.task) + '</b></div>' +
        '<div class="kpi"><small>Per successful task</small><b>' + money(c.ok) + '</b></div>' +
        '<div class="kpi"><small>Per month (30 days)</small><b>' + money(c.month) + '</b></div>' +
        '<div class="kpi"><small>At 10x volume</small><b>' + money(c.month * 10) + '</b></div></div>';
      h += '<h3>Where the money goes</h3><div class="split" role="img" aria-label="Cost split">' +
        '<span style="width:' + (c.inC / tot * 100) + '%" class="s1"></span><span style="width:' + (c.outC / tot * 100) + '%" class="s2"></span><span style="width:' + (c.infra / tot * 100) + '%" class="s3"></span></div>' +
        '<ul class="legend"><li><i class="s1"></i>Input tokens ' + money(c.inC) + '</li><li><i class="s2"></i>Output tokens ' + money(c.outC) + '</li><li><i class="s3"></i>Other ' + money(c.infra) + '</li></ul>';
      out.innerHTML = h;
    }
    fill();
    form.addEventListener('input', function () { read(); paint(); });
    $('#calcReset').addEventListener('click', function () { fill(); paint(); });
    read(); paint();
  }

  /* ==========================================================================
     PAGE 15: PLAYBOOKS (#/p and #/p/:id)
     ========================================================================== */
  function pagePlaybooksIndex() {
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Playbooks</div>' +
      '<h1>AI Engineering Playbooks</h1>' +
      '<p class="lede">Comprehensive engineering playbooks for engineering leaders and principal architects designing, hardening, and operating generative AI systems on AWS.</p>' +
      '<div class="grid">';
    A.engineeringPlaybooks.forEach(function (p) {
      h += '<a class="card" style="--h:25" href="#/p/' + p.id + '">' +
        '<div class="mini">' + esc(p.badge) + '</div>' +
        '<h3>' + esc(p.title) + '</h3>' +
        '<p>' + esc(p.tag) + '</p>' +
        '</a>';
    });
    h += '</div>';
    return h;
  }

  function pagePlaybook(id) {
    var pb = A.engineeringPlaybooks.find(function (p) { return p.id === id; });
    if (!pb) return notFound();
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / <a href="#/p">Playbooks</a></div>' +
      '<h1>' + esc(pb.title) + '</h1>' +
      '<div style="margin:8px 0 16px"><span class="chip" style="--h:25">' + esc(pb.badge) + '</span></div>' +
      '<p class="lede">' + esc(pb.tag) + '</p>' +
      '<div class="callout"><b>Playbook Scope & Context</b>' + fmt(pb.intro) + '</div>';

    (pb.sections || []).forEach(function (sec) {
      h += '<h2>' + esc(sec.title) + '</h2>';
      if (sec.body) h += paras(sec.body);
      if (sec.bullets && sec.bullets.length) h += ul(sec.bullets);
      if (sec.tips && sec.tips.length) {
        h += '<div class="box warn" style="margin-top:14px"><h3>Engineering Rules & Best Practices</h3>' + ul(sec.tips) + '</div>';
      }
    });

    // Check for Workload Release Gates
    var gateKey = pb.id.indexOf('rag') > -1 ? 'rag' : (pb.id.indexOf('multi-agent') > -1 ? 'agent' : (pb.id.indexOf('genaiops') > -1 ? 'ml' : null));
    if (gateKey && A.workloadGates && A.workloadGates[gateKey]) {
      h += '<h2>Workload-Specific Production Release Gates</h2>' +
        '<p style="max-width:68ch">Mandatory exit criteria before this architecture can be promoted from pilot to general production.</p>' +
        '<div class="tablewrap"><table class="matrix-table"><thead><tr>' +
        '<th>Gate ID</th><th>Quality Requirement</th><th>Threshold Target</th><th>Blocking Level</th><th>Verification Tooling</th>' +
        '</tr></thead><tbody>' +
        A.workloadGates[gateKey].map(function (g) {
          return '<tr>' +
            '<td><code>' + esc(g.id) + '</code></td>' +
            '<td><b>' + esc(g.gate) + '</b></td>' +
            '<td>' + esc(g.threshold) + '</td>' +
            '<td><span class="severity-pill ' + (g.blocking === 'Hard Block' ? 'critical' : 'medium') + '">' + esc(g.blocking) + '</span></td>' +
            '<td><small>' + esc(g.tooling) + '</small></td>' +
          '</tr>';
        }).join('') +
        '</tbody></table></div>';
    }

    if (pb.see && pb.see.length) {
      h += '<h2>Connected Architectures & Decisions</h2><div class="pairs">' +
        pb.see.map(function (r) {
          var p = r.split(':');
          if (p[0] === 'arch' && archById[p[1]]) return '<a href="#/a/' + p[1] + '">📐 ' + esc(archById[p[1]].name) + '</a>';
          if (p[0] === 'dec' && decById[p[1]]) return '<a href="#/d/' + p[1] + '">⚖️ ' + esc(decById[p[1]].title) + '</a>';
          if (p[0] === 'svc' && byId[p[1]]) return '<a href="#/s/' + p[1] + '">📦 ' + esc(byId[p[1]].name) + '</a>';
          return '';
        }).filter(Boolean).join('') + '</div>';
    }

    var pi = A.engineeringPlaybooks.indexOf(pb);
    var prevP = A.engineeringPlaybooks[pi - 1], nextP = A.engineeringPlaybooks[pi + 1];
    h += '<div class="pn">' +
      (prevP ? '<a href="#/p/' + prevP.id + '"><small>← Previous Playbook</small>' + esc(prevP.title) + '</a>' : '<span></span>') +
      (nextP ? '<a href="#/p/' + nextP.id + '"><small>Next Playbook →</small>' + esc(nextP.title) + '</a>' : '') +
      '</div>';

    return h;
  }

  /* ==========================================================================
     PAGE 16: LABS & ROADMAPS (#/labs)
     ========================================================================== */
  function pageLabs() {
    var l = A.labs;
    var h = '<div class="eyebrow"><a href="#/">Atlas</a> / Labs & Roadmaps</div>' +
      '<h1>' + esc(l.title) + '</h1>' +
      '<p class="lede">' + fmt(l.lede) + '</p>';

    h += '<h2>Role-Based Progressive Learning Roadmaps</h2>' +
      '<div class="roadmap-grid">';
    l.learningPaths.forEach(function (path) {
      h += '<div class="roadmap-card">' +
        '<div class="mini">' + esc(path.duration) + '</div>' +
        '<h3>' + esc(path.role) + '</h3>' +
        '<p style="color:var(--muted);font-size:13px">' + fmt(path.objective) + '</p>' +
        '<ul style="margin:12px 0 0;padding-left:18px;font-size:13px">' +
        path.modules.map(function (m) {
          return '<li style="margin:6px 0"><b>' + esc(m.week) + ':</b> ' + fmt(m.topics) + '</li>';
        }).join('') +
        '</ul>' +
      '</div>';
    });
    h += '</div>';

    h += '<h2>Hands-on Production Labs (5 Exercises)</h2>' +
      '<p style="max-width:62ch">Step-by-step practical implementation exercises for engineering teams using the AWS Management Console, CLI, and SDKs.</p>';
    l.exercises.forEach(function (ex) {
      h += '<div class="lab-card">' +
        '<div class="lab-header">' +
          '<span class="lab-level">' + esc(ex.level) + '</span>' +
          '<span class="lab-time">⏱ ' + esc(ex.time) + '</span>' +
        '</div>' +
        '<h3>' + esc(ex.title) + '</h3>' +
        '<p style="color:var(--muted)"><b>Lab Goal:</b> ' + fmt(ex.goal) + '</p>' +
        '<h4>Step-by-Step Instructions:</h4>' +
        '<ol class="lab-steps">' +
        ex.steps.map(function (st) { return '<li>' + fmt(st) + '</li>'; }).join('') +
        '</ol>' +
      '</div>';
    });

    h += '<h2>Official AWS Architecture Resources</h2>' +
      '<div class="grid" style="margin:16px 0">';
    l.officialResources.forEach(function (res) {
      h += '<div class="card" style="--h:25">' +
        '<div class="mini">Documentation Hub</div>' +
        '<h3>' + esc(res.title) + '</h3>' +
        '<p>' + fmt(res.desc) + '</p>' +
        '<div style="margin-top:12px"><a href="' + esc(res.url) + '" target="_blank" rel="noopener">Open in AWS Documentation ↗</a></div>' +
      '</div>';
    });
    h += '</div>';

    return h;
  }

  function notFound() { return '<h1>Not found</h1><p class="lede">That page does not exist. <a href="#/">Back to the Command Centre</a>.</p>'; }

  /* ==========================================================================
     SIDEBAR NAVIGATION
     ========================================================================== */
  function nl(href, label, cur) { return '<a class="nl" href="' + href + '"' + (cur ? ' aria-current="page"' : '') + '>' + label + '</a>'; }
  function renderSide(kind, id) {
    var cur = kind === 's' && byId[id] ? byId[id].cat : (kind === 'c' ? id : null);
    var curTheme = kind === 'd' && decById[id] ? decById[id].theme : null;

    var h = (A.sidebarExtra ? A.sidebarExtra(kind, id) : '') + '<h3>Command & Operations</h3>' +
      nl('#/', 'Command Centre', !kind || kind === 'command') +
      nl('#/delivery', 'AI Project Lifecycle (12)', kind === 'delivery') +
      nl('#/arch-review', 'Architecture Review Board', kind === 'arch-review') +
      nl('#/selector', 'Service Selector Matrix', kind === 'selector') +
      nl('#/models', 'Model Registry (16)', kind === 'models') +
      nl('#/eval', 'Eval & Quality Engineering', kind === 'eval') +
      nl('#/finops', 'FinOps & Unit Economics', kind === 'finops') +
      nl('#/ops', 'Production SRE & Ops', kind === 'ops') +
      nl('#/gov', 'Security & Compliance', kind === 'gov') +
      nl('#/leadership', 'Leadership & Workforce', kind === 'leadership') +
      nl('#/toolkit', 'Manager Templates (22)', kind === 'toolkit');

    h += '<h3>Architecture & Decisions</h3>' +
      nl('#/a', 'Reference Architectures (' + A.architectures.length + ')', kind === 'a' && !id) +
      nl('#/d', 'Decision Centre (' + A.decisions.length + ')', kind === 'd' && !id) +
      nl('#/p', 'Engineering Playbooks (' + A.engineeringPlaybooks.length + ')', kind === 'p' && !id) +
      nl('#/services', 'Services Catalogue (' + A.services.length + ')', kind === 'services' || (kind === 'c' && !id)) +
      nl('#/labs', 'Labs & Roadmaps', kind === 'labs');

    h += '<h3>Decisions & Tools</h3>' +
      nl('#/d/em', 'For engineering managers', kind === 'd' && id === 'em') +
      nl('#/d/pe', 'For principal engineers', kind === 'd' && id === 'pe') +
      nl('#/d/shaper', 'Solution shaper', kind === 'd' && id === 'shaper') +
      nl('#/d/checklists', 'Readiness checklists', kind === 'd' && id === 'checklists') +
      nl('#/d/calculator', 'Cost per task', kind === 'd' && id === 'calculator');

    A.decisionThemes.forEach(function (t) {
      var list = A.decisions.filter(function (d) { return d.theme === t.id; });
      h += '<details' + (curTheme === t.id ? ' open' : '') + '><summary style="--h:' + THEME_HUE[t.id] + '"><span class="dot"></span><span style="flex:1">' + esc(t.name) + '</span><span class="n">' + list.length + '</span></summary><ul>' +
        list.map(function (d) { return '<li><a href="#/d/' + d.id + '"' + (kind === 'd' && id === d.id ? ' aria-current="page"' : '') + '>' + esc(d.title) + '</a></li>'; }).join('') + '</ul></details>';
    });

    h += '<h3>Architectures (' + A.architectures.length + ')</h3>';
    h += '<details' + (kind === 'a' && id ? ' open' : '') + '><summary style="--h:25"><span class="dot"></span><span>All Architectures</span><span class="n">' + A.architectures.length + '</span></summary><ul>' +
      A.architectures.map(function (a) { return '<li><a href="#/a/' + a.id + '"' + (kind === 'a' && id === a.id ? ' aria-current="page"' : '') + '>' + esc(a.name) + '</a></li>'; }).join('') + '</ul></details>';

    h += '<h3>Services by Category (' + A.services.length + ')</h3>';
    A.categories.forEach(function (c) {
      h += '<details' + (cur === c.id ? ' open' : '') + '><summary style="--h:' + c.hue + '"><span class="dot"></span><a href="#/c/' + c.id + '"' + (kind === 'c' && id === c.id ? ' aria-current="page"' : '') + '>' + esc(c.name) + '</a><span class="n">' + c.items.length + '</span></summary><ul>' +
        c.items.map(function (s) { return '<li><a href="#/s/' + s.id + '"' + (kind === 's' && id === s.id ? ' aria-current="page"' : '') + '>' + esc(s.name) + '</a></li>'; }).join('') + '</ul></details>';
    });
    $('#side').innerHTML = h;
  }

  /* ==========================================================================
     ROUTER & SEARCH
     ========================================================================== */
  /* Extension points for the workspace modules (assets/ui/*.js): they register A.routes, A.sidebarExtra and A.searchEntries. */
  A.legacy = { pageCommandCentre: pageCommandCentre, notFound: notFound };
  A.rerender = function () { render(); };
  function render() {
    $$('.stepper').forEach(function (el) { if (el._stop) el._stop(); });
    var rawHash = location.hash.replace(/^#\\/?/, ''), qpos = rawHash.indexOf('?');
    var query = qpos > -1 ? rawHash.slice(qpos + 1) : '';
    var parts = (qpos > -1 ? rawHash.slice(0, qpos) : rawHash).split('/'), kind = parts[0] || '', id = parts[1] || '';
    pendingSteppers = []; afterRender = null;
    var html, title = 'AWS AI Atlas — AI Engineering Management Operating System';

    var ext = A.routes && A.routes[kind || 'command'];
    if (ext) {
      var out = ext.render(parts.slice(1), query);
      html = out.html; title = out.title || title;
      if (out.mount) afterRender = function () { out.mount($('#main')); };
    }
    else if (kind === '' || kind === 'command') {
      html = pageCommandCentre();
      title = 'AI Engineering Manager Command Centre — AWS AI Atlas';
    }
    else if (kind === 'services') {
      html = pageServicesCatalog(id);
      title = 'AWS AI & Data Services Catalogue — AWS AI Atlas';
    }
    else if (kind === 'delivery') {
      html = pageDelivery();
      title = 'AI Project Delivery Lifecycle Centre — AWS AI Atlas';
    }
    else if (kind === 'arch-review') {
      html = pageArchReview();
      title = 'Enterprise AI Architecture Review System — AWS AI Atlas';
    }
    else if (kind === 'selector') {
      html = pageSelector();
      title = 'AWS AI Service Selection Matrix — AWS AI Atlas';
    }
    else if (kind === 'models') {
      html = pageModels();
      title = 'Enterprise Model Registry & Lifecycle — AWS AI Atlas';
    }
    else if (kind === 'eval') {
      html = pageEval();
      title = 'AI Evaluation & Quality Engineering Centre — AWS AI Atlas';
    }
    else if (kind === 'finops') {
      html = pageFinOps();
      title = 'AI FinOps & Unit Economics — AWS AI Atlas';
    }
    else if (kind === 'ops') {
      html = pageOperations();
      title = 'Production AI Operations & SRE — AWS AI Atlas';
    }
    else if (kind === 'gov') {
      html = pageGovernance();
      title = 'Enterprise AI Security & Governance — AWS AI Atlas';
    }
    else if (kind === 'leadership') {
      html = pageLeadership();
      title = 'AI Engineering Leadership & Technical Debt — AWS AI Atlas';
    }
    else if (kind === 'toolkit') {
      html = pageToolkit();
      title = 'AI Engineering Manager Toolkit & Templates — AWS AI Atlas';
    }
    else if (kind === 'labs') {
      html = pageLabs();
      title = 'Hands-on Labs & Learning Roadmaps — AWS AI Atlas';
    }
    else if (kind === 's' && byId[id]) {
      html = pageService(id);
      title = byId[id].name + ' — AWS AI Atlas';
    }
    else if (kind === 'c' && catById[id]) {
      html = pageCategory(id);
      title = catById[id].name + ' — AWS AI Atlas';
    }
    else if (kind === 'a') {
      if (id && archById[id]) { html = pageArch(id); title = archById[id].name + ' — AWS AI Atlas'; }
      else { html = pageArchIndex(); title = 'Reference Architectures — AWS AI Atlas'; }
    }
    else if (kind === 'd') {
      var TOOLS = { shaper: ['Solution shaper', pageShaper], checklists: ['Readiness checklists', pageChecklists], calculator: ['Cost per task', pageCalculator] };
      if (!id || id === 'em' || id === 'pe' || id === 'all') { html = pageDecisionHub(id); title = (id === 'em' ? 'Decisions for engineering managers' : id === 'pe' ? 'Decisions for principal engineers' : 'Decision guides') + ' — AWS AI Atlas'; }
      else if (TOOLS[id]) { html = TOOLS[id][1](); title = TOOLS[id][0] + ' — AWS AI Atlas'; }
      else if (decById[id]) { html = pageDecision(id); title = decById[id].title + ' — AWS AI Atlas'; }
      else html = notFound();
    }
    else if (kind === 'p') {
      if (id) {
        var pb = A.engineeringPlaybooks.find(function (p) { return p.id === id; });
        if (pb) { html = pagePlaybook(id); title = pb.title + ' — AWS AI Atlas'; }
        else html = notFound();
      } else {
        html = pagePlaybooksIndex();
        title = 'AI Engineering Playbooks — AWS AI Atlas';
      }
    }
    else html = notFound();
    if (A.contentNotice && html.indexOf('<h1>Not found') !== 0) html = A.contentNotice(kind, id) + html;

    var main = $('#main'); main.innerHTML = html;
    pendingSteppers.forEach(function (spec, i) { mountStepper($('[data-sp="' + i + '"]', main), spec); });
    if (afterRender) afterRender();
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
    return { type: 'Architecture', href: '#/a/' + a.id, name: a.name, id: a.id, tag: a.short, cat: 'Architecture', hay: (a.name + ' ' + a.short + ' ' + (a.why || []).join(' ')).toLowerCase() };
  })).concat(A.decisions.map(function (d) {
    return { type: 'Decision', href: '#/d/' + d.id, name: d.title, id: d.id, tag: d.question, cat: 'Decision guide',
      hay: plain([d.title, d.question, d.why, d.em.call, d.pe.call, d.redflags.join(' '), d.ask.join(' '), d.rules.map(function (r) { return r.join(' '); }).join(' ')].join(' ')).toLowerCase() };
  })).concat(A.engineeringPlaybooks.map(function (p) {
    return { type: 'Playbook', href: '#/p/' + p.id, name: p.title, id: p.id, tag: p.tag, cat: 'Playbook',
      hay: (p.title + ' ' + p.tag + ' ' + p.intro + ' ' + p.sections.map(function (s) { return s.title + ' ' + (s.body || '') + ' ' + (s.bullets ? s.bullets.join(' ') : ''); }).join(' ')).toLowerCase() };
  })).concat(A.toolkit.templates.map(function (t) {
    return { type: 'Template', href: '#/toolkit', name: t.title, id: t.id, tag: t.description, cat: 'Manager Template', hay: (t.title + ' ' + t.description).toLowerCase() };
  })).concat(A.selector.workloads.map(function (w) {
    return { type: 'Selector', href: '#/selector', name: w.title, id: w.id, tag: w.keyDecision, cat: 'Service Selector (' + w.workloadProfile + ')', hay: (w.title + ' ' + w.workloadProfile + ' ' + w.keyDecision + ' ' + w.recommended.service).toLowerCase() };
  })).concat(A.models.registry.map(function (m) {
    return { type: 'Model', href: '#/models', name: m.name, id: m.id, tag: m.useCase, cat: 'Model Registry (' + m.provider + ')', hay: (m.name + ' ' + m.id + ' ' + m.provider + ' ' + m.useCase).toLowerCase() };
  })).concat([
    { type: 'Workspace', href: '#/', name: 'Command Centre', id: 'command', tag: 'Executive portfolio health, attention items, decisions today, daily schedule', cat: 'Command Centre', hay: 'command centre portfolio kpi attention decisions schedule' },
    { type: 'Workspace', href: '#/delivery', name: 'AI Project Delivery Lifecycle', id: 'delivery', tag: '12 phases from discovery to decommission, 12 active squad initiatives', cat: 'Lifecycle Centre', hay: 'delivery lifecycle phases portfolio roadmap projects gates' },
    { type: 'Workspace', href: '#/arch-review', name: 'Architecture Review Board (ARB)', id: 'arch-review', tag: '12 review dimensions, risk calculator, systemic risk view across squads', cat: 'Governance', hay: 'arb architecture review risk scoring likelihood impact dimensions' },
    { type: 'Workspace', href: '#/selector', name: 'AWS AI Service Selection Matrix', id: 'selector', tag: '14 workloads with recommended services and rejection reasons', cat: 'Decision Tool', hay: 'selector service matrix workloads rag agent batch bedrock sagemaker' },
    { type: 'Workspace', href: '#/models', name: 'Enterprise Model Registry', id: 'models', tag: '16 foundation models, token economics, latency, promotion policy', cat: 'Model Platform', hay: 'models registry claude bedrock nova llama titan lifecycle promotion' },
    { type: 'Workspace', href: '#/eval', name: 'AI Evaluation & Quality Engineering', id: 'eval', tag: '13 evaluation layers, 28 metrics dictionary, 12 release gates', cat: 'Quality Engineering', hay: 'eval evaluation metrics quality gates golden dataset testing ragas' },
    { type: 'Workspace', href: '#/finops', name: 'AI FinOps & Unit Economics', id: 'finops', tag: 'Cost per task, 17 cost tiers, 5 scenarios, 17 cost levers, approval gates', cat: 'FinOps', hay: 'finops budget unit economics cost per task calculator pricing levers' },
    { type: 'Workspace', href: '#/ops', name: 'Production AI Operations & SRE', id: 'ops', tag: '12 reliability principles, SLO error budgets, 14 chaos drills, dashboards', cat: 'Operations', hay: 'ops sre reliability chaos drills runbooks cloudwatch latency errors' },
    { type: 'Workspace', href: '#/gov', name: 'Security, Governance & Compliance', id: 'gov', tag: 'Control Tower landing zones, NIST AI RMF, ISO 42001, EU AI Act, DPDP Act', cat: 'Security & Governance', hay: 'governance security compliance nist iso eu ai act dpdp scp landing zone' },
    { type: 'Workspace', href: '#/leadership', name: 'Leadership & Technical Debt', id: 'leadership', tag: '10-domain competency matrix, productivity metrics, 13 tech debts', cat: 'Leadership', hay: 'leadership workforce skills matrix technical debt maturity competency' },
    { type: 'Workspace', href: '#/toolkit', name: 'Manager Toolkit & 22 Templates', id: 'toolkit', tag: 'RACI, RAID, use case assessment, 22 copyable markdown templates', cat: 'Toolkit', hay: 'toolkit templates raci raid estimation evaluation postmortem adr' },
    { type: 'Workspace', href: '#/labs', name: 'Hands-on Labs & Roadmaps', id: 'labs', tag: 'Role roadmaps, 5 implementation labs, AWS Architecture links', cat: 'Labs', hay: 'labs exercises tutorial roadmaps learn curriculum hands-on' }
  ]);

  function openSearch() { overlay.hidden = false; q.value = ''; runSearch(); q.focus(); }
  function closeSearch() { overlay.hidden = true; }
  function runSearch() {
    var terms = q.value.toLowerCase().split(/\\s+/).filter(Boolean);
    hits = index.concat(A.searchEntries ? A.searchEntries() : []).map(function (it) {
      var score = 0, ok = true;
      terms.forEach(function (t) {
        var nm = it.name.toLowerCase(), s = 0;
        if (nm.indexOf(t) === 0) s = 100; else if (nm.indexOf(t) > -1) s = 70; else if (it.id.indexOf(t) > -1) s = 55;
        else if (it.tag.toLowerCase().indexOf(t) > -1) s = 30; else if (it.hay.indexOf(t) > -1) s = 10;
        if (!s) ok = false; score += s;
      });
      return { it: it, score: terms.length ? (ok ? score : 0) : 1 };
    }).filter(function (h) { return h.score > 0; }).sort(function (a, b) { return b.score - a.score || a.it.name.localeCompare(b.it.name); }).slice(0, 14);
    sel = 0; paint();
  }
  function paint() {
    resultsEl.innerHTML = hits.length ? hits.map(function (h, i) {
      return '<li role="option"><a href="' + h.it.href + '" class="' + (i === sel ? 'sel' : '') + '"><b>' + esc(h.it.name) + ' <small style="font-weight:400;color:var(--muted)">· ' + esc(h.it.cat) + '</small></b><span>' + esc(h.it.tag) + '</span></a></li>';
    }).join('') : '<li class="none">No matches. Try a service, model, template, or keyword like “eval”, “risk”, or “budget”.</li>';
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
`;

fs.writeFileSync(appJsPath, appContent, 'utf8');
console.log("Successfully wrote assets/app.js:", appContent.length, "bytes");
