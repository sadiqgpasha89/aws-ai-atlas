S({
  id: 'glue', cat: 'analytics', name: 'AWS Glue', doc: 'glue/',
  tag: 'Serverless ETL plus the Data Catalog that every analytics service on AWS shares.',
  what: 'Glue has two halves. The **Data Catalog** is a central metadata store (databases, tables, schemas, partitions) that Athena, EMR, Redshift Spectrum and SageMaker all read. **Glue ETL** runs Spark (and Python or Ray) jobs on serverless workers to clean, join and reshape data.\n\nIn an ML pipeline Glue is typically the "raw to training-ready" step: convert messy files into partitioned Parquet or Iceberg tables.',
  flow: ['Raw data in S3', 'Crawler / catalog', 'Glue ETL job', 'Spark workers', 'Clean Parquet / Iceberg', 'Catalog updated'],
  steps: [
    [0, 'Raw files (CSV, JSON, logs) land in [[s3]].'],
    [1, 'A crawler or explicit DDL registers the schema in the Data Catalog.'],
    [2, 'A job script (visual or code) reads the table through the catalog.'],
    [3, 'Glue allocates workers (DPUs), runs the Spark transformation and shuffles data as needed.'],
    [4, 'Output is written as partitioned columnar files or an Iceberg table.'],
    [5, 'The catalog is updated so [[athena]], [[emr]] and [[sm-training]] can use the new table immediately.']
  ],
  gotchas: [
    '**Crawlers guess.** Schema inference can flip types between runs and create surprising tables. For important data, define schemas explicitly.',
    '**Small-files output.** Too many partitions or too many workers writing yields thousands of tiny files that slow every later query. Repartition before writing.',
    '**Job bookmarks** track processed data but are easy to misuse; reprocessing and backfills need deliberate handling.',
    'Spark job startup takes tens of seconds, so Glue suits batch, not interactive work.'
  ],
  edges: [
    'Glue Flex execution is cheaper but may start later, which is fine for non-urgent nightly jobs.',
    'Data Catalog permissions interact with [[lakeformation]]; with Lake Formation enabled, the job role needs the matching grants.',
    'Glue Data Quality rules can fail a job before bad data reaches training.'
  ],
  ml: [
    'Build training datasets: deduplicate, join labels, filter PII, write Parquet.',
    'Document preprocessing for RAG: parse, chunk and normalise at scale before embedding.',
    'Data-quality gates in front of [[sm-pipelines]] so a bad batch does not retrain the model.'
  ],
  pairs: ['s3', 'athena', 'lakeformation', 'emr', 'stepfunctions', 'sm-pipelines'],
  cost: 'DPU-hours for jobs and crawlers (billed per second with a minimum), plus a small charge for catalog objects beyond a free tier.'
});

S({
  id: 'athena', cat: 'analytics', name: 'Amazon Athena', doc: 'athena/',
  tag: 'Serverless SQL directly over files in S3: pay per data scanned, no cluster to run.',
  what: 'Athena runs SQL (Trino/Presto engine) against data in S3, using table definitions from the Glue Data Catalog. There is nothing to provision. You pay for the data each query scans, so **columnar formats and partitioning** (which cut scanned bytes) directly cut cost and runtime.\n\nIt also queries Apache Iceberg tables and, through federated connectors, other data sources.',
  flow: ['SQL query', 'Catalog lookup', 'Plan + partition prune', 'Parallel S3 scan', 'Results to S3'],
  steps: [
    [0, 'You submit SQL from the console, API, or a notebook.'],
    [1, 'Athena fetches the table schema and partitions from the Glue Data Catalog.'],
    [2, 'The planner prunes partitions and column projections to read as little as possible.'],
    [3, 'Many workers scan the remaining Parquet/ORC (or text) objects in [[s3]] in parallel.'],
    [4, 'Results are written as a file in S3 and returned to the client.']
  ],
  gotchas: [
    '**Cost is bytes scanned.** `SELECT *` over CSV is the expensive default. Use Parquet, project only needed columns, and partition by common filters.',
    '**Many small files are slow** because each is a separate S3 request. Compact with `CTAS`/`OPTIMIZE` (on Iceberg).',
    '**Not low-latency.** Queries take seconds, with limits on concurrent queries and a query timeout. It is analytic, not for serving an app.',
    'Use workgroups with per-query and per-workgroup scan limits to stop accidental terabyte scans.'
  ],
  edges: [
    'Partition projection avoids catalog partition listing for tables with huge partition counts.',
    'Results location needs its own S3 prefix and lifecycle; old results accumulate.',
    'Row- and column-level security comes from [[lakeformation]] on integrated paths.'
  ],
  ml: [
    'Explore and profile training data without standing up infrastructure.',
    'Analyse LLM logs (prompts, latencies, token counts) stored as Parquet to find cost and quality outliers.',
    'Evaluation analytics: join model outputs to ground truth and slice metrics by cohort.'
  ],
  pairs: ['s3', 'glue', 'lakeformation', 'redshift'],
  cost: 'Per TB scanned (with a minimum per query), or provisioned capacity for predictable workloads. Parquet plus partitioning commonly cuts cost by an order of magnitude.'
});

