/* Business rules: lifecycle, prioritisation scoring, risk scoring, derived project health
   (plan §5, §6, §14.7). Pure functions; dates are 'YYYY-MM-DD' strings passed in, so results are deterministic. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.ATLAS = root.ATLAS || {}; root.ATLAS.lib = root.ATLAS.lib || {}; root.ATLAS.lib.rules = api; }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  /* ---------- dates ---------- */
  function dayNumber(s) { return Math.floor(Date.parse(s + 'T00:00:00Z') / 86400000); }
  function daysBetween(a, b) { return dayNumber(b) - dayNumber(a); } // b - a
  function addDays(s, n) { return new Date((dayNumber(s) + n) * 86400000).toISOString().slice(0, 10); }
  function todayISO(d) { d = d || new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

  /* ---------- initiative lifecycle (plan §6.1) ---------- */
  var STAGES = ['Idea', 'Intake', 'Discovery', 'POC', 'Pilot', 'Production', 'Scale', 'Sunset/Rejected'];
  var TRANSITIONS = {
    'Idea': ['Intake', 'Sunset/Rejected'],
    'Intake': ['Discovery', 'Idea', 'Sunset/Rejected'],
    'Discovery': ['POC', 'Intake', 'Sunset/Rejected'],
    'POC': ['Pilot', 'Discovery', 'Sunset/Rejected'],
    'Pilot': ['Production', 'POC', 'Sunset/Rejected'],
    'Production': ['Scale', 'Pilot', 'Sunset/Rejected'],
    'Scale': ['Production', 'Sunset/Rejected'],
    'Sunset/Rejected': ['Idea']
  };
  function allowedTransitions(from) { return (TRANSITIONS[from] || []).slice(); }
  /* A rationale is mandatory for any move that is not a step forward (backward moves, rejection, reopening). */
  function transitionNeedsNote(from, to) {
    var fi = STAGES.indexOf(from), ti = STAGES.indexOf(to);
    if (to === 'Sunset/Rejected' || from === 'Sunset/Rejected') return true;
    return ti < fi;
  }
  function checkTransition(from, to, note) {
    if (from === to) return { ok: false, error: 'The project is already in ' + to + '.' };
    if (allowedTransitions(from).indexOf(to) < 0) return { ok: false, error: 'Cannot move from ' + from + ' to ' + to + '. Allowed: ' + allowedTransitions(from).join(', ') + '.' };
    if (transitionNeedsNote(from, to) && !(note && String(note).trim())) return { ok: false, error: 'A rationale is required to move from ' + from + ' to ' + to + '.' };
    return { ok: true };
  }

  /* ---------- prioritisation (plan §6.3) ---------- */
  var DEFAULT_CRITERIA = [
    { id: 'value', label: 'Business value', weight: 25, invert: false, help: 'Size and certainty of the benefit if it works (1 = marginal, 5 = major, evidenced).' },
    { id: 'strategic', label: 'Strategic alignment', weight: 15, invert: false, help: 'Fit with stated company or business-unit priorities.' },
    { id: 'feasibility', label: 'Technical feasibility', weight: 15, invert: false, help: 'Confidence the team can build and run it with known patterns (5 = well understood).' },
    { id: 'data', label: 'Data readiness', weight: 15, invert: false, help: 'Availability, quality, ownership and permission to use the data (5 = ready).' },
    { id: 'adoption', label: 'User adoption potential', weight: 10, invert: false, help: 'Likelihood users will change their workflow to use it.' },
    { id: 'time', label: 'Time to value', weight: 10, invert: false, help: '5 = value in weeks, 1 = value after a year or more.' },
    { id: 'risk', label: 'Risk', weight: 10, invert: true, help: 'Security, compliance, safety and delivery risk. Higher risk LOWERS the total (inverted).' }
  ];
  function cloneCriteria(c) { return c.map(function (x) { return { id: x.id, label: x.label, weight: x.weight, invert: !!x.invert, help: x.help || '' }; }); }

  function validateCriteria(criteria) {
    var errors = [], sum = 0, seen = {};
    if (!Array.isArray(criteria) || !criteria.length) return { ok: false, sum: 0, errors: ['At least one criterion is required.'] };
    criteria.forEach(function (c) {
      if (!c || !/^[a-z][A-Za-z0-9]{0,30}$/.test(c.id || '')) errors.push('Criterion "' + (c && c.id) + '" has an invalid id.');
      else if (seen[c.id]) errors.push('Duplicate criterion id ' + c.id + '.');
      else seen[c.id] = 1;
      if (typeof c.weight !== 'number' || !isFinite(c.weight) || c.weight < 0 || c.weight > 100) errors.push('Weight for "' + (c && c.label) + '" must be a number from 0 to 100.');
      else sum += c.weight;
    });
    if (!errors.length && Math.abs(sum - 100) > 0.0001) errors.push('Weights must add up to 100% (currently ' + (Math.round(sum * 100) / 100) + '%).');
    return { ok: errors.length === 0, sum: sum, errors: errors };
  }

  /* 1..5 -> 0..100. Inverted criteria (risk): 1 = best (100), 5 = worst (0). */
  function normalize(score, invert) { return ((invert ? 5 - score : score - 1) / 4) * 100; }
  function validScore(s) { return typeof s === 'number' && s >= 1 && s <= 5 && Math.floor(s) === s; }

  /* Weighted score on a 0-100 scale. Missing criteria are NOT treated as zero: the result is "incomplete" with total = null. */
  function scoreUseCase(scores, criteria) {
    scores = scores || {};
    var v = validateCriteria(criteria);
    if (!v.ok) return { complete: false, total: null, missing: [], breakdown: [], errors: v.errors };
    var breakdown = [], missing = [], total = 0;
    criteria.forEach(function (c) {
      var s = scores[c.id];
      if (!validScore(s)) { missing.push(c.id); breakdown.push({ id: c.id, label: c.label, weight: c.weight, score: null, normalized: null, contribution: null }); return; }
      var n = normalize(s, c.invert), contrib = (c.weight / 100) * n;
      total += contrib;
      breakdown.push({ id: c.id, label: c.label, weight: c.weight, score: s, normalized: n, contribution: contrib });
    });
    return { complete: missing.length === 0, total: missing.length ? null : total, missing: missing, breakdown: breakdown, errors: [] };
  }

  /* Effect on the total of moving each score by one point (clamped to 1..5). Shows which assumptions matter most. */
  function sensitivity(scores, criteria) {
    var base = scoreUseCase(scores, criteria);
    if (!base.complete) return [];
    return criteria.map(function (c) {
      var s = scores[c.id], up = Math.min(5, s + 1), down = Math.max(1, s - 1);
      var a = JSON.parse(JSON.stringify(scores)), b = JSON.parse(JSON.stringify(scores));
      a[c.id] = up; b[c.id] = down;
      return { id: c.id, label: c.label, score: s, ifHigher: scoreUseCase(a, criteria).total - base.total, ifLower: scoreUseCase(b, criteria).total - base.total };
    }).sort(function (x, y) { return Math.max(Math.abs(y.ifHigher), Math.abs(y.ifLower)) - Math.max(Math.abs(x.ifHigher), Math.abs(x.ifLower)); });
  }

  function shiftWeights(criteria, id, delta) {
    var target = criteria.filter(function (c) { return c.id === id; })[0];
    var w = Math.max(0, Math.min(100, target.weight + delta)), rest = 100 - target.weight;
    return criteria.map(function (c) {
      var nw = c.id === id ? w : (rest > 0 ? c.weight * (100 - w) / rest : c.weight);
      return { id: c.id, label: c.label, weight: nw, invert: c.invert };
    });
  }
  /* How stable is each project's rank if any single weight moves by +/- delta points (others rescaled)?
     items: [{id, scores}]. Only complete items are ranked. Returns { id: {base, min, max} }. */
  function rankStability(items, criteria, delta) {
    delta = delta === undefined ? 5 : delta;
    function ranks(crit) {
      var scored = items.map(function (it) { return { id: it.id, t: scoreUseCase(it.scores, crit).total }; }).filter(function (x) { return x.t !== null; });
      scored.sort(function (a, b) { return b.t - a.t || (a.id < b.id ? -1 : 1); });
      var r = {}; scored.forEach(function (x, i) { r[x.id] = i + 1; }); return r;
    }
    var base = ranks(criteria), out = {};
    Object.keys(base).forEach(function (id) { out[id] = { base: base[id], min: base[id], max: base[id] }; });
    criteria.forEach(function (c) {
      [delta, -delta].forEach(function (d) {
        var r = ranks(shiftWeights(criteria, c.id, d));
        Object.keys(out).forEach(function (id) { if (r[id] < out[id].min) out[id].min = r[id]; if (r[id] > out[id].max) out[id].max = r[id]; });
      });
    });
    return out;
  }

  /* Value vs feasibility matrix (plan §6.3). Feasibility = mean of technical feasibility and data readiness. Threshold 3 of 5. */
  function quadrant(scores) {
    scores = scores || {};
    if (!validScore(scores.value) || !validScore(scores.feasibility) || !validScore(scores.data)) return null;
    var feas = (scores.feasibility + scores.data) / 2, val = scores.value;
    var name = val >= 3 ? (feas >= 3 ? 'Quick win' : 'Strategic bet') : (feas >= 3 ? 'Low-value fill-in' : 'Deprioritise');
    return { value: val, feasibility: feas, name: name };
  }

  /* ---------- risk scoring (plan §14.7) ---------- */
  function riskScore(p, i) { return (validScore(p) && validScore(i)) ? p * i : null; }
  function riskSeverity(score) {
    if (score === null || score === undefined) return null;
    return score >= 15 ? 'Critical' : score >= 10 ? 'High' : score >= 5 ? 'Medium' : 'Low';
  }
  function isOpenRisk(r) { return r.status === 'Open' || r.status === 'Mitigating'; }

  /* ---------- derived project health (a hint beside the manual status, never a replacement) ---------- */
  function deriveHealth(project, ctx) {
    ctx = ctx || {};
    var today = ctx.today, risks = (ctx.risks || []).filter(function (r) { return r.projectId === project.id && isOpenRisk(r); });
    var actions = (ctx.actions || []).filter(function (a) { return a.sourceType === 'project' && a.sourceId === project.id && (a.status === 'Open' || a.status === 'In progress'); });
    var reasons = [];
    var overdue = (project.milestones || []).filter(function (m) { return !m.done && m.dueDate < today; });
    if (overdue.length) reasons.push(overdue.length + ' overdue milestone' + (overdue.length > 1 ? 's' : ''));
    var crit = risks.filter(function (r) { return riskSeverity(riskScore(r.probability, r.impact)) === 'Critical'; });
    var high = risks.filter(function (r) { return riskSeverity(riskScore(r.probability, r.impact)) === 'High'; });
    if (crit.length) reasons.push(crit.length + ' open critical risk' + (crit.length > 1 ? 's' : ''));
    if (high.length) reasons.push(high.length + ' open high risk' + (high.length > 1 ? 's' : ''));
    var overdueActions = actions.filter(function (a) { return a.dueDate && a.dueDate < today; });
    if (overdueActions.length) reasons.push(overdueActions.length + ' overdue action' + (overdueActions.length > 1 ? 's' : ''));
    var derived = 'Healthy';
    if (crit.length || overdue.length >= 3) derived = 'Critical';
    else if (overdue.length || high.length || overdueActions.length) derived = 'At Risk';
    return { derived: derived, reasons: reasons, differs: derived !== project.status && project.status !== 'Blocked' };
  }

  return {
    dayNumber: dayNumber, daysBetween: daysBetween, addDays: addDays, todayISO: todayISO,
    STAGES: STAGES, TRANSITIONS: TRANSITIONS, allowedTransitions: allowedTransitions, transitionNeedsNote: transitionNeedsNote, checkTransition: checkTransition,
    DEFAULT_CRITERIA: DEFAULT_CRITERIA, cloneCriteria: cloneCriteria, validateCriteria: validateCriteria, normalize: normalize, validScore: validScore,
    scoreUseCase: scoreUseCase, sensitivity: sensitivity, rankStability: rankStability, quadrant: quadrant,
    riskScore: riskScore, riskSeverity: riskSeverity, isOpenRisk: isOpenRisk, deriveHealth: deriveHealth
  };
});
