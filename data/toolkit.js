/* AI Engineering Manager's Toolkit: Delivery, Governance, Templates & Frameworks */
window.ATLAS.toolkit = {
  "title": "AI Engineering Manager's Toolkit",
  "lede": "Practical artifacts, calculators, and decision templates designed for engineering managers and principal engineers delivering production AI systems on AWS.",
  "useCaseAssessment": {
    "title": "AI Use-Case Assessment Matrix (Value vs Feasibility)",
    "intro": "Evaluate candidate AI initiatives across business impact and technical feasibility before committing engineering headcount. Score each dimension 1 to 5.",
    "dimensions": [
      {
        "category": "Business Value (Weight: 50%)",
        "criteria": [
          {
            "name": "Direct ROI / Cost Savings",
            "desc": "Measurable labor hours saved, operational cost reduced, or cycle time shortened."
          },
          {
            "name": "Revenue & Competitive Differentiation",
            "desc": "Direct revenue generation, customer retention, or unique market advantage."
          },
          {
            "name": "Strategic Alignment",
            "desc": "Directly supports primary corporate executive OKRs and board priorities."
          },
          {
            "name": "Stakeholder & Executive Sponsorship",
            "desc": "Committed business unit owner ready to test and champion user adoption."
          }
        ]
      },
      {
        "category": "Technical Feasibility (Weight: 50%)",
        "criteria": [
          {
            "name": "Data Readiness & Quality",
            "desc": "Curated, clean, permissioned enterprise documents and structured data exist in [[s3]]."
          },
          {
            "name": "Deterministic Accuracy Tolerance",
            "desc": "Can business tolerate 95% accuracy with human fallback, or is 100% precision required?"
          },
          {
            "name": "Reasoning Complexity",
            "desc": "Simple lookup/summary (high feasibility) vs autonomous multi-step reasoning (lower feasibility)."
          },
          {
            "name": "Security & Regulatory Risk",
            "desc": "Low risk (internal FAQ) vs high risk (financial transactions, healthcare PII)."
          }
        ]
      }
    ],
    "scoringMatrix": [
      {
        "range": "Score 18-20",
        "verdict": "Priority 1: Immediate Win",
        "action": "Fund immediately. High value, low technical complexity. Start rapid prototype."
      },
      {
        "range": "Score 14-17",
        "verdict": "Priority 2: Strategic Investment",
        "action": "Plan for next quarter. Requires data curation or architecture spike first."
      },
      {
        "range": "Score 10-13",
        "verdict": "Caution: Re-scope or Simplify",
        "action": "Complexity exceeds near-term value. Re-scope into a narrow deterministic workflow."
      },
      {
        "range": "Below 10",
        "verdict": "Reject / Deprioritize",
        "action": "Do not fund. Unclear value or extreme technical/regulatory risk."
      }
    ]
  },
  "projectEstimation": {
    "title": "AI Project Estimation Framework",
    "intro": "Standard software estimation models fail on AI projects because data preparation, prompt experimentation, and evaluation sweeps consume more time than writing application glue.",
    "phases": [
      {
        "name": "Phase 1: Discovery & Eval Set Curation (2-3 Weeks)",
        "alloc": "20% Headcount",
        "deliverables": "Curating 100-200 representative test questions; labeling ground truth; establishing baseline score on simple prompt."
      },
      {
        "name": "Phase 2: RAG / Tool Architecture Spike (3-4 Weeks)",
        "alloc": "35% Headcount",
        "deliverables": "Document cracking via Textract; schema indexing in OpenSearch Serverless; building tool Lambda functions; testing hybrid search recall."
      },
      {
        "name": "Phase 3: Security & Enterprise Hardening (2-3 Weeks)",
        "alloc": "25% Headcount",
        "deliverables": "Cognito / IAM identity propagation; PrivateLink VPC endpoints; document security trimming; Bedrock Guardrails; API Gateway rate limits."
      },
      {
        "name": "Phase 4: Operations & Launch Readiness (2 Weeks)",
        "alloc": "20% Headcount",
        "deliverables": "Canary deployment setup; CloudWatch dashboards; on-call runbooks; service quota approvals; load and failure testing."
      }
    ]
  },
  "architectureReview": {
    "title": "AI Architecture Review Template",
    "intro": "Standardized questionnaire to evaluate AI solution designs during formal engineering architecture reviews.",
    "templateMarkdown": "# AI Architecture Review: [System Name]\n\n**Review Date:** YYYY-MM-DD\n**Engineering Manager:** [Name]\n**Principal Engineer / Lead Architect:** [Name]\n**Product Manager:** [Name]\n**Review Status:** [Approved / Approved with Conditions / Rejected]\n\n---\n\n## 1. System Overview & Problem Statement\n- What business problem does this solve, and why is an AI model required over deterministic code?\n- Target user personas, expected concurrent users, and peak query volume (requests per second).\n\n## 2. Model & Hosting Strategy\n- **Selected Models:** (e.g. Anthropic Claude 3.5 Sonnet, Amazon Nova Pro, Titan Embeddings).\n- **Deployment Type:** [Bedrock On-Demand / Cross-Region Inference / Provisioned Throughput / SageMaker Real-Time Endpoint].\n- **Residency & Sovereignty:** Does this workload process data outside the primary AWS Region?\n- **Quota & Capacity:** Are approved tokens per minute (TPM) sufficient for 3x anticipated launch peak?\n\n## 3. Data & Retrieval Layer (RAG)\n- **Document Ingestion:** How are documents cracked and chunked? Is Textract used for tables?\n- **Search Strategy:** Pure vector or Hybrid (BM25 + Dense Vectors) + Semantic Cross-Encoder Reranker?\n- **Tenancy & Security Trimming:** How are document-level permissions enforced? Are filters injected server-side?\n\n## 4. Agentic Architecture & Autonomy Controls\n- **Orchestration Pattern:** [Sequential / Supervisor / Handoff / Deterministic Workflow with LLM].\n- **Tool Authorization:** Do tools execute with user-delegated tokens or shared service credentials?\n- **Blast Radius & Approval Gates:** Which tools perform writes, and how is human authorization enforced via Step Functions?\n- **Safety Budgets:** What are the hard caps on tool iterations (max turns) and wall-clock timeout?\n\n## 5. Security & Governance\n- **Network Isolation:** Are all AI endpoints on AWS PrivateLink with public access disabled?\n- **Guardrails:** Are Guardrails for Amazon Bedrock enabled for both input prompts and retrieved context?\n- **Zero Customer Data Retention (ZCDR):** Is contractual zero data retention confirmed?\n\n## 6. Observability, Evals & Operations\n- **Evaluation Baseline:** What is the current Recall@K, Groundedness, and Relevance score on the golden dataset?\n- **Production Dashboard:** Are P95 TTFT, 429 throttling spikes, and tool error rates instrumented in CloudWatch?\n- **Cost per Task:** What is the modeled unit economics cost per successful task?\n- **Rollback Mechanism:** How is a broken prompt or bad model version rolled back within 5 minutes?\n"
  },
  "raciMatrix": {
    "title": "AI Engineering RACI Matrix",
    "intro": "Clarifies engineering accountability, ownership, and advisory roles across AI projects.",
    "roles": [
      "Engineering Manager (EM)",
      "Principal Engineer (PE)",
      "AI / ML Engineer",
      "Data Engineer",
      "Product Manager (PM)",
      "InfoSec / Compliance"
    ],
    "matrix": [
      {
        "task": "Use-case scoping and business ROI definition",
        "raci": [
          "A",
          "C",
          "I",
          "I",
          "R",
          "C"
        ]
      },
      {
        "task": "Golden evaluation dataset creation & labeling",
        "raci": [
          "A",
          "C",
          "R",
          "C",
          "R",
          "I"
        ]
      },
      {
        "task": "Model selection & deployment type (PT vs On-Demand)",
        "raci": [
          "A",
          "R",
          "C",
          "I",
          "I",
          "C"
        ]
      },
      {
        "task": "RAG retrieval architecture (hybrid, reranking, chunking)",
        "raci": [
          "I",
          "A",
          "R",
          "C",
          "I",
          "I"
        ]
      },
      {
        "task": "Data pipeline ingestion & document cracking",
        "raci": [
          "I",
          "C",
          "C",
          "R/A",
          "I",
          "I"
        ]
      },
      {
        "task": "Agent tool authorization & security boundary design",
        "raci": [
          "A",
          "R",
          "C",
          "I",
          "I",
          "C"
        ]
      },
      {
        "task": "Data privacy, PII masking & residency compliance",
        "raci": [
          "A",
          "C",
          "I",
          "I",
          "I",
          "R/A"
        ]
      },
      {
        "task": "CI/CD pipeline & automated evaluation gates",
        "raci": [
          "I",
          "A",
          "R",
          "I",
          "I",
          "I"
        ]
      },
      {
        "task": "Operational dashboards, runbooks & on-call rota",
        "raci": [
          "A",
          "R",
          "C",
          "I",
          "I",
          "I"
        ]
      },
      {
        "task": "Cost per task optimization & FinOps levers",
        "raci": [
          "A",
          "R",
          "C",
          "I",
          "C",
          "I"
        ]
      }
    ]
  },
  "raidTracker": {
    "title": "AI Project RAID Tracker (Risks, Assumptions, Issues, Dependencies)",
    "intro": "Pre-populated RAID template highlighting the typical failure modes in enterprise generative AI initiatives on AWS.",
    "items": [
      {
        "type": "Risk",
        "title": "HTTP 429 ThrottlingException at launch",
        "mitigation": "Request quota 4 weeks prior; implement Bedrock Cross-Region Inference Profiles."
      },
      {
        "type": "Risk",
        "title": "Prompt injection via retrieved customer documents",
        "mitigation": "Deploy Bedrock Guardrails; delimit untrusted text in system prompt."
      },
      {
        "type": "Risk",
        "title": "Uncontrolled cost explosion from multi-agent loops",
        "mitigation": "Enforce hard limits on maximum tool turns (max 5) and session timeout."
      },
      {
        "type": "Assumption",
        "title": "Enterprise documents contain accurate, up-to-date knowledge",
        "validation": "Audit document owners and S3 bucket lifecycles before ingestion."
      },
      {
        "type": "Assumption",
        "title": "End users accept 95% accuracy with human escalation path",
        "validation": "Confirm with product stakeholders and user research in pre-pilot phase."
      },
      {
        "type": "Issue",
        "title": "Naive chunker destroys tables in financial PDF reports",
        "resolution": "Replace standard text splitter with Amazon Textract layout models."
      },
      {
        "type": "Dependency",
        "title": "Enterprise IAM Identity Center group sync for document ACLs",
        "resolution": "Coordinate with Identity Team to ensure group claims are present in OAuth tokens."
      },
      {
        "type": "Dependency",
        "title": "Bedrock Provisioned Throughput quota approval",
        "resolution": "Submit AWS Service Quotas increase request across candidate regions."
      }
    ]
  },
  "qualityGates": {
    "title": "Maturity Quality Gates & Exit Criteria",
    "intro": "Measurable acceptance criteria required to promote an AI feature across stages.",
    "stages": [
      {
        "stage": "Gate 1: Prototype -> Pilot",
        "criteria": [
          "Golden evaluation dataset of at least 100 representative cases exists in Git.",
          "Baseline Groundedness score exceeds 90% on golden evaluation set.",
          "Initial cost per task modeled and accepted by business owner.",
          "All tool actions are read-only or gated behind manual human approvals.",
          "Basic prompt injection defense verified with red-team test suite."
        ]
      },
      {
        "stage": "Gate 2: Pilot -> Production",
        "criteria": [
          "Evaluation dataset expanded to 500+ real-world cases; Groundedness >95%, Relevance >90%.",
          "Automated evaluation gates integrated into CI/CD build pipeline.",
          "Model quota approved for 3x peak; multi-region Cross-Region fallback verified under load.",
          "Document-level security trimming verified with zero cross-tenant query leakage.",
          "Zero Customer Data Retention (ZCDR) confirmed with AWS.",
          "Production dashboard active in CloudWatch; on-call rota and runbooks staffed."
        ]
      },
      {
        "stage": "Gate 3: Production -> Scale",
        "criteria": [
          "Unit economics optimized: prompt caching active (>35% hit rate) and batch inference utilized for offline tasks.",
          "Cost per successful task is stable under 10x traffic projections.",
          "Continuous drift monitoring detects quality regression within 1 hour.",
          "Quarterly model retirement and upgrade evaluation schedule established."
        ]
      }
    ]
  },
  "vendorMatrix": {
    "title": "Model & Platform Assessment Matrix",
    "intro": "Comparing foundation model options and deployment paths available on AWS Bedrock and SageMaker.",
    "models": [
      {
        "family": "Anthropic Frontier Models (Claude 3.5 Sonnet)",
        "strengths": "Industry-leading reasoning, coding, complex tool use, and visual document understanding.",
        "tradeoffs": "Higher cost per token, subject to regional quota allocations.",
        "bestFit": "Multi-agent supervisors, complex contract analysis, multimodal diagrams, code generation."
      },
      {
        "family": "Anthropic Fast Models (Claude 3.5 Haiku)",
        "strengths": "Extremely fast TTFT, low cost, excellent at classification and structured JSON extraction.",
        "tradeoffs": "Lower multi-step reasoning depth; prone to drift on complex open-ended instructions.",
        "bestFit": "Query routing, text summarization, data extraction, high-volume chatbot triage."
      },
      {
        "family": "Amazon Nova Frontier & Multimodal Models (Nova Pro / Lite / Micro)",
        "strengths": "Cost-effective, native Bedrock optimization, strong multimodal understanding and video processing.",
        "tradeoffs": "Newer ecosystem; prompt engineering differs slightly from Claude.",
        "bestFit": "Enterprise document RAG, multimodal media analysis, cost-conscious production workloads."
      },
      {
        "family": "Open-Weight Models (Meta Llama 3, Mistral Large on Bedrock / SageMaker)",
        "strengths": "Available in Bedrock or self-hosted on SageMaker; prevents single-vendor lock-in.",
        "tradeoffs": "Tool-calling schemas vary; self-hosting requires managing GPU infrastructure.",
        "bestFit": "Specialized domain tasks, compliance mandates requiring open-source auditability."
      }
    ]
  },
  "skillsMatrix": {
    "title": "AI Engineering Team Skills & Capability Matrix",
    "intro": "Assess current team capabilities and identify hiring or training gaps across the AI engineering lifecycle.",
    "competencies": [
      {
        "area": "RAG & Search Engineering",
        "skills": "Document parsing, layout analysis, vector indexing algorithms (HNSW), hybrid search, semantic reranking, metadata filtering.",
        "levelTarget": "Advanced (Essential for all knowledge assistants)"
      },
      {
        "area": "Agent Architecture & Orchestration",
        "skills": "Amazon Bedrock Agents, AgentCore, state persistence in DynamoDB, tool interface design, MCP protocol, human-in-the-loop flows.",
        "levelTarget": "Intermediate to Advanced (Essential for multi-agent systems)"
      },
      {
        "area": "GenAIOps & Evaluation",
        "skills": "SageMaker Clarify, synthetic dataset generation, automated LLM-as-a-judge scoring, CI/CD evaluation gates, drift detection.",
        "levelTarget": "Advanced (Mandatory for production release confidence)"
      },
      {
        "area": "AI Security & Governance",
        "skills": "AWS IAM Identity Center, Bedrock Guardrails, indirect injection mitigations, document ACLs, PrivateLink VPC networking.",
        "levelTarget": "Intermediate (Essential for enterprise compliance)"
      },
      {
        "area": "Cloud Platform & FinOps",
        "skills": "AWS CDK, API Gateway AI gateway policies, Provisioned Throughput sizing, prompt caching economics, CloudWatch telemetry.",
        "levelTarget": "Intermediate to Advanced (Essential for scalability and budget control)"
      }
    ]
  },
  "executiveReportTemplate": {
    "title": "Executive AI Status Report Template",
    "intro": "One-page monthly executive reporting template for leadership, steering committees, and business sponsors.",
    "templateMarkdown": "# Executive AI Status Report: [Project Name]\n\n**Reporting Period:** [Month, Year]\n**Engineering Manager:** [Name]\n**Product Sponsor:** [Name]\n**Overall Health:** [Green / Amber / Red]\n\n---\n\n## 1. Business Value & Milestone Highlights\n- **Key Achievements:** [Top 2-3 business outcomes delivered this month].\n- **Production Adoption:** [Active users, tasks completed, user satisfaction rating].\n- **Efficiency Impact:** [Hours saved or revenue influenced].\n\n## 2. Quality & Reliability Scorecard\n| Metric | Target | Current | Trend | Status |\n| :--- | :--- | :--- | :--- | :--- |\n| Task Completion Rate | >95% | 98.6% | +0.8% | On Target |\n| Groundedness (Evals) | >95% | 96.8% | +0.6% | On Target |\n| P95 Response Latency | <2,000ms | 1,380ms | -140ms | On Target |\n| HTTP 429 Throttling Rate | <0.1% | 0.05% | -0.01% | On Target |\n\n## 3. Financial Performance (FinOps)\n- **Monthly Cloud & Token Spend:** $X,XXX (Budget: $Y,YYY · Variance: Z%).\n- **Unit Economics (Cost per Task):** $0.0135 (Target: <$0.020).\n- **Optimization Impact:** Prompt caching and Cross-Region routing saved $X,XXX this month.\n\n## 4. Key Risks & Delivery Blockers\n- **Blocker 1:** [Description, business impact, owner, required leadership decision].\n- **Risk 1:** [Upcoming risk e.g. quota limit, vendor model retirement, or compliance review].\n\n## 5. Next Month Priorities\n1. [Milestone 1: e.g. Expanding pilot to 500 business users].\n2. [Milestone 2: e.g. Deploying automated PR evaluation gate in GitHub Actions].\n3. [Milestone 3: e.g. Integrating document security trimming with Cognito group claims].\n"
  },
  "templates": [
    {
      "id": "proj-portfolio-dash",
      "title": "AI Project Portfolio Dashboard",
      "frequency": "Weekly",
      "targetRole": "Engineering Leadership & Management",
      "description": "Cross-initiative status, stage distribution, budget consumption, and blocker tracker for managing multiple AI teams.",
      "templateMarkdown": "# AI Engineering Project Portfolio Dashboard\n\n**Review Date:** [YYYY-MM-DD]\n**Engineering Manager:** [Name]\n**Portfolio Headcount:** [X Engineers / Y Squads]\n**Total Monthly Spend:** ₹[X.XL] ($[X,XXX]) / Budget: ₹[XX.XL] ($[XX,XXX]) (XX% burned)\n\n---\n\n## 1. Portfolio Stage Distribution\n| Phase | Projects Active | Health (Green / Amber / Red) | Key Blockers |\n| :--- | :--- | :--- | :--- |\n| 1-3. Discovery & Feasibility | [Project Name] | [Status] | [Data access / Feasibility issue] |\n| 4-5. Architecture & PoC | [Project Name] | [Status] | [Model selection / ARB sign-off] |\n| 6-7. MVP & Production Gate | [Project Name] | [Status] | [Eval regression / Quotas / Security] |\n| 8. Launch & Canary | [Project Name] | [Status] | [Canary latency / Fallback rate] |\n| 9-11. Operations & Scale | [Project Name] | [Status] | [GPU capacity / Unit economics] |\n| 12. Sunset & Retire | [Project Name] | [Status] | [Resource teardown / Retention] |\n\n## 2. Critical Management Attention Items\n1. **[Project Alpha]:** [Issue description, impact, required EM decision, owner, due date].\n2. **[Project Beta]:** [Issue description, impact, required EM decision, owner, due date].\n\n## 3. Financial Variance (Actual vs Forecast)\n- **Under-budget projects:** [Project Name (-15% due to prompt caching)]\n- **Over-budget projects:** [Project Name (+22% due to runaway agent tool retries)]\n"
    },
    {
      "id": "proj-status-report",
      "title": "AI Project Status Report",
      "frequency": "Weekly",
      "targetRole": "Product Managers & Engineering Squads",
      "description": "Weekly tactical report tracking sprint deliverables, evaluation scores, blocker resolutions, and launch milestones.",
      "templateMarkdown": "# AI Project Status Report: [Project Name]\n\n**Week Ending:** [YYYY-MM-DD]\n**Engineering Owner:** [Name] · **Tech Lead:** [Name] · **Product Manager:** [Name]\n**Current Stage:** [e.g. Stage 7: Production Readiness]\n**Overall Delivery Health:** [GREEN / AMBER / RED]\n\n---\n\n## 1. Executive Summary\n[2-3 sentences summarizing progress this week, major technical hurdles cleared, and release timeline status].\n\n## 2. Key Engineering Accomplishments This Week\n- [Shipped feature / tool integration / prompt version]\n- [Completed evaluation benchmark: Faithfulness score improved from XX% to YY%]\n- [Infra: Deployed AWS Bedrock Guardrails and KMS CMK key policies]\n\n## 3. Quality & Evaluation Scorecard\n| Metric | Baseline | Target | This Week | Trend |\n| :--- | :--- | :--- | :--- | :--- |\n| Task Accuracy / Completion | [XX%] | [>= 95%] | [YY%] | [Up/Down] |\n| Groundedness (Faithfulness) | [XX%] | [>= 95%] | [YY%] | [Up/Down] |\n| P95 Latency (TTFT) | [X.Xs] | [< 2.5s] | [X.Xs] | [Up/Down] |\n| Cost per Task | [$X.XX] | [<$X.XX] | [$X.XX] | [Up/Down] |\n\n## 4. RAID Items (Risks, Assumptions, Issues, Dependencies)\n- **Issue:** [Description, assigned owner, target resolution date].\n- **Dependency:** [External squad dependency e.g. InfoSec sign-off].\n\n## 5. Next Week Commitments\n1. [Deliverable 1]\n2. [Deliverable 2]\n"
    },
    {
      "id": "exec-portfolio-report",
      "title": "Executive AI Portfolio Report",
      "frequency": "Monthly",
      "targetRole": "VP Engineering, C-Suite, & Board",
      "description": "Strategic executive summary showing realized business value, ROI, risk posture, and talent capacity across all AI initiatives.",
      "templateMarkdown": "# Executive AI Portfolio Report: Enterprise AI Systems\n\n**Reporting Month:** [Month, YYYY]\n**Author:** [Sadiq Pasha, AI Engineering Manager]\n**Sponsor:** [VP Engineering / CTO]\n\n---\n\n## 1. Strategic Highlights & Realized Business Value\n- **Labor Hours Saved:** [X,XXX hours across customer operations and legal review].\n- **Direct Cost Savings:** ₹[XX.XL] ($[XX,XXX]) annualized savings from legacy vendor contract retirement.\n- **User Adoption:** [XX,XXX monthly active users across internal and customer AI systems].\n- **Average Satisfaction (CSAT):** [X.X / 5.0] (+X.X improvement over manual baseline).\n\n## 2. Portfolio Health Snapshot\n- **Total Projects:** [12] (8 Green, 3 Amber, 1 Red)\n- **Systems in Production:** [7 active production workloads]\n- **Total Cloud Spend:** ₹[X.XL] ($[XX,XXX]) vs Budget ₹[XX.XL] (XX% variance)\n\n## 3. High-Priority Strategic Decisions Required\n1. **[Decision 1: e.g. Multi-year AWS Bedrock Provisioned Throughput commitment vs On-Demand].**\n2. **[Decision 2: e.g. Expansion of AI Customer Care Copilot to European Subsidiary].**\n\n## 4. Organizational Talent & Hiring Status\n- **Current AI Headcount:** [XX AI Engineers / MLOps Specialists].\n- **Open Requisitions:** [X Senior AI Platform Engineers, Y Senior Prompt/Eval Engineers].\n- **Key Training Milestone:** [XX engineers certified in AWS Generative AI and Bedrock Agents].\n"
    },
    {
      "id": "proj-health-assessment",
      "title": "AI Project Health Assessment",
      "frequency": "Weekly",
      "targetRole": "Engineering Managers & Principal Engineers",
      "description": "Comprehensive health diagnostic assessing technical feasibility, evaluation benchmarks, budget burn, and delivery momentum.",
      "templateMarkdown": "# AI Project Health Diagnostic: [Project Name]\n\n**Assessment Date:** [YYYY-MM-DD] · **Assessor:** [Name, Engineering Manager]\n**Overall Diagnostic Rating:** [HEALTHY (Score 80-100) / AT RISK (60-79) / CRITICAL (<60)]\n\n---\n\n## Health Scoring (Score 1-5 per dimension)\n| Dimension | Score (1-5) | Evidence / Observations |\n| :--- | :--- | :--- |\n| **1. Business Value & Sponsor Engagement** | [ ] | [Active sponsor, validated problem, clear ROI] |\n| **2. Technical Feasibility & Model Accuracy** | [ ] | [Golden eval dataset exists; accuracy meets target] |\n| **3. Architecture & Security Posture** | [ ] | [VPC isolated, IAM scoped, threat model approved] |\n| **4. Team Capacity & Sprint Velocity** | [ ] | [Staffed with right senior skills, velocity steady] |\n| **5. Cloud Budget & FinOps Control** | [ ] | [Token spend predictable, prompt caching enabled] |\n| **6. Production Readiness & SRE** | [ ] | [Runbooks ready, SLOs defined, kill switch tested] |\n| **Total Composite Score (Max 30):** | [ / 30] | **Rating: [Healthy / At Risk / Critical]** |\n\n## Critical Remediation Actions\n- **Action 1:** [Owner, Due Date, Required Outcome]\n- **Action 2:** [Owner, Due Date, Required Outcome]\n"
    },
    {
      "id": "arch-review-doc",
      "title": "AI Architecture Review Document",
      "frequency": "Per Review",
      "targetRole": "Architecture Review Board (ARB)",
      "description": "12-dimension architecture review document evaluating complexity, data quality, security, resilience, and unit economics.",
      "templateMarkdown": "# AI Architecture Review Document (ARB Submission)\n\n**System Name:** [System Name]\n**Architect / Tech Lead:** [Name] · **Engineering Manager:** [Name]\n**Review Date:** [YYYY-MM-DD] · **Target Production Date:** [YYYY-MM-DD]\n\n---\n\n## 1. System Overview & Architecture Diagram\n- **User Intent & Entry Point:** [API Gateway / CloudFront / EventBridge]\n- **Model Strategy:** [Bedrock Claude 3.7 Sonnet / Nova Lite / SageMaker]\n- **Retrieval Engine:** [Bedrock Knowledge Bases / OpenSearch Serverless / Aurora pgvector]\n- **Orchestration:** [Bedrock Agents / AWS Step Functions / Lambda]\n\n## 2. Twelve Dimension Evaluation\n1. **Business Problem:** [Why is AI required? What is the manual baseline?]\n2. **Architecture Fit:** [Managed vs custom trade-offs; blast radius of failure]\n3. **Data Quality & Lineage:** [Source S3 buckets, parsing, chunking, PII redaction]\n4. **Model Selection:** [Why this model over cheaper alternatives? Caching enabled?]\n5. **RAG & Retrieval:** [Recall@5 target, hybrid search, cross-encoder reranking]\n6. **Agent Autonomy:** [Autonomy level (L1-L4), max step limit, tool permissions]\n7. **Security & Identity:** [IAM execution roles, PrivateLink endpoints, KMS keys, Guardrails]\n8. **Privacy & Compliance:** [GDPR/DPDP retention, zero-data-retention guarantee]\n9. **Resilience & DR:** [Cross-region inference profiles, exponential backoff, circuit breakers]\n10. **Performance & Latency:** [P95 TTFT target, streaming SSE, load test results]\n11. **FinOps & Unit Economics:** [Cost per task ceiling, monthly budget, tagging]\n12. **Operations & SRE:** [10-widget CloudWatch dashboard, on-call runbook, kill switch]\n\n## 3. ARB Decision\n**Outcome:** [APPROVED / APPROVED WITH CONDITIONS / REJECTED]\n**Approved Exceptions:** [List any temporary deviations with sunset dates]\n**Assigned Action Items:** [Owner, action item, due date]\n"
    },
    {
      "id": "adr-template",
      "title": "Architecture Decision Record (ADR)",
      "frequency": "Per Decision",
      "targetRole": "Principal Engineers & Architects",
      "description": "Standardized ADR recording problem context, evaluated options, decision matrix, trade-offs, and revisit triggers.",
      "templateMarkdown": "# ADR-[XXX]: [Title of Decision]\n\n**Status:** [Proposed | Approved | Deprecated | Superseded by ADR-YYY]\n**Deciders:** [Engineering Manager, Principal Architect, Tech Lead]\n**Date:** [YYYY-MM-DD]\n**Type of Decision:** [One-Way Door (Type 1) | Two-Way Door (Type 2)]\n\n---\n\n## 1. Context & Problem Statement\n[What technical or business problem are we solving? What constraints (latency, budget, compliance, team skills) exist?]\n\n## 2. Considered Alternatives\n1. **Option 1 (Recommended):** [Description, AWS services involved]\n2. **Option 2:** [Description, AWS services involved]\n3. **Option 3:** [Description, AWS services involved]\n\n## 3. Decision Matrix\n| Evaluation Criteria | Weight | Option 1 | Option 2 | Option 3 |\n| :--- | :--- | :--- | :--- | :--- |\n| Latency & TTFT | [20%] | [Score 1-5] | [Score 1-5] | [Score 1-5] |\n| Unit Cost & FinOps | [25%] | [Score 1-5] | [Score 1-5] | [Score 1-5] |\n| Operational Overhead | [25%] | [Score 1-5] | [Score 1-5] | [Score 1-5] |\n| Security & Compliance | [20%] | [Score 1-5] | [Score 1-5] | [Score 1-5] |\n| Time to Production | [10%] | [Score 1-5] | [Score 1-5] | [Score 1-5] |\n| **Weighted Score:** | **100%** | **[X.X]** | **[Y.Y]** | **[Z.Z]** |\n\n## 4. Decision Outcome & Justification\n**Selected Option:** [Option X].\n**Justification:** [Why this option was chosen over alternatives].\n**Why Alternatives Were Rejected:** [Explicit reasons for rejecting other options].\n\n## 5. Consequences & Trade-offs\n- **Positive Impact:** [What improves?]\n- **Negative Impact / Operational Burden:** [What trade-offs do we accept?]\n\n## 6. Review / Revisit Triggers\n[Under what conditions should this decision be reopened? e.g. Query volume exceeds 500k/mo, new Bedrock model pricing drop > 40%].\n"
    },
    {
      "id": "usecase-prioritization",
      "title": "AI Use-Case Prioritization Worksheet",
      "frequency": "Quarterly / Intake",
      "targetRole": "Engineering Managers & Product Leadership",
      "description": "Multi-dimensional weighted scoring model to classify incoming AI requests into Quick Wins, Strategic Bets, or Defer.",
      "templateMarkdown": "# AI Use-Case Prioritization & Intake Worksheet\n\n**Evaluation Date:** [YYYY-MM-DD] · **Evaluated By:** [Product & Engineering Committee]\n\n---\n\n## Weighted Scoring Criteria\n- **Business Value (25%):** Quantified ROI, revenue impact, labor hours saved.\n- **Technical Feasibility (20%):** Model capability exists off-the-shelf; low reasoning ambiguity.\n- **Data Readiness (15%):** Governed, permissioned, clean data exists in S3.\n- **Risk & Safety (15%):** Low regulatory, legal, or hallucination blast radius.\n- **FinOps & Cost (10%):** Unit economics positive; fits within cloud budget.\n- **Strategic Alignment (10%):** Aligned with primary corporate executive OKRs.\n- **Time to Value (5%):** PoC deliverable in < 3 weeks; MVP in < 6 weeks.\n\n## Intake Evaluation Table\n| Candidate Initiative | Value (25%) | Feas (20%) | Data (15%) | Risk (15%) | Cost (10%) | Strat (10%) | Time (5%) | Total Score | Quadrant |\n| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |\n| [Initiative A] | [8/10] | [9/10] | [8/10] | [9/10] | [8/10] | [9/10] | [9/10] | **[8.5]** | Quick Win (Build First) |\n| [Initiative B] | [9/10] | [6/10] | [5/10] | [5/10] | [6/10] | [9/10] | [5/10] | **[6.5]** | Strategic Bet (PoC Stage) |\n| [Initiative C] | [4/10] | [4/10] | [4/10] | [6/10] | [5/10] | [4/10] | [4/10] | **[4.3]** | Defer / Reject |\n\n## Classification Quadrants\n- **Quick Wins (High Value, High Feasibility):** Fund and staff immediately in next sprint.\n- **Strategic Bets (High Value, Lower Feasibility):** Timebox 2-week feasibility spike.\n- **Foundation Investments:** Platform infrastructure enabling future use cases.\n- **Defer / Reject:** Low value or excessive risk; communicate clear rationale to sponsor.\n"
    },
    {
      "id": "project-estimation",
      "title": "AI Project Estimation Worksheet",
      "frequency": "Per Project",
      "targetRole": "Engineering Managers & Tech Leads",
      "description": "4-phase estimation framework accounting for prompt engineering, data curation, evaluation runs, and SRE hardening.",
      "templateMarkdown": "# AI Project Estimation Worksheet (4-Phase Model)\n\n**Project Name:** [Project Name] · **Author:** [Engineering Manager]\n\n---\n\n## Phase 1: Data Preparation & Ingestion (Weeks 1 - 2)\n| Task | Assigned Role | Estimated Days | Key AWS Primitives |\n| :--- | :--- | :--- | :--- |\n| Source Document Extraction & OCR | Data Engineer | [X days] | [[textract]], [[s3]] |\n| Chunking & Metadata Pipeline | Data Engineer | [X days] | [[lambda]], [[glue]] |\n| Vector Embedding Ingestion | AI Engineer | [X days] | [[bedrock-kb]], [[opensearch]] |\n| ACL Security Mapping | Platform Engineer | [X days] | [[iam]], [[cognito]] |\n| **Phase 1 Subtotal:** | | **[XX days]** | |\n\n## Phase 2: Core Engineering & RAG/Agent Build (Weeks 3 - 4)\n| Task | Assigned Role | Estimated Days | Key AWS Primitives |\n| :--- | :--- | :--- | :--- |\n| Prompt Template Engineering & Caching | AI Engineer | [X days] | [[bedrock]], [[nova]] |\n| Tool Definition & Schema Validation | Full-Stack Eng | [X days] | [[lambda]], [[apigw]] |\n| Agent Loop & Memory Checkpointing | AI Architect | [X days] | [[bedrock-agents]], [[dynamodb]] |\n| Step Functions Human Approval Gate | Backend Eng | [X days] | [[stepfunctions]], [[sns]] |\n| **Phase 2 Subtotal:** | | **[XX days]** | |\n\n## Phase 3: Evaluation, Safety & Quality Gates (Week 5)\n| Task | Assigned Role | Estimated Days | Key AWS Primitives |\n| :--- | :--- | :--- | :--- |\n| Golden Test Dataset Curation (200 cases)| AI Lead + SME | [X days] | S3 JSONL, SME Review |\n| Automated Eval Pipeline Build | MLOps Engineer | [X days] | [[sm-monitor]], Bedrock Eval |\n| Red-Teaming & Injection Penetration | Security Eng | [X days] | [[bedrock-guardrails]] |\n| Performance & Concurrency Load Test | SRE Engineer | [X days] | Locust, CloudWatch |\n| **Phase 3 Subtotal:** | | **[XX days]** | |\n\n## Phase 4: Production Hardening, CI/CD & Launch (Week 6)\n| Task | Assigned Role | Estimated Days | Key AWS Primitives |\n| :--- | :--- | :--- | :--- |\n| Infrastructure as Code (CDK / Terraform)| DevOps Engineer| [X days] | [[cdk]], CloudFormation |\n| 10-Widget Operations Dashboard & Alarms| SRE Engineer | [X days] | [[cloudwatch]], X-Ray |\n| SRE Runbooks & Kill Switch Drill | EM + SRE | [X days] | AppConfig, SSM |\n| Canary Deployment & Pilot Rollout | Squad Lead | [X days] | API GW Canary, Route 53 |\n| **Phase 4 Subtotal:** | | **[XX days]** | |\n\n**Total Estimated Engineering Effort:** [XX Person-Days] (~X Weeks Calendar Time).\n"
    },
    {
      "id": "delivery-plan",
      "title": "AI Delivery Plan & Milestone Tracker",
      "frequency": "Per Project",
      "targetRole": "Engineering Managers & Delivery Leads",
      "description": "Milestone-driven delivery roadmap outlining sprint commitments, phase gate transitions, and dependency critical paths.",
      "templateMarkdown": "# AI Delivery Plan & Milestone Tracker: [Project Name]\n\n**Target Production Launch:** [YYYY-MM-DD] · **Current Sprint:** [Sprint X]\n\n---\n\n## Milestone Roadmap\n| Milestone | Target Date | Status | Phase Gate Exit Criteria |\n| :--- | :--- | :--- | :--- |\n| **M1: Feasibility & Baseline** | [YYYY-MM-DD] | [Done] | Golden dataset created; zero-shot accuracy > 75% |\n| **M2: Architecture Review Sign-off** | [YYYY-MM-DD] | [Done] | ARB score >= 80%; ADRs approved; threat model signed |\n| **M3: MVP Feature Complete** | [YYYY-MM-DD] | [In Progress] | All tools integrated; agent memory persisted to DynamoDB |\n| **M4: Production Quality Gate Pass** | [YYYY-MM-DD] | [Pending] | Groundedness >= 95%; Injection test 100% pass; TTFT < 2.5s |\n| **M5: 25% Canary Launch** | [YYYY-MM-DD] | [Pending] | Canary traffic live; zero rollback alarms for 48 hours |\n| **M6: 100% General Availability** | [YYYY-MM-DD] | [Pending] | All users cutover; legacy systems decommissioned |\n\n## Dependency Critical Path\n- **Dep 1 (Week 2):** Customer data lake access permissions approved by InfoSec.\n- **Dep 2 (Week 4):** AWS Bedrock quota increase ticket processed by AWS Enterprise Support.\n- **Dep 3 (Week 5):** Identity Center OAuth2 claims mapping completed by Core IAM team.\n"
    },
    {
      "id": "team-capacity-plan",
      "title": "AI Team Capacity & Sprint Planning Sheet",
      "frequency": "Sprint / Quarterly",
      "targetRole": "Engineering Managers",
      "description": "Sprint capacity model adjusting available engineering hours for prompt tuning toil, evaluation runs, and on-call load.",
      "templateMarkdown": "# AI Team Sprint Capacity & Allocation Plan\n\n**Sprint Number:** [Sprint XX] · **Sprint Duration:** [2 Weeks: YYYY-MM-DD to YYYY-MM-DD]\n**Total Team Headcount:** [X Engineers] · **Gross Available Hours:** [XXX Hours]\n\n---\n\n## Deductions & Non-Project Overhead\n- **On-Call & SRE Support:** [XX Hours] (1 Engineer dedicated on primary rotation)\n- **AI Evaluation & Prompt Maintenance Toil:** [XX Hours] (Dataset curation, eval debugging)\n- **Architecture Reviews & Cross-Team Sync:** [XX Hours]\n- **PTO / Public Holidays:** [XX Hours]\n- **Net Focus Capacity for Sprint Deliverables:** **[XXX Hours]** (XX% focus factor)\n\n## Squad Allocation Breakdown\n| Engineer | Role | Net Hours | Primary Feature / Deliverable | Tech Debt / Bug Allocation |\n| :--- | :--- | :--- | :--- | :--- |\n| [Name] | Senior AI Engineer | [65h] | [Agent memory & tool integration] | [10h: Prompt caching config] |\n| [Name] | Data Engineer | [70h] | [Document OCR & chunking pipeline] | [10h: Vector index re-indexing] |\n| [Name] | MLOps / Platform Eng | [60h] | [CI/CD automated eval gate] | [15h: CloudWatch dashboard tuning]|\n| [Name] | Full-Stack Developer | [70h] | [SSE streaming UI resolver] | [5h: Error boundary handling] |\n"
    },
    {
      "id": "skills-gap-assessment",
      "title": "AI Skills Gap & Hiring Assessment",
      "frequency": "Quarterly",
      "targetRole": "Engineering Managers & Directors",
      "description": "Quarterly workforce assessment identifying competency gaps across AI frameworks, AWS architecture, MLOps, and security.",
      "templateMarkdown": "# Quarterly AI Engineering Skills Gap Assessment\n\n**Quarter:** [QX YYYY] · **Assessor:** [Engineering Manager]\n**Squads Covered:** [Customer AI, Platform AI, Risk AI]\n\n---\n\n## Competency Gap Analysis (Scale 1-4: Basic, Proficient, Advanced, Expert)\n| Domain Area | Target Team Level | Current Average | Identified Gap | Action Plan (Train / Hire) |\n| :--- | :---: | :---: | :--- | :--- |\n| **AWS Bedrock & Silicon** | 3.5 | 2.8 | Trainium/Inferentia optimization | Send 3 engineers to AWS Deep Learning Immersion Day |\n| **Agentic Frameworks** | 3.5 | 2.2 | Multi-agent coordination, LangGraph | Dedicated internal hackathon on Bedrock Agents |\n| **RAG & Search Engineering** | 3.8 | 3.2 | Cross-encoder reranking, BM25 tuning | Tech Lead knowledge share session; standardization |\n| **GenAIOps & Evaluation** | 3.5 | 2.0 | Automated CI/CD LLM-as-a-judge | Hire Senior MLOps Engineer (Req #4029) |\n| **AI Security & Guardrails** | 3.2 | 2.5 | Prompt injection penetration testing | InfoSec joint threat modeling workshop |\n\n## Hiring Requisitions Status\n1. **Req #4029 - Senior MLOps / GenAIOps Engineer:** [Screening candidates / Offer stage]\n2. **Req #4034 - Staff AI Architect (Agentic Systems):** [Sourcing candidates]\n"
    },
    {
      "id": "risk-register",
      "title": "AI Risk Register & Exposure Matrix",
      "frequency": "Continuous",
      "targetRole": "EMs, Tech Leads, & Risk Officers",
      "description": "Standardized risk log scoring Likelihood (1-4) × Impact (1-4) = Exposure (1-16) with mitigation owners and contingency plans.",
      "templateMarkdown": "# AI Project Risk Register\n\n**Last Reviewed:** [YYYY-MM-DD] · **Risk Custodian:** [Engineering Manager]\n\n---\n\n## Standard Risk Scoring\n- **Likelihood (1-4):** 1 (Unlikely) · 2 (Possible) · 3 (Likely) · 4 (Almost Certain)\n- **Impact (1-4):** 1 (Negligible) · 2 (Moderate) · 3 (Major) · 4 (Critical)\n- **Exposure Score:** Likelihood × Impact (1-3 Low · 4-7 Medium · 8-11 High · 12-16 Critical)\n\n## Active Risk Register Table\n| Risk ID | Risk Description | L | I | Score | Rating | Mitigation Strategy | Owner | Status |\n| :--- | :--- | :---: | :---: | :---: | :--- | :--- | :--- | :--- |\n| **R-01** | Bedrock quota exhaustion during month-end traffic surge | 3 | 3 | **9** | HIGH | Request 2x quota increase; configure Cross-Region Inference fallback | SRE Lead | Open |\n| **R-02** | Agent enters circular loop during third-party tool API outage | 4 | 3 | **12** | CRITICAL | Enforce 10-step hard limit and circuit breaker in Step Functions | Tech Lead | Remediated |\n| **R-03** | RAG retrieves stale policy documents post-merger | 3 | 2 | **6** | MEDIUM | Deploy event-driven S3 tombstone re-indexing pipeline | Data Eng | In Progress |\n| **R-04** | Prompt injection exfiltrates proprietary system instructions | 2 | 4 | **8** | HIGH | Implement Bedrock Guardrails with custom injection regex | Security Eng | Remediated |\n| **R-05** | Monthly token burn exceeds budget ceiling by > 25% | 2 | 3 | **6** | MEDIUM | Activate prompt caching and dynamic small-model routing | FinOps Lead | Open |\n"
    },
    {
      "id": "tech-debt-register",
      "title": "AI Technical Debt Register",
      "frequency": "Monthly",
      "targetRole": "Principal Engineers & Squad Leads",
      "description": "Catalog of prompt debt, evaluation debt, embedding debt, and architectural shortcuts with scheduled remediation sprints.",
      "templateMarkdown": "# AI Technical Debt Register & Remediation Tracker\n\n**Review Month:** [Month, YYYY] · **Lead Architect:** [Name]\n\n---\n\n## Technical Debt Inventory\n| ID | Debt Category | Location / Asset | Severity | Impact on Velocity / Cost | Remediation Action | Target Sprint |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n| **TD-01** | Prompt Debt | Customer Care Agent | High | Hardcoded prompts in Lambda; no versioning | Migrate to S3 versioned prompts + Bedrock Prompt Mgmt | Sprint 24 |\n| **TD-02** | Evaluation Debt | Legal Doc Extractor | Critical | Relying on manual testing; regressions slip to staging | Build 200-test golden dataset and CI/CD runner | Sprint 23 |\n| **TD-03** | Embedding Debt | Enterprise Search | High | Obsolete Titan v1 vectors; missing new dimensions | Re-index into Titan Text v2 with 512 dimensions | Sprint 25 |\n| **TD-04** | Tool Auth Debt | Claims Adjudication | Critical | Agent Lambda execution role has broad S3/DB access | Enforce scoped STS session policies per user | Sprint 23 |\n| **TD-05** | FinOps Debt | Internal HR Assistant| Medium | Full prompt resent on every turn; zero caching | Refactor system prompt for Bedrock Prompt Caching | Sprint 24 |\n\n## Dedicated Debt Budget\n- **Team Agreement:** 15% of sprint engineering capacity permanently reserved for tech debt remediation.\n"
    },
    {
      "id": "prod-readiness-report",
      "title": "AI Production Readiness Report",
      "frequency": "Per Release",
      "targetRole": "Engineering Managers & Release Managers",
      "description": "Formal release sign-off verifying workload-specific gates (RAG, Agent, ML, or API) before production traffic cutover.",
      "templateMarkdown": "# AI Production Readiness Report & Release Sign-Off\n\n**Release Version:** [vX.Y.Z] · **Target Date:** [YYYY-MM-DD]\n**Workload Type:** [RAG Assistant | Agentic Workflow | Custom ML Model | AI API Gateway]\n**Engineering Manager:** [Name] · **Lead Architect:** [Name] · **InfoSec Lead:** [Name]\n\n---\n\n## Workload-Specific Gate Verification\n### Workload Gates (Passed: [XX / XX])\n- [x] **Gate 1: Golden Dataset Validation** - Score: 96.2% (Threshold: >= 95.0%)\n- [x] **Gate 2: Zero Regression Check** - Delta vs v1.2: +1.4% improvement\n- [x] **Gate 3: Security & Injection Defense** - 100% blocked on 50 adversarial attacks\n- [x] **Gate 4: Tool Permission Boundaries** - Scoped STS session policies verified\n- [x] **Gate 5: Autonomy Step & Token Ceilings** - Hard limit: 10 steps / 50k tokens verified\n- [x] **Gate 6: Human-in-the-Loop Callback** - Verified for actions > threshold\n- [x] **Gate 7: Concurrency & Latency Load Test** - P95 TTFT 1.8s under 2x load\n- [x] **Gate 8: AWS Service Quotas** - Regional limits verified in production account\n- [x] **Gate 9: FinOps Unit Cost Ceiling** - Projected cost: $0.012 / task (Ceiling: $0.020)\n- [x] **Gate 10: SRE Runbooks & Kill Switch** - Kill switch test verified in Staging (< 30s revert)\n\n## Final Sign-Off Signatures\n- **Engineering Manager:** [Approved: Sadiq Pasha - YYYY-MM-DD]\n- **Principal AI Architect:** [Approved: Elena Rostova - YYYY-MM-DD]\n- **InfoSec Lead:** [Approved: Security Lead - YYYY-MM-DD]\n- **Product Owner:** [Approved: Product Manager - YYYY-MM-DD]\n"
    },
    {
      "id": "model-comparison-report",
      "title": "AI Model Benchmark & Comparison Report",
      "frequency": "Per Evaluation",
      "targetRole": "AI Tech Leads & Principal Architects",
      "description": "Rigorous head-to-head empirical comparison of candidate models on accuracy, latency, token costs, and safety.",
      "templateMarkdown": "# AI Model Benchmark & Comparison Report\n\n**Evaluation Goal:** [e.g. Evaluate Claude 3.7 Sonnet vs Amazon Nova Pro vs Llama 3.3 70B for Coding Copilot]\n**Dataset Used:** [Internal 500-test golden programming dataset]\n**Author:** [Lead AI Engineer]\n\n---\n\n## Head-to-Head Performance Matrix\n| Model Candidate | Task Accuracy | P50 TTFT | P95 TTFT | Cost / 1k Tasks | Structured Output % | Recommendation |\n| :--- | :---: | :---: | :---: | :---: | :---: | :--- |\n| **Claude 3.7 Sonnet** | **94.2%** | 1.2s | 2.6s | $18.40 | **99.6%** | **Recommended (Flagship)** |\n| **Amazon Nova Pro** | 88.6% | 0.9s | 2.1s | $4.80 | 97.2% | Strong Cost-Performance Alternative |\n| **Meta Llama 3.3 70B** | 85.1% | 1.1s | 2.4s | $3.60 | 94.0% | Viable for Batch Processing |\n| **Claude 3.5 Haiku** | 78.4% | 0.35s | 0.75s | $1.20 | 98.8% | Best for Intent Triage |\n\n## Trade-Off Analysis\n- **Quality Winner:** Claude 3.7 Sonnet (+5.6% accuracy advantage on edge cases).\n- **Cost Winner:** Amazon Nova Pro (74% cheaper than Sonnet at comparable latency).\n- **Recommendation:** Implement dynamic routing: route 80% routine syntax questions to Nova Pro; escalate complex multi-file architectural refactoring to Claude 3.7 Sonnet.\n"
    },
    {
      "id": "rag-eval-report",
      "title": "RAG Evaluation & Groundedness Report",
      "frequency": "Per Release",
      "targetRole": "AI Quality Engineers & Tech Leads",
      "description": "Comprehensive retrieval and generation evaluation measuring Recall@K, NDCG, Context Precision, and Faithfulness.",
      "templateMarkdown": "# Production RAG Evaluation & Groundedness Report\n\n**RAG Pipeline Version:** [v2.4] · **Knowledge Base ID:** [AWS Bedrock KB-10492]\n**Embedding Model:** [Amazon Titan Embeddings v2 (512d)] · **Vector Index:** [OpenSearch Serverless]\n\n---\n\n## 1. Retrieval Quality Metrics\n| Metric | Baseline (v2.3) | Current (v2.4) | Target | Status |\n| :--- | :---: | :---: | :---: | :---: |\n| **Recall@5** | 0.81 | **0.88** | >= 0.85 | PASSED |\n| **Precision@5** | 0.64 | **0.72** | >= 0.70 | PASSED |\n| **MRR (Mean Reciprocal Rank)** | 0.73 | **0.81** | >= 0.75 | PASSED |\n| **NDCG@5** | 0.77 | **0.84** | >= 0.80 | PASSED |\n\n## 2. Generation & Groundedness Metrics\n| Metric | Baseline (v2.3) | Current (v2.4) | Target | Status |\n| :--- | :---: | :---: | :---: | :---: |\n| **Groundedness (Faithfulness)**| 92.4% | **96.8%** | >= 95.0% | PASSED |\n| **Answer Relevance** | 89.1% | **94.2%** | >= 90.0% | PASSED |\n| **Citation Accuracy** | 94.0% | **98.6%** | >= 98.0% | PASSED |\n| **Context Recall** | 86.5% | **91.4%** | >= 90.0% | PASSED |\n\n## 3. Key Findings & Chunking Optimization\n- Adding **Cohere Rerank v3.5** improved Groundedness by +4.4% by eliminating irrelevant top-5 vector noise.\n- Semantic chunking (512 tokens with 64-token overlap) reduced incomplete sentence clipping.\n"
    },
    {
      "id": "agent-risk-assessment",
      "title": "Agent Risk Assessment & Autonomy Scorecard",
      "frequency": "Per Deployment",
      "targetRole": "Engineering Managers & InfoSec Leads",
      "description": "Autonomy ladder classification (L0-L4), tool permissions audit, circuit breaker verification, and kill switch readiness.",
      "templateMarkdown": "# Agent Risk Assessment & Autonomy Scorecard\n\n**Agent Name:** [Autonomous Insurance Claims Agent] · **Target Environment:** [Production]\n**Lead Developer:** [Name] · **Security Reviewer:** [Name]\n\n---\n\n## 1. Autonomy Classification\n- **Target Autonomy Level:** [LEVEL 2: Bounded Execution with Human Verification]\n- **Permitted Autonomous Actions:** [Read policy DB, extract invoice text, score fraud probability, draft payment voucher].\n- **Prohibited Autonomous Actions:** [Execute payment wire transfer, cancel policy, email claimant directly without approval].\n\n## 2. Tool Risk & Permission Matrix\n| Tool Name | Action Type | Blast Radius | IAM Permission | Human Approval Gate Required? |\n| :--- | :--- | :--- | :--- | :--- |\n| `query_policy_db` | Read | Low | DynamoDB:GetItem | No (Automated) |\n| `verify_claim_docs` | Read / Compute| Low | Bedrock:InvokeModel | No (Automated) |\n| `calculate_payout` | Logic | Low | Pure Math Lambda | No (Automated) |\n| `approve_claim_payout`| Write / Financial| CRITICAL | PaymentGateway:Execute | **YES (Step Functions Task Token)** |\n| `send_claimant_email`| External Comms| High | SES:SendEmail | **YES (Supervisor Approval)** |\n\n## 3. Circuit Breaker & Safety Safeguards\n- **Maximum Step Limit:** 10 steps (Hard termination enforced in orchestrator).\n- **Maximum Token Budget:** 50,000 tokens per execution.\n- **Loop Breaker:** Detects identical tool calls and exits with error after 3 duplicates.\n- **Emergency Kill Switch:** Tested in Staging; feature flag disables agent in < 30 seconds.\n"
    },
    {
      "id": "finops-report",
      "title": "AI FinOps & Unit Economics Monthly Report",
      "frequency": "Monthly",
      "targetRole": "Engineering Managers & Finance Business Partners",
      "description": "Monthly financial breakdown across model tokens, vector storage, compute, and unit cost per completed user outcome.",
      "templateMarkdown": "# AI FinOps & Unit Economics Monthly Report\n\n**Billing Period:** [Month, YYYY] · **FinOps Lead:** [Name, Engineering Manager]\n\n---\n\n## 1. Executive Cost Summary\n- **Total Monthly AI Cloud Spend:** ₹[8,42,000] ($[10,140])\n- **Approved Budget Ceiling:** ₹[10,00,000] ($[12,050])\n- **Budget Consumption:** [84.2%] (Under Budget by ₹1.58L / $1,910)\n\n## 2. Spend Breakdown by AWS Service Category\n| Service / Category | Monthly Spend (₹) | Monthly Spend ($) | % of Total | MoM Trend |\n| :--- | :---: | :---: | :---: | :---: |\n| **Bedrock Foundation Models** | ₹4,20,000 | $5,060 | 49.9% | -12% (Prompt caching effect) |\n| **OpenSearch Vector Database** | ₹1,65,000 | $1,990 | 19.6% | Flat |\n| **EC2 / EKS Compute (Inference)**| ₹1,25,000 | $1,505 | 14.8% | -8% (Spot instance savings) |\n| **Lambda, Step Functions & API GW**| ₹48,000 | $580 | 5.7% | +4% (Volume growth) |\n| **S3 Storage & Data Ingestion** | ₹38,000 | $460 | 4.5% | Flat |\n| **CloudWatch & Telemetry** | ₹46,000 | $545 | 5.5% | -15% (Log sampling tuned) |\n\n## 3. Core Unit Economics (Manager KPIs)\n- **Cost Per Completed AI Task:** ₹1.82 ($0.0219) (Target: < ₹2.50)\n- **Cost Per Successful Outcome:** ₹1.94 ($0.0234) (Target: < ₹3.00)\n- **Prompt Caching Savings Realized:** ₹1,45,000 ($1,750) saved this month.\n\n## 4. Next Month Optimization Pipeline\n1. Enable small-model-first routing for HR Assistant (projected savings: ₹35,000/mo).\n2. Downsize idle OpenSearch non-prod standby clusters to 0.5 OCU.\n"
    },
    {
      "id": "incident-postmortem",
      "title": "AI Incident Postmortem (5-Whys)",
      "frequency": "Per Incident",
      "targetRole": "SREs, Tech Leads, & Engineering Managers",
      "description": "Blameless SRE postmortem analyzing root cause, prompt/model anomalies, 5-whys timeline, and preventative action items.",
      "templateMarkdown": "# Blameless AI Incident Postmortem: [INC-YYYY-MM-DD]\n\n**Incident Severity:** [SEV-1 / SEV-2] · **Incident Commander:** [Name]\n**Date of Incident:** [YYYY-MM-DD] · **Duration:** [XX Minutes]\n**Services Impacted:** [AWS Bedrock / API Gateway / OpenSearch]\n\n---\n\n## 1. Executive Summary & Customer Impact\n- **User Symptom:** [e.g. 15% of customer chat queries returned HTTP 504 Gateway Timeout or generic apology].\n- **Impact Window:** [14:15 UTC to 14:57 UTC (42 minutes)].\n- **Impacted Requests:** [1,420 user interactions failed].\n\n## 2. Incident Timeline (UTC)\n- **14:15** - Batch invoice document processing job scheduled via EventBridge fired 200 concurrent tasks.\n- **14:17** - Bedrock Claude 3.5 Sonnet in us-east-1 returned HTTP 429 ThrottlingException.\n- **14:20** - Lambda workers retried immediately without backoff jitter, causing thundering herd.\n- **14:24** - PagerDuty high-severity alert fired on API Gateway 5xx rate > 2%.\n- **14:32** - Incident Commander paused batch SQS consumer workers.\n- **14:41** - On-call engineer activated Cross-Region Inference Profile to route interactive traffic to us-west-2.\n- **14:57** - Interactive error rate returned to 0.0%; incident mitigated.\n\n## 3. Root Cause Analysis (5-Whys)\n1. **Why did users experience timeouts?** API Gateway timed out waiting on Lambda responses.\n2. **Why was Lambda waiting?** Bedrock API returned HTTP 429 throttling errors on Claude 3.5 Sonnet.\n3. **Why did Bedrock throttle?** Batch invoice processing consumed all 50 concurrent on-demand request quotas.\n4. **Why did batch compete with interactive traffic?** Batch workers and interactive customer API shared the identical AWS account quota.\n5. **Why was there no backoff?** Lambda retry logic was missing exponential backoff with full jitter.\n\n## 4. Preventative Action Items\n| Action Item | Type | Owner | Due Date | Ticket |\n| :--- | :--- | :--- | :--- | :--- |\n| Implement exponential backoff with full jitter in Boto3 client | Preventative | AI Eng | YYYY-MM-DD | JIRA-1042 |\n| Separate interactive and batch workloads into dedicated AWS accounts| Architectural | Platform | YYYY-MM-DD | JIRA-1043 |\n| Request Bedrock concurrency quota increase from 50 to 200 | Mitigation | EM | YYYY-MM-DD | AWS-94821 |\n"
    },
    {
      "id": "maturity-assessment",
      "title": "Enterprise AI Maturity Assessment",
      "frequency": "Quarterly",
      "targetRole": "Engineering Leadership & Strategy Teams",
      "description": "5-stage enterprise maturity diagnostic scoring strategy, platform, governance, workforce, and measurement.",
      "templateMarkdown": "# Enterprise AI Maturity Diagnostic & Roadmap\n\n**Assessment Date:** [QX YYYY] · **Assessor:** [AI Engineering Manager]\n**Current Enterprise Maturity Level:** [LEVEL 3: Standardized & Governed]\n\n---\n\n## Maturity Ladder Scoring (1-5 per pillar)\n| Organizational Pillar | Current Score | Target (Next 6 Mo) | Primary Gap to Advance |\n| :--- | :---: | :---: | :--- |\n| **1. Strategy & Business Alignment** | 3.5 | 4.5 | Formalize cross-squad AI use case prioritization rubric |\n| **2. Platform & Infrastructure** | 3.0 | 4.0 | Deploy automated Golden Path CDK constructs across all teams |\n| **3. Data Foundation & RAG** | 3.2 | 4.0 | Implement automated ACL synchronization and document lifecycle |\n| **4. AI Evaluation & Quality** | 2.5 | 3.8 | Replace manual testing with automated CI/CD golden eval gates |\n| **5. Security, Risk & Governance** | 3.8 | 4.5 | Complete ISO 42001 compliance crosswalk and threat modeling |\n| **6. FinOps & Unit Economics** | 3.0 | 4.0 | Automate per-tenant chargeback and prompt caching standards |\n| **7. Workforce & Skills** | 2.8 | 3.5 | Upskill backend engineers in agentic workflows and LangGraph |\n\n## Transformation Roadmap: Level 3 -> Level 4 (Scaled & Embedded)\n1. **Quarter 1:** Mandate automated CI/CD evaluation gates for all production PRs.\n2. **Quarter 2:** Implement dynamic model routing and prompt caching organization-wide.\n3. **Quarter 3:** Advance from assistive RAG assistants to bounded autonomous agent workflows with human checkpoints.\n"
    },
    {
      "id": "governance-review",
      "title": "AI Governance & Compliance Review",
      "frequency": "Quarterly",
      "targetRole": "Governance Committees & CISOs",
      "description": "Quarterly regulatory audit verifying least-privilege IAM, data retention, PII protection, and compliance evidence.",
      "templateMarkdown": "# Quarterly AI Governance & Compliance Review\n\n**Audit Period:** [QX YYYY] · **Compliance Officer:** [Name] · **AI Lead:** [Name]\n\n---\n\n## 1. Regulatory Compliance Checklist\n- [x] **NIST AI RMF 1.0:** GOVERN and MAP controls documented in System Security Plan.\n- [x] **ISO/IEC 42001:** AI System Impact Assessments completed for all 7 production workloads.\n- [x] **GDPR / DPDP Act 2023:** Data subject erasure integration verified; zero customer data retained for model training.\n- [x] **EU AI Act:** Synthetic content disclosure and transparency notices implemented on all user endpoints.\n- [x] **SOC 2 Type II:** Immutable CloudTrail audit trail delivered to S3 Object Lock compliance bucket.\n\n## 2. Security & Guardrail Audit\n- **Bedrock Guardrail Interventions:** [1.4% of total requests intercepted for PII or content policy].\n- **Direct / Indirect Prompt Injections:** [0 successful security bypasses in production].\n- **IAM Access Analyzer:** [Zero wildcard `*` permissions discovered on Bedrock or OpenSearch].\n\n## 3. Governance Findings & Remediation\n- **Finding 1:** Subsidiary document repository lacks automated PII scanning. Remediation: deploy Macie job by [Date].\n"
    },
    {
      "id": "vendor-assessment",
      "title": "AI Vendor & Technology Assessment",
      "frequency": "When Onboarding",
      "targetRole": "Procurement, InfoSec, & Engineering Managers",
      "description": "Vendor due diligence matrix evaluating model providers, vector stores, and AI frameworks for lock-in, SLA, and privacy.",
      "templateMarkdown": "# AI Vendor & Technology Due Diligence Assessment\n\n**Candidate Technology / Vendor:** [Vendor / Model Name]\n**Category:** [Foundation Model Provider / Vector DB / Agent Framework / Eval Tool]\n**Evaluating Team:** [Platform Engineering & Legal Procurement]\n\n---\n\n## Due Diligence Evaluation Criteria\n| Dimension | Evaluation Question | Vendor Score (1-5) | Assessment Notes |\n| :--- | :--- | :---: | :--- |\n| **1. Data Privacy & Zero Retention**| Does vendor guarantee zero customer data training? | [5 / 5] | Explicitly verified in AWS Bedrock DPA |\n| **2. Enterprise SLA & Availability** | Is SLA >= 99.9% with financial credits for breaches? | [4 / 5] | AWS standard 99.9% service SLA |\n| **3. Security & Compliance** | Does vendor possess SOC 2 Type II and ISO 27001? | [5 / 5] | Comprehensive AWS Artifact reports |\n| **4. Vendor Lock-In & Portability** | Can we swap models or vectors without rewriting code?| [4 / 5] | Converse API allows drop-in model swaps |\n| **5. Pricing Predictability** | Are unit costs predictable and protected by caps? | [4 / 5] | Token pricing transparent; supports PTU |\n| **6. Support & Engineering Cadence** | Dedicated AWS Enterprise Solutions Architect support?| [5 / 5] | 15-minute response on SEV-1 tickets |\n\n## Recommendation\n**Decision:** [APPROVED FOR PRODUCTION / PILOT ONLY / REJECTED]\n**Approved Scope:** [Permitted use cases and approved data classification levels].\n"
    }
  ]
};

