/* Reference architectures for AI and ML systems on AWS.
   Each architecture: id, name, short, when, flow:[{s:service-id, l:label}],
   steps:[[node-index, description]], why:[], fails:[] */
window.ATLAS.architectures = [
  {
    "id": "rag-assistant",
    "name": "RAG assistant on Bedrock",
    "short": "Ground an LLM in your own documents, with citations, access control and guardrails.",
    "when": "You need answers grounded in private or fast-changing content, and fine-tuning is the wrong tool. Start here for most enterprise assistants.",
    "flow": [
      {
        "l": "Documents",
        "s": "s3"
      },
      {
        "l": "Parse + chunk + embed",
        "s": "bedrock-kb"
      },
      {
        "l": "Vector index",
        "s": "opensearch"
      },
      {
        "l": "User + auth",
        "s": "cognito"
      },
      {
        "l": "Guardrails",
        "s": "bedrock-guardrails"
      },
      {
        "l": "LLM answer",
        "s": "bedrock"
      }
    ],
    "steps": [
      [
        0,
        "Source documents (manuals, policies, tickets) are stored in [[s3]]. An upload or schedule triggers an ingestion sync."
      ],
      [
        1,
        "[[bedrock-kb|Knowledge Bases]] parses and chunks each document and calls an embedding model for each chunk."
      ],
      [
        2,
        "Vectors and metadata (tenant, department, document ID) are written to a vector index such as [[opensearch]]."
      ],
      [
        3,
        "A user signs in through [[cognito]]; their group claims travel with each request."
      ],
      [
        1,
        "The question is embedded and the index is searched, with a **metadata filter** derived from the user's claims so they only retrieve documents they may see."
      ],
      [
        4,
        "Input and output pass through [[bedrock-guardrails|Guardrails]]: PII masking, denied topics, grounding check."
      ],
      [
        5,
        "[[bedrock|Bedrock]] generates the answer from the retrieved chunks and returns it with citations."
      ]
    ],
    "why": [
      "Knowledge stays outside the model, so updating a document updates answers without retraining.",
      "Citations make answers verifiable, which builds user trust and eases compliance.",
      "Metadata filtering gives per-user access control without a separate index per user.",
      "Every component is managed, so the team spends time on quality, not servers."
    ],
    "fails": [
      "Bad chunking or parsing: the right document is indexed but the right passage never surfaces. Measure retrieval recall on a test set.",
      "Stale index: sync lag means new policies are not yet searchable.",
      "Access-control leak: a missing filter returns restricted chunks. Test with users from different groups.",
      "Throttling at launch when Bedrock quotas were not raised ahead of time."
    ]
  },
  {
    "id": "llm-serving",
    "name": "Self-hosted LLM serving at scale",
    "short": "Serve an open-weight or fine-tuned model on GPUs with queues, autoscaling and streaming.",
    "when": "You need a model Bedrock does not offer, tight cost control at steady high volume, custom serving logic, or strict data-locality. Expect to own more operations.",
    "flow": [
      {
        "l": "Edge + rate limits",
        "s": "cloudfront"
      },
      {
        "l": "Front door",
        "s": "alb"
      },
      {
        "l": "Model servers (vLLM)",
        "s": "eks"
      },
      {
        "l": "GPU nodes",
        "s": "ec2"
      },
      {
        "l": "Weights",
        "s": "s3"
      },
      {
        "l": "Metrics + scaling",
        "s": "cloudwatch"
      }
    ],
    "steps": [
      [
        0,
        "Clients reach [[cloudfront]] with [[waf]] rate limits attached, which blocks abusive callers before they cost GPU time."
      ],
      [
        1,
        "Requests hit an [[alb]] using least-outstanding-requests balancing and a long enough idle timeout for streaming."
      ],
      [
        2,
        "Pods running a serving engine (such as vLLM) batch concurrent requests continuously and stream tokens back."
      ],
      [
        3,
        "Pods are scheduled on [[ec2]] GPU nodes that [[eks]] provisions on demand; reserved capacity covers the baseline."
      ],
      [
        4,
        "On start, pods load weights from [[s3]] (or a shared cache) and report ready only when the model is loaded."
      ],
      [
        5,
        "Queue depth, GPU utilisation and time-to-first-token feed [[cloudwatch]]; autoscaling reacts to them, not to CPU."
      ]
    ],
    "why": [
      "Continuous batching in the serving engine gives far better GPU use than one request per GPU.",
      "Separating edge, balancing and serving lets each layer scale and fail on its own.",
      "Scaling on concurrency or queue depth tracks real load, since LLM requests vary hugely in cost.",
      "Reserved capacity plus on-demand burst balances cost and availability."
    ],
    "fails": [
      "Scale-out lag: new GPU nodes take minutes to start and load weights, so a spike outruns scaling. Keep warm headroom.",
      "Idle timeout or health-check settings kill long generations or slow-starting pods.",
      "GPU capacity shortage at the moment you need to scale. Use reservations, and diversify instance types.",
      "No cost guard: an unbounded client can burn GPU hours. Enforce quotas per key."
    ]
  },
  {
    "id": "training-mlops",
    "name": "Train, evaluate and promote (MLOps)",
    "short": "A repeatable pipeline from raw data to a monitored production model, with a retraining loop.",
    "when": "You own a model (classic ML or fine-tuned LLM) and need it retrained, audited and promoted safely, repeatedly.",
    "flow": [
      {
        "l": "Raw data",
        "s": "s3"
      },
      {
        "l": "Prepare data",
        "s": "glue"
      },
      {
        "l": "Train",
        "s": "sm-training"
      },
      {
        "l": "Pipeline + registry",
        "s": "sm-pipelines"
      },
      {
        "l": "Endpoint",
        "s": "sm-inference"
      },
      {
        "l": "Monitor",
        "s": "sm-monitor"
      }
    ],
    "steps": [
      [
        0,
        "Raw events and files accumulate in [[s3]], the lake that every later step reads from."
      ],
      [
        1,
        "[[glue]] jobs clean, join and write Parquet datasets, with data-quality rules that fail the run on bad data."
      ],
      [
        2,
        "[[sm-training|Training jobs]] fit the model, checkpointing to S3; huge jobs move to [[hyperpod]]."
      ],
      [
        3,
        "[[sm-pipelines|Pipelines]] evaluate against a held-out set, compare with the current champion, and register a passing model as pending approval."
      ],
      [
        4,
        "Approval triggers deployment to a [[sm-inference|SageMaker endpoint]], with shadow or canary traffic before full cutover."
      ],
      [
        5,
        "[[sm-monitor|Model Monitor]] watches captured traffic for drift; an alarm starts the pipeline again through [[eventbridge]]."
      ]
    ],
    "why": [
      "Everything is versioned (data, code, model, approval), so any production model can be reproduced and audited.",
      "The evaluation gate stops regressions reaching production automatically.",
      "The monitoring loop turns \"the model got worse\" from a surprise into an alert.",
      "Managed training means paying for GPUs only while they run."
    ],
    "fails": [
      "Training-serving skew: features computed differently offline and online. Use one definition ([[sm-feature-store|Feature Store]]).",
      "Weak evaluation set: the gate passes models that fail on real traffic. Refresh it from production samples.",
      "Late labels make quality monitoring blind for days; track proxy metrics meanwhile.",
      "Automatic retrain-on-drift can chase noise. Require human approval for promotion."
    ]
  },
  {
    "id": "agent-platform",
    "name": "Tool-using agent platform",
    "short": "Authenticated agents that call internal APIs, remember context, and stay observable and safe.",
    "when": "The assistant must take actions (look up records, create tickets, run analyses), not only answer questions.",
    "flow": [
      {
        "l": "User sign-in",
        "s": "cognito"
      },
      {
        "l": "API entry",
        "s": "apigw"
      },
      {
        "l": "Agent runtime",
        "s": "agentcore"
      },
      {
        "l": "Model",
        "s": "bedrock"
      },
      {
        "l": "Tools",
        "s": "lambda"
      },
      {
        "l": "State + memory",
        "s": "dynamodb"
      }
    ],
    "steps": [
      [
        0,
        "The user authenticates with [[cognito]]; the token identifies them, their tenant and their groups."
      ],
      [
        1,
        "[[apigw|API Gateway]] validates the token, applies per-user throttles, and forwards to the agent."
      ],
      [
        2,
        "The agent runs in [[agentcore|AgentCore Runtime]] in an isolated session, with its reasoning loop written in your framework of choice."
      ],
      [
        3,
        "Each reasoning step calls [[bedrock]]; [[bedrock-guardrails|Guardrails]] screen inputs and outputs."
      ],
      [
        4,
        "Tool calls go to [[lambda]] functions that act with the user's delegated, minimally-scoped permissions and validate every parameter."
      ],
      [
        5,
        "Conversation state and long-term facts persist in [[dynamodb]] (or AgentCore Memory) so sessions can resume."
      ]
    ],
    "why": [
      "Identity flows end to end, so every tool call can be authorised and attributed to a real user.",
      "Isolating sessions prevents one user's context from leaking to another.",
      "Tools are ordinary, testable functions with explicit schemas and server-side validation.",
      "Traces of each step make non-deterministic behaviour debuggable."
    ],
    "fails": [
      "Prompt injection through retrieved or tool-returned text that tells the agent to do something harmful. Treat tool output as untrusted data and limit tool permissions.",
      "Runaway loops that burn tokens. Cap steps, tokens and wall-clock time.",
      "Ambiguous tool descriptions lead to wrong tool choice.",
      "Over-broad tool roles turn a model mistake into a data breach."
    ]
  },
  {
    "id": "document-intelligence",
    "name": "Intelligent document processing",
    "short": "Turn scans and PDFs into validated structured data, with human review for the uncertain cases.",
    "when": "High volumes of invoices, claims, forms or contracts need extracting, checking and routing.",
    "flow": [
      {
        "l": "Upload",
        "s": "s3"
      },
      {
        "l": "Orchestrate",
        "s": "stepfunctions"
      },
      {
        "l": "OCR + structure",
        "s": "textract"
      },
      {
        "l": "PII + entities",
        "s": "comprehend"
      },
      {
        "l": "Reason + validate",
        "s": "bedrock"
      },
      {
        "l": "Store results",
        "s": "dynamodb"
      }
    ],
    "steps": [
      [
        0,
        "A document lands in [[s3]]; an event starts a workflow."
      ],
      [
        1,
        "[[stepfunctions|Step Functions]] coordinates the steps, with retries and a dead-letter path."
      ],
      [
        2,
        "[[textract]] extracts text, tables and key-value pairs with confidence scores."
      ],
      [
        3,
        "[[comprehend]] detects and redacts PII before any model sees the text."
      ],
      [
        4,
        "An LLM on [[bedrock]] maps messy fields to your schema and checks them against business rules."
      ],
      [
        1,
        "Low-confidence or rule-failing documents pause on a task token for human review, then resume."
      ],
      [
        5,
        "Validated data is saved to [[dynamodb]] or the lake, and the original is archived with its audit trail."
      ]
    ],
    "why": [
      "Specialist services handle extraction cheaply and predictably; the LLM is used only for judgement.",
      "Confidence-based routing sends people only the cases that need them.",
      "The workflow engine provides retries, state and an audit trail with no custom plumbing.",
      "Redaction happens before generative steps, limiting data exposure."
    ],
    "fails": [
      "Poor scan quality caps accuracy. Fix capture where possible.",
      "LLM hallucinating a field value that does not exist. Require extracted values to appear in the source text.",
      "Workflow payload limits exceeded by passing document text through states. Pass S3 references.",
      "Backfills overwhelm Textract throttles. Use queues and concurrency limits."
    ]
  },
  {
    "id": "realtime-features",
    "name": "Real-time features and scoring",
    "short": "Stream events into fresh features and score them at request time for fraud, ranking or recommendations.",
    "when": "Decisions depend on what a user did seconds ago, and latency is measured in tens of milliseconds.",
    "flow": [
      {
        "l": "Events",
        "s": "kinesis"
      },
      {
        "l": "Feature compute",
        "s": "lambda"
      },
      {
        "l": "Feature store",
        "s": "sm-feature-store"
      },
      {
        "l": "Cache",
        "s": "elasticache"
      },
      {
        "l": "Scoring endpoint",
        "s": "sm-inference"
      },
      {
        "l": "Training lake",
        "s": "s3"
      }
    ],
    "steps": [
      [
        0,
        "Clickstream and transaction events flow into [[kinesis]], ordered per user."
      ],
      [
        1,
        "Consumers compute rolling features (counts, averages, last-seen) as events arrive."
      ],
      [
        2,
        "Features are written to the [[sm-feature-store|Feature Store]]: the online store for serving, the offline store for training."
      ],
      [
        3,
        "Hot features for the most active users are kept in [[elasticache]] for sub-millisecond reads."
      ],
      [
        4,
        "At request time the app fetches features by ID and calls a [[sm-inference|real-time endpoint]] for a score."
      ],
      [
        5,
        "The same events and features land in [[s3]], where point-in-time-correct training sets are built."
      ]
    ],
    "why": [
      "One feature definition serves both training and inference, avoiding skew.",
      "Streaming keeps features fresh without recomputing batch tables.",
      "Caching shields the feature store and endpoint at peak.",
      "Everything lands in the lake for retraining and audit."
    ],
    "fails": [
      "Hot partition key throttles one shard of the stream and delays features for those users.",
      "Late or out-of-order events produce wrong rolling features.",
      "Online and offline values diverge (eventual consistency), skewing training.",
      "Endpoint scale-out is slower than a traffic spike, causing timeouts; keep headroom."
    ]
  },
  {
    "id": "traditional-rag",
    "name": "Enterprise Traditional RAG Pipeline",
    "short": "Two-stage retrieval pipeline using Amazon Textract for layout analysis, OpenSearch Serverless for hybrid BM25 and vector search, and Amazon Bedrock.",
    "when": "Question-answering over enterprise documents (PDFs, policies, contracts) where layout structure and tabular precision are critical.",
    "flow": [
      {
        "s": "s3",
        "l": "Raw documents"
      },
      {
        "s": "textract",
        "l": "Layout analysis"
      },
      {
        "s": "bedrock",
        "l": "Chunk & embed"
      },
      {
        "s": "opensearch",
        "l": "Hybrid + rerank"
      },
      {
        "s": "apigw",
        "l": "AI gateway"
      },
      {
        "s": "bedrock",
        "l": "Grounded model"
      }
    ],
    "steps": [
      [
        0,
        "Enterprise PDFs, forms, and manuals land in an encrypted [[s3]] bucket with versioning and event notifications."
      ],
      [
        1,
        "An [[s3]] event triggers [[textract]] layout analysis, extracting headers, reading order across multi-column pages, and Markdown tables."
      ],
      [
        2,
        "Text is split into layout-aware chunks with prepended document paths, then embedded into high-dimensional vectors via [[bedrock]] Titan or Cohere embeddings."
      ],
      [
        3,
        "Chunks are indexed in [[opensearch|Amazon OpenSearch Serverless]] using hybrid search (BM25 keyword search + k-NN dense vector search fused via RRF) and scored by a semantic cross-encoder reranker."
      ],
      [
        4,
        "User applications query via [[apigw|Amazon API Gateway]], which enforces rate limits, verifies Cognito JWT tokens, and routes to search."
      ],
      [
        5,
        "The top 3-5 reranked passages are injected into [[bedrock]] (Claude 3.5 Sonnet or Amazon Nova) with system instructions to cite sources and refuse unsupported claims."
      ]
    ],
    "why": [
      "Naive text extraction destroys tables and column hierarchies; Textract layout analysis preserves Markdown tables so embeddings retain spatial relationships.",
      "Hybrid search in OpenSearch Serverless balances keyword accuracy (acronyms, SKUs) with dense vector semantic understanding.",
      "Semantic cross-encoder reranking lifts Recall@5 by 15-25% without requiring expensive model fine-tuning."
    ],
    "fails": [
      "Textract asynchronous processing latency on 100+ page documents delays ingestion if batch pipelines lack backpressure.",
      "OpenSearch Serverless OCU cold-start latency if collections scale down during periods of inactivity."
    ]
  },
  {
    "id": "agentic-rag",
    "name": "Agentic RAG and Multi-Tool Retrieval",
    "short": "Autonomous query decomposition, reflection, and iterative multi-source retrieval across knowledge bases and operational databases.",
    "when": "Complex user questions requiring multi-hop reasoning, cross-system synthesis, and dynamic tool invocation rather than single-shot document search.",
    "flow": [
      {
        "s": "apigw",
        "l": "User inquiry"
      },
      {
        "s": "bedrock-agents",
        "l": "Planner agent"
      },
      {
        "s": "agentcore",
        "l": "Orchestration tools"
      },
      {
        "s": "bedrock-kb",
        "l": "Bedrock KB search"
      },
      {
        "s": "dynamodb",
        "l": "Operational data"
      },
      {
        "s": "bedrock",
        "l": "Reflective synthesis"
      }
    ],
    "steps": [
      [
        0,
        "User queries arrive via [[apigw|Amazon API Gateway]] with user identity and session headers."
      ],
      [
        1,
        "[[bedrock-agents|Amazon Bedrock Agents]] analyzes the prompt, evaluates conversation memory, and devises an execution plan with sub-queries."
      ],
      [
        2,
        "The orchestrator invokes tools hosted on [[agentcore]] or [[lambda]] using typed schemas and parameter validation."
      ],
      [
        3,
        "The agent queries [[bedrock-kb|Bedrock Knowledge Bases]] for unstructured document evidence and cross-source literature."
      ],
      [
        4,
        "The agent invokes a tool against [[dynamodb]] to query real-time transactional status and account parameters."
      ],
      [
        5,
        "[[bedrock]] reflects on intermediate findings, checks if the question is satisfied, and synthesizes the verified answer."
      ]
    ],
    "why": [
      "Single-shot RAG cannot resolve comparative questions that require cross-referencing multiple disparate datasets.",
      "Separating tool execution into narrow Lambda action groups protects database credentials and bounds tool blast radius.",
      "Session persistence in DynamoDB allows multi-turn conversational memory and agent state resumption."
    ],
    "fails": [
      "Unbounded reasoning loops if the model fails to detect that requested information does not exist in any knowledge source.",
      "High token consumption and latency if query decomposition fans out into too many redundant search queries."
    ]
  },
  {
    "id": "graph-rag",
    "name": "GraphRAG and Knowledge Graph Summarization",
    "short": "Extracts entities, relationships, and claims into Amazon Neptune to generate hierarchical community summaries for global corpus synthesis.",
    "when": "Global, holistic queries over massive document corpora (\"What are the recurring supply chain risks across all supplier audits?\") where vector search alone fails.",
    "flow": [
      {
        "s": "s3",
        "l": "Document corpus"
      },
      {
        "s": "glue",
        "l": "Graph extraction"
      },
      {
        "s": "neptune",
        "l": "Graph communities"
      },
      {
        "s": "opensearch",
        "l": "Thematic index"
      },
      {
        "s": "bedrock",
        "l": "Global synthesis"
      }
    ],
    "steps": [
      [
        0,
        "Unstructured corporate filings, audit reports, and contracts reside in [[s3]] storage."
      ],
      [
        1,
        "[[glue]] and [[bedrock]] extract named entities, semantic relationships, and factual claims from document chunks using structured prompts."
      ],
      [
        2,
        "Extracted knowledge graph nodes and edges are loaded into [[neptune|Amazon Neptune Graph Database]], where hierarchical Leiden community detection groups related entities."
      ],
      [
        3,
        "Community summaries are indexed in [[opensearch|Amazon OpenSearch Serverless]] alongside vector embeddings of entity claims."
      ],
      [
        4,
        "Global user questions trigger community report retrieval, and [[bedrock]] aggregates sub-community summaries into an executive synthesis with audit links."
      ]
    ],
    "why": [
      "Vector similarity cannot answer holistic corpus questions because no single chunk contains the global answer.",
      "Graph communities group related entities regardless of which document or folder they originated from.",
      "Pre-computed community summaries reduce query-time latency and token spend for high-level executive questions."
    ],
    "fails": [
      "High upfront token cost during the offline entity extraction phase across hundreds of thousands of document chunks.",
      "Graph drift if newly ingested documents are not incrementally incorporated into community clusters."
    ]
  },
  {
    "id": "multimodal-rag",
    "name": "Multimodal RAG with Document and Vision Intelligence",
    "short": "Ingestion and retrieval pipeline handling mixed text, images, charts, and diagrams using Amazon Textract, Rekognition, and multimodal foundation models.",
    "when": "Engineering manuals, patent filings, financial charts, and medical reports where understanding images, plots, and blueprints is essential.",
    "flow": [
      {
        "s": "s3",
        "l": "Mixed media files"
      },
      {
        "s": "textract",
        "l": "Document extraction"
      },
      {
        "s": "rekognition",
        "l": "Vision & image analysis"
      },
      {
        "s": "opensearch",
        "l": "Multimodal index"
      },
      {
        "s": "bedrock",
        "l": "Multimodal model"
      }
    ],
    "steps": [
      [
        0,
        "Mixed PDF reports, architectural drawings, and image attachments land in [[s3]] object storage."
      ],
      [
        1,
        "[[textract]] extracts structured text and Markdown tables, identifying image and diagram bounding boxes."
      ],
      [
        2,
        "Embedded figures and visual diagrams are sent to [[rekognition]] and vision models in [[bedrock]] to generate dense descriptive captions."
      ],
      [
        3,
        "Both text chunks and image visual embeddings are indexed in [[opensearch|Amazon OpenSearch Serverless]] with cross-modal vector fields."
      ],
      [
        4,
        "User queries retrieve both textual passages and diagram visual artifacts; [[bedrock]] multimodal models (Claude 3.5 Sonnet or Nova Pro) reason over text and images simultaneously."
      ]
    ],
    "why": [
      "Text-only RAG discards charts, architectural blueprints, and graphs that contain the primary data payload in technical documents.",
      "Cross-modal indexing enables searching for diagrams using natural language queries.",
      "Multimodal LLMs directly interpret visual relationships that cannot be represented in plain ASCII text."
    ],
    "fails": [
      "High processing costs if high-resolution images are embedded without resolution downsampling.",
      "Token consumption multiplies rapidly when high-resolution image tokens are passed into model context."
    ]
  },
  {
    "id": "secure-multitenant-rag",
    "name": "Secure Multi-Tenant RAG with Document ACLs",
    "short": "Enterprise multi-tenant RAG architecture with user-level security trimming, customer-managed encryption keys, and zero cross-tenant leakage.",
    "when": "Regulated enterprise B2B applications where users must only retrieve documents matching their corporate security group permissions.",
    "flow": [
      {
        "s": "iam",
        "l": "IAM / Cognito identity"
      },
      {
        "s": "apigw",
        "l": "Tenant AI gateway"
      },
      {
        "s": "opensearch",
        "l": "Security trimming"
      },
      {
        "s": "kms",
        "l": "Customer keys (CMK)"
      },
      {
        "s": "s3",
        "l": "Encrypted tenant data"
      },
      {
        "s": "bedrock",
        "l": "Isolated generation"
      }
    ],
    "steps": [
      [
        0,
        "Users authenticate against [[iam|IAM Identity Center]] or [[cognito|Amazon Cognito]], receiving a signed JWT containing user identity and security group claims."
      ],
      [
        1,
        "[[apigw|Amazon API Gateway]] validates caller identity, extracts verified group claims, and enforces tenant rate limits."
      ],
      [
        2,
        "The search query injects a mandatory server-side document-level filter in [[opensearch|OpenSearch Serverless]] matching the caller security groups."
      ],
      [
        3,
        "All underlying documents and vector indexes are encrypted at rest with dedicated customer-managed keys in [[kms|AWS KMS]]."
      ],
      [
        4,
        "Retrieved document passages are verified against tenant boundaries in [[s3]] before inclusion in prompts."
      ],
      [
        5,
        "[[bedrock]] generates responses with contractual Zero Data Retention and tenant-isolated context windows."
      ]
    ],
    "why": [
      "Frontend security filtering is easily bypassed; server-side security trimming at the search layer prevents cross-tenant data leaks.",
      "Customer-Managed Keys in AWS KMS ensure tenants can cryptographically revoke data access instantly.",
      "Contractual zero customer data retention guarantees enterprise prompts and completions are never logged or stored by the model provider."
    ],
    "fails": [
      "Performance degradation in OpenSearch if security group filter clauses contain thousands of individual user SIDs.",
      "Cache poisoning if semantic caches do not partition cache entries by tenant ID and security hash."
    ]
  },
  {
    "id": "multiagent-orchestration",
    "name": "Multi-Agent Orchestration Patterns",
    "short": "Specialized autonomous agents collaborating via Supervisor-Worker, Sequential Handoff, and Step Functions approval workflows.",
    "when": "Complex enterprise tasks requiring specialized expertise (researcher, coder, compliance reviewer) with human approval gates.",
    "flow": [
      {
        "s": "apigw",
        "l": "Task entrypoint"
      },
      {
        "s": "bedrock-agents",
        "l": "Orchestrator agent"
      },
      {
        "s": "agentcore",
        "l": "Worker agents"
      },
      {
        "s": "lambda",
        "l": "Tool microservices"
      },
      {
        "s": "stepfunctions",
        "l": "Approval workflow"
      },
      {
        "s": "cloudwatch",
        "l": "Distributed trace"
      }
    ],
    "steps": [
      [
        0,
        "Complex user task requests enter through [[apigw|Amazon API Gateway]] with traceability headers."
      ],
      [
        1,
        "The primary supervisor agent in [[bedrock-agents|Amazon Bedrock Agents]] evaluates the objective and breaks it into sub-tasks for specialist workers."
      ],
      [
        2,
        "Worker agents hosted on [[agentcore]] execute domain tasks (retrieval, code generation, mathematical analysis) in parallel."
      ],
      [
        3,
        "Agents invoke external APIs and business logic through secure [[lambda|AWS Lambda]] tool microservices."
      ],
      [
        4,
        "Irreversible actions (financial transfers, database writes) trigger [[stepfunctions|AWS Step Functions]] pause states for human approval."
      ],
      [
        5,
        "Every agent turn, thought trace, tool execution, and approval event is streamed to [[cloudwatch]] for distributed auditing."
      ]
    ],
    "why": [
      "Single prompts degrade in reasoning quality when overloaded with dozens of contradictory tool instructions; specialized agents keep contexts focused.",
      "Supervisor agents enforce quality verification before presenting aggregated results to end users.",
      "Step Functions provides reliable distributed state persistence and pause-for-human approval capabilities."
    ],
    "fails": [
      "Agent conversational ping-pong if supervisor and worker agents enter a circular delegation loop without hard turn caps.",
      "Cascading latency delays when multi-agent steps are executed sequentially rather than in parallel."
    ]
  },
  {
    "id": "genaiops-lifecycle",
    "name": "GenAIOps and Continuous Evaluation Pipeline",
    "short": "Continuous integration and evaluation pipeline running automated LLM evaluations and canary deployments on prompt changes.",
    "when": "Production teams deploying regular prompt, retrieval, or model updates requiring regression testing and automated release gates.",
    "flow": [
      {
        "s": "cdk",
        "l": "Infrastructure as code"
      },
      {
        "s": "sm-monitor",
        "l": "Automated evals"
      },
      {
        "s": "sm-jumpstart",
        "l": "Model registry"
      },
      {
        "s": "sm-inference",
        "l": "Canary endpoint"
      },
      {
        "s": "cloudwatch",
        "l": "Online telemetry"
      }
    ],
    "steps": [
      [
        0,
        "Developers commit prompt templates, configuration parameters, and evaluation datasets versioned in Git managed via [[cdk]]."
      ],
      [
        1,
        "CI/CD pipeline triggers automated evaluation suites using [[sm-monitor|SageMaker Model Monitor]] and Bedrock Evaluations across 500+ golden test cases."
      ],
      [
        2,
        "Passing configurations are registered with cryptographic hashes in [[sm-jumpstart|SageMaker JumpStart]] or the internal model catalog."
      ],
      [
        3,
        "The approved pipeline deploys a canary deployment on [[sm-inference|SageMaker Inference]] routing 10% of live traffic."
      ],
      [
        4,
        "[[cloudwatch]] continuously monitors online Groundedness, P95 latency, token cost per task, and 429 throttling spikes."
      ]
    ],
    "why": [
      "Small prompt edits frequently introduce catastrophic regressions; automated evaluation gates in CI prevent broken releases.",
      "Synthetic evaluation datasets test adversarial inputs and jailbreak attempts before code reaches production.",
      "Canary traffic splitting catches production data distribution drift before 100% rollout."
    ],
    "fails": [
      "Flaky LLM-as-a-judge evaluators if evaluation prompts are underspecified or temperature is not set to 0.0.",
      "High CI build times and costs if entire 5,000-case test sets are run on every minor pull request commit."
    ]
  }
];
