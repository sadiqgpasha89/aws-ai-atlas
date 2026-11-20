/* AWS AI Service Selection Matrix & Decision Engine.
   Answers the engineering manager and principal engineer question:
   "Which AWS service should my team use for this specific workload, and why?" */
window.ATLAS = window.ATLAS || {};
window.ATLAS.selector = {
  workloads: [
    {
      id: 'managed-fm-inference',
      title: 'Managed Foundation Model Inference',
      workloadProfile: 'Consuming commercial and open-weight LLMs (Claude, Nova, Llama 3.3, Mistral) without managing infrastructure.',
      keyDecision: 'Managed API vs custom-hosted model serving.',
      recommended: {
        svc: 'bedrock',
        name: 'Amazon Bedrock',
        why: 'Serverless, zero GPU management, unified API across leading model providers, built-in guardrails, cross-region inference profiles, and enterprise SLA.'
      },
      alternatives: [
        {
          svc: 'sm-jumpstart',
          name: 'SageMaker JumpStart / Endpoints',
          whyRejected: 'Requires dedicated instance provisioning (e.g. ml.g5.12xlarge), paying for idle compute 24/7, and managing endpoint scaling policies manually.',
          fitsWhen: 'You require custom container modifications, private weights not on Bedrock, or extreme sustained throughput where provisioned instances beat token pricing.'
        },
        {
          svc: 'eks',
          name: 'Amazon EKS with vLLM',
          whyRejected: 'Massive operational complexity: team must manage GPU driver daemonsets, Karpenter autoscaling, vLLM engine tuning, and round-the-clock SRE on-call.',
          fitsWhen: 'You have strict on-premises data residency, hybrid cloud Kubernetes requirements, or existing large reserved GPU fleet commitments.'
        }
      ],
      criteria: {
        latency: 'Low (P95 TTFT 1.5s - 3.0s)',
        concurrency: 'High (managed autoscaling to thousands of concurrent requests)',
        costCeiling: 'Pay-per-token or Provisioned Throughput units',
        gpuRequirement: 'Zero GPU management (handled by AWS)',
        teamSkill: 'Application / Full-Stack developers (Python / TypeScript)',
        operationalOverhead: 'Minimal (No OS, no CUDA, no cluster management)',
        lockInRisk: 'Low (Converse API provides standardized payload format across models)'
      }
    },
    {
      id: 'custom-model-training',
      title: 'Custom Model Training & Distributed Pretraining',
      workloadProfile: 'Pretraining proprietary domain foundation models or training large deep learning architectures across multi-node clusters.',
      keyDecision: 'Managed distributed training platform vs raw GPU compute.',
      recommended: {
        svc: 'hyperpod',
        name: 'SageMaker HyperPod & Training',
        why: 'Automated node health checks, self-healing cluster auto-recovery, integrated high-speed Slurm orchestration, and optimized EFA networking.'
      },
      alternatives: [
        {
          svc: 'ec2',
          name: 'Raw EC2 P5 / G6 Instances with EFA',
          whyRejected: 'When a GPU or hardware node fails at 3:00 AM 3 weeks into a 6-week training run, the entire job dies without automated HyperPod node replacement and checkpoint recovery.',
          fitsWhen: 'Bespoke distributed cluster management where an external orchestrator (like Ray or custom Kubernetes) manages fault tolerance.'
        },
        {
          svc: 'eks',
          name: 'Amazon EKS with Kubeflow / Ray',
          whyRejected: 'Substantial Kubernetes overhead: team must build custom checkpoint resumption operators and manage deep CUDA networking drivers manually.',
          fitsWhen: 'Organization-wide standard mandates Kubernetes for all compute workloads.'
        }
      ],
      criteria: {
        latency: 'Batch / Days-to-Weeks duration',
        concurrency: 'Thousands of distributed GPUs connected over 3200 Gbps EFA',
        costCeiling: 'High capital investment ($10k - $100k+ per training run)',
        gpuRequirement: 'NVIDIA H100/H200 (P5) or AWS Trainium (Trn1/Trn2)',
        teamSkill: 'Specialized ML / Distributed Systems Engineers',
        operationalOverhead: 'Medium (Managed infrastructure with automated health repairs)',
        lockInRisk: 'Low (PyTorch / Megatron-LM code runs anywhere)'
      }
    },
    {
      id: 'fine-tuning',
      title: 'Model Fine-Tuning & Customization',
      workloadProfile: 'Adapting an existing foundation model to proprietary enterprise vocabulary, structured outputs, or specialized classification tasks.',
      keyDecision: 'Fully managed serverless fine-tuning vs custom LoRA / QLoRA pipelines.',
      recommended: {
        svc: 'bedrock',
        name: 'Amazon Bedrock Custom Models',
        why: 'Serverless fine-tuning: provide S3 training/validation JSONL datasets, AWS manages the training job, and the resulting custom model is instantly callable via the standard Bedrock API.'
      },
      alternatives: [
        {
          svc: 'sm-training',
          name: 'SageMaker Training (PEFT / LoRA / QLoRA)',
          whyRejected: 'Requires custom training scripts, container configuration, hyperparameters, and explicit deployment to dedicated inference endpoints.',
          fitsWhen: 'You need open-source weights (Llama 3, Mistral, Qwen) with custom loss functions, DPO (Direct Preference Optimization), or RLHF pipelines.'
        },
        {
          svc: 'bedrock-kb',
          name: 'RAG / Prompt Engineering (No Fine-Tuning)',
          whyRejected: 'If knowledge changes weekly or requires strict source citations, fine-tuning is the wrong tool; use RAG instead.',
          fitsWhen: 'Injecting dynamic, fast-changing factual knowledge rather than teaching the model a new stylistic tone or specialized syntax.'
        }
      ],
      criteria: {
        latency: 'Offline training (hours); standard API inference post-fine-tuning',
        concurrency: 'Standard API limits',
        costCeiling: 'Moderate ($500 - $3,000 per training run)',
        gpuRequirement: 'Managed by AWS Bedrock backend',
        teamSkill: 'Data Engineers / AI Engineers',
        operationalOverhead: 'Low (Serverless training invocation)',
        lockInRisk: 'Medium (Custom Bedrock model weights cannot be exported out of AWS)'
      }
    },
    {
      id: 'self-hosted-llm-serving',
      title: 'Self-Hosted LLM Serving (Open-Weight Models)',
      workloadProfile: 'Running open-weight models (Llama 3.3, DeepSeek, Mistral, Qwen) on dedicated infrastructure with custom serving engines (vLLM, TGI).',
      keyDecision: 'Kubernetes GPU orchestration vs managed SageMaker endpoints vs raw EC2.',
      recommended: {
        svc: 'eks',
        name: 'Amazon EKS with vLLM & Karpenter',
        why: 'Industry-standard vLLM serving engine with continuous batching, PagedAttention, Karpenter dynamic GPU node provisioning, and maximum price-performance.'
      },
      alternatives: [
        {
          svc: 'sm-inference',
          name: 'SageMaker Real-Time Endpoints',
          whyRejected: 'Higher hourly instance markup; less flexibility in customizing custom CUDA kernels or cutting-edge vLLM speculative decoding features.',
          fitsWhen: 'Team wants AWS-managed endpoint autoscaling without running a Kubernetes cluster.'
        },
        {
          svc: 'ecs',
          name: 'Amazon ECS on EC2 GPU',
          whyRejected: 'Lacks native Karpenter-grade intelligent Bin-packing and rapid GPU instance scaling that EKS offers.',
          fitsWhen: 'Team already runs entire company on ECS and lacks Kubernetes operational expertise.'
        }
      ],
      criteria: {
        latency: 'Ultra-low (P95 TTFT < 800ms with speculative decoding)',
        concurrency: 'High (Optimized by continuous batching)',
        costCeiling: 'Fixed hourly GPU instance costs + Spot savings',
        gpuRequirement: 'g5 / g6 / p4d / p5 instances or AWS Inferentia2',
        teamSkill: 'Platform Engineers + MLOps Specialists',
        operationalOverhead: 'High (K8s, GPU drivers, vLLM version upgrades, alerts)',
        lockInRisk: 'Zero (Standard container runs on any cloud or on-prem)'
      }
    },
    {
      id: 'agent-runtime',
      title: 'Agent Runtime & Multi-Agent Orchestration',
      workloadProfile: 'Autonomous or semi-autonomous agents executing multi-step reasoning, tool invocations, state persistence, and human handoffs.',
      keyDecision: 'Managed Bedrock Agents vs Code-First AgentCore / LangGraph.',
      recommended: {
        svc: 'bedrock-agents',
        name: 'Amazon Bedrock Agents & AgentCore',
        why: 'Built-in memory retention, automated ReAct prompt generation, seamless Bedrock Guardrails integration, and serverless Action Group Lambda invocation.'
      },
      alternatives: [
        {
          svc: 'ecs',
          name: 'LangGraph / AutoGen / CrewAI on ECS Fargate',
          whyRejected: 'Requires self-hosting state databases (Postgres/Redis), writing bespoke retry loops, and managing long-running container lifecycles.',
          fitsWhen: 'Complex cyclical graph flows, custom multi-agent debates, or multi-modal tool logic not supported by Bedrock Agents native abstraction.'
        },
        {
          svc: 'stepfunctions',
          name: 'AWS Step Functions (Deterministic State Machine)',
          whyRejected: 'Pure Step Functions is deterministic, not autonomous; difficult to let an LLM dynamically decide which tools to call in what order.',
          fitsWhen: 'The workflow is strictly deterministic with predictable steps and mandatory compliance checkpoints.'
        }
      ],
      criteria: {
        latency: 'Multi-second (5s - 30s per multi-step agent task)',
        concurrency: 'Scales automatically per API request',
        costCeiling: 'Pay per model invocation + Lambda tool executions',
        gpuRequirement: 'None',
        teamSkill: 'Full-Stack / Python Engineers',
        operationalOverhead: 'Low to Medium',
        lockInRisk: 'Medium (Bedrock Agent schema is AWS-specific)'
      }
    },
    {
      id: 'rag-retrieval',
      title: 'Enterprise RAG Retrieval Engine',
      workloadProfile: 'Retrieving relevant contextual chunks from millions of private enterprise documents with metadata filtering and citations.',
      keyDecision: 'Turnkey managed knowledge bases vs purpose-built vector databases vs relational vector extensions.',
      recommended: {
        svc: 'bedrock-kb',
        name: 'Bedrock Knowledge Bases + OpenSearch Serverless',
        why: 'End-to-end managed pipeline: automated parsing, chunking, embedding generation, vector indexing, hybrid search, and citation generation out of the box.'
      },
      alternatives: [
        {
          svc: 'aurora',
          name: 'Amazon Aurora PostgreSQL with pgvector',
          whyRejected: 'Requires engineering team to build custom ingestion workers, chunking scripts, embedding sync pipelines, and tune HNSW/IVFFlat indexes.',
          fitsWhen: 'Enterprise already stores core relational business data in Aurora and requires transactional consistency with vector queries.'
        },
        {
          svc: 'opensearch',
          name: 'Amazon OpenSearch Service (Managed Cluster)',
          whyRejected: 'Requires dedicated cluster capacity sizing, shard management, and handling cluster index memory limits manually.',
          fitsWhen: 'Extreme scale (> 50M vectors), multi-tenant document-level access control, or complex custom BM25 analyzers.'
        }
      ],
      criteria: {
        latency: 'P95 retrieval latency 50ms - 200ms',
        concurrency: 'Scales to hundreds of queries per second',
        costCeiling: 'OpenSearch Serverless OCUs ($0.24/hr per OCU) + Embedding API calls',
        gpuRequirement: 'None',
        teamSkill: 'Data / Backend Engineers',
        operationalOverhead: 'Low (Fully managed ingestion & query API)',
        lockInRisk: 'Low (Embeddings stored in OpenSearch can be re-queried directly)'
      }
    },
    {
      id: 'vector-search',
      title: 'Vector Similarity Search Database',
      workloadProfile: 'Dedicated similarity search engine storing high-dimensional embeddings for semantic search, recommendation, and clustering.',
      keyDecision: 'Serverless search engine vs relational database with pgvector vs dedicated graph vector store.',
      recommended: {
        svc: 'opensearch',
        name: 'Amazon OpenSearch Serverless (Vector Engine)',
        why: 'Native support for hybrid search (combining dense k-NN vectors with sparse BM25 keyword matching) and Reciprocal Rank Fusion (RRF) for superior recall.'
      },
      alternatives: [
        {
          svc: 'aurora',
          name: 'Amazon Aurora PostgreSQL (pgvector)',
          whyRejected: 'Pure pgvector lacks advanced lexical BM25 tokenizers and out-of-the-box Reciprocal Rank Fusion for hybrid search.',
          fitsWhen: 'Small to medium vector scale (< 5 million vectors) and existing heavy Postgres database footprint.'
        },
        {
          svc: 's3-vectors',
          name: 'S3 Object Storage + In-Memory Index (Faiss / Annoy)',
          whyRejected: 'No real-time mutable updates; high query latency for interactive chat applications.',
          fitsWhen: 'Batch offline similarity matching over billions of static vectors.'
        }
      ],
      criteria: {
        latency: 'Query latency < 50ms',
        concurrency: 'High read concurrency',
        costCeiling: 'Scales based on OpenSearch Compute Units (OCUs)',
        gpuRequirement: 'None',
        teamSkill: 'Data / Search Engineers',
        operationalOverhead: 'Low (Serverless)',
        lockInRisk: 'Low'
      }
    },
    {
      id: 'workflow-orchestration',
      title: 'Deterministic Workflow Orchestration',
      workloadProfile: 'Coordinating multi-step AI pipelines, batch evaluation runs, human approval loops, and fault-tolerant retry workflows.',
      keyDecision: 'Managed state machine vs code-level async vs DAG scheduler.',
      recommended: {
        svc: 'stepfunctions',
        name: 'AWS Step Functions (Distributed Map & Standard Workflows)',
        why: 'Visual workflow state machine with native `.sync:2` task token callbacks for human-in-the-loop approval, automated retries with exponential backoff, and zero server maintenance.'
      },
      alternatives: [
        {
          svc: 'lambda',
          name: 'Chained AWS Lambda Functions with SQS',
          whyRejected: 'Hard to visualize execution state, difficult to handle two-way branching, and requires custom timeout and error-handling boilerplate.',
          fitsWhen: 'Simple 2-step async fan-out with no human review requirement.'
        },
        {
          svc: 'glue',
          name: 'AWS MWAA (Managed Apache Airflow)',
          whyRejected: 'Airflow is designed for scheduled batch data pipelines (hourly/daily), not for sub-second reactive interactive AI request orchestration.',
          fitsWhen: 'Existing enterprise data engineering workflows already standardized on Airflow DAGs.'
        }
      ],
      criteria: {
        latency: 'Millisecond state transitions; supports executions running up to 1 year',
        concurrency: 'High concurrent execution capacity',
        costCeiling: 'Pay per state transition ($0.025 per 1,000 transitions)',
        gpuRequirement: 'None',
        teamSkill: 'DevOps / Backend Engineers',
        operationalOverhead: 'Zero (Serverless)',
        lockInRisk: 'Medium (ASL JSON definition is AWS-specific)'
      }
    },
    {
      id: 'async-inference',
      title: 'Asynchronous & Queue-Based AI Inference',
      workloadProfile: 'Processing high-latency AI requests (audio transcription, document extraction, long-form report generation) without HTTP connection timeouts.',
      keyDecision: 'Serverless message queue vs managed asynchronous model endpoints.',
      recommended: {
        svc: 'sqs',
        name: 'Amazon SQS + Lambda / Fargate + Bedrock',
        why: 'Decoupled, durable queue buffering that smooths traffic spikes, prevents downstream 429 throttling, provides automatic dead-letter queue (DLQ) retry isolation, and costs virtually nothing.'
      },
      alternatives: [
        {
          svc: 'sm-inference',
          name: 'SageMaker Asynchronous Inference Endpoints',
          whyRejected: 'Requires running dedicated SageMaker managed endpoint infrastructure; higher cost for bursty workloads.',
          fitsWhen: 'Hosting custom open-weight models with payloads up to 1GB and processing times up to 1 hour.'
        },
        {
          svc: 'eventbridge',
          name: 'Amazon EventBridge',
          whyRejected: 'EventBridge is an event router, not a persistent buffering queue; during massive spikes without SQS buffers, consumers can be overwhelmed.',
          fitsWhen: 'Event-driven pub/sub routing across multiple decoupled subscriber microservices.'
        }
      ],
      criteria: {
        latency: 'Seconds to Minutes (Asynchronous completion notified via Webhook/WebSocket)',
        concurrency: 'Infinite buffering capacity',
        costCeiling: 'Extremely cheap (SQS: $0.40 per million requests)',
        gpuRequirement: 'None',
        teamSkill: 'Standard Backend Engineering',
        operationalOverhead: 'Minimal',
        lockInRisk: 'Zero'
      }
    },
    {
      id: 'streaming-ai',
      title: 'Real-Time Streaming AI & Telemetry',
      workloadProfile: 'Capturing high-throughput real-time user events, conversational telemetry, and telemetry pipelines for real-time fraud scoring.',
      keyDecision: 'Managed log stream vs enterprise Apache Kafka vs in-memory caching.',
      recommended: {
        svc: 'kinesis',
        name: 'Amazon Kinesis Data Streams',
        why: 'Serverless, on-demand streaming with millisecond latency, seamless integration with AWS Lambda, and built-in fan-out to S3 analytics lakes.'
      },
      alternatives: [
        {
          svc: 'msk',
          name: 'Amazon Managed Streaming for Apache Kafka (MSK)',
          whyRejected: 'Higher baseline operational cost and broker sizing complexity unless enterprise is already standardized on Kafka APIs.',
          fitsWhen: 'Existing Kafka microservices ecosystem or multi-cloud streaming compatibility requirements.'
        },
        {
          svc: 'sqs',
          name: 'Amazon SQS FIFO',
          whyRejected: 'SQS does not allow multiple independent consumer applications to replay the same event stream from arbitrary offsets.',
          fitsWhen: 'Single-consumer task queuing where strict ordering is sufficient.'
        }
      ],
      criteria: {
        latency: 'Sub-second stream processing (< 200ms)',
        concurrency: 'Gigabytes per second throughput',
        costCeiling: 'On-demand shard hours + PUT payload units',
        gpuRequirement: 'None',
        teamSkill: 'Data Streaming / Backend Engineers',
        operationalOverhead: 'Low (Serverless on-demand mode)',
        lockInRisk: 'Low'
      }
    },
    {
      id: 'document-ai',
      title: 'Document AI & OCR Extraction',
      workloadProfile: 'Extracting key-value pairs, complex tabular data, and structured text from multi-page PDFs, scanned forms, and images.',
      keyDecision: 'Pre-trained OCR service vs multimodal LLM vision vs custom computer vision pipeline.',
      recommended: {
        svc: 'textract',
        name: 'Amazon Textract + Bedrock Claude 3.5 Haiku',
        why: 'Two-stage pipeline: Textract extracts pristine layout, bounding boxes, and table cells with zero hallucination; cheap Haiku normalizes entities and handles reasoning.'
      },
      alternatives: [
        {
          svc: 'bedrock',
          name: 'Direct Bedrock Multimodal Vision (Claude 3.7 Sonnet / Nova Pro)',
          whyRejected: 'Significantly more expensive per page ($0.03-$0.08 vs $0.015) and prone to subtle numeric hallucinations on dense financial tables.',
          fitsWhen: 'Unstructured documents requiring visual layout interpretation, chart comprehension, or diagram reasoning.'
        },
        {
          svc: 'sm-training',
          name: 'Custom LayoutLM on SageMaker',
          whyRejected: 'Massive dataset labeling effort required; ongoing model drift maintenance for marginal accuracy gain.',
          fitsWhen: 'Highly repetitive, single-format documents (e.g. 100M tax forms) where bespoke models amortize cost.'
        }
      ],
      criteria: {
        latency: '1s - 5s per page (Asynchronous batch recommended for multi-page documents)',
        concurrency: 'High concurrent batch capacity',
        costCeiling: '$0.015 - $0.05 per document page',
        gpuRequirement: 'Managed by AWS',
        teamSkill: 'Data / Backend Engineers',
        operationalOverhead: 'Zero',
        lockInRisk: 'Low'
      }
    },
    {
      id: 'computer-vision',
      title: 'Computer Vision & Media Intelligence',
      workloadProfile: 'Object detection, facial analysis, content moderation, celebrity recognition, and automated video tagging.',
      keyDecision: 'Pre-built vision API vs multimodal LLM vs custom YOLO / ResNet models.',
      recommended: {
        svc: 'rekognition',
        name: 'Amazon Rekognition',
        why: 'Pre-trained, high-speed API for content moderation, facial detection, and label detection with zero training time, audited accuracy, and enterprise compliance.'
      },
      alternatives: [
        {
          svc: 'bedrock',
          name: 'Amazon Nova Canvas / Claude Vision',
          whyRejected: 'Overkill and slower for standard content moderation or facial bounding-box detection; higher cost per image.',
          fitsWhen: 'Open-ended reasoning: "Describe why this image looks fraudulent or violates branding guidelines."'
        },
        {
          svc: 'sm-training',
          name: 'Custom PyTorch YOLOv8 on SageMaker',
          whyRejected: 'Requires thousands of annotated bounding boxes, dedicated GPU endpoints, and ongoing MLOps maintenance.',
          fitsWhen: 'Specialized industrial defect detection, satellite imagery, or medical imaging.'
        }
      ],
      criteria: {
        latency: 'Real-time API response (100ms - 400ms)',
        concurrency: 'Scales to thousands of images/sec',
        costCeiling: '$0.001 per image analyzed',
        gpuRequirement: 'Managed by AWS',
        teamSkill: 'Application Engineers',
        operationalOverhead: 'Zero',
        lockInRisk: 'Low'
      }
    },
    {
      id: 'ai-api-gateway',
      title: 'AI API Fronting, Gateway & Routing',
      workloadProfile: 'Providing a secure, rate-limited, cached, and authenticated API facade in front of foundation models and AI agent microservices.',
      keyDecision: 'Serverless API Gateway vs Application Load Balancer vs Container Ingress.',
      recommended: {
        svc: 'apigw',
        name: 'Amazon API Gateway (REST / HTTP API) + Lambda',
        why: 'Native Cognito/IAM authorization, AWS WAF integration, usage plans with API key throttling, mock responses, and built-in request validation.'
      },
      alternatives: [
        {
          svc: 'alb',
          name: 'Application Load Balancer (ALB) + ECS',
          whyRejected: 'No built-in API key usage plans, per-customer quota enforcement, or request JSON schema validation without writing custom middleware.',
          fitsWhen: 'High-volume sustained steady-state HTTP traffic where ALB fixed hourly price beats API Gateway per-million pricing.'
        },
        {
          svc: 'cloudfront',
          name: 'CloudFront + Lambda@Edge',
          whyRejected: 'Lambda@Edge has strict execution timeouts (30s) and payload limits that clash with streaming LLM responses.',
          fitsWhen: 'Global edge caching for static assets and lightweight token inspection before origin routing.'
        }
      ],
      criteria: {
        latency: 'Minimal gateway latency (< 20ms)',
        concurrency: '10,000+ requests per second default quota',
        costCeiling: '$1.00 - $3.50 per million API calls',
        gpuRequirement: 'None',
        teamSkill: 'Full-Stack / API Engineers',
        operationalOverhead: 'Low (Serverless)',
        lockInRisk: 'Zero (Standard OpenAPI / REST)'
      }
    },
    {
      id: 'batch-inference',
      title: 'Large-Scale Offline Batch Inference',
      workloadProfile: 'Running millions of document classifications, offline evaluations, or synthetic dataset generation jobs overnight.',
      keyDecision: 'Serverless batch inference vs containerized batch compute vs distributed Spark.',
      recommended: {
        svc: 'bedrock',
        name: 'Amazon Bedrock Batch Inference (50% Cost Discount)',
        why: 'Official Bedrock batch mode: submit an S3 JSONL file of thousands/millions of prompts; AWS processes asynchronously within 24h at a 50% discount compared to on-demand token prices.'
      },
      alternatives: [
        {
          svc: 'batch',
          name: 'AWS Batch on Spot Instances with vLLM',
          whyRejected: 'Team must build custom container packaging, handle Spot instance interruptions, and configure chunking scripts.',
          fitsWhen: 'Processing with custom open-weight models or proprietary embedding models not available on Bedrock.'
        },
        {
          svc: 'glue',
          name: 'AWS Glue / Amazon EMR Spark Pipeline',
          whyRejected: 'High cluster setup and tuning overhead; Spark executor memory tuning can be brittle for Python LLM inference.',
          fitsWhen: 'Large-scale ETL pipeline where LLM inference is just one step in a multi-terabyte Spark data transformation.'
        }
      ],
      criteria: {
        latency: 'Asynchronous (Completed within 24 hours)',
        concurrency: 'Millions of prompts per batch job',
        costCeiling: '50% cheaper than on-demand API token rates',
        gpuRequirement: 'Managed by AWS',
        teamSkill: 'Data / Analytics Engineers',
        operationalOverhead: 'Zero (File in S3 -> File out S3)',
        lockInRisk: 'Low'
      }
    }
  ]
};
