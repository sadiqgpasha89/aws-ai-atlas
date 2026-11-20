/* Engineering Leadership, Workforce Management & Technical Debt.
   Competency matrix across 4 seniority levels and 10 domains,
   capacity planning models, AI productivity metrics, technical debt register,
   and enterprise AI maturity ladder. */
window.ATLAS = window.ATLAS || {};
window.ATLAS.workforce = {
  competencies: [
    {
      domain: 'Python & AI Frameworks',
      junior: 'Writes clean Python, uses Boto3 SDK, handles async/await, implements basic Pydantic schemas.',
      mid: 'Masters LangChain/LangGraph or custom frameworks; writes resilient tool execution code with retries.',
      senior: 'Designs production-grade async agent runners; optimizes memory, token streams, and batching.',
      principal: 'Sets language, framework, and abstraction standards across squads; evaluates runtime trade-offs.'
    },
    {
      domain: 'AWS Cloud Architecture',
      junior: 'Deploys serverless Lambdas, reads CloudWatch logs, configures S3 buckets and basic IAM roles.',
      mid: 'Designs VPC networking, PrivateLink endpoints, API Gateway routing, and DynamoDB single-table schemas.',
      senior: 'Architects multi-account landing zones, Bedrock Cross-Region profiles, and EKS GPU clusters.',
      principal: 'Defines multi-region enterprise AI cloud topology, disaster recovery standards, and landing zone guardrails.'
    },
    {
      domain: 'Machine Learning Fundamentals',
      junior: 'Understands classification, regression, loss functions, overfitting, precision, and recall.',
      mid: 'Tunes hyperparameters, evaluates embedding models, conducts feature engineering on SageMaker.',
      senior: 'Designs custom LoRA/QLoRA fine-tuning pipelines, handles data leakage, and benchmarks custom architectures.',
      principal: 'Formulates organizational ML strategy: when to train proprietary models vs fine-tune vs leverage foundation models.'
    },
    {
      domain: 'Generative AI & LLMs',
      junior: 'Calls Bedrock APIs, crafts clear zero-shot and few-shot prompts, handles JSON responses.',
      mid: 'Implements prompt caching, structured outputs, chain-of-thought, and prompt versioning.',
      senior: 'Designs multi-model dynamic routing, model evaluation benchmarks, and context window optimization.',
      principal: 'Directs enterprise foundation model portfolio; negotiates model provider roadmaps and pricing.'
    },
    {
      domain: 'Agentic AI & Tool Design',
      junior: 'Builds basic ReAct tool calls; writes OpenAPI tool specs and Lambda handler resolvers.',
      mid: 'Designs bounded multi-step agents, memory persistence, loop breakers, and tool schemas.',
      senior: 'Architects multi-agent supervisor-worker swarms, durable state checkpointing, and human approval gates.',
      principal: 'Defines organizational agent autonomy levels, safety guardrails, kill-switch mechanisms, and ethics policies.'
    },
    {
      domain: 'Data Engineering & RAG',
      junior: 'Writes document parsers, splits text into fixed chunks, queries vector databases.',
      mid: 'Implements semantic/hierarchical chunking, hybrid search (BM25 + KNN), and cross-encoder reranking.',
      senior: 'Architects enterprise data pipelines in Glue/Lake Formation; handles ACL sync and document lifecycle.',
      principal: 'Sets enterprise data platform vision, master data governance, and knowledge graph integration strategy.'
    },
    {
      domain: 'MLOps & GenAIOps',
      junior: 'Writes unit tests for helper functions; understands GitHub Actions CI/CD workflows.',
      mid: 'Automates golden dataset evaluation in CI/CD; tracks prompt regressions and model drift.',
      senior: 'Designs end-to-end canary release pipelines, shadow evaluation, and automated rollback gates.',
      principal: 'Establishes enterprise platform engineering strategy, golden path templates, and developer tooling.'
    },
    {
      domain: 'AI Security & Threat Modeling',
      junior: 'Follows least privilege, never hardcodes credentials, enables S3 encryption.',
      mid: 'Implements Bedrock Guardrails, sanitizes inputs against prompt injection, configures IAM session policies.',
      senior: 'Leads AI threat modeling (OWASP GenAI Top 10), secures tool execution sandboxes, audits PII data flow.',
      principal: 'Partners with CISO on zero-trust AI security posture, cryptographic auditability, and regulatory compliance.'
    },
    {
      domain: 'Production SRE & FinOps',
      junior: 'Monitors CloudWatch alarms, checks error logs, handles basic on-call runbook alerts.',
      mid: 'Tunes CloudWatch queries, tracks token burn and latency percentiles, conducts postmortems.',
      senior: 'Defines SLOs, error budgets, chaos engineering drills, and unit economics cost optimization.',
      principal: 'Accountable for organization-wide AI reliability, catastrophic disaster recovery, and multi-million dollar cloud budgets.'
    },
    {
      domain: 'Engineering Leadership',
      junior: 'Communicates task blockers clearly, participates in code reviews, delivers sprint tasks on time.',
      mid: 'Mentors junior engineers, breaks down epic requirements, leads sprint delivery for AI features.',
      senior: 'Drives cross-team alignment, manages technical dependencies, influences product strategy.',
      principal: 'Shapes organizational AI culture, leads Architecture Review Board, represents engineering to C-suite and Board.'
    }
  ],

  productivityMetrics: [
    { metric: 'Time to Prototype', unit: 'Days', target: '< 5 Days', desc: 'Elapsed time from business problem definition to working prototype evaluated against 20 golden test cases.' },
    { metric: 'Time to Production', unit: 'Weeks', target: '< 6 Weeks', desc: 'Elapsed time from validated PoC to production canary release passing all 12 quality gates.' },
    { metric: 'AI Evaluation Cycle Time', unit: 'Minutes', target: '< 15 Minutes', desc: 'Duration of automated regression suite execution on pull requests in GitHub Actions.' },
    { metric: 'Deployment Failure Rate', unit: 'Percentage', target: '< 5.0%', desc: 'Percentage of releases that require emergency patch or automated rollback.' },
    { metric: 'AI Incident MTTR', unit: 'Minutes', target: '< 30 Minutes', desc: 'Mean Time to Resolution for production SEV-1 and SEV-2 AI operational incidents.' },
    { metric: 'Engineering Toil Ratio', unit: 'Percentage', target: '< 20% of sprint', desc: 'Proportion of engineering time spent on repetitive manual data labeling, prompt tweaks, and manual deployments.' },
    { metric: 'Test Automation Ratio', unit: 'Percentage', target: '>= 85%', desc: 'Percentage of test cases in evaluation datasets that execute completely autonomously in CI/CD.' }
  ],

  technicalDebt: [
    {
      category: 'Prompt Debt',
      severity: 'High',
      symptom: 'Monolithic, unversioned prompts hardcoded in application strings with zero changelog or few-shot test coverage.',
      remediation: 'Externalize prompts to versioned Git repositories or S3 buckets with automated regression tests on every commit.'
    },
    {
      category: 'Retrieval Debt',
      severity: 'Critical',
      symptom: 'Relying on naive fixed-size chunking (e.g. 500 characters) without semantic boundaries, metadata, or reranking.',
      remediation: 'Upgrade to semantic/hierarchical chunking and introduce Cohere Rerank v3.5 to filter top candidates.'
    },
    {
      category: 'Evaluation Debt',
      severity: 'Critical',
      symptom: 'Teams test features via ad-hoc manual typing in chat UI ("vibe checking") rather than against frozen golden benchmarks.',
      remediation: 'Mandate golden evaluation dataset with ground truth as prerequisite for staging deployment.'
    },
    {
      category: 'Model Version Debt',
      severity: 'High',
      symptom: 'Calling unpinned or deprecated model versions (e.g. Claude 3 Haiku legacy) that face supplier deprecation.',
      remediation: 'Establish quarterly model portfolio review and adopt Bedrock Application Inference Profiles.'
    },
    {
      category: 'Data & Ingestion Debt',
      severity: 'High',
      symptom: 'Vector index contains duplicate, stale, or deleted documents because ingestion is a one-way batch dump.',
      remediation: 'Implement event-driven S3 document lifecycle pipeline with automatic tombstoning and reindexing.'
    },
    {
      category: 'Embedding Debt',
      severity: 'High',
      symptom: 'Mixing vectors from different embedding models or dimensions in the same index; obsolete index schemas.',
      remediation: 'Version vector collections; execute clean parallel re-indexing when upgrading embedding models.'
    },
    {
      category: 'Agent Orchestration Debt',
      severity: 'Critical',
      symptom: 'Unbounded agent recursion with nested LLM calls that lack hard step counts, token limits, or state checkpoints.',
      remediation: 'Impose hard limit of 10 steps per task, persist state to DynamoDB, and install circuit breaker loop detectors.'
    },
    {
      category: 'Tool Integration Debt',
      severity: 'High',
      symptom: 'Tools execute with over-privileged IAM credentials and accept raw unvalidated LLM JSON parameters.',
      remediation: 'Validate all arguments against strict Pydantic schemas; enforce scoped AWS STS session policies.'
    },
    {
      category: 'Observability Debt',
      severity: 'High',
      symptom: 'No distributed trace IDs linking user queries to vector retrieval chunks, prompt tokens, and downstream tool calls.',
      remediation: 'Instrument AWS X-Ray and OpenTelemetry to propagate `traceparent` headers across every LLM interaction.'
    },
    {
      category: 'Security Debt',
      severity: 'Critical',
      symptom: 'Raw user inputs concatenated directly into system prompts without Bedrock Guardrails filtering.',
      remediation: 'Deploy AWS Bedrock Guardrails with prompt injection detection, PII masking, and blocked topic filters.'
    },
    {
      category: 'Cost & FinOps Debt',
      severity: 'High',
      symptom: 'No cost-per-task tracking or allocation tags; paying full token rates without enabling prompt caching.',
      remediation: 'Instrument token metrics in CloudWatch; activate Bedrock prompt caching on static system prompts.'
    },
    {
      category: 'Infrastructure Debt',
      severity: 'Medium',
      symptom: 'Manual AWS console configuration; drift between development, staging, and production environments.',
      remediation: 'Codify 100% of infrastructure in AWS CDK (TypeScript/Python) or Terraform with automated CI deployments.'
    },
    {
      category: 'Documentation Debt',
      severity: 'Medium',
      symptom: 'Architecture decisions unrecorded; tribal knowledge about why specific models, chunk sizes, or prompts were chosen.',
      remediation: 'Publish Architectural Decision Records (ADRs) in the Architecture Decision Centre for all key trade-offs.'
    }
  ],

  maturityModel: [
    {
      level: 1,
      name: 'Experimental / Ad-Hoc',
      desc: 'Individual developers experimenting with Bedrock APIs and prompt engineering in sandbox accounts. No formal evaluations, no standards, ad-hoc costs.',
      nextStep: 'Establish a central AI Architecture Review Board and mandate golden test datasets.'
    },
    {
      level: 2,
      name: 'Emerging / Fragmented',
      desc: 'Multiple squads building PoCs; common patterns starting to appear but teams reinvent vector search, chunking, and tool calling independently.',
      nextStep: 'Deploy an Enterprise AI Landing Zone with shared VPCs, PrivateLink, and standardized CDK constructs.'
    },
    {
      level: 3,
      name: 'Standardized / Governed',
      desc: 'Shared AI platform in place; Bedrock Guardrails and IAM policies enforced; CI/CD regression gates active; FinOps cost-per-task tracked.',
      nextStep: 'Implement dynamic model routing, small-model-first strategy, and multi-region failover resilience.'
    },
    {
      level: 4,
      name: 'Scaled / Embedded',
      desc: 'AI embedded across core customer and operational products; automated evaluation in every pipeline; unit economics optimized via prompt caching.',
      nextStep: 'Advance to autonomous agentic workflows with formal autonomy levels, human-in-the-loop gates, and GraphRAG.'
    },
    {
      level: 5,
      name: 'Optimized / Autonomous',
      desc: 'Continuous AI-driven optimization; automated architecture drift detection; self-healing incident remediation; industry-leading unit economics.',
      nextStep: 'Drive industry standards, contribute to open-source agent ecosystems, and pioneer novel domain architectures.'
    }
  ]
};
