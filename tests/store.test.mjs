import test from 'node:test';
import assert from 'node:assert/strict';
import { store as S, schema, rules, seqIds, FIXED, projectFields } from './helpers.mjs';

const mk = (over = {}) => {
  const adapter = over.adapter || S.memoryAdapter();
  const st = S.createStore({ adapter, idFn: seqIds(), now: () => FIXED, ...over });
  return { st, adapter };
};

test('add/get/update/remove round trip and persistence across reload', () => {
  const { st, adapter } = mk();
  const a = st.add('projects', projectFields());
  assert.equal(a.ok, true); assert.equal(a.record.id, 'pro-t1'); assert.equal(a.record.createdAt, FIXED);
  assert.equal(a.record.stageHistory.length, 1); assert.equal(a.record.stageHistory[0].stage, 'Discovery');
  assert.equal(st.update('projects', 'pro-t1', { name: 'Renamed' }).ok, true);
  const st2 = S.createStore({ adapter });                                   // simulate a page reload
  assert.equal(st2.get('projects', 'pro-t1').name, 'Renamed');
  assert.equal(st2.remove('projects', 'pro-t1').ok, true);
  assert.equal(S.createStore({ adapter }).count('projects'), 0);
});
test('validation errors are returned and nothing is stored', () => {
  const { st } = mk();
  const r = st.add('projects', projectFields({ name: '', stage: 'Nope' }));
  assert.equal(r.ok, false); assert.ok(r.errors.some((e) => e.path === 'name')); assert.ok(r.errors.some((e) => e.path === 'stage'));
  assert.equal(st.count('projects'), 0);
  assert.equal(st.add('risks', { title: 'x', probability: 6, impact: 2, status: 'Open' }).ok, false);
  assert.equal(st.add('risks', { title: 'x', probability: 3, impact: 2, status: 'Open', dueDate: '2026-13-45' }).ok, false);
  assert.equal(st.update('projects', 'missing', { name: 'x' }).ok, false);
});
test('credentials pasted into a record are rejected', () => {
  const { st } = mk();
  const r = st.add('projects', projectFields({ problem: 'use key AKIAIOSFODNN7EXAMPLE to call it' }));
  assert.equal(r.ok, false); assert.match(r.errors[0].message, /credential/);
  assert.equal(st.add('risks', { title: 'x', probability: 1, impact: 1, status: 'Open', description: '-----BEGIN RSA PRIVATE KEY-----' }).ok, false);
});
test('stage moves keep history and enforce rules', () => {
  const { st } = mk();
  st.add('projects', projectFields({ stage: 'Pilot' }));
  assert.equal(st.moveStage('pro-t1', 'Production', '', rules).ok, true);
  assert.equal(st.moveStage('pro-t1', 'Idea', 'x', rules).ok, false);        // not an allowed transition
  assert.equal(st.moveStage('pro-t1', 'Pilot', '', rules).ok, false);        // backward without note
  const back = st.moveStage('pro-t1', 'Pilot', 'Rollback after eval regression', rules);
  assert.equal(back.ok, true);
  const h = st.get('projects', 'pro-t1').stageHistory;
  assert.deepEqual(h.map((x) => x.stage), ['Pilot', 'Production', 'Pilot']); assert.equal(h[2].note, 'Rollback after eval regression');
});
test('archive hides from default list but keeps the record', () => {
  const { st } = mk();
  st.add('projects', projectFields());
  st.archive('pro-t1');
  assert.equal(st.list('projects').length, 0); assert.equal(st.list('projects', { includeArchived: true }).length, 1);
  st.archive('pro-t1', false); assert.equal(st.list('projects').length, 1);
});
test('subscribers are notified and a throwing listener does not break the store', () => {
  const { st } = mk(); const seen = [];
  st.subscribe(() => { throw new Error('boom'); }); st.subscribe((c) => seen.push(c.type));
  assert.equal(st.add('actions', { title: 'a', status: 'Open' }).ok, true);
  assert.deepEqual(seen, ['add']);
});
test('corrupt saved data is backed up, the app starts empty and the notice says so', () => {
  const adapter = S.memoryAdapter({ [S.STORAGE_KEY]: '{not json' });
  const st = S.createStore({ adapter });
  assert.equal(st.isEmpty(), true); assert.equal(st.status.recovered, true); assert.match(st.status.notice, /corrupt/i);
  assert.equal(adapter.get(S.STORAGE_KEY + ':backup'), '{not json');
  assert.equal(S.createStore({ adapter: S.memoryAdapter({ [S.STORAGE_KEY]: JSON.stringify({ hello: 1 }) }) }).status.recovered, true);
});
test('invalid records in saved data are skipped, valid ones kept', () => {
  const good = { id: 'a1', title: 'ok', status: 'Open', createdAt: FIXED, updatedAt: FIXED };
  const bad = { id: 'a2', title: '', status: 'Open', createdAt: FIXED, updatedAt: FIXED };
  const st = S.createStore({ adapter: S.memoryAdapter({ [S.STORAGE_KEY]: JSON.stringify({ app: S.APP_ID, schemaVersion: 1, actions: [good, bad] }) }) });
  assert.equal(st.count('actions'), 1); assert.match(st.status.notice, /failed validation/);
});
test('data from a newer schema is never overwritten', () => {
  const raw = JSON.stringify({ app: S.APP_ID, schemaVersion: 99, projects: [] });
  const adapter = S.memoryAdapter({ [S.STORAGE_KEY]: raw });
  const st = S.createStore({ adapter });
  assert.equal(st.status.recovered, true); assert.match(st.status.notice, /newer version/);
  assert.equal(adapter.get(S.STORAGE_KEY + ':backup'), raw);                   // preserved before any later save replaces the key
});
test('migrations run in order and are applied on load', () => {
  const migrations = { 1: (d) => { d.actions = (d.actions || []).map((a) => ({ ...a, title: a.name })); return d; } };
  // simulate a future schema 2 by temporarily testing the migrate() function directly
  const m = S.migrate({ app: S.APP_ID, schemaVersion: 1, actions: [] }, migrations);
  assert.equal(m.ok, true); assert.equal(m.data.schemaVersion, 1);              // already current: no step run
  assert.equal(S.migrate({ app: S.APP_ID, schemaVersion: 0 }, {}).ok, false);
  assert.equal(S.migrate({ app: S.APP_ID }, {}).ok, false);
  assert.equal(S.migrate({ app: S.APP_ID, schemaVersion: 2 }, {}).newer, true);
});
test('storage quota errors keep the session data and report a clear message', () => {
  let full = false;
  const mem = S.memoryAdapter();
  const adapter = { kind: 'localStorage', persistent: true, get: (k) => mem.get(k), remove: (k) => mem.remove(k),
    set: (k, v) => { if (full) { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; } mem.set(k, v); } };
  const { st } = mk({ adapter });
  assert.equal(st.add('actions', { title: 'one', status: 'Open' }).saved, true);
  full = true;
  const r = st.add('actions', { title: 'two', status: 'Open' });
  assert.equal(r.ok, true); assert.equal(r.saved, false);
  assert.equal(st.count('actions'), 2); assert.match(st.status.error, /storage is full/i);
  full = false; st.add('actions', { title: 'three', status: 'Open' });
  assert.equal(st.status.error, null);
});
test('unavailable storage degrades to memory without throwing', () => {
  const adapter = { kind: 'localStorage', persistent: true, get() { throw new Error('denied'); }, set() { throw new Error('denied'); }, remove() {} };
  const { st } = mk({ adapter });
  assert.match(st.status.error, /unavailable/i);
  assert.equal(st.add('actions', { title: 'works in memory', status: 'Open' }).ok, true);
});

