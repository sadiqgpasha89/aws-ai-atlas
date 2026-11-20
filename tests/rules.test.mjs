import test from 'node:test';
import assert from 'node:assert/strict';
import { rules, close } from './helpers.mjs';

const C = rules.DEFAULT_CRITERIA;
const all = (n) => Object.fromEntries(C.map((c) => [c.id, n]));

test('default model weights are 25/15/15/15/10/10/10 and sum to 100', () => {
  assert.deepEqual(C.map((c) => c.weight), [25, 15, 15, 15, 10, 10, 10]);
  assert.equal(rules.validateCriteria(C).ok, true);
});
test('weights that do not sum to 100 are rejected with the current sum', () => {
  const bad = rules.cloneCriteria(C); bad[0].weight = 30;
  const v = rules.validateCriteria(bad);
  assert.equal(v.ok, false); assert.match(v.errors[0], /105%/);
  assert.equal(rules.validateCriteria([]).ok, false);
  const dup = rules.cloneCriteria(C); dup[1].id = 'value';
  assert.equal(rules.validateCriteria(dup).ok, false);
  const neg = rules.cloneCriteria(C); neg[0].weight = -5; neg[1].weight = 45;
  assert.equal(rules.validateCriteria(neg).ok, false);
  assert.equal(rules.scoreUseCase(all(3), bad).total, null);   // invalid model never produces a score
});
test('scoring normalisation: all 5s with low risk is 100, all 1s is 0 except inverted risk', () => {
  const best = { ...all(5), risk: 1 }, worst = { ...all(1), risk: 5 };
  assert.ok(close(rules.scoreUseCase(best, C).total, 100));
  assert.ok(close(rules.scoreUseCase(worst, C).total, 0));
  // all 3s: every criterion normalises to 50 (risk 3 inverted is also 50)
  assert.ok(close(rules.scoreUseCase(all(3), C).total, 50));
});
test('higher risk lowers the score; breakdown contributions add to the total', () => {
  const lowRisk = rules.scoreUseCase({ ...all(4), risk: 1 }, C), highRisk = rules.scoreUseCase({ ...all(4), risk: 5 }, C);
  assert.ok(lowRisk.total > highRisk.total);
  assert.ok(close(lowRisk.total - highRisk.total, 10)); // 10% weight x (100 - 0)
  const sum = lowRisk.breakdown.reduce((a, b) => a + b.contribution, 0);
  assert.ok(close(sum, lowRisk.total));
  assert.equal(lowRisk.breakdown.find((b) => b.id === 'risk').normalized, 100);
});
test('missing criteria are NOT treated as zero', () => {
  const r = rules.scoreUseCase({ value: 5, strategic: 5 }, C);
  assert.equal(r.complete, false); assert.equal(r.total, null);
  assert.deepEqual(r.missing, ['feasibility', 'data', 'adoption', 'time', 'risk']);
  assert.equal(rules.scoreUseCase({ ...all(3), value: 7 }, C).complete, false);       // out of range
  assert.equal(rules.scoreUseCase({ ...all(3), value: 2.5 }, C).complete, false);     // not whole
});
test('custom weights change the result as expected', () => {
  const crit = rules.cloneCriteria(C).map((c) => ({ ...c, weight: c.id === 'value' ? 100 : 0 }));
  assert.ok(close(rules.scoreUseCase({ ...all(1), value: 5 }, crit).total, 100));
});
test('sensitivity ranks the heaviest criterion first and treats risk inversely', () => {
  const s = rules.sensitivity(all(3), C);
  assert.equal(s[0].id, 'value');
  assert.ok(close(s[0].ifHigher, 25 / 4)); assert.ok(close(s[0].ifLower, -25 / 4));
  const risk = s.find((x) => x.id === 'risk');
  assert.ok(risk.ifHigher < 0 && risk.ifLower > 0);
  assert.deepEqual(rules.sensitivity({ value: 3 }, C), []);
});
test('rankStability reports when ranks can change under weight shifts', () => {
  // A is much better on value, B on feasibility: close totals make rank unstable.
  const A = { id: 'a', scores: { value: 5, strategic: 3, feasibility: 2, data: 3, adoption: 3, time: 3, risk: 3 } };
  const B = { id: 'b', scores: { value: 3, strategic: 3, feasibility: 5, data: 3, adoption: 3, time: 3, risk: 3 } };
  const stab = rules.rankStability([A, B], C, 20);
  // totals: A = 58.75, B = 57.5 (A leads by 1.25). Moving 20 points off 'value' flips the order.
  assert.equal(stab.a.base, 1); assert.equal(stab.b.base, 2);
  assert.equal(stab.a.max, 2); assert.equal(stab.b.min, 1);
  const clear = rules.rankStability([{ id: 'x', scores: all(5) }, { id: 'y', scores: all(1) }], C, 5);
  assert.deepEqual(clear.x, { base: 1, min: 1, max: 1 });
  assert.equal(Object.keys(rules.rankStability([{ id: 'inc', scores: { value: 5 } }], C)).length, 0); // incomplete items are not ranked
});
test('value vs feasibility quadrants', () => {
  assert.equal(rules.quadrant({ value: 5, feasibility: 4, data: 4 }).name, 'Quick win');
  assert.equal(rules.quadrant({ value: 5, feasibility: 2, data: 2 }).name, 'Strategic bet');
  assert.equal(rules.quadrant({ value: 2, feasibility: 5, data: 5 }).name, 'Low-value fill-in');
  assert.equal(rules.quadrant({ value: 2, feasibility: 1, data: 2 }).name, 'Deprioritise');
  assert.equal(rules.quadrant({ value: 5 }), null);
});
test('lifecycle: allowed transitions, mandatory rationale for non-forward moves', () => {
  assert.equal(rules.checkTransition('Idea', 'Intake').ok, true);
  assert.equal(rules.checkTransition('Idea', 'Production').ok, false);
  assert.equal(rules.checkTransition('Pilot', 'Pilot').ok, false);
  assert.equal(rules.checkTransition('Pilot', 'POC').ok, false);                      // backward needs a note
  assert.equal(rules.checkTransition('Pilot', 'POC', 'Eval gate failed').ok, true);
  assert.equal(rules.checkTransition('Discovery', 'Sunset/Rejected', '   ').ok, false);
  assert.equal(rules.checkTransition('Discovery', 'Sunset/Rejected', 'No data access').ok, true);
  assert.equal(rules.checkTransition('Sunset/Rejected', 'Idea', 'Reopened').ok, true);
  assert.equal(rules.checkTransition('Sunset/Rejected', 'POC', 'x').ok, false);
  // every stage is reachable in a forward chain
  for (let i = 0; i < 6; i++) assert.equal(rules.checkTransition(rules.STAGES[i], rules.STAGES[i + 1]).ok, true);
});
test('risk score and severity thresholds', () => {
  assert.equal(rules.riskScore(5, 5), 25); assert.equal(rules.riskScore(0, 3), null); assert.equal(rules.riskScore(2.5, 3), null);
  assert.equal(rules.riskSeverity(15), 'Critical'); assert.equal(rules.riskSeverity(14), 'High'); assert.equal(rules.riskSeverity(10), 'High');
  assert.equal(rules.riskSeverity(9), 'Medium'); assert.equal(rules.riskSeverity(5), 'Medium'); assert.equal(rules.riskSeverity(4), 'Low'); assert.equal(rules.riskSeverity(null), null);
});
test('date helpers are timezone independent', () => {
  assert.equal(rules.daysBetween('2026-03-01', '2026-03-10'), 9);
  assert.equal(rules.addDays('2026-02-27', 3), '2026-03-02');
  assert.equal(rules.addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(rules.daysBetween('2026-12-31', '2027-01-01'), 1);
});
test('deriveHealth is a hint driven by records, not a replacement for status', () => {
  const p = { id: 'p1', status: 'Healthy', milestones: [{ id: 'm1', title: 'x', dueDate: '2026-03-01', done: false }, { id: 'm2', title: 'y', dueDate: '2026-03-02', done: true }] };
  const ctx = { today: '2026-03-10', risks: [], actions: [] };
  const h = rules.deriveHealth(p, ctx);
  assert.equal(h.derived, 'At Risk'); assert.equal(h.differs, true); assert.match(h.reasons[0], /1 overdue milestone/);
  const crit = rules.deriveHealth(p, { ...ctx, risks: [{ id: 'r', projectId: 'p1', status: 'Open', probability: 4, impact: 4 }] });
  assert.equal(crit.derived, 'Critical');
  const closed = rules.deriveHealth(p, { ...ctx, risks: [{ id: 'r', projectId: 'p1', status: 'Closed', probability: 5, impact: 5 }] });
  assert.equal(closed.derived, 'At Risk');
  assert.equal(rules.deriveHealth({ id: 'p2', status: 'Blocked', milestones: [] }, ctx).differs, false);
  assert.equal(rules.deriveHealth({ id: 'p3', status: 'Healthy', milestones: [] }, ctx).derived, 'Healthy');
});
