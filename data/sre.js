/* Production SRE, Reliability & Resilience Engineering.
   Failure simulation drills, Service Level Objectives (SLOs),
   AI incident taxonomy, and operational triage runbooks for production systems on AWS. */
window.ATLAS = window.ATLAS || {};
window.ATLAS.sre = {
  principles: [
    { title: 'Multi-AZ High Availability', desc: 'Deploy stateless application layers (API Gateway, Lambda, ECS, EKS) across at least 3 Availability Zones.' },
    { title: 'Cross-Region Model Fallback', desc: 'Configure Bedrock Cross-Region Inference Profiles (us-east-1 -> us-west-2) to survive regional quota or capacity exhaustion.' },
    { title: 'Model Fallback Routing', desc: 'If primary model (Claude 3.7 Sonnet) returns HTTP 500/503, automatically degrade gracefully to backup model (Claude 3.5 Haiku / Nova Pro).' },
    { title: 'Exponential Backoff with Full Jitter', desc: 'Never retry on fixed intervals. Implement `sleep = rand(0, min(cap, base * 2^attempt))` to prevent thundering herd on Bedrock APIs.' },
    { title: 'Circuit Breakers on External Tools', desc: 'Wrap third-party API tool calls in a circuit breaker. After 5 consecutive failures, trip the breaker and skip tool invocation for 60s.' },
    { title: 'Granular Per-Call Timeouts', desc: 'Set explicit timeouts: 2.5s for vector retrieval, 15s for LLM generation, 5s for tool microservices. Never allow unbounded waits.' },
    { title: 'Idempotency Keys on Action Tools', desc: 'Attach client request tokens to all state-changing API operations (payments, database updates) to prevent duplicate execution during network retries.' },
    { title: 'Durable State Checkpointing', desc: 'Persist intermediate agent execution state to DynamoDB before every tool call; enable resumable workflows if execution dies midway.' },
    { title: 'Graceful Human Escalation', desc: 'When confidence scores drop below threshold or retries are exhausted, cleanly serialize execution context and hand off to human support agent.' },
    { title: 'Automated Kill Switch', desc: 'Feature flag or AppConfig parameter that instantly disables AI agent tool execution and falls back to canned safe responses in < 30 seconds.' },
    { title: 'Rate Limiting & Tiered Quotas', desc: 'Enforce per-user and per-organization token rate limits at API Gateway / WAF to prevent rogue scripts from exhausting shared model quotas.' },
    { title: 'Deterministic Loop & Budget Ceilings', desc: 'Enforce hard execution ceilings on autonomous agents (max 10 iterations, max 50,000 tokens) before forcing exit to human escalation.' }
  ],

  slos: [
    { sli: 'Service Availability', slo: '99.90%', measurement: 'HTTP 2xx & 3xx / Total Requests (30-day rolling window)', errorBudget: '43.2 mins downtime / month' },
    { sli: 'P95 Response Latency (Streaming TTFT)', slo: '< 2.5 seconds', measurement: 'Time from request receipt to first streamed token byte', errorBudget: 'Max 5% of requests may exceed 2.5s' },
    { sli: 'End-to-End Task Completion Rate', slo: '>= 95.0%', measurement: 'User requests resolved without error or human escalation', errorBudget: '5% failure / escalation rate' },
    { sli: 'Answer Groundedness (Faithfulness)', slo: '>= 95.0%', measurement: 'Factual claims substantiated by retrieved context (daily synthetic sample)', errorBudget: 'Max 5% ungrounded statements' },
    { sli: 'Monthly Cost Per Task Stability', slo: 'Within ± 10% of forecast', measurement: 'Actual measured unit cost per completed task', errorBudget: '10% cost variance' },
    { sli: 'Critical Security / Jailbreak Incidents', slo: 'Zero tolerance (0 incidents)', measurement: 'Exfiltrated credentials, prompt injections, or unauthorized database mutations', errorBudget: '0 error budget' }
  ],

  chaosDrills: [
    {
      id: 'drill-01',
      title: 'Bedrock 429 Throttling Storm',
      scenario: 'Simulate 5x burst traffic resulting in 200 consecutive HTTP 429 ThrottlingExceptions from AWS Bedrock.',
      expectedBehavior: 'Application absorbs spike via SQS queue buffer, invokes exponential backoff with full jitter, and falls back to cross-region endpoint without dropping requests.',
      verification: 'Zero HTTP 500 errors returned to end users; P99 latency degrades gracefully by < 4 seconds.'
    },
    {
      id: 'drill-02',
      title: 'Primary Model Provider Outage',
      scenario: 'Simulate complete outage or 503 unavailability of primary foundation model (Claude 3.7 Sonnet).',
      expectedBehavior: 'Circuit breaker trips within 3 failed attempts; request router automatically switches traffic to secondary backup model (Amazon Nova Pro).',
      verification: 'System continues serving customer queries with degraded reasoning banner; zero complete outages.'
    },
    {
      id: 'drill-03',
      title: 'OpenSearch Vector Index Memory Pressure',
      scenario: 'Simulate OpenSearch Serverless / Managed cluster JVM memory exceeding 85% with dropping query throughput.',
      expectedBehavior: 'CloudWatch alarm triggers automated shard scaling or throttles non-critical background document ingestion jobs.',
      verification: 'Interactive RAG search latency stays below 300ms; background re-indexing yields gracefully.'
    },
    {
      id: 'drill-04',
      title: 'S3 Document Store Latency Glitch',
      scenario: 'Inject 3,000ms artificial latency on S3 `GetObject` calls when reading source PDF manuals.',
      expectedBehavior: 'Application reads chunk text from cached vector database payload rather than fetching full source document from S3 on every request.',
      verification: 'User response generation time is completely unimpacted by S3 slow responses.'
    },
    {
      id: 'drill-05',
      title: 'Lambda Concurrency Saturation',
      scenario: 'Simulate regional Lambda account concurrency ceiling (1,000 concurrent executions) saturated by background batch workers.',
      expectedBehavior: 'Reserved Concurrency settings on user-facing API resolvers protect interactive traffic from batch worker starvation.',
      verification: 'Interactive user queries execute without throttling; batch workers back off via SQS.'
    },
    {
      id: 'drill-06',
      title: 'EKS GPU Worker Node Preemption (Spot)',
      scenario: 'Simulate AWS preemption of a g5.12xlarge Spot instance running self-hosted vLLM serving.',
      expectedBehavior: 'Karpenter receives 2-minute preemption notice, drains node gracefully, redirects traffic to remaining nodes, and launches replacement instance.',
      verification: 'Active inference requests complete; zero interrupted dropped user queries.'
    },
    {
      id: 'drill-07',
      title: 'External Tool API HTTP 500 Outage',
      scenario: 'Simulate third-party currency conversion or weather tool returning continuous HTTP 500 errors.',
      expectedBehavior: 'Agent detects tool failure, does NOT enter infinite retry loop, informs user that tool is temporarily unavailable, and completes remaining sub-tasks.',
      verification: 'Agent successfully finishes response with partial data; avoids burning tokens.'
    },
    {
      id: 'drill-08',
      title: 'EventBridge Poison Message Loop',
      scenario: 'Inject malformed JSON payload into event bus that causes consumer Lambda function to crash.',
      expectedBehavior: 'Message fails 3 retry attempts and is routed to Dead-Letter Queue (DLQ); CloudWatch alarm notifies on-call engineer.',
      verification: 'Event pipeline continues processing healthy events; poison message isolated in DLQ.'
    },
    {
      id: 'drill-09',
      title: 'Runaway Agent Loop Token Explosion',
      scenario: 'Simulate adversarial prompt designed to trap agent in circular reasoning ("Call tool A, then tool B, then tool A forever").',
      expectedBehavior: 'Loop breaker detects identical tool call history at step 4; hard step ceiling terminates execution at step 10.',
      verification: 'Total token consumption capped at 50,000 tokens; agent returns polite fallback message.'
    },
    {
      id: 'drill-10',
      title: 'Cross-Region Network Partition',
      scenario: 'Simulate network failure between primary region (us-east-1) and secondary backup region (us-west-2).',
      expectedBehavior: 'Route 53 latency/health check marks secondary region unhealthy; all local traffic stays pinned to healthy primary region.',
      verification: 'Zero cross-region routing timeouts; isolation maintained.'
    },
    {
      id: 'drill-11',
      title: 'IAM STS Temporary Credential Expiration',
      scenario: 'Simulate execution of an agent task spanning 20 minutes when STS session policy expires at 15 minutes.',
      expectedBehavior: 'Agent execution runtime refreshes STS temporary credentials automatically before making tool calls.',
      verification: 'Long-running multi-step workflows do not fail with AccessDeniedException.'
    },
    {
      id: 'drill-12',
      title: '10x Flash Crowd Traffic Surge',
      scenario: 'Inject 10x traffic spike over 60 seconds (simulating marketing campaign launch).',
      expectedBehavior: 'API Gateway absorbs burst; Bedrock on-demand scaling handles requests; provisioned Lambda concurrency scales smoothly.',
      verification: 'Zero 5xx errors; P99 latency increases by no more than 50%.'
    },
    {
      id: 'drill-13',
      title: 'Guardrail False-Positive Spike',
      scenario: 'Simulate over-aggressive content filter blocking legitimate enterprise customer queries containing technical jargon.',
      expectedBehavior: 'CloudWatch alarm on GuardrailInterventionRate > 5% alerts engineering team; fallback to permissive internal model tier.',
      verification: 'On-call engineer tunes guardrail confidence threshold via AppConfig within 10 minutes.'
    },
    {
      id: 'drill-14',
      title: 'DynamoDB State Lock Contention',
      scenario: 'Simulate 50 concurrent updates to the same user conversational session state in DynamoDB.',
      expectedBehavior: 'Optimistic locking with version attribute (`attribute_exists(version) AND version = :v`) prevents state overwrites; failed updates retry.',
      verification: 'Conversational memory remains consistent; zero message history corruption.'
    }
  ],

  incidentTaxonomy: [
    { category: 'Quality Incident', examples: 'Severe hallucination, factual regression, inappropriate response, incorrect mathematical output', defaultSev: 'SEV-2 / SEV-3' },
    { category: 'Model Incident', examples: 'Bedrock 503 outage, provider latency spike, model version deprecation, quota exhaustion', defaultSev: 'SEV-1 / SEV-2' },
    { category: 'Retrieval Incident', examples: 'OpenSearch cluster offline, stale document context served, chunk index corruption, ACL leak', defaultSev: 'SEV-2' },
    { category: 'Agent Incident', examples: 'Runaway circular loop, unhandled tool error, state desynchronization, incorrect tool argument execution', defaultSev: 'SEV-2' },
    { category: 'Security Incident', examples: 'Direct/indirect prompt injection successful, PII leak in output, unauthorized database mutation', defaultSev: 'SEV-1' },
    { category: 'Financial Incident', examples: 'Uncontrolled token burn spike, unexpected $5,000+ daily charge, provisioned concurrency leak', defaultSev: 'SEV-2' },
    { category: 'Infrastructure Incident', examples: 'VPC PrivateLink disconnect, Lambda cold start timeout spike, EKS GPU node failure', defaultSev: 'SEV-2' },
    { category: 'Compliance Incident', examples: 'Processing customer data in unauthorized AWS region, violation of data retention policy', defaultSev: 'SEV-1' }
  ]
};
