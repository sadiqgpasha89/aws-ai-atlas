/* Playbooks for engineering leaders: maturity ladder, readiness checklist, ADR template, solution shaper.
   Checklist `see` entries are 'svc:<service-id>' or 'dec:<decision-id>'. */

window.ATLAS.ladder = [
  {
    stage: 'Prototype', time: 'Days to weeks',
    goal: 'Prove there is real value and that it is feasible on real data.',
    exit: [
      'An eval set exists (real, representative cases) and the baseline has a score.',
      'Two or three real users or stakeholders confirm the output is useful.',
      'A first estimate of cost per task, and the top three risks, are written down.'
    ],
    skip: ['Building a platform', 'Fine-tuning', 'Optimising cost', 'Multi-Region']
  },
  {
    stage: 'Pilot', time: 'Weeks',
    goal: 'Prove reliability and safety with real users in a limited scope.',
    exit: [
      'The eval score meets the agreed threshold on a larger set.',
      'Actions are read-only or approval-gated; guardrails and tenant isolation are tested.',
      'Monitoring exists, someone is on call, and cost per task is measured.'
    ],
    skip: ['Removing approvals', 'Widening tool access', 'Chasing scale']
  },
  {
    stage: 'Production', time: 'Weeks to a quarter',
    goal: 'Prove it can be operated, not just built.',
    exit: [
      'Service levels are defined and have been met for several weeks.',
      'Quotas and capacity cover peak; the fallback path has been tested.',
      'Runbooks have been used in an exercise, and cost is attributed per tenant or feature.'
    ],
    skip: ['New autonomous capabilities without new evals']
  },
  {
    stage: 'Scale', time: 'Ongoing',
    goal: 'Prove the economics and the resilience.',
    exit: [
      'Cost per successful task is at target, using caching, batching, routing or smaller models.',
      'A capacity plan covers growth, including a Region or model outage.',
      'Autonomy has been raised only where measured accuracy justifies it, and decision records are reviewed quarterly.'
    ],
    skip: ['Rewriting for its own sake']
  }
];

