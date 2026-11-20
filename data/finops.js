/* AI FinOps, Cost Governance & Unit Economics Engine.
   Framework for tracking, forecasting, allocating, and optimizing
   enterprise AI spending on AWS. */
window.ATLAS = window.ATLAS || {};
window.ATLAS.finops = {
  costCategories: [
    { id: 'cat-01', name: 'Foundation Model Inference', svc: 'bedrock', unit: 'Tokens (Input / Output)', lever: 'Prompt caching, model routing, prompt compression' },
    { id: 'cat-02', name: 'Vector Embeddings', svc: 'bedrock', unit: 'Input Tokens (Textract / Docs)', lever: 'Titan Embeddings v2 dimension reduction, incremental sync' },
    { id: 'cat-03', name: 'Cross-Encoder Reranking', svc: 'bedrock', unit: 'Per Search Request (Top-N)', lever: 'Rerank only top 25 chunks instead of top 100' },
    { id: 'cat-04', name: 'Vector Search Index', svc: 'opensearch', unit: 'OpenSearch Compute Units (OCUs)', lever: 'Downsize standby OCUs in non-prod; tune shard count' },
    { id: 'cat-05', name: 'Relational & Document DBs', svc: 'aurora', unit: 'Aurora Capacity Units (ACUs)', lever: 'Aurora Serverless auto-pause for non-prod; read replicas' },
    { id: 'cat-06', name: 'Agent Tool Microservices', svc: 'lambda', unit: 'GB-Seconds & Request Count', lever: 'Arm64 Graviton3 migration, memory rightsizing' },
    { id: 'cat-07', name: 'Workflow Orchestration', svc: 'stepfunctions', unit: 'State Transitions', lever: 'Express Workflows for high-volume; Standard for human gates' },
    { id: 'cat-08', name: 'Dedicated GPU Clusters', svc: 'ec2', unit: 'Instance Hours (G5, P4, P5)', lever: 'Compute Savings Plans, Spot instances for training, Trn1' },
    { id: 'cat-09', name: 'Document & Model Storage', svc: 's3', unit: 'GB / Month & API Calls', lever: 'S3 Intelligent-Tiering, Lifecycle rules to Glacier Deep Archive' },
    { id: 'cat-10', name: 'Network & PrivateLink Egress', svc: 'vpc', unit: 'GB Processed + VPC Endpoint Hours', lever: 'Centralize PrivateLink endpoints in Shared Network Hub' },
    { id: 'cat-11', name: 'Telemetry & Observability', svc: 'cloudwatch', unit: 'GB Ingested & Metric Alarms', lever: 'Sample high-frequency debug logs; set 30-day log retention' },
    { id: 'cat-12', name: 'Synthetic Evaluations', svc: 'bedrock', unit: 'Evaluation Token Runs', lever: 'Run full 500-test eval weekly, 50-test smoke test on PRs' },
    { id: 'cat-13', name: 'Human-in-the-Loop Review', svc: 'sm-groundtruth', unit: 'Human Review Hours / Annotations', lever: 'Route only borderline confidence (70-85%) cases to humans' },
    { id: 'cat-14', name: 'Failed Retries & Runaways', svc: 'lambda', unit: 'Wasted Tokens & Compute', lever: 'Strict loop breakers; max 10 steps per agent invocation' },
    { id: 'cat-15', name: 'Idle Provisioned Throughput', svc: 'bedrock', unit: 'Model Units (PTU)', lever: 'Switch to On-Demand during development; commit for prod only' },
    { id: 'cat-16', name: 'Security & PII Scanning', svc: 'macie', unit: 'GB Inspected', lever: 'Target S3 buckets selectively; use regex pre-filters before Macie' },
    { id: 'cat-17', name: 'Platform Engineering Overhead', svc: 'cdk', unit: 'CI/CD runner minutes & pipelines', lever: 'Cache Docker layers; ephemeral test environments with auto-teardown' }
  ],

  emMetrics: [
    {
      id: 'cost-per-task',
      title: 'Cost Per AI Task',
      target: '< ₹2.50 ($0.03)',
      formula: 'Total monthly AI infrastructure cost / Total completed user tasks',
      why: 'The primary unit metric for generative AI features; reflects true blended cost including tokens, databases, tools, and networks.'
    },
    {
      id: 'cost-per-success',
      title: 'Cost Per Successful Outcome',
      target: '< ₹3.20 ($0.038)',
      formula: 'Total monthly AI cost / Tasks resulting in successful resolution without human escalation',
      why: 'Penalizes hallucinated, retried, or failed agent runs. Forces teams to eliminate circular reasoning loops.'
    },
    {
      id: 'cost-per-user',
      title: 'Cost Per Active User / Month',
      target: '< ₹65 ($0.78) / user',
      formula: 'Total monthly application cost / Monthly Active Users (MAU)',
      why: 'Directly informs SaaS pricing, freemium tier limits, and subscription gross margins.'
    },
    {
      id: 'spend-vs-forecast',
      title: 'Spend vs Budget Variance',
      target: 'Within ± 10%',
      formula: 'ABS(Actual monthly cloud spend - Forecasted spend) / Forecasted spend',
      why: 'Tracks financial predictability; alerts early if traffic surge or runaway prompts cause budget breach.'
    }
  ],

  scenarios: [
    {
      name: 'Prototype / Sandbox',
      volume: '10,000 queries / mo',
      monthlySpend: '₹12,000 ($145)',
      costPerTask: '₹1.20 ($0.014)',
      stack: 'On-Demand Bedrock (Claude 3.5 Haiku) + OpenSearch Serverless (0.5 OCU) + Serverless Lambda'
    },
    {
      name: 'Pilot Deployment',
      volume: '100,000 queries / mo',
      monthlySpend: '₹95,000 ($1,145)',
      costPerTask: '₹0.95 ($0.011)',
      stack: 'Bedrock Hybrid Routing (80% Haiku / 20% Sonnet 3.7) + OpenSearch Serverless (2 OCUs) + Prompt Caching'
    },
    {
      name: 'Production Scale',
      volume: '1,000,000 queries / mo',
      monthlySpend: '₹6,40,000 ($7,710)',
      costPerTask: '₹0.64 ($0.0077)',
      stack: 'Dynamic Model Routing + 50% Prompt Caching + Provisioned Bedrock Throughput commitment + Cross-region fallback'
    },
    {
      name: '10x Enterprise Scale',
      volume: '10,000,000 queries / mo',
      monthlySpend: '₹42,00,000 ($50,600)',
      costPerTask: '₹0.42 ($0.0050)',
      stack: 'Fine-tuned SLMs on AWS Inferentia Inf2 + S3 Vector Express Tier + 1-Year Compute Savings Plans'
    },
    {
      name: 'Worst-Case Runaway Loop (Unbounded)',
      volume: 'Uncontrolled loop',
      monthlySpend: '₹15,00,000+ ($18,000+)',
      costPerTask: '₹18.50 ($0.22)',
      stack: 'Autonomous agent in unconstrained loop; 100k input context resent 40 times per query with zero caching'
    }
  ],

  costLevers: [
    { lever: 'Prompt Caching', savings: 'Up to 90% input token cost', mechanism: 'Cache repetitive system instructions, OpenAPI schemas, and base documentation in Bedrock with a 5-minute TTL.' },
    { lever: 'Dynamic Model Routing', savings: '60% - 75% blended cost reduction', mechanism: 'Classify incoming user query intent with lightweight SLM (Nova Micro); route 80% simple queries to Haiku, reserving Sonnet for reasoning.' },
    { lever: 'Prompt Compression & Truncation', savings: '30% - 50% token reduction', mechanism: 'Strip conversational pleasantries, deduplicate retrieved RAG chunks, and enforce maximum chunk token lengths.' },
    { lever: 'Semantic Caching in Redis / DynamoDB', savings: '100% token cost on repeated queries', mechanism: 'Store vector embeddings of previous user queries; if cosine similarity > 0.95 to cached query, return verified cached answer instantly.' },
    { lever: 'Batch Inference Discount', savings: '50% discount on Bedrock token rates', mechanism: 'Run non-urgent document extraction, overnight summarization, and offline evaluations using Bedrock asynchronous Batch mode.' },
    { lever: 'Dimension Reduction in Embeddings', savings: '50% OpenSearch RAM and storage cost', mechanism: 'Configure Amazon Titan Text Embeddings v2 to output 512 or 256 dimensions instead of 1024; minimal accuracy loss with half memory.' },
    { lever: 'Strict Agent Step & Token Ceilings', savings: 'Prevents $1,000+ runaway bills', mechanism: 'Enforce hard limit of 10 steps and 50,000 total tokens per task invocation in agent orchestrator.' },
    { lever: 'AWS Compute Savings Plans', savings: 'Up to 66% on EC2 / Fargate / SageMaker', mechanism: 'Commit to steady-state baseline compute for dedicated self-hosted inference or vector nodes.' }
  ],

  approvalGates: [
    { stage: 'Discovery', requirement: 'Documented ROI hypothesis and preliminary cost per task ceiling approved by Business Sponsor.' },
    { stage: 'PoC', requirement: 'Actual measured token consumption and baseline cost logged for 100 benchmark queries.' },
    { stage: 'MVP', requirement: 'Model routing architecture approved; prompt caching verified in code; unit cost <= $0.05 / task.' },
    { stage: 'Pilot', requirement: 'Comparison of actual weekly AWS invoice against forecasted spend; variance <= 15%.' },
    { stage: 'Production', requirement: 'AWS Budgets alert thresholds configured at 80% and 100%; tagged with mandatory FinOps CostCenter.' },
    { stage: 'Scale', requirement: 'Evaluation of 1-Year or 3-Year Provisioned Throughput / Savings Plans vs On-Demand token consumption.' },
    { stage: 'Optimization', requirement: 'Quarterly unit economics review; target 20% annual reduction in cost per successful transaction.' }
  ]
};
