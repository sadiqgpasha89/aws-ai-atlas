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


window.ATLAS.engineeringPlaybooks = [
  {
    "id": "rag-engineering",
    "title": "Enterprise RAG Engineering Playbook",
    "badge": "Core Pattern",
    "tag": "Document ingestion, layout chunking, hybrid search tuning, reranking and quality metrics.",
    "intro": "Retrieval-Augmented Generation (RAG) is not a single prompt trick — it is a distributed data retrieval and ranking system. In enterprise deployments, generation quality is overwhelmingly constrained by retrieval recall. This playbook outlines the production engineering practices for building high-precision RAG on AWS.",
    "sections": [
      {
        "title": "1. Document Cracking and Ingestion",
        "body": "Never use naive PDF text dumpers on enterprise documents. Real-world documents contain multi-column layouts, tables, headers, embedded diagrams and scanned pages that standard text splitters flatten into useless noise.\n\nUse [[textract|Amazon Textract]] layout analysis (`Layout` feature). It outputs semantic Markdown preserving document headers (`#`, `##`), reading order across columns, and structured HTML/Markdown tables. For multimodal documents containing charts and photos, integrate [[rekognition]] and vision models to extract visual bounding box descriptions.",
        "tips": [
          "**Always extract tables as Markdown:** Tables converted to raw text lose cell coordinate meaning; Markdown tables allow embedding models and LLMs to preserve column-row relationships.",
          "**Capture document metadata during cracking:** Extract author, department, creation date, and Cognito security group identifiers into metadata tags for downstream security trimming."
        ]
      },
      {
        "title": "2. Chunking Algorithms and Boundaries",
        "body": "Chunk size directly governs the trade-off between retrieval specificity and conversational context. Chunks under 200 tokens lack sufficient semantic context; chunks over 1,500 tokens dilute vector embeddings and inflate LLM input costs.\n\nAdopt **Document-Aware Layout Chunking** and **Hierarchical Parent-Child Chunking**:",
        "bullets": [
          "**Layout-Aware Chunking:** Split at logical Markdown section boundaries (`##`) rather than arbitrary character counts. Prepend the document title and section path to every chunk.",
          "**Parent-Child Indexing:** In [[bedrock-kb|Bedrock Knowledge Bases]] or [[opensearch|OpenSearch Serverless]], index small child passages (200-300 tokens) for dense vector search, but retrieve and inject the parent section (1,000-1,500 tokens) into the LLM prompt to give the model complete context.",
          "**Sliding Window Overlap:** Maintain 10-15% token overlap across sequential chunks to prevent semantic truncation of cross-boundary statements."
        ]
      },
      {
        "title": "3. Hybrid Search Tuning and Semantic Reranking",
        "body": "Dense vector search alone fails on alphanumeric strings: product SKUs, invoice numbers, software error codes, and customer identifiers. Pure keyword search fails on synonyms and conceptual phrasing.\n\nProduction enterprise RAG on AWS must configure **Hybrid Search** combining dense vectors and BM25 full-text search, fused via Reciprocal Rank Fusion (RRF), followed by a **Semantic Cross-Encoder Reranker** (such as Cohere Rerank or Bedrock Rerank).",
        "bullets": [
          "**Reciprocal Rank Fusion (RRF):** Evaluates ranks from dense vector and BM25 keyword passes in [[opensearch]], scoring candidates by `1 / (60 + rank)`. This balances keyword precision and semantic intent without manual weight tuning.",
          "**Semantic Reranker:** Evaluates the top 50 RRF candidates through a deep cross-encoder model, boosting relevant passages to the top 3-5 positions. This yields a 15-25% lift in NDCG@10 at a modest 100-200ms latency cost.",
          "**Bedrock Knowledge Bases:** AWS managed knowledge layer around OpenSearch Serverless automates multi-query decomposition and parallel knowledge source execution."
        ]
      },
      {
        "title": "4. Measurable RAG Quality Indicators",
        "body": "Do not judge RAG quality by manual spot-checking or subjective demo reviews. Track formal statistical evaluation metrics separated into retrieval quality and generation quality:",
        "bullets": [
          "**Recall@K (Target: >85% at K=5):** The fraction of ground-truth relevant passages successfully surfaced in the top K retrieved results.",
          "**MRR (Mean Reciprocal Rank):** Evaluates how close to the top position the first relevant passage appears.",
          "**NDCG@K (Normalized Discounted Cumulative Gain):** Measures graded relevance and ranking quality of the retrieved set.",
          "**Groundedness / Faithfulness (Target: >95%):** The percentage of generated claims in the final answer that can be strictly deduced from retrieved context.",
          "**Answer Relevance (Target: >90%):** How directly the synthesized response answers the user's prompt without extraneous filler.",
          "**Citation Precision (Target: >98%):** Percentage of inline citations that point to an actual supporting statement in the source passage."
        ]
      }
    ],
    "see": [
      "arch:traditional-rag",
      "arch:agentic-rag",
      "dec:vector-hybrid-search",
      "dec:chunking-strategy",
      "dec:reranking-tradeoff",
      "svc:opensearch",
      "svc:textract"
    ]
  },
  {
    "id": "agent-engineering",
    "title": "Multi-Agent Engineering & Orchestration Playbook",
    "badge": "Emerging Standard",
    "tag": "Orchestration patterns, framework selection, memory persistence, MCP tools and safety gates.",
    "intro": "Moving from a single chatbot to an autonomous multi-agent system shifts engineering focus from prompt design to distributed systems design: state machines, distributed transactions, memory lifecycles, and tool authorization. This playbook outlines the architectural patterns and production guardrails required to operate multi-agent systems reliably on AWS.",
    "sections": [
      {
        "title": "1. Multi-Agent Orchestration Patterns",
        "body": "Avoid unstructured peer-to-peer agent swarms in production; uncoordinated agents enter conversational deadlocks and experience rapid context bloat. Choose one of three proven coordination topologies:",
        "bullets": [
          "**Supervisor-Worker (Hub and Spoke):** A central coordinator agent breaks user tasks into sub-goals, delegates them to specialized workers (Researcher, Coder, Reviewer), and synthesizes final output.",
          "**Sequential Pipeline (Assembly Line):** Agents pass structured data sequentially through deterministic stages (Extract -> Validate -> Format -> Post). Best when steps are ordered and auditable.",
          "**Hierarchical Consensus:** Worker agents produce candidate proposals; an independent critic agent evaluates proposals against compliance and safety rubrics before final approval."
        ]
      },
      {
        "title": "2. Runtime Selection & Tool Contracts",
        "body": "Choose between managed and code-first runtimes based on autonomy requirements. Use [[bedrock-agents|Amazon Bedrock Agents]] for managed enterprise workflows with Action Groups. Use [[agentcore]] or code-first frameworks (LangGraph, AutoGen) hosted on [[ecs]] or [[lambda]] for complex state machines.\n\nEnforce strict tool interface boundaries:",
        "bullets": [
          "**Narrow, Typed Tool Schemas:** Define tool input parameters with strict JSON Schema types. Avoid generic `query: string` inputs; demand structured fields like `account_id: integer` and `start_date: string`.",
          "**Server-Side Tool Validation:** Never trust model-generated arguments blindly. Tool Lambda functions must validate inputs against backend business rules and authorization scopes.",
          "**Model Context Protocol (MCP):** Standardize tool integrations on MCP servers to decouple tools from proprietary model SDKs."
        ]
      },
      {
        "title": "3. State Persistence and Session Memory",
        "body": "Agents require persistent working memory to maintain context across multi-step execution graphs and user interaction turns.",
        "bullets": [
          "**Short-Term Scratchpad:** Temporary key-value state held in memory during single-run execution.",
          "**Long-Term Conversational Memory:** Persist conversation turns and checkpointed state in [[dynamodb]] keyed by `session_id` with TTL expiration.",
          "**Semantic Long-Term Memory:** Store user preferences, past decisions, and summarized knowledge in [[opensearch]] or [[bedrock-kb]] for cross-session retrieval."
        ]
      },
      {
        "title": "4. Safety Boundaries & Circuit Breakers",
        "body": "Autonomous agents can consume thousands of dollars in minutes if caught in recursive reasoning loops. Hard operational boundaries are non-negotiable:",
        "tips": [
          "**Maximum Iteration Cap:** Enforce a hard ceiling of 5 tool turns per task. Terminate execution and trigger human escalation if the agent has not reached a conclusion.",
          "**Wall-Clock Timeout:** Enforce an explicit timeout (e.g. 60 seconds) on agent graph execution via [[stepfunctions]].",
          "**Human-in-the-Loop (HITL) Write Gates:** Require cryptographic human approval via Step Functions pause tasks for all writes, financial transactions, or external emails."
        ]
      }
    ],
    "see": [
      "arch:multiagent-orchestration",
      "arch:agentic-rag",
      "dec:agent-runtime",
      "dec:workflow-vs-agent",
      "dec:human-in-loop",
      "svc:bedrock-agents",
      "svc:agentcore",
      "svc:stepfunctions"
    ]
  },
  {
    "id": "genaiops",
    "title": "GenAIOps Lifecycle & Evaluation Playbook",
    "badge": "Operational Rigor",
    "tag": "Golden datasets, automated evaluation gates, CI/CD pipelines, and drift detection.",
    "intro": "Traditional DevOps monitors deterministic code compilation and test execution. GenAIOps monitors stochastic system health: prompt drift, statistical evaluation degradation, regression testing, and continuous benchmarking. This playbook details how to operationalize continuous quality engineering for generative AI on AWS.",
    "sections": [
      {
        "title": "1. The Golden Evaluation Dataset",
        "body": "Subjective spot-testing in the AWS console is the most dangerous anti-pattern in generative AI. You cannot manage what you do not measure.\n\nEvery production AI project must maintain a versioned **Golden Evaluation Dataset** in Git alongside application code:",
        "bullets": [
          "**Curate 100-500 Representative Queries:** Include typical user questions, difficult multi-hop edge cases, adversarial prompt injection attacks, and out-of-domain queries.",
          "**Ground-Truth Annotations:** Pair each query with verified ground-truth reference passages and ideal answers signed off by business domain experts.",
          "**Automated Synthetic Expansion:** Use [[bedrock]] foundation models to generate 1,000+ synthetic question-answer pairs from raw documents, and filter pairs with low confidence scores."
        ]
      },
      {
        "title": "2. Multi-Tiered Evaluation Metrics",
        "body": "Run automated evaluations on every prompt, model, or retrieval change using a two-tier evaluation framework:",
        "bullets": [
          "**Deterministic Rule-Based Tests:** Fast, zero-cost checks verifying JSON Schema compliance, regex patterns, keyword inclusions/exclusions, and blocked term detection.",
          "**LLM-as-a-Judge Statistical Scoring:** Pass model output, ground-truth references, and retrieved context to an independent evaluator model using [[sm-monitor|SageMaker Model Monitor]] or Bedrock Evaluations.",
          "**Evaluation Dimensions:** Score Groundedness/Faithfulness (>95%), Answer Relevance (>90%), Context Recall (>85%), and Toxicity/Safety (0 violations)."
        ]
      },
      {
        "title": "3. Automated CI/CD Evaluation Release Gates",
        "body": "Embed automated evaluation suites directly into GitHub Actions or AWS CodePipeline builds targeting `main`:",
        "bullets": [
          "**Pull Request Evaluation Sweep:** Execute the 100-case core evaluation dataset on every PR touching prompts, chunking code, or tool definitions.",
          "**Hard Quality Gates:** Automatically block merge if Groundedness drops by more than 2% or if any critical safety violation is detected.",
          "**Cryptographic Release Pinning:** Pin prompt templates, model versions, temperature, and search configurations into immutable deployment packages."
        ]
      },
      {
        "title": "4. Canary Deployment & Online Drift Monitoring",
        "body": "Offline evaluations cannot predict real-world user query distribution shifts. Deploy updates with canary traffic routing and live telemetry:",
        "tips": [
          "**Canary Routing:** Route 10% of production traffic to the candidate prompt or model via [[apigw|API Gateway]] or [[sm-inference|SageMaker Inference]] canary deployments.",
          "**Online Feedback Capture:** Log explicit user feedback (thumbs up/down) and implicit signals (copy-to-clipboard, retry frequency) to [[cloudwatch]].",
          "**Automated Rollback:** Configure CloudWatch alarms on P95 latency, 429 throttling errors, or negative feedback spikes to trigger instant automated rollback within 5 minutes."
        ]
      }
    ],
    "see": [
      "arch:genaiops-lifecycle",
      "dec:evaluation",
      "dec:improve-model",
      "svc:sm-monitor",
      "svc:bedrock",
      "svc:cloudwatch"
    ]
  },
  {
    "id": "security-hardening",
    "title": "Enterprise Security Hardening Playbook",
    "badge": "Enterprise Readiness",
    "tag": "Zero-trust network boundaries, prompt defense, data masking, document security and IAM least privilege.",
    "intro": "Generative AI introduces novel enterprise attack surfaces: direct and indirect prompt injection, sensitive data leakage into public training sets, and compromised autonomous tool executions. This playbook provides the definitive security hardening checklist for AWS AI architectures.",
    "sections": [
      {
        "title": "1. Zero-Trust Network Perimeter",
        "body": "No production AI service should ever expose a public internet endpoint. Enforce strict private connectivity:",
        "bullets": [
          "**AWS PrivateLink VPC Endpoints:** Access Bedrock, OpenSearch Serverless, SageMaker, and S3 exclusively through PrivateLink interface endpoints within private VPC subnets.",
          "**Disable Public Network Access:** Explicitly block public network access on all S3 buckets, OpenSearch collections, and SageMaker endpoints.",
          "**Egress Filtering:** Force all outbound internet traffic from container hosts and Lambda functions through AWS Network Firewall for FQDN filtering."
        ]
      },
      {
        "title": "2. Identity Propagation & Least Privilege",
        "body": "Authenticate workloads using short-lived managed identities and propagate end-user credentials to all downstream retrieval layers:",
        "bullets": [
          "**Disable Long-Lived API Keys:** Never store AWS secret access keys in application configuration. Authenticate using IAM roles for EC2, ECS task roles, or Lambda execution roles.",
          "**Delegated User Authorization:** Propagate caller identity claims from [[cognito]] through [[apigw]] so retrieval and tool execution act with user permissions rather than administrative access.",
          "**Least-Privilege Action Groups:** Restrict Bedrock Agent action groups to narrow IAM policies granting access only to specific Lambda functions and DynamoDB tables."
        ]
      },
      {
        "title": "3. Prompt Injection Defense & Content Safety",
        "body": "Defend against both direct jailbreak attacks (users attempting to bypass guardrails) and indirect prompt injection (hidden commands in retrieved documents):",
        "bullets": [
          "**Guardrails for Amazon Bedrock:** Enable Prompt Attacks filters to block direct jailbreak attempts and system prompt extraction.",
          "**Delimited System Prompts:** Isolate untrusted retrieved documents inside unambiguous XML tags (`<context>...</context>`) with strict model instructions to ignore instructions inside tags.",
          "**Sensitive Information Filters:** Configure Bedrock Guardrails regex and managed PII filters to automatically mask Social Security numbers, credit cards, and corporate API tokens.",
          "**Pre-Execution Tool Screening:** Screen tool call arguments against regex patterns before invoking backend database functions."
        ]
      },
      {
        "title": "4. Document-Level Security Trimming",
        "body": "In enterprise RAG, users must only retrieve information they have explicit permission to access in source systems:",
        "tips": [
          "**Index-Level Access Tags:** Tag every chunk in [[opensearch]] with a list of authorized user IDs and security group IDs.",
          "**Mandatory Backend Filter Injection:** The backend search proxy must inject a mandatory `terms` filter matching caller security group claims extracted from verified JWT tokens.",
          "**Cryptographic Data Revocation:** Encrypt all S3 documents and OpenSearch indexes with dedicated Customer-Managed Keys in [[kms]]. Revoking key access renders tenant data permanently unreadable."
        ]
      }
    ],
    "see": [
      "arch:secure-multitenant-rag",
      "dec:tenancy",
      "dec:human-in-loop",
      "svc:bedrock-guardrails",
      "svc:iam",
      "svc:kms",
      "svc:waf"
    ]
  },
  {
    "id": "sre-operations",
    "title": "Production AI SRE & Reliability Playbook",
    "badge": "Operations & SRE",
    "tag": "10 operational indicators, 429 throttling mitigation, latency budgets, runbooks and postmortems.",
    "intro": "Operating generative AI and agentic systems requires moving from traditional server health monitoring to stochastic system reliability: tracking token economics, prompt drift, retrieval quality, tool error rates, and 429 throttling spikes. This playbook establishes the site reliability engineering standards for production AI on AWS.",
    "sections": [
      {
        "title": "1. The 10 Mandatory Operational Indicators",
        "body": "Every production AI application on AWS must instrument and display the 10 core operational health metrics in [[cloudwatch]]:",
        "bullets": [
          "**1. Task Throughput & Completion Rate (Target: >95%):** End-to-end completed business tasks versus aborted or failed runs.",
          "**2. Time to First Token (TTFT) (Target: P95 <1,500ms):** Elapsed time from prompt submission to first streamed completion token.",
          "**3. Token Consumption & Cache Efficiency (Target: >35% cache hits):** Prompt and completion token volume, tracking prompt caching savings on Bedrock.",
          "**4. Model Throttling Rate (HTTP 429) (Target: <0.1%):** Frequency of ThrottlingException errors from model APIs.",
          "**5. Retrieval Groundedness Score (Target: >95%):** Automated sample evaluation verifying answers cite retrieved context.",
          "**6. Agent Tool-Call Failure Rate (Target: <2%):** Percentage of tool invocations resulting in errors, timeouts, or retries.",
          "**7. Cost per Successful Task (Target: within budget):** Unit economics dividing daily total infrastructure spend by successful tasks.",
          "**8. Evaluation Score Trend:** Offline and online golden eval scores tracked across releases.",
          "**9. Guardrail Trigger Rate (Target: <0.1%):** Frequency of requests blocked by Bedrock Guardrails.",
          "**10. Dependency Health & Availability (Target: >99.9%):** Health of upstream foundation models, OpenSearch Serverless, and DynamoDB."
        ]
      },
      {
        "title": "2. Mitigating HTTP 429 Throttling & Capacity Spikes",
        "body": "Rate limiting is the most common operational failure mode in LLM applications. Implement multi-layered capacity resilience:",
        "bullets": [
          "**Cross-Region Inference Profiles:** Use [[bedrock]] Cross-Region Inference Profiles to automatically distribute requests across multiple AWS Regions during regional traffic bursts.",
          "**Client Exponential Backoff and Jitter:** Configure AWS SDKs with full jitter exponential backoff to prevent thundering herd retry storms.",
          "**Multi-Model Failover:** Configure [[apigw]] to failover to a fallback model (e.g. Anthropic Claude 3.5 Haiku or Amazon Nova Lite) if primary model capacity is exhausted.",
          "**Asynchronous Queue Buffering:** Buffer non-interactive requests (document summarization, bulk categorization) through [[sqs]] to decouple user traffic from model concurrency limits."
        ]
      },
      {
        "title": "3. Managing Non-Deterministic Failure & Incident Response",
        "body": "When generative AI applications fail, standard stack traces rarely reveal the root cause. Follow SRE triage procedures:",
        "tips": [
          "**Isolate the Failing Layer:** Determine whether the incident stems from Retrieval (empty or stale passages), Grounding (model hallucinating despite context), or Tool Invocation (API error or invalid schema).",
          "**Prompt Circuit Breakers:** Maintain dynamic prompt versioning in AWS AppConfig or Parameter Store so prompts can be reverted in 60 seconds without code deployments.",
          "**Stochastic Postmortems:** Conduct post-incident reviews using the 5 Whys adapted for AI: investigate dataset distribution shifts, prompt drift, and retrieval recall failure."
        ]
      }
    ],
    "see": [
      "arch:llm-serving",
      "dec:capacity-strategy",
      "dec:inference-pattern",
      "dec:cost-levers",
      "svc:cloudwatch",
      "svc:bedrock",
      "svc:apigw"
    ]
  }
];