window.ATLAS.readiness = [
  {
    id: 'quality', name: 'Quality and evaluation', items: [
      { id: 'q1', kind: 'both', t: 'A versioned eval set of real, representative cases exists, with agreed pass thresholds.', why: 'Without it every change is an argument, not a measurement.', see: ['dec:evaluation'] },
      { id: 'q2', kind: 'both', t: 'Evals run automatically on every change to prompt, model, retrieval or code.', why: 'Regressions from small edits are the most common quality loss.', see: ['dec:evaluation'] },
      { id: 'q3', kind: 'agent', t: 'Tool choice and parameter accuracy are measured separately from final answer quality.', why: 'A right answer from a wrong tool call is luck, and it will not repeat.', see: ['dec:agent-runtime'] },
      { id: 'q4', kind: 'both', t: 'For RAG, retrieval quality (recall at k) is measured separately from generation.', why: 'It tells you which half to fix.', see: ['dec:vector-store', 'svc:bedrock-kb'] },
      { id: 'q5', kind: 'ml', t: 'Offline metrics map to a business metric, and the holdout reflects production data.', why: 'A model can win offline and lose in production.', see: ['svc:sm-pipelines'] },
      { id: 'q6', kind: 'both', t: 'Known failure modes are documented, with what the user sees when each happens.', why: 'Graceful failure is designed, not discovered.', see: [] }
    ]
  },
  {
    id: 'safety', name: 'Safety and security', items: [
      { id: 's1', kind: 'agent', t: 'Every tool is narrow, validates its parameters server-side, and runs with least privilege.', why: 'Permissions bound the damage when the model is wrong or manipulated.', see: ['dec:human-in-loop', 'svc:iam'] },
      { id: 's2', kind: 'agent', t: 'Writes and irreversible actions need approval, or have a written justification from measured accuracy.', why: 'Approval is the cheapest control you have.', see: ['dec:human-in-loop', 'svc:stepfunctions'] },
      { id: 's3', kind: 'agent', t: 'Prompt injection through retrieved text and tool output has been tested; tool output is treated as data.', why: 'Any text the agent reads can contain instructions.', see: ['svc:bedrock-guardrails'] },
      { id: 's4', kind: 'both', t: 'Guardrails and PII handling are configured and tested on inputs and outputs; logging of sensitive text is a deliberate choice.', why: 'Logs and caches are where sensitive data quietly accumulates.', see: ['svc:bedrock-guardrails', 'svc:comprehend'] },
      { id: 's5', kind: 'both', t: 'Per-user and per-tenant isolation is tested across retrieval, caches and logs.', why: 'A missing filter leaks one customer\'s data to another.', see: ['dec:tenancy'] },
      { id: 's6', kind: 'both', t: 'Encryption keys, private network paths and no public model or data endpoints, where required.', why: 'Prompts and datasets should not cross the public internet.', see: ['svc:kms', 'svc:vpc'] },
      { id: 's7', kind: 'both', t: 'Model and vendor terms on data use, retention and residency are reviewed, including cross-Region inference.', why: 'Compliance owners need to approve this before launch, not after.', see: ['svc:bedrock'] }
    ]
  },
  {
    id: 'reliability', name: 'Reliability and capacity', items: [
      { id: 'r1', kind: 'both', t: 'Quotas (requests and tokens per minute, GPU vCPUs) are requested for peak, in every Region used.', why: 'Increases take days, and capacity is a separate matter.', see: ['dec:capacity-strategy', 'svc:servicequotas'] },
      { id: 'r2', kind: 'both', t: 'Retries use backoff and jitter; timeouts line up across every hop; retried actions are idempotent.', why: 'Throttling plus naive retries becomes an outage.', see: ['dec:inference-pattern'] },
      { id: 'r3', kind: 'both', t: 'A fallback model or degraded mode exists, and has been tested against the evals.', why: 'Models and Regions have bad days.', see: ['dec:capacity-strategy'] },
      { id: 'r4', kind: 'agent', t: 'Hard caps exist on steps, tokens and wall-clock time per session.', why: 'Loops are how a small bug becomes a large bill.', see: ['dec:autonomy-level'] },
      { id: 'r5', kind: 'ml', t: 'Model rollout uses canary or shadow traffic with a tested rollback; the previous version is kept.', why: 'A bad model needs a one-step undo.', see: ['svc:sm-inference'] },
      { id: 'r6', kind: 'both', t: 'Load tests cover peak traffic, slow requests and cold scale-out.', why: 'GPU and model start-up time makes scaling slower than it looks.', see: ['svc:sm-inference'] }
    ]
  },
  {
    id: 'cost', name: 'Cost', items: [
      { id: 'c1', kind: 'both', t: 'Cost per successful task is measured and attributed by feature and tenant.', why: 'Cost per call hides retries, loops and long contexts.', see: ['dec:cost-levers', 'svc:budgets'] },
      { id: 'c2', kind: 'both', t: 'Budget alarms and per-client rate limits guard against runaway spend.', why: 'Billing data lags, so you need faster signals too.', see: ['svc:budgets', 'svc:waf'] },
      { id: 'c3', kind: 'both', t: 'Idle resources (endpoints, clusters, notebooks) have owners and automatic shutdown.', why: 'Forgotten GPUs are a leading source of waste.', see: ['svc:sm-inference', 'svc:sm-studio'] },
      { id: 'c4', kind: 'both', t: 'The forecast at current and ten times current volume is written down with its assumptions.', why: 'Unit economics that break at scale are better found now.', see: [] }
    ]
  },
  {
    id: 'ops', name: 'Operations and observability', items: [
      { id: 'o1', kind: 'both', t: 'Dashboards show latency (including time to first token), errors, throttles, tokens, queue age and accelerator utilisation.', why: 'You cannot run what you cannot see.', see: ['svc:cloudwatch'] },
      { id: 'o2', kind: 'agent', t: 'Every agent run is traceable step by step (reasoning, tool calls, results) and can be replayed.', why: 'Non-deterministic failures need a record to debug.', see: ['svc:agentcore'] },
      { id: 'o3', kind: 'both', t: 'Alarms page a named on-call rota, with runbooks for throttling, model outage, bad output and runaway cost.', why: 'Alerts without owners are noise.', see: ['svc:cloudwatch'] },
      { id: 'o4', kind: 'ml', t: 'Drift and data-quality monitoring has a defined retraining trigger and an owner.', why: 'Models decay quietly.', see: ['svc:sm-monitor'] },
      { id: 'o5', kind: 'both', t: 'Infrastructure is defined as code; environments are reproducible; changes are reviewed.', why: 'Manual setups cannot be audited or rebuilt.', see: ['svc:cdk'] },
      { id: 'o6', kind: 'both', t: 'Model versions are pinned, and a process exists for retirements and upgrades.', why: 'Providers retire models on their schedule, not yours.', see: ['svc:bedrock'] }
    ]
  },
  {
    id: 'data', name: 'Data and privacy', items: [
      { id: 'd1', kind: 'both', t: 'Data sources are catalogued with owners, and permission to use them for this purpose is confirmed.', why: 'Legal and trust problems start with unexamined data.', see: ['svc:lakeformation'] },
      { id: 'd2', kind: 'both', t: 'Sensitive data is scanned for before it enters a training set or an index.', why: 'It is far cheaper to keep it out than to remove it.', see: ['svc:macie', 'svc:comprehend'] },
      { id: 'd3', kind: 'both', t: 'Retention and deletion are defined for prompts, outputs, embeddings and logs, including full tenant deletion.', why: 'Embeddings and logs are easy to forget when deleting.', see: ['dec:tenancy'] },
      { id: 'd4', kind: 'ml', t: 'Training data, code and model versions are linked so any production model can be reproduced.', why: 'Audits and incidents both ask for this.', see: ['svc:sm-pipelines'] }
    ]
  },
  {
    id: 'team', name: 'Team and process', items: [
      { id: 't1', kind: 'both', t: 'There are named owners for quality, for cost, and for on-call.', why: 'Shared ownership means nobody owns it.', see: [] },
      { id: 't2', kind: 'both', t: 'Users have a feedback channel, and complaints become eval cases.', why: 'Real failures are your best test data.', see: ['dec:evaluation'] },
      { id: 't3', kind: 'both', t: 'The rollout plan has success criteria and a stop rule that says what makes us pause.', why: 'It is easier to agree a stop rule before launch.', see: [] },
      { id: 't4', kind: 'both', t: 'Key decisions are recorded as short decision records with reversibility and a revisit date.', why: 'The next engineer needs to know why, not only what.', see: [] },
      { id: 't5', kind: 'both', t: 'Users are told what the system is, what it cannot do, and how to reach a person.', why: 'Calibrated trust prevents most harm.', see: [] }
    ]
  }
];

