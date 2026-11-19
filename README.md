# AWS AI Atlas — The AI Engineering Management Operating System

A static, zero-dependency, client-side web application designed for AI Engineering Managers, Principal Architects, and Staff Engineers delivering enterprise generative AI and multi-agent systems on Amazon Web Services (AWS).

Live site: [https://sadiqgpasha89.github.io/aws-ai-atlas/](https://sadiqgpasha89.github.io/aws-ai-atlas/)

---

## The 8 Pillars of the AI Engineering Operating System

The Atlas is structured around eight foundational operational pillars that span the entire lifecycle of enterprise AI delivery:

### 1. AWS Services Catalogue (69 Services across 11 Categories)
Comprehensive coverage of the core AWS AI/ML ecosystem across compute, storage, databases, analytics, streaming, generative AI, ML platform, AI services, networking, security, and observability.
- Each service contains: what it is, interactive animated isometric workflow, step-by-step technical execution, production gotchas, edge cases, agent & ML integration patterns, architecture pairings, and cost model notes.
- Covers key AWS services: **Amazon Bedrock**, **Bedrock Knowledge Bases**, **Bedrock Agents**, **Bedrock Guardrails**, **AgentCore**, **Amazon OpenSearch Serverless**, **Amazon Textract**, **Amazon SageMaker (Training, Inference, Pipelines, Clarify, Feature Store)**, **AWS Lambda**, **AWS Step Functions**, **Amazon DynamoDB**, **Amazon Neptune**, **AWS PrivateLink**, and **Amazon CloudWatch**.

### 2. Architecture Reference Library (13 Reference Architectures)
End-to-end interactive blueprints for production AI systems with step-through packet animations:
1. **Traditional RAG**: Ingestion, document cracking, chunking, embeddings, hybrid search (BM25 + vector), Reciprocal Rank Fusion (RRF), semantic reranking, grounded generation.
2. **Agentic RAG**: Multi-query decomposition, parallel retrieval tools, iterative reflection, reranking, and answer synthesis via Bedrock Agents and DynamoDB.
3. **GraphRAG**: Knowledge graph construction, entity extraction, relationship triples, community summaries in Amazon Neptune, and graph-guided retrieval.
4. **Multimodal RAG**: Textract layout extraction, table Markdown conversion, Rekognition visual bounds, and multimodal Claude/Nova embeddings.
5. **Secure Multi-Tenant RAG**: IAM / Cognito identity propagation, document-level security trimming (ACLs), tenant isolation, and PrivateLink VPC endpoint routing.
6. **Multi-Agent Orchestration**: Bedrock Agents & AgentCore implementing sequential, supervisor, handoff, and group-chat patterns with state persistence in DynamoDB.
7. **GenAIOps & MLOps Lifecycle**: 8-stage operational pipeline: prompt versioning in Git, automated evaluation gates via SageMaker Clarify and Bedrock Evals, canary releases, and CloudWatch online telemetry.
8. **RAG on Bedrock & OpenSearch**: Classic pattern connecting API Gateway, OpenSearch Serverless, and Bedrock.
9. **High-Throughput LLM Serving on EKS**: vLLM on EKS GPU instances with autoscaling and load balancing.
10. **Enterprise MLOps on SageMaker**: SageMaker Pipelines orchestrating distributed GPU compute, Model Registry, and managed endpoints.
11. **Governed Agentic Workflows**: Bedrock Agents and Lambda tools with Step Functions state persistence.
12. **Multimodal Document Processing**: Large-scale asynchronous document extraction into structured schemas.
13. **Real-time Feature Store**: Low-latency feature store and streaming inference with DynamoDB and Kinesis.

### 3. Architecture Decision Centre (23 Decision Guides)
Exhaustive decision guides across Strategy, Architecture, and Risk, marked with one-way and two-way door reversibility markers:
- **Dedicated Role Lenses**:
  - *Engineering Manager Lens*: Default call, what to decide, team operating rhythm, quick calls, budget implications, and evidence to ask for.
  - *Principal Engineer Lens*: Default design, what to own, design trade-offs, quick calls, and evidence to demand in design reviews.
- **Includes 9 Mission-Critical AI Decisions**:
  - `vector-hybrid-search`: Vector vs Hybrid Search (OpenSearch BM25 + k-NN)
  - `classic-vs-agentic-rag`: Classic vs Agentic RAG
  - `search-vs-aurora`: OpenSearch Serverless vs Aurora PostgreSQL pgvector
  - `chunking-strategy`: Fixed vs Semantic vs Hierarchical Chunking
  - `reranking-tradeoff`: Semantic Reranking Quality vs Latency
  - `graphrag-vs-vector`: GraphRAG vs Vector RAG (Neptune vs OpenSearch)
  - `index-tenancy`: Shared vs Isolated Search Indexes
  - `workflow-vs-agent`: Deterministic Workflows vs Autonomous Agents
  - `model-deployment-capacity`: Bedrock On-Demand vs Provisioned Throughput vs Cross-Region Profiles
- Plus interactive tools: **Solution Shaper**, **Readiness Checklists**, and **Cost-per-Task Calculator**.

### 4. AI Engineering Playbooks (`#/p`)
In-depth production playbooks providing technical guidelines, measurable metrics, and engineering rules:
1. **RAG Engineering Playbook**: Document cracking via Textract layout analysis, layout-aware Markdown chunking, hybrid search tuning (RRF), semantic cross-encoder reranking, and measurable quality indicators (Recall@K, MRR, NDCG, Groundedness, Answer Relevance, Citation Quality).
2. **Multi-Agent Engineering Playbook**: Three orchestration patterns (Supervisor-Worker, Sequential Pipeline, Hierarchical Consensus), runtime comparisons (Bedrock Agents vs AgentCore vs Step Functions), memory lifecycles, and tool authorization.
3. **GenAIOps & Production MLOps Playbook**: 8-stage lifecycle, prompt versioning in Git, automated PR evaluation gates via SageMaker Clarify and Bedrock Evaluations, canary releases, and model drift monitoring.
4. **Enterprise AI Security & Hardening Playbook**: Identity delegation, document security trimming, Bedrock Guardrails prompt shields, PrivateLink VPC isolation, and egress filtering.
5. **Performance, Reliability & SRE Playbook**: Latency budgets (TTFT < 1.5s), token economics (prompt caching, cross-region inference profiles, batch inference), 429 throttling mitigation, and capacity planning.

### 5. Enterprise Security & Governance (`#/gov`)
Architecture frameworks aligning AWS AI workloads with corporate enterprise standards:
- **AWS Well-Architected Framework for AI & Control Tower Landing Zones**: Multi-account organization hierarchy, separating platform shared services accounts from decentralized workload accounts.
- **Zero-Trust Network Topology**: Hub-and-spoke with AWS Transit Gateway, AWS Network Firewall, PrivateLink VPC Endpoints for all PaaS services, and route table egress filtering.
- **8-Pillar Security Framework**: Identity, Authorization, Data Protection, Network Isolation, Prompt Defense, Agent Boundaries, Model & IP Protection, and Continuous Red Teaming.
- **Tenancy Architecture Models**: Pooled/Shared Index vs Index-per-Tenant vs Collection-per-Tenant evaluation.
- **Recommended Service Control Policies (SCPs) & Config Rules**: Programmatic guardrails enforcing private networking, CMK encryption, approved model catalogs, and CloudTrail audit logging.

### 6. Production Operations Centre (`#/ops`)
Telemetry, incident management, and SRE runbooks for stochastic AI systems:
- **Mandatory 10-Widget Operations Dashboard**: Real-time widgets tracking Task Throughput, Time to First Token (TTFT), Token Consumption, HTTP 429 Throttling, RAG Groundedness, Tool Failure Rate, Unit Cost per Task, Evaluation Trends, Guardrail Triggers, and Dependency Availability.
- **Ready-to-Run CloudWatch Queries**: Expandable CloudWatch Logs Insights queries with copy buttons for direct deployment to CloudWatch dashboards.
- **Production SRE Runbooks**: Actionable remediation procedures for 429 throttling outages, Groundedness regressions, agent infinite loops, and model deprecation upgrades.
- **AI Incident Postmortem Template**: Specialized postmortem template with AI-specific 5 Whys and probabilistic failure classification.

### 7. AI Engineering Manager Toolkit (`#/toolkit`)
Leadership artifacts, frameworks, and copyable templates:
- **AI Use-Case Assessment Matrix**: Value vs Feasibility scoring framework across 8 dimensions.
- **AI Project Estimation Framework**: 4-phase headcount allocation model (Discovery, Architecture Spike, Hardening, Launch Readiness).
- **AI Team RACI Matrix**: Clear role ownership across EM, PE, AI Engineer, MLOps, Security, Product, and Business Stakeholders.
- **AI RAID Tracker**: Core enterprise risks, assumptions, issues, and dependencies with mitigation strategies.
- **Production Quality Gates**: Formal exit criteria across Prototype, Pilot, Production, and Scale.
- **Model Assessment Matrix**: Comparison across Anthropic Claude 3.5 Sonnet/Haiku, Amazon Nova Pro/Lite/Micro, and open-weight models.
- **Team Skills Matrix**: Key competency areas and leveling targets.
- **Copyable Architecture Review Template**: Markdown questionnaire for design reviews.
- **Copyable Executive AI Status Report**: Structured one-page monthly report template.

### 8. Hands-on Labs & Learning Roadmaps (`#/labs`)
Curated progressive paths and implementation labs:
- **Role-Based Roadmaps**: 4-week AI Engineering Manager curriculum, 6-week Principal AI Architect curriculum, and 4-week Production AI Engineer curriculum.
- **5 Hands-on Implementation Labs**:
  1. *End-to-End Enterprise RAG with Bedrock Knowledge Bases & OpenSearch Serverless*
  2. *Building Autonomous Multi-Agent Workflows with Bedrock Agents & Lambda*
  3. *Document-Level Security Trimming with Cognito Claims*
  4. *GenAIOps: Automated PR Evaluation Pipeline with GitHub Actions*
  5. *Resilient AI Gateway with API Gateway & Cross-Region Failover*
- **Official AWS Architecture Resources**: Direct curated links to official AWS documentation, whitepapers, and guides.

---

## Local Development & Validation

Validate data structures and cross-references:

```bash
node scripts/check.mjs
```

Serve locally:

```bash
python3 -m http.server 8000
```
