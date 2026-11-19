/* Decision guides for engineering managers and principal engineers in AWS for AI systems.
   Schema per decision:
   id, theme ('strategy'|'architecture'|'risk'), lead ('em'|'pe'|'both'), title, question,
   door ('two-way'|'one-way'|'mixed'), doorNote, why, cols, rows, rules:[[if, then]], redflags:[], ask:[], revisit, related:[service ids],
   em: { call, own:[], evidence:[] }   // the engineering manager lens
   pe: { call, own:[], evidence:[] }   // the principal engineer lens
   Text supports `code`, **bold**, [[service-id|label]]. */
window.ATLAS.decisionThemes = [
  { id: 'strategy', name: 'Strategy & scope', blurb: 'Decide what to build, how autonomous it should be, and how to improve it. These are the decisions that set the budget and the team.' },
  { id: 'architecture', name: 'Architecture', blurb: 'Where models run, how agents are hosted, how retrieval works, and how the system copes with load and capacity.' },
  { id: 'risk', name: 'Risk, quality & cost', blurb: 'How you will know it works, how much you trust it to act, what it costs to run, and how tenants stay apart.' }
];

window.ATLAS.decisions = [
  {
    "id": "build-buy-customize",
    "theme": "strategy",
    "title": "Build, buy or customise?",
    "question": "How much of this should we build ourselves, and how much should we adopt?",
    "door": "mixed",
    "doorNote": "Two-way at the start. It becomes one-way once your data, workflows and people depend on the choice.",
    "why": "Every AI feature has a build cost and a run cost, and the second is the one teams under-estimate. The wrong level of build also locks in headcount: a self-managed GPU stack needs people on call for it.",
    "cols": [
      "Path",
      "First value in",
      "You own",
      "Fits when",
      "Main risk"
    ],
    "rows": [
      [
        "Adopt a finished product ([[q|Amazon Q]], SaaS copilots)",
        "Days",
        "Configuration and data hygiene",
        "Commodity needs: developer productivity, internal search",
        "Capability ceiling; per-seat cost; limited customisation"
      ],
      [
        "Managed blocks ([[bedrock]] + [[bedrock-kb|Knowledge Bases]] + [[bedrock-agents|Agents]])",
        "Weeks",
        "Prompts, data, evals, application glue",
        "A differentiated feature built on standard patterns",
        "Quotas and the limits of the abstraction"
      ],
      [
        "Code-first on a managed runtime ([[agentcore]] + a framework)",
        "Weeks to a few months",
        "Agent logic, tools, memory strategy",
        "Bespoke control flow, multi-agent designs, any model",
        "You own agent quality and its operations"
      ],
      [
        "Managed ML platform ([[sm-training|SageMaker]])",
        "Months",
        "Models, features, pipelines, monitoring",
        "Proprietary data is the advantage; predictive models",
        "MLOps burden; scarce specialist talent"
      ],
      [
        "Self-managed on [[eks|EKS]] / [[ec2|EC2]]",
        "Months or more",
        "Everything, including GPU capacity",
        "Extreme scale or cost pressure, strict locality, custom serving",
        "Operations load; GPU supply risk"
      ]
    ],
    "rules": [
      [
        "The capability is not a differentiator for us",
        "Buy. Put the effort into rollout and data quality."
      ],
      [
        "It is differentiating and a standard pattern (RAG, tool use) covers it",
        "Managed blocks. Spend your time on evals and domain data."
      ],
      [
        "The control flow is bespoke, or you need a model Bedrock does not offer",
        "Code-first on a managed runtime, still without owning servers."
      ],
      [
        "You have a proven data advantage and a trained model beats prompting on your evals",
        "Own the model on SageMaker. Not before."
      ],
      [
        "You need locality, unit-cost or latency that managed services cannot meet",
        "Self-managed, with a named owner for GPU capacity."
      ]
    ],
    "redflags": [
      "Fine-tuning is proposed before anyone has measured a prompt-plus-RAG baseline.",
      "A \"platform\" is being built before the first use case is in production.",
      "The build-or-buy case rests on demo quality rather than on an eval set.",
      "Run cost and on-call burden are missing from the comparison.",
      "There is no exit path if the model or vendor changes in twelve months."
    ],
    "ask": [
      "Which part of this is our differentiator, and which part is plumbing?",
      "What does it cost per task at the volume we expect in a year, and who pays for it?",
      "Who is on call for it, and what do they do at 3 a.m.?",
      "If we had to swap the model or vendor next year, what would break?"
    ],
    "revisit": "Each quarter, when volume grows tenfold, or when a managed option adds the capability you built.",
    "related": [
      "bedrock",
      "agentcore",
      "sm-training",
      "q"
    ],
    "lead": "em",
    "em": {
      "call": "Default to the highest managed level that passes the eval. Fund a build only for a named differentiator.",
      "own": [
        "Headcount and on-call load the chosen path implies.",
        "The run-cost budget and who pays for it.",
        "The exit plan if a vendor or model changes."
      ],
      "evidence": [
        "A one-page comparison that includes run cost and operations, not just build time.",
        "A baseline eval score for the simplest managed option.",
        "A named owner for quality, for cost and for on-call."
      ]
    },
    "pe": {
      "call": "Prove the managed baseline first, then spend engineering effort only where the eval shows a gap.",
      "own": [
        "The seams: keep model, retrieval and tools behind interfaces so any layer can be swapped.",
        "The technical argument for any step down to a lower, more manual level."
      ],
      "evidence": [
        "Prompt-plus-retrieval baseline results on the real eval set.",
        "The interface boundary that makes model and vendor swap a configuration change."
      ]
    }
  },
  {
    "id": "autonomy-level",
    "theme": "strategy",
    "title": "How autonomous should it be?",
    "question": "Is this a single model call, a fixed workflow, or an agent that decides its own steps?",
    "door": "two-way",
    "doorNote": "Easy to move up a level later if tools sit behind clean interfaces. Hard to move down once users expect autonomy.",
    "why": "Autonomy multiplies cost, latency and the ways things go wrong. Most business problems have a known path, and a workflow with LLM steps is cheaper, faster and easier to test than an agent that rediscovers the path every time.",
    "cols": [
      "Level",
      "Pattern",
      "Predictability",
      "AWS building blocks",
      "Cost of a failure"
    ],
    "rows": [
      [
        "0. Single call",
        "One prompt in, one answer out (classify, summarise, extract)",
        "High",
        "[[bedrock]], [[lambda]]",
        "Low: a wrong answer"
      ],
      [
        "1. Grounded answer",
        "Retrieve, then generate (RAG)",
        "High",
        "[[bedrock-kb|Knowledge Bases]], vector store",
        "Low to medium: a confident wrong answer"
      ],
      [
        "2. Workflow with LLM steps",
        "A fixed path where models handle individual steps",
        "High",
        "[[stepfunctions]], [[lambda]], [[bedrock]]",
        "Medium: bounded by the path"
      ],
      [
        "3. Agent, human approves writes",
        "Model chooses tools; a person approves anything that changes state",
        "Medium",
        "[[bedrock-agents|Bedrock Agents]] or [[agentcore]], return of control",
        "Medium: caught at approval"
      ],
      [
        "4. Agent acts within limits",
        "Autonomous with scoped roles, spend caps, reversible actions",
        "Lower",
        "[[agentcore]], [[iam]], [[budgets]]",
        "High: acts before anyone looks"
      ],
      [
        "5. Multi-agent, autonomous",
        "Several agents delegating to each other",
        "Lowest",
        "[[agentcore]], a supervisor pattern",
        "Highest: errors compound across agents"
      ]
    ],
    "rules": [
      [
        "You can write the steps down",
        "Use a workflow (level 2). It is cheaper and testable."
      ],
      [
        "The path depends on what the model finds along the way",
        "Use an agent, and start at level 3."
      ],
      [
        "Any action changes money, data or access",
        "Keep a human approval until measured error rates earn autonomy."
      ],
      [
        "One agent with more tools would do",
        "Do not use multiple agents. Add them only for separate trust boundaries or clearly separate skills."
      ]
    ],
    "redflags": [
      "The word \"agent\" is in the title and nobody can describe a task whose steps vary.",
      "Agents call other agents with no limit on depth or total tokens.",
      "Tools are broad (\"run any SQL\") rather than narrow (\"get order status\").",
      "Autonomy is promised on a date, not earned by measured accuracy."
    ],
    "ask": [
      "Can you draw the steps? If yes, why is this not a workflow?",
      "What is the worst thing the agent can do with its permissions today?",
      "What is the agent's measured success rate on the eval set, and what is the target before we remove approvals?",
      "What stops a loop from burning tokens all night?"
    ],
    "revisit": "When the eval set shows consistently high accuracy for a class of action, consider removing approval for that class only.",
    "related": [
      "bedrock-agents",
      "agentcore",
      "stepfunctions",
      "iam"
    ],
    "lead": "both",
    "em": {
      "call": "Approve the lowest level that solves the problem. Raise it one step at a time, backed by eval numbers.",
      "own": [
        "The risk appetite: which actions may ever be automatic.",
        "The stop rule: what quality drop makes us step autonomy back down."
      ],
      "evidence": [
        "A written worst-case action and its control.",
        "Measured action accuracy before any approval is removed."
      ]
    },
    "pe": {
      "call": "Put deterministic structure around the model. Let the model decide only what code cannot.",
      "own": [
        "Tool design: narrow, typed, validated server-side, least privilege.",
        "Caps on steps, tokens and time, and the loop-detection logic."
      ],
      "evidence": [
        "Tool-selection accuracy measured separately from answer quality.",
        "Injection tests through retrieved text and tool output."
      ]
    }
  },
  {
    "id": "improve-model",
    "theme": "strategy",
    "title": "How do we make it better at our task?",
    "question": "Prompt, retrieve, fine-tune, or pre-train? In what order?",
    "door": "two-way",
    "doorNote": "Prompting and RAG are cheap to change. Fine-tuning creates a data pipeline and a model you must maintain.",
    "why": "Teams jump to fine-tuning because it feels like real engineering. Usually the gain is in the prompt, the retrieval, or the data, and each step down this list costs far more than the one above it.",
    "cols": [
      "Approach",
      "What changes",
      "Good for",
      "Cost and effort",
      "Maintenance"
    ],
    "rows": [
      [
        "Prompt engineering",
        "Instructions and examples",
        "Format, tone, simple tasks",
        "Minutes; no cost beyond tokens",
        "Re-test when the model version changes"
      ],
      [
        "RAG ([[bedrock-kb|Knowledge Bases]])",
        "What the model can see at question time",
        "Private, current or large knowledge",
        "Days; ongoing retrieval cost",
        "Keep the index fresh; tune chunking"
      ],
      [
        "Fine-tune on [[bedrock|Bedrock]]",
        "Model weights, managed",
        "Style, format, narrow tasks with labelled data",
        "Days; custom model hosting may need provisioned capacity",
        "Retrain when the base model is retired"
      ],
      [
        "Fine-tune on [[sm-training|SageMaker]]",
        "Weights of an open model, full control",
        "Specialised domains, a smaller and cheaper model",
        "Weeks; GPU training plus hosting",
        "You run training, serving and upgrades"
      ],
      [
        "Continued pre-training",
        "Broad domain knowledge in the weights",
        "Very large unlabelled domain corpora",
        "Heavy; cluster scale ([[hyperpod|HyperPod]])",
        "Highest"
      ]
    ],
    "rules": [
      [
        "The task is not yet measured",
        "Build the eval set first. Nothing below makes sense without it."
      ],
      [
        "The model lacks facts, or facts change",
        "RAG. Knowledge belongs outside the weights."
      ],
      [
        "The model knows enough but behaves wrongly (format, tone, a narrow skill)",
        "Fine-tune, after prompting has plateaued on your evals."
      ],
      [
        "A small model with tuning could replace a large one at lower unit cost",
        "Fine-tune or distil a smaller model."
      ],
      [
        "You hold a very large domain corpus and have a reason to own the model",
        "Consider continued pre-training. Rarely the right answer."
      ]
    ],
    "redflags": [
      "No baseline numbers for the prompt-only and prompt-plus-RAG versions.",
      "Fine-tuning data was scraped together without review or a held-out test set.",
      "The plan has no owner for retraining when the base model is retired.",
      "Retrieval quality has never been measured separately from answer quality."
    ],
    "ask": [
      "What is the score of the best prompt-and-RAG version on our eval set?",
      "What exactly is the gap fine-tuning would close, and how will we show it closed?",
      "Where does the training data come from, and are we allowed to use it?",
      "Who maintains this after the first release?"
    ],
    "revisit": "When the base model changes, when evals plateau, or when unit cost forces a smaller model.",
    "related": [
      "bedrock-kb",
      "bedrock",
      "sm-training",
      "hyperpod"
    ],
    "lead": "pe",
    "em": {
      "call": "Do not fund fine-tuning without an error analysis and a written maintenance owner.",
      "own": [
        "Whether the cost of maintaining a custom model is justified by the measured gain.",
        "Staffing for dataset curation if tuning is approved."
      ],
      "evidence": [
        "The failure taxonomy with counts.",
        "A baseline-versus-candidate comparison on the same eval set."
      ]
    },
    "pe": {
      "call": "Work the cheap levers in order: instructions, retrieval, model, workflow, then weights.",
      "own": [
        "The error analysis and the eval set that decide the lever.",
        "The retest plan across base-model upgrades and retirements."
      ],
      "evidence": [
        "Retrieval recall at k measured separately from answer quality.",
        "Per-lever deltas on a held-out set, not a demo."
      ]
    }
  },
  {
    "id": "where-model-runs",
    "theme": "architecture",
    "title": "Where should the model run?",
    "question": "Managed API, provisioned capacity, SageMaker hosting, or our own containers?",
    "door": "two-way",
    "doorNote": "Easy to change if your code calls models through one interface (such as the Converse API) and not directly.",
    "why": "Hosting determines unit cost at scale, how much operations work you take on, and whether a capacity shortage can take you down. Each step down this list buys control and costs people.",
    "cols": [
      "Option",
      "Best for",
      "You manage",
      "Watch out for"
    ],
    "rows": [
      [
        "[[bedrock|Bedrock on-demand]]",
        "Most LLM features; bursty or modest volume",
        "Prompts, quotas, retries",
        "Per-model throttling; model retirement"
      ],
      [
        "[[bedrock|Bedrock Provisioned Throughput]]",
        "Steady high volume needing guaranteed capacity; some custom models",
        "Commitment sizing",
        "Paying for idle capacity"
      ],
      [
        "[[sm-inference|SageMaker real-time]]",
        "Your own or open-weight model with steady traffic",
        "Instance sizing, scaling, container",
        "Billing while idle; slow scale-out"
      ],
      [
        "[[sm-inference|SageMaker asynchronous]]",
        "Large payloads, long processing, spiky work",
        "Result handling",
        "First-request latency after scale to zero"
      ],
      [
        "[[ecs|ECS]] / [[eks|EKS]] on GPUs",
        "Custom serving stacks; maximum cost control at scale",
        "Nearly everything",
        "GPU capacity, image start-up time, operations load"
      ],
      [
        "[[lambda|Lambda]]",
        "Small CPU models, glue and tool execution",
        "Package size and cold starts",
        "No GPU; 15-minute limit"
      ]
    ],
    "rules": [
      [
        "A Bedrock model meets quality and cost targets",
        "Use Bedrock on-demand. Stop here."
      ],
      [
        "Traffic is steady and you are being throttled or need guaranteed latency",
        "Add Provisioned Throughput or cross-Region inference profiles."
      ],
      [
        "The model you need is not on Bedrock",
        "SageMaker real-time or async, using a managed serving container."
      ],
      [
        "Volume is high and steady, and per-token cost dominates the P&L",
        "Evaluate self-hosting on EKS or ECS, including the cost of the people to run it."
      ],
      [
        "The model is small and CPU-bound",
        "Lambda or a Fargate service."
      ]
    ],
    "redflags": [
      "Self-hosting proposed on the basis of per-token price alone, with no staffing or utilisation estimate.",
      "Application code calls one vendor SDK directly everywhere.",
      "No plan for what happens when a GPU instance type is unavailable.",
      "Endpoints left running in dev and test accounts."
    ],
    "ask": [
      "What is the expected GPU utilisation, and what does the break-even look like against the managed price?",
      "What is our fallback if this model or instance type is unavailable?",
      "Can we move to another model by changing configuration?",
      "Who owns capacity planning?"
    ],
    "revisit": "When monthly inference spend passes a threshold you set, or when a managed model closes the quality gap.",
    "related": [
      "bedrock",
      "sm-inference",
      "eks",
      "ecs",
      "lambda"
    ],
    "lead": "pe",
    "em": {
      "call": "Approve self-hosting only with a named capacity owner and a measured cost case against provisioned capacity.",
      "own": [
        "The cost and on-call implications of each hosting option.",
        "Sign-off with compliance on residency before launch."
      ],
      "evidence": [
        "A volume forecast with a pay-per-token versus provisioned throughput comparison.",
        "Compliance sign-off naming the deployment type."
      ]
    },
    "pe": {
      "call": "Start on Bedrock On-Demand behind a gateway. Move to Provisioned Throughput or self-hosted only on evidence.",
      "own": [
        "The traffic profile and the sizing method for provisioned capacity.",
        "The abstraction that lets a model move between deployments without code changes."
      ],
      "evidence": [
        "Load-test results including time to first token and tail latency.",
        "A failover test to a second Region or deployment."
      ]
    }
  },
  {
    "id": "agent-runtime",
    "theme": "architecture",
    "title": "How do we host the agent?",
    "question": "Configuration-driven agents, code-first on a managed runtime, a workflow engine, or our own service?",
    "door": "mixed",
    "doorNote": "Tools and data stay portable if they are plain functions with clear schemas. Orchestration code is the part that locks you in.",
    "why": "The runtime decides how you debug non-deterministic behaviour, how sessions are isolated, how tools authenticate, and how much glue you write.",
    "cols": [
      "Option",
      "Control",
      "Operations load",
      "Strengths",
      "Limits"
    ],
    "rows": [
      [
        "[[bedrock-agents|Bedrock Agents]]",
        "Low: configure instructions, tools, knowledge bases",
        "Lowest",
        "Fast to a working agent; managed loop, tracing and versioning",
        "Fixed orchestration; fewer places to customise"
      ],
      [
        "[[agentcore|AgentCore Runtime]] + framework (Strands, LangGraph and others)",
        "High: your code, your model, any framework",
        "Low to medium",
        "Session isolation, memory, tool gateway and identity as services",
        "You own agent quality; newer service, so check availability"
      ],
      [
        "[[stepfunctions|Step Functions]] with Bedrock steps",
        "Fixed path with LLM steps",
        "Low",
        "Retries, state, human approval, audit trail",
        "Not for open-ended tool choice"
      ],
      [
        "Your own service on [[ecs|ECS]] or [[lambda|Lambda]]",
        "Total",
        "Highest",
        "No platform constraints",
        "You build isolation, memory, identity and tracing yourself"
      ]
    ],
    "rules": [
      [
        "A standard tool-using assistant, and speed to first release matters",
        "Bedrock Agents."
      ],
      [
        "Custom control flow, a non-Bedrock model, multi-agent designs, or an existing framework",
        "AgentCore with your framework."
      ],
      [
        "The path is known in advance",
        "A Step Functions workflow, not an agent."
      ],
      [
        "You need behaviour no managed option allows",
        "Your own service, with eyes open about what you rebuild."
      ]
    ],
    "redflags": [
      "Tool permissions are inherited from a broad service role.",
      "No trace of the agent's reasoning and tool calls exists for debugging.",
      "State lives only in the process, so sessions cannot resume.",
      "The same agent holds credentials for many unrelated systems."
    ],
    "ask": [
      "How do we replay a bad conversation step by step?",
      "Whose identity does each tool call run as?",
      "Where does session state live, and how long?",
      "What caps tokens, steps and wall-clock time?"
    ],
    "revisit": "When the agent needs control flow the managed option cannot express, or when a second team wants to build agents.",
    "related": [
      "bedrock-agents",
      "agentcore",
      "stepfunctions",
      "lambda"
    ],
    "lead": "pe",
    "em": {
      "call": "Pick the managed runtime that gives a trace per run and user-level identity. Add control only when forced.",
      "own": [
        "Who operates the runtime and its on-call.",
        "The decision about when a business-built agent must move to code."
      ],
      "evidence": [
        "A demo of tracing a failed run end to end.",
        "A named owner for the runtime."
      ]
    },
    "pe": {
      "call": "Keep tools behind stable interfaces (Lambda or MCP) so the runtime is replaceable.",
      "own": [
        "State, memory and identity design.",
        "The tool contract: schemas, validation, idempotency and error shapes."
      ],
      "evidence": [
        "A spike hosting the same agent on two runtimes.",
        "Replayable traces and a loop-cap test."
      ]
    }
  },
  {
    "id": "vector-store",
    "theme": "architecture",
    "title": "Which vector store?",
    "question": "Where should embeddings live, and what else must that store do?",
    "door": "mixed",
    "doorNote": "Moving stores is easy. Changing the embedding model means re-embedding everything, which is the real one-way part.",
    "why": "The store sets your cost shape (memory-resident or cheap at rest), your latency, and how well you can filter by tenant, permission or date, which is where most RAG quality problems start.",
    "cols": [
      "Store",
      "Strength",
      "Latency and scale",
      "Choose when"
    ],
    "rows": [
      [
        "[[aurora|Aurora / RDS pgvector]]",
        "Vectors beside relational data; SQL filters and joins",
        "Good up to millions of vectors; bounded by instance memory",
        "You already run Postgres and want one database"
      ],
      [
        "[[opensearch|OpenSearch]]",
        "Hybrid keyword plus vector search; high concurrency",
        "Low latency; scales out; memory-heavy",
        "Search-centric apps with heavy filtering"
      ],
      [
        "[[s3-vectors|S3 Vectors]]",
        "Very low storage cost at huge scale",
        "Higher latency; lower query rate",
        "Large, colder collections where cost dominates"
      ],
      [
        "[[elasticache|ElastiCache / MemoryDB]]",
        "In-memory speed; semantic caching",
        "Sub-millisecond to low milliseconds; RAM-limited",
        "Caches and ultra-low-latency lookups"
      ],
      [
        "[[neptune|Neptune Analytics]]",
        "Vectors plus graph traversal (GraphRAG)",
        "In memory; sized by graph",
        "Answers depend on relationships between entities"
      ],
      [
        "[[kendra|Kendra GenAI Index]]",
        "Managed retrieval with connectors and ACLs",
        "Managed; hourly index fee",
        "Enterprise sources and permission fidelity matter more than cost"
      ]
    ],
    "rules": [
      [
        "You already run Postgres and have under a few million chunks",
        "pgvector. One database to operate."
      ],
      [
        "You need keyword and vector together, with strict filtering and many concurrent users",
        "OpenSearch."
      ],
      [
        "The corpus is huge and queries are occasional",
        "S3 Vectors, possibly with a hot subset elsewhere."
      ],
      [
        "Questions follow relationships between things",
        "Neptune Analytics for GraphRAG."
      ],
      [
        "Per-user document permissions must mirror source systems exactly",
        "Evaluate Kendra, or filter on metadata you can prove is correct."
      ]
    ],
    "redflags": [
      "Retrieval has never been scored separately (recall at k) from the final answer.",
      "No metadata filter for tenant or permission, so every query searches everything.",
      "The embedding model was chosen without comparing options on your own data.",
      "Chunking was left at defaults and never tested."
    ],
    "ask": [
      "What is recall at k on real questions with the right documents marked?",
      "How do we enforce per-user access, and how do we test that it works?",
      "What does re-embedding the whole corpus cost and how long does it take?",
      "What is the baseline monthly cost when nobody is using it?"
    ],
    "revisit": "When corpus size grows tenfold, when filter patterns change, or when you consider a new embedding model.",
    "related": [
      "aurora",
      "opensearch",
      "s3-vectors",
      "neptune",
      "kendra"
    ],
    "lead": "pe",
    "em": {
      "call": "Do not add a new data store for a pilot. Reuse what the team operates, and fund the eval for retrieval.",
      "own": [
        "Whether a new store means a new on-call duty.",
        "Who owns the content pipeline and its freshness."
      ],
      "evidence": [
        "Retrieval recall numbers on real questions.",
        "A named owner for ingestion quality."
      ]
    },
    "pe": {
      "call": "Choose by filtering and ranking needs, not by vector benchmarks. Test with your real filters.",
      "own": [
        "Chunking, embedding model, index schema and security-trimming design.",
        "The reindex and rollback procedure."
      ],
      "evidence": [
        "Recall at k with the real access filters applied.",
        "Cross-user access tests that fail on a missing filter."
      ]
    }
  },
  {
    "id": "inference-pattern",
    "theme": "architecture",
    "title": "Synchronous, streaming, asynchronous or batch?",
    "question": "What interaction pattern does the product need, and what does it cost to promise it?",
    "door": "one-way",
    "doorNote": "It becomes part of your API contract and your users' expectations. Changing it later means changing clients.",
    "why": "Latency promises drive almost everything else: timeouts, capacity, cost, and which AWS services can sit in the path. Many failures come from a long model call behind a front door with a short timeout.",
    "cols": [
      "Pattern",
      "Latency promise",
      "How on AWS",
      "Fits",
      "Gotchas"
    ],
    "rows": [
      [
        "Synchronous",
        "Under a couple of seconds",
        "[[apigw|API Gateway]] or [[alb|ALB]] to a model",
        "Classification, short answers, tool calls",
        "Short front-door timeouts; one slow call fails the request"
      ],
      [
        "Streaming",
        "First token in about a second; total in seconds",
        "Streaming APIs, response streaming, WebSockets",
        "Chat and long generations",
        "Buffering proxies; idle timeouts; token expiry during a long stream"
      ],
      [
        "Asynchronous",
        "Minutes",
        "[[sqs|SQS]] and workers, [[sm-inference|async endpoints]], polling or push",
        "Long documents, heavy agents, report generation",
        "You need status, retries, idempotency and a result store"
      ],
      [
        "Batch",
        "Hours",
        "[[bedrock|Bedrock batch inference]], [[batch|AWS Batch]], batch transform",
        "Backfills, labelling, bulk summarisation",
        "Quality drift goes unseen; failures are found late"
      ],
      [
        "Event-driven, continuous",
        "Seconds, always on",
        "[[kinesis|Kinesis]], [[msk|MSK]], [[lambda|Lambda]]",
        "Fraud scoring, alerting, live features",
        "Ordering, duplicates and consumer lag"
      ]
    ],
    "rules": [
      [
        "A person is waiting and the answer is long",
        "Stream it."
      ],
      [
        "The task takes more than about half a minute, or varies widely",
        "Make it asynchronous with job status. Do not hold a connection open."
      ],
      [
        "Nobody is waiting",
        "Batch. It is usually the cheapest way to run models."
      ],
      [
        "Decisions follow a live stream of events",
        "Event-driven, with idempotent consumers."
      ]
    ],
    "redflags": [
      "A long generation sits behind a gateway with a short integration timeout.",
      "Asynchronous jobs have no status endpoint, no retry policy and no dead-letter queue.",
      "Interactive and batch traffic share the same quota.",
      "Streaming is promised but a proxy buffers the whole response."
    ],
    "ask": [
      "What is the slowest legitimate request, and does every hop allow it?",
      "What does the user see while they wait?",
      "How does a failed job get retried without doing the work twice?",
      "Can batch work be kept off the interactive quota?"
    ],
    "revisit": "Before changing a public API. Later is expensive.",
    "related": [
      "apigw",
      "alb",
      "sqs",
      "kinesis",
      "bedrock"
    ],
    "lead": "pe",
    "em": {
      "call": "Insist on a defined user experience for waiting and failure before build. It is a product decision as much as an engineering one.",
      "own": [
        "Agreeing the acceptable latency and failure experience with product.",
        "Prioritising batch for non-urgent work to save cost."
      ],
      "evidence": [
        "A latency budget by hop.",
        "A written failure experience per error type."
      ]
    },
    "pe": {
      "call": "Pick the pattern from the slowest realistic request. Make every step idempotent and every hop timeout explicit.",
      "own": [
        "The end-to-end timeout and buffering map.",
        "Retry, idempotency and dead-letter design."
      ],
      "evidence": [
        "Load tests with slow requests and long streams.",
        "A chaos test that kills a worker mid-job."
      ]
    }
  },
  {
    "id": "capacity-strategy",
    "theme": "architecture",
    "title": "How do we secure capacity and throughput?",
    "question": "What do we do about quotas, throttling and scarce GPUs before launch?",
    "door": "two-way",
    "doorNote": "Cheap to adjust, but lead times are long. Start early.",
    "why": "Throughput and capacity are the most common launch-week surprises. A quota increase can take days, and holding quota does not guarantee a GPU is free.",
    "cols": [
      "Lever",
      "What it buys",
      "Commitment",
      "Use when",
      "Watch out for"
    ],
    "rows": [
      [
        "Quota increases ([[servicequotas|Service Quotas]])",
        "Higher requests and tokens per minute; more GPU vCPUs",
        "None",
        "Always, ahead of launch",
        "Review time; per Region; not capacity"
      ],
      [
        "Cross-Region inference profiles ([[bedrock]])",
        "More throughput by spreading across Regions",
        "None",
        "Traffic exceeds a single Region's quota",
        "Data residency; IAM must allow all target Regions"
      ],
      [
        "Provisioned Throughput ([[bedrock]])",
        "Reserved capacity and steady latency",
        "Time commitment",
        "Steady high volume; some custom models",
        "Idle cost"
      ],
      [
        "Fallback model chain",
        "Survives throttling or an outage",
        "Engineering",
        "Availability matters more than identical answers",
        "Behaviour differs between models; test each"
      ],
      [
        "Queue and back-pressure ([[sqs|SQS]])",
        "Smooths bursts",
        "Engineering",
        "Work does not need an instant answer",
        "Queue age becomes the metric"
      ],
      [
        "GPU reservations ([[ec2|Capacity Blocks]], reservations)",
        "Guaranteed GPUs for a window",
        "Pay for the window",
        "Training runs; self-hosted serving baseline",
        "Planning horizon"
      ],
      [
        "Batch offload ([[bedrock|batch inference]])",
        "Moves bulk work off the interactive quota",
        "None",
        "Anything that can wait",
        "Delay"
      ]
    ],
    "rules": [
      [
        "Launch is in under a month",
        "File quota requests now for every model and Region on the critical path."
      ],
      [
        "One Region cannot carry the peak",
        "Cross-Region profiles, after a data-residency check."
      ],
      [
        "The service must stay up through a model outage",
        "Build a tested fallback chain and a graceful degraded mode."
      ],
      [
        "Training needs a fixed number of GPUs by a date",
        "Reserve them. Do not rely on on-demand."
      ]
    ],
    "redflags": [
      "The launch plan has no quota numbers in it.",
      "Retries have no backoff or jitter, so throttling turns into a retry storm.",
      "Batch and interactive workloads use the same quota.",
      "The fallback model has never been run against the eval set."
    ],
    "ask": [
      "What is peak requests and tokens per minute, per model, and what are our current limits?",
      "What happens to a user when we are throttled?",
      "When did we last test the fallback path?",
      "Who gets paged when quota usage passes 80 percent?"
    ],
    "revisit": "Before each launch or marketing event, and whenever model mix changes.",
    "related": [
      "servicequotas",
      "bedrock",
      "sqs",
      "ec2"
    ],
    "lead": "both",
    "em": {
      "call": "Treat quota and capacity as a launch gate with an owner and a date, not as a task for launch week.",
      "own": [
        "The lead time in the plan and the person chasing it.",
        "The business decision on reserved capacity versus pay-as-you-go."
      ],
      "evidence": [
        "Quota held versus peak forecast, per Region.",
        "A tested fallback path."
      ]
    },
    "pe": {
      "call": "Design for throttling: gateway, backoff, spillover and a degraded mode. Assume quota will be short at some point.",
      "own": [
        "Retry policy, concurrency limits and circuit-breaker settings.",
        "The fallback hierarchy and its evals."
      ],
      "evidence": [
        "Load test that deliberately exceeds quota.",
        "Failover drill results across AWS Regions."
      ]
    }
  },
  {
    "id": "orchestration",
    "theme": "architecture",
    "title": "How do we orchestrate the work?",
    "question": "Which tool coordinates multi-step jobs, retries and approvals?",
    "door": "mixed",
    "doorNote": "Moderate to change, because workflow definitions embed assumptions about retries and state.",
    "why": "Orchestration choices determine who owns state, how retries behave, and how well ML steps fit.",
    "cols": [
      "Tool",
      "Model",
      "Best for",
      "Limits to remember"
    ],
    "rows": [
      [
        "[[stepfunctions|Step Functions]]",
        "State machine with managed state",
        "Multi-service workflows, approvals, fan-out over S3",
        "Per-state payload cap; history size on Standard"
      ],
      [
        "[[sm-pipelines|SageMaker Pipelines]]",
        "ML-specific DAG",
        "Train, evaluate, register, deploy",
        "Limited non-ML branching"
      ],
      [
        "[[sqs|SQS]] and workers",
        "Queue and pull",
        "Smoothing load to slow consumers",
        "You build the workflow logic"
      ],
      [
        "[[eventbridge|EventBridge]]",
        "Event routing",
        "Reacting to events, scheduling, decoupling",
        "No state or ordering of its own"
      ],
      [
        "[[batch|AWS Batch]]",
        "Job queue on managed compute",
        "Large offline compute (embedding, preprocessing)",
        "Not a workflow engine on its own"
      ]
    ],
    "rules": [
      [
        "An ML lifecycle: data, train, evaluate, register, deploy",
        "SageMaker Pipelines."
      ],
      [
        "Anything crossing services with retries, approvals or fan-out",
        "Step Functions."
      ],
      [
        "One producer, slow workers",
        "SQS with a dead-letter queue."
      ],
      [
        "Reacting to something that happened",
        "EventBridge to start the above."
      ]
    ],
    "redflags": [
      "A long chain of Lambdas calling each other with no state record.",
      "Workflow payloads carry documents instead of S3 references.",
      "No dead-letter path, so failures vanish.",
      "Two orchestrators each own part of one process."
    ],
    "ask": [
      "Where is the single source of truth for \"where is this job up to\"?",
      "What happens when a step fails halfway, and is it safe to retry?",
      "Who can see and approve paused steps?"
    ],
    "revisit": "When the number of steps or teams involved doubles.",
    "related": [
      "stepfunctions",
      "sm-pipelines",
      "sqs",
      "eventbridge",
      "batch"
    ],
    "lead": "pe",
    "em": {
      "call": "Match the engine to who will maintain it, not to who builds it first.",
      "own": [
        "The maintenance model: who changes the workflow in a year.",
        "Avoiding a third and fourth engine."
      ],
      "evidence": [
        "A named maintainer who can work in the chosen tool.",
        "An engine ownership rule written down."
      ]
    },
    "pe": {
      "call": "Keep step logic in plain, testable code and keep the engine thin.",
      "own": [
        "Idempotency, retry and compensation rules.",
        "Workflow versioning and the run-history retention."
      ],
      "evidence": [
        "Replay and failure tests.",
        "A versioning drill with running instances."
      ]
    }
  },
  {
    "id": "training-compute",
    "theme": "architecture",
    "title": "Where do we train?",
    "question": "Managed jobs, a resilient cluster, raw instances, or Kubernetes? GPUs or Trainium?",
    "door": "two-way",
    "doorNote": "Training code is portable between these if it is written against standard frameworks. Compiled Neuron artifacts are not.",
    "why": "Training spend is lumpy and failures are costly: one bad node can waste days of GPU time on a large run. The right choice depends on run length, scale and your team's operations skill.",
    "cols": [
      "Option",
      "Best for",
      "Resilience",
      "Operations load",
      "Watch out for"
    ],
    "rows": [
      [
        "[[sm-training|SageMaker training jobs]]",
        "Most training and fine-tuning, from one GPU to dozens of nodes",
        "Spot with checkpoints; job-level retries",
        "Low",
        "Per-usage-type quotas; start-up time"
      ],
      [
        "[[hyperpod|SageMaker HyperPod]]",
        "Weeks-long, many-node foundation-model training",
        "Automatic node replacement and resume",
        "Medium",
        "Paying while idle"
      ],
      [
        "[[ec2|EC2]] directly",
        "Full control; unusual setups",
        "You build it",
        "High",
        "Health checks and recovery are yours"
      ],
      [
        "[[eks|EKS]] with a training operator",
        "Platform teams sharing a GPU pool",
        "Kubernetes-level restarts",
        "High",
        "Gang scheduling; plugins"
      ],
      [
        "[[batch|AWS Batch]]",
        "Many independent jobs, sweeps",
        "Retries per job",
        "Low",
        "Not built for tightly coupled multi-node runs"
      ],
      [
        "[[neuron|Trainium]] as the accelerator",
        "Cost-sensitive large runs on supported models",
        "Same as the platform chosen",
        "Medium",
        "Compile step, operator coverage, porting effort"
      ]
    ],
    "rules": [
      [
        "Runs are hours long on up to a few nodes",
        "SageMaker training jobs, with Spot and checkpoints."
      ],
      [
        "Runs last weeks on many nodes",
        "HyperPod, with reserved capacity."
      ],
      [
        "Many teams share one GPU pool",
        "EKS with a queueing layer, if you have the platform team for it."
      ],
      [
        "GPU supply or price is the constraint and your model is supported",
        "Pilot Trainium on one model before committing."
      ]
    ],
    "redflags": [
      "No checkpointing plan for runs longer than a few hours.",
      "Training quotas requested the week of the run.",
      "GPU nodes sit idle between experiments.",
      "Training data and code are not versioned together."
    ],
    "ask": [
      "What does a failure at hour 40 cost us, and how do we resume?",
      "What is the GPU idle time across the last month?",
      "How is capacity reserved for the next run?",
      "Can we reproduce this model from versioned data and code?"
    ],
    "revisit": "Before each large run, and when sustained utilisation justifies reservations.",
    "related": [
      "sm-training",
      "hyperpod",
      "ec2",
      "eks",
      "neuron"
    ],
    "lead": "pe",
    "em": {
      "call": "Fund the smallest platform that makes retraining routine. Do not build a training cluster before the second use case.",
      "own": [
        "The cost per experiment and the monthly GPU budget.",
        "Who is accountable for idle spend."
      ],
      "evidence": [
        "Cost of one full and one failed run.",
        "Quota in the plan with a date."
      ]
    },
    "pe": {
      "call": "Make every job resumable and reproducible first, then optimise throughput.",
      "own": [
        "Data loading design, checkpoint cadence and storage tier.",
        "Environment pinning and lineage to the registry."
      ],
      "evidence": [
        "GPU utilisation profile showing data is not the bottleneck.",
        "A resume-after-failure test."
      ]
    }
  },
  {
    "id": "evaluation",
    "theme": "risk",
    "title": "How will we know it works?",
    "question": "What do we measure, with which method, before launch and after?",
    "door": "two-way",
    "doorNote": "Cheap to change, but expensive to start late. Without evals every other decision is a guess.",
    "why": "Non-deterministic systems cannot be tested by spot-checking. Teams that launch on demos spend their time arguing about whether a change made things better. An eval set ends that argument.",
    "cols": [
      "Method",
      "Measures",
      "Speed and cost",
      "Blind spots",
      "AWS"
    ],
    "rows": [
      [
        "Golden-set checks (exact or rule-based)",
        "Correct extraction, format, tool choice",
        "Fast and cheap",
        "Misses open-ended quality",
        "Plain tests in CI"
      ],
      [
        "Model-as-judge",
        "Relevance, faithfulness, tone at scale",
        "Fast; costs tokens",
        "Judge bias; needs calibration against humans",
        "[[bedrock|Bedrock evaluations]]"
      ],
      [
        "Human review of samples",
        "What really matters to users",
        "Slow and costly",
        "Small samples; reviewer disagreement",
        "[[sm-groundtruth|Ground Truth]]"
      ],
      [
        "Retrieval metrics (recall at k)",
        "Whether the right passages are found",
        "Fast, once labelled",
        "Says nothing about the answer",
        "Your own harness"
      ],
      [
        "Shadow and A/B in production",
        "Real impact on real traffic",
        "Slow; needs traffic",
        "Risk to users if not isolated",
        "[[sm-inference|Shadow variants]], traffic splitting"
      ],
      [
        "Production monitoring",
        "Drift, refusals, guardrail hits, feedback",
        "Continuous",
        "Lagging indicator",
        "[[cloudwatch]], [[sm-monitor|Model Monitor]], [[bedrock-guardrails|Guardrails]]"
      ],
      [
        "Adversarial and red-team tests",
        "Prompt injection, data leakage, abuse",
        "Manual and periodic",
        "Only finds what testers think of",
        "Your own tests plus Guardrails"
      ]
    ],
    "rules": [
      [
        "Before any serious build",
        "Collect 50 to a few hundred real, representative cases with expected outcomes, and agree what \"good\" means."
      ],
      [
        "Every change to prompt, model or retrieval",
        "Run the eval set automatically in the pipeline."
      ],
      [
        "Judge models are used",
        "Calibrate them on a human-labelled sample first."
      ],
      [
        "An incident happens",
        "Add the case to the eval set so it cannot recur."
      ]
    ],
    "redflags": [
      "Quality is described in adjectives (\"feels better\") and not in numbers.",
      "The eval set was written by the team that built the system, from memory.",
      "Retrieval and generation are scored together, so nobody knows which is failing.",
      "There is no production sampling, so drift is invisible."
    ],
    "ask": [
      "Show me the eval set, its size, and who labelled it.",
      "What is the score today, and what is the launch threshold?",
      "What did the last prompt change do to the score?",
      "How do real failures get back into the eval set?"
    ],
    "revisit": "Continuously. Re-examine the eval set itself every quarter.",
    "related": [
      "bedrock",
      "sm-groundtruth",
      "sm-monitor",
      "cloudwatch"
    ],
    "lead": "both",
    "em": {
      "call": "Do not approve a launch without a versioned eval set and a threshold agreed in advance.",
      "own": [
        "Making evaluation a funded task with an owner.",
        "The ship and stop rules."
      ],
      "evidence": [
        "The threshold, agreed before the results.",
        "Trend of scores across the last releases."
      ]
    },
    "pe": {
      "call": "Build the eval before the system. Score components separately so you know which half to fix.",
      "own": [
        "The eval set design, labelling and versioning.",
        "CI gates that block regressions."
      ],
      "evidence": [
        "Judge-versus-human agreement.",
        "Component-level scores for retrieval and tool choice."
      ]
    }
  },
  {
    "id": "human-in-loop",
    "theme": "risk",
    "title": "How much do we trust it to act?",
    "question": "What can the system do on its own, and where does a person decide?",
    "door": "two-way",
    "doorNote": "Easy to relax approvals as evidence builds. Expensive to tighten after an incident.",
    "why": "The cost of an AI error depends on what it is allowed to touch. Permissions and approvals, not prompts, are what bound the damage.",
    "cols": [
      "Pattern",
      "Mechanism",
      "Latency impact",
      "Use when"
    ],
    "rows": [
      [
        "Read-only tools",
        "Tools can query but never change state",
        "None",
        "Every first release"
      ],
      [
        "Propose, then approve",
        "Agent drafts the action; a person approves ([[bedrock-agents|return of control]], [[stepfunctions|task token]])",
        "Waiting for a person",
        "Writes with real consequences"
      ],
      [
        "Approve by exception",
        "Auto-act above a confidence or below a value threshold; escalate the rest",
        "Small",
        "Measured accuracy, routine actions"
      ],
      [
        "Autonomous within limits",
        "Scoped [[iam|roles]], spend caps ([[budgets]]), reversible actions only",
        "None",
        "Low-risk, reversible, well-measured tasks"
      ],
      [
        "Post-hoc audit sampling",
        "People review a sample of what already happened ([[cloudtrail]], logs)",
        "None",
        "A complement to the above, never a substitute for approval on high-risk actions"
      ]
    ],
    "rules": [
      [
        "The first release of any agent",
        "Read-only, or propose-then-approve."
      ],
      [
        "An action cannot be undone",
        "Always require approval."
      ],
      [
        "The action is reversible and measured accurate",
        "Consider approval by exception."
      ],
      [
        "The agent acts for a user",
        "Run tools with that user's delegated, scoped identity, not a shared admin role."
      ]
    ],
    "redflags": [
      "The agent's tools run under one broad role.",
      "No spend or action-count cap per session or per day.",
      "Approval screens do not show the exact change that will happen.",
      "Tool output is trusted as instructions, which leaves prompt injection open."
    ],
    "ask": [
      "List every action the agent can take. Which are reversible?",
      "Whose identity does each action run as?",
      "What is the maximum damage in one session?",
      "How would we know if the agent were manipulated?"
    ],
    "revisit": "After each incident and each quarter of measured accuracy data.",
    "related": [
      "bedrock-agents",
      "stepfunctions",
      "iam",
      "cloudtrail",
      "bedrock-guardrails"
    ],
    "lead": "both",
    "em": {
      "call": "Keep approval on every irreversible action until a written accuracy threshold has been met for a defined period.",
      "own": [
        "The risk appetite and who signs off on removing a gate.",
        "Reviewer capacity so approval does not become a bottleneck."
      ],
      "evidence": [
        "Accuracy per action type from real runs.",
        "The approver screen, shown in a demo."
      ]
    },
    "pe": {
      "call": "Run tools as the user, validate server-side, and cap blast radius with permissions rather than prompts.",
      "own": [
        "Tool design, identity flow and audit logging.",
        "Prompt-injection defences: untrusted-data handling and write blocking."
      ],
      "evidence": [
        "An injection test suite through retrieved text and tool output.",
        "A permission map from each tool to the data it can reach."
      ]
    }
  },
  {
    "id": "cost-levers",
    "theme": "risk",
    "title": "How do we keep it affordable?",
    "question": "Which levers reduce cost per task, and what quality risk does each add?",
    "door": "two-way",
    "doorNote": "Mostly reversible. Measure cost per successful task before and after each change.",
    "why": "LLM cost scales with tokens and with the number of model calls per task. Agents multiply both. Teams that track cost per call miss that retries, long contexts and loops are where the money goes.",
    "cols": [
      "Lever",
      "How it saves",
      "Quality risk",
      "Effort"
    ],
    "rows": [
      [
        "Right-size the model ([[nova|smaller tiers]], cheaper models)",
        "Cheaper per token",
        "Lower accuracy on hard cases",
        "Low: change config, re-run evals"
      ],
      [
        "Trim prompts and cache prefixes ([[bedrock|prompt caching]])",
        "Fewer billed input tokens",
        "Low",
        "Low"
      ],
      [
        "Semantic cache ([[elasticache]])",
        "Skips the model for repeat questions",
        "Wrong answer if the similarity threshold is loose",
        "Medium"
      ],
      [
        "Batch the non-urgent work ([[bedrock|batch inference]])",
        "Lower price per token",
        "None; adds delay",
        "Low"
      ],
      [
        "Retrieve less, better ([[bedrock-kb|reranking]], smaller chunks)",
        "Smaller context per call",
        "May drop needed context",
        "Medium"
      ],
      [
        "Route or cascade (cheap model first, escalate if unsure)",
        "Most traffic uses the cheap path",
        "Routing errors",
        "Medium to high"
      ],
      [
        "Fine-tune or distil a small model",
        "Cheaper at high volume",
        "Maintenance burden",
        "High"
      ],
      [
        "Self-host at steady high volume",
        "Lower unit cost if GPUs stay busy",
        "Operations burden",
        "High"
      ],
      [
        "Per-tenant and per-user limits ([[apigw]], [[waf]])",
        "Caps abuse and denial of wallet",
        "Rejected legitimate heavy users",
        "Low"
      ]
    ],
    "rules": [
      [
        "Costs have not been measured by feature and by tenant",
        "Do that first. Tag, and use application inference profiles."
      ],
      [
        "Spend is dominated by input tokens",
        "Trim context and use prompt caching before anything else."
      ],
      [
        "Work can wait",
        "Batch it."
      ],
      [
        "One model handles easy and hard cases",
        "Try a cascade, and measure it against the eval set."
      ],
      [
        "Volume is high and steady",
        "Only then compare self-hosting, including people costs."
      ]
    ],
    "redflags": [
      "Cost is tracked per call, not per successful task.",
      "No cap on loops or tokens per session.",
      "Every request uses the largest model.",
      "Savings were claimed without re-running the evals."
    ],
    "ask": [
      "What is the cost per successful task, and how has it moved over time?",
      "What is the biggest single input to that cost?",
      "What is the worst-case spend if one client misbehaves?",
      "Which levers have we tried, with measured effect?"
    ],
    "revisit": "Monthly. Re-run after every model change, since prices and capabilities shift.",
    "related": [
      "budgets",
      "bedrock",
      "elasticache",
      "apigw"
    ],
    "lead": "em",
    "em": {
      "call": "Set a target cost per successful task up front, and review it monthly with the lever list.",
      "own": [
        "The budget, the target and the alert owner.",
        "Commitments: reservation and provisioned-capacity decisions."
      ],
      "evidence": [
        "Cost per successful task by feature and tenant.",
        "Utilisation of any reserved capacity."
      ]
    },
    "pe": {
      "call": "Measure first, then apply levers in order of effect and quality risk. Re-run evals after each.",
      "own": [
        "Token and call instrumentation, tagging and attribution.",
        "Routing, caching and loop-cap design."
      ],
      "evidence": [
        "Per-lever before-and-after eval and cost numbers.",
        "Cache hit-rate and hit-correctness measurements."
      ]
    }
  },
  {
    "id": "tenancy",
    "theme": "risk",
    "title": "How do we isolate tenants and data?",
    "question": "Shared everything, separate data stores, or a separate account per tenant?",
    "door": "one-way",
    "doorNote": "The hardest to change. Moving tenants between isolation models after launch is a migration project.",
    "why": "In multi-tenant AI systems, a missing filter can leak one customer's documents into another's answer. The isolation model sets your blast radius, your compliance story and your unit cost.",
    "cols": [
      "Model",
      "Isolation",
      "Cost per tenant",
      "Operations",
      "Use when"
    ],
    "rows": [
      [
        "Silo: an account or stack per tenant",
        "Strongest",
        "Highest",
        "Many environments to run",
        "Regulated or very large tenants; contractual isolation"
      ],
      [
        "Bridge: shared compute, separate data stores or knowledge bases per tenant",
        "Strong for data",
        "Medium",
        "Moderate",
        "Most B2B products with sensitive data"
      ],
      [
        "Pool: shared everything with metadata filters and row-level security",
        "Logical only",
        "Lowest",
        "Simplest to run",
        "Low-sensitivity data; many small tenants"
      ],
      [
        "Per-tenant encryption keys ([[kms]])",
        "Cryptographic; adds to any model above",
        "Low to medium",
        "Key lifecycle",
        "Customers need to control or revoke access"
      ],
      [
        "Per-tenant model customisation",
        "Model-level isolation",
        "High",
        "Heavy",
        "Tenant-specific fine-tunes with contractual separation"
      ]
    ],
    "rules": [
      [
        "Data is regulated, or contracts demand isolation",
        "Silo or bridge, with per-tenant keys."
      ],
      [
        "Tenants are many and small, and data is low sensitivity",
        "Pool, with tested filters."
      ],
      [
        "Tenants differ widely in size and sensitivity",
        "Tier them: pool for most, bridge or silo for the largest."
      ],
      [
        "Tenant identity must reach the retrieval layer",
        "Carry it in token claims ([[cognito]]) and enforce it in the data layer, not in the prompt."
      ]
    ],
    "redflags": [
      "Tenant filtering is described as an instruction in the prompt.",
      "Nobody has tested whether tenant A can retrieve tenant B's documents.",
      "Logs and caches are shared across tenants without tenant keys.",
      "No per-tenant cost attribution."
    ],
    "ask": [
      "Show the test that proves tenant A cannot see tenant B's data in retrieval, caches and logs.",
      "What is our isolation model for each tier of customer?",
      "How do we delete a tenant's data completely, including embeddings?",
      "How do we attribute spend to each tenant?"
    ],
    "revisit": "Before onboarding the first regulated or very large customer, and at every major architecture change.",
    "related": [
      "kms",
      "cognito",
      "iam",
      "lakeformation",
      "macie"
    ],
    "lead": "pe",
    "em": {
      "call": "Decide the isolation model with compliance and sales before signing the first sensitive tenant. It is a one-way door.",
      "own": [
        "The commercial and contractual promises tied to isolation.",
        "The cost difference between shared and dedicated tiers."
      ],
      "evidence": [
        "A written tenant data-flow map.",
        "A tested tenant deletion and export procedure."
      ]
    },
    "pe": {
      "call": "Enforce isolation in retrieval and storage, not in prompts. Prove it with tests that try to cross the boundary.",
      "own": [
        "The data-layer design: filters, partitions, keys and caches.",
        "Automated cross-tenant leak tests in CI."
      ],
      "evidence": [
        "Cross-tenant query test results.",
        "A review of every place tenant data is copied (caches, logs, indexes)."
      ]
    }
  },
  {
    "id": "vector-hybrid-search",
    "theme": "architecture",
    "lead": "pe",
    "title": "Vector vs hybrid search: when is each appropriate?",
    "question": "Should retrieval rely purely on dense vectors or combine keyword BM25, dense vectors and semantic reranking?",
    "door": "two-way",
    "doorNote": "Index schemas in [[opensearch]] support adding BM25 text fields or vector fields without destroying the collection.",
    "why": "Dense vector search excels at conceptual similarity and cross-lingual meaning, but fails on exact keyword matching: serial numbers, acronyms, product SKUs and error codes. Hybrid search with Reciprocal Rank Fusion (RRF) and semantic reranking solves both.",
    "cols": [
      "Retrieval mode",
      "Strengths",
      "Weaknesses",
      "Latency",
      "Best fit"
    ],
    "rows": [
      [
        "Pure Dense Vector Search",
        "Handles synonyms, conceptual queries, multi-lingual questions",
        "Misses exact part numbers, product SKUs, unique IDs and rare technical terms",
        "Fast (20-60ms)",
        "Conversational FAQ, semantic discovery"
      ],
      [
        "Pure Keyword Search (BM25)",
        "Exact term matching, fast, low cost, familiar search syntax",
        "Cannot handle synonyms, paraphrasing or cross-language queries",
        "Very fast (10-30ms)",
        "Log search, lookup by invoice ID or SKU"
      ],
      [
        "Hybrid Search (BM25 + Vector via RRF)",
        "Combines keyword precision with semantic breadth; reciprocal rank fusion fuses scores",
        "Requires maintaining both inverted index and vector store in search",
        "Moderate (40-80ms)",
        "Enterprise intranet, technical documentation"
      ],
      [
        "Hybrid + Semantic Reranker",
        "Highest measured Recall@5 and NDCG@10; deep cross-encoder re-evaluates top 50 passages",
        "Adds 100-250ms latency and usage-based billing per 1,000 queries",
        "Higher (150-300ms)",
        "Customer-facing assistants, high-stakes compliance"
      ]
    ],
    "rules": [
      [
        "Queries contain acronyms, product SKUs, error codes or part numbers",
        "Use Hybrid search (BM25 + Vector). Pure vector will disappoint."
      ],
      [
        "The application serves external customers where accuracy drives revenue or brand trust",
        "Enable the Semantic Reranker. The 15-25% NDCG boost is worth the latency."
      ],
      [
        "End-to-end latency budget is under 100ms",
        "Use Hybrid search with RRF but skip the semantic reranker."
      ],
      [
        "Search corpus is small (<5,000 documents) and questions are broad",
        "Pure dense vector search is often sufficient for early prototypes."
      ]
    ],
    "redflags": [
      "Choosing pure vector search for enterprise catalogs with complex alphanumeric product codes.",
      "Assuming vector similarity guarantees factual relevance without measuring Recall@K on golden queries.",
      "Enabling semantic reranking without checking the p95 latency impact on streaming token generation.",
      "Failing to test exact-match search queries during pre-pilot evaluations."
    ],
    "ask": [
      "What percentage of user queries contain exact terms, product codes or acronyms?",
      "What is our measured Recall@5 and NDCG difference between pure vector and hybrid plus reranker?",
      "What is the end-to-end latency budget from user prompt to first generated token?",
      "What is the monthly cost impact of the Semantic Reranker at expected production query volumes?"
    ],
    "revisit": "When query latency exceeds SLAs, when search evaluation metrics plateau, or when OpenSearch updates vector search ranking capabilities.",
    "related": [
      "opensearch",
      "bedrock",
      "bedrock-kb",
      "s3"
    ],
    "em": {
      "call": "Default to Hybrid + Semantic Reranking for production user-facing assistants. Relevance directly impacts task completion rate.",
      "own": [
        "Budget allocation for semantic reranking queries.",
        "The customer satisfaction SLA tied to retrieval accuracy."
      ],
      "evidence": [
        "Evaluation scorecard comparing Recall@5 and MRR across vector, hybrid and reranked modes.",
        "Monthly cost estimate at 1x and 10x query volumes."
      ]
    },
    "pe": {
      "call": "Implement Reciprocal Rank Fusion (RRF) in [[opensearch]] combining Titan or Cohere vectors and BM25 keywords; tune semantic reranker thresholds.",
      "own": [
        "Search schema design, vector indexing algorithms (HNSW vs IVF), and RRF weight tuning.",
        "Latency profiling for the search step in the end-to-end trace."
      ],
      "evidence": [
        "Benchmark results measuring retrieval latency (P50/P95) and NDCG@10 on a representative test corpus.",
        "Precision and recall evaluation on keyword-heavy test queries containing product codes and acronyms."
      ]
    }
  },
  {
    "id": "classic-vs-agentic-rag",
    "theme": "strategy",
    "lead": "both",
    "title": "Classic vs agentic RAG: what complexity justifies agentic retrieval?",
    "question": "Should the system use deterministic single-shot retrieval or autonomous multi-step reasoning and query planning?",
    "door": "mixed",
    "doorNote": "Two-way to start with classic RAG in [[bedrock-kb]]; moving to agentic RAG multiplies token cost and adds stateful orchestration.",
    "why": "Classic RAG answers questions that can be satisfied by a single search query over a single corpus. Agentic RAG decomposes complex questions, searches multiple indexes in parallel, reflects on missing information, and iteratively gathers facts. However, it costs 3x-8x more tokens and takes significantly longer.",
    "cols": [
      "Pattern",
      "Query Execution",
      "Multi-Source Synthesis",
      "Latency & Token Cost",
      "Best Production Fit"
    ],
    "rows": [
      [
        "Classic RAG",
        "Single deterministic query to [[bedrock-kb]] or [[opensearch]]",
        "None (single corpus or pre-merged index)",
        "Lowest latency (500-1,200ms); 1 LLM call",
        "FAQ assistants, policy Q&A, single document lookup"
      ],
      [
        "Routing RAG",
        "Classifier routes query to 1 of N specialized knowledge sources",
        "Queries exactly one specialized index per turn",
        "Low latency (800-1,500ms); 1 classification + 1 generation call",
        "Multi-department portals (HR vs IT vs Legal)"
      ],
      [
        "Decomposition RAG",
        "LLM splits complex query into sub-queries executed in parallel",
        "Combines results from multiple parallel searches",
        "Medium latency (1,500-3,000ms); 2-3 LLM calls",
        "Comparative questions (\"Compare Q3 results between Division A and B\")"
      ],
      [
        "Full Agentic RAG",
        "Autonomous loop: retrieve -> reflect -> re-query -> tool call -> synthesize",
        "Cross-queries search, SQL databases, and live APIs dynamically",
        "High latency (3,000-10,000ms); 4-10 LLM calls",
        "Deep research, complex customer issue diagnosis, forensic analysis"
      ]
    ],
    "rules": [
      [
        "User questions can be answered from a single document passage",
        "Use Classic RAG. Agentic loops add latency and cost for zero quality gain."
      ],
      [
        "Questions require comparing data across multiple distinct repositories (e.g. Jira + SharePoint)",
        "Use Decomposition RAG or a 2-step routing pattern."
      ],
      [
        "The assistant must verify intermediate retrieval before deciding which tool to call next",
        "Use Agentic RAG with [[bedrock-agents]], but enforce hard limits on iterations (max 3 turns)."
      ],
      [
        "Latency budget is strict (<2 seconds)",
        "Classic RAG or Routing RAG only. Agentic loops cannot guarantee sub-2-second P95."
      ]
    ],
    "redflags": [
      "Choosing Agentic RAG for straightforward FAQ lookup tasks.",
      "Allowing unbounded agent loops without a hard circuit breaker on maximum iterations.",
      "Failing to instrument per-step token consumption and latency in [[cloudwatch]].",
      "Deploying agentic retrieval without an evaluation dataset measuring query decomposition accuracy."
    ],
    "ask": [
      "What percentage of user queries actually require synthesizing multiple distinct sources?",
      "What is our measured P95 latency and token cost difference between classic RAG and agentic RAG?",
      "How does the agent know when it has collected sufficient information to stop retrieving?",
      "Are tool calls and intermediate search steps logged to CloudWatch with distributed trace IDs?"
    ],
    "revisit": "When multi-hop query failure rates rise in classic RAG, or when agentic token spend exceeds unit economics targets.",
    "related": [
      "bedrock-kb",
      "bedrock-agents",
      "opensearch",
      "lambda",
      "dynamodb"
    ],
    "em": {
      "call": "Start with Classic RAG. Require evidence of multi-source synthesis failure before funding agentic retrieval development.",
      "own": [
        "Unit economics budget (agentic RAG triples token consumption).",
        "User latency tolerance and product SLA definition."
      ],
      "evidence": [
        "Evaluation analysis showing the percentage of queries that fail under single-shot retrieval.",
        "Cost-per-task comparison between classic and agentic prototypes on identical test queries."
      ]
    },
    "pe": {
      "call": "Implement single-shot hybrid search in [[bedrock-kb]] first; introduce query rewriting and multi-index fan-out only when evaluation proves necessity.",
      "own": [
        "State management, loop termination conditions, and tool invocation timeouts.",
        "Telemetry instrumentation capturing intermediate retrieval traces."
      ],
      "evidence": [
        "Traces proving the agent terminates loops reliably within 3 turns.",
        "Component-level evals comparing retrieval recall of decomposed queries against raw user prompts."
      ]
    }
  },
  {
    "id": "search-vs-aurora",
    "theme": "architecture",
    "lead": "pe",
    "title": "OpenSearch Serverless vs Aurora pgvector: which vector store?",
    "question": "Should vector embeddings live in specialized OpenSearch Serverless or in an operational relational database like Aurora PostgreSQL?",
    "door": "one-way",
    "doorNote": "Migrating vector indexes and embedding stores between services requires changing ingestion pipelines, query logic and access control.",
    "why": "[[opensearch|Amazon OpenSearch Serverless]] is a dedicated search engine offering hybrid keyword plus vector search, integrated BM25 filtering, and lexical analysis. [[aurora|Amazon Aurora PostgreSQL]] with pgvector provides ACID transactions and co-located operational tables. Mixing up their roles leads to either building search features from scratch in SQL or overloading OpenSearch with high-throughput transactional writes.",
    "cols": [
      "Dimension",
      "Amazon OpenSearch Serverless",
      "Amazon Aurora PostgreSQL (pgvector)",
      "Architecture Verdict"
    ],
    "rows": [
      [
        "Primary Strength",
        "Hybrid search (BM25 + k-NN vectors), faceted filtering, text analyzers",
        "ACID transactions, relational joins, co-located operational business data",
        "OpenSearch for unstructured text; Aurora for structured data"
      ],
      [
        "Filtering & Facets",
        "Rich aggregations, geo-filtering, boolean filters, lexical analyzers",
        "SQL WHERE clauses, relational joins, composite indexes",
        "Aurora wins on complex relational joins; OpenSearch on text facets"
      ],
      [
        "Write Throughput",
        "Optimized for batch bulk indexing; slow single-record commits",
        "High-throughput transactional writes, row-level locking, instant updates",
        "Aurora for fast transactional entity updates"
      ],
      [
        "Operational Cost",
        "Hourly OCU billing (minimum 2-4 OCUs ≈ $350-$700/mo)",
        "Standard Aurora Serverless v2 capacity units (ACUs)",
        "Aurora is cheaper for small workloads; OpenSearch scales better for large corpora"
      ],
      [
        "Knowledge Bases Integration",
        "Native zero-code ingestion and vector management via [[bedrock-kb]]",
        "Supported as Bedrock KB vector store, but requires VPC and secret configuration",
        "OpenSearch Serverless is the default native choice for Bedrock"
      ]
    ],
    "rules": [
      [
        "The primary workload is document RAG requiring hybrid keyword + vector search and text filtering",
        "Use [[opensearch|OpenSearch Serverless]]. Building BM25 and text tokenizers in Postgres is fragile."
      ],
      [
        "Vectors represent operational entities (products, user profiles) that must join with relational tables in transactions",
        "Use [[aurora|Aurora PostgreSQL]] with pgvector."
      ],
      [
        "The solution uses [[bedrock-kb]] and team wants fully managed zero-maintenance vector storage",
        "Use OpenSearch Serverless."
      ],
      [
        "Monthly budget is under $100 and workload is light",
        "Use Aurora Serverless v2 or [[s3-vectors]] / pgvector on RDS rather than full OpenSearch Serverless."
      ]
    ],
    "redflags": [
      "Building an ad-hoc search engine in Aurora using `LIKE '%term%'` queries instead of a dedicated search engine.",
      "Treating OpenSearch Serverless as an operational relational database for transactional updates.",
      "Forgetting that OpenSearch Serverless has minimum OCU hourly charges even at zero traffic.",
      "Failing to index vector fields in pgvector with HNSW before benchmarking query performance."
    ],
    "ask": [
      "Do search queries require joining vectors against live relational operational tables?",
      "Do user queries require hybrid BM25 full-text scoring alongside vector similarity?",
      "What is the expected document ingestion volume and update frequency?",
      "What are the minimum monthly operational costs for each service under current team commitments?"
    ],
    "revisit": "When document corpus exceeds 10M vectors, when relational joins become a bottleneck in RAG, or when Aurora pgvector adds native hybrid BM25.",
    "related": [
      "opensearch",
      "aurora",
      "dynamodb",
      "bedrock-kb"
    ],
    "em": {
      "call": "Use OpenSearch Serverless for enterprise knowledge bases and document search. Use Aurora pgvector when vectors are attributes of existing transactional records.",
      "own": [
        "Infrastructure cost baseline ($350+/mo for OpenSearch Serverless OCUs vs Aurora).",
        "Data governance and operational boundary between search and core relational databases."
      ],
      "evidence": [
        "Total cost of ownership projection across 1-year document volume growth.",
        "Engineering hours required to maintain custom search ranking in Postgres vs managed OpenSearch."
      ]
    },
    "pe": {
      "call": "Default to [[opensearch]] for document RAG (hybrid BM25 + k-NN, document cracking, security filters); use [[aurora]] pgvector for operational entity vector queries.",
      "own": [
        "Index algorithm configuration (HNSW m and efSearch parameters), vector quantization, and filter execution order.",
        "Data synchronization pipeline between operational stores and search indexes."
      ],
      "evidence": [
        "P95 latency benchmark under concurrent query load comparing OpenSearch k-NN with Aurora pgvector.",
        "Recall@K evaluation with realistic enterprise metadata filters applied."
      ]
    }
  },
  {
    "id": "chunking-strategy",
    "theme": "architecture",
    "lead": "pe",
    "title": "Chunking strategies: fixed, semantic, hierarchical or document-aware?",
    "question": "How should documents be parsed, segmented and indexed for optimal embedding and retrieval?",
    "door": "two-way",
    "doorNote": "Re-chunking requires re-indexing the corpus and re-generating embeddings, but does not alter cloud infrastructure.",
    "why": "Bad chunking is the single most common cause of failed RAG pilots. If chunks are too small, they lose context; if too large, they dilute vector embeddings and fill the LLM context with irrelevant noise. Naive token chunking breaks sentences and flattens tables.",
    "cols": [
      "Strategy",
      "Segmentation Mechanism",
      "Preserves Layout & Tables",
      "Embedding Fidelity",
      "Best Fit"
    ],
    "rows": [
      [
        "Fixed-Length Token Splitter",
        "Splits every N tokens (e.g. 500) with 10% overlap",
        "Poor (splits mid-table and mid-sentence)",
        "Low-to-medium (context diluted or truncated)",
        "Simple raw text, unstructured transcripts"
      ],
      [
        "Sentence / Paragraph Splitter",
        "Splits on punctuation or double line-breaks",
        "Moderate (respects paragraphs, breaks tables)",
        "Medium (self-contained conceptual statements)",
        "Narrative articles, blog posts, news feeds"
      ],
      [
        "Document-Aware Layout Chunking",
        "Extracts headers, sections and tables via [[textract]]",
        "Excellent (preserves Markdown tables and headings)",
        "High (chunks reflect author structural intent)",
        "Enterprise PDFs, financial filings, technical manuals"
      ],
      [
        "Hierarchical Parent-Child Chunking",
        "Embeds small child chunks (200t); returns parent section (1,200t)",
        "High (searches specificity, provides full context)",
        "Highest (tight vectors, complete context to LLM)",
        "Legal contracts, policy documentation, compliance audits"
      ]
    ],
    "rules": [
      [
        "Documents contain tables, multi-column layouts or headers",
        "Use Document-Aware Layout Chunking via [[textract]]. Never use naive token splitters."
      ],
      [
        "Specific facts or numbers must be found, but the model needs surrounding context to explain them",
        "Use Hierarchical Parent-Child Chunking in [[bedrock-kb]]."
      ],
      [
        "Documents are short, homogeneous plain-text notes (<1,000 words)",
        "Sentence or paragraph-level chunking is sufficient."
      ],
      [
        "Chunks cross section boundaries",
        "Enforce a minimum 10-15% sliding window overlap to preserve cross-boundary semantics."
      ]
    ],
    "redflags": [
      "Using a fixed 500-token character splitter on scanned PDFs containing financial tables.",
      "Embedding table rows individually without column headers, destroying tabular context.",
      "Allowing chunk sizes over 2,000 tokens for embedding models designed for 512-token optimal dense representations.",
      "Failing to preserve document metadata (title, section, page number) on each indexed chunk."
    ],
    "ask": [
      "What layout elements exist in our corpus (tables, headers, footnotes, multi-column text)?",
      "Does our chunking pipeline preserve section hierarchy and table Markdown representations?",
      "What is our measured Recall@5 when testing different chunk sizes (200 vs 500 vs 1,000 tokens)?",
      "Are document breadcrumbs (e.g. \"Section 4.2 > Limitations\") prepended to each chunk before embedding?"
    ],
    "revisit": "When retrieval recall plateaus, when users complain about truncated context, or when Textract adds layout models.",
    "related": [
      "textract",
      "s3",
      "opensearch",
      "bedrock-kb"
    ],
    "em": {
      "call": "Mandate layout-aware chunking for all enterprise PDF ingestion. Bad chunking cannot be fixed by prompt engineering.",
      "own": [
        "Document pipeline ingestion budget (Textract layout analysis costs vs simple OCR).",
        "Golden evaluation dataset representing complex tabular and multi-page questions."
      ],
      "evidence": [
        "Side-by-side Groundedness comparison on tabular questions between naive chunking and layout-aware chunking.",
        "Preprocessing cost per 1,000 document pages."
      ]
    },
    "pe": {
      "call": "Implement layout-aware parsing using [[textract]] layout analysis; split on Markdown header tags and maintain 15% sliding window overlap.",
      "own": [
        "Chunking script logic, token length validation, metadata extraction, and parent-child document mapping.",
        "Evaluation harness measuring Recall@K across chunk size variations (250, 500, 1,000 tokens)."
      ],
      "evidence": [
        "Distribution histogram of chunk token lengths across the corpus.",
        "Recall@5 score comparison across chunking strategies on the golden test suite."
      ]
    }
  },
  {
    "id": "reranking-tradeoff",
    "theme": "architecture",
    "lead": "pe",
    "title": "Semantic reranking: when does relevance justify latency?",
    "question": "Should the search pipeline include a deep cross-encoder semantic reranker after initial vector retrieval?",
    "door": "two-way",
    "doorNote": "Enabling or disabling reranking in [[opensearch]] or [[bedrock-kb]] is an API flag; no index rebuilding or data migration is required.",
    "why": "First-stage retrieval (vector cosine similarity or BM25) is fast (20-50ms) but relies on approximate nearest neighbors or term frequencies. A second-stage semantic reranker (such as Cohere Rerank or Bedrock Rerank) evaluates the top passages through a deep language model to score relevance, lifting NDCG by 15-25% at the cost of 100-250ms latency.",
    "cols": [
      "Pipeline Stage",
      "Mechanism",
      "Latency Overhead",
      "Relevance Lift (NDCG@10)",
      "Best Production Fit"
    ],
    "rows": [
      [
        "Single-Stage Vector Search",
        "Cosine similarity over HNSW vector graph in [[opensearch]]",
        "None (20-40ms total)",
        "Baseline",
        "Internal tools, latency-sensitive autocomplete, prototypes"
      ],
      [
        "Single-Stage Hybrid Search",
        "RRF combines BM25 keyword and dense vector ranks",
        "+10-30ms (30-70ms total)",
        "+8% to +12% over vector alone",
        "Technical intranets, general documentation search"
      ],
      [
        "Two-Stage: Hybrid + Reranker",
        "RRF surfaces top 50 candidates; cross-encoder reranks top 5",
        "+100-250ms (150-320ms total)",
        "+18% to +25% over vector alone",
        "Customer-facing assistants, high-stakes compliance, executive briefs"
      ],
      [
        "Two-Stage: Vector + Small Reranker",
        "Dense vector search surfaces top 20 candidates; fast local reranker reranks",
        "+50-100ms (70-140ms total)",
        "+12% to +16% over vector alone",
        "Balanced latency-sensitive conversational agents"
      ]
    ],
    "rules": [
      [
        "User-facing assistant where incorrect answers damage customer trust or revenue",
        "Enable semantic reranking. The 20% relevance boost outweighs 150ms latency."
      ],
      [
        "End-to-end P95 latency SLA is strictly under 1,000ms",
        "Use hybrid search (BM25 + vector via RRF) without semantic reranker."
      ],
      [
        "The retrieved passages contain subtle negations, conditions or fine print",
        "Enable semantic reranking. Bi-encoders miss subtle logical qualifiers that cross-encoders catch."
      ],
      [
        "Monthly query volume is tens of millions and budget is constrained",
        "Benchmark whether the NDCG lift justifies per-query reranking API costs."
      ]
    ],
    "redflags": [
      "Sending 200+ candidates to the reranker, causing massive latency spikes and high billing.",
      "Enabling semantic reranking without measuring baseline Recall@K and NDCG@10 on a golden dataset.",
      "Assuming semantic reranking can compensate for corrupted chunks or missing source documents.",
      "Skipping reranking evaluation for non-English languages."
    ],
    "ask": [
      "What is our measured NDCG@10 and Recall@5 with and without the semantic reranker?",
      "What is the P95 latency breakdown of initial retrieval versus the reranking step?",
      "How many candidate passages are passed to the reranker (recommended: 30-50)?",
      "What is the estimated monthly cost of semantic reranker API calls at scale?"
    ],
    "revisit": "When embedding models improve (e.g. newer dense models closing the gap), or when query latency violates user experience targets.",
    "related": [
      "opensearch",
      "bedrock",
      "bedrock-kb",
      "comprehend"
    ],
    "em": {
      "call": "Turn on semantic reranking for customer-facing applications. The measurable gain in answer groundedness protects brand trust.",
      "own": [
        "Per-query reranking API cost approval.",
        "Customer SLA definition balancing response quality against latency."
      ],
      "evidence": [
        "Evaluation scorecard showing Groundedness and Relevance scores with and without reranker.",
        "Latency impact report measuring TTFT with reranking enabled."
      ]
    },
    "pe": {
      "call": "Configure two-stage retrieval: surface top 50 candidates via [[opensearch]] hybrid search; rerank top 5 passages into [[bedrock]] prompt.",
      "own": [
        "Candidate pool size tuning (k=30-50), score threshold filtering, and fallback on reranker timeout.",
        "End-to-end tracing in [[cloudwatch]] isolating reranking latency."
      ],
      "evidence": [
        "A/B test NDCG@10 comparison across 500 representative enterprise queries.",
        "P95 and P99 latency distribution of the reranking API call."
      ]
    }
  },
  {
    "id": "graphrag-vs-vector",
    "theme": "architecture",
    "lead": "pe",
    "title": "GraphRAG vs vector RAG: when are entity relationships important?",
    "question": "When does a project require knowledge graph extraction and community summaries rather than standard vector retrieval?",
    "door": "mixed",
    "doorNote": "Building a knowledge graph in [[neptune]] requires a substantial offline extraction investment; query retrieval can fall back to standard vector search at any time.",
    "why": "Vector RAG is a \"local\" retrieval technique: it finds specific text chunks similar to a query. However, it cannot answer global questions that require understanding cross-document themes, corporate connections, or complex multi-hop entity relationships. GraphRAG extracts entities, relationships and claims into hierarchical communities, but costs significantly more to build and maintain.",
    "cols": [
      "Evaluation Dimension",
      "Vector RAG ([[bedrock-kb]])",
      "GraphRAG ([[neptune]] + LLM)",
      "Architecture Verdict"
    ],
    "rows": [
      [
        "Query Type",
        "Specific fact retrieval (\"What is the refund window in policy X?\")",
        "Global synthesis & themes (\"What are the top 5 operational risks across all 2024 audits?\")",
        "Vector RAG for point lookups; GraphRAG for cross-corpus summarization"
      ],
      [
        "Multi-Hop Reasoning",
        "Poor (fails when facts are in disconnected documents)",
        "High (traverses explicit entity and relationship edges)",
        "GraphRAG excels at multi-hop relationship queries"
      ],
      [
        "Indexing Cost & Time",
        "Low: 1 embedding call per chunk; minutes to index",
        "High: 3-5 LLM extraction calls per chunk to build graph; hours/days",
        "GraphRAG indexing is 50x-100x more expensive in token spend"
      ],
      [
        "Infrastructure Required",
        "[[opensearch|OpenSearch Serverless]] vector collection",
        "Graph database ([[neptune]]) + Vector store + Graph extraction pipeline",
        "GraphRAG adds graph DB operational complexity"
      ],
      [
        "Maintenance & Updates",
        "Incremental chunk additions are straightforward",
        "Adding documents requires incremental entity extraction and community re-clustering",
        "Vector RAG is much simpler to keep fresh"
      ]
    ],
    "rules": [
      [
        "Users ask global, holistic questions over large document collections (\"Summarize all complaints regarding Product Y\")",
        "Use GraphRAG."
      ],
      [
        "Users ask specific, targeted factual questions that can be found in 1-2 paragraphs",
        "Use standard Vector RAG with [[bedrock-kb]]. GraphRAG is overkill."
      ],
      [
        "The dataset has deeply interconnected entities (investigations, fraud detection, supply chains)",
        "Use [[neptune]] to model entities and relationships explicitly."
      ],
      [
        "Indexing budget is limited or content updates every few minutes",
        "Use Vector RAG. GraphRAG extraction costs and pipeline latencies do not support real-time streaming updates."
      ]
    ],
    "redflags": [
      "Proposing GraphRAG for simple customer service FAQ lookup.",
      "Underestimating the massive token cost of offline graph extraction (extracting entities, relationships, and claims across 100k documents).",
      "Deploying GraphRAG without evaluating whether hybrid search with semantic reranking already solves the problem.",
      "Failing to establish an incremental graph update procedure for new incoming documents."
    ],
    "ask": [
      "What percentage of user queries require global corpus summarization versus specific passage retrieval?",
      "What is the estimated token cost to build and periodically re-cluster the knowledge graph?",
      "Who owns the graph database schema, entity resolution rules, and graph operations?",
      "Can our use case tolerate the latency and cost of GraphRAG query execution?"
    ],
    "revisit": "When users frequently complain that search misses cross-document connections, or when managed GraphRAG features mature.",
    "related": [
      "neptune",
      "opensearch",
      "bedrock",
      "s3"
    ],
    "em": {
      "call": "Reject GraphRAG for standard Q&A features. Approve it only for executive synthesis, fraud networks, or legal intelligence where cross-corpus analysis is the core value proposition.",
      "own": [
        "Graph extraction token budget (often $5k-$20k+ for initial graph build).",
        "ROI justification based on high-value executive or investigative use cases."
      ],
      "evidence": [
        "Detailed cost projection for initial graph indexing and monthly incremental updates.",
        "Test results comparing Vector RAG vs GraphRAG on a benchmark of 50 global synthesis questions."
      ]
    },
    "pe": {
      "call": "Use [[neptune]] for explicit entity relationship modeling; combine graph traversal with [[opensearch]] vector retrieval for hybrid local-global RAG.",
      "own": [
        "Entity resolution algorithms, graph schema design, community detection clustering, and prompt extraction templates.",
        "Incremental graph update pipeline using [[s3]] events and [[lambda]]."
      ],
      "evidence": [
        "Extraction accuracy validation measuring entity and relationship precision against ground truth.",
        "Latency and cost benchmarks comparing local vector queries against global graph community queries."
      ]
    }
  },
  {
    "id": "index-tenancy",
    "theme": "risk",
    "lead": "both",
    "title": "Shared vs isolated search indexes: how to separate enterprise tenants?",
    "question": "How should multi-tenant RAG data be partitioned across OpenSearch collections and indexes?",
    "door": "one-way",
    "doorNote": "Reorganizing data between shared collections, dedicated indexes and dedicated AWS accounts requires migrating live data and re-indexing.",
    "why": "Tenant isolation is both a security guarantee and an economic trade-off. An OpenSearch Serverless collection incurs hourly OpenSearch Compute Unit (OCU) costs ($0.24/OCU/hr, min 2-4 OCUs). Creating a collection per tenant for hundreds of small tenants causes catastrophic cost scaling. Conversely, a shared collection requires flawless document-level security filtering.",
    "cols": [
      "Model",
      "Isolation Mechanism",
      "Cost per Tenant",
      "Noisy Neighbor Protection",
      "Best Production Fit"
    ],
    "rows": [
      [
        "Shared Collection & Index (Logical)",
        "Every document tagged with `tenant_id`; query proxy injects filter",
        "Lowest (pennies/mo per tenant)",
        "Low (shared indexing and search capacity)",
        "Standard B2B SaaS with hundreds or thousands of low-tier tenants"
      ],
      [
        "Index per Tenant (Shared Collection)",
        "Dedicated OpenSearch index per tenant within a shared collection",
        "Moderate (constrained by index counts per collection)",
        "Medium (index-level isolation, shared collection compute)",
        "Mid-market tiers (50-200 tenants) requiring distinct schemas or fast deletion"
      ],
      [
        "Collection per Tenant (Compute Isolated)",
        "Dedicated OpenSearch Serverless collection per customer",
        "High ($350-$700+/mo per tenant minimum)",
        "High (dedicated OCU compute and network policies)",
        "Enterprise tier customers paying premium for isolated infrastructure"
      ],
      [
        "Account per Tenant (Physical Isolation)",
        "Dedicated AWS Account per tenant managed via AWS Organizations",
        "Highest ($1,000+/mo per tenant)",
        "Complete physical and regulatory isolation",
        "Government, defense, and highly regulated banking tiers"
      ]
    ],
    "rules": [
      [
        "Serving SMB/standard B2B customers where cost per tenant must stay under $5/month",
        "Use Shared Index with mandatory backend `tenant_id` filter injection. Never trust client filters."
      ],
      [
        "Enterprise customers mandate contractual physical data and compute isolation",
        "Provide Dedicated Collection or Dedicated Account as a premium priced tier."
      ],
      [
        "Customers require one-click instant data deletion (GDPR Article 17 / Right to be Forgotten)",
        "Use Index-per-Tenant. Deleting an entire index is atomic and instantaneous."
      ],
      [
        "Tenants require custom embedding models or distinct document schemas",
        "Use Index-per-Tenant or Collection-per-Tenant."
      ]
    ],
    "redflags": [
      "Relying on client-side frontend code to supply the `tenant_id` search filter.",
      "Creating an OpenSearch Serverless collection per tenant for 500 low-paying customers, creating a massive monthly bill.",
      "Failing to test cross-tenant query leakage in automated CI regression test suites.",
      "Caching semantic search results without incorporating tenant ID into cache keys."
    ],
    "ask": [
      "What are our contractual data isolation commitments with each customer tier?",
      "How does the application backend authenticate and inject the caller tenant ID into search queries?",
      "Do we have automated integration tests verifying that Tenant A cannot retrieve Tenant B documents?",
      "How is tenant data purged when a customer cancels their subscription?"
    ],
    "revisit": "When customer tiering strategy changes, when enterprise sales demands dedicated isolation, or when tenant count exceeds 1,000.",
    "related": [
      "opensearch",
      "cognito",
      "iam",
      "kms"
    ],
    "em": {
      "call": "Adopt a hybrid model: Shared Index for standard tiers; Dedicated Collection / Account for high-ACV enterprise contracts with dedicated pricing.",
      "own": [
        "Packaging and pricing strategy for dedicated enterprise isolation.",
        "Legal and compliance sign-off on logical versus physical data separation."
      ],
      "evidence": [
        "Unit economics model showing infrastructure cost per tenant across shared and dedicated architectures.",
        "Customer contracts audit verifying data isolation requirements."
      ]
    },
    "pe": {
      "call": "Enforce tenant filter injection in a trusted API gateway proxy using verified [[cognito]] JWT claims; test cross-tenant boundary security in CI.",
      "own": [
        "Security filter injection logic, index naming conventions, and cache key partitioning.",
        "Automated cross-tenant penetration test suite running in build pipelines."
      ],
      "evidence": [
        "Automated test execution report proving zero query leakage across 1,000 randomized cross-tenant search requests.",
        "Code review of the search proxy confirming no direct client search access."
      ]
    }
  },
  {
    "id": "workflow-vs-agent",
    "theme": "strategy",
    "lead": "both",
    "title": "Deterministic workflow vs autonomous agent: what to choose?",
    "question": "When should a business process use deterministic application code and workflows versus an autonomous AI agent?",
    "door": "two-way",
    "doorNote": "Workflows and agents can be composed together: an agent can invoke a Step Functions workflow as a tool, or a workflow can invoke an agent for unstructured reasoning.",
    "why": "An autonomous agent is non-deterministic: it decides which steps to take, which tools to call, and when it is finished. For deterministic business processes (payroll, regulatory compliance, transaction processing), autonomous agents introduce unacceptable variance, cost, and failure modes. AWS advises workflows for predefined execution paths and agents for open-ended problem solving.",
    "cols": [
      "Pattern",
      "Control Flow",
      "Predictability & Auditing",
      "Error Recovery",
      "Best Production Fit"
    ],
    "rows": [
      [
        "Deterministic Code / Script",
        "Hardcoded if/else branches, static function calls",
        "100% predictable; strict unit testing",
        "Standard try/catch; explicit error codes",
        "CRUD operations, data migrations, math calculations"
      ],
      [
        "State Machine ([[stepfunctions]])",
        "Declarative state graph, retries, branching, human approval tasks",
        "100% predictable state flow; full visual execution audit",
        "Configured catch blocks, exponential backoff, dead-letter queues",
        "Order fulfillment, multi-step approvals, ETL pipelines"
      ],
      [
        "Workflow with LLM Steps",
        "Deterministic workflow where specific steps invoke an LLM for extraction or summarization",
        "Predictable structure; bounded non-deterministic content within steps",
        "Step retries with temperature adjustment; fallback prompts",
        "Invoice processing, support ticket triage, content moderation"
      ],
      [
        "Autonomous Agent ([[bedrock-agents]])",
        "LLM dynamically plans sequence of tool invocations based on intermediate results",
        "Non-deterministic step order; variable latency and token spend",
        "LLM reflection, re-planning, human-in-the-loop intervention",
        "Open-ended research, troubleshooting diagnostics, exploratory analytics"
      ]
    ],
    "rules": [
      [
        "The sequence of business steps is known in advance",
        "Use a deterministic workflow ([[stepfunctions]]). Never use an autonomous agent."
      ],
      [
        "The task requires writing to transactional databases, moving money, or irreversible actions",
        "Use a workflow with explicit human approval gates."
      ],
      [
        "The sequence of steps depends entirely on what is discovered at runtime (e.g. diagnosing an unknown system error)",
        "Use an autonomous agent with [[bedrock-agents]] or [[agentcore]]."
      ],
      [
        "The team wants autonomous reasoning inside a regulated business flow",
        "Decompose: make the workflow deterministic at the top level, and delegate bounded sub-tasks to agents."
      ]
    ],
    "redflags": [
      "Building an autonomous agent to perform an 8-step process that always follows the exact same 8 steps.",
      "Relying on prompt instructions to guarantee that an autonomous agent never skips a mandatory compliance step.",
      "Allowing an autonomous agent to execute database write operations without human approval or strict schema constraints.",
      "Failing to set hard caps on agent execution time and maximum tool invocation loops."
    ],
    "ask": [
      "Can the business process be diagrammed as a finite state machine with known branches?",
      "What is the acceptable variance in execution steps, latency, and cost per task?",
      "What happens if the agent executes steps in an unexpected order?",
      "Are irreversible actions protected by deterministic code constraints rather than prompt guidelines?"
    ],
    "revisit": "When deterministic workflows become too brittle due to thousands of edge cases, or when agent reliability improves on benchmarks.",
    "related": [
      "stepfunctions",
      "bedrock-agents",
      "agentcore",
      "lambda"
    ],
    "em": {
      "call": "Default to deterministic workflows with embedded AI calls. Approve autonomous agents only where dynamic step planning is proven essential.",
      "own": [
        "Business risk sign-off on non-deterministic process execution.",
        "Budget control (workflows have fixed costs; autonomous agents have variable token spend)."
      ],
      "evidence": [
        "Process flow analysis demonstrating why static branching cannot satisfy the requirements.",
        "Cost and latency variance analysis from prototype runs."
      ]
    },
    "pe": {
      "call": "Use [[stepfunctions]] for system orchestration and state management; treat [[bedrock-agents]] as specialized workers invoked for open-ended reasoning.",
      "own": [
        "Workflow state machine definitions, tool interface schemas, and timeout/circuit-breaker configuration.",
        "Loop detection and execution budget enforcement on autonomous sub-agents."
      ],
      "evidence": [
        "Execution trace comparison showing state machine reliability versus autonomous agent variability.",
        "Chaos testing demonstrating that agent failure is safely contained by the parent workflow."
      ]
    }
  },
  {
    "id": "model-deployment-capacity",
    "theme": "strategy",
    "lead": "em",
    "title": "Model deployment and AWS capacity decision matrix",
    "question": "Which AWS model deployment type, throughput tier and capacity strategy fits your workload, latency SLA and budget?",
    "door": "mixed",
    "doorNote": "Switching between Bedrock On-Demand pay-as-you-go and Provisioned Throughput takes minutes in the console, but Provisioned Throughput requires minimum 1-month or 6-month commitments.",
    "why": "Running out of model capacity or hitting HTTP 429 throttling exceptions is the #1 cause of failed generative AI launches. AWS offers multiple deployment options (Bedrock On-Demand, Bedrock Provisioned Throughput, Cross-Region Inference Profiles, Batch Inference, and SageMaker Real-Time Endpoints) with vastly different throughput guarantees, pricing, regional availability and data residency rules.",
    "cols": [
      "Deployment Option",
      "Throughput Guarantee",
      "Pricing Model",
      "Data Residency",
      "Best Production Fit"
    ],
    "rows": [
      [
        "Bedrock On-Demand",
        "Shared capacity pool; subject to regional TPM quotas and 429 throttling",
        "Pay-per-token (input/output)",
        "Stays strictly within selected AWS Region",
        "Prototypes, pilots, variable internal tools, developer sandboxes"
      ],
      [
        "Cross-Region Inference Profiles",
        "Higher availability; automatically routes requests across multiple AWS Regions",
        "Standard On-Demand per-token rates (no premium)",
        "Dynamic routing across specified geographic regions (e.g. US, EU)",
        "Production applications requiring high burst capacity and 429 resilience"
      ],
      [
        "Bedrock Provisioned Throughput (PT)",
        "Guaranteed reserved model units (Model Units/hr); zero 429 throttling within limit",
        "Fixed hourly commitment (1-month or 6-month term commitment)",
        "Dedicated reserved capacity in selected Region",
        "Mission-critical customer applications with steady 24/7 volume and P99 latency SLAs"
      ],
      [
        "Bedrock Batch Inference",
        "Asynchronous offline execution completed within 24 hours",
        "50% discount compared to On-Demand token pricing",
        "Selected AWS Region",
        "Bulk document re-indexing, offline evaluations, nightly summarization"
      ],
      [
        "SageMaker Endpoints ([[sm-inference]])",
        "Dedicated EC2/GPU instances ([[ec2]] P4d/G5, Inferentia2); full OS/vLLM control",
        "Hourly instance billing regardless of query volume",
        "Strict single-VPC instance locality",
        "Self-hosted open-weight models (Llama, Mistral), custom C++ serving runtimes"
      ]
    ],
    "rules": [
      [
        "Workload has predictable, high 24/7 query volume (>100 tokens/sec continuous) and requires strict P99 latency",
        "Purchase Bedrock Provisioned Throughput."
      ],
      [
        "Workload is user-facing with variable burst traffic, and geographic compliance allows cross-region routing",
        "Use Cross-Region Inference Profiles in [[bedrock]] to mitigate 429 throttling."
      ],
      [
        "Processing large offline datasets that do not require immediate responses (nightly report generation)",
        "Use Bedrock Batch Inference for an immediate 50% cost reduction."
      ],
      [
        "Team requires proprietary weights or custom CUDA/vLLM optimizations not offered on Bedrock",
        "Deploy dedicated [[sm-inference|SageMaker Real-Time Endpoints]] on GPU instances."
      ]
    ],
    "redflags": [
      "Launching a high-visibility marketing campaign on Bedrock On-Demand without requesting service quota increases 4 weeks prior.",
      "Purchasing 6-month Provisioned Throughput commitments before measuring steady-state production baseline volume.",
      "Ignoring Bedrock Cross-Region Inference Profiles for latency-sensitive applications that experience regional quota throttling.",
      "Failing to implement exponential backoff and jitter in client SDKs for handling transient 429 ThrottlingException errors."
    ],
    "ask": [
      "What is our projected peak Tokens Per Minute (TPM) and Requests Per Minute (RPM) at launch?",
      "Does our enterprise data sovereignty policy permit Cross-Region Inference Profiles?",
      "At what steady-state token volume does Provisioned Throughput become cheaper than On-Demand pay-as-you-go?",
      "Do we have an automated failover pool configured across multiple Bedrock foundation models or regions?"
    ],
    "revisit": "Quarterly when usage doubles, when new model generations launch, or when AWS introduces new pricing tiers.",
    "related": [
      "bedrock",
      "sm-inference",
      "ec2",
      "apigw"
    ],
    "em": {
      "call": "Prototype on Bedrock On-Demand using Cross-Region Inference; commit to Provisioned Throughput only when baseline volume justifies the monthly cost.",
      "own": [
        "Monthly capacity budget and financial commitment sign-offs.",
        "Service Quota increase requests submitted 4 weeks prior to major launch events."
      ],
      "evidence": [
        "Traffic model forecasting average and peak TPM/RPM requirements.",
        "FinOps break-even analysis comparing On-Demand token spend against Provisioned Throughput hourly commitments."
      ]
    },
    "pe": {
      "call": "Configure client SDKs with exponential backoff and jitter; route traffic through [[apigw]] with multi-region Bedrock endpoint fallback pools.",
      "own": [
        "Capacity monitoring, rate-limit metric tracking in [[cloudwatch]], and retry policy implementation.",
        "Model abstraction layer enabling dynamic routing between On-Demand and Provisioned deployments."
      ],
      "evidence": [
        "Load-test report demonstrating client behavior during simulated 429 throttling bursts.",
        "Telemetry dashboard tracking token consumption against service quota thresholds in real time."
      ]
    }
  }
];
