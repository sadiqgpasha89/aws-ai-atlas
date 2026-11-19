/* Production AI Operations Centre: Operational Dashboard, SRE Runbooks & Postmortems */
window.ATLAS.operations = {
  "title": "Production AI Operations Centre",
  "lede": "Operating generative AI and agentic systems requires moving from traditional server health monitoring to stochastic system reliability: tracking token economics, prompt drift, retrieval quality, tool error rates, and 429 throttling spikes.",
  "dashboardTemplate": {
    "title": "Mandatory Production AI Operations Dashboard Template",
    "subtitle": "The 10 critical operational indicators that every production AI application must monitor in real time.",
    "widgets": [
      {
        "id": "task-throughput",
        "title": "Task Throughput & Completion Rate",
        "metric": "98.6%",
        "sub": "16,420 Total Tasks · 16,190 Succeeded · 230 Failed",
        "status": "ok",
        "target": "Target: >95% successful task completion rate",
        "kusto": "fields @timestamp, status | filter status in [\"success\", \"failure\"] | stats count() as total, sum(status=\"success\") as succeeded by bin(1h) | eval success_rate = (succeeded * 100.0) / total"
      },
      {
        "id": "ttft-latency",
        "title": "Time to First Token (TTFT)",
        "metric": "780ms",
        "sub": "P50: 610ms · P95: 1,380ms · P99: 2,050ms",
        "status": "ok",
        "target": "Target: P95 TTFT < 1,500ms for streaming UX",
        "kusto": "fields @timestamp, ttft_ms | stats pct(ttft_ms, 50) as p50, pct(ttft_ms, 95) as p95, pct(ttft_ms, 99) as p99 by bin(15m)"
      },
      {
        "id": "token-burn",
        "title": "Token Consumption & Cache Efficiency",
        "metric": "21.2M",
        "sub": "Prompt: 14.6M (45% Cached) · Completion: 6.6M",
        "status": "ok",
        "target": "Target: >35% prompt cache hit rate on repeated prefixes",
        "kusto": "fields @timestamp, prompt_tokens, completion_tokens, cached_tokens | stats sum(prompt_tokens) as prompt, sum(completion_tokens) as completion, sum(cached_tokens) as cached by bin(1h)"
      },
      {
        "id": "throttling-429",
        "title": "Model Throttling Events (HTTP 429)",
        "metric": "8 events",
        "sub": "0.05% of all requests · 100% absorbed by cross-region failover",
        "status": "ok",
        "target": "Target: <0.1% throttling rate; zero user-facing 429 errors",
        "kusto": "fields @timestamp, error_code, target_model | filter error_code = \"ThrottlingException\" | stats count() as throttles by bin(5m), target_model"
      },
      {
        "id": "rag-quality",
        "title": "RAG Retrieval & Groundedness Score",
        "metric": "96.8%",
        "sub": "Recall@5: 92.1% · Groundedness: 96.8% · Relevance: 94.5%",
        "status": "ok",
        "target": "Target: >95% groundedness; >88% Recall@5",
        "kusto": "fields @timestamp, groundedness_score, relevance_score | stats avg(groundedness_score) as groundedness, avg(relevance_score) as relevance by bin(6h)"
      },
      {
        "id": "tool-failures",
        "title": "Agent Tool-Call Failure Rate",
        "metric": "1.1%",
        "sub": "38 failures out of 3,450 tool dispatches · 0 loops detected",
        "status": "ok",
        "target": "Target: <2.0% tool failure rate; 0 infinite loops",
        "kusto": "fields @timestamp, tool_name, status | filter ispresent(tool_name) | stats count() as total, sum(status != \"success\") as failed by bin(1h) | eval error_rate = (failed * 100.0) / total"
      },
      {
        "id": "cost-per-task",
        "title": "Cost per Successful Task",
        "metric": "$0.0135",
        "sub": "Daily Spend: $218.50 · Forecast Month: $6,555",
        "status": "ok",
        "target": "Target: Unit cost below $0.020 per completed task",
        "kusto": "fields @timestamp, task_cost_usd | stats avg(task_cost_usd) as cost_per_task, sum(task_cost_usd) as daily_total by bin(1d)"
      },
      {
        "id": "eval-trend",
        "title": "Automated Evaluation Score Trend",
        "metric": "93.4 / 100",
        "sub": "+1.6 pts vs last model release · 0 critical safety violations",
        "status": "ok",
        "target": "Target: Quality score stable or improving across releases",
        "kusto": "fields @timestamp, eval_score, prompt_version | stats avg(eval_score) as score by prompt_version"
      },
      {
        "id": "safety-shields",
        "title": "Guardrails & Prompt Attack Triggers",
        "metric": "0.03%",
        "sub": "9 blocks: 6 Prompt Attack · 3 Sensitive PII · 0 Data Leaks",
        "status": "ok",
        "target": "Target: <0.1% trigger rate; 100% blocked at perimeter",
        "kusto": "fields @timestamp, guardrail_action, violation_type | filter guardrail_action = \"BLOCKED\" | stats count() as blocks by bin(1h), violation_type"
      },
      {
        "id": "dependency-health",
        "title": "AI Dependency Availability & Health",
        "metric": "99.99%",
        "sub": "Bedrock: 99.99% · OpenSearch: 99.98% · DynamoDB: 100%",
        "status": "ok",
        "target": "Target: >99.9% service availability across dependencies",
        "kusto": "fields @timestamp, dependency, status_code | stats count() as total, sum(status_code < 500) as healthy by dependency"
      }
    ]
  },
  "runbooks": [
    {
      "id": "rb-429-throttling",
      "title": "Runbook 1: Remediating Model Throttling & HTTP 429 Spikes",
      "severity": "P1 / P2",
      "trigger": "CloudWatch alert `BedrockThrottlingSpike` fires (HTTP 429 ThrottlingException > 1% over 5-minute window).",
      "steps": [
        "**Step 1: Check Active Region:** Confirm which AWS Region is returning 429 errors using CloudWatch Metrics for [[bedrock]].",
        "**Step 2: Activate Cross-Region Inference Profiles:** In [[apigw|Amazon API Gateway]] or client configuration, route traffic through a Bedrock Cross-Region Inference Profile to automatically balance requests across US or EU regions.",
        "**Step 3: Verify Client Exponential Backoff:** Verify that client SDKs have exponential backoff with full jitter enabled.",
        "**Step 4: Enable Prompt Caching:** Ensure repeated system prompt prefixes are cached, reducing tokens per minute processed by the model.",
        "**Step 5: Request Quota Increase:** Submit a Service Quotas increase request for Tokens Per Minute (TPM) in the impacted region."
      ]
    },
    {
      "id": "rb-groundedness-drop",
      "title": "Runbook 2: Groundedness Regression and Hallucination Alerts",
      "severity": "P2",
      "trigger": "CloudWatch alert `RAG-Groundedness-Degraded` fires (Groundedness drops below 90% over 1-hour window).",
      "steps": [
        "**Step 1: Inspect Retrieved Documents:** Query [[cloudwatch]] log traces to verify whether retrieved passages in [[opensearch]] match the user prompt.",
        "**Step 2: Check OpenSearch Index Freshness:** Verify that the S3 ingestion pipeline and OpenSearch sync lambda functions are executing without errors.",
        "**Step 3: Review System Prompt Delimiters:** Confirm that system prompt XML boundaries (`<context>...</context>`) have not been corrupted by recent prompt commits.",
        "**Step 4: Roll Back Prompt Changes:** Revert to the previous verified prompt version via AWS AppConfig or Parameter Store within 5 minutes.",
        "**Step 5: Add Failing Queries to Golden Eval Set:** Append regressed customer queries to the automated evaluation dataset in Git."
      ]
    },
    {
      "id": "rb-agent-loop-spike",
      "title": "Runbook 3: Terminating Runaway Multi-Agent Loops and Cost Spikes",
      "severity": "P1",
      "trigger": "CloudWatch alert `AgentLoopSpike` fires (single task exceeds 5 tool turns or burns >50,000 tokens).",
      "steps": [
        "**Step 1: Identify Offending Session:** Query CloudWatch Logs for agent sessions with `turn_count > 5`.",
        "**Step 2: Terminate Active Sessions:** Call the agent management API or terminate the parent [[stepfunctions]] execution.",
        "**Step 3: Trip the Circuit Breaker:** If a downstream tool is degraded, disable that specific action group from the Bedrock Agent manifest dynamically.",
        "**Step 4: Review Agent Reasoning Traces:** Inspect the thought trace in CloudWatch to understand why the agent repeated queries.",
        "**Step 5: Update Tool Descriptions:** Clarify tool schemas, input parameters, and negative examples in agent instructions."
      ]
    },
    {
      "id": "rb-model-retirement",
      "title": "Runbook 4: Managing Model Deprecations and Upgrades",
      "severity": "P3 (Planned)",
      "trigger": "AWS announces retirement date for an active model version (e.g. Anthropic Claude v1/v2 retirement).",
      "steps": [
        "**Step 1: Inventory Active Deployments:** Identify every account, region, and application pinned to the retiring model ID.",
        "**Step 2: Deploy Candidate Successor in Staging:** Deploy the recommended successor model (e.g. Claude 3.5 Sonnet or Nova Pro) in staging.",
        "**Step 3: Execute Full Regression Eval Suite:** Run the 500+ case golden evaluation dataset against both models simultaneously. Compare Groundedness, Relevance, Latency, and Token Consumption.",
        "**Step 4: Fine-Tune System Prompts:** Successor models often follow instructions differently; adjust prompts to re-align output formatting.",
        "**Step 5: Canary Rollout:** Route 10% production traffic to the new model via [[apigw]]; monitor error rates for 1 week before completing cutover."
      ]
    }
  ],
  "postmortemTemplate": {
    "title": "Incident Postmortem Template for AI & Stochastic Systems",
    "intro": "Standard postmortems assume deterministic software bugs. Incidents in generative AI systems often involve probabilistic failures, prompt drift, unexpected real-world distributions, or model provider rate limiting. Use this template for post-incident reviews.",
    "templateMarkdown": "# AI Incident Postmortem: [Incident Title]\n\n**Date:** YYYY-MM-DD\n**Incident Lead:** [Engineering Manager / Incident Commander]\n**Principal Reviewer:** [Principal Engineer / Architect]\n**Severity:** P1 / P2\n**Duration:** [Start Time] to [Resolution Time] (Total: X minutes)\n\n---\n\n## 1. Executive Summary\nA brief 3-sentence summary: what happened, what was the customer and financial impact, and what resolved the issue.\n\n## 2. Customer & Financial Impact\n- **Affected Users / Tenants:** [Number of users or percentage of traffic affected]\n- **Task Failure Rate:** [Peak percentage of failed or degraded tasks]\n- **Token / Financial Cost Impact:** [Unplanned token burn or billing impact]\n- **SLA Breach:** [Was customer availability or latency SLA breached?]\n\n## 3. Incident Timeline (UTC)\n- **HH:MM** - Anomaly detected by alert [Alert Name] or reported by [Team].\n- **HH:MM** - Incident channel opened; on-call engineer paged.\n- **HH:MM** - Root cause isolated to [Component: Model / Retrieval / Tool / Gateway].\n- **HH:MM** - Mitigation applied [e.g. Traffic rerouted via Cross-Region Profile / Prompt rolled back].\n- **HH:MM** - Error rates returned to normal baseline; monitoring verified.\n- **HH:MM** - Incident declared resolved.\n\n## 4. Root Cause Analysis: The 5 Whys (AI Specific)\n1. **Why did the failure occur?** (e.g. The customer assistant hallucinated incorrect pricing data.)\n2. **Why was incorrect data generated?** (e.g. The retrieval step returned outdated 2023 pricing sheets.)\n3. **Why did retrieval return outdated data?** (e.g. The S3 document sync lambda stalled 48 hours ago.)\n4. **Why was the sync stall not detected?** (e.g. No CloudWatch alert was configured on S3 event processing dead-letter queues.)\n5. **Why was there no alert?** (e.g. The infrastructure was provisioned manually rather than via CDK with monitoring policies.)\n\n## 5. Failure Classification\n- [ ] Retrieval Failure (Missing context, bad chunking, stale index)\n- [ ] Model Hallucination / Grounding Failure (Model ignored context)\n- [ ] Adversarial / Prompt Injection Attack\n- [ ] Capacity / Rate Limiting (HTTP 429 ThrottlingException)\n- [ ] Agent Loop / Tool Invocation Error\n- [ ] Infrastructure / Network / DNS Failure\n\n## 6. Corrective Actions & Prevention (Owner & Due Date)\n| Action Item | Type | Owner | Due Date | Ticket / PR |\n| :--- | :--- | :--- | :--- | :--- |\n| Add CloudWatch alert on S3 sync DLQ messages | Prevention | SRE Lead | YYYY-MM-DD | #1234 |\n| Add regressed incident queries to golden eval set | Quality | AI Engineer | YYYY-MM-DD | #1235 |\n| Configure Bedrock Cross-Region failover profile | Resilience | Principal Eng | YYYY-MM-DD | #1236 |\n"
  }
};
