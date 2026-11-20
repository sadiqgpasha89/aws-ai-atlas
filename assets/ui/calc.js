/* FinOps, unit-economics and ROI calculators (plan §8, §20). Routes: #/calc[/id][?scenario=ID|project=ID], #/calc/saved.
   Arithmetic lives in lib/calc.js (unit tested). Prices are always entered by the user: example values are labelled as examples. */
(function () {
  'use strict';
  var A = window.ATLAS, L = A.lib, U = A.ui, esc = U.esc, C = L.calc;

  var PRICE_LINKS = [['Amazon Bedrock pricing', 'https://aws.amazon.com/bedrock/pricing/'], ['Amazon SageMaker AI pricing', 'https://aws.amazon.com/sagemaker/ai/pricing/'], ['AWS Pricing Calculator', 'https://calculator.aws/']];
  var CUR = { k: 'currency', l: 'Currency label', t: 'text', def: 'USD', help: 'Shown next to amounts. Nothing is converted.' };

  /* t: num | pct (entered as %, sent to the calculator as a fraction) | text | area */
  var CALCS = [
    { id: 'llm', title: 'LLM inference', blurb: 'Cost per request and per month for a model, with prompt caching and retries.',
      fields: [CUR, { k: 'requests', l: 'Requests per month', def: 1000000 }, { k: 'inputTokens', l: 'Input tokens per request', def: 1500 }, { k: 'outputTokens', l: 'Output tokens per request', def: 400 },
        { k: 'inputPrice', l: 'Input price per 1M tokens', def: 3, help: 'Example value. Use your model\'s current rate.' }, { k: 'outputPrice', l: 'Output price per 1M tokens', def: 15, help: 'Example value.' },
        { k: 'cacheHitRate', l: 'Share of input served from cache (%)', t: 'pct', def: 0 }, { k: 'cachedInputPrice', l: 'Cached input price per 1M tokens', def: 0.3, help: 'Example value; only used if the cache share is above 0.' }, { k: 'retryRate', l: 'Retry rate (%)', t: 'pct', def: 0, help: 'Extra calls caused by failures, as a share of calls. Each retry costs a full call.' }],
      run: C.llmCost,
      render: function (r, i) { return kv([['Cost per request', U.money(r.perRequest, i.currency)], ['Cost per month', U.money(r.perMonth, i.currency, 2)], ['Input tokens', U.money(r.breakdown.input, i.currency, 2)], ['Cached input', U.money(r.breakdown.cachedInput, i.currency, 2)], ['Output tokens', U.money(r.breakdown.output, i.currency, 2)], ['Retries', U.money(r.breakdown.retries, i.currency, 2)]]); },
      summary: function (r, i) { return U.money(r.perMonth, i.currency, 0) + ' / month, ' + U.money(r.perRequest, i.currency) + ' / request'; } },
    { id: 'rag', title: 'RAG', blurb: 'Ingestion, re-embedding, storage, retrieval, reranking and generation.',
      fields: [CUR, { k: 'documents', l: 'Documents', def: 20000 }, { k: 'tokensPerDocument', l: 'Tokens per document', def: 2000 }, { k: 'embeddingPrice', l: 'Embedding price per 1M tokens', def: 0.1, help: 'Example value.' }, { k: 'monthlyReingestFraction', l: 'Corpus re-embedded each month (%)', t: 'pct', def: 10 },
        { k: 'vectorStorageGB', l: 'Vector / index storage (GB)', def: 20 }, { k: 'storagePricePerGBMonth', l: 'Storage price per GB-month', def: 0.25, help: 'Example value.' }, { k: 'queriesPerMonth', l: 'Queries per month', def: 200000 },
        { k: 'searchPricePer1kQueries', l: 'Retrieval price per 1,000 queries', def: 0.5, help: 'Example value. Use 0 if retrieval is included in a fixed fee, and add that fee to storage.' }, { k: 'rerankPricePer1kQueries', l: 'Rerank price per 1,000 queries', def: 1, help: 'Example value.' },
        { k: 'inputTokens', l: 'Prompt tokens per query (with retrieved context)', def: 3500 }, { k: 'outputTokens', l: 'Output tokens per query', def: 350 }, { k: 'inputPrice', l: 'Generation input price per 1M tokens', def: 3 }, { k: 'outputPrice', l: 'Generation output price per 1M tokens', def: 15 }],
      run: C.ragCost,
      render: function (r, i) { return kv([['One-time ingestion', U.money(r.oneTimeIngestion, i.currency, 2)], ['Monthly: re-embedding', U.money(r.parts.reembedding, i.currency, 2)], ['Monthly: storage', U.money(r.parts.storage, i.currency, 2)], ['Monthly: retrieval', U.money(r.parts.retrieval, i.currency, 2)], ['Monthly: rerank', U.money(r.parts.rerank, i.currency, 2)], ['Monthly: generation', U.money(r.parts.generation, i.currency, 2)], ['Total per month', U.money(r.perMonth, i.currency, 2), true], ['Cost per query', U.money(r.perQuery, i.currency), true]]); },
      summary: function (r, i) { return U.money(r.perMonth, i.currency, 0) + ' / month, ' + U.money(r.perQuery, i.currency) + ' / query'; } },
    { id: 'agent', title: 'Agent', blurb: 'Model calls, tool calls, retries and the cost of failed attempts.',
      fields: [CUR, { k: 'tasksPerMonth', l: 'Tasks attempted per month', def: 50000 }, { k: 'modelCallsPerTask', l: 'Model calls per task', def: 6 }, { k: 'inputTokensPerCall', l: 'Input tokens per call', def: 3000 }, { k: 'outputTokensPerCall', l: 'Output tokens per call', def: 400 },
        { k: 'inputPrice', l: 'Input price per 1M tokens', def: 3 }, { k: 'outputPrice', l: 'Output price per 1M tokens', def: 15 }, { k: 'toolCallsPerTask', l: 'Tool calls per task', def: 4 }, { k: 'costPerToolCall', l: 'Cost per tool call', def: 0.0005, help: 'Downstream service cost for one call. Example value.' },
        { k: 'retryRate', l: 'Retry rate per model call (%)', t: 'pct', def: 5 }, { k: 'successRate', l: 'Tasks that succeed (%)', t: 'pct', def: 85, help: 'Use a measured, verified rate from your evaluation, not an estimate of model confidence.' }],
      run: C.agentCost,
      render: function (r, i) { return kv([['Cost per attempt', U.money(r.perAttempt, i.currency)], ['of which model calls', U.money(r.modelPerAttempt, i.currency)], ['of which tool calls', U.money(r.toolPerAttempt, i.currency)], ['Cost per month', U.money(r.perMonth, i.currency, 2)], ['Successful tasks per month', U.num(r.successfulTasks, 0)], ['Spent on failed attempts', U.money(r.wastedOnFailures, i.currency, 2)], ['Cost per successful task', U.money(r.perSuccessfulTask, i.currency), true]]); },
      summary: function (r, i) { return U.money(r.perSuccessfulTask, i.currency) + ' per successful task, ' + U.money(r.perMonth, i.currency, 0) + ' / month'; } },
    { id: 'compare', title: 'Model comparison', blurb: 'The same usage priced under several models. Cost only: not a quality comparison.',
      fields: [CUR, { k: 'requests', l: 'Requests per month', def: 1000000 }, { k: 'inputTokens', l: 'Input tokens per request', def: 1500 }, { k: 'outputTokens', l: 'Output tokens per request', def: 400 }, { k: 'cacheHitRate', l: 'Share of input served from cache (%)', t: 'pct', def: 0 }, { k: 'retryRate', l: 'Retry rate (%)', t: 'pct', def: 0 },
        { k: 'models', l: 'Models (one per line: name, input price per 1M, output price per 1M, optional cached input price per 1M)', t: 'area', def: 'Example model A, 3, 15\nExample model B, 0.8, 4\nExample model C, 0.25, 1.25', help: 'Example names and prices. Replace with the models and rates you are evaluating.' }],
      prepare: function (i) {
        var errs = [], models = lines(i.models).map(function (p, n) { if (p.length < 3) errs.push('Model line ' + (n + 1) + ' needs a name, input price and output price.'); return { name: p[0], inputPrice: p[1], outputPrice: p[2], cachedInputPrice: p[3] }; });
        return { errors: errs, run: function (v) { return C.modelCompare({ requests: v.requests, inputTokens: v.inputTokens, outputTokens: v.outputTokens, cacheHitRate: v.cacheHitRate, retryRate: v.retryRate }, models); } };
      },
      render: function (r, i) { return '<div class="tablewrap"><table class="wtable"><thead><tr><th scope="col">Model</th><th scope="col">Per request</th><th scope="col">Per month</th><th scope="col">vs cheapest</th></tr></thead><tbody>' + r.rows.map(function (m) { return '<tr><th scope="row">' + esc(m.name) + (m.name === r.cheapest ? ' <span class="wbadge ok">lowest cost</span>' : '') + '</th><td>' + U.money(m.perRequest, i.currency) + '</td><td>' + U.money(m.perMonth, i.currency, 2) + '</td><td>' + (m.vsCheapest === null ? '—' : U.num(m.vsCheapest, 2) + '×') + '</td></tr>'; }).join('') + '</tbody></table></div>'; },
      summary: function (r, i) { return r.rows.length + ' models; lowest cost ' + r.cheapest; } },
    { id: 'budget', title: 'Monthly budget', blurb: 'How many requests a budget buys, and how much of it a plan uses.',
      fields: [CUR, { k: 'monthlyBudget', l: 'Monthly inference budget', def: 20000 }, { k: 'costPerRequest', l: 'Cost per request', def: 0.01, help: 'From the LLM or RAG calculator.' }, { k: 'plannedRequests', l: 'Planned requests per month', def: 1500000 }],
      run: C.budgetFit,
      render: function (r, i) { return kv([['Requests the budget covers', U.num(r.maxRequests, 0)], ['Planned spend', U.money(r.plannedCost, i.currency, 2)], ['Budget used', U.pct(r.utilisation === null ? null : r.utilisation * 100, 1), true], ['Headroom (requests)', U.num(r.headroomRequests, 0)]]); },
      summary: function (r) { return U.num(r.maxRequests, 0) + ' requests covered; plan uses ' + U.pct(r.utilisation * 100, 0); } },
    { id: 'capacity', title: 'GPU / provisioned capacity', blurb: 'Instances needed for a peak load, from throughput you measured yourself.',
      fields: [CUR, { k: 'peakRequestsPerSecond', l: 'Peak requests per second', def: 15 }, { k: 'outputTokensPerRequest', l: 'Output tokens per request', def: 400 }, { k: 'tokensPerSecondPerInstance', l: 'Measured output tokens/second per instance', def: 2500, help: 'From your own load test of the model, instance type and settings. Do not use a vendor headline figure.' },
        { k: 'targetUtilisation', l: 'Target utilisation at peak (%)', t: 'pct', def: 70 }, { k: 'instancePricePerHour', l: 'Instance price per hour', def: 12, help: 'Example value.' }, { k: 'hoursPerMonth', l: 'Hours per month', def: 730 }, { k: 'minInstances', l: 'Minimum instances (availability)', def: 2 }],
      run: C.capacity,
      render: function (r, i) { return kv([['Peak output tokens/second', U.num(r.peakTokensPerSecond, 0)], ['Instances needed for load', U.num(r.instancesForLoad, 0)], ['Instances to provision', U.num(r.instances, 0), true], ['Cost per month', U.money(r.perMonth, i.currency, 0), true], ['Cost per 1M output tokens at full load', U.money(r.costPerMillionOutputTokensAtFullLoad, i.currency, 2)]]); },
      summary: function (r, i) { return r.instances + ' instances, ' + U.money(r.perMonth, i.currency, 0) + ' / month'; } },
    { id: 'unit', title: 'Unit economics', blurb: 'Cost per request, completed task, successful task, user and tenant, and value created.',
      fields: [CUR, { k: 'monthlyCost', l: 'Total monthly cost', def: 25000, help: 'Everything you count: models, search, compute, logging, people if you include them.' }, { k: 'requests', l: 'Requests per month', def: 1000000 }, { k: 'tasksCompleted', l: 'Tasks completed', def: 80000 }, { k: 'tasksSuccessful', l: 'Tasks verified successful', def: 64000, help: 'Verified by evaluation or user outcome, not just "finished".' },
        { k: 'users', l: 'Active users', def: 1200 }, { k: 'tenants', l: 'Tenants', def: 6 }, { k: 'valuePerSuccessfulTask', l: 'Business value per successful task', def: 1.5 }],
      run: C.unitEconomics,
      render: function (r, i) { return kv([['Cost per request', U.money(r.costPerRequest, i.currency)], ['Cost per completed task', U.money(r.costPerCompletedTask, i.currency)], ['Cost per successful task', U.money(r.costPerSuccessfulTask, i.currency), true], ['Cost per 1,000 successful tasks', U.money(r.costPer1kSuccessfulTasks, i.currency, 2)], ['Cost per user', U.money(r.costPerUser, i.currency, 2)], ['Cost per tenant', U.money(r.costPerTenant, i.currency, 2)], ['Task success rate', U.pct(r.successRate === null ? null : r.successRate * 100, 1)], ['Value created', U.money(r.valueTotal, i.currency, 0)], ['Net value (value − cost)', U.money(r.netValue, i.currency, 0), true], ['Value per unit of cost', r.valueToCost === null ? '—' : U.num(r.valueToCost, 2) + '×']]); },
      summary: function (r, i) { return U.money(r.costPerSuccessfulTask, i.currency) + ' per successful task'; } },
    { id: 'optimize', title: 'Optimisation scenario', blurb: 'Estimated savings from cost levers applied one after another.',
      fields: [CUR, { k: 'baselineMonthly', l: 'Baseline monthly cost', def: 30000 }, { k: 'levers', l: 'Levers (one per line: name, expected reduction %)', t: 'area', def: 'Prompt caching, 20\nModel routing, 25\nOutput length limits, 5', help: 'Reductions are your assumptions. Validate each by measurement before relying on it.' }],
      prepare: function (i) {
        var errs = [], levers = lines(i.levers).map(function (p, n) { var v = Number(p[1]); if (p.length < 2 || p[1] === '' || !isFinite(v)) errs.push('Lever line ' + (n + 1) + ' needs a name and a percentage.'); return { name: p[0], reductionPct: v }; });
        return { errors: errs, run: function (v) { return C.optimize(Number(v.baselineMonthly), levers); } };
      },
      render: function (r, i) { return '<div class="tablewrap"><table class="wtable"><thead><tr><th scope="col">Lever</th><th scope="col">Reduction</th><th scope="col">Saved</th><th scope="col">Remaining</th></tr></thead><tbody>' + r.steps.map(function (s) { return '<tr><th scope="row">' + esc(s.name) + '</th><td>' + s.reductionPct + '%</td><td>' + U.money(s.saved, i.currency, 0) + '</td><td>' + U.money(s.remaining, i.currency, 0) + '</td></tr>'; }).join('') + '</tbody></table></div>' + kv([['Optimised monthly cost', U.money(r.optimised, i.currency, 0), true], ['Total saved per month', U.money(r.totalSaved, i.currency, 0), true], ['Total reduction', U.pct(r.totalReductionPct, 1)]]); },
      summary: function (r, i) { return 'Saves ' + U.money(r.totalSaved, i.currency, 0) + ' / month (' + U.pct(r.totalReductionPct, 0) + ')'; } },
    { id: 'roi', title: 'ROI and payback', blurb: 'Build, run, review and change costs against benefits, over 12, 24 and 36 months, in three scenarios.',
      fields: [CUR, { k: 'buildCost', l: 'Build cost', def: 150000 }, { k: 'changeCost', l: 'Change management and training cost', def: 20000 }, { k: 'runCostMonthly', l: 'Run cost per month (infrastructure, models, data)', def: 4000 }, { k: 'maintenanceMonthly', l: 'Maintenance per month', def: 2000 }, { k: 'humanReviewMonthly', l: 'Human review cost per month', def: 1500 },
        { k: 'adoption', l: 'Steady-state adoption (%)', t: 'pct', def: 70 }, { k: 'rampMonths', l: 'Months to reach steady-state adoption', def: 4 }, { k: 'riskAdjustment', l: 'Benefit risk haircut (%)', t: 'pct', def: 20, help: 'Share of benefit you do not count, for uncertainty.' },
        { k: 'benefits', l: 'Benefits at full adoption (one per line: label, cash | capacity | avoidance, value per month)', t: 'area', def: 'Support handling time saved, cash, 12000\nAnalyst hours freed, capacity, 8000', help: 'List each benefit once. Only "cash" reduces spend or adds revenue; capacity released and cost avoidance are not cash unless redeployed or budgeted.' },
        { k: 'consBenefit', l: 'Conservative: benefit (% of base)', t: 'pct', def: 60 }, { k: 'consCost', l: 'Conservative: cost (% of base)', t: 'pct', def: 120 }, { k: 'optBenefit', l: 'Optimistic: benefit (% of base)', t: 'pct', def: 130 }, { k: 'optCost', l: 'Optimistic: cost (% of base)', t: 'pct', def: 100 }],
      prepare: function (i) {
        var errs = [], benefits = lines(i.benefits).map(function (p, n) { if (p.length < 3) errs.push('Benefit line ' + (n + 1) + ' needs a label, a type and a monthly value.'); return { label: p[0], kind: (p[1] || '').toLowerCase(), monthlyValue: p[2] }; });
        return { errors: errs, run: function (v) {
          var base = { buildCost: v.buildCost, changeCost: v.changeCost, runCostMonthly: v.runCostMonthly, maintenanceMonthly: v.maintenanceMonthly, humanReviewMonthly: v.humanReviewMonthly, adoption: v.adoption, rampMonths: v.rampMonths, riskAdjustment: v.riskAdjustment, benefits: benefits };
          return C.roiScenarios(base, { conservative: { benefitMultiplier: v.consBenefit, costMultiplier: v.consCost }, optimistic: { benefitMultiplier: v.optBenefit, costMultiplier: v.optCost } });
        } };
      },
      render: function (r, i) {
        var names = ['conservative', 'base', 'optimistic'], cur = i.currency;
        var h = '<div class="tablewrap"><table class="wtable"><thead><tr><th scope="col">Scenario</th><th scope="col">Horizon</th><th scope="col">Total cost</th><th scope="col">Total benefit</th><th scope="col">Net</th><th scope="col">ROI</th><th scope="col">ROI, cash benefits only</th></tr></thead><tbody>';
        names.forEach(function (n) { [12, 24, 36].forEach(function (m, k) { var x = r.scenarios[n].horizons[m]; h += '<tr>' + (k === 0 ? '<th scope="rowgroup" rowspan="3">' + esc(n.charAt(0).toUpperCase() + n.slice(1)) + '</th>' : '') + '<td>' + m + ' months</td><td>' + U.money(x.totalCost, cur, 0) + '</td><td>' + U.money(x.totalBenefit, cur, 0) + '</td><td>' + U.money(x.net, cur, 0) + '</td><td>' + U.pct(x.roiPct, 0) + '</td><td>' + U.pct(x.cashRoiPct, 0) + '</td></tr>'; }); });
        h += '</tbody></table></div><div class="tablewrap"><table class="wtable"><thead><tr><th scope="col">Scenario</th><th scope="col">Payback (all benefits)</th><th scope="col">Payback (cash only)</th><th scope="col">Steady benefit / month</th></tr></thead><tbody>';
        names.forEach(function (n) { var x = r.scenarios[n]; h += '<tr><th scope="row">' + esc(n.charAt(0).toUpperCase() + n.slice(1)) + '</th><td>' + (x.paybackMonth === null ? 'Not within 120 months' : 'Month ' + x.paybackMonth) + '</td><td>' + (x.cashPaybackMonth === null ? 'Not within 120 months' : 'Month ' + x.cashPaybackMonth) + '</td><td>' + U.money(x.steadyBenefitMonthly, cur, 0) + '</td></tr>'; });
        h += '</tbody></table></div>';
        var w = r.scenarios.base.warnings; if (w.length) h += '<div class="wbanner info" role="note"><ul>' + w.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
        return h;
      },
      summary: function (r, i) { var b = r.scenarios.base; return 'Base: ' + U.pct(b.horizons[24].roiPct, 0) + ' ROI at 24 months, payback ' + (b.paybackMonth === null ? 'beyond 120 months' : 'month ' + b.paybackMonth); } }
  ];
  var byId = {}; CALCS.forEach(function (c) { byId[c.id] = c; });
  var FORMULAS = { roi: ['Benefit in month m = Σ benefits × adoption(m) × (1 − risk haircut); adoption ramps linearly to steady state.', 'Total cost = build + change cost + recurring monthly cost × months.', 'ROI % = (total benefit − total cost) ÷ total cost × 100.', 'Payback = first month where cumulative benefit ≥ total cost (searched to 120 months).'] };

  function lines(text) { return String(text || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) { return l.split(',').map(function (x) { return x.trim(); }); }); }
  function kv(rows) { return '<dl class="wres">' + rows.map(function (r) { return '<div class="' + (r[2] ? 'key' : '') + '"><dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>'; }

  function defaults(c) { var o = {}; c.fields.forEach(function (f) { o[f.k] = f.def === undefined ? '' : f.def; }); return o; }
  function fieldHtml(c, f, v) {
    var id = 'c-' + f.k;
    var ctl = f.t === 'area' ? '<textarea id="' + id + '" name="' + f.k + '" rows="5" maxlength="2000"' + (f.help ? ' aria-describedby="' + id + '-help"' : '') + '>' + esc(v) + '</textarea>'
      : f.t === 'text' ? U.input(id, f.k, 'text', v, { maxlength: f.k === 'currency' ? 8 : 80, help: f.help }) : U.input(id, f.k, 'number', v, { min: 0, step: 'any', help: f.help });
    return U.field(id, f.l, ctl, { wide: f.t === 'area', help: f.help });
  }
  function readInputs(c, form) { var o = {}; c.fields.forEach(function (f) { o[f.k] = form.elements[f.k].value; }); return o; }
  function toCalcValues(c, raw) {
    var v = {};
    c.fields.forEach(function (f) { var x = raw[f.k]; v[f.k] = (f.t === 'pct' && String(x).trim() !== '' && isFinite(Number(x))) ? Number(x) / 100 : x; });
    return v;
  }
  function compute(c, raw) {
    var v = toCalcValues(c, raw), res;
    if (c.prepare) { var p = c.prepare(raw); if (p.errors.length) return { ok: false, errors: p.errors }; res = p.run(v); }
    else res = c.run(v);
    return res;
  }

  function scenarioList(store) { return store.list('scenarios').sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }); }

  function savedPage(qs) {
    var q = U.parseQuery(qs), store = U.ws.store(), list = scenarioList(store);
    var h = '<div class="wide">' + U.banner() + '<div class="eyebrow">Toolkit</div><h1>Saved scenarios</h1>' + nav('saved') + '<p class="lede">Scenarios you saved from the calculators. They are stored with your workspace and included in its export.</p>';
    if (!list.length) return { html: h + '<section class="wempty"><h2>No saved scenarios</h2><p>Open a calculator, enter your numbers and use "Save scenario".</p><a class="btn primary" href="#/calc/llm">Open a calculator</a></section></div>', title: 'Saved scenarios — AWS AI Atlas' };
    var sel = (q.cmp || '').split(',').filter(Boolean).map(function (id) { return store.get('scenarios', id); }).filter(Boolean);
    h += '<form data-cmp-form><div class="tablewrap"><table class="wtable"><thead><tr><th scope="col">Compare</th><th scope="col">Name</th><th scope="col">Calculator</th><th scope="col">Result</th><th scope="col">Saved</th><th scope="col">Manage</th></tr></thead><tbody>' + list.map(function (s) {
      return '<tr><td><input type="checkbox" name="cmp" value="' + esc(s.id) + '" aria-label="Compare ' + esc(s.name) + '"' + (sel.some(function (x) { return x.id === s.id; }) ? ' checked' : '') + '></td><td><b>' + esc(s.name) + '</b></td><td>' + esc((byId[s.kind] || {}).title || s.kind) + '</td><td>' + esc(s.summary || '') + '</td><td>' + esc(s.createdAt.slice(0, 10)) + '</td><td><a class="btn sm" href="#/calc/' + esc(s.kind) + '?scenario=' + esc(s.id) + '">Open</a> <button class="btn sm" type="button" data-act="del" data-id="' + esc(s.id) + '" aria-label="Delete ' + esc(s.name) + '">Delete</button></td></tr>';
    }).join('') + '</tbody></table></div><div class="btns"><button class="btn primary" type="submit">Compare selected inputs</button><button class="btn" type="button" data-act="csv">Download CSV</button></div></form>';
    if (sel.length > 1) {
      var keys = []; sel.forEach(function (s) { Object.keys(s.inputs).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); }); });
      h += '<h2>Input comparison</h2><p class="fine">Rows that differ between the selected scenarios are marked.</p><div class="tablewrap"><table class="wtable"><thead><tr><th scope="col">Input</th>' + sel.map(function (s) { return '<th scope="col">' + esc(s.name) + '<br><small>' + esc((byId[s.kind] || {}).title || s.kind) + '</small></th>'; }).join('') + '</tr></thead><tbody>' +
        keys.map(function (k) { var vals = sel.map(function (s) { return s.inputs[k]; }), diff = vals.some(function (x) { return String(x) !== String(vals[0]); }); return '<tr' + (diff ? ' class="diff"' : '') + '><th scope="row">' + esc(keyLabel(sel, k)) + (diff ? ' <span class="wbadge warn"><span aria-hidden="true">≠</span> differs</span>' : '') + '</th>' + vals.map(function (x) { return '<td>' + (x === undefined ? '—' : esc(String(x).replace(/\n/g, ' / '))) + '</td>'; }).join('') + '</tr>'; }).join('') +
        '<tr><th scope="row">Result</th>' + sel.map(function (s) { return '<td>' + esc(s.summary || '') + '</td>'; }).join('') + '</tr></tbody></table></div>';
    }
    h += '</div>';
    return { html: h, title: 'Saved scenarios — AWS AI Atlas', mount: function (root) {
      var f = root.querySelector('[data-cmp-form]');
      f.addEventListener('submit', function (e) { e.preventDefault(); var ids = Array.prototype.filter.call(f.elements.cmp || [], function (x) { return x.checked; }).map(function (x) { return x.value; }); if (f.elements.cmp && f.elements.cmp.checked !== undefined) ids = f.elements.cmp.checked ? [f.elements.cmp.value] : []; location.hash = '#/calc/saved' + U.buildQuery({ cmp: ids.join(',') }); });
      root.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]'); if (!b) return;
        if (b.getAttribute('data-act') === 'del') { var s = store.get('scenarios', b.getAttribute('data-id')); if (s && window.confirm('Delete scenario "' + s.name + '"?')) { store.remove('scenarios', s.id); A.rerender(); } }
        if (b.getAttribute('data-act') === 'csv') U.download(U.fileName('scenarios', 'csv'), L.exporters.toCSV(list, [{ label: 'Name', get: function (s) { return s.name; } }, { label: 'Calculator', get: function (s) { return s.kind; } }, { label: 'Result', get: function (s) { return s.summary; } }, { label: 'Currency', get: function (s) { return s.currency; } }, { label: 'Saved', get: function (s) { return s.createdAt.slice(0, 10); } }, { label: 'Inputs (JSON)', get: function (s) { return JSON.stringify(s.inputs); } }], ['Generated ' + U.ws.today(), U.ws.isSample() ? 'SAMPLE DATA' : 'Personal workspace', 'Estimates from user-entered inputs; not AWS prices']), 'text/csv;charset=utf-8');
      });
    } };
  }

  function keyLabel(sel, k) {
    var kinds = {}; sel.forEach(function (s) { if (k in s.inputs) kinds[s.kind] = 1; });
    var ks = Object.keys(kinds); if (ks.length !== 1 || !byId[ks[0]]) return k;
    var f = byId[ks[0]].fields.filter(function (x) { return x.k === k; })[0]; return f ? f.l : k;
  }
  function nav(current) {
    return U.subnav('Calculators', CALCS.map(function (c) { return ['#/calc/' + c.id, c.title, c.id]; }).concat([['#/calc/saved', 'Saved scenarios', 'saved']]), current);
  }

  function calcPage(id, qs) {
    var c = byId[id]; if (!c) return U.notFound('That calculator');
    var q = U.parseQuery(qs), store = U.ws.store(), values = defaults(c), loaded = null, fromProject = null;
    if (q.scenario) { loaded = store.get('scenarios', q.scenario); if (loaded && loaded.kind === id) Object.keys(loaded.inputs).forEach(function (k) { if (k in values) values[k] = loaded.inputs[k]; }); else loaded = null; }
    if (id === 'roi' && q.project) {
      var p = store.get('projects', q.project);
      if (p) { fromProject = p; if (typeof p.buildCost === 'number') values.buildCost = p.buildCost; if (typeof p.runCostMonthly === 'number') values.runCostMonthly = p.runCostMonthly; if (p.currency) values.currency = p.currency;
        if (typeof p.forecastBenefitMonthly === 'number') values.benefits = 'Forecast benefit from the initiative (classify as cash, capacity or avoidance), capacity, ' + p.forecastBenefitMonthly; }
    }
    var h = '<div class="wide">' + U.banner() + '<div class="eyebrow">Toolkit · FinOps and value</div><h1>' + esc(c.title) + ' calculator</h1>' + nav(id) + '<p class="lede">' + esc(c.blurb) + '</p>';
    h += '<div class="wbanner info" role="note"><b>Estimate from your inputs.</b> Prefilled numbers are examples, not AWS prices, and nothing is read live. Replace every price and volume with your own, and confirm rates on the official pages: ' +
      PRICE_LINKS.map(function (l) { return '<a href="' + l[1] + '" target="_blank" rel="noopener noreferrer">' + esc(l[0]) + ' ↗</a>'; }).join(', ') + '. Estimates exclude taxes, discounts, commitments, data transfer, logging and other services unless you include them in your own totals.</div>';
    if (loaded) h += '<p class="fine">Loaded scenario: <b>' + esc(loaded.name) + '</b>.</p>';
    if (fromProject) h += '<p class="fine">Prefilled from initiative <a href="#/portfolio/p/' + esc(fromProject.id) + '">' + esc(fromProject.name) + '</a>: only the fields it has were copied. The forecast benefit is entered as <i>capacity</i> by default so it is not counted as cash until you classify it.</p>';
    h += '<div class="wcalc"><form class="wf" data-calc novalidate aria-label="' + esc(c.title) + ' inputs"><div class="wgrid">' + c.fields.map(function (f) { return fieldHtml(c, f, values[f.k]); }).join('') + '</div><div class="btns"><button class="btn" type="button" data-act="reset">Reset to example values</button></div></form>' +
      '<section class="wresults" aria-labelledby="res-h"><h2 id="res-h">Results</h2><div id="res" tabindex="-1"></div>' +
      '<details><summary>Formulas and assumptions</summary><div id="formulas"></div></details>' +
      '<form class="wf inline" data-save novalidate><div class="wsummary" role="alert" hidden></div><div class="wgrid">' + U.field('sv-name', 'Scenario name', U.input('sv-name', 'name', 'text', '', { maxlength: 120, placeholder: 'e.g. Support assistant, base case' }), {}) + '</div><button class="btn primary" type="submit">Save scenario</button> <a class="btn" href="#/calc/saved">Saved scenarios</a> <button class="btn" type="button" data-act="print">Print</button></form></section></div></div>';
    return { html: h, title: c.title + ' calculator — AWS AI Atlas', mount: function (root) { mount(root, c); } };
  }

  function mount(root, c) {
    var form = root.querySelector('[data-calc]'), out = root.querySelector('#res'), fo = root.querySelector('#formulas'), last = null;
    function run() {
      var raw = readInputs(c, form), res = compute(c, raw); last = { raw: raw, res: res };
      if (!res.ok) { out.innerHTML = '<div class="wbanner warn" role="note"><b>Check these inputs:</b><ul>' + res.errors.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>'; fo.innerHTML = ''; return; }
      var cur = raw.currency === undefined ? '' : raw.currency.trim();
      out.innerHTML = c.render(res, Object.assign({}, raw, { currency: cur }));
      var f = (res.formulas || (res.scenarios && FORMULAS.roi) || []);
      fo.innerHTML = '<ul>' + f.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    }
    form.addEventListener('input', run);
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return; var act = b.getAttribute('data-act');
      if (act === 'reset') { var d = defaults(c); c.fields.forEach(function (f) { form.elements[f.k].value = d[f.k]; }); run(); U.announce('Reset to example values'); }
      if (act === 'print') window.print();
    });
    var sf = root.querySelector('[data-save]');
    sf.addEventListener('submit', function (e) {
      e.preventDefault(); run();
      if (!last.res.ok) return U.showErrors(sf, [{ path: '', message: 'Fix the inputs above before saving.' }]);
      var inputs = {}; c.fields.forEach(function (f) { var v = last.raw[f.k]; inputs[f.k] = (f.t === 'text' || f.t === 'area') ? v : (v === '' ? '' : Number(v)); });
      var cur = (last.raw.currency || '').trim(), res = U.ws.store().add('scenarios', { kind: c.id, name: sf.elements.name.value.trim(), inputs: inputs, summary: c.summary(last.res, Object.assign({}, last.raw, { currency: cur })), currency: cur });
      if (!res.ok) return U.showErrors(sf, res.errors);
      sf.elements.name.value = ''; U.showErrors(sf, []); U.announce('Scenario saved'); var m = document.createElement('span'); m.className = 'fine'; m.textContent = ' Saved.'; sf.appendChild(m);
    });
    run();
  }

  A.routes.calc = { render: function (parts, qs) { var id = parts[0] || 'llm'; return id === 'saved' ? savedPage(qs) : calcPage(id, qs); } };
  A.ui.calcIds = CALCS.map(function (c) { return { id: c.id, title: c.title, blurb: c.blurb }; });
})();
