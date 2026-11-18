S({
  id: 'bedrock', cat: 'genai', name: 'Amazon Bedrock', doc: 'bedrock/',
  tag: 'One API to many foundation models, with the controls to run them in production.',
  what: 'Bedrock is a fully managed service for calling foundation models from Anthropic, Amazon (Nova, Titan), Meta, Mistral, Cohere and others through a consistent API. There is no GPU fleet to run. You send a prompt and get tokens back.\n\nThe **Converse API** gives a unified request shape across models (messages, tools, system prompts, streaming), so swapping models is mostly a one-line change. Around it sit [[bedrock-kb|Knowledge Bases]], [[bedrock-agents|Agents]], [[bedrock-guardrails|Guardrails]], evaluation, prompt management, batch inference, fine-tuning and model import.',
  flow: ['Your app', 'IAM auth + quota check', 'Guardrails (optional)', 'Inference profile / model', 'Streaming tokens', 'Logs + metrics'],
  steps: [
    [0, 'Your app calls `Converse` (or `InvokeModel`) with a model ID or inference profile, a system prompt, messages, and optional tool definitions.'],
    [1, 'Bedrock authenticates via IAM and checks your quotas (requests and tokens per minute) for that model in that Region.'],
    [2, 'If configured, a guardrail screens the input for denied topics, PII and prompt attacks.'],
    [3, 'The request routes to the model. A **cross-Region inference profile** can spread it across Regions for more throughput.'],
    [4, 'Tokens stream back (`ConverseStream`) or return as one response. The output guardrail screens them too.'],
    [5, 'Invocation metrics go to [[cloudwatch]]; optional logging writes prompts and responses to [[s3]] or CloudWatch Logs.']
  ],
  gotchas: [
    '**Throttling is the production surprise.** Quotas are per model, per Region, in requests and tokens per minute. For some models, output tokens count extra against the token quota, so long outputs consume it faster than expected. Request increases early, and add retry with jittered backoff.',
    '**Cross-Region inference changes data locality.** Requests may be processed in other Regions of the same geography. Check this against your data-residency rules.',
    '**Models are retired.** Each model has a lifecycle (active, legacy, end of life). Pin versions deliberately and keep a migration path and regression evals.',
    '**Access setup.** Some models require a one-time use-case form or are enabled per Region. A `AccessDeniedException` is often this, not IAM.',
    '**Cost scales with tokens.** Large system prompts, long chat histories and verbose outputs multiply spend; trim context and use prompt caching.'
  ],
  edges: [
    'Pricing modes: **on-demand** (per token), **batch** (lower price, asynchronous, JSONL in S3), and **Provisioned Throughput** (reserved model units, needed for some custom models).',
    '**Prompt caching** discounts repeated prefixes (large system prompts, documents), but cache entries expire after a short time.',
    'Context windows, tool support, and image or document inputs differ per model. Capabilities in the Converse API are not uniform.',
    'Prompts and completions are not used to train the base models and are not shared with model providers; confirm current terms for your compliance needs.'
  ],
  ml: [
    'Default way to add LLM features without operating GPUs: chat, summarisation, extraction, classification, code, and agents.',
    'Build RAG with [[bedrock-kb|Knowledge Bases]]; add tools with [[bedrock-agents|Agents]]; add safety with [[bedrock-guardrails|Guardrails]].',
    'Use **batch inference** for offline jobs: labelling a corpus, generating synthetic data, bulk summarisation, at lower cost.',
    'Evaluate models side by side with Bedrock evaluations before switching, using your own prompts and a judge model.'
  ],
  pairs: ['bedrock-kb', 'bedrock-agents', 'bedrock-guardrails', 'nova', 'lambda', 'servicequotas', 'cloudwatch'],
  cost: 'On-demand: per 1,000 input and output tokens, varying widely by model. Batch is discounted. Provisioned Throughput is hourly with a commitment. Track tokens per feature from day one.'
});

