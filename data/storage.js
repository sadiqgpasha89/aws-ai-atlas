S({
  id: 's3', cat: 'storage', name: 'Amazon S3', doc: 's3/',
  tag: 'Object storage. The system of record for datasets, checkpoints, models and embeddings.',
  what: 'S3 stores objects (a blob plus metadata) in **buckets**, addressed by key. It is effectively unlimited, highly durable, and strongly consistent: after a successful write, any read sees it. Objects can be up to 5 TB, uploaded in parts.\n\nAlmost every other AI service on AWS reads from or writes to S3, which is why most architectures treat it as the centre of gravity: training data in, checkpoints and model artifacts out, documents for RAG in.',
  flow: ['Client / job', 'S3 endpoint', 'Index of keys', 'Storage class', 'Replicas across AZs', 'Event notification'],
  steps: [
    [0, 'A client calls `PutObject` (or a multipart upload for big files) with a bucket, key and optional metadata or tags.'],
    [1, 'The request is authenticated and authorised: IAM policy, bucket policy, access points, and any VPC endpoint policy must all allow it.'],
    [2, 'S3 updates its key index. Keys are a flat namespace; "folders" are just a `/` convention in the key.'],
    [3, 'Data lands in the chosen **storage class** (Standard, Intelligent-Tiering, Standard-IA, Glacier tiers) and lifecycle rules may move it later.'],
    [4, 'Data is stored redundantly across multiple Availability Zones before the write is acknowledged.'],
    [5, 'An event (to [[eventbridge]], [[sqs]], [[sns]] or [[lambda]]) can fire, starting downstream processing such as an embedding pipeline.']
  ],
  gotchas: [
    '**The small-files problem.** Millions of tiny objects make training input slow (per-request latency dominates) and costly (per-request pricing). Pack into larger shards like WebDataset, TFRecord or Parquet.',
    '**There is no rename or atomic directory move.** "Renaming" is copy then delete. Do not treat S3 like a file system.',
    '**Request rates are per prefix** (thousands of requests per second each). Hot prefixes see `503 SlowDown`; spread keys and retry with backoff.',
    'Infrequent-access classes have a minimum billable object size and minimum storage duration. Small or short-lived objects can cost more there.',
    'Versioning keeps every overwrite and delete marker, which silently inflates the bill unless lifecycle rules expire old versions.'
  ],
  edges: [
    'Cross-Region reads incur transfer charges and latency; same-Region reads from EC2 are free of transfer fees. Use a **gateway VPC endpoint** so traffic skips NAT charges.',
    'Listing very large buckets is slow. Use S3 Inventory or maintain a manifest instead of `ListObjects` in a hot path.',
    'Event notifications are at-least-once and unordered; consumers must be idempotent.',
    'Glacier retrievals take minutes to hours, so a training job pointed at archived data will just wait.'
  ],
  ml: [
    'Data lake and training corpus. Store Parquet or sharded records; use Mountpoint for S3 or the S3 connector for PyTorch to stream.',
    'Checkpoint and model artifact store, with a lifecycle rule to expire stale checkpoints.',
    'Document store for RAG: an upload triggers ingestion into a [[bedrock-kb|Bedrock Knowledge Base]].',
    'Batch inference input and output location for [[bedrock]] and [[sm-inference|SageMaker batch transform]].'
  ],
  pairs: ['s3-express', 'fsx-lustre', 'glue', 'athena', 'bedrock-kb', 'sm-training', 'kms'],
  cost: 'Storage per GB-month by class, plus requests, plus data transfer out. Intelligent-Tiering is a safe default when access patterns are unknown.'
});

