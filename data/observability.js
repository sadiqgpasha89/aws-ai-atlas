S({
  id: 'cloudwatch', cat: 'ops', name: 'Amazon CloudWatch', doc: 'cloudwatch/',
  tag: 'Metrics, logs, alarms and dashboards for every layer of an AI system.',
  what: 'CloudWatch collects **metrics** (numbers over time), **logs** (text events, searchable with Logs Insights), and **traces and application signals**. **Alarms** watch metrics and trigger notifications or automation, and **dashboards** put them side by side. Almost every AWS service publishes metrics here automatically.\n\nBedrock publishes invocation counts, latency, input and output token counts, and throttles. SageMaker publishes model latency, invocations and errors. GPU utilisation comes from an agent you install.',
  flow: ['Service emits metric / log', 'CloudWatch', 'Alarm evaluates', 'Action (SNS / Lambda)', 'Dashboard'],
  steps: [
    [0, 'Services publish metrics automatically; your code and agents send custom metrics and logs.'],
    [1, 'CloudWatch stores them: metrics at standard or high resolution, logs in groups with a retention policy.'],
    [2, 'An alarm evaluates a metric statistic over a window against a threshold.'],
    [3, 'On breach it triggers an action: notify through [[sns]], run a [[lambda]], or scale a resource.'],
    [4, 'Dashboards and Logs Insights queries let people see what happened.']
  ],
  gotchas: [
    '**Log retention defaults to never expire.** Verbose prompt and response logging quietly becomes a large bill. Set retention on every log group.',
    '**High-cardinality custom metrics are expensive.** A dimension like user ID or prompt ID creates millions of metrics. Aggregate, or use logs with Embedded Metric Format.',
    '**Prompts in logs are sensitive data.** Model invocation logging can capture full inputs and outputs. Decide deliberately, restrict access, and consider redaction.',
    '**Missing data handling.** An alarm on a metric that stops reporting may sit in "insufficient data" instead of firing. Set the missing-data treatment on purpose.',
    'Metrics have delays, so alarms are not instantaneous.'
  ],
  edges: [
    'GPU metrics (utilisation, memory) need the CloudWatch agent or Container Insights with accelerated compute support.',
    'Cross-account and cross-Region dashboards require explicit sharing configuration.',
    'Anomaly detection alarms learn normal patterns, which suits traffic with daily cycles.'
  ],
  ml: [
    'Alarm on Bedrock throttles, p95 latency and token spend per application.',
    'Watch endpoint `ModelLatency`, `OverheadLatency` and 5XX, and queue age for async pipelines.',
    'Track GPU utilisation to find idle expensive hardware.'
  ],
  pairs: ['bedrock', 'sm-inference', 'sns', 'lambda', 'cloudtrail', 'servicequotas'],
  cost: 'Custom metrics, alarms, log ingestion and storage, Insights query scans, and dashboards. Log ingestion volume is usually the big one.'
});

S({
  id: 'cloudtrail', cat: 'ops', name: 'AWS CloudTrail', doc: 'awscloudtrail/',
  tag: 'The audit log of API activity: who did what, when, from where.',
  what: 'CloudTrail records API calls made in your account: console actions, SDK calls, and calls by AWS services on your behalf. **Management events** (creating resources, changing permissions) are recorded by default in a 90-day event history. **Trails** deliver events to S3 for long-term storage; **CloudTrail Lake** provides SQL queries over events.\n\nHigh-volume operations such as S3 object access and some AI service invocations are **data events**, which are off by default and billed.',
  flow: ['API call', 'CloudTrail', 'Event record', 'Trail → S3 / Lake', 'Investigation / alerts'],
  steps: [
    [0, 'A principal calls an AWS API.'],
    [1, 'The service reports the call to CloudTrail with caller identity, source IP, parameters and result.'],
    [2, 'The event appears in event history within minutes.'],
    [3, 'A trail delivers it to [[s3]] (and optionally CloudWatch Logs); Lake can ingest it for querying.'],
    [4, 'Teams search it or alert on specific events through [[eventbridge]].']
  ],
  gotchas: [
    '**Management events only by default.** Who read an S3 object, or invoked a specific model, may need data events you must enable.',
    '**It records calls, not content.** CloudTrail shows that a model was invoked, not what was in the prompt.',
    '**Delivery is not instant.** Events can take several minutes to arrive.',
    'Data events are billed per volume and can get costly; select resources narrowly.'
  ],
  edges: [
    'Organisation trails capture all member accounts centrally.',
    'Log file validation and S3 Object Lock make the log tamper-evident.',
    'Access Analyzer can generate least-privilege IAM policies from observed activity.'
  ],
  ml: [
    'Audit who changed model approvals, deployed endpoints or modified guardrails.',
    'Investigate unexpected GPU or Bedrock spend by finding the principal who launched it.',
    'Evidence for compliance: who accessed training data and when.'
  ],
  pairs: ['iam', 's3', 'eventbridge', 'cloudwatch', 'lakeformation'],
  cost: 'First copy of management events is free; additional trails, data events and Lake storage and queries are billed.'
});

