window.ATLAS.architectures = [
  {
    id: 'rag-assistant', name: 'RAG assistant on Bedrock',
    short: 'Ground an LLM in your own documents, with citations, access control and guardrails.',
    when: 'You need answers grounded in private or fast-changing content, and fine-tuning is the wrong tool. Start here for most enterprise assistants.',
    flow: [
      { l: 'Documents', s: 's3' },
      { l: 'Parse + chunk + embed', s: 'bedrock-kb' },
      { l: 'Vector index', s: 'opensearch' },
      { l: 'User + auth', s: 'cognito' },
      { l: 'Guardrails', s: 'bedrock-guardrails' },
      { l: 'LLM answer', s: 'bedrock' }
    ],
    steps: [
      [0, 'Source documents (manuals, policies, tickets) are stored in [[s3]]. An upload or schedule triggers an ingestion sync.'],
      [1, '[[bedrock-kb|Knowledge Bases]] parses and chunks each document and calls an embedding model for each chunk.'],
      [2, 'Vectors and metadata (tenant, department, document ID) are written to a vector index such as [[opensearch]].'],
      [3, 'A user signs in through [[cognito]]; their group claims travel with each request.'],
      [1, 'The question is embedded and the index is searched, with a **metadata filter** derived from the user\'s claims so they only retrieve documents they may see.'],
      [4, 'Input and output pass through [[bedrock-guardrails|Guardrails]]: PII masking, denied topics, grounding check.'],
      [5, '[[bedrock|Bedrock]] generates the answer from the retrieved chunks and returns it with citations.']
    ],
    why: [
      'Knowledge stays outside the model, so updating a document updates answers without retraining.',
      'Citations make answers verifiable, which builds user trust and eases compliance.',
      'Metadata filtering gives per-user access control without a separate index per user.',
      'Every component is managed, so the team spends time on quality, not servers.'
    ],
    fails: [
      'Bad chunking or parsing: the right document is indexed but the right passage never surfaces. Measure retrieval recall on a test set.',
      'Stale index: sync lag means new policies are not yet searchable.',
      'Access-control leak: a missing filter returns restricted chunks. Test with users from different groups.',
      'Throttling at launch when Bedrock quotas were not raised ahead of time.'
    ]
  },
  {
    id: 'llm-serving', name: 'Self-hosted LLM serving at scale',
    short: 'Serve an open-weight or fine-tuned model on GPUs with queues, autoscaling and streaming.',
    when: 'You need a model Bedrock does not offer, tight cost control at steady high volume, custom serving logic, or strict data-locality. Expect to own more operations.',
    flow: [
      { l: 'Edge + rate limits', s: 'cloudfront' },
      { l: 'Front door', s: 'alb' },
      { l: 'Model servers (vLLM)', s: 'eks' },
      { l: 'GPU nodes', s: 'ec2' },
      { l: 'Weights', s: 's3' },
      { l: 'Metrics + scaling', s: 'cloudwatch' }
    ],
    steps: [
      [0, 'Clients reach [[cloudfront]] with [[waf]] rate limits attached, which blocks abusive callers before they cost GPU time.'],
      [1, 'Requests hit an [[alb]] using least-outstanding-requests balancing and a long enough idle timeout for streaming.'],
      [2, 'Pods running a serving engine (such as vLLM) batch concurrent requests continuously and stream tokens back.'],
      [3, 'Pods are scheduled on [[ec2]] GPU nodes that [[eks]] provisions on demand; reserved capacity covers the baseline.'],
      [4, 'On start, pods load weights from [[s3]] (or a shared cache) and report ready only when the model is loaded.'],
      [5, 'Queue depth, GPU utilisation and time-to-first-token feed [[cloudwatch]]; autoscaling reacts to them, not to CPU.']
    ],
    why: [
      'Continuous batching in the serving engine gives far better GPU use than one request per GPU.',
      'Separating edge, balancing and serving lets each layer scale and fail on its own.',
      'Scaling on concurrency or queue depth tracks real load, since LLM requests vary hugely in cost.',
      'Reserved capacity plus on-demand burst balances cost and availability.'
    ],
    fails: [
      'Scale-out lag: new GPU nodes take minutes to start and load weights, so a spike outruns scaling. Keep warm headroom.',
      'Idle timeout or health-check settings kill long generations or slow-starting pods.',
      'GPU capacity shortage at the moment you need to scale. Use reservations, and diversify instance types.',
      'No cost guard: an unbounded client can burn GPU hours. Enforce quotas per key.'
    ]
  },
  {
    id: 'training-mlops', name: 'Train, evaluate and promote (MLOps)',
    short: 'A repeatable pipeline from raw data to a monitored production model, with a retraining loop.',
    when: 'You own a model (classic ML or fine-tuned LLM) and need it retrained, audited and promoted safely, repeatedly.',
    flow: [
      { l: 'Raw data', s: 's3' },
      { l: 'Prepare data', s: 'glue' },
      { l: 'Train', s: 'sm-training' },
      { l: 'Pipeline + registry', s: 'sm-pipelines' },
      { l: 'Endpoint', s: 'sm-inference' },
      { l: 'Monitor', s: 'sm-monitor' }
    ],
    steps: [
      [0, 'Raw events and files accumulate in [[s3]], the lake that every later step reads from.'],
      [1, '[[glue]] jobs clean, join and write Parquet datasets, with data-quality rules that fail the run on bad data.'],
      [2, '[[sm-training|Training jobs]] fit the model, checkpointing to S3; huge jobs move to [[hyperpod]].'],
      [3, '[[sm-pipelines|Pipelines]] evaluate against a held-out set, compare with the current champion, and register a passing model as pending approval.'],
      [4, 'Approval triggers deployment to a [[sm-inference|SageMaker endpoint]], with shadow or canary traffic before full cutover.'],
      [5, '[[sm-monitor|Model Monitor]] watches captured traffic for drift; an alarm starts the pipeline again through [[eventbridge]].']
    ],
    why: [
      'Everything is versioned (data, code, model, approval), so any production model can be reproduced and audited.',
      'The evaluation gate stops regressions reaching production automatically.',
      'The monitoring loop turns "the model got worse" from a surprise into an alert.',
      'Managed training means paying for GPUs only while they run.'
    ],
    fails: [
      'Training-serving skew: features computed differently offline and online. Use one definition ([[sm-feature-store|Feature Store]]).',
      'Weak evaluation set: the gate passes models that fail on real traffic. Refresh it from production samples.',
      'Late labels make quality monitoring blind for days; track proxy metrics meanwhile.',
      'Automatic retrain-on-drift can chase noise. Require human approval for promotion.'
    ]
  },
  {
    id: 'agent-platform', name: 'Tool-using agent platform',
    short: 'Authenticated agents that call internal APIs, remember context, and stay observable and safe.',
    when: 'The assistant must take actions (look up records, create tickets, run analyses), not only answer questions.',
    flow: [
      { l: 'User sign-in', s: 'cognito' },
      { l: 'API entry', s: 'apigw' },
      { l: 'Agent runtime', s: 'agentcore' },
      { l: 'Model', s: 'bedrock' },
      { l: 'Tools', s: 'lambda' },
      { l: 'State + memory', s: 'dynamodb' }
    ],
    steps: [
      [0, 'The user authenticates with [[cognito]]; the token identifies them, their tenant and their groups.'],
      [1, '[[apigw|API Gateway]] validates the token, applies per-user throttles, and forwards to the agent.'],
      [2, 'The agent runs in [[agentcore|AgentCore Runtime]] in an isolated session, with its reasoning loop written in your framework of choice.'],
      [3, 'Each reasoning step calls [[bedrock]]; [[bedrock-guardrails|Guardrails]] screen inputs and outputs.'],
      [4, 'Tool calls go to [[lambda]] functions that act with the user\'s delegated, minimally-scoped permissions and validate every parameter.'],
      [5, 'Conversation state and long-term facts persist in [[dynamodb]] (or AgentCore Memory) so sessions can resume.']
    ],
    why: [
      'Identity flows end to end, so every tool call can be authorised and attributed to a real user.',
      'Isolating sessions prevents one user\'s context from leaking to another.',
      'Tools are ordinary, testable functions with explicit schemas and server-side validation.',
      'Traces of each step make non-deterministic behaviour debuggable.'
    ],
    fails: [
      'Prompt injection through retrieved or tool-returned text that tells the agent to do something harmful. Treat tool output as untrusted data and limit tool permissions.',
      'Runaway loops that burn tokens. Cap steps, tokens and wall-clock time.',
      'Ambiguous tool descriptions lead to wrong tool choice.',
      'Over-broad tool roles turn a model mistake into a data breach.'
    ]
  },
  {
    id: 'document-intelligence', name: 'Intelligent document processing',
    short: 'Turn scans and PDFs into validated structured data, with human review for the uncertain cases.',
    when: 'High volumes of invoices, claims, forms or contracts need extracting, checking and routing.',
    flow: [
      { l: 'Upload', s: 's3' },
      { l: 'Orchestrate', s: 'stepfunctions' },
      { l: 'OCR + structure', s: 'textract' },
      { l: 'PII + entities', s: 'comprehend' },
      { l: 'Reason + validate', s: 'bedrock' },
      { l: 'Store results', s: 'dynamodb' }
    ],
    steps: [
      [0, 'A document lands in [[s3]]; an event starts a workflow.'],
      [1, '[[stepfunctions|Step Functions]] coordinates the steps, with retries and a dead-letter path.'],
      [2, '[[textract]] extracts text, tables and key-value pairs with confidence scores.'],
      [3, '[[comprehend]] detects and redacts PII before any model sees the text.'],
      [4, 'An LLM on [[bedrock]] maps messy fields to your schema and checks them against business rules.'],
      [1, 'Low-confidence or rule-failing documents pause on a task token for human review, then resume.'],
      [5, 'Validated data is saved to [[dynamodb]] or the lake, and the original is archived with its audit trail.']
    ],
    why: [
      'Specialist services handle extraction cheaply and predictably; the LLM is used only for judgement.',
      'Confidence-based routing sends people only the cases that need them.',
      'The workflow engine provides retries, state and an audit trail with no custom plumbing.',
      'Redaction happens before generative steps, limiting data exposure.'
    ],
    fails: [
      'Poor scan quality caps accuracy. Fix capture where possible.',
      'LLM hallucinating a field value that does not exist. Require extracted values to appear in the source text.',
      'Workflow payload limits exceeded by passing document text through states. Pass S3 references.',
      'Backfills overwhelm Textract throttles. Use queues and concurrency limits.'
    ]
  },
  {
    id: 'realtime-features', name: 'Real-time features and scoring',
    short: 'Stream events into fresh features and score them at request time for fraud, ranking or recommendations.',
    when: 'Decisions depend on what a user did seconds ago, and latency is measured in tens of milliseconds.',
    flow: [
      { l: 'Events', s: 'kinesis' },
      { l: 'Feature compute', s: 'lambda' },
      { l: 'Feature store', s: 'sm-feature-store' },
      { l: 'Cache', s: 'elasticache' },
      { l: 'Scoring endpoint', s: 'sm-inference' },
      { l: 'Training lake', s: 's3' }
    ],
    steps: [
      [0, 'Clickstream and transaction events flow into [[kinesis]], ordered per user.'],
      [1, 'Consumers compute rolling features (counts, averages, last-seen) as events arrive.'],
      [2, 'Features are written to the [[sm-feature-store|Feature Store]]: the online store for serving, the offline store for training.'],
      [3, 'Hot features for the most active users are kept in [[elasticache]] for sub-millisecond reads.'],
      [4, 'At request time the app fetches features by ID and calls a [[sm-inference|real-time endpoint]] for a score.'],
      [5, 'The same events and features land in [[s3]], where point-in-time-correct training sets are built.']
    ],
    why: [
      'One feature definition serves both training and inference, avoiding skew.',
      'Streaming keeps features fresh without recomputing batch tables.',
      'Caching shields the feature store and endpoint at peak.',
      'Everything lands in the lake for retraining and audit.'
    ],
    fails: [
      'Hot partition key throttles one shard of the stream and delays features for those users.',
      'Late or out-of-order events produce wrong rolling features.',
      'Online and offline values diverge (eventual consistency), skewing training.',
      'Endpoint scale-out is slower than a traffic spike, causing timeouts; keep headroom.'
    ]
  }
];

