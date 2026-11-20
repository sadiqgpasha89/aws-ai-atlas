/* Local-first workspace store (plan §4.4).
   - Versioned, namespaced browser storage behind an adapter interface (a backend adapter can be added later).
   - Survives disabled storage, quota errors and corrupt data without losing the in-memory session.
   - Validated JSON export/import with preview and conflict strategy; invalid imports never touch existing data.
   Nothing here talks to a network. */
(function (root, factory) {
  var deps = (typeof module === 'object' && module.exports) ? { schema: require('./schema.js') } : { schema: root.ATLAS.lib.schema };
  var api = factory(deps.schema);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.ATLAS = root.ATLAS || {}; root.ATLAS.lib = root.ATLAS.lib || {}; root.ATLAS.lib.store = api; }
})(typeof window !== 'undefined' ? window : globalThis, function (schema) {
  'use strict';

  var APP_ID = 'aws-ai-atlas-workspace';
  var SCHEMA_VERSION = 1;
  var STORAGE_KEY = 'aws-ai-atlas:workspace';
  var MAX_IMPORT_BYTES = 5 * 1024 * 1024;
  var MAX_RECORDS = 2000;
  var COLLECTION_NAMES = Object.keys(schema.COLLECTIONS); // projects, risks, decisions, actions, scenarios

  /* migrations[n] upgrades a workspace from schema version n to n+1. Version 1 is the first schema, so the table is empty today;
     tests inject synthetic migrations to prove the mechanism. */
  var MIGRATIONS = {};

  function emptyWorkspace() {
    var w = { app: APP_ID, schemaVersion: SCHEMA_VERSION, updatedAt: null, config: { criteria: null } };
    COLLECTION_NAMES.forEach(function (c) { w[c] = []; });
    return w;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function nowISO() { return new Date().toISOString(); }

  /* ---------- adapters ---------- */
  function memoryAdapter(seed) {
    var data = Object.assign({}, seed || {});
    return { kind: 'memory', persistent: false, get: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; }, set: function (k, v) { data[k] = String(v); }, remove: function (k) { delete data[k]; } };
  }
  function localStorageAdapter(win) {
    var ls = null;
    try {
      ls = (win || (typeof window !== 'undefined' ? window : null)).localStorage;
      var probe = STORAGE_KEY + ':probe'; ls.setItem(probe, '1'); ls.removeItem(probe);
    } catch (e) { ls = null; }
    if (!ls) return null;
    return { kind: 'localStorage', persistent: true, get: function (k) { return ls.getItem(k); }, set: function (k, v) { ls.setItem(k, v); }, remove: function (k) { ls.removeItem(k); } };
  }

  /* ---------- structure validation + migration ---------- */
  function migrate(data, migrations) {
    migrations = migrations || MIGRATIONS;
    var v = data.schemaVersion;
    if (typeof v !== 'number' || v < 1 || Math.floor(v) !== v) return { ok: false, error: 'Missing or invalid schema version.' };
    if (v > SCHEMA_VERSION) return { ok: false, newer: true, error: 'This data was saved by a newer version of the Atlas (schema ' + v + '). Update the app before opening it.' };
    var out = data;
    while (v < SCHEMA_VERSION) {
      var step = migrations[v];
      if (typeof step !== 'function') return { ok: false, error: 'No migration from schema ' + v + '.' };
      out = step(clone(out)); v += 1; out.schemaVersion = v;
    }
    return { ok: true, data: out };
  }

  /* Validate every record; returns { clean, problems[] } where clean has only valid, picked records. */
  function cleanWorkspace(data) {
    var clean = emptyWorkspace(), problems = [];
    if (data.config && typeof data.config === 'object' && Array.isArray(data.config.criteria)) {
      var crit = data.config.criteria.map(function (c) { return c && typeof c === 'object' ? { id: String(c.id), label: String(c.label || c.id).slice(0, 80), weight: c.weight, invert: !!c.invert, help: String(c.help || '').slice(0, 300) } : null; });
      if (crit.every(Boolean)) clean.config.criteria = crit; else problems.push('config.criteria: ignored (invalid)');
    }
    COLLECTION_NAMES.forEach(function (coll) {
      var entity = schema.COLLECTIONS[coll], list = data[coll];
      if (list === undefined) return;
      if (!Array.isArray(list)) { problems.push(coll + ': must be a list'); return; }
      if (list.length > MAX_RECORDS) { problems.push(coll + ': too many records (max ' + MAX_RECORDS + ')'); return; }
      var seen = {};
      list.forEach(function (rec, i) {
        var v = schema.validate(entity, rec);
        if (!v.ok) { problems.push(coll + '[' + i + ']' + (rec && rec.id ? ' (' + rec.id + ')' : '') + ': ' + schema.describe(v.errors)); return; }
        if (seen[rec.id]) { problems.push(coll + '[' + i + '] (' + rec.id + '): duplicate id'); return; }
        seen[rec.id] = 1;
        clean[coll].push(schema.pick(entity, rec));
      });
    });
    clean.updatedAt = typeof data.updatedAt === 'string' ? data.updatedAt : null;
    return { clean: clean, problems: problems };
  }

  /* ---------- store ---------- */
  function createStore(opts) {
    opts = opts || {};
    var adapter = opts.adapter || memoryAdapter();
    var key = opts.key || STORAGE_KEY;
    var migrations = opts.migrations || MIGRATIONS;
    var label = opts.label || 'personal';
    var idFn = opts.idFn || function (prefix) { return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
    var clock = opts.now || nowISO;
    var listeners = [];
    var state = emptyWorkspace();
    var status = { label: label, persistent: !!adapter.persistent, error: null, notice: null, recovered: false };

    function emit(change) { listeners.slice().forEach(function (fn) { try { fn(change || {}); } catch (e) { /* a broken listener must not break the store */ } }); }
    function backup(raw, why) {
      try { adapter.set(key + ':backup', raw); status.notice = why + ' The unreadable data was kept in a backup entry in this browser (' + key + ':backup).'; }
      catch (e) { status.notice = why + ' It could not be backed up.'; }
      status.recovered = true;
    }

    function load() {
      var raw = null;
      try { raw = adapter.get(key); } catch (e) { status.error = 'Browser storage is unavailable, so changes will last only until you close this tab.'; status.persistent = false; return; }
      if (raw === null || raw === undefined) return;
      var parsed;
      try { parsed = JSON.parse(raw); } catch (e) { backup(raw, 'Saved workspace data was corrupt and could not be read. Starting with an empty workspace.'); return; }
      if (!parsed || typeof parsed !== 'object' || parsed.app !== APP_ID) { backup(raw, 'Saved data is not an Atlas workspace. Starting with an empty workspace.'); return; }
      var m = migrate(parsed, migrations);
      if (!m.ok) { backup(raw, m.error + ' Starting with an empty workspace.'); return; }
      var res = cleanWorkspace(m.data);
      state = res.clean;
      if (res.problems.length) { status.notice = res.problems.length + ' saved record(s) failed validation and were skipped: ' + res.problems.slice(0, 3).join(' | '); }
    }

    /* Returns true on success. On failure the in-memory state is kept and status.error explains why. */
    function persist() {
      state.updatedAt = clock();
      try { adapter.set(key, JSON.stringify(state)); status.error = null; return true; }
      catch (e) {
        var quota = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014);
        status.error = quota ? 'Browser storage is full. Your latest change is only in memory. Export your workspace to avoid losing it.' : 'Could not save to browser storage. Your latest change is only in memory. Export your workspace to avoid losing it.';
        return false;
      }
    }

    function coll(name) { if (!schema.COLLECTIONS[name]) throw new Error('Unknown collection ' + name); return state[name]; }
    function find(name, id) { return coll(name).filter(function (r) { return r.id === id; })[0] || null; }

    var api = {
      label: label, status: status,
      adapterKind: function () { return adapter.kind; },
      subscribe: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; },
      list: function (name, o) { var l = coll(name); if (o && o.includeArchived) return clone(l); return clone(l.filter(function (r) { return !r.archived; })); },
      get: function (name, id) { var r = find(name, id); return r ? clone(r) : null; },
      count: function (name) { return coll(name).length; },
      isEmpty: function () { return COLLECTION_NAMES.every(function (c) { return !state[c].length; }); },
      snapshot: function () { return clone(state); },
      getCriteria: function () { return state.config.criteria ? clone(state.config.criteria) : null; },

      /* add(name, fields) -> { ok, record } | { ok:false, errors:[{path,message}] } */
      add: function (name, fields) {
        var entity = schema.COLLECTIONS[name], ts = clock();
        var rec = Object.assign({}, fields, { id: fields.id || idFn(entity.slice(0, 3)), createdAt: ts, updatedAt: ts });
        if (name === 'projects') {
          rec.stageHistory = (fields.stageHistory && fields.stageHistory.length) ? fields.stageHistory : [{ stage: rec.stage, at: ts, note: 'Created' }];
        }
        if (find(name, rec.id)) return { ok: false, errors: [{ path: 'id', message: 'already exists' }] };
        if (coll(name).length >= MAX_RECORDS) return { ok: false, errors: [{ path: '', message: 'record limit reached (' + MAX_RECORDS + ')' }] };
        var v = schema.validate(entity, rec);
        if (!v.ok) return { ok: false, errors: v.errors };
        state[name].push(schema.pick(entity, rec));
        var saved = persist();
        emit({ type: 'add', collection: name, id: rec.id });
        return { ok: true, record: clone(find(name, rec.id)), saved: saved };
      },

      update: function (name, id, patch) {
        var cur = find(name, id), entity = schema.COLLECTIONS[name];
        if (!cur) return { ok: false, errors: [{ path: 'id', message: 'record not found' }] };
        var next = Object.assign({}, clone(cur), patch, { id: id, createdAt: cur.createdAt, updatedAt: clock() });
        var v = schema.validate(entity, next);
        if (!v.ok) return { ok: false, errors: v.errors };
        var idx = state[name].indexOf(cur);
        state[name][idx] = schema.pick(entity, next);
        var saved = persist();
        emit({ type: 'update', collection: name, id: id });
        return { ok: true, record: clone(state[name][idx]), saved: saved };
      },

      remove: function (name, id) {
        var cur = find(name, id);
        if (!cur) return { ok: false, errors: [{ path: 'id', message: 'record not found' }] };
        state[name].splice(state[name].indexOf(cur), 1);
        var saved = persist();
        emit({ type: 'remove', collection: name, id: id });
        return { ok: true, saved: saved };
      },

      archive: function (id, archived) { return api.update('projects', id, { archived: archived !== false }); },

      /* Move a project between lifecycle stages with history. rules = lib/rules (passed in to keep this file free of that dependency). */
      moveStage: function (id, to, note, rules) {
        var p = find('projects', id);
        if (!p) return { ok: false, errors: [{ path: 'id', message: 'record not found' }] };
        var chk = rules.checkTransition(p.stage, to, note);
        if (!chk.ok) return { ok: false, errors: [{ path: 'stage', message: chk.error }] };
        var hist = (p.stageHistory || []).concat([{ stage: to, at: clock(), note: note ? String(note).trim() : '' }]);
        return api.update('projects', id, { stage: to, stageHistory: hist });
      },

      setCriteria: function (criteria) {
        state.config.criteria = criteria ? clone(criteria) : null;
        var saved = persist(); emit({ type: 'config' }); return { ok: true, saved: saved };
      },

      /* ---------- export / import ---------- */
      exportObject: function () { var o = clone(state); o.exportedAt = clock(); o.kind = label; return o; },
      exportJSON: function () { return JSON.stringify(api.exportObject(), null, 2); },

      /* Parse + validate without changing anything. Returns { ok:false, errors } or { ok:true, summary, problems, warnings, payload }. */
      previewImport: function (text) {
        if (typeof text !== 'string' || !text.trim()) return { ok: false, errors: ['The file is empty.'] };
        if (text.length > MAX_IMPORT_BYTES) return { ok: false, errors: ['The file is larger than ' + (MAX_IMPORT_BYTES / 1048576) + ' MB.'] };
        var parsed;
        try { parsed = JSON.parse(text); } catch (e) { return { ok: false, errors: ['The file is not valid JSON.'] }; }
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || parsed.app !== APP_ID) return { ok: false, errors: ['This is not an AWS AI Atlas workspace export.'] };
        if (parsed.kind === 'sample') return { ok: false, errors: ['This file was exported from the sample workspace. Sample data is not imported into your own workspace.'] };
        var m = migrate(parsed, migrations);
        if (!m.ok) return { ok: false, errors: [m.error] };
        var res = cleanWorkspace(m.data), summary = {}, warnings = [];
        COLLECTION_NAMES.forEach(function (c) {
          var existing = {}; state[c].forEach(function (r) { existing[r.id] = r; });
          var added = 0, conflicts = 0;
          res.clean[c].forEach(function (r) { if (existing[r.id]) conflicts++; else added++; });
          summary[c] = { incoming: res.clean[c].length, added: added, conflicts: conflicts, current: state[c].length };
        });
        var pids = {}; res.clean.projects.forEach(function (p) { pids[p.id] = 1; }); state.projects.forEach(function (p) { pids[p.id] = 1; });
        ['risks', 'decisions'].forEach(function (c) { res.clean[c].forEach(function (r) { if (r.projectId && !pids[r.projectId]) warnings.push(c.slice(0, -1) + ' "' + r.title + '" refers to a project that is not in the workspace.'); }); });
        return { ok: true, summary: summary, problems: res.problems, warnings: warnings, payload: res.clean, migratedFrom: parsed.schemaVersion !== SCHEMA_VERSION ? parsed.schemaVersion : null };
      },

      /* strategy: 'skip' (keep existing when ids clash), 'overwrite' (imported record wins), 'replace' (discard current data). */
      applyImport: function (preview, strategy) {
        if (!preview || !preview.ok) return { ok: false, errors: ['Nothing to import.'] };
        if (['skip', 'overwrite', 'replace'].indexOf(strategy) < 0) return { ok: false, errors: ['Choose how to handle existing records.'] };
        var before = clone(state), next = clone(state);
        if (strategy === 'replace') { next = emptyWorkspace(); next.config = clone(preview.payload.config); }
        else if (!next.config.criteria && preview.payload.config.criteria) next.config = clone(preview.payload.config);
        COLLECTION_NAMES.forEach(function (c) {
          preview.payload[c].forEach(function (rec) {
            var i = -1; next[c].forEach(function (r, idx) { if (r.id === rec.id) i = idx; });
            if (i === -1) next[c].push(clone(rec)); else if (strategy === 'overwrite') next[c][i] = clone(rec);
          });
          if (next[c].length > MAX_RECORDS) next[c] = next[c].slice(0, MAX_RECORDS);
        });
        state = next;
        if (!persist()) { state = before; return { ok: false, errors: [status.error || 'Could not save the imported data. Nothing was changed.'] }; }
        emit({ type: 'import' });
        return { ok: true };
      },

      /* Delete everything this store holds. */
      reset: function () {
        state = emptyWorkspace();
        try { adapter.remove(key); status.error = null; } catch (e) { status.error = 'Could not clear browser storage.'; }
        emit({ type: 'reset' });
        return { ok: !status.error };
      }
    };

    load();
    return api;
  }

  /* Build a store pre-filled with sample records, held in memory only. Edits never touch browser storage. */
  function createSampleStore(sample, opts) {
    var store = createStore(Object.assign({ adapter: memoryAdapter(), label: 'sample' }, opts || {}));
    if (sample) {
      var res = cleanWorkspace(Object.assign({ app: APP_ID, schemaVersion: SCHEMA_VERSION }, sample));
      var seeded = res.clean;
      var imp = store.previewImport(JSON.stringify(Object.assign({}, seeded, { app: APP_ID, schemaVersion: SCHEMA_VERSION })));
      if (imp.ok) store.applyImport(imp, 'replace');
    }
    return store;
  }

  return { APP_ID: APP_ID, SCHEMA_VERSION: SCHEMA_VERSION, STORAGE_KEY: STORAGE_KEY, MAX_IMPORT_BYTES: MAX_IMPORT_BYTES, COLLECTION_NAMES: COLLECTION_NAMES,
    createStore: createStore, createSampleStore: createSampleStore, memoryAdapter: memoryAdapter, localStorageAdapter: localStorageAdapter,
    emptyWorkspace: emptyWorkspace, migrate: migrate, cleanWorkspace: cleanWorkspace };
});
