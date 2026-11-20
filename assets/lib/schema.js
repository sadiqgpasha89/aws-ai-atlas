/* Workspace record schemas and validation (Atlas V2, plan §4.2–4.3).
   Pure functions, no DOM. Works in the browser (window.ATLAS.lib.schema) and in Node (module.exports). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.ATLAS = root.ATLAS || {}; root.ATLAS.lib = root.ATLAS.lib || {}; root.ATLAS.lib.schema = api; }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  var DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
  var KEY_RE = /^[a-z][A-Za-z0-9]{0,30}$/;
  var BAD_KEYS = { '__proto__': 1, 'constructor': 1, 'prototype': 1 };

  var ENUMS = {
    stage: ['Idea', 'Intake', 'Discovery', 'POC', 'Pilot', 'Production', 'Scale', 'Sunset/Rejected'],
    projectStatus: ['Healthy', 'At Risk', 'Blocked', 'Critical'],
    priority: ['High', 'Medium', 'Low'],
    pattern: ['Traditional ML', 'RAG', 'Agent', 'Multimodal', 'Classification', 'Forecasting', 'Recommendation', 'Automation', 'Other'],
    dataReadiness: ['Not assessed', 'Low', 'Medium', 'High'],
    dataSensitivity: ['Public', 'Internal', 'Confidential', 'Restricted'],
    oversight: ['Fully automated', 'Human-on-the-loop', 'Human-in-the-loop'],
    riskLevel: ['Low', 'Medium', 'High'],
    recommendation: ['Proceed', 'Defer', 'Redesign', 'Reject'],
    riskCategory: ['Technical', 'Data', 'Security', 'Privacy', 'Compliance', 'Delivery', 'Cost', 'Quality', 'Operational', 'People', 'Vendor'],
    riskStatus: ['Open', 'Mitigating', 'Accepted', 'Closed'],
    decisionStatus: ['Proposed', 'Approved', 'Rejected', 'Superseded'],
    actionStatus: ['Open', 'In progress', 'Done', 'Cancelled'],
    sourceType: ['project', 'risk', 'decision', 'manual'],
    scenarioKind: ['llm', 'rag', 'agent', 'compare', 'budget', 'capacity', 'unit', 'optimize', 'roi']
  };

  /* Field spec: t = type, req = required, max = max length (strings) or max value (numbers), min, en = enum name */
  var SPECS = {
    project: {
      id: { t: 'id', req: true },
      name: { t: 'string', req: true, max: 120 },
      problem: { t: 'text' }, businessUnit: { t: 'string' }, sponsor: { t: 'string' },
      businessOwner: { t: 'string' }, technicalOwner: { t: 'string' }, targetUsers: { t: 'string' },
      kpi: { t: 'string' }, baseline: { t: 'string' }, target: { t: 'string' },
      pattern: { t: 'enum', en: 'pattern', blank: true },
      dataSources: { t: 'text' }, dataOwner: { t: 'string' },
      dataReadiness: { t: 'enum', en: 'dataReadiness', blank: true },
      dataSensitivity: { t: 'enum', en: 'dataSensitivity', blank: true },
      volume: { t: 'string' }, latencyNeed: { t: 'string' },
      humanOversight: { t: 'enum', en: 'oversight', blank: true },
      riskLevel: { t: 'enum', en: 'riskLevel', blank: true },
      benefits: { t: 'text' },
      buildCost: { t: 'num', min: 0, nullable: true }, runCostMonthly: { t: 'num', min: 0, nullable: true },
      forecastBenefitMonthly: { t: 'num', min: 0, nullable: true }, realizedBenefitMonthly: { t: 'num', min: 0, nullable: true },
      currency: { t: 'string', max: 8 },
      constraints: { t: 'text' }, assumptions: { t: 'text' },
      stage: { t: 'enum', en: 'stage', req: true },
      status: { t: 'enum', en: 'projectStatus', req: true },
      priority: { t: 'enum', en: 'priority', blank: true },
      scores: { t: 'scores' }, scoreRationale: { t: 'strMap' },
      recommendation: { t: 'enum', en: 'recommendation', blank: true },
      recommendationRationale: { t: 'text' },
      milestones: { t: 'objArray', max: 100, items: {
        id: { t: 'id', req: true }, title: { t: 'string', req: true, max: 160 },
        dueDate: { t: 'date', req: true }, done: { t: 'bool' } } },
      stageHistory: { t: 'objArray', max: 200, items: {
        stage: { t: 'enum', en: 'stage', req: true }, at: { t: 'datetime', req: true }, note: { t: 'text' } } },
      archived: { t: 'bool' },
      createdAt: { t: 'datetime', req: true }, updatedAt: { t: 'datetime', req: true }
    },
    risk: {
      id: { t: 'id', req: true },
      title: { t: 'string', req: true, max: 160 },
      category: { t: 'enum', en: 'riskCategory', blank: true },
      description: { t: 'text' },
      probability: { t: 'int', min: 1, max: 5, req: true },
      impact: { t: 'int', min: 1, max: 5, req: true },
      mitigation: { t: 'text' }, owner: { t: 'string' },
      dueDate: { t: 'date', nullable: true }, reviewDate: { t: 'date', nullable: true },
      residualRisk: { t: 'string' },
      status: { t: 'enum', en: 'riskStatus', req: true },
      evidence: { t: 'text' }, projectId: { t: 'id', nullable: true },
      createdAt: { t: 'datetime', req: true }, updatedAt: { t: 'datetime', req: true }
    },
    decision: {
      id: { t: 'id', req: true },
      title: { t: 'string', req: true, max: 160 },
      context: { t: 'text' },
      options: { t: 'strArray', max: 20 },
      selectedOption: { t: 'string' }, rationale: { t: 'text' }, consequences: { t: 'text' },
      approver: { t: 'string' },
      status: { t: 'enum', en: 'decisionStatus', req: true },
      decisionDate: { t: 'date', nullable: true }, reviewDate: { t: 'date', nullable: true },
      projectId: { t: 'id', nullable: true },
      createdAt: { t: 'datetime', req: true }, updatedAt: { t: 'datetime', req: true }
    },
    action: {
      id: { t: 'id', req: true },
      title: { t: 'string', req: true, max: 160 },
      description: { t: 'text' }, owner: { t: 'string' },
      dueDate: { t: 'date', nullable: true },
      priority: { t: 'enum', en: 'priority', blank: true },
      status: { t: 'enum', en: 'actionStatus', req: true },
      sourceType: { t: 'enum', en: 'sourceType', blank: true }, sourceId: { t: 'id', nullable: true },
      createdAt: { t: 'datetime', req: true }, updatedAt: { t: 'datetime', req: true }
    },
    scenario: {
      id: { t: 'id', req: true },
      kind: { t: 'enum', en: 'scenarioKind', req: true },
      name: { t: 'string', req: true, max: 120 },
      inputs: { t: 'inputMap' }, notes: { t: 'text' },
      summary: { t: 'string', max: 400 },
      currency: { t: 'string', max: 8 },
      createdAt: { t: 'datetime', req: true }, updatedAt: { t: 'datetime', req: true }
    }
  };
  var COLLECTIONS = { projects: 'project', risks: 'risk', decisions: 'decision', actions: 'action', scenarios: 'scenario' };

  var MAX_STRING = 300, MAX_TEXT = 4000;

  /* Guards against pasting credentials into the workspace (plan §0.2.9, §39). Heuristic, not a scanner. */
  var SECRET_PATTERNS = [
    /\bAKIA[0-9A-Z]{16}\b/, /\bASIA[0-9A-Z]{16}\b/,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /aws_secret_access_key\s*[=:]/i, /\bghp_[A-Za-z0-9]{30,}\b/, /\bsk-[A-Za-z0-9]{32,}\b/
  ];
  function looksLikeSecret(s) {
    if (typeof s !== 'string') return false;
    for (var i = 0; i < SECRET_PATTERNS.length; i++) if (SECRET_PATTERNS[i].test(s)) return true;
    return false;
  }

  function isDate(s) {
    if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
    var d = new Date(s + 'T00:00:00Z');
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }
  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function hasBadKey(o) { return Object.keys(o).some(function (k) { return BAD_KEYS[k]; }); }

  function checkStr(v, spec, path, errs) {
    if (typeof v !== 'string') return errs.push({ path: path, message: 'must be text' });
    var max = spec.max || (spec.t === 'text' ? MAX_TEXT : MAX_STRING);
    if (v.length > max) errs.push({ path: path, message: 'is too long (max ' + max + ' characters)' });
    if (looksLikeSecret(v)) errs.push({ path: path, message: 'looks like a credential or key. Do not store secrets in the workspace' });
  }

  function checkField(spec, v, path, errs) {
    if (v === undefined || v === null) { if (spec.req) errs.push({ path: path, message: 'is required' }); return; }
    if (v === '' && spec.req) { errs.push({ path: path, message: 'is required' }); return; }
    switch (spec.t) {
      case 'id': if (typeof v !== 'string' || !ID_RE.test(v)) errs.push({ path: path, message: 'must be 1-64 letters, digits, "-" or "_"' }); break;
      case 'string': case 'text': checkStr(v, spec, path, errs); break;
      case 'enum':
        if (v === '' && spec.blank) break;
        if (ENUMS[spec.en].indexOf(v) < 0) errs.push({ path: path, message: 'must be one of: ' + ENUMS[spec.en].join(', ') });
        break;
      case 'bool': if (typeof v !== 'boolean') errs.push({ path: path, message: 'must be true or false' }); break;
      case 'date': if (!isDate(v)) errs.push({ path: path, message: 'must be a valid date (YYYY-MM-DD)' }); break;
      case 'datetime': if (typeof v !== 'string' || !DATETIME_RE.test(v) || isNaN(Date.parse(v))) errs.push({ path: path, message: 'must be an ISO date-time' }); break;
      case 'num': case 'int':
        if (typeof v !== 'number' || !isFinite(v)) { errs.push({ path: path, message: 'must be a number' }); break; }
        if (spec.t === 'int' && Math.floor(v) !== v) errs.push({ path: path, message: 'must be a whole number' });
        if (spec.min !== undefined && v < spec.min) errs.push({ path: path, message: 'must be at least ' + spec.min });
        if (spec.max !== undefined && v > spec.max) errs.push({ path: path, message: 'must be at most ' + spec.max });
        if (spec.t === 'num' && Math.abs(v) > 1e15) errs.push({ path: path, message: 'is unreasonably large' });
        break;
      case 'strArray':
        if (!Array.isArray(v)) { errs.push({ path: path, message: 'must be a list' }); break; }
        if (v.length > (spec.max || 50)) errs.push({ path: path, message: 'has too many entries' });
        v.forEach(function (x, i) { checkStr(x, { t: 'string' }, path + '[' + i + ']', errs); });
        break;
      case 'objArray':
        if (!Array.isArray(v)) { errs.push({ path: path, message: 'must be a list' }); break; }
        if (v.length > (spec.max || 100)) { errs.push({ path: path, message: 'has too many entries' }); break; }
        v.forEach(function (it, i) {
          if (!isObj(it) || hasBadKey(it)) return errs.push({ path: path + '[' + i + ']', message: 'must be an object' });
          Object.keys(spec.items).forEach(function (k) { checkField(spec.items[k], it[k], path + '[' + i + '].' + k, errs); });
        });
        break;
      case 'scores':
        if (!isObj(v) || hasBadKey(v)) { errs.push({ path: path, message: 'must be an object of 1-5 scores' }); break; }
        Object.keys(v).forEach(function (k) {
          if (!KEY_RE.test(k)) errs.push({ path: path + '.' + k, message: 'has an invalid criterion id' });
          else if (v[k] !== null && (typeof v[k] !== 'number' || v[k] < 1 || v[k] > 5 || Math.floor(v[k]) !== v[k])) errs.push({ path: path + '.' + k, message: 'must be a whole number from 1 to 5' });
        });
        break;
      case 'strMap':
        if (!isObj(v) || hasBadKey(v)) { errs.push({ path: path, message: 'must be an object' }); break; }
        Object.keys(v).forEach(function (k) { if (!KEY_RE.test(k)) errs.push({ path: path + '.' + k, message: 'has an invalid key' }); else checkStr(v[k], { t: 'text' }, path + '.' + k, errs); });
        break;
      case 'inputMap':
        if (!isObj(v) || hasBadKey(v)) { errs.push({ path: path, message: 'must be an object' }); break; }
        Object.keys(v).forEach(function (k) {
          if (!KEY_RE.test(k)) errs.push({ path: path + '.' + k, message: 'has an invalid key' });
          else if (typeof v[k] === 'string') checkStr(v[k], { t: 'text', max: 2000 }, path + '.' + k, errs);
          else if (typeof v[k] !== 'number' || !isFinite(v[k])) errs.push({ path: path + '.' + k, message: 'must be a number or text' });
        });
        break;
      case 'numMap':
        if (!isObj(v) || hasBadKey(v)) { errs.push({ path: path, message: 'must be an object of numbers' }); break; }
        Object.keys(v).forEach(function (k) {
          if (!KEY_RE.test(k)) errs.push({ path: path + '.' + k, message: 'has an invalid key' });
          else if (typeof v[k] !== 'number' || !isFinite(v[k])) errs.push({ path: path + '.' + k, message: 'must be a number' });
        });
        break;
    }
  }

  /* validate('project', rec) -> { ok, errors:[{path,message}] } */
  function validate(entity, rec) {
    var spec = SPECS[entity], errs = [];
    if (!spec) return { ok: false, errors: [{ path: '', message: 'unknown record type ' + entity }] };
    if (!isObj(rec) || hasBadKey(rec)) return { ok: false, errors: [{ path: '', message: 'must be an object' }] };
    Object.keys(spec).forEach(function (k) { checkField(spec[k], rec[k], k, errs); });
    return { ok: errs.length === 0, errors: errs };
  }

  function pickItem(spec, o) {
    var out = {};
    Object.keys(spec).forEach(function (k) { if (o[k] !== undefined) out[k] = o[k]; });
    return out;
  }
  /* pick('project', rec): copy only known fields (drops unknown keys; used on import). */
  function pick(entity, rec) {
    var spec = SPECS[entity], out = {};
    Object.keys(spec).forEach(function (k) {
      var v = rec[k];
      if (v === undefined) return;
      if (spec[k].t === 'objArray' && Array.isArray(v)) out[k] = v.map(function (it) { return isObj(it) ? pickItem(spec[k].items, it) : it; });
      else if ((spec[k].t === 'scores' || spec[k].t === 'strMap' || spec[k].t === 'numMap' || spec[k].t === 'inputMap') && isObj(v)) {
        var m = {}; Object.keys(v).forEach(function (kk) { if (!BAD_KEYS[kk]) m[kk] = v[kk]; }); out[k] = m;
      } else if (spec[k].t === 'strArray' && Array.isArray(v)) out[k] = v.slice();
      else out[k] = v;
    });
    return out;
  }

  /* Friendly one-line message for a validation result. */
  function describe(errors) {
    return errors.map(function (e) { return (e.path ? e.path + ' ' : '') + e.message; }).join('; ');
  }

  return { ENUMS: ENUMS, SPECS: SPECS, COLLECTIONS: COLLECTIONS, ID_RE: ID_RE, validate: validate, pick: pick, describe: describe, isDate: isDate, looksLikeSecret: looksLikeSecret };
});
