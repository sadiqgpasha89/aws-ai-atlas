# AWS AI Atlas — The AI Engineering Management Operating System

> **A comprehensive, client-side, zero-dependency operating system for AI Engineering Managers, Principal Architects, and Staff Engineers delivering enterprise GenAI, RAG, and autonomous agent systems on Amazon Web Services (AWS).**

Live site: [https://sadiqgpasha89.github.io/aws-ai-atlas/](https://sadiqgpasha89.github.io/aws-ai-atlas/)

---

## 🏛️ System Overview

AWS AI Atlas has evolved from an AWS architecture reference into a full **AI Engineering Management Operating System**. It bridges the gap between high-level executive strategy, architectural rigor, and hands-on production engineering. 

Built with a zero-dependency, vanilla JavaScript single-page architecture that runs natively on GitHub Pages, the Atlas provides 12 specialized operational workspaces, 23 interactive reference architectures, 27 architecture decision guides, and 22 copyable production Markdown templates.

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │       AI Engineering Manager Command Centre            │
                                  │  Executive KPIs · Today's Decisions · Incidents · SLA  │
                                  └───────────────────────────┬────────────────────────────┘
                                                              │
         ┌────────────────────────────────┬───────────────────┴────────────────┬────────────────────────────────┐
         │                                │                                    │                                │
┌────────▼────────┐              ┌────────▼────────┐                  ┌────────▼────────┐              ┌────────▼────────┐
│ Delivery Centre │              │  Arch Review    │                  │ Model Registry  │              │  Eval & Quality │
│ 12 Phases / 12  │              │ 12 Dims / L×I   │                  │ 16 Models / 6   │              │ 13 Layers / 28  │
│ Squad Projects  │              │ Risk Calculator │                  │ Tier Lifecycle  │              │ Release Metrics │
└────────┬────────┘              └────────┬────────┘                  └────────┬────────┘              └────────┬────────┘
         │                                │                                    │                                │
         ├────────────────────────────────┴───────────────────┬────────────────┴────────────────────────────────┤
         │                                                    │                                                 │
┌────────▼────────┐                                  ┌────────▼────────┐                               ┌────────▼────────┐
│  AI FinOps      │                                  │ Production SRE  │                               │ Security & Gov  │
│ 17 Categories / │                                  │ 12 Principles / │                               │ NIST / ISO / EU │
│ Unit Economics  │                                  │ 14 Chaos Drills │                               │ 9-Account LZ    │
└────────┬────────┘                                  └────────┬────────┘                               └────────┬────────┘
         │                                                    │                                                 │
         └────────────────────────────────┬───────────────────┴────────────────┬────────────────────────────────┘
                                          │                                    │
                                 ┌────────▼────────┐                  ┌────────▼────────┐
                                 │ Team Leadership │                  │ Manager Toolkit │
                                 │ 10 Competencies │                  │ 22 Production   │
                                 │ Tech Debt Index │                  │ MD Templates    │
                                 └─────────────────┘                  └─────────────────┘
```

---

## 🧰 My workspace (V2)

A local-first management layer added on top of the reference content. Data stays in your browser; there is no backend.

| Page | Route | What it does |
|---|---|---|
| Dashboard | `#/command` | KPIs, attention list, delivery, risks, actions, entered cost; filters; Markdown/CSV/print export |
| Initiatives | `#/portfolio` | Portfolio list, lifecycle stages (Idea to Scale, Sunset/Rejected) with history, milestones, cost/benefit entries |
| Prioritisation | `#/portfolio/prioritise` | Editable-weight scoring, sensitivity, rank stability, value-vs-feasibility matrix, compare two |
| Registers | `#/registers/risks`, `/decisions`, `/actions` | Risk register (probability × impact), decision log, action tracker |
| Calculators | `#/calc/llm` and others | LLM, RAG, agent, model comparison, budget, capacity, unit economics, optimisation, ROI/payback; saved scenarios |
| Workspace | `#/workspace` | Sample/personal mode, JSON export, validated import with preview, delete |

Principles: prices and volumes are always typed by you (examples are labelled); nothing is fetched live; status uses text plus a symbol, not colour alone; do not enter secrets or personal data.

What is and is not implemented from the V2 plan is listed honestly in [`docs/implementation/status.md`](docs/implementation/status.md). Privacy details: [`docs/privacy/privacy.md`](docs/privacy/privacy.md). Testing: [`docs/testing/testing.md`](docs/testing/testing.md).

### Development

```sh
node scripts/build_app.mjs        # regenerate assets/app.js (do not edit it by hand)
node scripts/check.mjs            # validate content data and script wiring
node --test tests/*.test.mjs      # unit tests
python3 -m http.server            # then open http://localhost:8000/
```

New workspace code lives in `assets/lib/` (pure logic, unit tested) and `assets/ui/` (pages), registered through `window.ATLAS.routes`.

---

## 🗂️ The 12 Operational Workspaces

### 1. AI Engineering Manager Command Centre (`#/` & `#/command`)
A dashboard built **only** from the records you enter in your own workspace (see "My workspace" below). It shows active initiatives, items at risk or blocked, overdue milestones, open critical/high risks, overdue actions, pending decisions and entered cost estimates. Every number links to the records behind it. It never reads AWS, CloudWatch or any live system, and shows no figure you did not enter. An empty workspace shows a guided empty state; **Explore with sample data** loads clearly labelled fictional records.

The original static page, whose figures were illustrative and hand-written, is kept at `#/command/sample` behind an "ILLUSTRATIVE STATIC CONTENT" banner.

### 2. AI Delivery Lifecycle Centre (`#/delivery`)
A standardized 12-stage delivery lifecycle operating system for enterprise AI:
- **12 Phase Framework**: `Discovery` → `Business Validation` → `AI Feasibility` → `Architecture Design` → `Experimentation (PoC)` → `MVP Delivery` → `Production Hardening` → `Staged Rollout` → `Operations & SRE` → `Optimization & FinOps` → `Enterprise Scale` → `Decommissioning`.
- **Portfolio Tracker**: Interactive multi-squad tracking of 12 enterprise initiatives across Customer Experience, Wealth Tech, Regulatory AI, Developer Platforms, and Back-Office Operations.
- **Phase Gate Review Engine**: Strict exit checklists and artifact requirements before advancing initiatives across gates.

### 3. Enterprise AI Architecture Review Board (`#/arch-review`)
Formal governance and systemic risk evaluation for AI systems:
- **12 Review Dimensions**: Model capability fit, prompt injection defenses, RAG groundedness, agent tool permissions, latency SLA budgets, FinOps unit economics, multi-tenant isolation, data privacy compliance, observability telemetry, failure mode fallbacks, disaster recovery, and operational debt.
- **Interactive Risk Calculator**: Real-time Likelihood ($1-4$) $\times$ Impact ($1-4$) risk scoring with automatic risk categorization (Critical, High, Medium, Low).
- **Multi-Squad Systemic Risk Analysis**: Cross-portfolio risk heatmaps identifying shared architectural vulnerabilities across engineering teams.
- **ARB Review Template**: Instant one-click copyable enterprise Architecture Review Board Markdown document.

### 4. AWS AI Service Selection Matrix (`#/selector`)
Objective, trade-off driven workload-to-service mapping:
- **14 Enterprise Workloads Covered**: Document Q&A, Autonomous Support Agents, Code Generation, Voice AI, High-Throughput Fraud Detection, Tabular Forecasting, Graph Knowledge Retrieval, Real-time Visual Inspection, Enterprise Semantic Search, Batch Summarization, Regulated Compliance Anonymization, Multi-Modal Catalog Ingestion, Internal Helpdesk, and Low-Latency Edge Inference.
- **Architectural Rationale**: Highlights recommended primary AWS service alongside two alternatives, with explicit architectural explanations for **why alternatives were rejected**.

### 5. Model Portfolio & Lifecycle Management (`#/models`)
End-to-end model governance across proprietary, open-weight, and specialized models:
- **16-Model Enterprise Registry**: Anthropic Claude 3.5 Sonnet / Haiku / Opus, Amazon Nova Pro / Lite / Micro / Premier, Meta Llama 3.3 70B / Llama 3.1 8B, DeepSeek R1 / V3, Mistral Large 2, Cohere Command R+, and Amazon Titan.
- **6-Stage Lifecycle**: `Candidate` → `Evaluation` → `Staging` → `Production` → `Maintenance` → `Deprecated`.
- **Promotion Policy & Quality Bars**: Specific threshold criteria required for promotion across Sandbox, Staging, and Production.
- **10-Point Model Migration Playbook**: Safe, zero-downtime migration protocol for replacing deprecated or updated foundation models in production.

### 6. AI Evaluation & Quality Engineering Centre (`#/eval`)
Comprehensive continuous evaluation framework:
- **13 Evaluation Layers**: Token-level unit tests, semantic similarity, retrieval quality, answer faithfulness, hallucination detection, prompt injection resilience, toxic content moderation, tool call parameter accuracy, agent trajectory efficiency, multi-turn coherence, latency SLA compliance, user feedback telemetry, and business ROI impact.
- **28 Metrics Dictionary**: Formal mathematical definitions, target thresholds, and AWS implementation tools for Recall@K, MRR, NDCG, Groundedness, Faithfulness, Semantic Drift, BLEU/ROUGE, and Intercept Rate.
- **12 Mandatory Release Quality Gates**: Hard non-negotiable pass/fail gates that block CI/CD pipeline deployments.
- **Golden Dataset Design Guide**: Methodologies for curating, synthetic bootstrapping, adversarial testing, and versioning golden ground-truth datasets.

### 7. AI FinOps & Unit Economics (`#/finops`)
Rigorous cost attribution and margin protection for generative AI:
- **4 Key Engineering Manager Metrics**: Cost-per-Successful-Task (CPST), Cost-per-1K-Tokens (Blended), Monthly Active User Cost (MAUC), and FinOps Budget Variance.
- **17 Cost Tiers & Architecture Levers**: Deep breakdown of token pricing, provisioned throughput, embedding compute, vector indexing storage, OCR cracking, and NAT Gateway egress.
- **5 Workload Financial Scenarios**: Complete unit economic modeling for High-Volume Support, Enterprise RAG, Autonomous Coding Agents, Real-Time Audio Transcription, and Document Extraction.
- **17 Cost Reduction Levers**: Actionable architectural levers (prompt caching, model routing, semantic caching, quantization, cross-region profiles) with expected savings percentages.
- **7 FinOps Approval Gates**: Governance boundaries for spending limits, commitment purchases, and cost spike interventions.

### 8. Production Operations & AI SRE (`#/ops`)
Site reliability engineering tailored for probabilistic, non-deterministic AI systems:
- **12 Reliability Principles**: Defensive prompt framing, graceful degradation, circuit breakers, idempotency, bounded agent recursions, and fallback cascading.
- **6 Production SLO Error Budgets**: Rigorous availability, latency, groundedness, and error budget definitions.
- **14 Chaos Engineering Drills**: Structured game days testing model throttling (429), vector index dropouts, tool timeouts, and poisoned context injections.
- **8 Incident Categories & Runbooks**: Step-by-step triage, mitigation, and postmortem procedures for Hallucination Spikes, Infinite Agent Loops, Model Deprecations, and Guardrail Intercept Surges.

### 9. Enterprise Security, Governance & Compliance (`#/gov`)
Zero-trust architecture and regulatory compliance:
- **5 Global Compliance Frameworks**: Detailed mappings to NIST AI RMF 1.0, ISO/IEC 42001, EU AI Act, India Digital Personal Data Protection (DPDP) Act, and HIPAA.
- **12 Compliance Controls Matrix**: Granular technical controls, enforcement mechanisms, and AWS service integrations.
- **9-Account AWS Organization Landing Zone**: Segregated account hierarchy separating Core Services, Security/Audit, Data Ingestion, Model Development, Staging, and Production Workloads.
- **Enterprise Audit Evidence Checklist**: Exact AWS artifact collection steps for internal security reviews and regulatory audits.

### 10. Engineering Leadership & Workforce (`#/leadership`)
Workforce planning, team leveling, and technical debt management:
- **10-Domain Competency Matrix**: Granular leveling expectations (Junior, Mid-Level, Senior, Staff, Principal) across Model Architecture, Prompt Engineering, MLOps, Security, SRE, and FinOps.
- **5 Engineering Productivity Metrics**: Delivery velocity, eval coverage, incident resolution MTTR, prompt regression rate, and knowledge sharing index.
- **13 Technical Debt Categories**: Specialized framework for identifying, tracking, and prioritizing AI-specific technical debt (e.g., prompt sprawl, unversioned golden datasets, shadow vector indexes).
- **5-Level Organizational AI Maturity Ladder**: Benchmark progression from Ad-Hoc Experimentation to Autonomous Self-Healing Enterprise AI.

### 11. AI Engineering Manager Toolkit (`#/toolkit`)
A library of **22 production-ready, copyable Markdown templates** with one-click copy functionality:
1. `AI Project Charter & Business Case`
2. `AI Feasibility & Technical Spike Plan`
3. `Architecture Review Board (ARB) Submission`
4. `AI System Architecture Decision Record (ADR)`
5. `Model Selection & Trade-Off Document`
6. `Golden Dataset Specification & Curation Protocol`
7. `AI Evaluation Plan & Quality Gate Definition`
8. `AI System Threat Model & Security Review`
9. `Data Protection & Privacy Impact Assessment (DPIA)`
10. `Prompt Defense & Guardrail Policy Specification`
11. `AI FinOps Unit Economics & Budget Model`
12. `Service Level Objective (SLO) & Error Budget Agreement`
13. `Production AI Release Checklist & Quality Gate Verification`
14. `AI SRE Incident Runbook & Triage Guide`
15. `AI Incident Postmortem & Root Cause Analysis (RCA)`
16. `Chaos Engineering & Game Day Plan for AI Systems`
17. `AI Team RACI & Ownership Matrix`
18. `AI Technical Debt Audit & Remediation Backlog`
19. `AI Engineering Competency Assessment & Leveling Rubric`
20. `Weekly AI Engineering Operations Report`
21. `Monthly Executive AI Portfolio Review`
22. `Model Decommissioning & Retirement Plan`

### 12. Hands-on Labs & Learning Roadmaps (`#/labs`)
Curated training paths and hands-on implementation labs:
- **Role-Based Roadmaps**: 4-week AI Engineering Manager curriculum, 6-week Principal AI Architect curriculum, and 4-week Production AI Engineer curriculum.
- **5 Hands-on Implementation Labs**: Step-by-step guides for Enterprise RAG with Bedrock & OpenSearch, Multi-Agent Workflows, Security Trimming, GenAIOps PR Evaluation, and Cross-Region Resilient AI Gateways.

---

## 🏗️ 23 Reference Architectures (`#/a`)

Complete architectural blueprints with interactive packet flow simulations:
1. **Traditional RAG (Bedrock & OpenSearch Serverless)**: Ingestion, layout cracking, hybrid search (BM25 + vector), RRF, reranking, and generation.
2. **Agentic RAG**: Multi-query decomposition, parallel tool retrieval, self-reflection, and iterative synthesis.
3. **GraphRAG**: Entity-relationship extraction, Amazon Neptune graph storage, and graph-guided retrieval.
4. **Multimodal RAG**: Textract layout parsing, Markdown conversion, visual bounding, and multimodal embeddings.
5. **Secure Multi-Tenant RAG**: IAM/Cognito claims propagation, document-level security trimming, and tenant isolation.
6. **Multi-Agent Orchestration**: Bedrock Agents and AgentCore coordinating Supervisor, Sequential, and Consensus patterns.
7. **GenAIOps & MLOps Lifecycle**: Automated PR evaluation gates, model registry, canary deployment, and CloudWatch telemetry.
8. **RAG on Bedrock & OpenSearch Serverless**: Managed serverless retrieval pattern.
9. **High-Throughput LLM Serving on EKS**: vLLM on EKS GPU instances with Karpenter autoscaling and cross-AZ load balancing.
10. **Enterprise MLOps on SageMaker**: SageMaker Pipelines, Model Registry, and managed endpoints.
11. **Governed Agentic Workflows**: Step Functions state persistence with Lambda tool authorization.
12. **Multimodal Document Processing**: High-throughput asynchronous document extraction pipeline.
13. **Real-Time Feature Store**: Streaming inference with SageMaker Feature Store and Amazon DynamoDB.
14. **Cross-Region Resilient Bedrock**: Cross-region inference profiles with automatic Route 53 health-check failover.
15. **Event-Driven Agentic Orchestration**: Amazon EventBridge Pipes triggering Bedrock Agents asynchronously.
16. **High-Speed Semantic Caching**: ElastiCache Redis semantic caching layer reducing model inference costs by up to 60%.
17. **Federated Knowledge Retrieval**: Multi-source querying across OpenSearch, Aurora, Kendra, and S3 data lakes.
18. **Real-Time Audio & Voice AI**: Amazon Transcribe streaming into Bedrock models with Polly voice synthesis.
19. **Code Generation & AI Dev Platform**: Enterprise code review, AST static analysis, and automated pull-request remediation.
20. **AI Safety & Red-Teaming Gateway**: Dual-tier Bedrock Guardrails, prompt injection shielding, and PII masking.
21. **Edge AI Inference with AWS IoT Greengrass**: Quantized model deployment to edge devices with cloud synchronization.
22. **Regulatory Compliance & Anonymization Engine**: Real-time sensitive entity redacting and tokenization pipeline.
23. **High-Velocity Feature Engineering Pipeline**: Streaming feature extraction with Kinesis, Flink, and Glue Data Catalog.

---

## ⚖️ 27 Architecture Decision Guides (`#/d`)

Strategic and tactical decision frameworks featuring dedicated **Engineering Manager (EM)** and **Principal Engineer (PE)** lenses, reversibility markers (1-Way vs 2-Way Doors), and architectural red flags:
- `vector-hybrid-search`: Vector vs Hybrid Search (OpenSearch BM25 + k-NN)
- `classic-vs-agentic-rag`: Classic vs Agentic RAG
- `search-vs-aurora`: OpenSearch Serverless vs Aurora PostgreSQL pgvector
- `chunking-strategy`: Fixed vs Semantic vs Hierarchical Chunking
- `reranking-tradeoff`: Semantic Reranking Quality vs Latency
- `graphrag-vs-vector`: GraphRAG vs Vector RAG (Neptune vs OpenSearch)
- `index-tenancy`: Shared vs Isolated Search Indexes
- `workflow-vs-agent`: Deterministic Workflows vs Autonomous Agents
- `model-deployment-capacity`: Bedrock On-Demand vs Provisioned Throughput vs Cross-Region Profiles
- `proprietary-vs-open-weights`: Managed Bedrock Models vs Self-Hosted Open-Weight Models on EKS
- `agent-framework-selection`: AWS Bedrock Agents vs LangGraph / AutoGen / CrewAI
- `embedding-model-selection`: Amazon Titan Embeddings vs Cohere Embed English/Multilingual
- `memory-persistence-pattern`: Session Memory vs Long-Term Vector Memory vs Graph Memory
- `tool-execution-boundary`: Direct Lambda Execution vs Containerized Microservices vs Step Functions
- `prompt-versioning-storage`: Code-Based Git Repositories vs Managed Registry
- `evaluation-strategy`: LLM-as-a-Judge vs Deterministic Rule-Based vs Human-in-the-Loop
- `inference-caching-layer`: Semantic Vector Caching vs Exact Response Caching vs No Cache
- `streaming-vs-blocking-api`: Server-Sent Events (SSE) Streaming vs Synchronous Blocking APIs
- `guardrail-enforcement-point`: Gateway Layer vs Application Middleware vs Model Parameter Tier
- `multi-region-ai-failover`: Active-Active Multi-Region vs Primary-Warm Standby vs Cross-Region Profiles
- `cost-allocation-attribution`: Tenant Tagging vs Workload Quotas vs Consolidated Blended Billing
- `data-ingestion-cadence`: Real-Time Streaming Ingestion vs Scheduled Batch Ingestion
- `finetuning-vs-rag`: RAG Augmentation vs Continued Pre-Training / LoRA Fine-Tuning
- `synthetic-data-generation`: LLM-Generated Synthetic Data vs Real Anonymized Data
- `human-in-the-loop-trigger`: Confidence Threshold Scoring vs Random Sample Auditing
- `governance-enforcement-level`: Hard CI/CD Automated Gates vs Soft Warning Dashboards
- `agent-communication-protocol`: Direct Peer Messaging vs Central Blackboard Architecture

---

## 🚀 Workload Production Release Gates (`#/p`)

All AI engineering playbooks feature dedicated production release gates with non-negotiable exit criteria:
- **RAG Production Gates**: Minimum Groundedness $\ge 0.90$, Answer Relevance $\ge 0.85$, P95 Retrieval Latency $< 350\text{ms}$, Zero Plaintext PII in chunk embeddings.
- **Agentic AI Production Gates**: Loop recursion limit bounded $\le 8$ iterations, tool call execution timeout $\le 10\text{s}$, human-in-the-loop fallback on $< 0.80$ intent confidence, strict IAM role scoping for all tool Lambda functions.
- **ML & Fine-Tuning Gates**: Data drift $p\text{-value} > 0.05$, bias metric disparity $< 10\%$, automated rollback triggered on $> 1\%$ latency regression.
- **AI Gateway & API Gates**: Rate limiting by tenant API key, cross-region failover tested under synthetic 429 injection, prompt caching hit-rate telemetry active.

---

## 🛠️ Local Development & Validation

### Validate Data Integrity & Schemas
Run the automated test suite to verify all services, architectures, decision guides, shaper combinations, and schema cross-references:

```bash
node scripts/check.mjs
```

### Validate Syntax & Compilation
Ensure zero syntax errors across the core application codebase:

```bash
node --check assets/app.js
```

### Run everything

```bash
npm run check    # data validation + syntax checks
npm test         # unit tests (workspace logic, search, site rules)
npm run smoke    # browser smoke test over every route (needs Playwright; see docs/testing/testing.md)
npm run verify   # all three
```

`assets/app.js` is generated: edit `scripts/build_app.mjs` and run `node scripts/build_app.mjs`. See `CHANGELOG.md` for what changed and why.

### Run Locally
Start a lightweight local server:

```bash
python3 -m http.server 8000
# Open http://localhost:8000 in your browser
```

---

## 📄 License & Attribution

Designed and maintained for AI engineering leaders delivering mission-critical artificial intelligence systems on Amazon Web Services. Distributed under the Apache 2.0 License.
