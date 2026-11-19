/* Hands-on Labs, Progressive Learning Roadmaps & AWS Architecture Resource Hub */
window.ATLAS.labs = {
  "title": "Hands-on Labs & Learning Roadmaps",
  "lede": "Practical implementation exercises, structured role-based learning roadmaps, and direct links to authoritative AWS architecture documentation.",
  "learningPaths": [
    {
      "id": "path-em",
      "role": "AI Engineering Manager",
      "duration": "4-Week Progressive Curriculum",
      "objective": "Master the operating rhythm: build vs buy evaluation, risk appetite, team staffing, unit economics, and production launch gates.",
      "modules": [
        {
          "week": "Week 1: AI Strategy & Governance",
          "topics": "Build vs buy framework, AWS Well-Architected Framework for AI, multi-account hierarchy, IAM zero-trust identity."
        },
        {
          "week": "Week 2: RAG & Agent Architecture Foundations",
          "topics": "Classic vs agentic RAG trade-offs, deterministic workflows vs autonomous agents, human-in-the-loop controls."
        },
        {
          "week": "Week 3: GenAIOps & Quality Engineering",
          "topics": "Evaluation sets, statistical quality indicators (Recall@K, Groundedness), automated CI/CD release gates."
        },
        {
          "week": "Week 4: FinOps, Capacity & Production Operations",
          "topics": "Unit economics (cost per task), Provisioned Throughput vs On-Demand, 429 throttling mitigation, executive reporting."
        }
      ]
    },
    {
      "id": "path-pe",
      "role": "Principal AI Architect",
      "duration": "6-Week Advanced Architecture Curriculum",
      "objective": "Design scalable, multi-tenant AI systems with fault tolerance, low-latency streaming, and strict compliance boundaries.",
      "modules": [
        {
          "week": "Weeks 1-2: Advanced Retrieval & Graph Architecture",
          "topics": "Document cracking via Textract, layout chunking, hybrid search tuning (RRF), cross-encoder reranking, Neptune GraphRAG extraction."
        },
        {
          "week": "Weeks 3-4: Multi-Agent Systems & State Persistence",
          "topics": "Bedrock Agents, supervisor and handoff patterns, state persistence in DynamoDB, MCP tool servers, agent failure recovery."
        },
        {
          "week": "Weeks 5-6: Enterprise Security & Multi-Region Resilience",
          "topics": "Document-level security trimming, PrivateLink VPC networking, API Gateway multi-region failover, zero customer data retention."
        }
      ]
    },
    {
      "id": "path-eng",
      "role": "Production AI Engineer",
      "duration": "4-Week Practical Implementation Curriculum",
      "objective": "Build, test, evaluate, and deploy production-grade RAG and agent applications using AWS SDKs.",
      "modules": [
        {
          "week": "Week 1: SDK Fundamentals & Ingestion",
          "topics": "AWS Bedrock runtime client, Titan and Cohere embedding models, Amazon Textract SDK, structuring Markdown output."
        },
        {
          "week": "Week 2: Indexing & Search Implementation",
          "topics": "OpenSearch Serverless SDK, vector index schemas, HNSW parameters, implementing hybrid BM25 + k-NN queries."
        },
        {
          "week": "Week 3: Agent Development & MCP Tools",
          "topics": "Bedrock Agents action groups in Python, defining JSON tool schemas, managing conversation history, connecting Lambda endpoints."
        },
        {
          "week": "Week 4: Automated Testing & Evaluation",
          "topics": "SageMaker Clarify evaluation SDK, synthetic test generation, writing PyTest evaluation suites, GitHub Actions automation."
        }
      ]
    }
  ],
  "exercises": [
    {
      "id": "lab-rag-opensearch",
      "title": "Lab 1: End-to-End Enterprise RAG with Bedrock Knowledge Bases & OpenSearch Serverless",
      "level": "Intermediate",
      "time": "60 mins",
      "goal": "Build a production RAG pipeline using Amazon Textract for layout extraction and OpenSearch Serverless for hybrid vector search with semantic reranking.",
      "steps": [
        "Upload sample enterprise PDF policies with tables and headers to an Amazon S3 bucket.",
        "Run Amazon Textract layout analysis to extract Markdown tables and hierarchical sections.",
        "Chunk text using layout boundaries and generate embeddings using Amazon Titan Text Embeddings V2.",
        "Create an OpenSearch Serverless vector collection configured with BM25 text fields, vector fields, and metadata filters.",
        "Execute a hybrid query combining vector similarity and keyword search; inspect Reciprocal Rank Fusion (RRF) scores.",
        "Enable semantic reranking and verify that top-ranked passages contain verified table data.",
        "Send retrieved passages with citation instructions to Anthropic Claude 3.5 Sonnet on Bedrock; verify answer groundedness and footnote citations."
      ]
    },
    {
      "id": "lab-multiagent-bedrock",
      "title": "Lab 2: Building Autonomous Multi-Agent Workflows with Bedrock Agents & Lambda",
      "level": "Advanced",
      "time": "90 mins",
      "goal": "Implement a Supervisor-Worker agentic system with state persistence in DynamoDB, typed tool action groups in Lambda, and human approval steps.",
      "steps": [
        "Define a Supervisor Agent in Amazon Bedrock Agents with explicit routing instructions and tool schemas.",
        "Create two specialist worker Action Groups: a Financial Data Extractor and a Compliance Policy Reviewer.",
        "Implement Action Group tools as AWS Lambda functions validating input schemas and enforcing IAM least privilege.",
        "Configure session state persistence in Amazon DynamoDB storing conversation turns and checkpointed variables.",
        "Add an AWS Step Functions approval task requiring human sign-off before executing financial writes.",
        "Test execution trace in Amazon CloudWatch; verify that intermediate tool calls appear in the distributed trace."
      ]
    },
    {
      "id": "lab-security-trimming",
      "title": "Lab 3: Document-Level Security Trimming with Cognito Claims",
      "level": "Advanced",
      "time": "45 mins",
      "goal": "Enforce document-level access control in OpenSearch Serverless so users only retrieve documents matching their security group memberships.",
      "steps": [
        "Index documents in OpenSearch Serverless with a security collection field: `security_groups: [\"finance\", \"executive\"]`.",
        "Simulate two user identities with different Cognito user pool security group claims in JWT tokens.",
        "Construct an API Gateway Lambda proxy that extracts caller security claims from the authorization header.",
        "Inject a mandatory server-side filter: `terms: { security_groups: userGroups }` into the search request.",
        "Verify that user A (finance) retrieves financial data while user B (marketing) receives zero results on identical queries.",
        "Verify that semantic caching keys include user security hashes to prevent cache leakage."
      ]
    },
    {
      "id": "lab-genaiops-pipeline",
      "title": "Lab 4: GenAIOps: Automated PR Evaluation Pipeline with GitHub Actions",
      "level": "Intermediate",
      "time": "60 mins",
      "goal": "Set up a continuous integration pipeline that runs automated LLM evaluation gates on every prompt pull request.",
      "steps": [
        "Create a repository containing prompt templates, a golden dataset of 50 test queries, and ground-truth references.",
        "Configure GitHub Actions with OpenID Connect (OIDC) to authenticate to AWS without long-lived access keys.",
        "Write an evaluation script using SageMaker Clarify and Bedrock measuring Groundedness and Relevance.",
        "Configure the GitHub Actions workflow to run evaluations on every pull request targeting `main`.",
        "Add a quality gate check: fail the pull request build if Groundedness drops below 92%.",
        "Simulate a prompt regression that introduces hallucinations; verify that the pipeline automatically blocks the merge."
      ]
    },
    {
      "id": "lab-resilient-gateway",
      "title": "Lab 5: Resilient AI Gateway with API Gateway & Cross-Region Failover",
      "level": "Intermediate",
      "time": "45 mins",
      "goal": "Configure Amazon API Gateway as an AI Gateway with rate limiting, prompt caching, and Cross-Region failover pools.",
      "steps": [
        "Configure a Bedrock Cross-Region Inference Profile routing between US East (N. Virginia) and US West (Oregon).",
        "Deploy an Amazon API Gateway REST API fronting the Bedrock runtime invocation endpoint.",
        "Apply an API Gateway usage plan enforcing per-client rate limits (Requests Per Second) and burst thresholds.",
        "Implement a Lambda authorizer with Amazon ElastiCache Redis to cache answers for repeated identical queries.",
        "Simulate heavy traffic to force HTTP 429 throttling; verify that Cross-Region profiles automatically absorb load with zero dropped requests."
      ]
    }
  ],
  "officialResources": [
    {
      "title": "AWS Generative AI Architecture Center",
      "url": "https://aws.amazon.com/architecture/ai-ml/",
      "desc": "Official AWS reference architectures, design patterns, and deployment guides for generative AI and machine learning."
    },
    {
      "title": "Amazon Bedrock Documentation",
      "url": "https://docs.aws.amazon.com/bedrock/",
      "desc": "Authoritative documentation for Amazon Bedrock foundation models, Knowledge Bases, Agents, and Guardrails."
    },
    {
      "title": "OpenSearch Serverless Vector Engine Guide",
      "url": "https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless-vector-search.html",
      "desc": "Technical guide to building high-scale vector search, hybrid search, and RAG with OpenSearch Serverless."
    },
    {
      "title": "AWS Well-Architected Framework — Generative AI Lens",
      "url": "https://docs.aws.amazon.com/wellarchitected/latest/generative-ai-lens/",
      "desc": "Architectural pillars, security baselines, resilience patterns, and operational standards for enterprise AI workloads."
    },
    {
      "title": "Amazon Bedrock Model Evaluations",
      "url": "https://docs.aws.amazon.com/bedrock/latest/userguide/model-evaluation.html",
      "desc": "Comprehensive guide to offline evaluation datasets, statistical metrics (groundedness, relevance), and automated benchmarking."
    },
    {
      "title": "AWS Security Best Practices for Generative AI",
      "url": "https://aws.amazon.com/security/security-learning/",
      "desc": "Enterprise security controls, IAM least privilege, data protection, and prompt defense guidelines for AI systems."
    }
  ]
};