window.ATLAS.adrTemplate = [
  '# ADR-NNN: <short decision title>',
  '',
  'Status: Proposed | Accepted | Superseded by ADR-xxx',
  'Date: YYYY-MM-DD',
  'Owner: <name>',
  'Reviewers: <names>',
  '',
  '## Context',
  'What problem are we solving? Constraints, volumes, deadlines, compliance needs.',
  'Eval results so far and the current baseline score.',
  '',
  '## Options considered',
  '| Option | Strengths | Weaknesses | Build cost | Run cost |',
  '|---|---|---|---|---|',
  '| A |  |  |  |  |',
  '| B |  |  |  |  |',
  '',
  '## Decision',
  'We will ...',
  '',
  '## Evidence',
  'Eval scores, cost per successful task, latency, load-test results, security review.',
  '',
  '## Reversibility',
  'Two-way door | One-way door | Mixed. What would it cost, in people and time, to reverse this?',
  '',
  '## Risks and mitigations',
  '- Risk: ...  Mitigation: ...',
  '',
  '## Consequences',
  'What becomes easier, what becomes harder, who is affected.',
  '',
  '## Revisit when',
  'A date, or a trigger (volume 10x, model retired, cost above X, incident).'
].join('\n');

/* ---------- Solution shaper ---------- */
window.ATLAS.shaper = {
  questions: [
    { id: 'goal', label: 'What are you building?', options: [
      ['qa', 'Answers from our own documents'],
      ['agent', 'An assistant that takes actions in our systems'],
      ['docs', 'Extraction of data from documents, forms or scans'],
      ['generate', 'Generating or transforming content (drafts, summaries, classification)'],
      ['predict', 'Predictions from structured data (risk, demand, churn)'],
      ['recs', 'Recommendations or ranking for users']
    ] },
    { id: 'action', label: 'If it takes actions, how much freedom does it get?', only: 'agent', options: [
      ['read', 'Read-only: it looks things up'],
      ['approve', 'It proposes changes and a person approves'],
      ['auto', 'It acts on its own within limits']
    ] },
    { id: 'latency', label: 'How fast must it respond?', options: [
      ['interactive', 'Under a second or two'],
      ['chat', 'Streaming chat: first words quickly, a few seconds in total'],
      ['async', 'Minutes are fine'],
      ['batch', 'Offline, hours are fine']
    ] },
    { id: 'data', label: 'How sensitive is the data?', options: [
      ['public', 'Public or low sensitivity'],
      ['internal', 'Internal business data'],
      ['regulated', 'Regulated or personal data (PII, health, financial)']
    ] },
    { id: 'scale', label: 'What scale do you expect in the first year?', options: [
      ['pilot', 'A pilot or one team'],
      ['mid', 'A product with steady use'],
      ['high', 'High and sustained volume']
    ] },
    { id: 'team', label: 'What does your team look like?', options: [
      ['small', 'Small team, no ML specialists'],
      ['mixed', 'Some ML experience'],
      ['platform', 'A platform or ML engineering team']
    ] },
    { id: 'model', label: 'What do you need from the model?', options: [
      ['managed', 'A managed or off-the-shelf model is fine'],
      ['custom', 'A customised (fine-tuned) model'],
      ['hosted', 'We must host the model ourselves (open weights, locality, cost)']
    ] }
  ],
  defaults: { goal: 'qa', action: 'read', latency: 'chat', data: 'internal', scale: 'pilot', team: 'small', model: 'managed' },

  recommend: function (a) {
    var stack = [], seen = {}, risks = [], next = [], nseen = {}, arch = null, headline = '';
    function add(id, role, why) { if (seen[id]) return; seen[id] = 1; stack.push({ id: id, role: role, why: why }); }
    function nx(id, why) { if (nseen[id]) return; nseen[id] = 1; next.push({ id: id, why: why }); }
    function risk(t) { if (risks.indexOf(t) < 0) risks.push(t); }

    nx('build-buy-customize', 'Confirm how much to build before committing people.');

    if (a.goal === 'qa') {
      headline = 'Grounded question answering (RAG)'; arch = 'rag-assistant';
      add('s3', 'Source of truth for the documents', 'Every ingestion path starts here.');
      add('bedrock-kb', 'Managed ingestion, chunking, retrieval and citations', 'The quickest route to a working, cited assistant.');
      if (a.scale === 'high') add('opensearch', 'Vector index with hybrid search and filters', 'High concurrency and strict filtering favour a search engine.');
      else if (a.team === 'small' || a.scale === 'pilot') add('s3-vectors', 'Low-cost vector storage', 'No large idle cost at pilot scale, and you can move later.');
      else add('aurora', 'Vectors in Postgres (pgvector)', 'One database to operate if you already run Postgres.');
      add('bedrock', 'Models for embeddings and answers', 'One API to many models, with no GPUs to run.');
      add('bedrock-guardrails', 'Screens inputs and outputs, checks grounding', 'Cuts unsafe and unsupported answers.');
      add('cognito', 'User identity for per-user retrieval filters', 'Access control must be enforced in retrieval, not in the prompt.');
      nx('vector-store', 'Choose the index and test filtering and recall.');
      nx('improve-model', 'Prompt and retrieval first; fine-tune last.');
      risk('Retrieval quality, not the model, is usually the problem. Measure recall at k separately.');
      risk('Per-user document access must be enforced with metadata filters, and tested.');
      risk('New documents are searchable only after the next sync.');
    } else if (a.goal === 'agent') {
      headline = a.action === 'read' ? 'Read-only tool-using agent' : (a.action === 'approve' ? 'Agent with human approval' : 'Autonomous agent within limits');
      arch = 'agent-platform';
      if (a.team === 'small' && a.model === 'managed') add('bedrock-agents', 'Managed agent loop, tools and knowledge bases', 'The fastest route for a small team; less to operate.');
      else add('agentcore', 'Runtime, memory, identity and tool gateway for code-first agents', 'Control over logic and framework with managed isolation.');
      add('bedrock', 'Reasoning model', 'Use the smallest model that passes your evals.');
      add('lambda', 'Tool implementations', 'Narrow, testable functions with explicit schemas.');
      add('bedrock-kb', 'Knowledge lookup as one of the agent\'s tools', 'Gives the agent grounded facts.');
      add('dynamodb', 'Session state and memory', 'Sessions need to survive restarts.');
      add('cognito', 'User identity passed to every tool call', 'Tools must act as the user, not as an admin.');
      add('apigw', 'Entry point with auth and throttling', 'Per-user limits protect your spend.');
      add('bedrock-guardrails', 'Screens inputs and outputs', 'A second layer beside permissions.');
      if (a.action === 'approve') add('stepfunctions', 'Approval gate with a task token', 'Pauses for a person and keeps an audit trail.');
      if (a.action === 'auto') {
        add('iam', 'Scoped, short-lived identities per tool', 'Permissions bound the damage.');
        add('budgets', 'Spend alarms and caps', 'Autonomy plus loops can spend quickly.');
        add('cloudtrail', 'Audit trail of every action', 'You will need to answer "what did it do?".');
        risk('The agent acts before anyone looks. Keep actions reversible and capped in count and value.');
      }
      nx('autonomy-level', 'Check a workflow would not do the job.');
      nx('agent-runtime', 'Confirm the hosting choice.');
      nx('human-in-loop', 'Set what needs approval and whose identity tools use.');
      risk('Prompt injection through retrieved text and tool output. Treat both as untrusted data.');
      risk('Loops burn tokens. Cap steps, tokens and wall-clock time per session.');
      risk('Vague tool descriptions cause wrong tool choices. Test tool selection on its own.');
    } else if (a.goal === 'docs') {
      headline = 'Document intelligence pipeline'; arch = 'document-intelligence';
      add('s3', 'Document landing zone', 'Events start the workflow.');
      add('stepfunctions', 'Orchestration with retries and human review', 'Handles failure and low-confidence cases.');
      add('textract', 'OCR, tables and key-value extraction', 'Cheaper and more predictable than asking an LLM to read pixels.');
      add('comprehend', 'PII detection and redaction', 'Redact before any generative step.');
      add('bedrock', 'Maps messy fields to your schema and checks rules', 'Use the LLM for judgement only.');
      add('dynamodb', 'Validated results and status', 'Fast lookup for downstream systems.');
      nx('orchestration', 'Pick the orchestration pattern and its limits.');
      risk('An LLM may invent a value. Require each extracted value to appear in the source text.');
      risk('Workflow payloads are limited. Pass S3 references, not document text.');
      risk('Backfills hit service throttles. Use queues and concurrency limits.');
      if (a.latency === 'interactive') risk('Multi-page extraction is asynchronous. Design the waiting experience.');
    } else if (a.goal === 'generate') {
      headline = 'LLM content and transformation service';
      add('bedrock', 'Foundation models through one API', 'Start here and compare models on your own evals.');
      add('nova', 'Smaller, cheaper model tiers for volume work', 'Match model tier to task difficulty.');
      add('bedrock-guardrails', 'Content and PII controls', 'Required for anything user-facing.');
      if (a.latency === 'interactive' || a.latency === 'chat') { add('apigw', 'Front door with auth and throttling', 'Use streaming for long outputs.'); add('lambda', 'Thin application layer', 'Prompt assembly and response streaming.'); }
      nx('inference-pattern', 'Decide between synchronous, streaming and batch.');
      nx('cost-levers', 'Tokens are the bill; plan the levers early.');
      risk('Quality is subjective. Write a scoring rubric and calibrate any model-as-judge against people.');
      risk('Behaviour shifts when model versions change. Pin versions and re-run evals.');
    } else if (a.goal === 'predict') {
      headline = 'Predictive ML platform';
      arch = a.latency === 'interactive' ? 'realtime-features' : 'training-mlops';
      add('s3', 'Data lake and artifact store', 'Everything reads from and writes to it.');
      add('glue', 'Prepares training datasets', 'Repeatable, with data-quality rules.');
      add('sm-studio', 'Workspace for data scientists', 'Notebooks and experiment tracking.');
      add('sm-training', 'Managed training jobs', 'Pay for GPUs only while they run.');
      add('sm-pipelines', 'Train, evaluate, register, deploy', 'Makes retraining routine and auditable.');
      add('sm-inference', 'Hosts the model', 'Real-time, async or batch, to match latency.');
      add('sm-monitor', 'Drift and bias monitoring', 'Models decay quietly.');
      if (a.latency === 'interactive') add('sm-feature-store', 'Same features online and offline', 'Avoids training-serving skew for low-latency scoring.');
      if (a.team === 'small') add('sm-jumpstart', 'Start from a pretrained model', 'Less to build and tune.');
      nx('training-compute', 'Pick where training runs.');
      nx('orchestration', 'Choose how the pipeline is run.');
      risk('Training-serving skew: define each feature once and use it in both places.');
      risk('Labels often arrive late. Plan proxy metrics meanwhile.');
      risk('Drift needs an owner and a defined retraining trigger.');
      if (a.data === 'regulated') risk('Bias and explainability evidence may be required. Plan for Clarify-style reports.');
    } else if (a.goal === 'recs') {
      headline = 'Recommendations and ranking'; arch = 'realtime-features';
      add('s3', 'Interaction history', 'Training data for any recommender.');
      add('kinesis', 'Live events', 'Fresh behaviour improves recommendations.');
      if (a.team === 'small' || a.model === 'managed') {
        add('personalize', 'Managed recommender', 'Trained on your interaction data without building a model.');
      } else {
        add('sm-training', 'Train your own ranking model', 'Control over features and objective.');
        add('sm-feature-store', 'Online and offline features', 'Consistent features at request time.');
        add('sm-inference', 'Serves rankings', 'Autoscaled real-time endpoint.');
      }
      add('dynamodb', 'Catalogue and profile lookup', 'Joins recommendation IDs to display data.');
      nx('evaluation', 'Offline metrics must map to business outcomes.');
      risk('Cold start: new users and items have no history. Use metadata and fallbacks.');
      risk('Feedback loops make popular items more popular. Monitor diversity.');
    }

    if (a.model === 'hosted' && (a.goal === 'qa' || a.goal === 'agent' || a.goal === 'generate')) {
      if (a.scale === 'high' && a.team === 'platform') {
        add('eks', 'Serving fleet for open-weight models', 'Control and cost at high steady volume.');
        add('ec2', 'GPU capacity (reserved baseline)', 'Reserve GPUs; do not rely on on-demand.');
      } else {
        add('sm-inference', 'Managed hosting for open-weight models', 'Less to operate than your own fleet.');
        add('sm-jumpstart', 'Starting point for open models', 'Tuned containers and a catalogue.');
      }
      nx('where-model-runs', 'Confirm hosting against the managed API.');
      risk('GPU capacity and slow scale-out become your problem. Reserve capacity and keep headroom.');
    }
    if (a.model === 'custom') {
      add('sm-training', 'Fine-tuning jobs', 'Customise on your data, after prompt and retrieval baselines.');
      nx('improve-model', 'Prove fine-tuning beats prompt plus retrieval on your evals.');
      risk('Fine-tuning before a prompt and retrieval baseline wastes effort and creates a maintenance duty.');
    }

    if (a.latency === 'interactive') risk('A one- or two-second budget rules out multi-step agent loops and large models. Measure end to end.');
    if (a.latency === 'chat') risk('Streaming breaks behind buffering proxies and short idle timeouts. Test the whole path.');
    if (a.latency === 'async') { add('sqs', 'Buffers and retries long jobs', 'Protects slow consumers from bursts.'); risk('Async jobs need status, retries, idempotency and a result store.'); nx('inference-pattern', 'Define the job contract.'); }
    if (a.latency === 'batch') { add('stepfunctions', 'Coordinates bulk runs', 'Retries and state for long jobs.'); nx('inference-pattern', 'Batch is the cheapest pattern; confirm it fits.'); risk('Batch failures surface late. Add checks on each stage.'); }

    if (a.data === 'regulated') {
      add('vpc', 'Private endpoints keep traffic on the AWS network', 'Prompts and datasets avoid the public internet.');
      add('kms', 'Customer-managed encryption keys', 'Key control is part of most regulated-data reviews.');
      add('macie', 'Scans S3 for sensitive data', 'Keep PII out of training sets and indexes.');
      add('cloudtrail', 'Audit log of API activity', 'Evidence for audits.');
      add('iam', 'Least-privilege roles', 'Limits access to datasets and models.');
      if (a.goal === 'qa' || a.goal === 'agent' || a.goal === 'generate') add('comprehend', 'PII redaction before prompts and logs', 'Reduces exposure.');
      nx('tenancy', 'Choose the isolation model before onboarding sensitive tenants.');
      risk('Cross-Region inference can move data across Regions. Check residency rules before enabling it.');
      risk('Prompts, outputs and logs hold sensitive data. Restrict access and set retention.');
    } else if (a.data === 'internal') {
      add('vpc', 'Private endpoints for AWS services', 'Keeps traffic on the AWS network.');
      add('kms', 'Encryption keys', 'Default-on encryption with key control.');
      add('iam', 'Least-privilege roles', 'Separate roles for builders, jobs and apps.');
    }

    if (a.scale === 'mid' || a.scale === 'high') {
      add('servicequotas', 'Raise model and GPU quotas before launch', 'Throttling is the most common launch surprise.');
      nx('capacity-strategy', 'Plan quotas, fallbacks and reservations.');
      nx('cost-levers', 'Decide which levers to apply and measure.');
      risk('Quota increases take days. Request them well before launch.');
    }
    if (a.scale === 'high') {
      add('waf', 'Rate limiting at the edge', 'Protects against abuse and denial of wallet.');
      if (a.goal === 'qa' || a.goal === 'generate' || a.goal === 'agent') add('elasticache', 'Semantic cache and counters', 'Skips the model on repeated questions; verify answers stay correct.');
    }
    if (a.team === 'small') risk('A small team should avoid operating GPUs or clusters. Stay on managed services until volume forces a change.');

    nx('evaluation', 'Build the eval set before the system.');
    add('cloudwatch', 'Metrics, logs and alarms across every layer', 'Latency, errors, throttles, tokens and cost.');
    add('budgets', 'Spend alarms and cost attribution', 'Forgotten resources and loops are expensive.');

    var phases = [
      'Prototype: build the eval set first, then a baseline of the simplest managed pieces (' + headline.toLowerCase() + ').',
      'Pilot: limit scope and users. Add guardrails, permission and tenant tests, and monitoring. Measure cost per task.' + (a.goal === 'agent' ? ' Keep actions read-only or approval-gated.' : ''),
      'Production: raise quotas, add a tested fallback, load test, write runbooks and define service levels.',
      'Scale: apply cost levers (caching, batching, routing), revisit hosting, and raise autonomy only where measured accuracy supports it.'
    ];

    return { headline: headline, arch: arch, stack: stack, risks: risks, next: next, phases: phases };
  }
};