S({
  id: 'emr', cat: 'analytics', name: 'Amazon EMR', doc: 'emr/',
  tag: 'Managed Spark, Hadoop and Flink for big-data processing when you need engine-level control.',
  what: 'EMR runs open-source big-data frameworks (Spark, Hive, Flink, Trino and more) on three deployment models: **EMR on EC2** (clusters you configure), **EMR on EKS** (jobs on your Kubernetes cluster), and **EMR Serverless** (submit jobs, no cluster).\n\nChoose it over [[glue]] when you need custom Spark tuning, specific library versions, long-running clusters, or frameworks Glue does not offer.',
  flow: ['Submit Spark job', 'Cluster / serverless app', 'Driver', 'Executors on workers', 'Shuffle + compute', 'Output to S3'],
  steps: [
    [0, 'You submit a Spark application to a cluster, an EKS virtual cluster, or an EMR Serverless application.'],
    [1, 'Capacity is provided: a running cluster, or serverless workers started on demand.'],
    [2, 'The driver plans the job as stages of tasks.'],
    [3, 'Executors on worker nodes read input splits from [[s3]].'],
    [4, 'Wide operations (joins, groupBy) shuffle data between executors, spilling to local disk if memory runs out.'],
    [5, 'Results are written back to S3 and the cluster scales down or terminates.']
  ],
  gotchas: [
    '**Shuffle is the bottleneck.** Skewed keys and too few or too many partitions dominate runtime; most tuning is here.',
    '**Spot is great for task nodes, risky for core nodes** that hold HDFS data. Keep durable data in S3.',
    '**Cluster start-up takes minutes** on EC2; use EMR Serverless (with pre-initialised capacity if needed) for spiky workloads.',
    'Long-lived clusters accumulate drift and cost; prefer transient clusters per job.'
  ],
  edges: [
    'Executor memory overhead and container limits cause mysterious `OOMKilled`/YARN kills. Leave headroom.',
    'Choosing EMR versions pins Spark and library versions; test upgrades.',
    'Network between EMR and VPC endpoints for S3 and Glue matters in private subnets.'
  ],
  ml: [
    'Large-scale feature engineering and Spark MLlib training on terabytes.',
    'Distributed embedding generation with Spark plus GPU nodes, or Ray on EKS.',
    'Heavy data prep that exceeds Glue\'s sweet spot or needs custom libraries.'
  ],
  pairs: ['s3', 'glue', 'eks', 'lakeformation', 'sm-training'],
  cost: 'EC2 instance hours plus an EMR surcharge, or vCPU/memory-seconds for Serverless. Transient clusters on Spot are the cheap path.'
});

