/* AI Quality Engineering & Evaluation Centre.
   Standards, metrics dictionary, automated evaluation pipelines,
   and release quality gates for production AI systems. */
window.ATLAS = window.ATLAS || {};
window.ATLAS.eval = {
  layers: [
    {
      id: 'model-eval',
      name: 'Model Capability Evaluation',
      focus: 'General reasoning, coding, mathematical logic, instruction following, and domain-specific comprehension.',
      tooling: '[[bedrock|Amazon Bedrock]] Model Evaluation, LM-Eval-Harness, MMLU, GSM8K, HumanEval',
      frequency: 'During model selection, major model upgrades, or custom fine-tuning runs'
    },
    {
      id: 'prompt-eval',
      name: 'Prompt Robustness & Engineering',
      focus: 'Prompt sensitivity, formatting compliance, system prompt adherence, and few-shot stability.',
      tooling: 'Automated prompt test harnesses, prompt versioning in [[s3|S3]], Bedrock prompt management',
      frequency: 'Every prompt modification in pull requests'
    },
    {
      id: 'rag-retrieval',
      name: 'RAG Retrieval Relevance & Precision',
      focus: 'Recall@K, Precision@K, Mean Reciprocal Rank (MRR), and Normalized Discounted Cumulative Gain (NDCG).',
      tooling: 'Bedrock Knowledge Bases evaluation, Ragas, Trulens, [[opensearch|OpenSearch]] benchmark tests',
      frequency: 'Every chunking change, embedding model change, or index refresh'
    },
    {
      id: 'groundedness',
      name: 'Factual Grounding & Hallucination',
      focus: 'Measuring whether every claim in the LLM output is strictly derived from retrieved source context.',
      tooling: 'Ragas Faithfulness, Bedrock Automated Evaluation with LLM-as-a-Judge, G-Eval',
      frequency: 'Automated CI/CD release gate and daily sampling in production'
    },
    {
      id: 'citation-eval',
      name: 'Citation & Attribution Correctness',
      focus: 'Verifying that citation links (document, page, paragraph) genuinely contain the asserted claim.',
      tooling: 'Custom citation attribution validator, AST reference check against chunk metadata',
      frequency: 'Pre-release golden dataset validation'
    },
    {
      id: 'agent-task',
      name: 'Agent Task Completion & Planning',
      focus: 'Goal success rate, step count efficiency, planning accuracy, and avoidance of circular loops.',
      tooling: 'AgentBench, WebArena, custom Step Functions execution traces in [[cloudwatch|CloudWatch]]',
      frequency: 'Weekly automated agent benchmark runs'
    },
    {
      id: 'tool-eval',
      name: 'Tool Selection & Parameter Accuracy',
      focus: 'Selecting the correct tool from multiple candidates and generating valid, schema-compliant arguments.',
      tooling: 'JSON Schema validators, mock API test harnesses, Pydantic / Zod verification',
      frequency: 'Automated integration test in CI/CD pipeline'
    },
    {
      id: 'safety-eval',
      name: 'Safety, Toxicity & Content Policy',
      focus: 'Refusal of harmful queries (weapons, self-harm, hate speech) while minimizing false refusals.',
      tooling: '[[bedrock-guardrails|Amazon Bedrock Guardrails]], RealToxicityPrompts, Red-teaming test suites',
      frequency: 'Mandatory pre-production compliance sign-off'
    },
    {
      id: 'security-eval',
      name: 'Security, Jailbreak & Injection Defense',
      focus: 'Resilience against direct and indirect prompt injection, system prompt extraction, and tool hijacking.',
      tooling: 'GARAK (Generative AI Red-teaming tool), PyRIT (Python Risk Identification Tool), Bedrock Guardrails',
      frequency: 'Monthly security penetration drills and automated CI scanning'
    },
    {
      id: 'performance-eval',
      name: 'Performance, Concurrency & Latency',
      focus: 'P50, P90, P99 Time to First Token (TTFT), inter-token latency, and token throughput under 2x peak concurrency.',
      tooling: 'Locust load testing against API Gateway, CloudWatch latency metrics, X-Ray traces',
      frequency: 'Pre-production load test before every major release'
    },
    {
      id: 'cost-eval',
      name: 'Cost Per Task & Unit Economics',
      focus: 'Input/output token burn, caching hit rate, tool execution costs, and cost per successful user outcome.',
      tooling: 'AWS Cost Explorer, Athena CloudWatch log queries, custom billing metrics',
      frequency: 'Weekly FinOps review'
    },
    {
      id: 'regression-eval',
      name: 'Regression & Semantic Drift',
      focus: 'Ensuring that newer prompt templates or model versions do not silently degrade previously working test cases.',
      tooling: 'Automated golden dataset regression runner in GitHub Actions, DeepEval regression suites',
      frequency: 'Every Git push targeting main branch'
    },
    {
      id: 'feedback-eval',
      name: 'User Feedback & Business Impact',
      focus: 'User thumbs up/down, implicit copy/paste actions, edit distance on generated output, CSAT, task conversion.',
      tooling: 'Custom feedback collector Lambda, DynamoDB feedback store, QuickSight analytics dashboard',
      frequency: 'Continuous streaming telemetry in production'
    }
  ],

  metricsDictionary: [
    {
      category: 'RAG Retrieval',
      metric: 'Recall@K',
      formula: 'Number of relevant chunks in top K / Total relevant chunks in dataset',
      target: '>= 0.85 (at K=5)',
      description: 'Measures what proportion of all necessary facts were successfully fetched into the context window.'
    },
    {
      category: 'RAG Retrieval',
      metric: 'Precision@K',
      formula: 'Number of relevant chunks in top K / K',
      target: '>= 0.70 (at K=5)',
      description: 'Measures the density of signal vs noise in the retrieved context passed to the LLM.'
    },
    {
      category: 'RAG Retrieval',
      metric: 'Mean Reciprocal Rank (MRR)',
      formula: '(1 / N) * SUM(1 / rank_of_first_relevant_chunk)',
      target: '>= 0.75',
      description: 'Evaluates how high the primary relevant document appears in the search result list.'
    },
    {
      category: 'RAG Retrieval',
      metric: 'Normalized Discounted Cumulative Gain (NDCG)',
      formula: 'DCG / Ideal DCG',
      target: '>= 0.80',
      description: 'Measures graded ranking quality, heavily penalizing relevant documents ranked lower in the context.'
    },
    {
      category: 'RAG Generation',
      metric: 'Groundedness (Faithfulness)',
      formula: 'Number of verified factual claims in output / Total claims in output',
      target: '>= 95.0%',
      description: 'The golden metric for enterprise RAG: verifies that the LLM is not hallucinating beyond provided documents.'
    },
    {
      category: 'RAG Generation',
      metric: 'Answer Relevance',
      formula: 'Semantic similarity between generated answer and user query intent',
      target: '>= 90.0%',
      description: 'Ensures the model actually answers the user\'s specific question directly rather than digressing.'
    },
    {
      category: 'RAG Generation',
      metric: 'Context Recall',
      formula: 'Ground truth claims found in retrieved context / Total claims in ground truth',
      target: '>= 90.0%',
      description: 'Verifies that the retriever provided all information required to generate the complete correct answer.'
    },
    {
      category: 'RAG Generation',
      metric: 'Citation Accuracy',
      formula: 'Verified valid citations / Total generated citations',
      target: '>= 98.0%',
      description: 'Confirms that every footnote link directly references the exact text in the source document.'
    },
    {
      category: 'Agentic Systems',
      metric: 'Goal / Task Completion Rate',
      formula: 'Successfully completed end-to-end tasks / Total attempted tasks',
      target: '>= 95.0%',
      description: 'Proportion of complex multi-step workflows that achieve user objective without human intervention.'
    },
    {
      category: 'Agentic Systems',
      metric: 'Tool Selection Accuracy',
      formula: 'Correct tools chosen / Total tool invocation decisions',
      target: '>= 98.0%',
      description: 'Measures agent reasoning ability to pick the right API tool from available OpenAPI schemas.'
    },
    {
      category: 'Agentic Systems',
      metric: 'Tool Execution Success Rate',
      formula: 'HTTP 200 successful tool executions / Total attempted tool calls',
      target: '>= 97.0%',
      description: 'Measures agent ability to formulate valid JSON parameters matching external API expectations.'
    },
    {
      category: 'Agentic Systems',
      metric: 'Loop Occurrence Rate',
      formula: 'Agent runs hitting loop breaker circuit breaker / Total agent runs',
      target: '< 0.5%',
      description: 'Measures failure mode where agent calls the same tool repeatedly with identical failing arguments.'
    },
    {
      category: 'Agentic Systems',
      metric: 'Step Count Efficiency',
      formula: 'Actual execution steps taken / Optimal path step count',
      target: '< 1.35 ratio',
      description: 'Detects wandering or inefficient agent reasoning paths that inflate token costs and latency.'
    },
    {
      category: 'Agentic Systems',
      metric: 'Human Escalation Rate',
      formula: 'Tasks routed to human operator / Total tasks',
      target: '< 5.0%',
      description: 'Tracks how often the agent appropriately yields control when confidence or policy boundaries are reached.'
    },
    {
      category: 'System Performance',
      metric: 'P95 Time to First Token (TTFT)',
      formula: '95th percentile latency from request receipt to first streamed byte',
      target: '< 2.5 seconds',
      description: 'Key user experience metric; determines whether conversational interface feels responsive.'
    },
    {
      category: 'FinOps & Cost',
      metric: 'Cost per Completed Task',
      formula: 'Total monthly AI cost (tokens + compute + db + ops) / Total completed tasks',
      target: 'Within approved budget',
      description: 'Ensures the AI initiative maintains positive unit economics as volume scales.'
    },
    {
      category: 'FinOps & Cost',
      metric: 'Token Efficiency Ratio (TER)',
      formula: 'Useful output tokens / Total tokens billed (input + output + reasoning)',
      target: '>= 0.25 (Task dependent)',
      description: 'Measures prompt bloat; low ratio indicates excessive system prompts, unnecessary history, or redundant chunks.'
    },
    {
      category: 'FinOps & Cost',
      metric: 'Semantic Cache Hit Rate',
      formula: 'Requests served by cache / Total incoming user requests',
      target: '>= 20.0%',
      description: 'Percentage of repetitive queries answered from cache without invoking costly foundation model endpoints.'
    },
    {
      category: 'Safety & Guardrails',
      metric: 'False Refusal Rate (FRR)',
      formula: 'Benign queries incorrectly blocked / Total benign test queries',
      target: '< 1.0%',
      description: 'Ensures guardrails do not frustrate legitimate users by overzealously blocking safe domain terms.'
    },
    {
      category: 'Safety & Guardrails',
      metric: 'Harmful Content Mitigation Rate',
      formula: 'Harmful prompts intercepted by guardrail / Total adversarial attack prompts',
      target: '100.0%',
      description: 'Zero tolerance metric for enterprise trust: all harmful or illicit prompt attempts must be blocked.'
    },
    {
      category: 'Safety & Guardrails',
      metric: 'Guardrail Latency Overhead',
      formula: 'Latency with Bedrock Guardrails active - Baseline model inference latency',
      target: '< 150ms',
      description: 'Ensures safety inspection layers do not introduce unacceptable lag to the user experience.'
    },
    {
      category: 'System Performance',
      metric: 'Inter-Token Latency (ITL)',
      formula: 'Average elapsed time between consecutive output tokens during streaming',
      target: '< 40ms / token',
      description: 'Determines reading smoothness during real-time token streaming.'
    },
    {
      category: 'System Performance',
      metric: 'Inference Availability (SLO)',
      formula: '(Total requests - 5xx errors - throttling timeouts) / Total requests',
      target: '>= 99.95%',
      description: 'Uptime of foundation model endpoints including cross-region automated routing fallbacks.'
    },
    {
      category: 'Agentic Systems',
      metric: 'Agent Autonomy Ratio',
      formula: 'Tasks fully resolved autonomously / Total tasks assigned to agent',
      target: '>= 92.0%',
      description: 'Measures agent capability to navigate edge cases without degrading into human triage queues.'
    },
    {
      category: 'User Experience & Business',
      metric: 'Human Edit Distance (Levenshtein)',
      formula: 'Number of character edits made by human operator before accepting AI draft',
      target: '< 15% text modified',
      description: 'Direct signal of generation utility for internal copilot and workflow acceleration features.'
    },
    {
      category: 'User Experience & Business',
      metric: 'User Implicit Acceptance Rate',
      formula: 'Responses copied, clicked, or forwarded without immediate query reformulation / Total queries',
      target: '>= 80.0%',
      description: 'Strongest implicit behavioral signal that the AI answer satisfied user intent on the first attempt.'
    },
    {
      category: 'Agentic Systems',
      metric: 'Tool Argument Schema Validation Pass Rate',
      formula: 'Tool calls passing strict schema validation / Total attempted tool calls',
      target: '>= 99.5%',
      description: 'Verifies that JSON arguments generated by LLM strictly conform to required API parameters and data types.'
    },
    {
      category: 'RAG Generation',
      metric: 'Semantic Drift Variance',
      formula: 'Cosine similarity shift of model outputs on identical prompts across 30 days',
      target: '< 0.05 drift',
      description: 'Monitors non-deterministic output drift or silent provider model quantization changes.'
    }
  ],

  productionReleaseGate: [
    { id: 'gate-01', item: 'Golden Test Dataset Approved', requirement: 'Dataset of >= 200 representative test cases with verified ground truth validated by domain SME and AI Tech Lead.', mandatory: true },
    { id: 'gate-02', item: 'Baseline Established & No Critical Regression', requirement: 'Regression test run shows 0% drop in primary task accuracy compared to previous production release.', mandatory: true },
    { id: 'gate-03', item: 'Groundedness / Faithfulness Threshold', requirement: 'Achieved >= 95.0% factual grounding score on golden dataset with zero unsubstantiated high-severity claims.', mandatory: true },
    { id: 'gate-04', item: 'Prompt Injection & Jailbreak Defense Verified', requirement: '100% block rate on OWASP LLM Top 10 automated adversarial attack test suite via Bedrock Guardrails.', mandatory: true },
    { id: 'gate-05', item: 'PII Redaction & Data Masking Tested', requirement: 'Zero credit card numbers, SSNs, passwords, or customer PII leaked into prompt logs or outputs during testing.', mandatory: true },
    { id: 'gate-06', item: 'Tool Permissions & Least-Privilege IAM Validated', requirement: 'Agent execution role restricted to specific ARNs with session policies; write operations require explicit scopes.', mandatory: true },
    { id: 'gate-07', item: 'Loop Protection & Budget Caps Active', requirement: 'Hard ceiling enforced: maximum 10 steps and 50,000 tokens per execution before deterministic termination.', mandatory: true },
    { id: 'gate-08', item: 'Human-in-the-Loop Callback Implemented', requirement: 'Irreversible actions (financial payouts, email dispatch, data deletion) gated behind Step Functions human approval.', mandatory: true },
    { id: 'gate-09', item: 'Latency Envelope & TTFT Tested Under Load', requirement: 'P95 Time to First Token < 3.0s under 2x peak concurrent traffic simulated load test.', mandatory: true },
    { id: 'gate-10', item: 'Cost Per Task Ceiling Verified', requirement: 'Measured unit cost per task is within the approved financial forecast ceiling (e.g. <= $0.05/task).', mandatory: true },
    { id: 'gate-11', item: 'AWS Service Quotas Validated', requirement: 'Bedrock model concurrency, Lambda concurrency, and OpenSearch OCU limits verified in target production region.', mandatory: true },
    { id: 'gate-12', item: 'Rollback Strategy & Kill Switch Verified', requirement: 'Feature flag or Route 53 DNS fallback tested in Staging; team can revert to legacy flow in < 60 seconds.', mandatory: true }
  ],

  goldenDatasetDesign: {
    steps: [
      { step: 1, title: 'Stratified Query Sampling', desc: 'Sample 60% routine common queries, 25% complex multi-intent questions, and 15% adversarial / out-of-scope edge cases.' },
      { step: 2, title: 'Ground Truth Annotation', desc: 'Subject matter experts (SMEs) independently author verified ideal answers with exact citation references (file, page, paragraph).' },
      { step: 3, title: 'Hard Negatives Inclusion', desc: 'Include documents that are superficially similar (same keywords) but legally or contextually distinct to test reranker discrimination.' },
      { step: 4, title: 'Adversarial Jailbreak Suite', desc: 'Include 50+ known injection payloads (e.g. "Ignore previous instructions", base64 encoded attacks, simulated role-play exploits).' },
      { step: 5, title: 'Dataset Versioning in S3', desc: 'Store datasets as immutable JSONL files with Git commit hashes in metadata; never mutate an evaluation dataset post-approval.' }
    ]
  }
};
