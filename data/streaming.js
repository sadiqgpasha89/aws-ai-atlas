S({
  id: 'kinesis', cat: 'streaming', name: 'Kinesis Data Streams & Firehose', doc: 'streams/latest/dev/',
  tag: 'Real-time ordered event streams, and a managed pipe that delivers them to S3 and friends.',
  what: '**Kinesis Data Streams** is a durable, ordered log split into **shards**. Producers write records with a partition key; records with the same key land on the same shard in order. Multiple consumers read independently and can replay within the retention window.\n\n**Amazon Data Firehose** is the no-code delivery sibling: it buffers a stream and writes batches to S3, OpenSearch, Redshift or Iceberg tables, optionally converting to Parquet.',
  flow: ['Producers', 'Partition key hash', 'Shard (ordered log)', 'Consumers (KCL / Lambda)', 'Firehose buffer', 'S3 / OpenSearch'],
  steps: [
    [0, 'Producers `PutRecords` with a partition key such as a user or device ID.'],
    [1, 'The key is hashed to pick a shard, preserving order per key.'],
    [2, 'The shard stores the record durably for the retention period (24 hours by default, extendable).'],
    [3, 'Consumers read in order: a KCL app, a Lambda event source mapping, or an enhanced fan-out subscriber with its own dedicated throughput.'],
    [4, 'Firehose can also read the stream, buffering by size or time and optionally converting format.'],
    [5, 'Batches land in [[s3]] or [[opensearch]], ready for training sets or search.']
  ],
  gotchas: [
    '**Per-shard limits** cap ingest and read throughput. A hot partition key throttles one shard while others sit idle. Choose high-cardinality keys, or use on-demand capacity mode.',
    '**Shared read throughput.** Standard consumers share a shard\'s read capacity; many consumers need enhanced fan-out.',
    '**A slow consumer falls behind silently.** Alarm on iterator age; if lag exceeds retention, data is lost.',
    '**Ordering is per shard only**, and resharding changes which shard a key maps to.',
    'Firehose buffers, so delivery is near-real-time (seconds to minutes), not instant.'
  ],
  edges: [
    'Records are delivered at least once. Consumers must tolerate duplicates.',
    'Record size is limited; put big payloads in [[s3]] and send a pointer.',
    'A Lambda consumer that fails on one record retries the whole batch, blocking the shard unless you configure bisect-on-error and a failure destination.'
  ],
  ml: [
    'Stream user events into a feature pipeline for real-time features and drift detection.',
    'Capture inference requests and responses for monitoring, evaluation datasets, and audit.',
    'Continuously land clickstream and logs into the lake for periodic retraining.'
  ],
  pairs: ['lambda', 's3', 'opensearch', 'msk', 'sm-feature-store', 'glue'],
  cost: 'On-demand: per GB in/out. Provisioned: shard-hours plus PUT payload units. Firehose: per GB ingested plus conversion.'
});

S({
  id: 'msk', cat: 'streaming', name: 'Amazon MSK (Managed Kafka)', doc: 'msk/',
  tag: 'Apache Kafka as a managed service, for teams that need the Kafka API and ecosystem.',
  what: 'MSK runs Apache Kafka brokers for you in **provisioned** (standard or Express brokers) or **serverless** modes. Topics are split into **partitions**, replicated across brokers in different AZs, and consumed by **consumer groups**.\n\nChoose it over [[kinesis]] when you already have Kafka clients, need exactly its semantics, want Kafka Connect or Kafka Streams, or must keep portability.',
  flow: ['Producers', 'Topic partitions', 'Brokers (3 AZs)', 'Consumer group', 'Stream processing'],
  steps: [
    [0, 'Producers publish to a topic; the key (or round-robin) selects the partition.'],
    [1, 'Each partition is an append-only log with one leader and replicas.'],
    [2, 'Brokers in different AZs replicate; `acks=all` plus `min.insync.replicas` controls durability.'],
    [3, 'A consumer group divides partitions among members; offsets track progress.'],
    [4, 'Processors such as Flink, Kafka Streams or Lambda transform the stream onward.']
  ],
  gotchas: [
    '**Partition count is hard to reduce** and caps consumer parallelism. Plan it up front.',
    '**Consumer rebalances pause processing.** Sticky assignment and sensible session timeouts reduce churn.',
    '**Disk fills silently.** Retention and throughput determine storage; use tiered storage and alarms.',
    '**Cross-AZ replication and consumer traffic costs money.** Rack-aware consumers cut it.',
    'Client libraries and broker versions need to be kept compatible.'
  ],
  edges: [
    'IAM access control for Kafka needs a supporting client library; mixing auth modes is a common outage.',
    'Under-replicated partitions during a broker replacement degrade write availability if `min.insync.replicas` is strict.'
  ],
  ml: [
    'High-volume event backbone feeding real-time feature computation with Flink.',
    'Change-data-capture from operational databases to keep vector indexes and features fresh.',
    'Fan-out of model inference results to many downstream systems.'
  ],
  pairs: ['kinesis', 'lambda', 'opensearch', 's3', 'glue'],
  cost: 'Broker-hours plus storage and data transfer (provisioned), or cluster-hours and partition-hours plus data (serverless).'
});