S({
  id: 'redshift', cat: 'analytics', name: 'Amazon Redshift', doc: 'redshift/',
  tag: 'Columnar data warehouse for fast SQL at scale, with ML and GenAI callable from SQL.',
  what: 'Redshift is a massively parallel, columnar warehouse. You can run **provisioned** clusters or **Redshift Serverless** (billed in RPUs). It excels at repeated, complex analytical SQL over curated, structured data and integrates with the S3 lake through Spectrum and zero-ETL replication from operational databases.\n\n**Redshift ML** lets analysts create and call models with SQL (training is delegated to SageMaker), and recent features let SQL invoke foundation models.',
  flow: ['SQL client', 'Leader node', 'Compute slices', 'Columnar scan', 'Aggregated result'],
  steps: [
    [0, 'An analyst or BI tool sends SQL.'],
    [1, 'The leader node parses, optimises and compiles a distributed plan.'],
    [2, 'Work fans out to compute slices, each owning part of the data.'],
    [3, 'Slices scan compressed columnar blocks, using sort keys and zone maps to skip data.'],
    [4, 'Partial results are aggregated and returned.']
  ],
  gotchas: [
    '**Table design matters.** Distribution and sort keys (or automatic table optimisation) determine join and scan performance.',
    '**It is not for single-row OLTP.** Frequent tiny updates perform badly; batch loads with `COPY` from S3.',
    '**Serverless can surprise on cost** if a runaway query keeps scaling. Set usage limits.',
    'Concurrency scaling and queues need tuning for mixed dashboards and heavy ETL.'
  ],
  edges: [
    'Redshift ML trains outside the warehouse, so data is exported to S3 for SageMaker, which has cost and governance implications.',
    'Spectrum queries over S3 are priced per data scanned and are slower than local tables.',
    'Zero-ETL integrations have their own latency and schema-change behaviours.'
  ],
  ml: [
    'Curated feature tables and training sets that analysts and ML engineers share.',
    'In-database batch scoring via Redshift ML, for teams that live in SQL.',
    'Business-metric evaluation: join model outputs with revenue or conversion data.'
  ],
  pairs: ['s3', 'glue', 'athena', 'sm-training', 'lakeformation'],
  cost: 'Provisioned: node-hours. Serverless: RPU-seconds while queries run. Managed storage billed per GB.'
});

S({
  id: 'lakeformation', cat: 'analytics', name: 'AWS Lake Formation', doc: 'lake-formation/',
  tag: 'Fine-grained access control and sharing for data lakes: who may see which tables, columns and rows.',
  what: 'Lake Formation adds a **database-style permission model** (grant SELECT on a table, column or row filter) on top of data in S3 registered in the Glue Data Catalog. When an integrated engine such as Athena, EMR, Redshift Spectrum or Glue reads data, it asks Lake Formation, which vends temporary, scoped credentials.\n\nIt also supports tag-based access control and cross-account sharing.',
  flow: ['Principal asks for data', 'Engine (Athena etc.)', 'Lake Formation check', 'Scoped credentials', 'Filtered data returned'],
  steps: [
    [0, 'A user or role queries a table.'],
    [1, 'The integrated engine resolves the table in the Data Catalog.'],
    [2, 'Lake Formation checks grants: table, column, row filter, and LF-tags.'],
    [3, 'If allowed, it vends short-lived credentials limited to the permitted data.'],
    [4, 'The engine reads only permitted columns and rows; denied columns never leave storage.']
  ],
  gotchas: [
    '**Two permission systems.** IAM and Lake Formation must both allow access. Many "access denied" errors are a missing Lake Formation grant, not an IAM problem.',
    '**It only protects integrated paths.** If a role can read the S3 objects directly (through a permissive bucket policy or IAM), Lake Formation is bypassed. Lock the underlying S3 locations.',
    'Cell- and column-level controls apply to supported engines and formats; check support for your engine version.',
    'Hybrid access mode exists for migrating gradually, but mixed modes confuse debugging.'
  ],
  edges: [
    'Cross-account sharing uses resource links and needs grants on both sides.',
    'Registering an S3 location changes which role is used to access it.'
  ],
  ml: [
    'Control exactly which datasets and columns (for example PII) a training team or pipeline may read.',
    'Share vetted training and evaluation data across accounts without copying it.',
    'Audit which models were trained on which governed tables, together with [[cloudtrail]].'
  ],
  pairs: ['glue', 'athena', 'emr', 'redshift', 's3', 'macie'],
  cost: 'No additional charge for Lake Formation itself; you pay for the underlying services and Data Catalog usage.'
});
