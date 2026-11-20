/* Workspace settings: sample/personal mode, storage status, JSON export, validated import with preview, reset (plan §6, §11).
   Also registers the sidebar block and the search entries for the new management pages. */
(function () {
  'use strict';
  var A = window.ATLAS, L = A.lib, U = A.ui, esc = U.esc;
  var LABELS = { projects: 'Initiatives', risks: 'Risks', decisions: 'Decisions', actions: 'Actions', scenarios: 'Saved scenarios' };
  var pending = null; // last import preview, kept only in memory

  function counts(store) {
    var snap = store.snapshot();
    return L.store.COLLECTION_NAMES.map(function (c) { return [c, (snap[c] || []).length]; });
  }

  function page(qs) {
    var store = U.ws.store(), sample = U.ws.isSample(), st = store.status, snap = store.snapshot();
    var h = '<div class="wide"><div class="eyebrow">Workspace</div><h1>Workspace settings</h1>' + U.banner();
    h += '<p class="lede">Your initiatives, risks, decisions, actions and saved scenarios live only in this browser. There is no server and no account: nothing you enter is sent anywhere. Export a file to back it up or move it to another browser.</p>';

    h += '<section class="wsec" aria-labelledby="w-mode"><h2 id="w-mode">Which data are you looking at?</h2>' +
      '<div class="wmode"><div class="wcard' + (!sample ? ' on' : '') + '"><h3>Your workspace' + (!sample ? ' <span class="wbadge ok"><span aria-hidden="true">✓</span> in use</span>' : '') + '</h3><p>Starts empty. Saved in this browser (' + (st.persistent ? 'persistent' : '<b>not persistent right now</b>') + ').</p>' +
      (sample ? '<button class="btn primary" type="button" data-act="mode" data-mode="personal">Use my workspace</button>' : '') + '</div>' +
      '<div class="wcard' + (sample ? ' on' : '') + '"><h3>Sample data' + (sample ? ' <span class="wbadge warn"><span aria-hidden="true">▲</span> in use</span>' : '') + '</h3><p>Six fictional initiatives with risks, decisions and actions, so you can try every page. Held in memory only, reset each time you switch to it, never mixed into your own data and never exported as yours.</p>' +
      (!sample ? '<button class="btn" type="button" data-act="mode" data-mode="sample">Explore with sample data</button>' : '') + '</div></div></section>';

    h += '<section class="wsec" aria-labelledby="w-contents"><h2 id="w-contents">Contents</h2><div class="tablewrap"><table class="wtable"><thead><tr><th scope="col">Collection</th><th scope="col">Records</th></tr></thead><tbody>' +
      counts(store).map(function (c) { return '<tr><th scope="row">' + esc(LABELS[c[0]] || c[0]) + '</th><td>' + c[1] + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<p class="fine">Format version ' + L.store.SCHEMA_VERSION + '. Storage key <code>' + esc(L.store.STORAGE_KEY) + '</code>. Limit: ' + 2000 + ' records per collection.</p></section>';

    if (sample) {
      h += '<p class="fine">Export, import and reset apply to your own workspace. Switch to it to use them.</p></div>';
      return { html: h, title: 'Workspace — AWS AI Atlas', mount: mount };
    }

    var empty = counts(store).every(function (c) { return c[1] === 0; });
    h += '<section class="wsec" aria-labelledby="w-exp"><h2 id="w-exp">Export</h2><p>Downloads one JSON file with everything above' + (snap.config && snap.config.criteria ? ', including your custom scoring weights' : '') + '. Keep it somewhere you trust: it contains whatever you typed.</p>' +
      '<button class="btn primary" type="button" data-act="export"' + (empty ? ' disabled aria-describedby="exp-hint"' : '') + '>Download workspace JSON</button>' + (empty ? ' <span class="fine" id="exp-hint">Nothing to export yet.</span>' : '') + '</section>';

    h += '<section class="wsec" aria-labelledby="w-imp"><h2 id="w-imp">Import</h2><p>Choose a workspace JSON exported from this atlas. You will see what it contains and what would change before anything is written.</p>' +
      '<form class="wf" data-import novalidate><div class="wsummary" role="alert" hidden></div>' + U.field('imp-file', 'Workspace file (.json, up to 5 MB)', '<input id="imp-file" name="file" type="file" accept="application/json,.json">', { help: 'The file is read in your browser; it is not uploaded.' }) + '<div id="imp-preview" aria-live="polite"></div></form></section>';

    h += '<section class="wsec" aria-labelledby="w-reset"><h2 id="w-reset">Delete everything</h2><p>Permanently removes all records and settings held in this browser. Export first if you might want them back.</p>' +
      '<button class="btn danger" type="button" data-act="reset"' + (empty ? ' disabled' : '') + '>Delete my workspace…</button><div id="reset-box" hidden></div></section>';

    h += '<section class="wsec" aria-labelledby="w-priv"><h2 id="w-priv">Privacy and safety</h2><ul><li>Everything stays in this browser unless you export it.</li><li>Do not enter passwords, API keys, access tokens or other secrets. Text that looks like a credential is rejected when you save or import.</li>' +
      '<li>Avoid personal data about individuals. Use initiative names and roles rather than private details.</li><li>Clearing site data, using private browsing, or switching browsers will remove or hide this workspace. Exports are your backup.</li></ul></section></div>';
    return { html: h, title: 'Workspace — AWS AI Atlas', mount: mount };
  }

  function previewHtml(p) {
    if (!p.ok) return '<div class="wbanner warn" role="alert"><b>This file cannot be imported.</b><ul>' + p.errors.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>';
    var h = '<div class="wbanner info" role="status"><b>Ready to import.</b> Nothing has changed yet.</div>';
    if (p.migratedFrom !== null && p.migratedFrom !== undefined) h += '<p class="fine">This file uses an older format (version ' + esc(p.migratedFrom) + ') and was upgraded in memory.</p>';
    h += '<div class="tablewrap"><table class="wtable"><thead><tr><th scope="col">Collection</th><th scope="col">In file</th><th scope="col">New</th><th scope="col">Same id as an existing record</th><th scope="col">Currently in workspace</th></tr></thead><tbody>' +
      Object.keys(p.summary).map(function (c) { var s = p.summary[c]; return '<tr><th scope="row">' + esc(LABELS[c] || c) + '</th><td>' + s.incoming + '</td><td>' + s.added + '</td><td>' + s.conflicts + '</td><td>' + s.current + '</td></tr>'; }).join('') + '</tbody></table></div>';
    if (p.problems.length) h += '<div class="wbanner warn" role="note"><b>' + p.problems.length + ' record(s) are invalid and will be skipped:</b><ul>' + p.problems.slice(0, 8).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + (p.problems.length > 8 ? '<li>…and ' + (p.problems.length - 8) + ' more</li>' : '') + '</ul></div>';
    if (p.warnings.length) h += '<div class="wbanner info" role="note"><ul>' + p.warnings.slice(0, 8).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    h += '<fieldset class="wfieldset"><legend>If a record already exists</legend>' +
      '<label class="wradio"><input type="radio" name="strategy" value="skip" checked> Keep my existing record (skip the imported one)</label>' +
      '<label class="wradio"><input type="radio" name="strategy" value="overwrite"> Replace it with the imported record</label>' +
      '<label class="wradio"><input type="radio" name="strategy" value="replace"> Replace my whole workspace with the file (deletes records not in the file)</label></fieldset>' +
      '<div class="btns"><button class="btn primary" type="button" data-act="apply">Import now</button><button class="btn" type="button" data-act="cancel">Cancel</button></div>';
    return h;
  }

  function mount(root) {
    var store = U.ws.store();
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b || b.disabled) return; var act = b.getAttribute('data-act');
      if (act === 'mode') { U.ws.setMode(b.getAttribute('data-mode')); pending = null; U.announce(b.getAttribute('data-mode') === 'sample' ? 'Showing sample data' : 'Showing your workspace'); A.rerender(); }
      else if (act === 'export') { U.download(U.fileName('aws-ai-atlas-workspace', 'json'), store.exportJSON(), 'application/json'); U.announce('Workspace downloaded'); }
      else if (act === 'cancel') { pending = null; root.querySelector('#imp-preview').innerHTML = ''; root.querySelector('#imp-file').value = ''; }
      else if (act === 'apply') {
        var strategy = (root.querySelector('input[name="strategy"]:checked') || {}).value;
        if (!pending) return;
        if (strategy === 'replace' && !window.confirm('Replace your whole workspace with the file? Records that are not in the file will be deleted.')) return;
        var r = store.applyImport(pending, strategy), box = root.querySelector('#imp-preview');
        if (!r.ok) { box.innerHTML = '<div class="wbanner warn" role="alert"><b>Import failed. Your workspace was not changed.</b><ul>' + r.errors.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>'; return; }
        pending = null; U.announce('Import complete'); A.rerender();
      }
      else if (act === 'reset') {
        var box2 = root.querySelector('#reset-box');
        box2.hidden = false; box2.innerHTML = '<div class="wbanner warn" role="alertdialog" aria-label="Confirm delete"><p><b>Delete all records and settings in this browser?</b> This cannot be undone.</p><label for="rst-in">Type DELETE to confirm</label> <input id="rst-in" type="text" autocomplete="off"> <button class="btn danger" type="button" data-act="reset-go" disabled>Delete everything</button> <button class="btn" type="button" data-act="reset-no">Cancel</button></div>';
        root.querySelector('#rst-in').focus();
      }
      else if (act === 'reset-no') { var bx = root.querySelector('#reset-box'); bx.hidden = true; bx.innerHTML = ''; }
      else if (act === 'reset-go') { var res = store.reset(); U.announce(res.ok ? 'Workspace deleted' : 'Could not clear browser storage'); A.rerender(); }
    });
    root.addEventListener('input', function (e) {
      if (e.target.id === 'rst-in') { var go = root.querySelector('[data-act="reset-go"]'); if (go) go.disabled = e.target.value !== 'DELETE'; }
    });
    var file = root.querySelector('#imp-file');
    if (file) file.addEventListener('change', function () {
      var box = root.querySelector('#imp-preview'), f = file.files && file.files[0]; pending = null;
      if (!f) { box.innerHTML = ''; return; }
      if (f.size > L.store.MAX_IMPORT_BYTES) { box.innerHTML = previewHtml({ ok: false, errors: ['The file is larger than 5 MB.'] }); return; }
      var rd = new FileReader();
      rd.onerror = function () { box.innerHTML = previewHtml({ ok: false, errors: ['The file could not be read.'] }); };
      rd.onload = function () { var p = store.previewImport(String(rd.result)); pending = p.ok ? p : null; box.innerHTML = previewHtml(p); };
      rd.readAsText(f);
    });
  }

  A.routes.workspace = { render: function () { return page(); } };

  /* ---------- sidebar block and search entries ---------- */
  function link(href, label, cur) { return '<a class="nl" href="' + href + '"' + (cur ? ' aria-current="page"' : '') + '>' + label + '</a>'; }
  A.sidebarExtra = function (kind) {
    return '<h3>My workspace' + (U.ws.isSample() ? ' (sample data)' : '') + '</h3>' +
      link('#/command', 'Dashboard', kind === 'command' || kind === '') +
      link('#/portfolio', 'Initiatives', kind === 'portfolio') +
      link('#/portfolio/prioritise', 'Prioritisation', false) +
      link('#/registers/risks', 'Risks, decisions, actions', kind === 'registers') +
      link('#/calc/llm', 'Cost and ROI calculators', kind === 'calc') +
      link('#/workspace', 'Workspace settings', kind === 'workspace');
  };
  var KW = 'workspace management portfolio';
  A.searchEntries = function () {
    var e = [
      { type: 'Workspace', href: '#/command', name: 'Dashboard (your workspace)', id: 'dashboard', tag: 'KPIs, attention list, delivery, risks, actions, entered cost', cat: 'My workspace', hay: KW + ' dashboard kpi health attention' },
      { type: 'Workspace', href: '#/portfolio', name: 'Initiatives', id: 'portfolio', tag: 'AI initiative portfolio with lifecycle stage, owner, scoring', cat: 'My workspace', hay: KW + ' initiatives projects use cases intake stage lifecycle owner' },
      { type: 'Workspace', href: '#/portfolio/new', name: 'New initiative', id: 'new-initiative', tag: 'Add an AI initiative to your portfolio', cat: 'My workspace', hay: KW + ' create add intake' },
      { type: 'Workspace', href: '#/portfolio/prioritise', name: 'Prioritisation and scoring', id: 'prioritise', tag: 'Weighted scoring, sensitivity, rank stability, value vs feasibility matrix', cat: 'My workspace', hay: KW + ' prioritisation prioritization scoring weights ranking matrix quadrant' },
      { type: 'Workspace', href: '#/registers/risks', name: 'Risk register', id: 'risks', tag: 'Probability times impact, owners, mitigation, review dates', cat: 'My workspace', hay: KW + ' risk register raid mitigation severity' },
      { type: 'Workspace', href: '#/registers/decisions', name: 'Decision log', id: 'decisions', tag: 'Decisions with context, options, rationale and review date', cat: 'My workspace', hay: KW + ' decision log adr rationale' },
      { type: 'Workspace', href: '#/registers/actions', name: 'Action tracker', id: 'actions', tag: 'Actions with owner and due date', cat: 'My workspace', hay: KW + ' actions tasks overdue owner' },
      { type: 'Workspace', href: '#/workspace', name: 'Workspace settings, export and import', id: 'workspace', tag: 'Sample data, JSON export, validated import, delete', cat: 'My workspace', hay: KW + ' export import backup reset sample privacy storage' },
      { type: 'About', href: '#/about/content', name: 'Content status and verification', id: 'content-status', tag: 'What is and is not verified in this atlas', cat: 'About', hay: 'content status verified verification sources accuracy disclaimer' },
      { type: 'Calculator', href: '#/calc/saved', name: 'Saved scenarios', id: 'saved-scenarios', tag: 'Compare scenarios you saved from the calculators', cat: 'Calculators', hay: 'calculator scenario compare saved' }
    ];
    (A.ui.calcIds || []).forEach(function (c) { e.push({ type: 'Calculator', href: '#/calc/' + c.id, name: c.title + ' calculator', id: 'calc-' + c.id, tag: c.blurb, cat: 'Calculators', hay: 'calculator finops cost estimate roi ' + c.title.toLowerCase() }); });
    return e;
  };
})();