S({
  id: 'sqs', cat: 'streaming', name: 'Amazon SQS', doc: 'AWSSimpleQueueService/latest/SQSDeveloperGuide/',
  tag: 'A durable queue that smooths bursts and decouples producers from slow workers.',
  what: 'SQS holds messages until a consumer processes and deletes them. **Standard** queues give near-unlimited throughput with at-least-once delivery and best-effort ordering. **FIFO** queues give ordering within a message group and exactly-once processing, at lower throughput.\n\nQueues are how you protect slow, expensive resources (GPUs, model endpoints) from traffic spikes: producers enqueue instantly, workers pull at their own pace.',
  flow: ['Producer', 'Queue', 'Consumer receives', 'Visibility timeout', 'Delete on success', 'Dead-letter queue'],
  steps: [
    [0, 'A producer sends a message (up to about 1 MiB; larger payloads go in S3 with a pointer).'],
    [1, 'SQS stores it redundantly across AZs.'],
    [2, 'A consumer long-polls and receives a message.'],
    [3, 'The message becomes invisible for the **visibility timeout** while the consumer works.'],
    [4, 'On success the consumer deletes it. If it crashes, the message reappears after the timeout.'],
    [5, 'After a set number of failed receives, the message moves to a **dead-letter queue** for inspection.']
  ],
  gotchas: [
    '**Visibility timeout shorter than processing time** causes duplicate processing: the message reappears while the first worker is still running. Extend it, or heartbeat.',
    '**Standard queues deliver duplicates and out of order.** Make handlers idempotent.',
    '**FIFO throughput is limited** (higher with batching and high-throughput mode). Use message groups wisely, since one slow group blocks only itself.',
    '**Poison messages** loop forever without a dead-letter queue and `maxReceiveCount`.',
    'Messages expire after the retention period (4 days by default, up to 14).'
  ],
  edges: [
    'For Lambda consumers, keep queue visibility timeout well above the function timeout, and mind batch-failure reporting.',
    'Queue depth and age of oldest message are the right autoscaling signals for workers.',
    'There is no built-in replay once a message is deleted.'
  ],
  ml: [
    'Buffer requests to GPU workers so spikes queue instead of failing.',
    'Work queue for document ingestion and embedding jobs.',
    'Asynchronous inference request pipeline with a results topic or table.'
  ],
  pairs: ['lambda', 'sns', 'ecs', 's3', 'eventbridge'],
  cost: 'Per million requests (each 64 KB chunk counts as one). Very cheap; batching and long polling reduce cost further.'
});

S({
  id: 'sns', cat: 'streaming', name: 'Amazon SNS', doc: 'sns/',
  tag: 'Publish/subscribe fan-out: one message delivered to many subscribers.',
  what: 'SNS lets a publisher send a message to a **topic**, and delivers copies to every subscriber: SQS queues, Lambda functions, HTTP endpoints, email, or mobile push. With **message filtering**, each subscriber receives only matching messages.\n\nThe classic pattern is **SNS to SQS fan-out**: durable, independent queues per consumer, so each downstream system processes at its own pace.',
  flow: ['Publisher', 'SNS topic', 'Filter policies', 'SQS / Lambda / HTTP', 'Subscribers'],
  steps: [
    [0, 'A publisher sends one message with attributes to a topic.'],
    [1, 'SNS stores and replicates it for delivery.'],
    [2, 'Each subscription\'s filter policy decides whether it receives this message.'],
    [3, 'SNS pushes a copy to each matching endpoint, retrying on failure.'],
    [4, 'Each subscriber processes independently; failures do not affect others.']
  ],
  gotchas: [
    '**No replay and no storage.** If a subscriber is down beyond retries and has no dead-letter queue, the message is lost. Subscribe SQS queues for durability.',
    '**Queue policy required.** An SQS queue must explicitly allow the topic to send, or messages vanish silently.',
    'Delivery is at-least-once; consumers must be idempotent.',
    'Standard topics do not guarantee order. FIFO topics do, with throughput limits.'
  ],
  edges: [
    'Message size is capped (a few hundred KB); send pointers to S3 objects.',
    'Filter policies match on message attributes by default; matching on the body needs the body-scope option.'
  ],
  ml: [
    'Broadcast "new model version approved" or "dataset updated" events to several pipelines.',
    'Send alerts from [[cloudwatch]] alarms (drift, latency, error rate) to people and automation.',
    'Fan out each inference result to logging, billing and analytics consumers.'
  ],
  pairs: ['sqs', 'lambda', 'eventbridge', 'cloudwatch'],
  cost: 'Per million publishes plus delivery charges by protocol; SQS and Lambda deliveries are cheap.'
});

