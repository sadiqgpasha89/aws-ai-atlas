/* Shared UI helpers and the active workspace (personal or sample). Plain DOM, no dependencies.
   Every user-authored string is escaped with esc() before it reaches innerHTML. */
(function () {
  'use strict';
  var A = window.ATLAS, L = A.lib;
  var MODE_KEY = 'aws-ai-atlas:mode';

  /* ---------- workspaces ---------- */
  var lsAdapter = L.store.localStorageAdapter();
  var personal = L.store.createStore({ adapter: lsAdapter || L.store.memoryAdapter(), label: 'personal' });
  if (!lsAdapter) { personal.status.persistent = false; personal.status.error = 'Browser storage is unavailable (private mode or blocked), so your changes will last only until you close this tab. Use Export to keep a copy.'; }
  var sample = null, fallbackMode = 'personal';

  function getMode() {
    try { return sessionStorage.getItem(MODE_KEY) === 'sample' ? 'sample' : 'personal'; } catch (e) { return fallbackMode; }
  }
  function setMode(m) {
    fallbackMode = m;
    try { sessionStorage.setItem(MODE_KEY, m); } catch (e) { /* session only */ }
  }
  function sampleStore() {
    if (!sample) sample = L.store.createSampleStore(A.demo.build(L.rules.todayISO()));
    return sample;
  }
  var ws = {
    mode: getMode,
    isSample: function () { return getMode() === 'sample'; },
    store: function () { return getMode() === 'sample' ? sampleStore() : personal; },
    personal: personal,
    setMode: function (m) { setMode(m); if (m === 'sample') sample = null; /* fresh sample each time */ },
    today: function () { return L.rules.todayISO(); }
  };

  /* ---------- text and html ---------- */
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }
  function parseQuery(qs) {
    var out = {};
    String(qs || '').split('&').forEach(function (kv) {
      if (!kv) return; var i = kv.indexOf('='), k = i < 0 ? kv : kv.slice(0, i), v = i < 0 ? '' : kv.slice(i + 1);
      try { out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) { /* ignore malformed pair */ }
    });
    return out;
  }
  function buildQuery(o) {
    var p = []; Object.keys(o).forEach(function (k) { if (o[k] !== '' && o[k] !== undefined && o[k] !== null) p.push(encodeURIComponent(k) + '=' + encodeURIComponent(o[k])); });
    return p.length ? '?' + p.join('&') : '';
  }
  function num(n, d) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    return Number(n).toLocaleString('en-US', { maximumFractionDigits: d === undefined ? 2 : d });
  }
  function money(n, cur, d) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    var abs = Math.abs(n), dec = d !== undefined ? d : (abs >= 100 ? 0 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6);
    return (cur ? cur + ' ' : '') + num(n, dec);
  }
  function pct(n, d) { return n === null || n === undefined || !isFinite(n) ? '—' : num(n, d === undefined ? 1 : d) + '%'; }
  function fmtDate(s) { return s || '—'; }

  /* ---------- status badges: text AND symbol, never colour alone ---------- */
  var BADGE = { Healthy: ['✓', 'ok'], 'At Risk': ['▲', 'warn'], Blocked: ['■', 'bad'], Critical: ['✖', 'bad'],
    Critical_: ['✖', 'bad'], High: ['▲', 'bad'], Medium: ['◆', 'warn'], Low: ['●', 'ok'], Open: ['○', 'warn'], Mitigating: ['◐', 'warn'], Accepted: ['◑', 'ok'], Closed: ['●', 'ok'],
    Proposed: ['○', 'warn'], Approved: ['✓', 'ok'], Rejected: ['✖', 'bad'], Superseded: ['–', 'muted'], 'In progress': ['◐', 'warn'], Done: ['✓', 'ok'], Cancelled: ['–', 'muted'],
    Proceed: ['✓', 'ok'], Defer: ['⏸', 'warn'], Redesign: ['↺', 'warn'], Reject: ['✖', 'bad'], Incomplete: ['…', 'muted'] };
  function badge(text, titleText) {
    var b = BADGE[text] || ['•', 'muted'];
    return '<span class="wbadge ' + b[1] + '"' + (titleText ? ' title="' + esc(titleText) + '"' : '') + '><span aria-hidden="true">' + b[0] + '</span> ' + esc(text) + '</span>';
  }

  /* ---------- live region and notices ---------- */
  var live = null;
  function announce(msg) {
    if (!live) { live = document.createElement('div'); live.className = 'sr-only'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); document.body.appendChild(live); }
    live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30);
  }
  function banner() {
    var st = ws.store(), h = '';
    if (ws.isSample()) {
      h += '<div class="wbanner sample" role="note"><b>SAMPLE DATA.</b> Every record on this page is fictional and held in memory only. Nothing is saved to your browser. ' +
        '<a href="#/workspace">Switch to your own workspace</a></div>';
    } else {
      if (st.status.error) h += '<div class="wbanner warn" role="alert"><b>Storage problem.</b> ' + esc(st.status.error) + ' <a href="#/workspace">Open workspace settings</a></div>';
      if (st.status.notice) h += '<div class="wbanner info" role="status">' + esc(st.status.notice) + '</div>';
    }
    return h;
  }

  /* ---------- sub navigation (link based, so every tab has a URL) ---------- */
  function subnav(label, items, current) {
    return '<nav class="wsubnav" aria-label="' + esc(label) + '">' + items.map(function (it) {
      return '<a href="' + it[0] + '"' + (it[2] === current ? ' aria-current="page"' : '') + '>' + esc(it[1]) + '</a>';
    }).join('') + '</nav>';
  }
  var PORTFOLIO_NAV = [['#/portfolio', 'Initiatives', 'list'], ['#/portfolio/prioritise', 'Prioritisation', 'prioritise'], ['#/portfolio/new', 'New initiative', 'new']];
  var REGISTER_NAV = [['#/registers/risks', 'Risks', 'risks'], ['#/registers/decisions', 'Decisions', 'decisions'], ['#/registers/actions', 'Actions', 'actions']];

  /* ---------- forms ---------- */
  function field(id, label, control, o) {
    o = o || {};
    return '<div class="wfield' + (o.wide ? ' wide' : '') + '"><label for="' + id + '">' + esc(label) + (o.req ? ' <span class="req" aria-hidden="true">*</span><span class="sr-only"> (required)</span>' : '') + '</label>' +
      control + (o.help ? '<small id="' + id + '-help">' + esc(o.help) + '</small>' : '') + '<div class="werr" id="' + id + '-err" hidden></div></div>';
  }
  function input(id, name, type, value, o) {
    o = o || {};
    return '<input id="' + id + '" name="' + name + '" type="' + type + '"' + (value !== undefined && value !== null ? ' value="' + esc(value) + '"' : '') +
      (o.req ? ' required' : '') + (o.min !== undefined ? ' min="' + o.min + '"' : '') + (o.max !== undefined ? ' max="' + o.max + '"' : '') + (o.step ? ' step="' + o.step + '"' : '') +
      (o.maxlength ? ' maxlength="' + o.maxlength + '"' : '') + (o.help ? ' aria-describedby="' + id + '-help"' : '') + (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + '>';
  }
  function textarea(id, name, value, rows) { return '<textarea id="' + id + '" name="' + name + '" rows="' + (rows || 3) + '" maxlength="4000">' + esc(value || '') + '</textarea>'; }
  function select(id, name, options, value, o) {
    o = o || {};
    return '<select id="' + id + '" name="' + name + '"' + (o.req ? ' required' : '') + '>' + (o.blank !== false && !o.req ? '<option value="">' + esc(o.blankLabel || '— not set —') + '</option>' : '') +
      options.map(function (opt) {
        var v = Array.isArray(opt) ? opt[0] : opt, t = Array.isArray(opt) ? opt[1] : opt;
        return '<option value="' + esc(v) + '"' + (String(v) === String(value) ? ' selected' : '') + '>' + esc(t) + '</option>';
      }).join('') + '</select>';
  }
  /* Show validation errors from the store on the matching fields and in a summary; returns true if any were shown. */
  function showErrors(form, errors) {
    var summary = form.querySelector('.wsummary'), first = null;
    form.querySelectorAll('.werr').forEach(function (e) { e.hidden = true; e.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach(function (e) { e.removeAttribute('aria-invalid'); });
    var lines = [];
    (errors || []).forEach(function (er) {
      var top = String(er.path).split(/[.\[]/)[0], el = form.querySelector('[name="' + top + '"]');
      var msg = (er.path ? er.path + ' ' : '') + er.message; lines.push(msg);
      if (el) { el.setAttribute('aria-invalid', 'true'); var box = form.querySelector('#' + el.id + '-err'); if (box) { box.hidden = false; box.textContent = msg; el.setAttribute('aria-describedby', ((el.getAttribute('aria-describedby') || '') + ' ' + el.id + '-err').trim()); } if (!first) first = el; }
    });
    if (summary) {
      summary.hidden = !lines.length;
      summary.innerHTML = lines.length ? '<b>Please fix:</b><ul>' + lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' : '';
      if (lines.length) { summary.setAttribute('tabindex', '-1'); summary.focus(); }
    }
    if (lines.length) announce(lines.length + ' problem' + (lines.length > 1 ? 's' : '') + ' found');
    return lines.length > 0;
  }

  /* ---------- download / print / copy ---------- */
  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function copy(text, done) {
    function fallback() { var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* no-op */ } document.body.removeChild(t); done(ok); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, fallback); else fallback();
  }
  function stamp() { return new Date().toISOString().slice(0, 10); }
  function fileName(base, ext) { return base + (ws.isSample() ? '-SAMPLE' : '') + '-' + stamp() + '.' + ext; }

  function notFound(what) { return { html: '<h1>Not found</h1><p class="lede">' + esc(what || 'That page') + ' does not exist. <a href="#/">Back to the Command Centre</a>.</p>', title: 'Not found — AWS AI Atlas' }; }

  A.routes = A.routes || {};
  A.ui = { ws: ws, esc: esc, parseQuery: parseQuery, buildQuery: buildQuery, num: num, money: money, pct: pct, fmtDate: fmtDate, badge: badge, announce: announce, banner: banner, subnav: subnav,
    PORTFOLIO_NAV: PORTFOLIO_NAV, REGISTER_NAV: REGISTER_NAV, field: field, input: input, textarea: textarea, select: select, showErrors: showErrors,
    download: download, copy: copy, fileName: fileName, notFound: notFound, stamp: stamp };
})();
