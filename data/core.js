/* Shared registry + category definitions.
   Every service file calls S({...}). Schema:
   id, cat, name, tag, doc (path under docs.aws.amazon.com), what,
   flow:[labels], steps:[[flowIndex, text]], gotchas:[], edges:[], ml:[], pairs:[ids], cost
   Text supports `code`, **bold**, and [[service-id]] / [[service-id|label]] links. */
window.ATLAS = { categories: [], services: [], architectures: [], decisions: [] };
window.S = function (o) { window.ATLAS.services.push(o); };

window.ATLAS.categories = [
  {
    id: 'compute', name: 'Compute & Accelerators', hue: 18,
    short: 'GPUs, AWS silicon, containers, functions and batch schedulers.',
    intro: 'AI systems are bottlenecked by two things: accelerator capacity and how quickly you can keep it busy. This category covers where code and models actually run, from a single Lambda function to thousands of GPUs wired together.\n\nThe key split is **spiky and small** (Lambda, Fargate) versus **sustained and accelerated** (EC2 GPU, Trainium, EKS). Most real systems use both: a thin serverless layer in front and a fat accelerated layer behind it.',
    lens: 'Ask three questions: does it need a GPU or Neuron core, how long does one unit of work run, and how bursty is the load? Those answers pick the service for you.'
  },
  {
    id: 'storage', name: 'Storage', hue: 42,
    short: 'Where datasets, checkpoints, models and embeddings live.',
    intro: 'Storage choices decide training throughput and the bill. Object storage is the system of record for almost everything in ML: raw data, features, checkpoints, model artifacts. File systems and block storage appear when a job needs POSIX semantics or very high sustained throughput.',
    lens: 'Keep **S3 as the source of truth**, and add a faster tier (FSx for Lustre, S3 Express One Zone, local NVMe) only where a profiler shows GPUs waiting on data.'
  },
  {
    id: 'databases', name: 'Databases & Vector Stores', hue: 145,
    short: 'Operational data, caches, graphs and similarity search.',
    intro: 'Generative AI made the database layer matter more: retrieval needs a vector index, agents need low-latency memory, and chat apps need durable state. On AWS you can add vector search to a database you already run, or use a purpose-built store.',
    lens: 'Prefer adding vectors to a store you already operate until scale, latency or filtering needs prove otherwise. Moving embeddings later is easy; running one more database is permanent.'
  },
  {
    id: 'analytics', name: 'Data & Analytics', hue: 178,
    short: 'ETL, SQL over the lake, big-data engines, governance.',
    intro: 'Models are only as good as the data pipeline behind them. These services turn raw files and events into clean, governed, queryable datasets: the training sets, feature tables, and evaluation data of an ML system.',
    lens: 'Think in layers: **land** raw data in S3, **catalog** it, **transform** it, **query** it, **govern** it. Each layer has one obvious AWS service.'
  },
  {
    id: 'streaming', name: 'Streaming & Orchestration', hue: 208,
    short: 'Queues, streams, events and workflows that glue systems together.',
    intro: 'Production AI is asynchronous. Embedding jobs queue up, user events stream into feature pipelines, and multi-step agent or training workflows need retries and state. These services carry messages and coordinate work.',
    lens: 'Choose by delivery semantics and replay needs: a **queue** hands each message to one worker, a **stream** keeps an ordered log many readers can replay, and an **event bus** routes by rules.'
  },
  {
    id: 'genai', name: 'Generative AI', hue: 268,
    short: 'Foundation models, RAG, agents and guardrails as managed services.',
    intro: 'Amazon Bedrock is the managed front door to foundation models, with the supporting pieces for retrieval, agents, safety and evaluation. If you want to call, ground and govern LLMs without running GPU fleets, start here.',
    lens: 'Start with the highest-level service that meets the requirement (Bedrock API, then Knowledge Bases, then Agents), and drop down to SageMaker or raw EC2 only when you need control the managed layer will not give you.'
  },
  {
    id: 'ml', name: 'ML Platform (SageMaker)', hue: 300,
    short: 'Train, tune, register, deploy and monitor your own models.',
    intro: 'Amazon SageMaker AI is the managed platform for the classic ML lifecycle and for training or hosting open-weight and custom models. It covers data labeling, notebooks, distributed training, pipelines, feature storage, model registry, and several kinds of inference endpoint.',
    lens: 'Use SageMaker when **you own the model**: custom training, fine-tuning, or hosting open weights. Use Bedrock when you are consuming a model someone else trains.'
  },
  {
    id: 'aiservices', name: 'Pre-built AI Services', hue: 332,
    short: 'API-call AI for vision, text, speech, search and personalization.',
    intro: 'These are task-specific models behind an API: no training, no infrastructure. They remain the fastest route for well-defined tasks like OCR, transcription, or translation, and they pair naturally with LLMs, which are strong at reasoning but wasteful at extraction.',
    lens: 'Use a specialist service for the **extraction** step and an LLM for the **reasoning** step. It is usually cheaper, faster and easier to audit than asking an LLM to do both.'
  },
  {
    id: 'networking', name: 'Networking & Delivery', hue: 232,
    short: 'How requests reach models, and how services talk privately.',
    intro: 'Latency, privacy and streaming behaviour of AI endpoints are largely decided by the network path. This category covers fronting a model with an API, keeping traffic off the public internet, and delivering responses globally.',
    lens: 'Draw the request path end to end and note every timeout and payload limit on it. The smallest one wins, and it is usually not the one you set.'
  },
  {
    id: 'security', name: 'Security & Identity', hue: 6,
    short: 'Identity, encryption, secrets, and protection for data and endpoints.',
    intro: 'AI workloads concentrate sensitive data and expensive resources. A stolen role can run up a five-figure GPU bill, and a careless prompt log can leak customer data. These services are the controls that prevent both.',
    lens: 'Start from **identity** (who can call what), then **data** (who can read it, encrypted with whose key), then **network** (what can reach it).'
  },
  {
    id: 'ops', name: 'Observability & Operations', hue: 88,
    short: 'Metrics, logs, audit trails and infrastructure as code.',
    intro: 'ML systems fail quietly: latency creeps up, quality drifts, costs spike. Observability turns those into signals, and infrastructure as code makes the whole platform reproducible.',
    lens: 'Instrument three layers: **infrastructure** (GPU utilisation, queue depth), **service** (latency, errors, throttles), and **model quality** (drift, eval scores, guardrail hits).'
  }
];