S({
  id: 'eventbridge', cat: 'streaming', name: 'Amazon EventBridge', doc: 'eventbridge/',
  tag: 'A serverless event bus that routes events from AWS services, SaaS and your apps by rules.',
  what: 'EventBridge receives events (small JSON documents) on **event buses**, evaluates **rules** with pattern matching, and routes matches to **targets** such as Lambda, Step Functions, SQS, or API endpoints. Most AWS services already emit events to it, including state changes for SageMaker jobs and S3 object creation.\n\nIt also provides **Scheduler** (cron and one-time schedules at scale) and **Pipes** (point-to-point integration with optional filtering and enrichment).',
  flow: ['Event source', 'Event bus', 'Rule pattern match', 'Target', 'Retry / DLQ'],
  steps: [
    [0, 'A service or application emits an event, for example "training job completed".'],
    [1, 'The event arrives on a bus (default, custom, or partner).'],
    [2, 'Each rule\'s event pattern is evaluated against it.'],
    [3, 'For every matching rule, EventBridge invokes its targets, optionally transforming the input.'],
    [4, 'Failed deliveries are retried with backoff for a period, and can go to a dead-letter queue.']
  ],
  gotchas: [
    '**At-least-once delivery.** Duplicate events happen; targets must be idempotent.',
    '**Event patterns are exact and case-sensitive.** A typo yields a rule that never fires, with no error.',
    '**Retries are bounded.** After the retry window, an event without a DLQ is dropped.',
    'Event size is capped (a few hundred KB). Pass references, not payloads.'
  ],
  edges: [
    'Archive and replay let you re-send past events, which is powerful for backfills but can re-trigger side effects.',
    'Cross-account and cross-Region buses need resource policies on both ends.',
    'Throughput quotas exist per bus and per target; very high rates may need partitioning across buses.'
  ],
  ml: [
    'React to ML lifecycle events: model approved in the registry triggers a deployment pipeline.',
    'Schedule recurring retraining, evaluation and re-embedding with Scheduler.',
    'Decouple data arrival ([[s3]] events) from pipelines that process it.'
  ],
  pairs: ['stepfunctions', 'lambda', 's3', 'sqs', 'sm-pipelines'],
  cost: 'Per million events published to custom buses and to Pipes/Scheduler invocations. AWS service events to the default bus are free.'
});

S({
  id: 'stepfunctions', cat: 'streaming', name: 'AWS Step Functions', doc: 'step-functions/',
  tag: 'Visual workflows with retries, branching, parallelism and human approval built in.',
  what: 'Step Functions runs **state machines** defined in Amazon States Language. Each state can call a Lambda, start an ECS task, launch a SageMaker job, invoke a Bedrock model, or wait. **Standard** workflows run up to a year with exactly-once execution; **Express** workflows run up to five minutes at high volume with at-least-once execution.\n\nThe key advantage is that retries, error handling, timeouts, and the state between steps are handled for you, so your code stays simple.',
  flow: ['Start execution', 'Task state', 'Service integration', 'Choice / Map / Parallel', 'Wait / approval', 'End'],
  steps: [
    [0, 'An execution begins with a JSON input from an API call, [[eventbridge]] rule, or schedule.'],
    [1, 'The engine enters the first state and records it in the execution history.'],
    [2, 'A task calls a service directly (optimised integrations exist for [[sm-training]], [[batch]], [[bedrock]]) and can wait for completion (`.sync`).'],
    [3, '`Choice` branches on data, `Parallel` runs branches together, and `Map` fans out over a list (Distributed Map handles very large S3-sourced lists).'],
    [4, 'A task can pause with a **task token** until a human or system calls back, giving approval gates.'],
    [5, 'Success or failure is recorded; `Retry` and `Catch` rules handle errors along the way.']
  ],
  gotchas: [
    '**Payload limit per state transition** is small (hundreds of KB). Pass S3 references, not data.',
    '**Standard history is capped** (tens of thousands of events), so a loop of thousands of iterations needs child executions or Distributed Map.',
    '**Express is at-least-once**; do not put non-idempotent steps in it without care.',
    'Standard pricing is per state transition, so tight loops with many tiny states get expensive.'
  ],
  edges: [
    'Waiting for a callback holds the execution open (and billable only per transition), up to the maximum duration.',
    'Error names are matched by string; missing a specific retry can turn a transient error into a failure.',
    'Distributed Map concurrency can overwhelm downstream services; set a concurrency limit.'
  ],
  ml: [
    'Orchestrate an ML pipeline: prepare data, train, evaluate, branch on metric, approve, deploy.',
    'RAG ingestion: list S3 documents with Distributed Map, parse, chunk, embed, upsert vectors.',
    'LLM workflows with retries, fallbacks to a second model, and human review steps.'
  ],
  pairs: ['lambda', 'sm-training', 'batch', 'bedrock', 'eventbridge', 's3'],
  cost: 'Standard: per state transition. Express: per request and duration. Usually small compared with the work it triggers.'
});