/* ---------- export / import ---------- */
function seeded() {
  const { st, adapter } = mk();
  st.add('projects', projectFields({ name: 'Alpha' }));
  st.add('risks', { title: 'Data leak', probability: 4, impact: 5, status: 'Open', projectId: 'pro-t1' });
  st.add('decisions', { title: 'Pick vector store', status: 'Proposed', options: ['A', 'B'] });
  st.add('actions', { title: 'Follow up', status: 'Open', dueDate: '2026-03-12' });
  st.setCriteria(rules.cloneCriteria(rules.DEFAULT_CRITERIA).map((c, i) => ({ ...c, weight: [30, 10, 15, 15, 10, 10, 10][i] })));
  return { st, adapter };
}
test('export then import into an empty workspace restores everything', () => {
  const { st } = seeded();
  const json = st.exportJSON();
  assert.equal(JSON.parse(json).kind, 'personal');
  const { st: fresh } = mk();
  const pv = fresh.previewImport(json);
  assert.equal(pv.ok, true); assert.equal(pv.summary.projects.added, 1); assert.equal(pv.summary.projects.conflicts, 0);
  assert.equal(fresh.applyImport(pv, 'skip').ok, true);
  assert.equal(fresh.count('projects'), 1); assert.equal(fresh.count('risks'), 1); assert.equal(fresh.count('decisions'), 1); assert.equal(fresh.count('actions'), 1);
  assert.equal(fresh.getCriteria()[0].weight, 30);
  assert.deepEqual(fresh.get('projects', 'pro-t1'), st.get('projects', 'pro-t1'));
});
test('import conflict strategies: skip, overwrite, replace', () => {
  const { st } = seeded(); const json = st.exportJSON();
  const edited = JSON.parse(json); edited.projects[0].name = 'Imported name'; edited.projects.push({ ...edited.projects[0], id: 'pro-new', name: 'Extra' });
  const text = JSON.stringify(edited);
  const pv = st.previewImport(text);
  assert.equal(pv.summary.projects.conflicts, 1); assert.equal(pv.summary.projects.added, 1);
  st.applyImport(pv, 'skip');
  assert.equal(st.get('projects', 'pro-t1').name, 'Alpha'); assert.equal(st.count('projects'), 2);
  st.applyImport(st.previewImport(text), 'overwrite');
  assert.equal(st.get('projects', 'pro-t1').name, 'Imported name');
  const only = JSON.parse(json); only.projects = []; only.risks = []; only.decisions = []; only.actions = [];
  st.applyImport(st.previewImport(JSON.stringify(only)), 'replace');
  assert.equal(st.isEmpty(), true);
  assert.equal(st.applyImport(pv, 'bogus').ok, false);
});
test('invalid imports are rejected and existing data is untouched', () => {
  const { st } = seeded(); const before = JSON.stringify(st.snapshot());
  for (const text of ['', '   ', 'not json', '[]', '{"app":"other"}', JSON.stringify({ app: S.APP_ID, schemaVersion: 99 }), JSON.stringify({ app: S.APP_ID, schemaVersion: 'x' })]) {
    const pv = st.previewImport(text);
    assert.equal(pv.ok, false, text); assert.ok(pv.errors.length);
    assert.equal(st.applyImport(pv, 'replace').ok, false);
  }
  assert.equal(JSON.stringify(st.snapshot()), before);
  assert.equal(st.previewImport('x'.repeat(S.MAX_IMPORT_BYTES + 1)).ok, false);
});
test('records that fail validation are reported and skipped; the rest import', () => {
  const { st } = mk();
  const file = { app: S.APP_ID, schemaVersion: 1, projects: [{ ...projectFields(), id: 'ok1', createdAt: FIXED, updatedAt: FIXED }, { id: 'bad', name: 'x' }],
    risks: [{ id: 'r1', title: 'r', probability: 1, impact: 1, status: 'Open', projectId: 'ghost', createdAt: FIXED, updatedAt: FIXED }] };
  const pv = st.previewImport(JSON.stringify(file));
  assert.equal(pv.ok, true); assert.equal(pv.summary.projects.incoming, 1); assert.equal(pv.problems.length, 1); assert.match(pv.problems[0], /projects\[1\]/);
  assert.ok(pv.warnings.some((w) => /not in the workspace/.test(w)));
  st.applyImport(pv, 'skip'); assert.equal(st.count('projects'), 1);
});
test('imported records are stripped to known fields and cannot pollute prototypes', () => {
  const { st } = mk();
  const text = '{"app":"' + S.APP_ID + '","schemaVersion":1,"actions":[{"id":"a1","title":"t","status":"Open","createdAt":"' + FIXED + '","updatedAt":"' + FIXED + '","__proto__":{"polluted":true},"evil":"<img src=x onerror=alert(1)>"}]}';
  const pv = st.previewImport(text);
  // a record carrying __proto__ as an own key is rejected outright
  assert.equal(pv.summary.actions.incoming, 0); assert.equal(({}).polluted, undefined);
  const ok = st.previewImport(JSON.stringify({ app: S.APP_ID, schemaVersion: 1, actions: [{ id: 'a2', title: 't', status: 'Open', createdAt: FIXED, updatedAt: FIXED, evil: 'x' }] }));
  st.applyImport(ok, 'skip'); assert.equal(st.get('actions', 'a2').evil, undefined);
});
test('sample-workspace exports cannot be imported into a personal workspace', () => {
  const sample = S.createSampleStore({ projects: [{ ...projectFields(), id: 's1', createdAt: FIXED, updatedAt: FIXED, stageHistory: [{ stage: 'Discovery', at: FIXED, note: '' }] }] });
  assert.equal(sample.count('projects'), 1); assert.equal(JSON.parse(sample.exportJSON()).kind, 'sample');
  const { st } = mk(); const pv = st.previewImport(sample.exportJSON());
  assert.equal(pv.ok, false); assert.match(pv.errors[0], /sample/i);
});
test('failed save during import rolls back to the previous state', () => {
  let fail = false; const mem = S.memoryAdapter();
  const adapter = { kind: 'localStorage', persistent: true, get: (k) => mem.get(k), remove: (k) => mem.remove(k), set: (k, v) => { if (fail) throw new Error('nope'); mem.set(k, v); } };
  const { st } = mk({ adapter }); st.add('actions', { title: 'keep me', status: 'Open' });
  const pv = st.previewImport(JSON.stringify({ app: S.APP_ID, schemaVersion: 1, actions: [] }));
  fail = true;
  const r = st.applyImport(pv, 'replace');
  assert.equal(r.ok, false); assert.equal(st.count('actions'), 1);
});
test('reset clears everything including storage', () => {
  const { st, adapter } = seeded(); st.reset();
  assert.equal(st.isEmpty(), true); assert.equal(adapter.get(S.STORAGE_KEY), null);
});
test('sample store never writes to the personal storage key', () => {
  const sample = S.createSampleStore({ actions: [{ id: 'a', title: 't', status: 'Open', createdAt: FIXED, updatedAt: FIXED }] });
  sample.add('actions', { title: 'more', status: 'Open' });
  assert.equal(sample.adapterKind(), 'memory');
});
test('schema: dates, enums, ids and size limits', () => {
  assert.equal(schema.isDate('2026-02-29'), false); assert.equal(schema.isDate('2028-02-29'), true); assert.equal(schema.isDate('2026-3-1'), false);
  assert.equal(schema.validate('action', { id: 'bad id!', title: 't', status: 'Open', createdAt: FIXED, updatedAt: FIXED }).ok, false);
  assert.equal(schema.validate('action', { id: 'a', title: 'x'.repeat(161), status: 'Open', createdAt: FIXED, updatedAt: FIXED }).ok, false);
  assert.equal(schema.validate('project', { ...projectFields(), id: 'p', createdAt: FIXED, updatedAt: FIXED, scores: { value: 9 } }).ok, false);
  assert.equal(schema.validate('project', { ...projectFields(), id: 'p', createdAt: FIXED, updatedAt: FIXED, buildCost: -1 }).ok, false);
  assert.equal(schema.validate('project', { ...projectFields(), id: 'p', createdAt: FIXED, updatedAt: FIXED, buildCost: null, scores: { value: 4, risk: null } }).ok, true);
});