S({
  id: 'bedrock-kb', cat: 'genai', name: 'Bedrock Knowledge Bases', doc: 'bedrock/latest/userguide/knowledge-base.html',
  tag: 'Managed RAG: ingest your documents, then retrieve and ground answers with citations.',
  what: 'Knowledge Bases automate the RAG pipeline. You point it at a data source (S3, web crawl, or connectors such as Confluence, SharePoint and Salesforce); it parses documents, **chunks** them, creates embeddings with a model you choose, and stores them in a **vector store** (OpenSearch Serverless, Aurora PostgreSQL, Neptune Analytics, S3 Vectors, and several third-party stores).\n\nAt query time, `Retrieve` returns matching chunks, and `RetrieveAndGenerate` also calls an LLM to answer with citations.',
  flow: ['Data source (S3 etc.)', 'Parse + chunk', 'Embedding model', 'Vector store', 'Retrieve (+ rerank)', 'LLM answer + citations'],
  steps: [
    [0, 'You configure sources and start an **ingestion job** (sync). Only changed documents are re-processed on later syncs.'],
    [1, 'Documents are parsed (including tables and images, optionally with a foundation model) and split by your chunking strategy: fixed, hierarchical, semantic or custom.'],
    [2, 'Each chunk is turned into a vector with the embedding model, for example Titan Text Embeddings or Cohere Embed.'],
    [3, 'Vectors and metadata are stored in the chosen vector store.'],
    [4, 'At query time the question is embedded, nearest chunks are found (hybrid search and metadata filters supported), and results can be reranked.'],
    [5, 'The retrieved context goes to the generation model, which answers and returns source citations.']
  ],
  gotchas: [
    '**Sync is not real time.** New or changed documents become searchable only after an ingestion job completes. Plan for that lag.',
    '**Chunking decides quality more than the model does.** Too small loses context, too big dilutes relevance. Test strategies on real questions.',
    '**Access control is on you.** Retrieval does not know who the user is. Enforce per-user document permissions with metadata filters, or separate knowledge bases per tenant.',
    '**The default vector store has a baseline cost.** Quick-create with OpenSearch Serverless carries a minimum running cost even when idle.',
    '**Embedding model is a one-way door.** Changing it means re-ingesting everything.'
  ],
  edges: [
    'Embedding models have input token limits; chunk sizes must fit under them.',
    'Ingestion has quotas on file size, number of files and concurrent jobs.',
    'Structured-data retrieval can translate questions to SQL for warehouses, which is a separate feature with its own caveats.',
    'You can skip generation and use `Retrieve` alone, feeding chunks into your own prompt for full control.'
  ],
  ml: [
    'Enterprise Q&A over manuals, policies and wikis, with citations that let users verify answers.',
    'Attach to a [[bedrock-agents|Bedrock Agent]] so the agent retrieves knowledge as one of its tools.',
    'Use `Retrieve` as the retrieval layer in a custom RAG app, owning prompts and ranking.'
  ],
  pairs: ['s3', 'opensearch', 'aurora', 's3-vectors', 'neptune', 'bedrock', 'bedrock-agents'],
  cost: 'Embedding tokens at ingestion, vector-store costs (often dominant), query-time embedding, and generation tokens. Reranking and advanced parsing add per-use fees.'
});

