/* Command Centre derivation (plan §5). Everything is computed from workspace records: no invented metrics.
   Each KPI carries the ids of the records behind it and a link to a filtered detail view, so every number is traceable. */
(function (root, factory) {
  var deps = (typeof module === 'object' && module.exports) ? { rules: require('./rules.js') } : { rules: root.ATLAS.lib.rules };
  var api = factory(deps.rules);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.ATLAS = root.ATLAS || {}; root.ATLAS.lib = root.ATLAS.lib || {}; root.ATLAS.lib.dashboard = api; }
})(typeof window !== 'undefined' ? window : globalThis, function (rules) {
  'use strict';

  var SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
  function q(params) {
    var parts = [];
    Object.keys(params).forEach(function (k) { parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k])); });
    return parts.length ? '?' + parts.join('&') : '';
  }
  function ids(list) { return list.map(function (x) { return x.id; }); }

  /* ws = store.snapshot()-like object with arrays; opts: { today:'YYYY-MM-DD', windowDays:14, stage:'', status:'' } */
  function summarize(ws, opts) {
    opts = opts || {};
    var today = opts.today || rules.todayISO(), win = opts.windowDays || 14, horizon = rules.addDays(today, win);
    var allProjects = (ws.projects || []).filter(function (p) { return !p.archived; });
    var projects = allProjects.filter(function (p) { return (!opts.stage || p.stage === opts.stage) && (!opts.status || p.status === opts.status); });
    var pset = {}; projects.forEach(function (p) { pset[p.id] = 1; });
    var scoped = !!(opts.stage || opts.status);
    function inScope(projectId) { return !scoped || (projectId && pset[projectId]); }

    var risks = (ws.risks || []).filter(function (r) { return inScope(r.projectId); });
    var actions = (ws.actions || []).filter(function (a) { return !scoped || (a.sourceType === 'project' && pset[a.sourceId]) || (a.sourceType === 'risk' && risks.some(function (r) { return r.id === a.sourceId; })); });
    var decisions = (ws.decisions || []).filter(function (d) { return inScope(d.projectId); });

    var live = projects.filter(function (p) { return p.stage !== 'Sunset/Rejected'; });
    var byStage = {}, byStatus = {}, byPriority = {};
    rules.STAGES.forEach(function (s) { byStage[s] = 0; });
    projects.forEach(function (p) { byStage[p.stage]++; byStatus[p.status] = (byStatus[p.status] || 0) + 1; if (p.priority) byPriority[p.priority] = (byPriority[p.priority] || 0) + 1; });

    /* delivery */
    var overdueMs = [], upcomingMs = [];
    live.forEach(function (p) {
      (p.milestones || []).forEach(function (m) {
        if (m.done) return;
        var item = { projectId: p.id, projectName: p.name, id: m.id, title: m.title, dueDate: m.dueDate };
        if (m.dueDate < today) overdueMs.push(Object.assign(item, { daysOverdue: rules.daysBetween(m.dueDate, today) }));
        else if (m.dueDate <= horizon) upcomingMs.push(Object.assign(item, { daysUntil: rules.daysBetween(today, m.dueDate) }));
      });
    });
    overdueMs.sort(function (a, b) { return b.daysOverdue - a.daysOverdue; });
    upcomingMs.sort(function (a, b) { return a.daysUntil - b.daysUntil; });
    var blocked = live.filter(function (p) { return p.status === 'Blocked'; });
    var atRisk = live.filter(function (p) { return p.status === 'At Risk' || p.status === 'Critical'; });

    /* risks */
    var open = risks.filter(rules.isOpenRisk);
    function sev(r) { return rules.riskSeverity(rules.riskScore(r.probability, r.impact)); }
    var critical = open.filter(function (r) { return sev(r) === 'Critical'; }), high = open.filter(function (r) { return sev(r) === 'High'; });
    var overdueMit = open.filter(function (r) { return r.dueDate && r.dueDate < today; });
    var reviewDue = risks.filter(function (r) { return r.status !== 'Closed' && r.reviewDate && r.reviewDate <= today; });

    /* actions */
    var openActions = actions.filter(function (a) { return a.status === 'Open' || a.status === 'In progress'; });
    var overdueActions = openActions.filter(function (a) { return a.dueDate && a.dueDate < today; });
    var dueSoon = openActions.filter(function (a) { return a.dueDate && a.dueDate >= today && a.dueDate <= horizon; });

    /* decisions */
    var pending = decisions.filter(function (d) { return d.status === 'Proposed'; });
    var staleDecisions = decisions.filter(function (d) { return d.status === 'Approved' && d.reviewDate && d.reviewDate <= today; });

    /* cost and value: ENTERED estimates only */
    function sum(list, k) { return list.reduce(function (a, p) { return a + (typeof p[k] === 'number' ? p[k] : 0); }, 0); }
    var withRealized = live.filter(function (p) { return typeof p.realizedBenefitMonthly === 'number' && typeof p.forecastBenefitMonthly === 'number' && p.forecastBenefitMonthly > 0; });
    var cost = {
      buildEstimate: sum(live, 'buildCost'), runEstimateMonthly: sum(live, 'runCostMonthly'), forecastBenefitMonthly: sum(live, 'forecastBenefitMonthly'),
      realizedBenefitMonthly: sum(withRealized, 'realizedBenefitMonthly'), forecastForRealized: sum(withRealized, 'forecastBenefitMonthly'),
      realizedVsForecastPct: withRealized.length && sum(withRealized, 'forecastBenefitMonthly') > 0 ? sum(withRealized, 'realizedBenefitMonthly') / sum(withRealized, 'forecastBenefitMonthly') * 100 : null,
      projectsWithRealized: withRealized.length, currencies: Array.from(new Set(live.filter(function (p) { return typeof p.buildCost === 'number' || typeof p.runCostMonthly === 'number'; }).map(function (p) { return p.currency || ''; })))
    };

    /* derived-health disagreements */
    var ctx = { today: today, risks: ws.risks || [], actions: ws.actions || [] };
    var healthHints = live.map(function (p) { return { project: p, h: rules.deriveHealth(p, ctx) }; }).filter(function (x) { return x.h.differs && x.h.derived !== 'Healthy'; });

    /* deterministic attention list */
    var att = [];
    function push(severity, key, title, detail, href, type, id) { att.push({ key: key, severity: severity, title: title, detail: detail, href: href, source: { type: type, id: id } }); }
    critical.forEach(function (r) { push('critical', 'risk-crit-' + r.id, 'Critical risk: ' + r.title, 'Score ' + rules.riskScore(r.probability, r.impact) + '/25, status ' + r.status + (r.owner ? ', owner ' + r.owner : ''), '#/registers/risks?focus=' + r.id, 'risk', r.id); });
    blocked.forEach(function (p) { push('critical', 'proj-blocked-' + p.id, 'Blocked: ' + p.name, 'Stage ' + p.stage + (p.technicalOwner ? ', tech owner ' + p.technicalOwner : ''), '#/portfolio/p/' + p.id, 'project', p.id); });
    overdueMs.forEach(function (m) { push('high', 'ms-' + m.id, 'Overdue milestone: ' + m.title, m.projectName + ', due ' + m.dueDate + ' (' + m.daysOverdue + ' day' + (m.daysOverdue === 1 ? '' : 's') + ' late)', '#/portfolio/p/' + m.projectId, 'project', m.projectId); });
    high.forEach(function (r) { push('high', 'risk-high-' + r.id, 'High risk: ' + r.title, 'Score ' + rules.riskScore(r.probability, r.impact) + '/25, status ' + r.status, '#/registers/risks?focus=' + r.id, 'risk', r.id); });
    overdueMit.forEach(function (r) { if (sev(r) !== 'Critical' && sev(r) !== 'High') push('medium', 'risk-late-' + r.id, 'Mitigation overdue: ' + r.title, 'Due ' + r.dueDate, '#/registers/risks?focus=' + r.id, 'risk', r.id); });
    overdueActions.forEach(function (a) { push('high', 'act-' + a.id, 'Overdue action: ' + a.title, 'Due ' + a.dueDate + (a.owner ? ', owner ' + a.owner : ''), '#/registers/actions?focus=' + a.id, 'action', a.id); });
    pending.forEach(function (d) { push('medium', 'dec-' + d.id, 'Decision awaiting approval: ' + d.title, d.approver ? 'Approver ' + d.approver : 'No approver set', '#/registers/decisions?focus=' + d.id, 'decision', d.id); });
    staleDecisions.forEach(function (d) { push('medium', 'dec-rev-' + d.id, 'Decision due for review: ' + d.title, 'Review date ' + d.reviewDate, '#/registers/decisions?focus=' + d.id, 'decision', d.id); });
    reviewDue.forEach(function (r) { push('low', 'risk-rev-' + r.id, 'Risk review due: ' + r.title, 'Review date ' + r.reviewDate, '#/registers/risks?focus=' + r.id, 'risk', r.id); });
    healthHints.forEach(function (x) { push('medium', 'health-' + x.project.id, 'Health check: ' + x.project.name, 'Recorded status is ' + x.project.status + ' but records suggest ' + x.h.derived + ': ' + x.h.reasons.join(', '), '#/portfolio/p/' + x.project.id, 'project', x.project.id); });
    att.sort(function (a, b) { return SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || (a.key < b.key ? -1 : 1); });

    var kpis = [
      { id: 'active', label: 'Active initiatives', value: live.length, sub: 'excluding Sunset/Rejected and archived', href: '#/portfolio' + q(Object.assign({ active: '1' }, opts.stage ? { stage: opts.stage } : {})), ids: ids(live) },
      { id: 'attention', label: 'At risk or blocked', value: atRisk.length + blocked.length, sub: atRisk.length + ' at risk/critical, ' + blocked.length + ' blocked (recorded status)', href: '#/portfolio?active=1&status=At%20Risk%2CCritical%2CBlocked', ids: ids(atRisk.concat(blocked)) },
      { id: 'overdue', label: 'Overdue milestones', value: overdueMs.length, sub: upcomingMs.length + ' more due in the next ' + win + ' days', href: '#/portfolio?view=milestones', ids: overdueMs.map(function (m) { return m.id; }) },
      { id: 'risks', label: 'Open critical/high risks', value: critical.length + high.length, sub: critical.length + ' critical, ' + high.length + ' high', href: '#/registers/risks?severity=high', ids: ids(critical.concat(high)) },
      { id: 'actions', label: 'Overdue actions', value: overdueActions.length, sub: openActions.length + ' open, ' + dueSoon.length + ' due in ' + win + ' days', href: '#/registers/actions?filter=overdue', ids: ids(overdueActions) },
      { id: 'decisions', label: 'Decisions pending', value: pending.length, sub: staleDecisions.length + ' approved decision(s) due for review', href: '#/registers/decisions?status=Proposed', ids: ids(pending) }
    ];

    return {
      scope: { today: today, windowDays: win, stage: opts.stage || '', status: opts.status || '', projectCount: projects.length, archivedExcluded: (ws.projects || []).length - allProjects.length },
      portfolio: { active: live.length, byStage: byStage, byStatus: byStatus, byPriority: byPriority },
      delivery: { overdueMilestones: overdueMs, upcomingMilestones: upcomingMs, blocked: ids(blocked) },
      risks: { open: ids(open), critical: ids(critical), high: ids(high), overdueMitigations: ids(overdueMit), reviewDue: ids(reviewDue) },
      actions: { open: ids(openActions), overdue: ids(overdueActions), dueSoon: ids(dueSoon) },
      decisions: { pending: ids(pending), reviewDue: ids(staleDecisions) },
      cost: cost, attention: att, kpis: kpis, empty: !(ws.projects || []).length && !(ws.risks || []).length && !(ws.actions || []).length && !(ws.decisions || []).length
    };
  }

  return { summarize: summarize };
});
