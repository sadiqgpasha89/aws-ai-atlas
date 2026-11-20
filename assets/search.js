/* Atlas search: index builder + query function. Pure (no DOM), so tests/search.test.mjs can load it in Node.
   Records are indexed by collecting every string they contain, so the index never depends on field names. */
(function (root) {
  'use strict';

  /* kind -> filter label. Order is the order of the filter chips. */
  var KINDS = [
    ['service', 'Services'], ['architecture', 'Architectures'], ['decision', 'Decisions'], ['playbook', 'Playbooks'],
    ['model', 'Models'], ['runbook', 'Runbooks'], ['security', 'Security'], ['tool', 'Tools'], ['lab', 'Labs'], ['guide', 'Guides']
  ];

  /* Acronyms and alternate terms. A query word that equals any member also matches every other member. */
  var ALIASES = [
    ['rag', 'retrieval augmented generation', 'retrieval-augmented generation'],
    ['mcp', 'model context protocol'],
    ['iam', 'identity and access management', 'role based access control', 'rbac'],
    ['adr', 'architecture decision record', 'decision record'],
    ['slo', 'service level objective', 'service level objectives', 'error budget'],
    ['sla', 'service level agreement'],
    ['llm', 'large language model', 'language model', 'foundation model'],
    ['iac', 'infrastructure as code', 'cloudformation', 'cdk', 'terraform'],
    ['hitl', 'human in the loop', 'human-in-the-loop'],
    ['finops', 'cost management', 'cost optimization', 'tco'],
    ['mlops', 'genaiops', 'llmops'],
    ['eks', 'kubernetes'],
    ['ecs', 'fargate', 'containers'],
    ['sfn', 'step functions', 'stepfunctions'],
    ['apigw', 'api gateway'],
    ['kms', 'key management', 'encryption keys'],
    ['429', 'throttling', 'throttlingexception', 'rate limit', 'rate limiting', 'quota'],
    ['pt', 'provisioned throughput', 'model units'],
    ['hnsw', 'vector index', 'approximate nearest neighbor', 'knn', 'k-nn'],
    ['bm25', 'keyword search', 'lexical search'],
    ['pii', 'personal data', 'sensitive data', 'macie', 'comprehend'],
    ['owasp', 'llm top 10'],
    ['dr', 'disaster recovery'],
    ['ocr', 'textract', 'text extraction'],
    ['sdk', 'client library'],
    ['arb', 'architecture review board', 'architecture review'],
    ['raid', 'risks assumptions issues dependencies'],
    ['prr', 'production readiness review', 'readiness'],
    ['scp', 'service control policy', 'service control policies'],
    ['idp', 'intelligent document processing', 'document processing'],
    ['acl', 'permission-aware', 'security trimming', 'document level security']
  ];

  function flat(o, out) {
    if (o == null) return out;
    var t = typeof o;
    if (t === 'string') out.push(o);
    else if (t === 'number') out.push(String(o));
    else if (Array.isArray(o)) o.forEach(function (x) { flat(x, out); });
    else if (t === 'object') Object.keys(o).forEach(function (k) { flat(o[k], out); });
    return out;
  }

  /* Substring match, except that short terms (3 characters or fewer, such as "slo" or "pt") must be a whole word,
     so "slo" finds SLO but not "slots". */
  function has(text, t) {
    if (t.length > 3) return text.indexOf(t) > -1;
    for (var i = text.indexOf(t); i > -1; i = text.indexOf(t, i + 1)) {
      if ((i === 0 || !/[a-z0-9]/.test(text.charAt(i - 1))) && !/[a-z0-9]/.test(text.charAt(i + t.length))) return true;
    }
    return false;
  }

  function expand(term) {
    var alts = [term];
    ALIASES.forEach(function (g) { if (g.indexOf(term) > -1) g.forEach(function (m) { if (alts.indexOf(m) < 0) alts.push(m); }); });
    return alts;
  }

  /* Returns up to `limit` entries. kind = 'all' or a KINDS key. Ranking: name prefix 100, name contains 70,
     id contains 55, tag contains 30, body contains 10, summed across query words; every word must match. */
  function query(index, text, kind, limit) {
    var terms = String(text || '').toLowerCase().split(/\s+/).filter(Boolean);
    var alts = terms.map(expand);
    var res = index.filter(function (it) { return !kind || kind === 'all' || it.kind === kind; }).map(function (it) {
      var score = 0, ok = true, nm = it.name.toLowerCase(), tg = it.tag.toLowerCase();
      alts.forEach(function (as) {
        var best = 0;
        as.forEach(function (t, i) {
          var s = 0;
          if (nm.indexOf(t) === 0 && has(nm.slice(0, t.length + 1) + ' ', t)) s = 100; else if (has(nm, t)) s = 70; else if (has(it.id.toLowerCase(), t)) s = 55;
          else if (has(tg, t)) s = 30; else if (has(it.hay, t)) s = 10;
          if (i > 0 && s) s = Math.round(s * 0.9); /* the literal term outranks its aliases */
          if (s > best) best = s;
        });
        if (!best) ok = false; score += best;
      });
      return { it: it, score: terms.length ? (ok ? score : 0) : 1 };
    }).filter(function (h) { return h.score > 0; });
    res.sort(function (a, b) { return b.score - a.score || a.it.name.localeCompare(b.it.name); });
    return res.slice(0, limit || 20).map(function (h) { return h.it; });
  }

  function build(A) {
    var byId = {};
    A.services.forEach(function (s) { byId[s.id] = s; });
    function plain(s) {
      return String(s).replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, function (m, id, label) { return label || (byId[id] ? byId[id].name : id); });
    }
    function hayOf(o) { return plain(flat(o, []).join(' ')).replace(/[`*]/g, '').toLowerCase(); }
    var out = [];
    function add(kind, type, href, name, tag, cat, obj, extra) {
      if (!name) return;
      out.push({ kind: kind, type: type, href: href, name: String(name), tag: String(tag || ''), cat: cat, id: href,
        hay: hayOf(obj) + (extra ? ' ' + String(extra).toLowerCase() : '') });
    }
    var catById = {}; A.categories.forEach(function (c) { catById[c.id] = c; });

    A.services.forEach(function (s) { add('service', 'Service', '#/s/' + s.id, s.name, s.tag, catById[s.cat].name, s, s.id); });
    A.architectures.forEach(function (a) { add('architecture', 'Architecture', '#/a/' + a.id, a.name, a.short, 'Architecture', a, a.id); });
    A.decisions.forEach(function (d) { add('decision', 'Decision', '#/d/' + d.id, d.title, d.question, 'Decision guide', d, d.id); });
    A.engineeringPlaybooks.forEach(function (p) { add('playbook', 'Playbook', '#/p/' + p.id, p.title, p.tag, 'Playbook', p, p.id); });
    A.toolkit.templates.forEach(function (t) { add('tool', 'Template', '#/toolkit', t.title, t.description, 'Manager template', t, t.id); });
    A.selector.workloads.forEach(function (w) { add('tool', 'Selector', '#/selector', w.title, w.keyDecision, 'Service selector', w, w.id); });
    A.models.registry.forEach(function (m) { add('model', 'Model', '#/models', m.name, m.useCase, 'Model registry (' + m.provider + ')', m, m.id); });

    /* Top-level pages. Extra keywords widen discovery. */
    [
      ['tool', '#/', 'Command Centre', 'Executive portfolio health, attention items, decisions today, daily schedule', 'Command Centre', 'command centre portfolio kpi attention decisions schedule'],
      ['guide', '#/delivery', 'AI Project Delivery Lifecycle', '12 phases from discovery to decommission, 12 active squad initiatives', 'Lifecycle', 'delivery lifecycle phases portfolio roadmap projects gates'],
      ['guide', '#/arch-review', 'Architecture Review Board (ARB)', '12 review dimensions, risk calculator, systemic risk view across squads', 'Governance', 'arb architecture review risk scoring likelihood impact dimensions'],
      ['tool', '#/selector', 'AWS AI Service Selection Matrix', '14 workloads with recommended services and rejection reasons', 'Decision tool', 'selector service matrix workloads rag agent batch bedrock sagemaker'],
      ['model', '#/models', 'Enterprise Model Registry', '16 foundation models, token economics, latency, promotion policy', 'Model platform', 'models registry claude bedrock nova llama titan lifecycle promotion'],
      ['guide', '#/eval', 'AI Evaluation & Quality Engineering', '13 evaluation layers, 28 metrics dictionary, 12 release gates', 'Quality engineering', 'eval evaluation metrics quality gates golden dataset testing ragas'],
      ['tool', '#/finops', 'AI FinOps & Unit Economics', 'Cost per task, cost tiers, scenarios, cost levers, approval gates', 'FinOps', 'finops budget unit economics cost per task calculator pricing levers'],
      ['guide', '#/ops', 'Production AI Operations & SRE', 'Reliability principles, SLO error budgets, chaos drills, dashboards', 'Operations', 'ops sre reliability chaos drills runbooks cloudwatch latency errors'],
      ['security', '#/gov', 'Security, Governance & Compliance', 'Control Tower landing zones, NIST AI RMF, ISO 42001, EU AI Act, DPDP Act', 'Security & governance', 'governance security compliance nist iso eu ai act dpdp scp landing zone'],
      ['guide', '#/leadership', 'Leadership & Technical Debt', 'Competency matrix, productivity metrics, technical debt, maturity', 'Leadership', 'leadership workforce skills matrix technical debt maturity competency'],
      ['tool', '#/toolkit', 'Manager Toolkit & Templates', 'RACI, RAID, use case assessment, copyable markdown templates', 'Toolkit', 'toolkit templates raci raid estimation evaluation postmortem adr'],
      ['lab', '#/labs', 'Hands-on Labs & Roadmaps', 'Role roadmaps, implementation labs, AWS Architecture links', 'Labs', 'labs exercises tutorial roadmaps learn curriculum hands-on']
    ].forEach(function (t) { add(t[0], 'Page', t[1], t[2], t[3], t[4], null, t[5]); });

    /* Individual items inside modules. They link to the module page. */
    function each(arr, fn) { (arr || []).forEach(fn); }
    each(A.eval && A.eval.metricsDictionary, function (m) { add('guide', 'Eval metric', '#/eval', m.metric, m.description, 'Evaluation', m); });
    each(A.eval && A.eval.layers, function (l) { add('guide', 'Eval layer', '#/eval', l.name, l.focus, 'Evaluation', l); });
    each(A.eval && A.eval.productionReleaseGate, function (g) { add('security', 'Release gate', '#/eval', g.item, g.requirement, 'Evaluation', g); });
    each(A.sre && A.sre.chaosDrills, function (d) { add('runbook', 'Chaos drill', '#/ops', d.title, d.scenario, 'Operations', d); });
    each(A.sre && A.sre.principles, function (p) { add('guide', 'Reliability principle', '#/ops', p.title, p.desc, 'Operations', p); });
    each(A.operations && A.operations.runbooks, function (r) { add('runbook', 'Runbook', '#/ops', r.title, r.trigger, 'Operations', r); });
    each(A.compliance && A.compliance.frameworks, function (f) { add('security', 'Framework', '#/gov', f.name, f.scope, 'Compliance', f); });
    each(A.compliance && A.compliance.controlsMatrix, function (c) { add('security', 'Control', '#/gov', c.control, c.req, 'Compliance', c); });
    each(A.workforce && A.workforce.technicalDebt, function (d) { add('guide', 'Technical debt', '#/leadership', d.category, d.symptom, 'Leadership', d); });
    each(A.finops && A.finops.costLevers, function (l) { add('tool', 'Cost lever', '#/finops', l.lever, l.savings, 'FinOps', l); });
    each(A.delivery && A.delivery.phases, function (p) { add('guide', 'Delivery phase', '#/delivery', p.name, p.summary, 'Delivery', p); });
    each(A.archReview && A.archReview.dimensions, function (d) { add('guide', 'Review dimension', '#/arch-review', d.title, d.description, 'Architecture review', d); });
    each(A.labs && A.labs.exercises, function (e) { add('lab', 'Lab', '#/labs', e.title, e.goal, 'Labs', e); });
    each(A.labs && A.labs.learningPaths, function (p) { add('lab', 'Learning path', '#/labs', p.role, p.objective, 'Labs', p); });

    /* Workspace and calculator pages are registered by assets/ui/*.js in the browser. */
    if (typeof A.searchEntries === 'function') {
      A.searchEntries().forEach(function (e) {
        add(e.type === 'About' ? 'guide' : 'tool', e.type, e.href, e.name, e.tag, e.cat, null, e.id + ' ' + e.hay);
      });
    }
    return out;
  }


  var api = { build: build, query: query, expand: expand, KINDS: KINDS, ALIASES: ALIASES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.AtlasSearch = api;
})(typeof window !== 'undefined' ? window : globalThis);
