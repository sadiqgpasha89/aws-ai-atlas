/* Cost, unit-economics and ROI calculators (plan §8, §20).
   Pure functions. Prices are ALWAYS caller-supplied: nothing here hardcodes an AWS rate.
   Every function returns { ok, errors[], ...results, formulas[] }; invalid input never throws and never yields NaN. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.ATLAS = root.ATLAS || {}; root.ATLAS.lib = root.ATLAS.lib || {}; root.ATLAS.lib.calc = api; }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var MAX = 1e12; // guard against absurd inputs that overflow display or hide typos

  /* Read a numeric field. Collects an error instead of throwing. opts: min, max, label, int, fraction (0..1) */
  function reader(src, errors) {
    return function (key, label, opts) {
      opts = opts || {};
      var raw = src ? src[key] : undefined, v = raw;
      var blank = raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '');
      if (blank) {
        if (opts.optional) return opts.def === undefined ? 0 : opts.def;
        errors.push(label + ' must be a number.'); return 0;
      }
      if (typeof v === 'string') v = Number(v);
      if (typeof v !== 'number' || !isFinite(v)) { errors.push(label + ' must be a number.'); return 0; }
      var min = opts.fraction ? 0 : (opts.min === undefined ? 0 : opts.min), max = opts.fraction ? 1 : (opts.max === undefined ? MAX : opts.max);
      if (v < min) { errors.push(label + ' must be at least ' + min + '.'); return 0; }
      if (v > max) { errors.push(label + ' must be at most ' + (opts.fraction ? '1 (i.e. 100%)' : max) + '.'); return 0; }
      if (opts.int && Math.floor(v) !== v) { errors.push(label + ' must be a whole number.'); return 0; }
      return v;
    };
  }
  function fail(errors) { return { ok: false, errors: errors }; }
  function round(x, d) { var p = Math.pow(10, d === undefined ? 6 : d); return Math.round(x * p) / p; }
  function div(a, b) { return b > 0 ? a / b : null; }

  /* 1. LLM inference cost. Prices are per 1,000,000 tokens. */
  function llmCost(inp) {
    var errors = [], n = reader(inp, errors);
    var requests = n('requests', 'Requests per month'), inTok = n('inputTokens', 'Input tokens per request'), outTok = n('outputTokens', 'Output tokens per request');
    var inP = n('inputPrice', 'Input price per 1M tokens'), outP = n('outputPrice', 'Output price per 1M tokens');
    var hit = n('cacheHitRate', 'Cache hit rate', { fraction: true, optional: true }), cacheP = n('cachedInputPrice', 'Cached input price per 1M tokens', { optional: true });
    var retry = n('retryRate', 'Retry rate', { max: 5, optional: true });
    if (errors.length) return fail(errors);
    var input = inTok * (1 - hit) * inP / 1e6, cached = inTok * hit * cacheP / 1e6, output = outTok * outP / 1e6;
    var base = input + cached + output, retries = base * retry, perRequest = base + retries;
    return {
      ok: true, errors: [], perRequest: perRequest, perMonth: perRequest * requests,
      breakdown: { input: input * requests, cachedInput: cached * requests, output: output * requests, retries: retries * requests },
      formulas: ['per request = (input tokens x (1 - cache hit) x input price + input tokens x cache hit x cached price + output tokens x output price) / 1,000,000 x (1 + retry rate)',
        'per month = per request x requests per month']
    };
  }

  /* 2. RAG cost: one-off ingestion + monthly (re-embedding, storage, retrieval, rerank, generation). */
  function ragCost(inp) {
    var errors = [], n = reader(inp, errors);
    var docs = n('documents', 'Documents'), tokPerDoc = n('tokensPerDocument', 'Tokens per document'), embP = n('embeddingPrice', 'Embedding price per 1M tokens');
    var reingest = n('monthlyReingestFraction', 'Monthly re-ingest fraction', { fraction: true, optional: true });
    var gb = n('vectorStorageGB', 'Vector/index storage (GB)'), gbP = n('storagePricePerGBMonth', 'Storage price per GB-month');
    var queries = n('queriesPerMonth', 'Queries per month'), searchP = n('searchPricePer1kQueries', 'Retrieval price per 1,000 queries', { optional: true });
    var rerankP = n('rerankPricePer1kQueries', 'Rerank price per 1,000 queries', { optional: true });
    var inTok = n('inputTokens', 'Prompt tokens per query (including retrieved context)'), outTok = n('outputTokens', 'Output tokens per query');
    var inP = n('inputPrice', 'Generation input price per 1M tokens'), outP = n('outputPrice', 'Generation output price per 1M tokens');
    if (errors.length) return fail(errors);
    var ingestion = docs * tokPerDoc * embP / 1e6;
    var gen = llmCost({ requests: queries, inputTokens: inTok, outputTokens: outTok, inputPrice: inP, outputPrice: outP });
    var parts = { reembedding: ingestion * reingest, storage: gb * gbP, retrieval: queries / 1000 * searchP, rerank: queries / 1000 * rerankP, generation: gen.perMonth };
    var monthly = parts.reembedding + parts.storage + parts.retrieval + parts.rerank + parts.generation;
    return { ok: true, errors: [], oneTimeIngestion: ingestion, parts: parts, perMonth: monthly, perQuery: div(monthly, queries),
      formulas: ['one-time ingestion = documents x tokens per document x embedding price / 1,000,000',
        'monthly = re-embedding + storage + retrieval + rerank + generation', 'per query = monthly / queries per month'] };
  }

  /* 3. Agent cost. successRate is the share of attempted tasks that verifiably succeed. */
  function agentCost(inp) {
    var errors = [], n = reader(inp, errors);
    var tasks = n('tasksPerMonth', 'Tasks attempted per month'), calls = n('modelCallsPerTask', 'Model calls per task'), inTok = n('inputTokensPerCall', 'Input tokens per call'), outTok = n('outputTokensPerCall', 'Output tokens per call');
    var inP = n('inputPrice', 'Input price per 1M tokens'), outP = n('outputPrice', 'Output price per 1M tokens');
    var tools = n('toolCallsPerTask', 'Tool calls per task', { optional: true }), toolCost = n('costPerToolCall', 'Cost per tool call', { optional: true });
    var retry = n('retryRate', 'Retry rate per model call', { max: 5, optional: true });
    var success = n('successRate', 'Task success rate', { fraction: true });
    if (errors.length) return fail(errors);
    if (success <= 0) return fail(['Task success rate must be greater than 0 to compute cost per successful task.']);
    var modelPerAttempt = calls * (1 + retry) * (inTok * inP + outTok * outP) / 1e6, toolPerAttempt = tools * toolCost;
    var perAttempt = modelPerAttempt + toolPerAttempt, monthly = perAttempt * tasks, successful = tasks * success;
    return { ok: true, errors: [], perAttempt: perAttempt, modelPerAttempt: modelPerAttempt, toolPerAttempt: toolPerAttempt, perMonth: monthly,
      successfulTasks: successful, perSuccessfulTask: div(monthly, successful), wastedOnFailures: (tasks - successful) * perAttempt,
      formulas: ['per attempt = model calls x (1 + retry rate) x (input tokens x input price + output tokens x output price) / 1,000,000 + tool calls x cost per tool call',
        'cost per successful task = (per attempt x tasks attempted) / (tasks attempted x success rate)'] };
  }

  /* 4. Model comparison under identical usage. models: [{name, inputPrice, outputPrice}]. */
  function modelCompare(usage, models) {
    var errors = [];
    if (!Array.isArray(models) || models.length < 2) return fail(['Add at least two models to compare.']);
    var rows = models.map(function (m, i) {
      var r = llmCost({ requests: usage.requests, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, inputPrice: m.inputPrice, outputPrice: m.outputPrice, cacheHitRate: usage.cacheHitRate, cachedInputPrice: m.cachedInputPrice, retryRate: usage.retryRate });
      if (!r.ok) r.errors.forEach(function (e) { errors.push((m.name || 'Model ' + (i + 1)) + ': ' + e); });
      return { name: m.name || 'Model ' + (i + 1), perRequest: r.perRequest, perMonth: r.perMonth };
    });
    if (errors.length) return fail(errors);
    var sorted = rows.slice().sort(function (a, b) { return a.perMonth - b.perMonth; }), cheapest = sorted[0].perMonth;
    rows.forEach(function (r) { r.vsCheapest = cheapest > 0 ? r.perMonth / cheapest : null; r.extraVsCheapest = r.perMonth - cheapest; });
    return { ok: true, errors: [], rows: rows, cheapest: sorted[0].name, formulas: ['Same usage assumptions applied to each price; cost is not a quality comparison.'] };
  }

  /* 5. Monthly inference budget fit. */
  function budgetFit(inp) {
    var errors = [], n = reader(inp, errors);
    var budget = n('monthlyBudget', 'Monthly budget'), per = n('costPerRequest', 'Cost per request'), planned = n('plannedRequests', 'Planned requests per month', { optional: true });
    if (errors.length) return fail(errors);
    if (per <= 0) return fail(['Cost per request must be greater than 0.']);
    var maxReq = budget / per;
    return { ok: true, errors: [], maxRequests: maxReq, plannedCost: planned * per, utilisation: budget > 0 ? planned * per / budget : null, headroomRequests: maxReq - planned,
      formulas: ['max requests = budget / cost per request', 'utilisation = planned requests x cost per request / budget'] };
  }

  /* 6. Provisioned / self-hosted inference capacity. Throughput must come from the caller's own benchmark. */
  function capacity(inp) {
    var errors = [], n = reader(inp, errors);
    var rps = n('peakRequestsPerSecond', 'Peak requests per second'), outTok = n('outputTokensPerRequest', 'Output tokens per request'), tps = n('tokensPerSecondPerInstance', 'Measured tokens/second per instance');
    var util = n('targetUtilisation', 'Target utilisation', { fraction: true }), price = n('instancePricePerHour', 'Instance price per hour'), hours = n('hoursPerMonth', 'Hours per month', { max: 744, optional: true, def: 730 });
    var minInst = n('minInstances', 'Minimum instances (for availability)', { optional: true, int: true });
    if (errors.length) return fail(errors);
    if (tps <= 0 || util <= 0) return fail(['Tokens/second per instance and target utilisation must be greater than 0.']);
    var peakTps = rps * outTok, needed = Math.ceil(peakTps / (tps * util)), instances = Math.max(needed, minInst);
    var monthly = instances * price * hours;
    return { ok: true, errors: [], peakTokensPerSecond: peakTps, instancesForLoad: needed, instances: instances, perMonth: monthly,
      costPerMillionOutputTokensAtFullLoad: price / (tps * 3600) * 1e6,
      formulas: ['peak tokens/s = peak requests/s x output tokens per request', 'instances = ceil(peak tokens/s / (tokens/s per instance x target utilisation)), at least the minimum',
        'monthly = instances x price per hour x hours'] };
  }

  /* 7-9. Unit economics: per request, completed task, successful task, user, tenant, plus value. */
  function unitEconomics(inp) {
    var errors = [], n = reader(inp, errors);
    var cost = n('monthlyCost', 'Total monthly cost'), req = n('requests', 'Requests per month'), done = n('tasksCompleted', 'Tasks completed'), ok = n('tasksSuccessful', 'Tasks verified successful');
    var users = n('users', 'Active users', { optional: true }), tenants = n('tenants', 'Tenants', { optional: true }), value = n('valuePerSuccessfulTask', 'Business value per successful task', { optional: true });
    if (errors.length) return fail(errors);
    if (ok > done) return fail(['Successful tasks cannot exceed completed tasks.']);
    var valueTotal = ok * value;
    return { ok: true, errors: [], costPerRequest: div(cost, req), costPerCompletedTask: div(cost, done), costPerSuccessfulTask: div(cost, ok),
      costPer1kSuccessfulTasks: ok > 0 ? cost / ok * 1000 : null, costPerUser: div(cost, users), costPerTenant: div(cost, tenants),
      successRate: div(ok, done), valueTotal: valueTotal, netValue: valueTotal - cost, valueToCost: div(valueTotal, cost),
      formulas: ['cost per request = total cost / requests', 'cost per completed task = total cost / tasks completed',
        'cost per successful task = total cost / tasks verified successful (includes the cost of failed attempts)', 'net value = successful tasks x value per task - total cost'] };
  }

  /* 10. Optimisation scenario: levers applied one after another, each reducing the remaining cost.
     Percentages are the caller's assumptions, not measured savings. levers: [{name, reductionPct}] */
  function optimize(baselineMonthly, levers) {
    var errors = [];
    if (typeof baselineMonthly !== 'number' || !isFinite(baselineMonthly) || baselineMonthly < 0 || baselineMonthly > MAX) errors.push('Baseline monthly cost must be a number from 0 upward.');
    if (!Array.isArray(levers) || !levers.length) errors.push('Add at least one lever.');
    (levers || []).forEach(function (l, i) {
      if (typeof l.reductionPct !== 'number' || !isFinite(l.reductionPct) || l.reductionPct < 0 || l.reductionPct > 100) errors.push('Lever ' + (i + 1) + ' reduction must be between 0 and 100%.');
    });
    if (errors.length) return fail(errors);
    var remaining = baselineMonthly, steps = levers.map(function (l) {
      var saved = remaining * l.reductionPct / 100; remaining -= saved;
      return { name: l.name || 'Lever', reductionPct: l.reductionPct, saved: saved, remaining: remaining };
    });
    return { ok: true, errors: [], steps: steps, optimised: remaining, totalSaved: baselineMonthly - remaining, totalReductionPct: baselineMonthly > 0 ? (baselineMonthly - remaining) / baselineMonthly * 100 : 0,
      formulas: ['Each lever reduces the cost that remains after the previous lever (multiplicative), so overlapping levers are not double counted.', 'Reductions are assumptions to validate by measurement.'] };
  }

  /* 11. ROI and payback (plan §20.3).
     benefits: [{label, kind: 'cash'|'capacity'|'avoidance', monthlyValue}] at full adoption. */
  var BENEFIT_KINDS = ['cash', 'capacity', 'avoidance'];
  function roi(inp) {
    var errors = [], n = reader(inp, errors);
    var build = n('buildCost', 'Build cost'), change = n('changeCost', 'Change-management and training cost', { optional: true });
    var run = n('runCostMonthly', 'Run cost per month (infrastructure, models, data)'), maint = n('maintenanceMonthly', 'Maintenance per month', { optional: true }), review = n('humanReviewMonthly', 'Human review cost per month', { optional: true });
    var adoption = n('adoption', 'Steady-state adoption', { fraction: true }), ramp = n('rampMonths', 'Months to reach steady-state adoption', { optional: true, int: true, max: 60 });
    var risk = n('riskAdjustment', 'Benefit risk haircut', { fraction: true, optional: true });
    var costMult = n('costMultiplier', 'Cost multiplier', { optional: true, def: 1, max: 10 }), benMult = n('benefitMultiplier', 'Benefit multiplier', { optional: true, def: 1, max: 10 });
    var benefits = Array.isArray(inp && inp.benefits) ? inp.benefits : [];
    if (!benefits.length) errors.push('Add at least one benefit.');
    var warnings = [], labels = {};
    benefits.forEach(function (b, i) {
      if (!b || BENEFIT_KINDS.indexOf(b.kind) < 0) errors.push('Benefit ' + (i + 1) + ' needs a type (cash, capacity or avoidance).');
      var v = Number(b && b.monthlyValue);
      if (!isFinite(v) || v < 0 || v > MAX) errors.push('Benefit ' + (i + 1) + ' needs a monthly value of 0 or more.');
      var key = String((b && b.label) || '').trim().toLowerCase();
      if (key) { if (labels[key]) warnings.push('Benefit "' + b.label + '" is listed more than once. Check for double counting.'); labels[key] = 1; }
    });
    if (errors.length) return fail(errors);
    var upfront = (build + change) * costMult, recurring = (run + maint + review) * costMult;
    var all = 0, cash = 0;
    benefits.forEach(function (b) { var v = Number(b.monthlyValue) * benMult; all += v; if (b.kind === 'cash') cash += v; });
    function adoptionAt(m) { return ramp > 0 ? adoption * Math.min(1, m / ramp) : adoption; }
    var horizons = [12, 24, 36], out = {}, payback = null, cumAll = -upfront, cumCash = -upfront, cashPayback = null;
    var cumBenefit = 0, cumCostRec = 0, cumCashBenefit = 0, byMonth = {};
    for (var m = 1; m <= 120; m++) {
      var f = adoptionAt(m) * (1 - risk), b = all * f, cb = cash * f;
      cumAll += b - recurring; cumCash += cb - recurring; cumBenefit += b; cumCashBenefit += cb; cumCostRec += recurring;
      if (payback === null && cumAll >= 0) payback = m;
      if (cashPayback === null && cumCash >= 0) cashPayback = m;
      if (horizons.indexOf(m) > -1) {
        var totalCost = upfront + cumCostRec;
        byMonth[m] = { months: m, totalBenefit: cumBenefit, totalCost: totalCost, net: cumBenefit - totalCost, roiPct: totalCost > 0 ? (cumBenefit - totalCost) / totalCost * 100 : null,
          cashBenefit: cumCashBenefit, cashNet: cumCashBenefit - totalCost, cashRoiPct: totalCost > 0 ? (cumCashBenefit - totalCost) / totalCost * 100 : null };
      }
    }
    horizons.forEach(function (h) { out[h] = byMonth[h]; });
    if (cash < all) warnings.push('Only cash benefits reduce spend or add revenue. Capacity released and cost avoidance are not cash unless the freed capacity is redeployed or the avoided cost was budgeted.');
    return { ok: true, errors: [], warnings: warnings, upfront: upfront, recurringMonthly: recurring, steadyBenefitMonthly: all * adoption * (1 - risk), horizons: out, paybackMonth: payback, cashPaybackMonth: cashPayback,
      formulas: ['benefit in month m = sum of benefits x adoption(m) x (1 - risk haircut); adoption ramps linearly to steady state over the ramp months',
        'total cost = (build + change cost) + recurring monthly cost x months', 'ROI % = (total benefit - total cost) / total cost x 100',
        'payback month = first month where cumulative benefit minus total cost is zero or more (searched up to 120 months)'] };
  }

  /* Conservative / base / optimistic: same inputs with per-scenario overrides. */
  function roiScenarios(inp, overrides) {
    var names = ['conservative', 'base', 'optimistic'], out = {}, errors = [];
    names.forEach(function (k) {
      var o = (overrides && overrides[k]) || {}, merged = {};
      Object.keys(inp).forEach(function (x) { merged[x] = inp[x]; });
      Object.keys(o).forEach(function (x) { if (o[x] !== undefined && o[x] !== '') merged[x] = o[x]; });
      out[k] = roi(merged);
      if (!out[k].ok) out[k].errors.forEach(function (e) { errors.push(k + ': ' + e); });
    });
    return errors.length ? fail(errors) : { ok: true, errors: [], scenarios: out };
  }

  return { llmCost: llmCost, ragCost: ragCost, agentCost: agentCost, modelCompare: modelCompare, budgetFit: budgetFit, capacity: capacity, unitEconomics: unitEconomics,
    optimize: optimize, roi: roi, roiScenarios: roiScenarios, BENEFIT_KINDS: BENEFIT_KINDS, round: round };
});
