import test from 'node:test';
import assert from 'node:assert/strict';
import { calc, close } from './helpers.mjs';

test('llmCost: known value, per request and per month', () => {
  // 1000 in @ $3/M + 500 out @ $15/M = 0.003 + 0.0075 = 0.0105 per request
  const r = calc.llmCost({ requests: 1_000_000, inputTokens: 1000, outputTokens: 500, inputPrice: 3, outputPrice: 15 });
  assert.equal(r.ok, true);
  assert.ok(close(r.perRequest, 0.0105));
  assert.ok(close(r.perMonth, 10500));
  assert.ok(close(r.breakdown.input, 3000) && close(r.breakdown.output, 7500));
});
test('llmCost: cache hits and retries', () => {
  // input part = 1000*0.5*3/1e6 + 1000*0.5*0.3/1e6 = 0.00165 ; output 0.0075 ; base 0.00915 ; retry 10% => 0.010065
  const r = calc.llmCost({ requests: 100, inputTokens: 1000, outputTokens: 500, inputPrice: 3, outputPrice: 15, cacheHitRate: 0.5, cachedInputPrice: 0.3, retryRate: 0.1 });
  assert.ok(close(r.perRequest, 0.010065));
  assert.ok(close(r.breakdown.retries, 0.000915 * 100, 1e-9));
});
test('llmCost: invalid, empty, negative and extreme input never yields NaN', () => {
  for (const bad of [{}, { requests: -1, inputTokens: 1, outputTokens: 1, inputPrice: 1, outputPrice: 1 },
    { requests: 'abc', inputTokens: 1, outputTokens: 1, inputPrice: 1, outputPrice: 1 },
    { requests: 1e20, inputTokens: 1, outputTokens: 1, inputPrice: 1, outputPrice: 1 },
    { requests: 1, inputTokens: 1, outputTokens: 1, inputPrice: 1, outputPrice: 1, cacheHitRate: 1.5 },
    { requests: Infinity, inputTokens: 1, outputTokens: 1, inputPrice: 1, outputPrice: 1 }]) {
    const r = calc.llmCost(bad);
    assert.equal(r.ok, false); assert.ok(r.errors.length > 0); assert.equal(r.perMonth, undefined);
  }
  // an unparsable OPTIONAL field is an error, not a silent default
  assert.equal(calc.llmCost({ requests: 1, inputTokens: 1, outputTokens: 1, inputPrice: 1, outputPrice: 1, retryRate: 'oops' }).ok, false);
  // numeric strings from form fields are accepted
  assert.equal(calc.llmCost({ requests: '10', inputTokens: '100', outputTokens: '10', inputPrice: '1', outputPrice: '2' }).ok, true);
});
test('ragCost: components add up', () => {
  const r = calc.ragCost({ documents: 10000, tokensPerDocument: 2000, embeddingPrice: 0.1, monthlyReingestFraction: 0.1, vectorStorageGB: 50, storagePricePerGBMonth: 0.2,
    queriesPerMonth: 100000, searchPricePer1kQueries: 0.5, rerankPricePer1kQueries: 1, inputTokens: 3000, outputTokens: 300, inputPrice: 3, outputPrice: 15 });
  assert.equal(r.ok, true);
  assert.ok(close(r.oneTimeIngestion, 2));            // 10000*2000*0.1/1e6
  assert.ok(close(r.parts.reembedding, 0.2));
  assert.ok(close(r.parts.storage, 10));
  assert.ok(close(r.parts.retrieval, 50)); assert.ok(close(r.parts.rerank, 100));
  assert.ok(close(r.parts.generation, 100000 * (3000 * 3 + 300 * 15) / 1e6)); // 1350
  assert.ok(close(r.perMonth, 0.2 + 10 + 50 + 100 + 1350));
  assert.ok(close(r.perQuery, r.perMonth / 100000));
});
test('agentCost: cost per successful task includes failed attempts', () => {
  // per attempt: 5 calls * (2000*3+500*15)/1e6 = 5*0.0135 = 0.0675 ; tools 4*0.001 = 0.004 => 0.0715
  const r = calc.agentCost({ tasksPerMonth: 1000, modelCallsPerTask: 5, inputTokensPerCall: 2000, outputTokensPerCall: 500, inputPrice: 3, outputPrice: 15,
    toolCallsPerTask: 4, costPerToolCall: 0.001, successRate: 0.8 });
  assert.ok(close(r.perAttempt, 0.0715));
  assert.ok(close(r.perMonth, 71.5));
  assert.ok(close(r.successfulTasks, 800));
  assert.ok(close(r.perSuccessfulTask, 71.5 / 800));         // = perAttempt / successRate
  assert.ok(close(r.perSuccessfulTask, 0.0715 / 0.8));
  assert.ok(close(r.wastedOnFailures, 200 * 0.0715));
  const retry = calc.agentCost({ tasksPerMonth: 10, modelCallsPerTask: 1, inputTokensPerCall: 1000000, outputTokensPerCall: 0, inputPrice: 1, outputPrice: 0, retryRate: 0.5, successRate: 1 });
  assert.ok(close(retry.perAttempt, 1.5));
  assert.equal(calc.agentCost({ tasksPerMonth: 1, modelCallsPerTask: 1, inputTokensPerCall: 1, outputTokensPerCall: 1, inputPrice: 1, outputPrice: 1, successRate: 0 }).ok, false);
});
test('modelCompare ranks by cost under identical usage', () => {
  const r = calc.modelCompare({ requests: 1000, inputTokens: 1000, outputTokens: 1000 }, [
    { name: 'A', inputPrice: 1, outputPrice: 5 }, { name: 'B', inputPrice: 3, outputPrice: 15 }]);
  assert.equal(r.ok, true); assert.equal(r.cheapest, 'A');
  assert.ok(close(r.rows[0].perMonth, 6)); assert.ok(close(r.rows[1].perMonth, 18)); assert.ok(close(r.rows[1].vsCheapest, 3));
  assert.equal(calc.modelCompare({ requests: 1 }, [{ name: 'only' }]).ok, false);
});
test('budgetFit and capacity', () => {
  const b = calc.budgetFit({ monthlyBudget: 1000, costPerRequest: 0.01, plannedRequests: 50000 });
  assert.ok(close(b.maxRequests, 100000)); assert.ok(close(b.utilisation, 0.5)); assert.ok(close(b.headroomRequests, 50000));
  assert.equal(calc.budgetFit({ monthlyBudget: 1, costPerRequest: 0 }).ok, false);
  // 20 rps * 400 tokens = 8000 tok/s ; per instance 2500 tok/s at 70% => 1750 ; ceil(8000/1750)=5 ; min 2 -> 5
  const c = calc.capacity({ peakRequestsPerSecond: 20, outputTokensPerRequest: 400, tokensPerSecondPerInstance: 2500, targetUtilisation: 0.7, instancePricePerHour: 10, minInstances: 2 });
  assert.equal(c.instancesForLoad, 5); assert.equal(c.instances, 5);
  assert.ok(close(c.perMonth, 5 * 10 * 730));
  assert.equal(calc.capacity({ peakRequestsPerSecond: 1, outputTokensPerRequest: 1, tokensPerSecondPerInstance: 100, targetUtilisation: 0.5, instancePricePerHour: 1, minInstances: 3 }).instances, 3);
  assert.equal(calc.capacity({ peakRequestsPerSecond: 1, outputTokensPerRequest: 1, tokensPerSecondPerInstance: 0, targetUtilisation: 0.5, instancePricePerHour: 1 }).ok, false);
});
test('unitEconomics distinguishes request, completed, successful, user and tenant cost', () => {
  const u = calc.unitEconomics({ monthlyCost: 10000, requests: 500000, tasksCompleted: 40000, tasksSuccessful: 32000, users: 800, tenants: 4, valuePerSuccessfulTask: 1 });
  assert.ok(close(u.costPerRequest, 0.02)); assert.ok(close(u.costPerCompletedTask, 0.25)); assert.ok(close(u.costPerSuccessfulTask, 0.3125));
  assert.ok(close(u.costPer1kSuccessfulTasks, 312.5)); assert.ok(close(u.costPerUser, 12.5)); assert.ok(close(u.costPerTenant, 2500));
  assert.ok(close(u.successRate, 0.8)); assert.ok(close(u.netValue, 22000)); assert.ok(close(u.valueToCost, 3.2));
  assert.equal(calc.unitEconomics({ monthlyCost: 1, requests: 1, tasksCompleted: 5, tasksSuccessful: 6 }).ok, false);
  const zero = calc.unitEconomics({ monthlyCost: 100, requests: 0, tasksCompleted: 0, tasksSuccessful: 0 });
  assert.equal(zero.costPerRequest, null); assert.equal(zero.costPerSuccessfulTask, null);  // no divide-by-zero / Infinity
});
test('optimize applies levers multiplicatively', () => {
  const r = calc.optimize(10000, [{ name: 'Caching', reductionPct: 20 }, { name: 'Routing', reductionPct: 25 }]);
  assert.ok(close(r.optimised, 6000)); assert.ok(close(r.totalSaved, 4000)); assert.ok(close(r.totalReductionPct, 40));
  assert.equal(calc.optimize(100, [{ name: 'x', reductionPct: 120 }]).ok, false);
  assert.equal(calc.optimize(-5, [{ name: 'x', reductionPct: 10 }]).ok, false);
});
const roiBase = { buildCost: 120000, runCostMonthly: 2000, maintenanceMonthly: 1000, humanReviewMonthly: 1000, adoption: 1, riskAdjustment: 0, rampMonths: 0,
  benefits: [{ label: 'Handling time', kind: 'cash', monthlyValue: 10000 }] };
