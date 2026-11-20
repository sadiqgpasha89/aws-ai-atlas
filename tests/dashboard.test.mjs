import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { dashboard, store as S, close } from './helpers.mjs';

const ctx = { window: {} }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL('../data/demo.js', import.meta.url), 'utf8'), ctx, { filename: 'demo.js' });
const TODAY = '2026-03-10';
const sample = () => JSON.parse(JSON.stringify(ctx.ATLAS.demo.build(TODAY)));   // clone out of the vm realm

test('sample fixture passes the same validation as user data (no skipped records)', () => {
  const res = S.cleanWorkspace({ app: S.APP_ID, schemaVersion: 1, ...sample() });
  assert.deepEqual(res.problems, []);
  assert.equal(res.clean.projects.length, 6); assert.equal(res.clean.risks.length, 5); assert.equal(res.clean.decisions.length, 2); assert.equal(res.clean.actions.length, 4);
  const st = S.createSampleStore(sample());
  assert.equal(st.count('projects'), 6); assert.equal(st.status.notice, null);
});
test('fixture contains no real-looking secrets, urls or named organisations', () => {
  const text = JSON.stringify(sample());
  assert.doesNotMatch(text, /AKIA|BEGIN .*KEY|https?:\/\//);
});
test('summary numbers match the hand-computed values for the fixture', () => {
  const s = dashboard.summarize(sample(), { today: TODAY, windowDays: 14 });
  assert.equal(s.portfolio.active, 5);                                   // p6 is Sunset/Rejected
  assert.equal(s.portfolio.byStage['Sunset/Rejected'], 1); assert.equal(s.portfolio.byStage.Pilot, 1);
  assert.equal(s.delivery.overdueMilestones.length, 3);
  assert.deepEqual(s.delivery.overdueMilestones.map((m) => m.daysOverdue), [14, 6, 3]);   // sorted worst first
  assert.equal(s.delivery.upcomingMilestones.length, 2);                 // +9 and +14 (inclusive); +20 and +25 are outside the window
  assert.deepEqual(s.delivery.blocked, ['sample-p3']);
  assert.deepEqual(s.risks.critical, ['sample-r1']); assert.deepEqual(s.risks.high, ['sample-r3']);
  assert.equal(s.risks.open.length, 4);                                  // r5 is Accepted
  assert.deepEqual(s.risks.overdueMitigations.sort(), ['sample-r3', 'sample-r4']);
  assert.deepEqual(s.risks.reviewDue.sort(), ['sample-r1', 'sample-r5']);
  assert.deepEqual(s.actions.overdue, ['sample-a1']); assert.equal(s.actions.open.length, 3); assert.equal(s.actions.dueSoon.length, 2);
  assert.deepEqual(s.decisions.pending, ['sample-d1']); assert.deepEqual(s.decisions.reviewDue, ['sample-d2']);
  assert.equal(s.cost.buildEstimate, 565000); assert.equal(s.cost.runEstimateMonthly, 19700); assert.equal(s.cost.forecastBenefitMonthly, 76000);
  assert.equal(s.cost.realizedBenefitMonthly, 25500); assert.equal(s.cost.forecastForRealized, 37000);
  assert.ok(close(s.cost.realizedVsForecastPct, 25500 / 37000 * 100)); assert.equal(s.cost.projectsWithRealized, 2);
  assert.equal(s.empty, false);
});
test('window changes what counts as upcoming and due soon', () => {
  const narrow = dashboard.summarize(sample(), { today: TODAY, windowDays: 7 });
  assert.equal(narrow.delivery.upcomingMilestones.length, 0); assert.equal(narrow.actions.dueSoon.length, 2);   // milestones are at +9 and +14 days
  const wide = dashboard.summarize(sample(), { today: TODAY, windowDays: 30 });
  assert.equal(wide.delivery.upcomingMilestones.length, 4);
  assert.equal(narrow.delivery.overdueMilestones.length, wide.delivery.overdueMilestones.length);   // overdue is not window dependent
});
test('every KPI is traceable: its ids exist in the workspace and its link resolves to a filtered view', () => {
  const ws = sample(), s = dashboard.summarize(ws, { today: TODAY });
  const known = new Set([...ws.projects, ...ws.risks, ...ws.actions, ...ws.decisions].map((x) => x.id).concat(ws.projects.flatMap((p) => p.milestones.map((m) => m.id))));
  for (const k of s.kpis) {
    assert.match(k.href, /^#\/(portfolio|registers)/); k.ids.forEach((id) => assert.ok(known.has(id), `${k.id}: unknown id ${id}`));
    assert.equal(typeof k.value, 'number');
  }
  assert.equal(s.kpis.find((k) => k.id === 'overdue').value, s.delivery.overdueMilestones.length);
  assert.equal(s.kpis.find((k) => k.id === 'risks').value, s.risks.critical.length + s.risks.high.length);
});
test('attention list is deterministic, ordered by severity and links back to a source record', () => {
  const a = dashboard.summarize(sample(), { today: TODAY }), b = dashboard.summarize(sample(), { today: TODAY });
  assert.deepEqual(a.attention, b.attention);
  assert.equal(a.attention.length, 13);
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  for (let i = 1; i < a.attention.length; i++) assert.ok(order[a.attention[i - 1].severity] <= order[a.attention[i].severity]);
  assert.deepEqual(a.attention.filter((x) => x.severity === 'critical').map((x) => x.source.id).sort(), ['sample-p3', 'sample-r1']);
  a.attention.forEach((x) => { assert.ok(x.href.startsWith('#/')); assert.ok(x.source.id); });
  assert.ok(a.attention.some((x) => /Health check: Support assistant/.test(x.title) && /Critical/.test(x.detail)));   // recorded At Risk, records suggest Critical
});
test('stage/status scope filters every section consistently', () => {
  const s = dashboard.summarize(sample(), { today: TODAY, stage: 'Pilot' });
  assert.equal(s.scope.projectCount, 1); assert.equal(s.portfolio.active, 1);
  assert.deepEqual(s.delivery.overdueMilestones.map((m) => m.projectId), ['sample-p1']);
  assert.deepEqual(s.risks.open.sort(), ['sample-r1', 'sample-r2', 'sample-r4']);
  assert.deepEqual(s.actions.overdue, ['sample-a1']); assert.equal(s.decisions.pending.length, 1);
  const none = dashboard.summarize(sample(), { today: TODAY, status: 'Critical' });
  assert.equal(none.portfolio.active, 0); assert.equal(none.attention.length, 0);
});
test('archived projects are excluded and an empty workspace reports empty without errors', () => {
  const ws = sample(); ws.projects[0].archived = true;
  assert.equal(dashboard.summarize(ws, { today: TODAY }).portfolio.active, 4);
  assert.equal(dashboard.summarize(ws, { today: TODAY }).scope.archivedExcluded, 1);
  const e = dashboard.summarize({ projects: [], risks: [], actions: [], decisions: [] }, { today: TODAY });
  assert.equal(e.empty, true); assert.equal(e.attention.length, 0); assert.equal(e.cost.realizedVsForecastPct, null);
  e.kpis.forEach((k) => assert.equal(k.value, 0));
});
test('dashboard reflects record changes (add, update)', () => {
  const st = S.createStore({ adapter: S.memoryAdapter(), now: () => '2026-03-10T09:00:00.000Z' });
  const sum = () => dashboard.summarize(st.snapshot(), { today: TODAY });
  assert.equal(sum().kpis[0].value, 0);
  st.add('projects', { name: 'P', stage: 'POC', status: 'Healthy', milestones: [{ id: 'm1', title: 'Due', dueDate: '2026-03-01', done: false }] });
  assert.equal(sum().kpis[0].value, 1); assert.equal(sum().delivery.overdueMilestones.length, 1);
  const id = st.list('projects')[0].id;
  st.update('projects', id, { milestones: [{ id: 'm1', title: 'Due', dueDate: '2026-03-01', done: true }] });
  assert.equal(sum().delivery.overdueMilestones.length, 0);
  st.add('risks', { title: 'Big', probability: 5, impact: 5, status: 'Open', projectId: id });
  assert.equal(sum().risks.critical.length, 1); assert.equal(sum().attention[0].severity, 'critical');
});
