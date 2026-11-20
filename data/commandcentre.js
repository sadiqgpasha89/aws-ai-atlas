/* AI Engineering Manager Daily Command Centre.
   The executive operating dashboard for managing enterprise AI workloads,
   portfolio delivery, production health, and daily engineering decisions. */
window.ATLAS = window.ATLAS || {};
window.ATLAS.commandCentre = {
  kpis: [
    { id: 'active-projects', label: 'Active AI Projects', value: '12', sub: 'Across 5 engineering squads', status: 'ok', icon: 'project' },
    { id: 'at-risk', label: 'Projects At Risk', value: '3', sub: 'Requires EM unblocking today', status: 'warn', icon: 'alert' },
    { id: 'prod-systems', label: 'Production AI Systems', value: '7', sub: 'Serving live customer & internal traffic', status: 'ok', icon: 'server' },
    { id: 'monthly-spend', label: 'Monthly AI Spend', value: '₹8.4L', sub: '$10,120 / ₹10L monthly ceiling (84%)', status: 'ok', icon: 'budget' }
  ],

  attentionToday: [
    {
      id: 'att-1',
      project: 'Project Alpha (Customer Care Copilot)',
      severity: 'high',
      badge: 'RAG Eval Regression',
      issue: 'Groundedness (Faithfulness) dropped from 96.2% to 84.1% after the v2.4 knowledge base sync. Context retrieval is pulling stale cancellation policy chunks.',
      impact: 'Blocks scheduled production release v2.4. Customer service reps seeing hallucinatory waiver clauses.',
      action: 'Triggered ACL & chunking re-index. PE assigned to audit OpenSearch hybrid search BM25 weighting.'
    },
    {
      id: 'att-2',
      project: 'Project Beta (Document Intelligence)',
      severity: 'medium',
      badge: 'Bedrock Quota Pending',
      issue: 'Claude 3.7 Sonnet on-demand quota limit in us-east-1 (50 concurrent requests) reached 92% ceiling during peak invoice processing.',
      impact: 'Batch pipeline queue backing up in [[sqs|Amazon SQS]]; downstream ERP reconciliation delayed by 45 minutes.',
      action: 'AWS Service Quotas increase request submitted (ticket #94821). Fallback routing to us-west-2 cross-region inference profile active.'
    },
    {
      id: 'att-3',
      project: 'Project Gamma (Autonomous Claims Agent)',
      severity: 'critical',
      badge: 'Release Gate Sign-off',
      issue: 'Production Readiness Gate is at 28/30. Gate #29 (External Email Tool Human Authorization) and Gate #30 (Idempotency Key Enforcement) require EM sign-off.',
      impact: 'Cannot deploy to Production VPC until dual-authorization Step Functions workflow is verified.',
      action: 'Scheduled 10:00 AM architecture sign-off review with Principal Architect and InfoSec Lead.'
    },
    {
      id: 'att-4',
      project: 'Team Delta (Fraud Detection Platform)',
      severity: 'medium',
      badge: 'GPU Capacity Planning',
      issue: 'Self-hosted vLLM inference on [[eks|Amazon EKS]] g5.12xlarge instances is running at 89% GPU memory utilization with rising p99 latency (1.4s).',
      impact: 'Expected 25% traffic surge during month-end billing will breach 2.0s fraud scoring SLA.',
      action: 'Capacity planning session at 13:00 to evaluate AWS [[neuron|Trainium / Inferentia]] Trn1 / Inf2 migration vs provisioned Bedrock endpoints.'
    }
  ],

  decisionsToday: [
    {
      id: 'dec-1',
      title: 'Approve Model Promotion: Claude 3.7 Sonnet for Developer Copilot',
      category: 'Model Governance',
      context: 'Dev squad tested Claude 3.7 Sonnet against golden coding dataset (500 unit tests). Pass rate increased from 79% to 92.4% over Sonnet 3.5. Cost per task is neutral due to prompt caching.',
      options: ['Approve staging-to-prod promotion', 'Hold for 48h load testing', 'Reject'],
      recommendation: 'Approve. Pass rate exceeds 90% threshold; security scan verified zero prompt leakage.',
      status: 'Decision Required'
    },
    {
      id: 'dec-2',
      title: 'Architecture Exception: Direct OpenSearch KNN vs Bedrock Knowledge Bases',
      category: 'Architecture Review',
      context: 'Enterprise Search team requests bypassing [[bedrock-kb|Bedrock Knowledge Bases]] in favor of direct [[opensearch|Amazon OpenSearch Service]] client-side hybrid search to support custom document-level security filtering.',
      options: ['Grant 6-month exception with named owner', 'Deny and mandate Knowledge Bases metadata filters', 'Build hybrid adapter'],
      recommendation: 'Grant 6-month exception. Knowledge Bases native document-level security does not yet match Active Directory nested groups.',
      status: 'Decision Required'
    },
    {
      id: 'dec-3',
      title: 'Data Dependency Sign-off: Customer Support Vector Index ACL Sync',
      category: 'Data Governance',
      context: 'Pipeline synchronizing Salesforce permissions with vector search metadata has passed penetration test. Requires EM sign-off to access production customer data lake.',
      options: ['Sign-off production pipeline', 'Request additional synthetic data trial', 'Block'],
      recommendation: 'Sign-off. InfoSec and Data Governance leads have already recorded positive audit evidence in [[lakeformation|AWS Lake Formation]].',
      status: 'Ready to Sign'
    },
    {
      id: 'dec-4',
      title: 'Cloud Budget Approval: Document Intelligence Pilot Expansion',
      category: 'FinOps',
      context: 'Operations team requests expanding pilot from 10k to 50k invoices/month. Estimated incremental AWS spend: ₹95,000 ($1,140)/month on [[textract|Amazon Textract]] and [[bedrock|Bedrock]].',
      options: ['Approve from FinOps contingency reserve', 'Require 50% cost offset from decommissioned legacy OCR', 'Defer to Q1'],
      recommendation: 'Approve with condition: legacy ABBYY OCR licenses must be terminated by end of month, yielding net savings of ₹1.4L/mo.',
      status: 'Decision Required'
    }
  ],

  dailySchedule: [
    {
      time: '09:00 - 10:00',
      slot: 'Portfolio & Blocker Standup',
      focus: 'Review active projects, dependency blockers, and milestone critical paths across squads.',
      artifacts: 'AI Delivery Lifecycle Tracker, Sprint Burnup, RAID Log',
      checklist: [
        'Review 3 At-Risk projects (Alpha, Gamma, Delta)',
        'Check Bedrock quota ticket progress with AWS Enterprise Support',
        'Verify overnight batch document embedding completions in S3',
        'Confirm sprint deliverables on track for Friday demo'
      ]
    },
    {
      time: '10:00 - 11:00',
      slot: 'Architecture Review Board (ARB)',
      focus: 'Evaluate proposed AI architectures, model upgrades, and exception requests across 12 dimensions.',
      artifacts: 'Architecture Review Scorecard, ADR Templates, Threat Models',
      checklist: [
        'Review Project Gamma dual-authorization Step Functions state machine',
        'Evaluate OpenSearch direct hybrid search exception request',
        'Score systemic risk across active architectures',
        'Record signed ADRs in the Architecture Decision Centre'
      ]
    },
    {
      time: '11:00 - 12:30',
      slot: 'Technical Deep Dives & Quality Engineering',
      focus: 'Deep dive on evaluation baselines, prompt engineering, retrieval precision, and model safety.',
      artifacts: 'Evaluation Centre Dashboard, Golden Datasets, Regression Reports',
      checklist: [
        'Inspect Project Alpha groundedness drop in Bedrock Model Evaluation',
        'Verify chunking overlap parameters (current: 512 tokens / 64 overlap)',
        'Review automated prompt injection test suites for Public Assistant',
        'Audit tool calling schemas for agent argument validation'
      ]
    },
    {
      time: '13:30 - 15:00',
      slot: 'Delivery, Capacity & Workforce Planning',
      focus: 'Sprint capacity allocation, AWS service quotas, GPU reservation, and skill matrix alignment.',
      artifacts: 'Capacity Planning Calculator, Competency Matrix, Quotas Tracker',
      checklist: [
        'Model GPU memory utilization for Fraud Detection vLLM cluster',
        'Analyze cost-benefit of Trainium Trn1 instance reservation',
        'Review team skill gaps in Agentic Workflow Design and LangGraph/Strands',
        'Align staffing for upcoming Q1 Enterprise Search initiative'
      ]
    },
    {
      time: '15:00 - 16:00',
      slot: 'Production SRE & FinOps Review',
      focus: 'Real-time monitoring of live AI workloads, latency percentiles, error budgets, and unit costs.',
      artifacts: 'CloudWatch Operations Dashboard, Unit Economics Tracker, SRE Runbooks',
      checklist: [
        'Review 24h P95 TTFT (Time to First Token) across Bedrock models',
        'Inspect CloudWatch 429 throttling metrics and circuit breaker trip counts',
        'Calculate cost-per-task for Customer Copilot (current: ₹1.82 / query)',
        'Verify zero PII leakage alerts from [[macie|Amazon Macie]] and Guardrails'
      ]
    },
    {
      time: '16:00 - 17:00',
      slot: 'Executive & Stakeholder Communication',
      focus: 'Synthesize AI business impact, ROI realization, risk posture, and strategic roadmap for leadership.',
      artifacts: 'Executive AI Portfolio Report, Business Value Scorecard, Risk Register',
      checklist: [
        'Update Monthly AI Business Value Scorecard (Hours saved: 1,420h)',
        'Draft executive briefing on Bedrock vs SageMaker multi-cloud strategy',
        'Circulate weekly AI delivery digest to VP of Engineering and Product Leads',
        'Confirm sign-offs for tomorrow\'s production deployments'
      ]
    }
  ],

  productionHealth: [
    { metric: 'Bedrock API Availability', current: '99.98%', target: '>= 99.90%', status: 'ok', window: 'Last 30 Days' },
    { metric: 'Agent Goal Completion Rate', current: '94.6%', target: '>= 95.0%', status: 'warn', window: 'Last 7 Days (1,420 tasks)' },
    { metric: 'RAG Answer Groundedness', current: '95.4%', target: '>= 95.0%', status: 'ok', window: 'Golden Eval Sample (n=500)' },
    { metric: 'P95 Response Latency (TTFT)', current: '2.1s', target: '< 3.0s', status: 'ok', window: 'Streaming Invocations' },
    { metric: 'Average Cost Per AI Task', current: '₹1.82', target: '< ₹2.50', status: 'ok', window: 'Blended Model & Tools' },
    { metric: 'Guardrail Interventions', current: '1.4%', target: '< 3.0%', status: 'ok', window: 'PII & Jailbreak Filters' },
    { metric: 'Error Budget Remaining', current: '68%', target: '> 50%', status: 'ok', window: 'Monthly SRE Budget' },
    { metric: 'Open SRE Incidents', current: '0 Sev-1 / 1 Sev-2', target: '0 Sev-1 / 0 Sev-2', status: 'warn', window: 'Active Operations' }
  ],

  recentIncidents: [
    {
      id: 'INC-2026-11-18',
      severity: 'SEV-2',
      title: 'Bedrock 429 Throttling on Claude 3.5 Sonnet during Batch Ingestion',
      duration: '42 mins',
      impact: '1,200 document chunks queued; invoice processing delayed by 28 mins.',
      rootCause: 'Batch extraction job fired 200 concurrent requests without exponential backoff jitter.',
      status: 'Remediated',
      actionItem: 'Enforced full jitter exponential backoff in Lambda producer and activated SQS dead-letter queue.'
    },
    {
      id: 'INC-2026-11-14',
      severity: 'SEV-3',
      title: 'OpenSearch Vector Index Memory Pressure Alarm (82%)',
      duration: '1h 15m',
      impact: 'P95 vector query latency increased from 45ms to 320ms.',
      rootCause: 'HNSW vector graphs expanded following ingestion of 80,000 technical manuals.',
      status: 'Remediated',
      actionItem: 'Scaled OpenSearch cluster from 2 to 4 data nodes (r6g.xlarge.search) and tuned HNSW m=16, efSearch=100.'
    }
  ]
};