test('roi: known 12/24/36 month results and payback', () => {
  const r = calc.roi(roiBase);
  assert.equal(r.ok, true);
  assert.equal(r.paybackMonth, 20);
  assert.ok(close(r.horizons[12].totalCost, 168000)); assert.ok(close(r.horizons[12].net, -48000)); assert.ok(close(r.horizons[12].roiPct, -48000 / 168000 * 100));
  assert.ok(close(r.horizons[24].net, 24000)); assert.ok(close(r.horizons[24].roiPct, 24000 / 216000 * 100));
  assert.ok(close(r.horizons[36].net, 96000)); assert.ok(close(r.horizons[36].roiPct, 96000 / 264000 * 100));
});
test('roi: ramp, risk haircut and capacity-vs-cash distinction', () => {
  const r = calc.roi({ ...roiBase, adoption: 0.5, riskAdjustment: 0.2, rampMonths: 4,
    benefits: [{ label: 'Cash savings', kind: 'cash', monthlyValue: 10000 }, { label: 'Hours freed', kind: 'capacity', monthlyValue: 10000 }] });
  // steady benefit/month = 20000 * 0.5 * 0.8 = 8000 ; months 1..4 ramp 25/50/75/100% of that ; months 5..12 full
  const benefit12 = 8000 * (0.25 + 0.5 + 0.75 + 1) + 8000 * 8;
  assert.ok(close(r.horizons[12].totalBenefit, benefit12));
  assert.ok(close(r.horizons[12].cashBenefit, benefit12 / 2));
  assert.ok(r.horizons[12].cashRoiPct < r.horizons[12].roiPct);          // capacity is not cash
  assert.ok(r.warnings.some((w) => /capacity/i.test(w)));
  assert.ok(close(r.steadyBenefitMonthly, 8000));
});
test('roi: never pays back, validation and double-count warning', () => {
  assert.equal(calc.roi({ ...roiBase, benefits: [{ label: 'x', kind: 'cash', monthlyValue: 100 }] }).paybackMonth, null);
  assert.equal(calc.roi({ ...roiBase, benefits: [] }).ok, false);
  assert.equal(calc.roi({ ...roiBase, adoption: 1.5 }).ok, false);
  assert.equal(calc.roi({ ...roiBase, benefits: [{ label: 'x', kind: 'magic', monthlyValue: 1 }] }).ok, false);
  const dup = calc.roi({ ...roiBase, benefits: [{ label: 'Time saved', kind: 'cash', monthlyValue: 1 }, { label: 'time saved', kind: 'capacity', monthlyValue: 1 }] });
  assert.ok(dup.warnings.some((w) => /double counting/i.test(w)));
});
test('roiScenarios applies overrides per scenario', () => {
  const s = calc.roiScenarios(roiBase, { conservative: { benefitMultiplier: 0.5, costMultiplier: 1.2 }, optimistic: { benefitMultiplier: 1.5 } });
  assert.equal(s.ok, true);
  assert.ok(s.scenarios.conservative.horizons[24].net < s.scenarios.base.horizons[24].net);
  assert.ok(s.scenarios.optimistic.horizons[24].net > s.scenarios.base.horizons[24].net);
  assert.ok(close(s.scenarios.base.horizons[24].net, 24000));
});
