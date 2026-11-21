/* Site structure (sections, pages, breadcrumbs) plus the Home, Learn, Lead and Glossary pages.
   app.js reads A.ia to draw the top navigation, the section sidebar and the breadcrumb trail. */
(function () {
  'use strict';
  var A = window.ATLAS, U = A.ui, esc = U.esc;

  var svcById = {}, archById = {}, decById = {}, pbById = {}, catById = {}, gById = {};
  A.services.forEach(function (s) { svcById[s.id] = s; });
  A.architectures.forEach(function (a) { archById[a.id] = a; });
  A.decisions.forEach(function (d) { decById[d.id] = d; });
  A.engineeringPlaybooks.forEach(function (p) { pbById[p.id] = p; });
  A.categories.forEach(function (c) { catById[c.id] = c; });
  (A.glossary || []).forEach(function (g) { gById[g.id] = g; });

  /* Same mini-markup as the reference pages: `code`, **bold**, [[service-id|label]]. */
  function fmt(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, function (m, id, label) {
        var sv = svcById[id]; return sv ? '<a href="#/s/' + id + '">' + (label || esc(sv.name)) + '</a>' : (label || id);
      });
  }

  /* ---------- information architecture ---------- */
  var SECTIONS = [
    { id: 'home', label: 'Home', href: '#/' },
    { id: 'learn', label: 'Learn', href: '#/learn', blurb: 'Reference material: AWS services, architectures, decisions, playbooks and the vocabulary behind them.' },
    { id: 'lead', label: 'Lead', href: '#/lead', blurb: 'Frameworks for running AI delivery: reviews, evaluation, cost, reliability, security and the team.' },
    { id: 'workspace', label: 'Workspace', href: '#/command', blurb: 'Your own initiatives, risks, decisions and cost scenarios. Stored only in this browser.' }
  ];
  var KIND_SECTION = {
    learn: 'learn', services: 'learn', s: 'learn', c: 'learn', a: 'learn', d: 'learn', p: 'learn', selector: 'learn', models: 'learn', labs: 'learn', glossary: 'learn',
    lead: 'lead', delivery: 'lead', 'arch-review': 'lead', eval: 'lead', finops: 'lead', ops: 'lead', gov: 'lead', leadership: 'lead', toolkit: 'lead',
    command: 'workspace', portfolio: 'workspace', registers: 'workspace', calc: 'workspace', workspace: 'workspace'
  };
  function count(n, unit) { return n + ' ' + unit; }
  var PAGES = {
    learn: [
      { kind: 'services', href: '#/services', title: 'Services catalogue', meta: count(A.services.length, 'services'), blurb: 'What each AWS service does for AI systems, how it works step by step, gotchas and what it pairs with.' },
      { kind: 'a', href: '#/a', title: 'Reference architectures', meta: count(A.architectures.length, 'patterns'), blurb: 'Animated end-to-end designs for RAG, agents, serving, MLOps, governance and resilience.' },
      { kind: 'd', href: '#/d', title: 'Decision guides', meta: count(A.decisions.length, 'guides'), blurb: 'The recurring choices — model hosting, vector store, autonomy, caching — with options and rules.' },
      { kind: 'p', href: '#/p', title: 'Engineering playbooks', meta: count(A.engineeringPlaybooks.length, 'playbooks'), blurb: 'Step-by-step practice for RAG, agents, GenAIOps, security hardening and SRE.' },
      { kind: 'selector', href: '#/selector', title: 'Service selector', meta: count(A.selector.workloads.length, 'workloads'), blurb: 'For a given workload, the recommended AWS services and why the alternatives lose.' },
      { kind: 'models', href: '#/models', title: 'Model registry', meta: count(A.models.registry.length, 'models'), blurb: 'Model lifecycle, promotion policy and migration playbook, with partial verification notes.' },
      { kind: 'labs', href: '#/labs', title: 'Labs and learning paths', meta: count(A.labs.exercises.length, 'labs'), blurb: 'Role-based roadmaps and hands-on exercises with links to official AWS material.' },
      { kind: 'glossary', href: '#/glossary', title: 'Glossary', meta: count((A.glossary || []).length, 'terms'), blurb: 'Plain-language definitions of the terms used in the atlas, each tied to the AWS service that implements it.' }
    ],
    lead: [
      { kind: 'delivery', href: '#/delivery', title: 'Delivery lifecycle', meta: count(A.delivery.phases.length, 'phases'), blurb: 'From discovery to decommission: what each phase produces and the gate that ends it.' },
      { kind: 'arch-review', href: '#/arch-review', title: 'Architecture review', meta: count(A.archReview.dimensions.length, 'dimensions'), blurb: 'Review dimensions, a likelihood × impact risk calculator and a copyable review template.' },
      { kind: 'eval', href: '#/eval', title: 'Evaluation and quality', meta: count(A.eval.metricsDictionary.length, 'metrics'), blurb: 'Evaluation layers, a metrics dictionary, golden datasets and production release gates.' },
      { kind: 'finops', href: '#/finops', title: 'FinOps and unit economics', meta: count(A.finops.costLevers.length, 'cost levers'), blurb: 'Cost categories, scenarios, cost levers and approval gates for AI spend.' },
      { kind: 'ops', href: '#/ops', title: 'Operations and SRE', meta: count(A.sre.chaosDrills.length, 'chaos drills'), blurb: 'Reliability principles, SLOs and error budgets, runbooks, dashboards and postmortems.' },
      { kind: 'gov', href: '#/gov', title: 'Security and compliance', meta: count(A.compliance.frameworks.length, 'frameworks'), blurb: 'Landing zones, tenancy models, policy guardrails and a controls matrix across frameworks.' },
      { kind: 'leadership', href: '#/leadership', title: 'Leadership and team', meta: count(A.workforce.competencies.length, 'competencies'), blurb: 'Competency matrix, productivity metrics, technical debt and an AI maturity model.' },
      { kind: 'toolkit', href: '#/toolkit', title: 'Templates and toolkit', meta: count(A.toolkit.templates.length, 'templates'), blurb: 'Copyable Markdown templates, RACI, RAID and use-case assessment matrices.' }
    ],
    workspace: [
      { kind: 'command', href: '#/command', title: 'Dashboard', blurb: 'KPIs and an attention list built only from the records you enter.' },
      { kind: 'portfolio', href: '#/portfolio', title: 'Initiatives', blurb: 'Your AI portfolio with lifecycle stages, owners, milestones and costs.' },
      { kind: 'portfolio', href: '#/portfolio/prioritise', title: 'Prioritisation', blurb: 'Weighted scoring, sensitivity and a value-versus-feasibility matrix.' },
      { kind: 'registers', href: '#/registers/risks', title: 'Risks, decisions, actions', blurb: 'A risk register, decision log and action tracker.' },
      { kind: 'calc', href: '#/calc/llm', title: 'Cost and ROI calculators', blurb: 'LLM, RAG, agent, capacity, unit economics and payback, with saved scenarios.' },
      { kind: 'workspace', href: '#/workspace', title: 'Settings and backup', blurb: 'Sample data, JSON export and import, and deleting your data.' }
    ]
  };
  var GROUP = { /* detail-page kind -> parent page */
    s: ['Services', '#/services'], c: ['Services', '#/services'], a: ['Architectures', '#/a'], d: ['Decisions', '#/d'], p: ['Playbooks', '#/p'], glossary: ['Glossary', '#/glossary'],
    portfolio: ['Initiatives', '#/portfolio'], registers: ['Registers', '#/registers/risks'], calc: ['Calculators', '#/calc/llm'], command: ['Dashboard', '#/command']
  };
  function sectionOf(kind) { return KIND_SECTION[kind] || 'home'; }
  function section(id) { return SECTIONS.filter(function (s) { return s.id === id; })[0]; }
  /* Breadcrumb trail as [label, href] pairs, excluding the current page. */
  function trail(kind, id) {
    var sec = sectionOf(kind), out = [];
    if (sec === 'home') return out;
    var S = section(sec); if (kind !== sec) out.push([S.label, S.href]);
    if (id && GROUP[kind] && !(kind === 'd' && /^(em|pe|all)$/.test(id))) out.push(GROUP[kind]);
    return out;
  }

  /* Label for any in-site href, used for "related" links. */
  function labelOf(href) {
    var p = href.replace(/^#\/?/, '').split('/'), k = p[0], id = p[1];
    if (k === 's' && svcById[id]) return svcById[id].name;
    if (k === 'a' && archById[id]) return archById[id].name;
    if (k === 'd' && decById[id]) return decById[id].title;
    if (k === 'p' && pbById[id]) return pbById[id].title;
    if (k === 'c' && catById[id]) return catById[id].name;
    if (k === 'glossary' && gById[id]) return gById[id].term;
    if (k === 'calc' && id) { var c = (A.ui.calcIds || []).filter(function (x) { return x.id === id; })[0]; if (c) return c.title + ' calculator'; }
    var all = PAGES.learn.concat(PAGES.lead, PAGES.workspace);
    for (var i = 0; i < all.length; i++) if (all[i].href === href) return all[i].title;
    return href;
  }
  function linkTo(href) { return '<a href="' + esc(href) + '">' + esc(labelOf(href)) + '</a>'; }

  A.ia = { SECTIONS: SECTIONS, PAGES: PAGES, sectionOf: sectionOf, section: section, trail: trail, labelOf: labelOf };

  /* ---------- shared bits ---------- */
  function pageCards(list) {
    return '<div class="hcards">' + list.map(function (p) {
      return '<a class="hcard" href="' + p.href + '"><span class="hcard-t">' + esc(p.title) + '</span>' +
        (p.meta ? '<span class="hcard-m">' + esc(p.meta) + '</span>' : '') + '<span class="hcard-b">' + esc(p.blurb) + '</span></a>';
    }).join('') + '</div>';
  }

  /* ---------- home ---------- */
  var GOALS = [
    { title: 'Build a RAG assistant', blurb: 'Answer questions from your own documents.',
      steps: ['#/glossary/rag', '#/a/rag-assistant', '#/d/vector-store', '#/d/chunking-strategy', '#/p/rag-engineering', '#/calc/rag'] },
    { title: 'Ship a tool-using agent', blurb: 'Let a model take actions through your APIs, safely.',
      steps: ['#/d/workflow-vs-agent', '#/a/agent-platform', '#/d/human-in-loop', '#/a/secure-mcp-platform', '#/p/agent-engineering', '#/calc/agent'] },
    { title: 'Get a GenAI feature production-ready', blurb: 'Quality gates, reliability and a launch checklist.',
      steps: ['#/eval', '#/d/evaluation', '#/a/eval-cicd', '#/ops', '#/d/checklists', '#/arch-review'] },
    { title: 'Bring AI cost under control', blurb: 'Know your cost per task and pull the right levers.',
      steps: ['#/glossary/cost-per-task', '#/calc/unit', '#/d/model-routing-strategy', '#/d/prompt-vs-app-caching', '#/finops', '#/calc/optimize'] },
    { title: 'Secure and govern AI on AWS', blurb: 'Accounts, isolation, guardrails and compliance.',
      steps: ['#/a/ai-landing-zone', '#/d/tenancy', '#/glossary/prompt-injection', '#/p/security-hardening', '#/gov'] },
    { title: 'Lead an AI engineering team', blurb: 'Portfolio, delivery rhythm and team health.',
      steps: ['#/d/em', '#/delivery', '#/portfolio', '#/leadership', '#/toolkit', '#/d/central-vs-federated-platform'] }
  ];

  function home() {
    var stats = [[A.services.length, 'services'], [A.architectures.length, 'architectures'], [A.decisions.length, 'decision guides'], [A.engineeringPlaybooks.length, 'playbooks'], [A.toolkit.templates.length, 'templates'], [(A.glossary || []).length, 'glossary terms']];
    var h = '<div class="wide home">' +
      '<section class="hhero"><p class="eyebrow">AWS AI Atlas</p>' +
      '<h1>Build, run and lead AI systems on AWS.</h1>' +
      '<p class="lede">A practical field guide to the AWS services, architectures and decisions behind production AI — and to the management work of delivering it.</p>' +
      '<button type="button" class="hsearch" data-act="search"><svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M14 14l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
      '<span>Search services, patterns, terms…</span><kbd>/</kbd></button>' +
      '<ul class="hstats">' + stats.map(function (s) { return '<li><b>' + s[0] + '</b> ' + s[1] + '</li>'; }).join('') + '</ul></section>';

    h += '<section class="hsec"><h2>Three parts</h2><div class="hsections">' + SECTIONS.slice(1).map(function (S) {
      var top = PAGES[S.id].slice(0, 4);
      return '<div class="hsection"><h3><a href="' + S.href + '">' + esc(S.label) + ' <span aria-hidden="true">→</span></a></h3><p>' + esc(S.blurb) + '</p><ul>' +
        top.map(function (p) { return '<li><a href="' + p.href + '">' + esc(p.title) + '</a></li>'; }).join('') + '</ul></div>';
    }).join('') + '</div></section>';

    h += '<section class="hsec"><h2>Start with a goal</h2><p class="hsub">Each path is a short reading order through the atlas. Follow it top to bottom.</p><div class="goals">' +
      GOALS.map(function (g) {
        return '<div class="goal"><h3>' + esc(g.title) + '</h3><p>' + esc(g.blurb) + '</p><ol>' +
          g.steps.map(function (href) { return '<li>' + linkTo(href) + '</li>'; }).join('') + '</ol></div>';
      }).join('') + '</div></section>';

    h += '<section class="hsec hnote"><h2>Before you rely on a number</h2><p>This is an independent learning resource, not AWS documentation. Prices, quotas and model details change; the reference pages say so where it matters, and the <a href="#/about/content">content status</a> page explains what has and has not been verified.</p></section></div>';
    return { title: 'AWS AI Atlas — build, run and lead AI systems on AWS', html: h, mount: function (root) {
      root.addEventListener('click', function (e) { if (e.target.closest('[data-act=search]')) document.getElementById('searchBtn').click(); });
    } };
  }

  /* ---------- section hubs ---------- */
  function learnHub() {
    var h = '<div class="wide"><h1>Learn</h1><p class="lede">' + esc(section('learn').blurb) + '</p>' + pageCards(PAGES.learn) +
      '<h2>Services by category</h2><div class="hcards compact">' + A.categories.map(function (c) {
        var n = A.services.filter(function (s) { return s.cat === c.id; }).length;
        return '<a class="hcard" href="#/c/' + c.id + '"><span class="hcard-t">' + esc(c.name) + '</span><span class="hcard-m">' + n + ' services</span><span class="hcard-b">' + esc(c.short || '') + '</span></a>';
      }).join('') + '</div>' +
      '<h2>How the reference material fits together</h2><ol class="flowlist">' +
      '<li><b>Vocabulary</b> — unsure what a term means? Start in the <a href="#/glossary">glossary</a>; every entry links to the service that implements it.</li>' +
      '<li><b>Building blocks</b> — <a href="#/services">service pages</a> explain one AWS service each, with an animated walkthrough and its sharp edges.</li>' +
      '<li><b>Patterns</b> — <a href="#/a">architectures</a> combine services into a working system and show the request path step by step.</li>' +
      '<li><b>Choices</b> — <a href="#/d">decision guides</a> cover the trade-offs inside each pattern, with rules you can apply and reversibility marked.</li>' +
      '<li><b>Practice</b> — <a href="#/p">playbooks</a> and <a href="#/labs">labs</a> turn the patterns into a delivery plan.</li></ol></div>';
    return { title: 'Learn — AWS AI Atlas', html: h };
  }
  function leadHub() {
    var stages = [
      ['Before you commit', 'Is it worth building, and is the design sound?', ['#/portfolio/prioritise', '#/arch-review', '#/d/build-buy-customize', '#/calc/roi']],
      ['While you build', 'Keep scope, quality and cost visible every week.', ['#/delivery', '#/eval', '#/toolkit', '#/registers/risks']],
      ['Before launch', 'Prove it is safe, reliable and affordable.', ['#/d/checklists', '#/gov', '#/ops', '#/finops']],
      ['In production', 'Run it, learn from incidents and grow the team.', ['#/ops', '#/finops', '#/leadership', '#/command']]
    ];
    var h = '<div class="wide"><h1>Lead</h1><p class="lede">' + esc(section('lead').blurb) + '</p>' + pageCards(PAGES.lead) +
      '<h2>Which page for which moment</h2><div class="stages">' + stages.map(function (s, i) {
        return '<div class="stagecard"><span class="stagecard-n">' + (i + 1) + '</span><h3>' + esc(s[0]) + '</h3><p>' + esc(s[1]) + '</p><ul>' +
          s[2].map(function (href) { return '<li>' + linkTo(href) + '</li>'; }).join('') + '</ul></div>';
      }).join('') + '</div>' +
      '<p class="fine">Thresholds and figures in these frameworks are illustrative starting points. Adapt them to your organisation; see <a href="#/about/content">content status</a>.</p></div>';
    return { title: 'Lead — AWS AI Atlas', html: h };
  }

  /* ---------- glossary ---------- */
  function glossary(parts) {
    var G = A.glossary || [], focus = parts[0] || '';
    if (focus && !gById[focus]) return U.notFound('That glossary term');
    var groups = A.glossaryGroups || [];
    var h = '<div class="wide"><h1>Glossary</h1><p class="lede">' + G.length + ' terms used across the atlas, in plain language, each with where it shows up on AWS.</p>' +
      '<div class="gtools"><label class="sr-only" for="gfilter">Filter terms</label><input id="gfilter" type="search" placeholder="Filter terms…" autocomplete="off">' +
      '<div class="seg" role="group" aria-label="Filter by group"><button type="button" data-g="all" aria-pressed="true">All</button>' +
      groups.map(function (g) { return '<button type="button" data-g="' + g.id + '" aria-pressed="false">' + esc(g.name) + '</button>'; }).join('') + '</div></div>' +
      '<p class="fine" id="gcount" role="status" aria-live="polite"></p>';
    groups.forEach(function (gr) {
      var list = G.filter(function (g) { return g.group === gr.id; });
      h += '<section class="ggroup" data-group="' + gr.id + '"><h2>' + esc(gr.name) + '</h2><div class="gterms">' + list.map(function (g) {
        return '<article class="gterm' + (g.id === focus ? ' focus' : '') + '" id="g-' + g.id + '" data-hay="' + esc((g.term + ' ' + (g.aka || []).join(' ') + ' ' + g.def).toLowerCase()) + '">' +
          '<h3><a href="#/glossary/' + g.id + '">' + esc(g.term) + '</a></h3>' +
          ((g.aka || []).length ? '<p class="gaka">Also: ' + g.aka.map(esc).join(', ') + '</p>' : '') +
          '<p>' + fmt(g.def) + '</p>' +
          '<p class="gaws"><b>On AWS</b> ' + fmt(g.aws) + '</p>' +
          ((g.rel || []).length ? '<p class="grel"><b>Go deeper</b> ' + g.rel.map(linkTo).join('<span aria-hidden="true"> · </span>') + '</p>' : '') +
          '</article>';
      }).join('') + '</div></section>';
    });
    h += '<p class="wempty" id="gnone" hidden>No terms match. Try the site search (press <kbd>/</kbd>) — it also covers services, patterns and decisions.</p></div>';
    return { title: (focus ? gById[focus].term + ' — Glossary' : 'Glossary') + ' — AWS AI Atlas', html: h, mount: function (root) {
      var input = root.querySelector('#gfilter'), group = 'all';
      function apply() {
        var q = input.value.trim().toLowerCase(), shown = 0;
        root.querySelectorAll('.ggroup').forEach(function (sec) {
          var any = false, gOk = group === 'all' || sec.getAttribute('data-group') === group;
          sec.querySelectorAll('.gterm').forEach(function (t) { var ok = gOk && (!q || t.getAttribute('data-hay').indexOf(q) > -1); t.hidden = !ok; if (ok) { any = true; shown++; } });
          sec.hidden = !any;
        });
        root.querySelector('#gnone').hidden = shown > 0;
        root.querySelector('#gcount').textContent = shown === G.length ? '' : shown + ' of ' + G.length + ' terms';
      }
      input.addEventListener('input', apply);
      root.querySelector('.gtools .seg').addEventListener('click', function (e) {
        var b = e.target.closest('[data-g]'); if (!b) return; group = b.getAttribute('data-g');
        root.querySelectorAll('.gtools .seg button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); apply();
      });
      if (focus) setTimeout(function () { var el = root.querySelector('#g-' + focus); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start', behavior: 'instant' }); }, 30);
    } };
  }

  A.routes.home = { render: function () { return home(); } };
  A.routes.learn = { render: function () { return learnHub(); } };
  A.routes.lead = { render: function () { return leadHub(); } };
  A.routes.glossary = { render: function (parts) { return glossary(parts); } };
})();
