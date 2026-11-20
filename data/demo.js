/* SAMPLE workspace (plan §5.2, §4.4): fictional records used only by the "Sample workspace" mode.
   Nothing here describes a real organisation, project, cost or telemetry. Dates are generated relative to the day it is opened so the
   sample never goes stale. It is held in memory and never written to the user's browser storage. */
window.ATLAS = window.ATLAS || {};
window.ATLAS.demo = {
  label: 'Sample data (fictional)',
  build: function (today) {
    function day(n) { return new Date(Date.parse(today + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
    function ts(n) { return day(n) + 'T09:00:00.000Z'; }
    function hist(stage, n, note) { return { stage: stage, at: ts(n), note: note || '' }; }
    function P(o) { return Object.assign({ currency: 'USD', archived: false, createdAt: ts(-60), updatedAt: ts(-2) }, o); }
    return {
      config: { criteria: null },
      projects: [
        P({ id: 'sample-p1', name: 'Support assistant (RAG)', problem: 'Agents spend long periods searching policy documents during customer chats.', businessUnit: 'Customer Support', sponsor: 'Sample sponsor A', businessOwner: 'Sample owner A', technicalOwner: 'Sample lead A',
          kpi: 'Average handling time', baseline: '11 min', target: '8 min', pattern: 'RAG', dataReadiness: 'Medium', dataSensitivity: 'Confidential', humanOversight: 'Human-in-the-loop', riskLevel: 'Medium',
          stage: 'Pilot', status: 'At Risk', priority: 'High', buildCost: 180000, runCostMonthly: 6500, forecastBenefitMonthly: 22000, realizedBenefitMonthly: 9000,
          scores: { value: 5, strategic: 4, feasibility: 4, data: 3, adoption: 4, time: 4, risk: 3 }, scoreRationale: { value: 'Sample rationale: high ticket volume.', risk: 'Sample rationale: customer data in prompts.' },
          recommendation: 'Proceed', recommendationRationale: 'Sample: proceed once the security review closes.',
          milestones: [{ id: 'sample-m1', title: 'Evaluation baseline', dueDate: day(-30), done: true }, { id: 'sample-m2', title: 'Security review sign-off', dueDate: day(-6), done: false }, { id: 'sample-m3', title: 'Pilot readout', dueDate: day(9), done: false }],
          stageHistory: [hist('Idea', -60), hist('Intake', -52), hist('Discovery', -45), hist('POC', -30), hist('Pilot', -12, 'Evaluation gate passed')] }),
        P({ id: 'sample-p2', name: 'Contract clause extraction', problem: 'Legal reviewers manually tag clauses in supplier contracts.', businessUnit: 'Legal Operations', businessOwner: 'Sample owner B', technicalOwner: 'Sample lead B',
          kpi: 'Contracts reviewed per week', baseline: '40', target: '70', pattern: 'Classification', dataReadiness: 'High', dataSensitivity: 'Confidential', humanOversight: 'Human-in-the-loop', riskLevel: 'Low',
          stage: 'POC', status: 'Healthy', priority: 'Medium', buildCost: 70000, runCostMonthly: 1800, forecastBenefitMonthly: 9000,
          scores: { value: 4, strategic: 3, feasibility: 5, data: 5, adoption: 4, time: 5, risk: 2 }, recommendation: 'Proceed', recommendationRationale: 'Sample: clear data, low risk.',
          milestones: [{ id: 'sample-m4', title: 'POC accuracy review', dueDate: day(20), done: false }],
          stageHistory: [hist('Intake', -40), hist('Discovery', -33), hist('POC', -14)] }),
        P({ id: 'sample-p3', name: 'Claims triage agent', problem: 'Claims are routed by hand across three queues.', businessUnit: 'Claims', businessOwner: 'Sample owner C', technicalOwner: 'Sample lead C',
          kpi: 'Time to first routing', baseline: '6 h', target: '30 min', pattern: 'Agent', dataReadiness: 'Low', dataSensitivity: 'Restricted', humanOversight: 'Human-in-the-loop', riskLevel: 'High',
          stage: 'Discovery', status: 'Blocked', priority: 'High', buildCost: 220000, runCostMonthly: 9000, forecastBenefitMonthly: 30000,
          scores: { value: 5, strategic: 5, feasibility: 2, data: 2, adoption: 3, time: 2, risk: 5 }, recommendation: 'Redesign', recommendationRationale: 'Sample: blocked on data access and tool authorisation design.',
          milestones: [{ id: 'sample-m5', title: 'Data access agreement', dueDate: day(-14), done: false }, { id: 'sample-m6', title: 'Tool permission design review', dueDate: day(-3), done: false }, { id: 'sample-m7', title: 'Feasibility readout', dueDate: day(14), done: false }],
          stageHistory: [hist('Intake', -35), hist('Discovery', -28)] }),
        P({ id: 'sample-p4', name: 'Demand forecasting refresh', problem: 'Weekly forecasts miss promotions.', businessUnit: 'Supply Chain', businessOwner: 'Sample owner D', technicalOwner: 'Sample lead D',
          kpi: 'Forecast error (WAPE)', baseline: '22%', target: '15%', pattern: 'Forecasting', dataReadiness: 'High', dataSensitivity: 'Internal', humanOversight: 'Human-on-the-loop', riskLevel: 'Low',
          stage: 'Production', status: 'Healthy', priority: 'Medium', buildCost: 95000, runCostMonthly: 2400, forecastBenefitMonthly: 15000, realizedBenefitMonthly: 16500,
          scores: { value: 4, strategic: 4, feasibility: 5, data: 5, adoption: 5, time: 4, risk: 1 }, recommendation: 'Proceed',
          milestones: [{ id: 'sample-m8', title: 'Quarterly model review', dueDate: day(25), done: false }],
          stageHistory: [hist('Pilot', -120), hist('Production', -70, 'Launch')] }),
        P({ id: 'sample-p5', name: 'Meeting summariser', problem: 'Notes are inconsistent across teams.', businessUnit: 'Operations', businessOwner: 'Sample owner E', technicalOwner: '',
          pattern: 'Other', stage: 'Idea', status: 'Healthy', priority: 'Low', scores: { value: 3, strategic: 2 }, milestones: [], stageHistory: [hist('Idea', -10, 'Created')] }),
        P({ id: 'sample-p6', name: 'Legacy chatbot replacement', problem: 'Replace the rules-based FAQ bot.', businessUnit: 'Customer Support', businessOwner: 'Sample owner A',
          pattern: 'RAG', stage: 'Sunset/Rejected', status: 'Healthy', priority: 'Low', scores: { value: 2, strategic: 2, feasibility: 4, data: 3, adoption: 2, time: 3, risk: 2 },
          recommendation: 'Reject', recommendationRationale: 'Sample: overlaps with the support assistant.', milestones: [],
          stageHistory: [hist('Idea', -90), hist('Intake', -80), hist('Sunset/Rejected', -50, 'Overlaps with sample-p1')] })
      ],
      risks: [
        { id: 'sample-r1', title: 'Prompt injection through retrieved documents', category: 'Security', description: 'Untrusted text in indexed documents could steer the assistant.', probability: 4, impact: 5, mitigation: 'Content filtering, output validation, least-privilege tools.', owner: 'Sample lead A', dueDate: day(5), status: 'Mitigating', reviewDate: day(-1), projectId: 'sample-p1', createdAt: ts(-20), updatedAt: ts(-3) },
        { id: 'sample-r2', title: 'Embedding model deprecation', category: 'Vendor', probability: 3, impact: 3, mitigation: 'Plan a re-index window; keep the embedding version in the index schema.', owner: 'Sample lead A', dueDate: day(40), status: 'Open', projectId: 'sample-p1', createdAt: ts(-18), updatedAt: ts(-18) },
        { id: 'sample-r3', title: 'Data licence for training examples unclear', category: 'Compliance', probability: 2, impact: 5, mitigation: 'Legal review of data sources before POC.', owner: 'Sample owner C', dueDate: day(-8), status: 'Open', projectId: 'sample-p3', createdAt: ts(-25), updatedAt: ts(-25) },
        { id: 'sample-r4', title: 'Run cost above forecast', category: 'Cost', probability: 3, impact: 3, mitigation: 'Prompt caching and model routing experiment.', owner: 'Sample lead A', dueDate: day(-2), status: 'Mitigating', projectId: 'sample-p1', createdAt: ts(-15), updatedAt: ts(-4) },
        { id: 'sample-r5', title: 'Key person dependency on one ML engineer', category: 'People', probability: 2, impact: 4, owner: 'Sample manager', status: 'Accepted', reviewDate: day(-5), createdAt: ts(-60), updatedAt: ts(-60) }
      ],
      decisions: [
        { id: 'sample-d1', title: 'Choose the vector store for the support assistant', context: 'Two candidates meet functional needs.', options: ['Managed search service', 'PostgreSQL with pgvector'], approver: 'Sample architect', status: 'Proposed', projectId: 'sample-p1', createdAt: ts(-6), updatedAt: ts(-6) },
        { id: 'sample-d2', title: 'Adopt a shared model gateway', context: 'Teams call models directly today.', options: ['Gateway', 'Direct access'], selectedOption: 'Gateway', rationale: 'Central rate limits and cost attribution.', approver: 'Sample architect', status: 'Approved', decisionDate: day(-100), reviewDate: day(-10), createdAt: ts(-100), updatedAt: ts(-100) }
      ],
      actions: [
        { id: 'sample-a1', title: 'Chase security review sign-off', owner: 'Sample manager', dueDate: day(-4), priority: 'High', status: 'Open', sourceType: 'project', sourceId: 'sample-p1', createdAt: ts(-12), updatedAt: ts(-12) },
        { id: 'sample-a2', title: 'Agree tool permission model with security', owner: 'Sample lead C', dueDate: day(4), priority: 'High', status: 'In progress', sourceType: 'project', sourceId: 'sample-p3', createdAt: ts(-9), updatedAt: ts(-2) },
        { id: 'sample-a3', title: 'Share pilot readout invite', owner: 'Sample manager', dueDate: day(6), priority: 'Low', status: 'Open', sourceType: 'manual', createdAt: ts(-1), updatedAt: ts(-1) },
        { id: 'sample-a4', title: 'Update the risk register after the review', owner: 'Sample manager', dueDate: day(-20), priority: 'Medium', status: 'Done', sourceType: 'manual', createdAt: ts(-30), updatedAt: ts(-19) }
      ],
      scenarios: []
    };
  }
};