window.ATLAS.decisions = [
  {
    title: 'Where should the model run?',
    intro: 'Start at the top and move down only when a requirement forces you to. Each step down buys control and costs operational work.',
    cols: ['Option', 'Best for', 'You manage', 'Watch out for'],
    rows: [
      ['[[bedrock|Bedrock on-demand]]', 'Most LLM features, bursty or modest volume', 'Prompts, quotas, retries', 'Per-model throttling; model retirement'],
      ['[[bedrock|Bedrock Provisioned Throughput]]', 'Steady high volume needing guaranteed capacity, or custom models', 'Commitment sizing', 'Paying for idle capacity'],
      ['[[sm-inference|SageMaker real-time]]', 'Your own or open-weight model with steady traffic', 'Instance sizing, scaling, container', 'Billing while idle; slow scale-out'],
      ['[[sm-inference|SageMaker asynchronous]]', 'Large payloads, long processing, spiky work', 'Result handling', 'First-request latency after scale to zero'],
      ['[[ecs|ECS]] / [[eks|EKS]] on GPUs', 'Custom serving stacks, maximum cost control at scale', 'Nearly everything', 'GPU capacity, image start-up time, operations load'],
      ['[[lambda|Lambda]]', 'Small CPU models, glue and tool execution', 'Package and cold starts', 'No GPU, 15-minute limit']
    ],
    rule: 'Use Bedrock until a concrete requirement (model, throughput, cost, locality) rules it out, then SageMaker, and containers on EKS or ECS last.'
  },
  {
    title: 'Which vector store?',
    intro: 'All of these answer "nearest embeddings to this one". They differ in cost shape, latency and what else they can do in the same query.',
    cols: ['Store', 'Strength', 'Latency / scale profile', 'Choose when'],
    rows: [
      ['[[aurora|Aurora / RDS pgvector]]', 'Vectors beside relational data, SQL filters and joins', 'Good up to millions of vectors; bounded by instance memory', 'You already run Postgres and want one database'],
      ['[[opensearch|OpenSearch]]', 'Hybrid keyword + vector search, high concurrency', 'Low latency, scales out; memory-heavy', 'Search-centric apps with heavy filtering'],
      ['[[s3-vectors|S3 Vectors]]', 'Very low storage cost at huge scale', 'Higher latency, lower QPS', 'Large, colder collections where cost dominates'],
      ['[[elasticache|ElastiCache / MemoryDB]]', 'In-memory speed; semantic caching', 'Sub-millisecond to low ms; RAM-limited', 'Caches and ultra-low-latency lookups'],
      ['[[neptune|Neptune Analytics]]', 'Vectors plus graph traversal (GraphRAG)', 'In-memory; sized by graph', 'Answers depend on relationships'],
      ['[[kendra|Kendra GenAI Index]]', 'Managed retrieval with connectors and ACLs', 'Managed; hourly index fee', 'Enterprise sources and permission fidelity matter more than cost']
    ],
    rule: 'Begin with the store you already operate. Move to a dedicated one when filtering, scale or latency measurably fail.'
  },
  {
    title: 'How do I orchestrate the work?',
    intro: 'Orchestration choices differ in who owns state, how retries work, and how well they fit ML steps.',
    cols: ['Tool', 'Model', 'Best for', 'Limits to remember'],
    rows: [
      ['[[stepfunctions|Step Functions]]', 'State machine with managed state', 'Multi-service workflows, approvals, fan-out over S3', 'Per-state payload cap; history size on Standard'],
      ['[[sm-pipelines|SageMaker Pipelines]]', 'ML-specific DAG', 'Train / evaluate / register / deploy', 'Limited non-ML branching'],
      ['[[sqs|SQS]] + workers', 'Queue and pull', 'Smoothing load to slow consumers', 'You build the workflow logic'],
      ['[[eventbridge|EventBridge]]', 'Event routing', 'Reacting to events, scheduling, decoupling', 'No state or ordering of its own'],
      ['[[batch|AWS Batch]]', 'Job queue on managed compute', 'Large offline compute (embedding, preprocessing)', 'Not a workflow engine on its own']
    ],
    rule: 'Use EventBridge to notice, Step Functions to coordinate, SQS to buffer, and Batch or SageMaker to compute.'
  },
  {
    title: 'How do I make the model better at my task?',
    intro: 'Try these in order. Each is more expensive and slower to change than the one before it.',
    cols: ['Approach', 'What changes', 'Good for', 'Cost / effort'],
    rows: [
      ['Prompt engineering', 'Instructions and examples', 'Format, tone, simple tasks', 'Minutes; free'],
      ['RAG ([[bedrock-kb|Knowledge Bases]])', 'What the model can see at question time', 'Private, current or large knowledge', 'Days; ongoing retrieval cost'],
      ['Fine-tuning on [[bedrock|Bedrock]]', 'Model weights, managed', 'Style, format, narrow tasks with labelled data', 'Days; training plus provisioned hosting for custom models'],
      ['Fine-tuning on [[sm-training|SageMaker]]', 'Weights of an open model, full control', 'Specialised domains, smaller cheaper models', 'Weeks; GPU training plus self-hosting'],
      ['Continued pre-training', 'Broad domain knowledge in weights', 'Large unlabelled domain corpora', 'Heavy; cluster-scale ([[hyperpod|HyperPod]])']
    ],
    rule: 'Prompt first, add RAG for knowledge, fine-tune for behaviour, and only pre-train if you have a very large domain corpus and a real reason.'
  }
];