S({
  id: 'bedrock-agents', cat: 'genai', name: 'Bedrock Agents', doc: 'bedrock/latest/userguide/agents.html',
  tag: 'Managed tool-using LLM agents that plan, call your APIs, and consult knowledge bases.',
  what: 'An **agent** is an LLM given instructions, a set of tools, and optionally a knowledge base, which loops: reason about the goal, choose a tool, observe the result, repeat until done. Tools are defined as **action groups**, backed by Lambda functions or returned to your application for execution (**return of control**).\n\nBedrock Agents manages the orchestration loop, session memory, tracing, and versioning. Multi-agent collaboration lets a supervisor agent delegate to specialist agents.',
  flow: ['User request', 'Agent orchestrator', 'LLM reasoning', 'Action group (Lambda)', 'Knowledge base', 'Final answer'],
  steps: [
    [0, 'A user sends a request to an agent alias with a session ID.'],
    [1, 'The orchestrator builds a prompt from the agent instructions, tool schemas, session history and the request.'],
    [2, 'The LLM decides whether to answer or to call a tool or knowledge base, and with which parameters.'],
    [3, 'Bedrock invokes the action group (a [[lambda]] function described by an OpenAPI schema) with those parameters.'],
    [4, 'Results (and any [[bedrock-kb|knowledge base]] retrieval) are fed back to the LLM, which may loop again.'],
    [5, 'When the LLM decides it has enough, it produces the final response; the full reasoning trace is available for debugging.']
  ],
  gotchas: [
    '**Latency and cost stack per loop.** Each reasoning step is a model call. A simple-looking task can take many calls. Cap steps and keep tool outputs short.',
    '**Tool descriptions are the real prompt.** Vague schemas lead to wrong tool choices or bad parameters. Write them like documentation for a new colleague.',
    '**Non-determinism.** The same request can take different paths. Evaluate on a test set, not on one demo.',
    '**Action group Lambdas run with your permissions.** An LLM-chosen call is still a real call; apply least privilege and validate parameters server-side.',
    'Sessions expire after an idle period, after which memory is gone unless you persist it.'
  ],
  edges: [
    'Return of control keeps sensitive execution in your own application, so Bedrock never calls the API directly. Useful for approvals.',
    'Prompt overrides give control over orchestration prompts but make upgrades and debugging harder.',
    'Agents are versioned; an alias points to a version, so you can roll back.',
    'Attach a guardrail so inputs and final outputs are screened.'
  ],
  ml: [
    'Customer-support or IT-ops assistants that look up records, create tickets, and answer from documentation.',
    'Workflow automation where steps depend on the content of a request.',
    'Prototype quickly here; move to code-first frameworks on [[agentcore]] if you need custom control flow.'
  ],
  pairs: ['bedrock', 'bedrock-kb', 'bedrock-guardrails', 'lambda', 'agentcore', 'iam'],
  cost: 'Pay for the model tokens of every reasoning step plus any Lambda and retrieval used. No separate orchestration fee in most configurations; verify.'
});

S({
  id: 'bedrock-guardrails', cat: 'genai', name: 'Bedrock Guardrails', doc: 'bedrock/latest/userguide/guardrails.html',
  tag: 'Configurable safety filters on model inputs and outputs, usable with any model.',
  what: 'Guardrails evaluates text (and images) against policies you define: **content filters** (hate, insults, sexual, violence, misconduct, prompt attacks), **denied topics**, **word filters**, **sensitive information** detection (block or mask PII), **contextual grounding checks** (is the answer supported by the source?), and **Automated Reasoning** checks for rule-based validation.\n\nThe standalone **ApplyGuardrail** API works with *any* model or text, including models outside Bedrock.',
  flow: ['User input', 'Input guardrail', 'Model', 'Output guardrail', 'Safe response'],
  steps: [
    [0, 'The user prompt arrives at your app.'],
    [1, 'The input is checked against the guardrail: blocked topics, PII, prompt-injection patterns.'],
    [2, 'If it passes, the model generates a response (or the request is blocked with a configured message).'],
    [3, 'The output is checked again: harmful content, PII leakage, and optionally grounding against retrieved sources.'],
    [4, 'The user receives the original, masked, or replaced response.']
  ],
  gotchas: [
    '**Filters give false positives and negatives.** Tune strengths against your real traffic and measure; no filter set is perfect.',
    '**Some checks need tagged inputs.** Prompt-attack detection and grounding checks only evaluate parts of the request that you mark as user input or as grounding source.',
    '**It is not authorisation.** A guardrail cannot decide whether this user may see this record. Enforce that in your data layer.',
    'Streaming responses can be evaluated synchronously (safer, adds delay) or asynchronously (faster, but content may reach the user before a block).',
    'Pricing is per volume of text evaluated per policy, so many policies on long documents add up.'
  ],
  edges: [
    'Language support differs per filter. Check coverage for your user base.',
    'Applying the same guardrail to many apps centralises policy but couples their change cycles; version guardrails.',
    'Masking PII in logs requires separate handling from masking it in responses.'
  ],
  ml: [
    'Compliance layer for customer-facing chatbots (block off-topic advice, redact PII).',
    'Hallucination reduction in RAG through grounding checks against retrieved chunks.',
    'Screen inputs and outputs of self-hosted models via `ApplyGuardrail` on [[sm-inference|SageMaker endpoints]].'
  ],
  pairs: ['bedrock', 'bedrock-agents', 'bedrock-kb', 'macie', 'cloudwatch'],
  cost: 'Per unit of text processed by each enabled policy type. Enabling only needed policies keeps it modest.'
});

