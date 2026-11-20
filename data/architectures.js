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
  },
  {
    "id": "ai-gateway",
    "name": "Production AI Gateway & Model Router",
    "short": "Centralized enterprise entrypoint managing authentication, rate limiting, model routing, prompt caching, guardrails, and cost tracking.",
    "when": "You have multiple squads consuming foundation models and need a unified policy, quota enforcement, billing attribution, and fallback router.",
    "flow": [
      { "s": "cloudfront", "l": "Global Edge & WAF" },
      { "s": "apigw", "l": "API Gateway Router" },
      { "s": "lambda", "l": "Policy & Cache Handler" },
      { "s": "bedrock-guardrails", "l": "Content Guardrails" },
      { "s": "bedrock", "l": "Multi-Model Inference" },
      { "s": "cloudwatch", "l": "FinOps & Latency Telemetry" }
    ],
    "steps": [
      [0, "Client requests arrive through [[cloudfront|Amazon CloudFront]] with integrated [[waf|AWS WAF]] enforcing DDoS protection, IP rate limiting, and bot mitigation."],
      [1, "Requests hit [[apigw|Amazon API Gateway]], which validates API keys, JWT access tokens via [[cognito|Cognito]], and enforces per-tenant usage quotas."],
      [2, "A high-performance [[lambda|AWS Lambda]] resolver inspects the request, checks semantic cache in [[elasticache|ElastiCache]], and applies dynamic model routing rules."],
      [3, "Inbound prompts pass through [[bedrock-guardrails|Amazon Bedrock Guardrails]] to filter PII, toxic language, and adversarial prompt injection attempts."],
      [4, "The routed prompt invokes the target model (or cross-region inference profile) on [[bedrock|Amazon Bedrock]], returning a streaming Server-Sent Events response."],
      [5, "Usage metrics, input/output token counts, tenant tags, and P95 latencies are emitted to [[cloudwatch|Amazon CloudWatch]] and central log streams."]
    ],
    "why": [
      "Centralizes model governance, preventing teams from managing disparate API keys and leaking unmonitored shadow AI spend.",
      "Decouples client applications from specific model provider APIs via a standardized REST/OpenAPI facade.",
      "Enables dynamic model down-routing and prompt caching, reducing organizational AI spend by up to 70%."
    ],
    "fails": [
      "If the centralized Lambda router experiences cold starts or networking timeouts, all enterprise AI applications suffer latency spikes.",
      "Misconfigured usage plans can accidentally throttle critical production workloads during unexpected legitimate business traffic bursts."
    ]
  },
  {
    "id": "eval-cicd",
    "name": "Automated AI Evaluation & CI/CD Pipeline",
    "short": "Automated regression testing, synthetic golden datasets, safety gates, and canary releases in GitHub Actions and AWS.",
    "when": "Deploying model, prompt, or RAG changes to production and needing verifiable quality, safety, and latency release gates.",
    "flow": [
      { "s": "cdk", "l": "IaC & Prompt Repo" },
      { "s": "lambda", "l": "Eval Runner Pipeline" },
      { "s": "bedrock", "l": "LLM-as-a-Judge" },
      { "s": "sm-monitor", "l": "Quality Gate Analysis" },
      { "s": "stepfunctions", "l": "Canary Rollout Gate" },
      { "s": "s3", "l": "Evaluation Lake" }
    ],
    "steps": [
      [0, "Developers commit prompt templates, tool schemas, and configuration codified in [[cdk|AWS CDK]] to version-controlled repositories."],
      [1, "The CI/CD pipeline triggers an automated evaluation orchestrator in [[lambda|AWS Lambda]] executing against 500+ frozen golden test cases."],
      [2, "Candidate outputs and ground truth references are evaluated using automated LLM-as-a-judge scorers in [[bedrock|Amazon Bedrock]] for Faithfulness, Relevance, and Safety."],
      [3, "Evaluation metrics are ingested into [[sm-monitor|SageMaker Model Monitor]] to compute regression deltas against production baseline standards."],
      [4, "If all 12 mandatory quality gates pass, [[stepfunctions|AWS Step Functions]] triggers a canary release routing 10% live traffic with automated rollback alarms."],
      [5, "Full evaluation reports, prompt diffs, latency histograms, and judge reasoning traces are archived immutably in [[s3|Amazon S3]]."]
    ],
    "why": [
      "Eliminates subjective manual 'vibe checks' before releasing generative AI updates to production.",
      "Intercepts prompt regressions, safety bypasses, and tool calling schema breaks before customer impact.",
      "Enforces reproducible, auditable compliance evidence for every production release."
    ],
    "fails": [
      "Non-deterministic LLM-as-a-judge scoring if judge temperature is not pinned to 0.0 or judge prompts lack few-shot calibration.",
      "Excessive test execution duration and cost if running thousands of comprehensive evaluations on every minor commit."
    ]
  },
  {
    "id": "ai-landing-zone",
    "name": "Enterprise AI Landing Zone & Multi-Account Platform",
    "short": "AWS Control Tower multi-account architecture with centralized network hub, isolated AI environments, and enterprise governance.",
    "when": "Scaling AI across multiple squads and departments, requiring strict security boundaries, network isolation, and centralized cost control.",
    "flow": [
      { "s": "iam", "l": "Organizations & SCPs" },
      { "s": "vpc", "l": "Transit Gateway Hub" },
      { "s": "kms", "l": "Dedicated CMK Encryption" },
      { "s": "lakeformation", "l": "Governed Data Lake" },
      { "s": "bedrock", "l": "AI Spoke Accounts" },
      { "s": "cloudtrail", "l": "Centralized Log Archive" }
    ],
    "steps": [
      [0, "AWS Organizations and Control Tower manage multi-account hierarchy; Service Control Policies (SCPs) enforce mandatory [[iam|AWS IAM]] boundaries and region restrictions."],
      [1, "An isolated [[vpc|Amazon VPC]] hub-and-spoke network connected via AWS Transit Gateway routes all traffic through centralized AWS Network Firewall and PrivateLink endpoints."],
      [2, "Each business unit spoke account utilizes dedicated [[kms|AWS KMS]] Customer Managed Keys with strict key policies to prevent cross-account cryptographic access."],
      [3, "Enterprise data assets in S3 are governed centrally by [[lakeformation|AWS Lake Formation]], providing fine-grained column- and row-level access control."],
      [4, "AI development, staging, and production spoke accounts access foundation models in [[bedrock|Amazon Bedrock]] privately without traversing the public internet."],
      [5, "All management events, data access calls, and model invocations are streamed to a tamper-proof Log Archive account via [[cloudtrail|AWS CloudTrail]]."]
    ],
    "why": [
      "Provides blast-radius containment: an error or security breach in experimental dev sandbox cannot impact production customer AI systems.",
      "Satisfies SOC 2, ISO 42001, and banking regulatory standards for multi-tenant data segregation.",
      "Centralizes egress security, preventing data exfiltration while simplifying cost allocation across cost centers."
    ],
    "fails": [
      "Transit Gateway data processing charges and centralized PrivateLink endpoint costs can grow if cross-VPC traffic is not monitored.",
      "Overly restrictive SCPs can inadvertently block developers from testing cutting-edge Bedrock features in sandbox accounts."
    ]
  },
  {
    "id": "agentic-human-approval",
    "name": "Agentic AI with Human Approval & Checkpoints",
    "short": "Autonomous multi-step agent execution with risk-based decision checkpoints, Step Functions callback gates, and durable state.",
    "when": "Building autonomous agents that perform state-changing real-world actions (payments, database updates, emails) requiring human authorization.",
    "flow": [
      { "s": "apigw", "l": "User Task Inbound" },
      { "s": "bedrock-agents", "l": "Autonomous Agent Planner" },
      { "s": "dynamodb", "l": "Durable State Store" },
      { "s": "stepfunctions", "l": "Human Approval Gate" },
      { "s": "sns", "l": "Approver Notification" },
      { "s": "cloudwatch", "l": "Audit & Trace Trail" }
    ],
    "steps": [
      [0, "User initiates a complex multi-step request via [[apigw|Amazon API Gateway]], assigning a unique correlation and session ID."],
      [1, "The planning agent in [[bedrock-agents|Amazon Bedrock Agents]] evaluates the objective, decomposes tasks, and selects tool microservices."],
      [2, "Before and after each step, the execution plan, tool arguments, and context memory are checkpointed durably in [[dynamodb|Amazon DynamoDB]]."],
      [3, "When a high-risk tool is selected (e.g. wire transfer > ₹10,000), [[stepfunctions|AWS Step Functions]] pauses execution with a task token callback."],
      [4, "An alert with action context, risk score, and one-click approve/reject links is dispatched to manager via [[sns|Amazon SNS]] or Slack."],
      [5, "Upon human callback, the state machine resumes the agent or terminates cleanly, logging full audit records to [[cloudwatch|Amazon CloudWatch]]."]
    ],
    "why": [
      "Prevents catastrophic unauthorized actions or financial losses resulting from agent hallucination or prompt injection.",
      "Allows agents to execute long-running, multi-hour workflows reliably without losing in-flight state during transient failures.",
      "Produces an immutable compliance audit record of exactly which human approved what action at what timestamp."
    ],
    "fails": [
      "Human approver bottlenecks: if managers do not respond before Step Functions task token timeout (e.g. 24h), workflows fail or stall.",
      "State serialization size limits: complex conversational memory stored in DynamoDB must not exceed 400KB item size limit."
    ]
  },
  {
    "id": "ai-observability-platform",
    "name": "End-to-End AI Observability & Tracing Platform",
    "short": "OpenTelemetry distributed tracing, prompt-to-response correlation, vector search latency tracking, and Athena analytics.",
    "when": "Managing production AI systems and needing full visibility into token burn, P95 latency, retrieval relevance, and operational anomalies.",
    "flow": [
      { "s": "apigw", "l": "Trace Injection" },
      { "s": "bedrock", "l": "Model Telemetry" },
      { "s": "lambda", "l": "Telemetry Enricher" },
      { "s": "cloudwatch", "l": "Logs & Alarm Hub" },
      { "s": "opensearch", "l": "Trace & Span Index" },
      { "s": "athena", "l": "Log Analytics Lake" }
    ],
    "steps": [
      [0, "Inbound user queries pass through [[apigw|Amazon API Gateway]], which injects W3C `traceparent` headers and correlation IDs."],
      [1, "Foundation model invocations in [[bedrock|Amazon Bedrock]] stream token usage, TTFT latency, stop reasons, and guardrail intervention flags."],
      [2, "A lightweight [[lambda|AWS Lambda]] telemetry enricher captures vector search recall scores, chunk IDs, and tool execution status."],
      [3, "Metrics and structured JSON logs flow to [[cloudwatch|Amazon CloudWatch]], driving real-time SLO alarms and SRE incident notifications."],
      [4, "Distributed OpenTelemetry trace spans are indexed in [[opensearch|Amazon OpenSearch Service]] for interactive latency and waterfall visual debugging."],
      [5, "Raw conversational logs and eval traces are partitioned in S3 and queried serverless via [[athena|Amazon Athena]] for weekly FinOps analysis."]
    ],
    "why": [
      "AI systems fail quietly without traditional 500 errors; end-to-end tracing is the only way to diagnose slow or ungrounded responses.",
      "Enables immediate root-cause isolation: determine whether latency was caused by vector search, model TTFT, or tool microservices.",
      "Provides granular per-tenant token and cost attribution data for enterprise chargeback billing."
    ],
    "fails": [
      "High CloudWatch log ingestion bills if high-frequency verbose prompt and completion payloads are logged without sampling.",
      "Risk of logging sensitive customer PII or confidential query text into telemetry stores without automated masking."
    ]
  },
  {
    "id": "ai-data-platform",
    "name": "Enterprise AI Data Platform & Feature Store",
    "short": "Governed ingestion, automated PII redaction, chunking pipelines, online/offline feature storage, and vector sync.",
    "when": "Building a scalable data foundation that feeds clean, governed, low-latency features and vectors into production AI systems.",
    "flow": [
      { "s": "s3", "l": "Raw Data Ingestion" },
      { "s": "glue", "l": "ETL & PII Sanitizer" },
      { "s": "lakeformation", "l": "Governance & RBAC" },
      { "s": "sm-feature-store", "l": "Online/Offline Store" },
      { "s": "opensearch", "l": "Vector Index" },
      { "s": "bedrock-kb", "l": "Knowledge Retrieval" }
    ],
    "steps": [
      [0, "Raw unstructured documents, transaction logs, and customer interactions land in [[s3|Amazon S3]] data lake storage."],
      [1, "Serverless [[glue|AWS Glue]] ETL jobs extract text, perform PII redaction, validate data schemas, and partition clean datasets."],
      [2, "Access permissions, row-level filters, and data cataloging are governed centrally via [[lakeformation|AWS Lake Formation]]."],
      [3, "Engineered structured features are ingested into [[sm-feature-store|SageMaker Feature Store]] with ultra-low latency online reads."],
      [4, "Document text is chunked semantically and indexed into [[opensearch|Amazon OpenSearch Service]] alongside document ACL metadata."],
      [5, "Production agents and RAG applications query pre-computed features and vectorized knowledge via [[bedrock-kb|Bedrock Knowledge Bases]]."]
    ],
    "why": [
      "Garbage in, garbage out: 80% of production AI failures stem from corrupt, stale, or unauthorized data rather than model issues.",
      "Synchronizes online feature serving (< 10ms) with offline batch training lakes, preventing data distribution skew.",
      "Ensures consistent document access control enforcement between the primary data lake and vector search indices."
    ],
    "fails": [
      "Stale vector indices if document update and deletion events in S3 fail to trigger downstream chunk re-indexing pipelines.",
      "Feature store drift if online and offline data ingestion pipelines diverge in transformation logic."
    ]
  },
  {
    "id": "multiregion-resilience",
    "name": "Multi-Region AI Resilience & Failover",
    "short": "Active-active and active-standby multi-region deployment with automated DNS failover, cross-region replication, and inference fallback.",
    "when": "Mission-critical AI workloads requiring 99.99% availability, disaster recovery, and resilience against regional AWS impairments.",
    "flow": [
      { "s": "route53", "l": "Global Latency DNS" },
      { "s": "cloudfront", "l": "Global Edge Shield" },
      { "s": "apigw", "l": "Regional API Entry" },
      { "s": "bedrock", "l": "Cross-Region Profiles" },
      { "s": "dynamodb", "l": "Global Tables" },
      { "s": "s3", "l": "Cross-Region Replication" }
    ],
    "steps": [
      [0, "Global client traffic is routed to the closest healthy AWS region via [[route53|Amazon Route 53]] latency and health-check policies."],
      [1, "[[cloudfront|Amazon CloudFront]] terminates SSL at edge points of presence, providing DDoS protection and intelligent origin failover."],
      [2, "Each region runs an independent, identical serverless stack fronted by [[apigw|Amazon API Gateway]] in private multi-AZ subnets."],
      [3, "Model inference calls utilize [[bedrock|Amazon Bedrock]] Cross-Region Inference Profiles to dynamically shift load to standby regions during capacity constraints."],
      [4, "Conversational history and agent state synchronize bi-directionally across regions in < 1 second using [[dynamodb|Amazon DynamoDB]] Global Tables."],
      [5, "Document stores and model checkpoints in [[s3|Amazon S3]] replicate automatically across regions via S3 Cross-Region Replication (CRR)."]
    ],
    "why": [
      "Guarantees business continuity even if an entire AWS region experiences major fiber cuts or infrastructure impairments.",
      "Protects applications from regional Bedrock model quota exhaustion by automatically routing to alternative geographic capacity.",
      "Achieves Recovery Time Objective (RTO) < 5 minutes and Recovery Point Objective (RPO) < 1 minute."
    ],
    "fails": [
      "DynamoDB Global Tables write conflicts if the same user session is updated simultaneously in two regions before replication completes.",
      "Substantial data transfer out (DTO) and cross-region replication costs if large vector collections are duplicated across 3+ regions."
    ]
  },
  {
    "id": "ai-finops-architecture",
    "name": "AI FinOps & Cost Allocation Engine",
    "short": "Automated cost allocation tags, real-time token tracking, budget threshold alarms, and Athena cost analytics.",
    "when": "Managing enterprise AI cloud spend across multiple squads and needing granular per-task unit economics and proactive cost governance.",
    "flow": [
      { "s": "apigw", "l": "Tenant Tag Injection" },
      { "s": "lambda", "l": "Token Telemetry Meter" },
      { "s": "cloudwatch", "l": "Metric Emission" },
      { "s": "budgets", "l": "Budget Threshold Alarms" },
      { "s": "athena", "l": "Cost Analysis Queries" },
      { "s": "servicequotas", "l": "Automated Throttle" }
    ],
    "steps": [
      [0, "[[apigw|Amazon API Gateway]] extracts tenant ID, project code, and cost center from JWT authentication tokens on every request."],
      [1, "A post-inference [[lambda|AWS Lambda]] telemetry handler meters exact prompt, completion, and cache tokens consumed."],
      [2, "Custom FinOps metrics (CostPerTask, TokenBurnRate, CacheHitRate) are published in real-time to [[cloudwatch|Amazon CloudWatch]]."],
      [3, "[[budgets|AWS Budgets]] evaluates spending velocity against approved monthly squad caps, alerting engineering managers at 80% and 100%."],
      [4, "Curated AWS Cost and Usage Reports (CUR) partitioned in S3 are queried via [[athena|Amazon Athena]] to calculate exact ROI per project."],
      [5, "If a tenant or project breaches emergency financial ceilings, [[servicequotas|AWS Service Quotas]] or API Gateway dynamically throttles non-critical requests."]
    ],
    "why": [
      "Eliminates end-of-month cloud bill shock by detecting runaway prompts or looping agents within minutes rather than weeks.",
      "Provides clear financial evidence to leadership justifying AI platform investments with measured cost-per-successful-task.",
      "Enables accurate cross-departmental chargeback and showback accounting across business units."
    ],
    "fails": [
      "Incomplete tagging: untagged or ad-hoc resources escape automated attribution and hide in unallocated overhead budgets.",
      "Aggressive automated throttling could halt legitimate high-priority business transactions if budget ceilings are configured too tightly."
    ]
  },
  {
    "id": "secure-mcp-platform",
    "name": "Secure Model Context Protocol (MCP) Tool Platform",
    "short": "Enterprise tool registry, containerized MCP servers, mTLS authentication, least-privilege IAM, and runtime auditing.",
    "when": "Exposing enterprise databases, APIs, and tools to AI agents using the open Model Context Protocol standard securely.",
    "flow": [
      { "s": "apigw", "l": "MCP Tool Gateway" },
      { "s": "cognito", "l": "mTLS & OAuth2 Auth" },
      { "s": "ecs", "l": "Sandboxed MCP Servers" },
      { "s": "secrets", "l": "Credential Injection" },
      { "s": "iam", "l": "Scoped Execution Roles" },
      { "s": "cloudtrail", "l": "Tool Audit Trail" }
    ],
    "steps": [
      [0, "Agent tool requests targeting enterprise MCP servers are routed through [[apigw|Amazon API Gateway]] with request schema validation."],
      [1, "[[cognito|Amazon Cognito]] and API Gateway mutual TLS (mTLS) verify agent identity and validate short-lived OAuth2 tool authorization scopes."],
      [2, "MCP tool servers execute in hardened, isolated [[ecs|Amazon ECS]] Fargate containers with read-only root filesystems and zero host access."],
      [3, "Backing service credentials (database passwords, API tokens) are fetched just-in-time from [[secrets|AWS Secrets Manager]] without baking into images."],
      [4, "Each individual tool container operates under a scoped [[iam|AWS IAM]] execution role restricted strictly to target resources."],
      [5, "Every tool invocation, input argument payload, execution duration, and response status is recorded immutably in [[cloudtrail|AWS CloudTrail]]."]
    ],
    "why": [
      "Prevents malicious or compromised agents from executing unauthorized commands, accessing internal networks, or exfiltrating credentials.",
      "Standardizes tool development across squads using the open MCP protocol while maintaining enterprise AWS security controls.",
      "Enables hot-swapping and zero-downtime versioning of backend tool microservices without altering agent prompts."
    ],
    "fails": [
      "Tool discovery latency: dynamically querying large MCP tool catalogs on every turn can consume significant agent tokens and time.",
      "Complex network debugging: strict VPC security groups and mTLS authentication can complicate local developer testing."
    ]
  },
  {
    "id": "ai-batch-processing",
    "name": "Large-Scale AI Batch Processing Platform",
    "short": "Queue-decoupled asynchronous document processing, AWS Batch, Bedrock batch inference (50% discount), and retry isolation.",
    "when": "Processing massive document backlogs, overnight migrations, or continuous background classification with optimal cost efficiency.",
    "flow": [
      { "s": "s3", "l": "Document Ingestion Drop" },
      { "s": "sqs", "l": "Durable Work Queue" },
      { "s": "batch", "l": "Spot Container Worker" },
      { "s": "bedrock", "l": "Batch Inference API" },
      { "s": "dynamodb", "l": "Job State & Progress" },
      { "s": "sns", "l": "Completion Notification" }
    ],
    "steps": [
      [0, "Batches of thousands or millions of source files (invoices, resumes, contracts) land in [[s3|Amazon S3]] input buckets."],
      [1, "S3 ObjectCreated events publish document tasks to an [[sqs|Amazon SQS]] queue configured with a Dead-Letter Queue (DLQ) for failed items."],
      [2, "[[batch|AWS Batch]] dynamically provisions compute nodes on Amazon EC2 Spot Instances to orchestrate extraction and chunking."],
      [3, "Chunked prompts are submitted to the [[bedrock|Amazon Bedrock]] Batch Inference API, executing asynchronously within 24 hours at a 50% discount."],
      [4, "Task completion status, output locations, processing duration, and error codes are tracked in [[dynamodb|Amazon DynamoDB]]."],
      [5, "Upon batch job completion, [[sns|Amazon SNS]] dispatches summary metrics and triggers downstream ERP ingestion pipelines."]
    ],
    "why": [
      "Captures AWS Bedrock's 50% batch pricing discount, cutting processing costs in half for non-interactive workloads.",
      "Decoupled queuing guarantees that zero documents are lost during sudden traffic bursts or transient AWS service limits.",
      "Auto-scales from zero to tens of thousands of concurrent workers and scales back to zero when queue empties."
    ],
    "fails": [
      "Unsuitable for interactive user applications: turnaround time is asynchronous (typically 1 to 24 hours).",
      "Spot instance preemption on AWS Batch requires idempotent processing to avoid duplicate chunking when tasks resume."
    ]
  }
];