S({
  id: 'cdk', cat: 'ops', name: 'CloudFormation & AWS CDK', doc: 'cdk/',
  tag: 'Define your AI platform as code so it can be reviewed, versioned and recreated.',
  what: '**CloudFormation** provisions resources from declarative templates grouped into **stacks**, computing a **change set** before applying updates and rolling back on failure. **AWS CDK** lets you write the infrastructure in a programming language (TypeScript, Python and others) and synthesises CloudFormation, with high-level **constructs** that bundle sensible defaults. Community construct libraries exist for generative AI patterns.',
  flow: ['CDK code', 'cdk synth', 'CloudFormation template', 'Change set', 'Resources created / updated'],
  steps: [
    [0, 'You define resources and relationships in code.'],
    [1, '`cdk synth` generates a CloudFormation template.'],
    [2, '`cdk deploy` uploads assets and creates a change set showing what will change.'],
    [3, 'CloudFormation applies it in dependency order, rolling back on failure.'],
    [4, 'The stack records the resources, enabling drift detection and clean deletion.']
  ],
  gotchas: [
    '**Renames can replace stateful resources.** Changing the logical ID or an immutable property of a bucket, database or vector collection may delete and recreate it. Use retention policies and read change sets.',
    '**Stacks have resource limits.** Split large systems into several stacks.',
    '**Endpoints and clusters keep billing.** A GPU endpoint in a stack runs until deleted, so tear down dev stacks.',
    '**Circular dependencies and cross-stack references** make refactors painful; design stack boundaries early.',
    'Some new AI resources arrive in CloudFormation after the console and SDK; custom resources fill gaps.'
  ],
  edges: [
    'Drift detection reveals manual changes but does not fix them.',
    'Bootstrap resources per account and Region are required before first CDK deploy.',
    'Pipelines (CodePipeline or GitHub Actions) should apply changes, not laptops.'
  ],
  ml: [
    'Reproduce full environments (VPC, endpoints, roles, buckets, Bedrock resources) per team or stage.',
    'Review IAM and network changes in pull requests rather than discovering them in production.',
    'Ephemeral experiment stacks that can be created and destroyed on demand.'
  ],
  pairs: ['iam', 'vpc', 'sm-pipelines', 'cloudtrail', 'budgets'],
  cost: 'CloudFormation is free for AWS resources; you pay for what it creates.'
});