S({
  id: 'agentcore', cat: 'genai', name: 'Amazon Bedrock AgentCore', doc: 'bedrock-agentcore/',
  tag: 'Production runtime, memory, identity and tooling for agents built with any framework or model.',
  what: 'AgentCore is a set of modular services for running agents you build in code (with frameworks such as Strands Agents, LangGraph or CrewAI) with any model, not only Bedrock models. Components include **Runtime** (serverless hosting with per-session isolation and support for long-running work), **Memory** (short- and long-term), **Gateway** (turns APIs and Lambda functions into tools, including MCP-compatible tools), **Identity** (agent and user authentication and delegated access), **Observability**, plus managed **Browser** and **Code Interpreter** tools.\n\nThink of it as the platform layer under custom agents, where [[bedrock-agents|Bedrock Agents]] is the fully managed, configuration-driven option.',
  flow: ['Client', 'AgentCore Runtime', 'Your agent code', 'Gateway (tools)', 'Memory + Identity', 'Observability'],
  steps: [
    [0, 'A client invokes the deployed agent with a session ID.'],
    [1, 'Runtime starts or reuses an isolated session environment for that session, so one user\'s state cannot leak into another\'s.'],
    [2, 'Your framework code runs the reasoning loop against the model of your choice.'],
    [3, 'Tool calls go through Gateway, which handles discovery and authentication to APIs, Lambda functions and MCP servers.'],
    [4, 'Memory stores conversation context and extracted long-term facts; Identity manages the credentials the agent uses on the user\'s behalf.'],
    [5, 'Traces and metrics flow to Observability (OpenTelemetry-compatible) for debugging and monitoring.']
  ],
  gotchas: [
    '**You still own agent quality.** AgentCore hosts and secures the agent; prompts, tools and evaluation remain your job.',
    '**Per-session isolation means state does not carry across sessions** unless you put it in Memory or your own store.',
    '**Delegated access needs careful scoping.** An agent acting for a user should get the minimum scopes, with short-lived tokens.',
    'Components are modular. You can adopt Runtime without Gateway, but integration glue is yours.',
    'Service is relatively new; confirm Region availability, quotas and feature status before committing.'
  ],
  edges: [
    'Long-running or asynchronous agent tasks are supported, but you must design for resumability and idempotent tools.',
    'MCP tool servers add a network hop and a trust boundary; vet third-party servers.',
    'Memory strategies (summarisation, fact extraction) change what the agent "remembers", and are worth evaluating.'
  ],
  ml: [
    'Host custom multi-agent systems with enterprise authentication and audit requirements.',
    'Give agents a sandboxed browser or code interpreter for research and data-analysis tasks.',
    'Standardise tool access across teams through a shared Gateway of approved tools.'
  ],
  pairs: ['bedrock', 'bedrock-agents', 'lambda', 'iam', 'cloudwatch'],
  cost: 'Consumption-based per component (runtime compute time, memory operations, gateway calls, tool sessions) plus the model tokens. Check current pricing; idle time is not free in all components.'
});