window.ATLAS.workloadGates = {
  rag: {
    title: "RAG Production Readiness Gate",
    workload: "Retrieval-Augmented Generation Assistants",
    description: "Mandatory quality, security, and freshness gates required before shipping a RAG system to production.",
    items: [
      { id: "rag-g1", title: "Source Documents Approved & Lineage Verified", desc: "Source documents in [[s3]] are approved by domain owners; duplicate and expired documents purged." },
      { id: "rag-g2", title: "Document ACLs Preserved at Retrieval Time", desc: "User permissions mapped to vector metadata filters; unauthorized documents filtered before LLM context injection." },
      { id: "rag-g3", title: "Event-Driven Data Refresh Implemented", desc: "S3 ObjectCreated/ObjectRemoved events trigger automated chunk re-indexing and tombstoning in [[opensearch]]." },
      { id: "rag-g4", title: "Retrieval Benchmark Established", desc: "Recall@5 >= 0.85 and MRR >= 0.75 verified on frozen golden dataset using hybrid search (BM25 + k-NN)." },
      { id: "rag-g5", title: "Cross-Encoder Reranking Evaluated", desc: "Cohere or Bedrock Reranker evaluated on top-25 chunks; precision gain justifies latency budget." },
      { id: "rag-g6", title: "Groundedness (Faithfulness) Tested", desc: "Measured Groundedness >= 95.0% on 200+ golden cases; zero critical hallucinations detected." },
      { id: "rag-g7", title: "Citation Attribution Accuracy Tested", desc: "100% of generated claims link to verifiable document title, page, and chunk references." },
      { id: "rag-g8", title: "Prompt Injection & Poisoning Defense Active", desc: "[[bedrock-guardrails]] filters malicious prompts and indirect injection hidden inside retrieved documents." },
      { id: "rag-g9", title: "Multi-Tenant Data Isolation Verified", desc: "Cross-tenant retrieval tests prove 0% possibility of Tenant A retrieving Tenant B's confidential chunks." },
      { id: "rag-g10", title: "Index Rollback & Disaster Recovery Tested", desc: "Automated snapshot restore and parallel index rebuild tested in staging (< 30 minutes recovery)." }
    ]
  },
  agent: {
    title: "Agentic AI Production Readiness Gate",
    workload: "Autonomous & Multi-Step Agent Workflows",
    description: "Strict safety, autonomy, budget, and authorization controls required before deploying agentic AI workloads.",
    items: [
      { id: "agt-g1", title: "Agent Autonomy Level Documented (L1-L4)", desc: "Permitted autonomous actions vs actions requiring human authorization documented and approved by InfoSec." },
      { id: "agt-g2", title: "Tool Permissions Scoped via Least-Privilege IAM", desc: "Agent execution roles restricted to specific ARNs with session policies; no wildcard `*` permissions." },
      { id: "agt-g3", title: "Maximum Execution Step Limit Enforced", desc: "Hard ceiling enforced in code: maximum 10 reasoning steps before deterministic agent termination." },
      { id: "agt-g4", title: "Maximum Token & Cost Budget Enforced", desc: "Hard ceiling of 50,000 total tokens per task; circuit breaker terminates runaway reasoning loops." },
      { id: "agt-g5", title: "Per-Tool Execution Timeouts Configured", desc: "Strict timeouts (5s per tool call, 30s total) prevent hanging HTTP connections or database locks." },
      { id: "agt-g6", title: "Exponential Backoff & Loop Protection Verified", desc: "Loop breaker detects identical consecutive tool calls; trips circuit breaker after 3 repeats." },
      { id: "agt-g7", title: "Idempotency Enforced on Action Tools", desc: "State-changing tools (payments, mutations) require client request tokens to prevent duplicate execution." },
      { id: "agt-g8", title: "Human Approval Gate for Sensitive Tools", desc: "Irreversible actions gated behind [[stepfunctions]] task token callback requiring human manager click." },
      { id: "agt-g9", title: "Durable State Checkpointing Implemented", desc: "Intermediate agent memory and tool outputs persisted to [[dynamodb]] to enable workflow resumption." },
      { id: "agt-g10", title: "Distributed Trace Correlation Active", desc: "OpenTelemetry `traceparent` headers injected and logged to [[cloudwatch]] for end-to-end auditability." },
      { id: "agt-g11", title: "Task Completion Benchmark Passed", desc: "Goal Completion Rate >= 95.0% and Tool Argument Accuracy >= 98.0% on agent golden test suite." },
      { id: "agt-g12", title: "Emergency Kill Switch Operational", desc: "Feature flag or AppConfig parameter tested; disables autonomous actions organization-wide in < 30 seconds." }
    ]
  },
  ml: {
    title: "Classic ML & Fine-Tuning Production Gate",
    workload: "Custom Models, Tabular ML & Fine-Tuned Endpoints",
    description: "MLOps operational gates required for model registries, feature stores, drift monitoring, and endpoints.",
    items: [
      { id: "ml-g1", title: "Training Data Validation & Lineage Logged", desc: "Input dataset schema validated, training/validation splits verified, and data lineage logged in S3." },
      { id: "ml-g2", title: "Model Accuracy & F1 Benchmarks Achieved", desc: "Model evaluation scorecard meets baseline thresholds on out-of-sample holdout test sets." },
      { id: "ml-g3", title: "Baseline Data & Concept Drift Profile Created", desc: "Baseline statistical distributions registered in [[sm-monitor|SageMaker Model Monitor]]." },
      { id: "ml-g4", title: "Feature Pipelines Operational & Synchronized", desc: "Online feature serving (< 10ms) in [[sm-feature-store]] synchronized with offline data lake." },
      { id: "ml-g5", title: "Model Versioned in Model Registry", desc: "Artifacts, container URI, and hyperparameters approved in SageMaker Model Registry." },
      { id: "ml-g6", title: "Shadow Deployment / Canary Configured", desc: "Shadow traffic testing verifies model behaves identically to production predecessor under live load." },
      { id: "ml-g7", title: "Bias, Fairness & Explainability Audited", desc: "Feature attribution and demographic fairness audited using SageMaker Clarify." },
      { id: "ml-g8", title: "Inference Latency P99 Tested Under Peak Load", desc: "Endpoint autoscaling verified from 1 to N instances under 2x simulated peak concurrency." },
      { id: "ml-g9", title: "Automated Rollback Trigger Configured", desc: "CloudWatch alarm on ModelLatency or 5xx error rate instantly triggers endpoint rollback." },
      { id: "ml-g10", title: "Automated Retraining Trigger Documented", desc: "EventBridge rule and Step Functions pipeline scheduled to retrain when drift metric triggers alarm." }
    ]
  },
  api: {
    title: "AI API Gateway Production Readiness Gate",
    workload: "Inference APIs, Microservices & Streaming Frontends",
    description: "Availability, rate-limiting, concurrency, and security gates for enterprise AI request endpoints.",
    items: [
      { id: "api-g1", title: "Authentication & Tenant Identity Enforced", desc: "[[cognito]] JWT tokens or IAM SigV4 enforced on [[apigw|API Gateway]]; tenant ID extracted for billing." },
      { id: "api-g2", title: "Usage Plans & API Key Throttling Active", desc: "Rate limits (RPS) and burst limits configured per API client to prevent noisy-neighbor starvation." },
      { id: "api-g3", title: "AWS Service Quotas Validated for Peak", desc: "Bedrock model concurrency, Lambda concurrency, and VPC NAT Gateway limits verified in region." },
      { id: "api-g4", title: "P95 Streaming Latency (TTFT) Under 2.5s", desc: "Server-Sent Events (SSE) streaming verified under load; P95 Time to First Token < 2.5 seconds." },
      { id: "api-g5", title: "Client Retry with Full Jitter Implemented", desc: "Client SDKs configured to retry on HTTP 429 and 503 using randomized exponential backoff." },
      { id: "api-g6", title: "Circuit Breakers on Downstream AI Services", desc: "Trip circuit breaker when downstream Bedrock or tool dependencies fail 5 consecutive times." },
      { id: "api-g7", title: "WAF DDoS & Prompt Injection Rules Enabled", desc: "[[waf|AWS WAF]] web ACL deployed with AWS Managed Core Rule Set and custom rate-based IP rules." },
      { id: "api-g8", title: "Streaming SSE Buffer Handling Tested", desc: "Frontend client handles network disconnects gracefully; resumes streaming without dropping context." },
      { id: "api-g9", title: "Strict Payload Size & Timeout Limits Enforced", desc: "Inbound request body capped at 10MB; gateway timeout set to 29s with async queue fallback." },
      { id: "api-g10", title: "Multi-Region DNS Failover Verified", desc: "[[route53]] latency and health-check failover route traffic to backup region in < 60 seconds." }
    ]
  }
};