S({
  id: 's3-express', cat: 'storage', name: 'S3 Express One Zone', doc: 'AmazonS3/latest/userguide/s3-express-one-zone.html',
  tag: 'Single-AZ S3 with single-digit-millisecond latency, for hot training and checkpoint data.',
  what: 'Express One Zone is an S3 storage class that keeps data in **one** Availability Zone in a special **directory bucket**, trading multi-AZ resilience for much lower latency and cheaper requests. You place it in the same AZ as your compute.\n\nIt exists because GPUs are expensive: if a training job waits on S3 round trips, you pay GPU rates for idle time.',
  flow: ['Compute in AZ-a', 'Session auth', 'Directory bucket (AZ-a)', 'Hot data', 'Copy to S3 Standard'],
  steps: [
    [0, 'Your training nodes run in a specific AZ. You create the directory bucket in that same AZ.'],
    [1, 'The SDK creates a short-lived **session** token once and reuses it, avoiding per-request authorisation overhead.'],
    [2, 'Requests go to the zonal endpoint and are served from within the AZ at consistently low latency.'],
    [3, 'Shards and frequent checkpoints are read and written at high request rates.'],
    [4, 'Durable results are copied to [[s3]] Standard so they survive losing that AZ.']
  ],
  gotchas: [
    '**Single AZ means single-AZ failure domain.** Treat it as a cache or scratch tier, not the system of record.',
    '**Directory buckets are a different bucket type.** Naming, some APIs, and features (such as versioning and many lifecycle options) differ from general-purpose buckets.',
    'Per-GB storage is pricier than Standard; you save on requests and GPU idle time, not on capacity.',
    'Compute in a different AZ pays cross-AZ latency and charges, which cancels the benefit.'
  ],
  edges: [
    'AZ names differ across accounts; use AZ **IDs** (like `use1-az4`) to colocate reliably.',
    'Tools that assume general-purpose bucket semantics may need updates to support directory buckets.'
  ],
  ml: [
    'Hot training data tier, when profiling shows data-loading stalls with standard S3.',
    'Frequent checkpointing for large runs, where checkpoint write time directly stalls training.',
    'Feature or embedding files read repeatedly by many workers in one AZ.'
  ],
  pairs: ['s3', 'fsx-lustre', 'ec2', 'sm-training'],
  cost: 'Higher storage price per GB, substantially lower request charges. Pays off for request-heavy, short-lived hot data.'
});

S({
  id: 's3-vectors', cat: 'storage', name: 'Amazon S3 Vectors', doc: 'AmazonS3/latest/userguide/s3-vectors.html',
  tag: 'Vector storage built into S3: low-cost similarity search over very large embedding sets.',
  what: 'S3 Vectors adds **vector buckets** and **vector indexes** to S3. You put embeddings (with optional metadata) into an index and run nearest-neighbour queries against it, without provisioning servers.\n\nIt targets a different point on the cost-latency curve than [[opensearch]] or [[aurora]]: very large, infrequently or moderately queried collections where storage cost dominates, rather than high-QPS, tens-of-milliseconds search.',
  flow: ['Embedding model', 'Vector index', 'Metadata filter', 'Similarity search', 'Top-K matches'],
  steps: [
    [0, 'An embedding model (for example from [[bedrock]]) turns documents into vectors of a fixed dimension.'],
    [1, 'You write vectors and metadata to an index in a vector bucket. Writes are strongly consistent.'],
    [2, 'A query supplies a vector plus an optional metadata filter such as tenant or document type.'],
    [3, 'The service searches the index for the nearest vectors under the chosen distance metric.'],
    [4, 'You receive the top-K keys, distances and metadata, then fetch the underlying text from [[s3]] or a database.']
  ],
  gotchas: [
    '**Dimension and distance metric are fixed per index.** Changing embedding model means creating a new index and re-embedding.',
    '**Not a low-latency, high-QPS engine.** If you need consistently very low latency or heavy concurrent search, use [[opensearch]] or a database vector index.',
    'Metadata filter and result-size limits apply; check current quotas before designing around large filters or deep top-K.',
    'Like other vector stores, it holds vectors and metadata; keep the source text elsewhere and join by key.'
  ],
  edges: [
    'Cold, rarely-queried indexes are the sweet spot; tiering hot data into OpenSearch while keeping the long tail here is a common pattern.',
    'Embeddings can leak information about source text. Apply the same access control and encryption you would to the documents.'
  ],
  ml: [
    'Cheap vector backend for [[bedrock-kb|Knowledge Bases]] over very large document sets.',
    'Archive tier for old embeddings, with a hot subset in a faster engine.',
    'Semantic dedup and similarity analysis over billions of items in batch.'
  ],
  pairs: ['s3', 'bedrock-kb', 'opensearch', 'aurora', 'bedrock'],
  cost: 'Pay for stored vectors, PUT operations and queries. Designed to be far cheaper at rest than memory-resident vector databases.'
});