S({
  id: 'servicequotas', cat: 'ops', name: 'Service Quotas', doc: 'servicequotas/',
  tag: 'View and raise the limits that decide whether your AI system can scale at all.',
  what: 'Service Quotas lists the limits on each service in each Region of your account, and lets you request increases. For AI, the quotas that bite are **GPU instance vCPUs** for EC2, **per-instance-type quotas for SageMaker** (separate for training, endpoints and notebooks), **Bedrock requests and tokens per minute** per model, and **Lambda concurrency**.\n\nNew accounts start with low defaults, and accelerator quotas are intentionally conservative.',
  flow: ['Plan capacity', 'Check applied quota', 'Request increase', 'Review / approval', 'New limit effective'],
  steps: [
    [0, 'You estimate peak need: GPUs for training, tokens per minute for a launch.'],
    [1, 'You compare against the **applied** quota in the target Region.'],
    [2, 'You submit an increase request with the new value.'],
    [3, 'Some are auto-approved; large GPU and model throughput requests are reviewed and may need justification.'],
    [4, 'Once approved, the limit rises, but capacity availability is a separate matter.']
  ],
  gotchas: [
    '**Increases are not instant.** GPU and Bedrock throughput requests can take days. Ask well before launch.',
    '**Regional.** A quota in `us-east-1` says nothing about `us-west-2`.',
    '**Quota is not capacity.** Even with a high EC2 quota, a specific GPU instance may be unavailable at that moment.',
    '**Some quotas are not adjustable,** and some model quotas differ per model version.',
    'Requests that look arbitrary get declined. Explain the workload and expected traffic.'
  ],
  edges: [
    'Organisation quota request templates can pre-apply increases to new accounts.',
    'Many quotas have usage metrics in [[cloudwatch]] so you can alarm before reaching them.',
    'Separate training, endpoint and processing quotas in SageMaker catch people repeatedly.'
  ],
  ml: [
    'Pre-launch checklist: Bedrock tokens per minute for each model, SageMaker endpoint instances, Lambda concurrency, and vector-store limits.',
    'Capacity plan for training runs, tied to reservations such as Capacity Blocks.',
    'Alarm at 70–80% of quota usage on throttle-prone resources.'
  ],
  pairs: ['bedrock', 'ec2', 'sm-training', 'lambda', 'cloudwatch'],
  cost: 'Free.'
});

S({
  id: 'budgets', cat: 'ops', name: 'AWS Budgets & Cost Explorer', doc: 'cost-management/',
  tag: 'See, attribute and cap spend: essential when one forgotten GPU can cost thousands.',
  what: '**Cost Explorer** visualises spend by service, tag, account and more. **AWS Budgets** sets thresholds on cost or usage and triggers alerts, or **actions** such as applying a restrictive policy. **Cost Anomaly Detection** uses ML to flag unusual spend. **Cost allocation tags** and **application inference profiles** (for Bedrock) let you attribute cost to teams, features or tenants.',
  flow: ['Resources tagged', 'Billing data', 'Budget threshold', 'Alert / action', 'Review in Cost Explorer'],
  steps: [
    [0, 'Resources carry cost allocation tags (team, project, environment); Bedrock usage uses tagged application inference profiles.'],
    [1, 'Usage flows into billing data, with a delay of up to a day.'],
    [2, 'A budget compares actual or forecast spend against your threshold.'],
    [3, 'Crossing it sends an alert through [[sns]] or runs an action.'],
    [4, 'Cost Explorer and exports let you drill into the cause.']
  ],
  gotchas: [
    '**Billing data lags,** so a runaway GPU cluster can burn through a lot before an alert fires. Pair budgets with near-real-time CloudWatch alarms and quotas.',
    '**Tags are not retroactive** and must be activated as cost allocation tags. Tag at creation, enforce with policy.',
    '**On-demand Bedrock calls are not tagged resources.** Use application inference profiles to attribute token spend.',
    '**Budget actions are not hard caps.** They react after the fact.',
    'Idle endpoints and unattached volumes show up here only if someone looks.'
  ],
  edges: [
    'Savings Plans and reserved capacity reduce steady GPU cost but add commitment risk if the workload changes.',
    'Data exports to S3 enable your own analysis in [[athena]].'
  ],
  ml: [
    'Per-feature and per-tenant cost of goods for LLM features: tokens × price, tracked from the start.',
    'Daily review of GPU and endpoint spend, with anomaly alerts routed to the owning team.',
    'Show unit economics (cost per request or per training run) to guide model-size and caching decisions.'
  ],
  pairs: ['cloudwatch', 'bedrock', 'ec2', 'sm-inference', 'servicequotas', 'iam'],
  cost: 'Cost Explorer and basic budgets are low cost or free; budget actions beyond the free tier are charged per budget per day.'
});
