/* Decision guides for engineering managers and principal engineers.
   Schema per decision:
   id, theme ('strategy'|'architecture'|'risk'), title, question, door ('two-way'|'one-way'|'mixed'), doorNote,
   why (why it matters), cols, rows, rules:[[if, then]], redflags:[], ask:[], revisit, related:[service ids]
   Text supports `code`, **bold**, [[service-id|label]]. */
window.ATLAS.decisionThemes = [
  { id: 'strategy', name: 'Strategy & scope', blurb: 'Decide what to build, how autonomous it should be, and how to improve it. These are the decisions that set the budget and the team.' },
  { id: 'architecture', name: 'Architecture', blurb: 'Where models run, how agents are hosted, how retrieval works, and how the system copes with load and capacity.' },
  { id: 'risk', name: 'Risk, quality & cost', blurb: 'How you will know it works, how much you trust it to act, what it costs to run, and how tenants stay apart.' }
];

window.ATLAS.decisions = [
  /* ---------------- STRATEGY ---------------- */
  {
    id: 'build-buy-customize', theme: 'strategy', title: 'Build, buy or customise?',
    question: 'How much of this should we build ourselves, and how much should we adopt?',
    door: 'mixed', doorNote: 'Two-way at the start. It becomes one-way once your data, workflows and people depend on the choice.',
    why: 'Every AI feature has a build cost and a run cost, and the second is the one teams under-estimate. The wrong level of build also locks in headcount: a self-managed GPU stack needs people on call for it.',
    cols: ['Path', 'First value in', 'You own', 'Fits when', 'Main risk'],
    rows: [
      ['Adopt a finished product ([[q|Amazon Q]], SaaS copilots)', 'Days', 'Configuration and data hygiene', 'Commodity needs: developer productivity, internal search', 'Capability ceiling; per-seat cost; limited customisation'],
      ['Managed blocks ([[bedrock]] + [[bedrock-kb|Knowledge Bases]] + [[bedrock-agents|Agents]])', 'Weeks', 'Prompts, data, evals, application glue', 'A differentiated feature built on standard patterns', 'Quotas and the limits of the abstraction'],
      ['Code-first on a managed runtime ([[agentcore]] + a framework)', 'Weeks to a few months', 'Agent logic, tools, memory strategy', 'Bespoke control flow, multi-agent designs, any model', 'You own agent quality and its operations'],
      ['Managed ML platform ([[sm-training|SageMaker]])', 'Months', 'Models, features, pipelines, monitoring', 'Proprietary data is the advantage; predictive models', 'MLOps burden; scarce specialist talent'],
      ['Self-managed on [[eks|EKS]] / [[ec2|EC2]]', 'Months or more', 'Everything, including GPU capacity', 'Extreme scale or cost pressure, strict locality, custom serving', 'Operations load; GPU supply risk']
    ],
    rules: [
      ['The capability is not a differentiator for us', 'Buy. Put the effort into rollout and data quality.'],
      ['It is differentiating and a standard pattern (RAG, tool use) covers it', 'Managed blocks. Spend your time on evals and domain data.'],
      ['The control flow is bespoke, or you need a model Bedrock does not offer', 'Code-first on a managed runtime, still without owning servers.'],
      ['You have a proven data advantage and a trained model beats prompting on your evals', 'Own the model on SageMaker. Not before.'],
      ['You need locality, unit-cost or latency that managed services cannot meet', 'Self-managed, with a named owner for GPU capacity.']
    ],
    redflags: [
      'Fine-tuning is proposed before anyone has measured a prompt-plus-RAG baseline.',
      'A "platform" is being built before the first use case is in production.',
      'The build-or-buy case rests on demo quality rather than on an eval set.',
      'Run cost and on-call burden are missing from the comparison.',
      'There is no exit path if the model or vendor changes in twelve months.'
    ],
    ask: [
      'Which part of this is our differentiator, and which part is plumbing?',
      'What does it cost per task at the volume we expect in a year, and who pays for it?',
      'Who is on call for it, and what do they do at 3 a.m.?',
      'If we had to swap the model or vendor next year, what would break?'
    ],
    revisit: 'Each quarter, when volume grows tenfold, or when a managed option adds the capability you built.',
    related: ['bedrock', 'agentcore', 'sm-training', 'q']
  },
  {
    id: 'autonomy-level', theme: 'strategy', title: 'How autonomous should it be?',
    question: 'Is this a single model call, a fixed workflow, or an agent that decides its own steps?',
    door: 'two-way', doorNote: 'Easy to move up a level later if tools sit behind clean interfaces. Hard to move down once users expect autonomy.',
    why: 'Autonomy multiplies cost, latency and the ways things go wrong. Most business problems have a known path, and a workflow with LLM steps is cheaper, faster and easier to test than an agent that rediscovers the path every time.',
    cols: ['Level', 'Pattern', 'Predictability', 'AWS building blocks', 'Cost of a failure'],
    rows: [
      ['0. Single call', 'One prompt in, one answer out (classify, summarise, extract)', 'High', '[[bedrock]], [[lambda]]', 'Low: a wrong answer'],
      ['1. Grounded answer', 'Retrieve, then generate (RAG)', 'High', '[[bedrock-kb|Knowledge Bases]], vector store', 'Low to medium: a confident wrong answer'],
      ['2. Workflow with LLM steps', 'A fixed path where models handle individual steps', 'High', '[[stepfunctions]], [[lambda]], [[bedrock]]', 'Medium: bounded by the path'],
      ['3. Agent, human approves writes', 'Model chooses tools; a person approves anything that changes state', 'Medium', '[[bedrock-agents|Bedrock Agents]] or [[agentcore]], return of control', 'Medium: caught at approval'],
      ['4. Agent acts within limits', 'Autonomous with scoped roles, spend caps, reversible actions', 'Lower', '[[agentcore]], [[iam]], [[budgets]]', 'High: acts before anyone looks'],
      ['5. Multi-agent, autonomous', 'Several agents delegating to each other', 'Lowest', '[[agentcore]], a supervisor pattern', 'Highest: errors compound across agents']
    ],
    rules: [
      ['You can write the steps down', 'Use a workflow (level 2). It is cheaper and testable.'],
      ['The path depends on what the model finds along the way', 'Use an agent, and start at level 3.'],
      ['Any action changes money, data or access', 'Keep a human approval until measured error rates earn autonomy.'],
      ['One agent with more tools would do', 'Do not use multiple agents. Add them only for separate trust boundaries or clearly separate skills.']
    ],
    redflags: [
      'The word "agent" is in the title and nobody can describe a task whose steps vary.',
      'Agents call other agents with no limit on depth or total tokens.',
      'Tools are broad ("run any SQL") rather than narrow ("get order status").',
      'Autonomy is promised on a date, not earned by measured accuracy.'
    ],
    ask: [
      'Can you draw the steps? If yes, why is this not a workflow?',
      'What is the worst thing the agent can do with its permissions today?',
      'What is the agent\'s measured success rate on the eval set, and what is the target before we remove approvals?',
      'What stops a loop from burning tokens all night?'
    ],
    revisit: 'When the eval set shows consistently high accuracy for a class of action, consider removing approval for that class only.',
    related: ['bedrock-agents', 'agentcore', 'stepfunctions', 'iam']
  },
  {
    id: 'improve-model', theme: 'strategy', title: 'How do we make it better at our task?',
    question: 'Prompt, retrieve, fine-tune, or pre-train? In what order?',
    door: 'two-way', doorNote: 'Prompting and RAG are cheap to change. Fine-tuning creates a data pipeline and a model you must maintain.',
    why: 'Teams jump to fine-tuning because it feels like real engineering. Usually the gain is in the prompt, the retrieval, or the data, and each step down this list costs far more than the one above it.',
    cols: ['Approach', 'What changes', 'Good for', 'Cost and effort', 'Maintenance'],
    rows: [
      ['Prompt engineering', 'Instructions and examples', 'Format, tone, simple tasks', 'Minutes; no cost beyond tokens', 'Re-test when the model version changes'],
      ['RAG ([[bedrock-kb|Knowledge Bases]])', 'What the model can see at question time', 'Private, current or large knowledge', 'Days; ongoing retrieval cost', 'Keep the index fresh; tune chunking'],
      ['Fine-tune on [[bedrock|Bedrock]]', 'Model weights, managed', 'Style, format, narrow tasks with labelled data', 'Days; custom model hosting may need provisioned capacity', 'Retrain when the base model is retired'],
      ['Fine-tune on [[sm-training|SageMaker]]', 'Weights of an open model, full control', 'Specialised domains, a smaller and cheaper model', 'Weeks; GPU training plus hosting', 'You run training, serving and upgrades'],
      ['Continued pre-training', 'Broad domain knowledge in the weights', 'Very large unlabelled domain corpora', 'Heavy; cluster scale ([[hyperpod|HyperPod]])', 'Highest']
    ],
    rules: [
      ['The task is not yet measured', 'Build the eval set first. Nothing below makes sense without it.'],
      ['The model lacks facts, or facts change', 'RAG. Knowledge belongs outside the weights.'],
      ['The model knows enough but behaves wrongly (format, tone, a narrow skill)', 'Fine-tune, after prompting has plateaued on your evals.'],
      ['A small model with tuning could replace a large one at lower unit cost', 'Fine-tune or distil a smaller model.'],
      ['You hold a very large domain corpus and have a reason to own the model', 'Consider continued pre-training. Rarely the right answer.']
    ],
    redflags: [
      'No baseline numbers for the prompt-only and prompt-plus-RAG versions.',
      'Fine-tuning data was scraped together without review or a held-out test set.',
      'The plan has no owner for retraining when the base model is retired.',
      'Retrieval quality has never been measured separately from answer quality.'
    ],
    ask: [
      'What is the score of the best prompt-and-RAG version on our eval set?',
      'What exactly is the gap fine-tuning would close, and how will we show it closed?',
      'Where does the training data come from, and are we allowed to use it?',
      'Who maintains this after the first release?'
    ],
    revisit: 'When the base model changes, when evals plateau, or when unit cost forces a smaller model.',
    related: ['bedrock-kb', 'bedrock', 'sm-training', 'hyperpod']
  },

  /* ---------------- ARCHITECTURE ---------------- */
  {
    id: 'where-model-runs', theme: 'architecture', title: 'Where should the model run?',
    question: 'Managed API, provisioned capacity, SageMaker hosting, or our own containers?',
    door: 'two-way', doorNote: 'Easy to change if your code calls models through one interface (such as the Converse API) and not directly.',
    why: 'Hosting determines unit cost at scale, how much operations work you take on, and whether a capacity shortage can take you down. Each step down this list buys control and costs people.',
    cols: ['Option', 'Best for', 'You manage', 'Watch out for'],
    rows: [
      ['[[bedrock|Bedrock on-demand]]', 'Most LLM features; bursty or modest volume', 'Prompts, quotas, retries', 'Per-model throttling; model retirement'],
      ['[[bedrock|Bedrock Provisioned Throughput]]', 'Steady high volume needing guaranteed capacity; some custom models', 'Commitment sizing', 'Paying for idle capacity'],
      ['[[sm-inference|SageMaker real-time]]', 'Your own or open-weight model with steady traffic', 'Instance sizing, scaling, container', 'Billing while idle; slow scale-out'],
      ['[[sm-inference|SageMaker asynchronous]]', 'Large payloads, long processing, spiky work', 'Result handling', 'First-request latency after scale to zero'],
      ['[[ecs|ECS]] / [[eks|EKS]] on GPUs', 'Custom serving stacks; maximum cost control at scale', 'Nearly everything', 'GPU capacity, image start-up time, operations load'],
      ['[[lambda|Lambda]]', 'Small CPU models, glue and tool execution', 'Package size and cold starts', 'No GPU; 15-minute limit']
    ],
    rules: [
      ['A Bedrock model meets quality and cost targets', 'Use Bedrock on-demand. Stop here.'],
      ['Traffic is steady and you are being throttled or need guaranteed latency', 'Add Provisioned Throughput or cross-Region inference profiles.'],
      ['The model you need is not on Bedrock', 'SageMaker real-time or async, using a managed serving container.'],
      ['Volume is high and steady, and per-token cost dominates the P&L', 'Evaluate self-hosting on EKS or ECS, including the cost of the people to run it.'],
      ['The model is small and CPU-bound', 'Lambda or a Fargate service.']
    ],
    redflags: [
      'Self-hosting proposed on the basis of per-token price alone, with no staffing or utilisation estimate.',
      'Application code calls one vendor SDK directly everywhere.',
      'No plan for what happens when a GPU instance type is unavailable.',
      'Endpoints left running in dev and test accounts.'
    ],
    ask: [
      'What is the expected GPU utilisation, and what does the break-even look like against the managed price?',
      'What is our fallback if this model or instance type is unavailable?',
      'Can we move to another model by changing configuration?',
      'Who owns capacity planning?'
    ],
    revisit: 'When monthly inference spend passes a threshold you set, or when a managed model closes the quality gap.',
    related: ['bedrock', 'sm-inference', 'eks', 'ecs', 'lambda']
  },
  {
    id: 'agent-runtime', theme: 'architecture', title: 'How do we host the agent?',
    question: 'Configuration-driven agents, code-first on a managed runtime, a workflow engine, or our own service?',
    door: 'mixed', doorNote: 'Tools and data stay portable if they are plain functions with clear schemas. Orchestration code is the part that locks you in.',
    why: 'The runtime decides how you debug non-deterministic behaviour, how sessions are isolated, how tools authenticate, and how much glue you write.',
    cols: ['Option', 'Control', 'Operations load', 'Strengths', 'Limits'],
    rows: [
      ['[[bedrock-agents|Bedrock Agents]]', 'Low: configure instructions, tools, knowledge bases', 'Lowest', 'Fast to a working agent; managed loop, tracing and versioning', 'Fixed orchestration; fewer places to customise'],
      ['[[agentcore|AgentCore Runtime]] + framework (Strands, LangGraph and others)', 'High: your code, your model, any framework', 'Low to medium', 'Session isolation, memory, tool gateway and identity as services', 'You own agent quality; newer service, so check availability'],
      ['[[stepfunctions|Step Functions]] with Bedrock steps', 'Fixed path with LLM steps', 'Low', 'Retries, state, human approval, audit trail', 'Not for open-ended tool choice'],
      ['Your own service on [[ecs|ECS]] or [[lambda|Lambda]]', 'Total', 'Highest', 'No platform constraints', 'You build isolation, memory, identity and tracing yourself']
    ],
    rules: [
      ['A standard tool-using assistant, and speed to first release matters', 'Bedrock Agents.'],
      ['Custom control flow, a non-Bedrock model, multi-agent designs, or an existing framework', 'AgentCore with your framework.'],
      ['The path is known in advance', 'A Step Functions workflow, not an agent.'],
      ['You need behaviour no managed option allows', 'Your own service, with eyes open about what you rebuild.']
    ],
    redflags: [
      'Tool permissions are inherited from a broad service role.',
      'No trace of the agent\'s reasoning and tool calls exists for debugging.',
      'State lives only in the process, so sessions cannot resume.',
      'The same agent holds credentials for many unrelated systems.'
    ],
    ask: [
      'How do we replay a bad conversation step by step?',
      'Whose identity does each tool call run as?',
      'Where does session state live, and how long?',
      'What caps tokens, steps and wall-clock time?'
    ],
    revisit: 'When the agent needs control flow the managed option cannot express, or when a second team wants to build agents.',
    related: ['bedrock-agents', 'agentcore', 'stepfunctions', 'lambda']
  },
  {
    id: 'vector-store', theme: 'architecture', title: 'Which vector store?',
    question: 'Where should embeddings live, and what else must that store do?',
    door: 'mixed', doorNote: 'Moving stores is easy. Changing the embedding model means re-embedding everything, which is the real one-way part.',
    why: 'The store sets your cost shape (memory-resident or cheap at rest), your latency, and how well you can filter by tenant, permission or date, which is where most RAG quality problems start.',
    cols: ['Store', 'Strength', 'Latency and scale', 'Choose when'],
    rows: [
      ['[[aurora|Aurora / RDS pgvector]]', 'Vectors beside relational data; SQL filters and joins', 'Good up to millions of vectors; bounded by instance memory', 'You already run Postgres and want one database'],
      ['[[opensearch|OpenSearch]]', 'Hybrid keyword plus vector search; high concurrency', 'Low latency; scales out; memory-heavy', 'Search-centric apps with heavy filtering'],
      ['[[s3-vectors|S3 Vectors]]', 'Very low storage cost at huge scale', 'Higher latency; lower query rate', 'Large, colder collections where cost dominates'],
      ['[[elasticache|ElastiCache / MemoryDB]]', 'In-memory speed; semantic caching', 'Sub-millisecond to low milliseconds; RAM-limited', 'Caches and ultra-low-latency lookups'],
      ['[[neptune|Neptune Analytics]]', 'Vectors plus graph traversal (GraphRAG)', 'In memory; sized by graph', 'Answers depend on relationships between entities'],
      ['[[kendra|Kendra GenAI Index]]', 'Managed retrieval with connectors and ACLs', 'Managed; hourly index fee', 'Enterprise sources and permission fidelity matter more than cost']
    ],
    rules: [
      ['You already run Postgres and have under a few million chunks', 'pgvector. One database to operate.'],
      ['You need keyword and vector together, with strict filtering and many concurrent users', 'OpenSearch.'],
      ['The corpus is huge and queries are occasional', 'S3 Vectors, possibly with a hot subset elsewhere.'],
      ['Questions follow relationships between things', 'Neptune Analytics for GraphRAG.'],
      ['Per-user document permissions must mirror source systems exactly', 'Evaluate Kendra, or filter on metadata you can prove is correct.']
    ],
    redflags: [
      'Retrieval has never been scored separately (recall at k) from the final answer.',
      'No metadata filter for tenant or permission, so every query searches everything.',
      'The embedding model was chosen without comparing options on your own data.',
      'Chunking was left at defaults and never tested.'
    ],
    ask: [
      'What is recall at k on real questions with the right documents marked?',
      'How do we enforce per-user access, and how do we test that it works?',
      'What does re-embedding the whole corpus cost and how long does it take?',
      'What is the baseline monthly cost when nobody is using it?'
    ],
    revisit: 'When corpus size grows tenfold, when filter patterns change, or when you consider a new embedding model.',
    related: ['aurora', 'opensearch', 's3-vectors', 'neptune', 'kendra']
  },
  {
    id: 'inference-pattern', theme: 'architecture', title: 'Synchronous, streaming, asynchronous or batch?',
    question: 'What interaction pattern does the product need, and what does it cost to promise it?',
    door: 'one-way', doorNote: 'It becomes part of your API contract and your users\' expectations. Changing it later means changing clients.',
    why: 'Latency promises drive almost everything else: timeouts, capacity, cost, and which AWS services can sit in the path. Many failures come from a long model call behind a front door with a short timeout.',
    cols: ['Pattern', 'Latency promise', 'How on AWS', 'Fits', 'Gotchas'],
    rows: [
      ['Synchronous', 'Under a couple of seconds', '[[apigw|API Gateway]] or [[alb|ALB]] to a model', 'Classification, short answers, tool calls', 'Short front-door timeouts; one slow call fails the request'],
      ['Streaming', 'First token in about a second; total in seconds', 'Streaming APIs, response streaming, WebSockets', 'Chat and long generations', 'Buffering proxies; idle timeouts; token expiry during a long stream'],
      ['Asynchronous', 'Minutes', '[[sqs|SQS]] and workers, [[sm-inference|async endpoints]], polling or push', 'Long documents, heavy agents, report generation', 'You need status, retries, idempotency and a result store'],
      ['Batch', 'Hours', '[[bedrock|Bedrock batch inference]], [[batch|AWS Batch]], batch transform', 'Backfills, labelling, bulk summarisation', 'Quality drift goes unseen; failures are found late'],
      ['Event-driven, continuous', 'Seconds, always on', '[[kinesis|Kinesis]], [[msk|MSK]], [[lambda|Lambda]]', 'Fraud scoring, alerting, live features', 'Ordering, duplicates and consumer lag']
    ],
    rules: [
      ['A person is waiting and the answer is long', 'Stream it.'],
      ['The task takes more than about half a minute, or varies widely', 'Make it asynchronous with job status. Do not hold a connection open.'],
      ['Nobody is waiting', 'Batch. It is usually the cheapest way to run models.'],
      ['Decisions follow a live stream of events', 'Event-driven, with idempotent consumers.']
    ],
    redflags: [
      'A long generation sits behind a gateway with a short integration timeout.',
      'Asynchronous jobs have no status endpoint, no retry policy and no dead-letter queue.',
      'Interactive and batch traffic share the same quota.',
      'Streaming is promised but a proxy buffers the whole response.'
    ],
    ask: [
      'What is the slowest legitimate request, and does every hop allow it?',
      'What does the user see while they wait?',
      'How does a failed job get retried without doing the work twice?',
      'Can batch work be kept off the interactive quota?'
    ],
    revisit: 'Before changing a public API. Later is expensive.',
    related: ['apigw', 'alb', 'sqs', 'kinesis', 'bedrock']
  },
  {
    id: 'capacity-strategy', theme: 'architecture', title: 'How do we secure capacity and throughput?',
    question: 'What do we do about quotas, throttling and scarce GPUs before launch?',
    door: 'two-way', doorNote: 'Cheap to adjust, but lead times are long. Start early.',
    why: 'Throughput and capacity are the most common launch-week surprises. A quota increase can take days, and holding quota does not guarantee a GPU is free.',
    cols: ['Lever', 'What it buys', 'Commitment', 'Use when', 'Watch out for'],
    rows: [
      ['Quota increases ([[servicequotas|Service Quotas]])', 'Higher requests and tokens per minute; more GPU vCPUs', 'None', 'Always, ahead of launch', 'Review time; per Region; not capacity'],
      ['Cross-Region inference profiles ([[bedrock]])', 'More throughput by spreading across Regions', 'None', 'Traffic exceeds a single Region\'s quota', 'Data residency; IAM must allow all target Regions'],
      ['Provisioned Throughput ([[bedrock]])', 'Reserved capacity and steady latency', 'Time commitment', 'Steady high volume; some custom models', 'Idle cost'],
      ['Fallback model chain', 'Survives throttling or an outage', 'Engineering', 'Availability matters more than identical answers', 'Behaviour differs between models; test each'],
      ['Queue and back-pressure ([[sqs|SQS]])', 'Smooths bursts', 'Engineering', 'Work does not need an instant answer', 'Queue age becomes the metric'],
      ['GPU reservations ([[ec2|Capacity Blocks]], reservations)', 'Guaranteed GPUs for a window', 'Pay for the window', 'Training runs; self-hosted serving baseline', 'Planning horizon'],
      ['Batch offload ([[bedrock|batch inference]])', 'Moves bulk work off the interactive quota', 'None', 'Anything that can wait', 'Delay']
    ],
    rules: [
      ['Launch is in under a month', 'File quota requests now for every model and Region on the critical path.'],
      ['One Region cannot carry the peak', 'Cross-Region profiles, after a data-residency check.'],
      ['The service must stay up through a model outage', 'Build a tested fallback chain and a graceful degraded mode.'],
      ['Training needs a fixed number of GPUs by a date', 'Reserve them. Do not rely on on-demand.']
    ],
    redflags: [
      'The launch plan has no quota numbers in it.',
      'Retries have no backoff or jitter, so throttling turns into a retry storm.',
      'Batch and interactive workloads use the same quota.',
      'The fallback model has never been run against the eval set.'
    ],
    ask: [
      'What is peak requests and tokens per minute, per model, and what are our current limits?',
      'What happens to a user when we are throttled?',
      'When did we last test the fallback path?',
      'Who gets paged when quota usage passes 80 percent?'
    ],
    revisit: 'Before each launch or marketing event, and whenever model mix changes.',
    related: ['servicequotas', 'bedrock', 'sqs', 'ec2']
  },
  {
    id: 'orchestration', theme: 'architecture', title: 'How do we orchestrate the work?',
    question: 'Which tool coordinates multi-step jobs, retries and approvals?',
    door: 'mixed', doorNote: 'Moderate to change, because workflow definitions embed assumptions about retries and state.',
    why: 'Orchestration choices determine who owns state, how retries behave, and how well ML steps fit.',
    cols: ['Tool', 'Model', 'Best for', 'Limits to remember'],
    rows: [
      ['[[stepfunctions|Step Functions]]', 'State machine with managed state', 'Multi-service workflows, approvals, fan-out over S3', 'Per-state payload cap; history size on Standard'],
      ['[[sm-pipelines|SageMaker Pipelines]]', 'ML-specific DAG', 'Train, evaluate, register, deploy', 'Limited non-ML branching'],
      ['[[sqs|SQS]] and workers', 'Queue and pull', 'Smoothing load to slow consumers', 'You build the workflow logic'],
      ['[[eventbridge|EventBridge]]', 'Event routing', 'Reacting to events, scheduling, decoupling', 'No state or ordering of its own'],
      ['[[batch|AWS Batch]]', 'Job queue on managed compute', 'Large offline compute (embedding, preprocessing)', 'Not a workflow engine on its own']
    ],
    rules: [
      ['An ML lifecycle: data, train, evaluate, register, deploy', 'SageMaker Pipelines.'],
      ['Anything crossing services with retries, approvals or fan-out', 'Step Functions.'],
      ['One producer, slow workers', 'SQS with a dead-letter queue.'],
      ['Reacting to something that happened', 'EventBridge to start the above.']
    ],
    redflags: [
      'A long chain of Lambdas calling each other with no state record.',
      'Workflow payloads carry documents instead of S3 references.',
      'No dead-letter path, so failures vanish.',
      'Two orchestrators each own part of one process.'
    ],
    ask: [
      'Where is the single source of truth for "where is this job up to"?',
      'What happens when a step fails halfway, and is it safe to retry?',
      'Who can see and approve paused steps?'
    ],
    revisit: 'When the number of steps or teams involved doubles.',
    related: ['stepfunctions', 'sm-pipelines', 'sqs', 'eventbridge', 'batch']
  },
  {
    id: 'training-compute', theme: 'architecture', title: 'Where do we train?',
    question: 'Managed jobs, a resilient cluster, raw instances, or Kubernetes? GPUs or Trainium?',
    door: 'two-way', doorNote: 'Training code is portable between these if it is written against standard frameworks. Compiled Neuron artifacts are not.',
    why: 'Training spend is lumpy and failures are costly: one bad node can waste days of GPU time on a large run. The right choice depends on run length, scale and your team\'s operations skill.',
    cols: ['Option', 'Best for', 'Resilience', 'Operations load', 'Watch out for'],
    rows: [
      ['[[sm-training|SageMaker training jobs]]', 'Most training and fine-tuning, from one GPU to dozens of nodes', 'Spot with checkpoints; job-level retries', 'Low', 'Per-usage-type quotas; start-up time'],
      ['[[hyperpod|SageMaker HyperPod]]', 'Weeks-long, many-node foundation-model training', 'Automatic node replacement and resume', 'Medium', 'Paying while idle'],
      ['[[ec2|EC2]] directly', 'Full control; unusual setups', 'You build it', 'High', 'Health checks and recovery are yours'],
      ['[[eks|EKS]] with a training operator', 'Platform teams sharing a GPU pool', 'Kubernetes-level restarts', 'High', 'Gang scheduling; plugins'],
      ['[[batch|AWS Batch]]', 'Many independent jobs, sweeps', 'Retries per job', 'Low', 'Not built for tightly coupled multi-node runs'],
      ['[[neuron|Trainium]] as the accelerator', 'Cost-sensitive large runs on supported models', 'Same as the platform chosen', 'Medium', 'Compile step, operator coverage, porting effort']
    ],
    rules: [
      ['Runs are hours long on up to a few nodes', 'SageMaker training jobs, with Spot and checkpoints.'],
      ['Runs last weeks on many nodes', 'HyperPod, with reserved capacity.'],
      ['Many teams share one GPU pool', 'EKS with a queueing layer, if you have the platform team for it.'],
      ['GPU supply or price is the constraint and your model is supported', 'Pilot Trainium on one model before committing.']
    ],
    redflags: [
      'No checkpointing plan for runs longer than a few hours.',
      'Training quotas requested the week of the run.',
      'GPU nodes sit idle between experiments.',
      'Training data and code are not versioned together.'
    ],
    ask: [
      'What does a failure at hour 40 cost us, and how do we resume?',
      'What is the GPU idle time across the last month?',
      'How is capacity reserved for the next run?',
      'Can we reproduce this model from versioned data and code?'
    ],
    revisit: 'Before each large run, and when sustained utilisation justifies reservations.',
    related: ['sm-training', 'hyperpod', 'ec2', 'eks', 'neuron']
  },

  /* ---------------- RISK, QUALITY & COST ---------------- */
  {
    id: 'evaluation', theme: 'risk', title: 'How will we know it works?',
    question: 'What do we measure, with which method, before launch and after?',
    door: 'two-way', doorNote: 'Cheap to change, but expensive to start late. Without evals every other decision is a guess.',
    why: 'Non-deterministic systems cannot be tested by spot-checking. Teams that launch on demos spend their time arguing about whether a change made things better. An eval set ends that argument.',
    cols: ['Method', 'Measures', 'Speed and cost', 'Blind spots', 'AWS'],
    rows: [
      ['Golden-set checks (exact or rule-based)', 'Correct extraction, format, tool choice', 'Fast and cheap', 'Misses open-ended quality', 'Plain tests in CI'],
      ['Model-as-judge', 'Relevance, faithfulness, tone at scale', 'Fast; costs tokens', 'Judge bias; needs calibration against humans', '[[bedrock|Bedrock evaluations]]'],
      ['Human review of samples', 'What really matters to users', 'Slow and costly', 'Small samples; reviewer disagreement', '[[sm-groundtruth|Ground Truth]]'],
      ['Retrieval metrics (recall at k)', 'Whether the right passages are found', 'Fast, once labelled', 'Says nothing about the answer', 'Your own harness'],
      ['Shadow and A/B in production', 'Real impact on real traffic', 'Slow; needs traffic', 'Risk to users if not isolated', '[[sm-inference|Shadow variants]], traffic splitting'],
      ['Production monitoring', 'Drift, refusals, guardrail hits, feedback', 'Continuous', 'Lagging indicator', '[[cloudwatch]], [[sm-monitor|Model Monitor]], [[bedrock-guardrails|Guardrails]]'],
      ['Adversarial and red-team tests', 'Prompt injection, data leakage, abuse', 'Manual and periodic', 'Only finds what testers think of', 'Your own tests plus Guardrails']
    ],
    rules: [
      ['Before any serious build', 'Collect 50 to a few hundred real, representative cases with expected outcomes, and agree what "good" means.'],
      ['Every change to prompt, model or retrieval', 'Run the eval set automatically in the pipeline.'],
      ['Judge models are used', 'Calibrate them on a human-labelled sample first.'],
      ['An incident happens', 'Add the case to the eval set so it cannot recur.']
    ],
    redflags: [
      'Quality is described in adjectives ("feels better") and not in numbers.',
      'The eval set was written by the team that built the system, from memory.',
      'Retrieval and generation are scored together, so nobody knows which is failing.',
      'There is no production sampling, so drift is invisible.'
    ],
    ask: [
      'Show me the eval set, its size, and who labelled it.',
      'What is the score today, and what is the launch threshold?',
      'What did the last prompt change do to the score?',
      'How do real failures get back into the eval set?'
    ],
    revisit: 'Continuously. Re-examine the eval set itself every quarter.',
    related: ['bedrock', 'sm-groundtruth', 'sm-monitor', 'cloudwatch']
  },
  {
    id: 'human-in-loop', theme: 'risk', title: 'How much do we trust it to act?',
    question: 'What can the system do on its own, and where does a person decide?',
    door: 'two-way', doorNote: 'Easy to relax approvals as evidence builds. Expensive to tighten after an incident.',
    why: 'The cost of an AI error depends on what it is allowed to touch. Permissions and approvals, not prompts, are what bound the damage.',
    cols: ['Pattern', 'Mechanism', 'Latency impact', 'Use when'],
    rows: [
      ['Read-only tools', 'Tools can query but never change state', 'None', 'Every first release'],
      ['Propose, then approve', 'Agent drafts the action; a person approves ([[bedrock-agents|return of control]], [[stepfunctions|task token]])', 'Waiting for a person', 'Writes with real consequences'],
      ['Approve by exception', 'Auto-act above a confidence or below a value threshold; escalate the rest', 'Small', 'Measured accuracy, routine actions'],
      ['Autonomous within limits', 'Scoped [[iam|roles]], spend caps ([[budgets]]), reversible actions only', 'None', 'Low-risk, reversible, well-measured tasks'],
      ['Post-hoc audit sampling', 'People review a sample of what already happened ([[cloudtrail]], logs)', 'None', 'A complement to the above, never a substitute for approval on high-risk actions']
    ],
    rules: [
      ['The first release of any agent', 'Read-only, or propose-then-approve.'],
      ['An action cannot be undone', 'Always require approval.'],
      ['The action is reversible and measured accurate', 'Consider approval by exception.'],
      ['The agent acts for a user', 'Run tools with that user\'s delegated, scoped identity, not a shared admin role.']
    ],
    redflags: [
      'The agent\'s tools run under one broad role.',
      'No spend or action-count cap per session or per day.',
      'Approval screens do not show the exact change that will happen.',
      'Tool output is trusted as instructions, which leaves prompt injection open.'
    ],
    ask: [
      'List every action the agent can take. Which are reversible?',
      'Whose identity does each action run as?',
      'What is the maximum damage in one session?',
      'How would we know if the agent were manipulated?'
    ],
    revisit: 'After each incident and each quarter of measured accuracy data.',
    related: ['bedrock-agents', 'stepfunctions', 'iam', 'cloudtrail', 'bedrock-guardrails']
  },
  {
    id: 'cost-levers', theme: 'risk', title: 'How do we keep it affordable?',
    question: 'Which levers reduce cost per task, and what quality risk does each add?',
    door: 'two-way', doorNote: 'Mostly reversible. Measure cost per successful task before and after each change.',
    why: 'LLM cost scales with tokens and with the number of model calls per task. Agents multiply both. Teams that track cost per call miss that retries, long contexts and loops are where the money goes.',
    cols: ['Lever', 'How it saves', 'Quality risk', 'Effort'],
    rows: [
      ['Right-size the model ([[nova|smaller tiers]], cheaper models)', 'Cheaper per token', 'Lower accuracy on hard cases', 'Low: change config, re-run evals'],
      ['Trim prompts and cache prefixes ([[bedrock|prompt caching]])', 'Fewer billed input tokens', 'Low', 'Low'],
      ['Semantic cache ([[elasticache]])', 'Skips the model for repeat questions', 'Wrong answer if the similarity threshold is loose', 'Medium'],
      ['Batch the non-urgent work ([[bedrock|batch inference]])', 'Lower price per token', 'None; adds delay', 'Low'],
      ['Retrieve less, better ([[bedrock-kb|reranking]], smaller chunks)', 'Smaller context per call', 'May drop needed context', 'Medium'],
      ['Route or cascade (cheap model first, escalate if unsure)', 'Most traffic uses the cheap path', 'Routing errors', 'Medium to high'],
      ['Fine-tune or distil a small model', 'Cheaper at high volume', 'Maintenance burden', 'High'],
      ['Self-host at steady high volume', 'Lower unit cost if GPUs stay busy', 'Operations burden', 'High'],
      ['Per-tenant and per-user limits ([[apigw]], [[waf]])', 'Caps abuse and denial of wallet', 'Rejected legitimate heavy users', 'Low']
    ],
    rules: [
      ['Costs have not been measured by feature and by tenant', 'Do that first. Tag, and use application inference profiles.'],
      ['Spend is dominated by input tokens', 'Trim context and use prompt caching before anything else.'],
      ['Work can wait', 'Batch it.'],
      ['One model handles easy and hard cases', 'Try a cascade, and measure it against the eval set.'],
      ['Volume is high and steady', 'Only then compare self-hosting, including people costs.']
    ],
    redflags: [
      'Cost is tracked per call, not per successful task.',
      'No cap on loops or tokens per session.',
      'Every request uses the largest model.',
      'Savings were claimed without re-running the evals.'
    ],
    ask: [
      'What is the cost per successful task, and how has it moved over time?',
      'What is the biggest single input to that cost?',
      'What is the worst-case spend if one client misbehaves?',
      'Which levers have we tried, with measured effect?'
    ],
    revisit: 'Monthly. Re-run after every model change, since prices and capabilities shift.',
    related: ['budgets', 'bedrock', 'elasticache', 'apigw']
  },
  {
    id: 'tenancy', theme: 'risk', title: 'How do we isolate tenants and data?',
    question: 'Shared everything, separate data stores, or a separate account per tenant?',
    door: 'one-way', doorNote: 'The hardest to change. Moving tenants between isolation models after launch is a migration project.',
    why: 'In multi-tenant AI systems, a missing filter can leak one customer\'s documents into another\'s answer. The isolation model sets your blast radius, your compliance story and your unit cost.',
    cols: ['Model', 'Isolation', 'Cost per tenant', 'Operations', 'Use when'],
    rows: [
      ['Silo: an account or stack per tenant', 'Strongest', 'Highest', 'Many environments to run', 'Regulated or very large tenants; contractual isolation'],
      ['Bridge: shared compute, separate data stores or knowledge bases per tenant', 'Strong for data', 'Medium', 'Moderate', 'Most B2B products with sensitive data'],
      ['Pool: shared everything with metadata filters and row-level security', 'Logical only', 'Lowest', 'Simplest to run', 'Low-sensitivity data; many small tenants'],
      ['Per-tenant encryption keys ([[kms]])', 'Cryptographic; adds to any model above', 'Low to medium', 'Key lifecycle', 'Customers need to control or revoke access'],
      ['Per-tenant model customisation', 'Model-level isolation', 'High', 'Heavy', 'Tenant-specific fine-tunes with contractual separation']
    ],
    rules: [
      ['Data is regulated, or contracts demand isolation', 'Silo or bridge, with per-tenant keys.'],
      ['Tenants are many and small, and data is low sensitivity', 'Pool, with tested filters.'],
      ['Tenants differ widely in size and sensitivity', 'Tier them: pool for most, bridge or silo for the largest.'],
      ['Tenant identity must reach the retrieval layer', 'Carry it in token claims ([[cognito]]) and enforce it in the data layer, not in the prompt.']
    ],
    redflags: [
      'Tenant filtering is described as an instruction in the prompt.',
      'Nobody has tested whether tenant A can retrieve tenant B\'s documents.',
      'Logs and caches are shared across tenants without tenant keys.',
      'No per-tenant cost attribution.'
    ],
    ask: [
      'Show the test that proves tenant A cannot see tenant B\'s data in retrieval, caches and logs.',
      'What is our isolation model for each tier of customer?',
      'How do we delete a tenant\'s data completely, including embeddings?',
      'How do we attribute spend to each tenant?'
    ],
    revisit: 'Before onboarding the first regulated or very large customer, and at every major architecture change.',
    related: ['kms', 'cognito', 'iam', 'lakeformation', 'macie']
  }
];