S({
  id: 'ebs', cat: 'storage', name: 'Amazon EBS', doc: 'ebs/',
  tag: 'Network-attached block volumes for instances: boot disks, scratch space and databases.',
  what: 'EBS provides persistent block devices that attach to an EC2 instance in the **same Availability Zone**. Volume types trade price against IOPS and throughput: `gp3` is the general default, `io2 Block Express` is for the most demanding workloads.\n\nSnapshots are incremental backups stored in S3 and can seed new volumes in other AZs.',
  flow: ['Create volume (AZ-a)', 'Attach to instance', 'Format + mount', 'Read / write', 'Snapshot to S3'],
  steps: [
    [0, 'You create a volume of a chosen type, size and provisioned performance, in one AZ.'],
    [1, 'It is attached to an instance over the network and appears as a device.'],
    [2, 'The OS formats it and mounts it like a local disk.'],
    [3, 'Reads and writes flow to replicated storage within the AZ.'],
    [4, 'A snapshot captures changed blocks to [[s3]]; new volumes can be restored from it anywhere in the Region.']
  ],
  gotchas: [
    '**AZ-bound.** A volume cannot attach across AZs; move data via snapshot.',
    '**Restored volumes load lazily from S3.** First reads of each block are slow, which hurts a freshly restored model-weights volume. Fast Snapshot Restore avoids it at extra cost.',
    'Instance-level EBS bandwidth caps apply regardless of what the volume can do. The instance can be the bottleneck.',
    'Orphaned volumes keep billing after instances are terminated unless "delete on termination" is set.'
  ],
  edges: [
    'Multi-Attach is limited to specific volume types and needs a cluster-aware file system.',
    'Resizing is online, but you must then grow the file system, and you can only modify a volume periodically.'
  ],
  ml: [
    'Root volumes and AMIs for GPU nodes; extra volume for datasets that need local-disk semantics.',
    'Caching model weights on a volume restored from a snapshot, for faster inference node start.',
    'Backing store for self-managed databases like a vector DB on EC2.'
  ],
  pairs: ['ec2', 's3', 'efs', 'kms'],
  cost: 'Per GB-month provisioned plus provisioned IOPS/throughput beyond baselines, plus snapshot storage.'
});

