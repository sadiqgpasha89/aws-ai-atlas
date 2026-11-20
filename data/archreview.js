/* Enterprise AI Architecture Review System.
   A standardized, 12-dimension review framework, risk scoring engine,
   and Architecture Review Board (ARB) workspace for AI Engineering Managers and Principal Engineers. */
window.ATLAS = window.ATLAS || {};
window.ATLAS.archReview = {
  dimensions: [
    {
      id: 'dim-1',
      num: 1,
      title: 'Business Problem & Value Justification',
      weight: 10,
      description: 'Is the business problem well-framed, measurable, and genuinely requiring AI over deterministic code?',
      scoringCriteria: [
        '1-3: Vague "explore AI" goal without baseline metrics or clear user persona.',
        '4-6: Clear problem, but deterministic rules or existing software could solve 80% without an LLM.',
        '7-8: Well-defined business problem with quantified baseline metrics and ROI model.',
        '9-10: Compelling, validated business case where AI is the sole viable path to 10x ROI.'
      ],
      keyQuestions: [
        'What is the current manual process error rate, latency, and hourly cost?',
        'Why does a deterministic rule-based engine, regex, or standard SQL query fail here?',
        'Who is the executive business owner accountable for the measured business KPI?'
      ],
      redFlags: [
        'AI solution looking for a problem.',
        'No baseline metrics exist to compare against post-launch.',
        'The sponsor cannot define what acceptable accuracy looks like.'
      ]
    },
    {
      id: 'dim-2',
      num: 2,
      title: 'Architecture Fit & System Complexity',
      weight: 10,
      description: 'Does the architecture balance operational simplicity with scalability, avoiding unnecessary moving parts?',
      scoringCriteria: [
        '1-3: Extreme over-engineering (e.g. 5-agent swarm where 1 prompt suffices; unneeded Kubernetes clusters).',
        '4-6: Functional architecture, but introduces unnecessary bespoke microservices or unmanaged state.',
        '7-8: Clean alignment with AWS Well-Architected GenAI Lens; right balance of managed and custom services.',
        '9-10: Elegant, minimal architecture; maximal use of managed primitives; decoupled and easily auditable.'
      ],
      keyQuestions: [
        'Can this architecture be drawn with 5 or fewer core AWS primitives?',
        'What is the blast radius if the primary AI orchestration service experiences a 10-minute outage?',
        'Are we introducing new database or streaming technologies our team has never run in production?'
      ],
      redFlags: [
        'Building a custom agent framework when Step Functions or Bedrock Agents suffices.',
        'Deploying a self-hosted vector database when team lacks operational DBA capacity.',
        'Circular service dependencies between orchestrator and tool execution backends.'
      ]
    },
    {
      id: 'dim-3',
      num: 3,
      title: 'Data Architecture, Lineage & Quality',
      weight: 10,
      description: 'Is data ingestion, deduplication, chunking, PII redaction, and access synchronization robust?',
      scoringCriteria: [
        '1-3: Ad-hoc S3 bucket dump with no data cleaning, deduplication, or schema validation.',
        '4-6: Basic chunking in place, but lacks automated refresh, ACL synchronization, or PII scanning.',
        '7-8: Governed data lake in S3 with Lake Formation policies, automated OCR/parsing, and metadata tagging.',
        '9-10: Production data pipeline with continuous quality validation, OpenLineage tracking, and instant ACL propagation.'
      ],
      keyQuestions: [
        'How are document access controls (ACLs) mirrored from source systems into the vector search layer?',
        'What happens when a source document in S3 is updated or deleted? How are stale chunks purged?',
        'Is PII automatically redacted or masked before documents reach embedding models and LLMs?'
      ],
      redFlags: [
        'Ingesting raw customer data without automated [[macie|Amazon Macie]] or Bedrock Guardrails PII scanning.',
        'No mechanism to handle document deletion, causing the assistant to cite superseded policies.',
        'Unversioned document chunks stored without source URI and page-number metadata.'
      ]
    },
    {
      id: 'dim-4',
      num: 4,
      title: 'Model & Inference Strategy',
      weight: 10,
      description: 'Is model selection justifiable on quality, latency, context window, licensing, and economics?',
      scoringCriteria: [
        '1-3: Defaulted to the largest frontier model for all tasks with zero benchmark testing.',
        '4-6: Single model used across all user intents without routing or small-model-first strategy.',
        '7-8: Rationalized model choice with empirical evaluation benchmark data and token cost estimates.',
        '9-10: Dynamic model routing: routine queries handled by SLMs (Nova Micro / Haiku); complex reasoning by Sonnet.'
      ],
      keyQuestions: [
        'What empirical evaluation data demonstrates that this model outperforms a smaller, cheaper alternative?',
        'Are we utilizing AWS Bedrock Cross-Region Inference Profiles to mitigate regional quota exhaustion?',
        'Is prompt caching enabled for long system prompts or static contextual documentation?'
      ],
      redFlags: [
        'Proposing fine-tuning before establishing an optimized prompt-plus-RAG baseline.',
        'Hardcoding model IDs in application code rather than using configuration or inference profiles.',
        'Ignoring context window degradation and token pricing on 100k+ input prompts.'
      ]
    },
    {
      id: 'dim-5',
      num: 5,
      title: 'RAG & Retrieval Quality Engineering',
      weight: 10,
      description: 'Does retrieval use hybrid search, cross-encoder reranking, and semantic evaluation baselines?',
      scoringCriteria: [
        '1-3: Naive vector similarity search with arbitrary fixed chunk size and no evaluation dataset.',
        '4-6: Hybrid search enabled, but lacks reranking, metadata filtering, or citation validation.',
        '7-8: Tuned hybrid search (BM25 + KNN) with Bedrock/Cohere reranker and verified Recall@K metrics.',
        '9-10: Enterprise RAG: semantic chunking, hierarchical parent-child retrieval, automated RAGAS eval in CI/CD.'
      ],
      keyQuestions: [
        'What is your measured Recall@K and NDCG on the golden test dataset?',
        'How does the system prevent retrieving chunks that the specific requesting user is not authorized to see?',
        'Is reranking applied to the top 25-50 vector candidates before feeding the top 5 to the LLM?'
      ],
      redFlags: [
        'No golden evaluation dataset exists before building retrieval pipelines.',
        'Relying purely on cosine vector similarity for queries that contain exact SKU, date, or ID strings.',
        'LLM generates answers without mandatory, verifiable source citations.'
      ]
    },
    {
      id: 'dim-6',
      num: 6,
      title: 'Agent Autonomy, Tool Design & Guardrails',
      weight: 10,
      description: 'Are agent execution budgets, tool authorization boundaries, loop breakers, and human gates enforced?',
      scoringCriteria: [
        '1-3: Autonomous agent with broad database write access, no step limits, and no human checkpoints.',
        '4-6: Bounded execution, but lacks strict JSON schema validation on tool parameters and has weak loop detection.',
        '7-8: Explicit autonomy level (L2/L3); strict IAM execution roles; Step Functions human approval for sensitive tools.',
        '9-10: Production agent architecture: deterministic state machine orchestration, hard token budgets, kill switch.'
      ],
      keyQuestions: [
        'What is the maximum step count and token budget allocated to an individual agent run before hard termination?',
        'Are irreversible actions (payments, data deletion, external emails) gated behind a human-in-the-loop callback?',
        'How are tool parameters validated before invocation to prevent SQL injection or command injection via the LLM?'
      ],
      redFlags: [
        'Granting the agent direct production database credentials or administrative IAM privileges.',
        'No loop detection mechanism; agent can burn thousands of dollars in runaway reasoning loops.',
        'Autonomous execution of financial, legal, or infrastructure changes without explicit dual-authorization.'
      ]
    },
    {
      id: 'dim-7',
      num: 7,
      title: 'Security, Identity & Least Privilege',
      weight: 10,
      description: 'Are IAM roles bounded, network paths isolated, secrets protected, and prompt injection defended?',
      scoringCriteria: [
        '1-3: Public endpoints, shared IAM roles with FullAccess policies, hardcoded API keys, no guardrails.',
        '4-6: Private VPC, but uses overly broad IAM policies and lacks automated input/output prompt filtering.',
        '7-8: Strict least-privilege IAM roles, KMS Customer Managed Keys, PrivateLink VPC endpoints, Bedrock Guardrails.',
        '9-10: Zero-trust architecture: workload identity federation, automated threat modeling, prompt injection defense in depth.'
      ],
      keyQuestions: [
        'Does the application communicate with AWS Bedrock and OpenSearch exclusively over VPC PrivateLink endpoints?',
        'Are Bedrock Guardrails configured to block direct and indirect prompt injection attempts?',
        'Are temporary credentials scoped to individual user sessions using AWS STS Session Policies?'
      ],
      redFlags: [
        'IAM policy granting `bedrock:*` or `s3:*` without resource ARN constraints.',
        'Inbound API Gateway exposed to public internet without WAF rate-limiting and bot protection rules.',
        'System prompt contains sensitive credentials, API keys, or proprietary business secrets.'
      ]
    },
    {
      id: 'dim-8',
      num: 8,
      title: 'Privacy, Compliance & Responsible AI',
      weight: 5,
      description: 'Does the system adhere to GDPR, DPDP Act 2023, EU AI Act, SOC 2, and data residency standards?',
      scoringCriteria: [
        '1-3: Model provider logs raw customer prompts for training; zero privacy or compliance review.',
        '4-6: Privacy policy stated, but data retention, deletion workflows, and audit logging are unverified.',
        '7-8: CloudTrail activity logging, automated Macie PII masking, adherence to AWS zero-data-retention guarantee.',
        '9-10: Full regulatory crosswalk completed; cryptographically verifiable audit trail; automated compliance evidence generation.'
      ],
      keyQuestions: [
        'Does the AWS Bedrock customer agreement guarantee that customer prompts and completions are never used to train base models?',
        'How does the architecture honor a GDPR / DPDP "Right to be Forgotten" request across vector indices?',
        'Are AI-generated outputs disclosed to end users in compliance with the EU AI Act and corporate ethics policies?'
      ],
      redFlags: [
        'Calling external non-AWS SaaS LLM endpoints where customer PII is transmitted outside approved regions.',
        'Prompt and response payloads stored in plaintext without lifecycle expiration policies in S3.',
        'No audit trail linking an AI recommendation to the exact model version and prompt template used.'
      ]
    },
    {
      id: 'dim-9',
      num: 9,
      title: 'Reliability, Resilience & Disaster Recovery',
      weight: 10,
      description: 'Are multi-AZ deployments, cross-region fallback, circuit breakers, and idempotency enforced?',
      scoringCriteria: [
        '1-3: Single AZ, single region, no retry logic, no fallback model; system crashes on first 429 throttle.',
        '4-6: Multi-AZ infrastructure, but lacks model fallback routing and has basic un-jittered retry logic.',
        '7-8: Exponential backoff with full jitter, circuit breakers on external tools, multi-region inference fallback.',
        '9-10: Chaos-tested resilience: active-active multi-region failover (RTO < 5m), idempotency keys, durable state checkpointing.'
      ],
      keyQuestions: [
        'What happens when Bedrock returns an HTTP 429 ThrottlingException or 503 ServiceUnavailable?',
        'Are write operations idempotent (using client request tokens) so that network retries never cause duplicate charges or writes?',
        'If us-east-1 suffers a major regional impairment, can traffic fail over cleanly to us-west-2 or eu-west-1?'
      ],
      redFlags: [
        'Synchronous user-facing requests waiting on long-running LLM inferences without timeouts.',
        'No dead-letter queues configured for asynchronous document processing pipelines.',
        'Assuming 100% availability for third-party external tool APIs.'
      ]
    },
    {
      id: 'dim-10',
      num: 10,
      title: 'Performance, Latency & Scalability',
      weight: 5,
      description: 'Are P95 Time-to-First-Token (TTFT), streaming SSE, and peak concurrency validated under load?',
      scoringCriteria: [
        '1-3: Multi-second blank screen delays; synchronous blocking calls; concurrency crashes at 10 users.',
        '4-6: Streaming implemented, but P95 latency is high (> 6s) and backend suffers from cold start bottlenecks.',
        '7-8: Server-Sent Events (SSE) streaming; P95 TTFT < 2.5s; provisioned concurrency on critical Lambda resolvers.',
        '9-10: Optimized performance: prompt caching, sub-second TTFT, horizontal auto-scaling verified to 10x peak volume.'
      ],
      keyQuestions: [
        'Is streaming response (Server-Sent Events) implemented end-to-end from Bedrock to client UI?',
        'Has the system undergone load testing at 2x forecasted peak concurrent user volume?',
        'What is the measured P50, P90, and P99 Time to First Token (TTFT) and Total Duration?'
      ],
      redFlags: [
        'Buffering the entire LLM completion in memory before sending it to the user.',
        'Running embedding generation sequentially in a loop rather than batching in parallel chunks.',
        'Lambda cold starts adding 4+ seconds of latency on top of model inference.'
      ]
    },
    {
      id: 'dim-11',
      num: 11,
      title: 'Cost Engineering, FinOps & Unit Economics',
      weight: 10,
      description: 'Is cost-per-task forecasted, tracked per tenant, bounded by budgets, and optimized via caching?',
      scoringCriteria: [
        '1-3: No token tracking, no cost allocation tags, no forecast; surprise multi-thousand-dollar AWS bill imminent.',
        '4-6: Basic token usage monitored, but unit economics (cost per completed task) are unknown.',
        '7-8: Instrumented cost per task; AWS Budgets alerts configured; prompt caching enabled; clear financial ROI.',
        '9-10: Advanced FinOps: real-time per-tenant cost attribution, automated model down-routing, continuous unit economics optimization.'
      ],
      keyQuestions: [
        'What is the fully loaded cost per successful AI task (tokens + vector store + compute + observability)?',
        'Are AWS Cost Allocation Tags (e.g. `Project`, `CostCenter`, `Environment`) applied to all resources?',
        'Is an AWS Budgets threshold configured to alert engineering managers at 80% and 100% of forecast?'
      ],
      redFlags: [
        'No cost-per-task ceiling established before moving from prototype to production.',
        'Using uncompressed 200,000-token prompts for routine queries that require only 1,000 tokens.',
        'Failing to enable Bedrock prompt caching for repetitive long system prompts.'
      ]
    },
    {
      id: 'dim-12',
      num: 12,
      title: 'Operations, Monitoring & Production Ownership',
      weight: 5,
      description: 'Are CloudWatch dashboards, distributed tracing, alerting runbooks, and named on-call engineers in place?',
      scoringCriteria: [
        '1-3: "Fire and forget" deployment; no dashboards, no custom metrics, no on-call engineer, no runbook.',
        '4-6: Basic CloudWatch alarms for 5xx errors, but no visibility into LLM quality, latency, or agent loops.',
        '7-8: Production operations dashboard (10 widgets); CloudWatch alarms; documented SRE runbooks; named on-call.',
        '9-10: Enterprise SRE: OpenTelemetry distributed tracing across agent steps, automated drift detection, automated canary rollback.'
      ],
      keyQuestions: [
        'Who is on-call when this system generates an alert at 3:00 AM, and what is their first runbook action?',
        'Do we capture end-to-end distributed traces linking the user request to retrieval, model calls, and tools?',
        'How do we detect and alert when model hallucination or refusal rates spike in production?'
      ],
      redFlags: [
        'No runbook for handling Bedrock 429 throttling spikes or model degradation.',
        'Logging raw customer prompts containing PII into unencrypted CloudWatch log groups.',
        'Absence of an automated kill switch to disable the AI feature if it malfunctions.'
      ]
    }
  ],

  riskCalculator: {
    likelihoodLevels: [
      { score: 1, label: 'Unlikely', desc: 'Rare event; requires multiple cascading failures or sophisticated deliberate abuse' },
      { score: 2, label: 'Possible', desc: 'Occurs under edge conditions, unexpected user inputs, or moderate traffic spikes' },
      { score: 3, label: 'Likely', desc: 'Expected to occur regularly in production without defensive controls' },
      { score: 4, label: 'Almost Certain', desc: 'Guaranteed failure under normal operating loads or standard attack vectors' }
    ],
    impactLevels: [
      { score: 1, label: 'Negligible', desc: 'Minor cosmetic flaw; zero financial, security, or regulatory consequence' },
      { score: 2, label: 'Moderate', desc: 'Degraded user experience; temporary retry delay; cost variance < 10%' },
      { score: 3, label: 'Major', desc: 'Breached customer SLA; significant financial loss; confidential data disclosure' },
      { score: 4, label: 'Critical', desc: 'Severe regulatory fine; catastrophic data leak; irreversible data corruption; executive liability' }
    ],
    getScore: function (l, i) {
      var s = l * i;
      if (s <= 3) return { score: s, rating: 'Low', color: 'ok' };
      if (s <= 7) return { score: s, rating: 'Medium', color: 'warn' };
      if (s <= 11) return { score: s, rating: 'High', color: 'warn' };
      return { score: s, rating: 'Critical', color: 'crit' };
    }
  },

  systemicRiskView: [
    {
      squad: 'Squad Alpha (Customer Experience)',
      project: 'Customer Care Copilot',
      score: 82,
      riskLevel: 'Medium',
      primaryFinding: 'Retrieval accuracy regression on stale return policies; needs automated ACL refresh pipeline.',
      topRisk: 'Stale chunk retrieval causes inaccurate customer commitments (Likelihood: 3, Impact: 2 = Score 6)'
    },
    {
      squad: 'Squad Beta (Insurance Automation)',
      project: 'Autonomous Claims Agent',
      score: 64,
      riskLevel: 'Critical',
      primaryFinding: 'Autonomous payout execution lacking dual-authorization Step Functions gate; excessive agent tool permissions.',
      topRisk: 'Agent hallucinates approved claim payout without human review (Likelihood: 4, Impact: 4 = Score 16)'
    },
    {
      squad: 'Squad Gamma (Shared Services)',
      project: 'Document Intelligence Pipeline',
      score: 91,
      riskLevel: 'Low',
      primaryFinding: 'Solid production architecture; minor quota bottleneck during month-end batch invoice bursts.',
      topRisk: 'Bedrock concurrent request throttling delays billing by 1h (Likelihood: 2, Impact: 2 = Score 4)'
    },
    {
      squad: 'Squad Delta (Fraud & Risk)',
      project: 'Real-Time Fraud Scorer',
      score: 88,
      riskLevel: 'Low',
      primaryFinding: 'Sub-80ms P99 latency achieved on Inferentia; needs cost commitment optimization.',
      topRisk: 'EKS GPU node memory fragmentation during peak traffic (Likelihood: 2, Impact: 3 = Score 6)'
    },
    {
      squad: 'Squad Epsilon (Productivity)',
      project: 'Developer Copilot',
      score: 74,
      riskLevel: 'High',
      primaryFinding: 'Unversioned prompts and missing regression test suite for internal proprietary frameworks.',
      topRisk: 'Model update breaks internal coding conventions and generates insecure SQL (Likelihood: 3, Impact: 3 = Score 9)'
    }
  ]
};