S({
  id: 'nova', cat: 'genai', name: 'Amazon Nova & Titan models', doc: 'nova/',
  tag: 'Amazon\'s own foundation models: text, multimodal, image, video, speech and embeddings.',
  what: 'Amazon\'s first-party models on Bedrock. The **Nova** family spans understanding models (Micro for text-only speed, Lite and Pro for multimodal, Premier for the most complex tasks), creative models (Canvas for images, Reel for video), and a speech-to-speech model (Sonic). Newer Nova generations extend this line. **Titan** models include text and multimodal **embedding** models widely used for RAG.\n\nBy tier, Amazon positions them toward low latency and low cost compared with frontier third-party models, with strong fit for high-volume, well-defined tasks.',
  flow: ['Prompt (text / image / video)', 'Bedrock endpoint', 'Nova or Titan model', 'Output / embedding'],
  steps: [
    [0, 'Your app builds a prompt, optionally with images, documents or video.'],
    [1, 'It calls Bedrock with the Nova or Titan model ID (or an inference profile).'],
    [2, 'The model runs with the capabilities of its tier: tool use, long context, multimodal understanding, or embedding generation.'],
    [3, 'You receive generated content, or a fixed-length vector for retrieval.']
  ],
  gotchas: [
    '**Match tier to task.** Premier-class models on simple classification waste money; Micro on hard reasoning wastes time.',
    '**Embedding dimension and model are a pipeline contract.** Titan embedding output sizes are configurable; whatever you choose must match the vector index, forever.',
    'Availability and model versions vary by Region and change over time. Re-check the model catalogue.',
    'Image and video generation models have their own quotas, durations and content-policy constraints.'
  ],
  edges: [
    'Embedding models have a maximum input length; chunk accordingly.',
    'Smaller models often match large ones after prompt tuning or distillation on a narrow task; evaluate before assuming you need the biggest.',
    'Fine-tuning is available for selected models; others are prompt-only.'
  ],
  ml: [
    'Cost-efficient workhorse for extraction, classification, summarisation at scale, often via [[bedrock|batch inference]].',
    'Embedding backbone for [[bedrock-kb|Knowledge Bases]] and custom RAG.',
    'Multimodal document and video understanding; speech interfaces with Sonic.'
  ],
  pairs: ['bedrock', 'bedrock-kb', 's3-vectors', 'opensearch'],
  cost: 'Per token (understanding models), per image or per second (creative models), and per token for embeddings, generally at the lower end of Bedrock\'s price range.'
});

S({
  id: 'q', cat: 'genai', name: 'Amazon Q', doc: 'amazonq/',
  tag: 'Ready-made AI assistants for developers and for employees working over company data.',
  what: '**Amazon Q Developer** is an AI coding assistant in IDEs, the command line and the AWS console: code generation, explanations, transformation and troubleshooting, with AWS-aware answers. **Amazon Q Business** is an assistant for employees that answers over enterprise data through connectors, respecting each user\'s existing permissions.\n\nThese are products to adopt, not building blocks. You use them when you want the assistant, not when you want to build one. AWS has been evolving its agentic workspace offerings, so check current naming and packaging.',
  flow: ['Employee / developer', 'Q interface', 'Identity + permissions', 'Connected data / code', 'Grounded answer'],
  steps: [
    [0, 'A user asks a question in chat, the IDE, or the console.'],
    [1, 'The request goes to the Q application they are signed in to.'],
    [2, 'Identity (IAM Identity Center) establishes who they are and what they may see.'],
    [3, 'Q retrieves from connected systems (for Business) or from code context and AWS knowledge (for Developer).'],
    [4, 'It answers, with references to sources, limited to what that user is allowed to access.']
  ],
  gotchas: [
    '**Answers inherit data hygiene.** If source permissions are wrong, the assistant will faithfully expose the wrong things. Clean up access first.',
    '**Customisation is bounded.** For bespoke behaviour, build on [[bedrock]] instead.',
    'Generated code still needs review, tests and security scanning.',
    'Product packaging and names have shifted over time; verify what your organisation can use.'
  ],
  edges: [
    'Per-user pricing means light users can make a licence-based tool costlier than a pay-per-use build.',
    'Connector sync schedules govern how fresh answers are.'
  ],
  ml: [
    'Speed up the team building the system: Q Developer for code, infrastructure and debugging help.',
    'Internal knowledge assistant without building a RAG stack, if its connectors cover your sources.',
    'Baseline to beat: compare a custom RAG build against it before investing.'
  ],
  pairs: ['bedrock', 'bedrock-kb', 'iam', 'kendra'],
  cost: 'Per-user subscription tiers for Business and Developer, with some usage-based components.'
});