S({
  id: 'efs', cat: 'storage', name: 'Amazon EFS', doc: 'efs/',
  tag: 'Shared, elastic NFS file system that many instances, containers and Lambdas can mount at once.',
  what: 'EFS is a managed NFS file system that grows and shrinks automatically and spans multiple AZs. Many clients mount the same file system concurrently, which makes it ideal for shared code, notebooks, and model weights that many pods need.\n\nIt is slower than local disk and far more expensive per GB than S3, so it is for data that genuinely needs shared POSIX access.',
  flow: ['Mount target (per AZ)', 'NFS client', 'EFS file system', 'Elastic throughput', 'Shared by many'],
  steps: [
    [0, 'You create a file system and a mount target in each AZ you use, secured by a security group.'],
    [1, 'Instances, ECS tasks, EKS pods or Lambda functions mount it over NFS 4.1.'],
    [2, 'Files are stored redundantly across AZs; capacity is whatever you write.'],
    [3, 'Throughput scales with demand in Elastic mode, or you choose Provisioned or Bursting.'],
    [4, 'All clients see the same files with close-to-open consistency.']
  ],
  gotchas: [
    '**Latency per operation is higher than local disk.** Workloads with many small file operations (like unpacking Python environments) can be slow.',
    '**Throughput mode matters.** Bursting mode on a small file system can throttle; Elastic mode removes most of that at a price per GB transferred.',
    'Cost per GB-month is many times that of S3; do not park datasets here.',
    'Security group must allow NFS (TCP 2049) from clients to the mount target.'
  ],
  edges: [
    'Lambda can mount EFS, which is the practical way to load models larger than Lambda\'s package limits.',
    'Close-to-open consistency means a reader may not see another client\'s write until the file is reopened.'
  ],
  ml: [
    'Shared model-weights directory for an inference fleet, so new pods do not each download tens of GB.',
    'Shared home directories and code for notebooks and research clusters.',
    'Loading a mid-sized model into a Lambda function from an EFS mount.'
  ],
  pairs: ['lambda', 'eks', 'ecs', 's3', 'fsx-lustre'],
  cost: 'Per GB-month by storage class (Standard, Infrequent Access, Archive) plus throughput charges in Elastic or Provisioned modes.'
});

S({
  id: 'fsx-lustre', cat: 'storage', name: 'Amazon FSx for Lustre', doc: 'fsx/',
  tag: 'High-performance parallel file system that feeds many GPUs from S3 at very high throughput.',
  what: 'Lustre is the parallel file system used in supercomputing. FSx for Lustre runs it as a managed service with sub-millisecond latency and throughput that scales with capacity. It can be **linked to an S3 bucket**: files appear as the bucket\'s objects, load on first access, and results can be exported back.\n\nUse it when many nodes need the same large dataset fast and S3 request overhead would starve the GPUs.',
  flow: ['S3 bucket', 'Data repository link', 'Lustre file system', 'Lustre client', 'GPU nodes', 'Export to S3'],
  steps: [
    [0, 'Your dataset lives in [[s3]], the durable source of truth.'],
    [1, 'You link the bucket to the file system; metadata is imported so files show up immediately.'],
    [2, 'The file system is striped across many storage servers for aggregate throughput.'],
    [3, 'Each compute node installs the Lustre client and mounts it as a normal POSIX path.'],
    [4, 'On first read, file contents are fetched lazily from S3; subsequent reads hit fast storage and many nodes read in parallel.'],
    [5, 'Checkpoints and outputs are written locally, then exported back to S3 for durability.']
  ],
  gotchas: [
    '**First read is slow** because data hydrates from S3 lazily. Pre-load (for example with a `lfs` hsm restore or a read pass) before an expensive run.',
    '**Scratch vs persistent deployment.** Scratch is cheaper but loses data if a server fails; use it only for re-creatable data.',
    '**Single AZ.** Compute in other AZs pays latency and charges.',
    'Throughput is tied to provisioned capacity; a small file system can be slower than you expect.'
  ],
  edges: [
    'Capacity can be increased but not decreased, so oversizing is sticky.',
    'Sync to S3 is not instantaneous. Wait for the export task before tearing the file system down.',
    'Needs the Lustre client at a compatible kernel version on the instances.'
  ],
  ml: [
    'Shared training dataset for large distributed jobs on [[ec2]], [[eks]] or [[hyperpod]].',
    'Checkpoint staging area that absorbs bursty writes.',
    'Used natively by [[sm-training]] as an input channel for high-throughput data access.'
  ],
  pairs: ['s3', 'ec2', 'hyperpod', 'eks', 'sm-training'],
  cost: 'Per GB-month provisioned, with different rates by deployment type and throughput tier. Delete scratch file systems when a job is done.'
});
