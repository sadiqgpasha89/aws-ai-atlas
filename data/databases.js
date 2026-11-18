S({
  id: 'dynamodb', cat: 'databases', name: 'Amazon DynamoDB', doc: 'dynamodb/',
  tag: 'Serverless key-value and document database with predictable single-digit-millisecond access.',
  what: 'DynamoDB stores items (up to 400 KB each) in tables, looked up by a **partition key** and optionally sorted by a **sort key**. It scales horizontally by splitting data into partitions, and you never manage servers. Capacity is either **on-demand** (pay per request) or **provisioned** (with autoscaling).\n\nIt is built for known access patterns at any scale. It is not built for ad-hoc queries or joins, so you design the table around the questions you will ask.',
  flow: ['Client request', 'Request router', 'Partition (by key hash)', 'Leader + replicas', 'Response', 'Stream / TTL'],
  steps: [
    [0, 'The client sends `GetItem`, `Query` or `PutItem` with a partition key.'],
    [1, 'A request router authenticates, checks capacity, and hashes the partition key.'],
    [2, 'The hash selects a partition. Throughput is limited per partition, so key distribution matters.'],
    [3, 'Writes go to the partition leader and replicate across AZs. Default reads are eventually consistent; you can request strongly consistent ones.'],
    [4, 'The item (or up to 1 MB of query results per page) is returned.'],
    [5, 'Changes can flow to **DynamoDB Streams** for triggers, and a **TTL** attribute expires old items.']
  ],
  gotchas: [
    '**Hot partitions.** A single key getting most traffic throttles even if the table has spare capacity. Use high-cardinality keys, or shard hot keys with a suffix.',
    '**400 KB item limit.** Store large payloads (documents, full transcripts) in [[s3]] and keep a pointer.',
    '**Queries are single-table-shaped.** A `Query` needs the partition key; anything else is a `Scan`, which reads everything and bills for it.',
    '**Global secondary indexes are eventually consistent** and have their own write capacity; an under-provisioned GSI can throttle the base table.',
    '**TTL deletion is lazy.** Expired items may remain for a while before removal (often under a couple of days), so filter on the TTL attribute in queries.'
  ],
  edges: [
    'Streams retain records for 24 hours; consumers that fall behind lose data.',
    'Transactions are limited in item count and cost double the capacity.',
    'Query and Scan responses cap at 1 MB; paginate with `LastEvaluatedKey`.',
    'Strongly consistent reads are not available on global secondary indexes or across Regions in global tables.'
  ],
  ml: [
    'Conversation and session state for chat apps and agents; checkpoint store for agent frameworks.',
    'Online feature serving: low-latency lookup of precomputed features at inference time.',
    'Idempotency keys, job status tracking, and rate-limit counters around expensive model calls.',
    'Index of prompt/response logs, with the large bodies in S3.'
  ],
  pairs: ['lambda', 's3', 'elasticache', 'kinesis', 'kms'],
  cost: 'On-demand: per read/write request unit. Provisioned: per capacity unit-hour. Plus storage, GSIs, streams, and backups. Cheap for key-value, costly if you scan.'
});

S({
  id: 'aurora', cat: 'databases', name: 'Aurora & RDS (pgvector)', doc: 'AmazonRDS/latest/AuroraUserGuide/',
  tag: 'Relational databases that double as vector stores when you add the pgvector extension.',
  what: 'RDS and Aurora run PostgreSQL, MySQL and others as managed services. **Aurora PostgreSQL** and RDS for PostgreSQL support the **pgvector** extension, which adds a `vector` column type and approximate nearest-neighbour indexes (HNSW and IVFFlat).\n\nThat lets you keep embeddings in the same transactional store as the rows they describe, so you can filter by tenant, join to metadata, and update atomically, using plain SQL.',
  flow: ['App / RAG service', 'SQL + vector query', 'HNSW index', 'Filter + join rows', 'Top-K results'],
  steps: [
    [0, 'Your app embeds the user question with an embedding model (see [[bedrock]]).'],
    [1, 'It runs SQL like `ORDER BY embedding <=> $1 LIMIT 10`, optionally with a `WHERE tenant_id = ...`.'],
    [2, 'The planner uses the HNSW index to find approximate nearest neighbours rather than scanning all rows.'],
    [3, 'Rows are filtered and joined with ordinary relational data (permissions, document metadata).'],
    [4, 'The top-K chunks return and are passed to the LLM as context.']
  ],
  gotchas: [
    '**Index build is memory-hungry** and slow on large tables. Size `maintenance_work_mem` and build the index after bulk loading.',
    '**Approximate means tunable recall.** Recall depends on index parameters and `ef_search`. Measure it against exact search on a sample.',
    '**Filters can starve results.** With a selective `WHERE`, an ANN index may return fewer than K rows. Newer pgvector versions offer iterative scans; also consider partitioning by tenant.',
    '**Dimension limits for indexing.** The standard vector type has an indexable-dimension cap; use half-precision types or a smaller embedding model for large dimensions.',
    'A vector index lives in memory for speed. Big corpora can outgrow a single instance.'
  ],
  edges: [
    'Changing embedding model means re-embedding everything and rebuilding the index.',
    'Aurora Serverless v2 scales compute in capacity units, but a cold, scaled-down instance has a cold buffer cache after scaling up.',
    'Bedrock Knowledge Bases can use Aurora PostgreSQL as its vector store, with a specific table schema it expects.'
  ],
  ml: [
    '"Good enough" RAG for most applications: one database for users, documents and vectors, with row-level security for access control.',
    'Hybrid search: combine `tsvector` full-text ranking with vector similarity in a single query.',
    'Aurora ML SQL functions can call SageMaker or Bedrock from inside queries.'
  ],
  pairs: ['bedrock-kb', 'opensearch', 'lambda', 'dynamodb', 'kms'],
  cost: 'Aurora: instance (or Serverless v2 capacity unit) hours, storage, I/O. Often the cheapest vector option if you already run Postgres.'
});

S({
  id: 'opensearch', cat: 'databases', name: 'Amazon OpenSearch Service', doc: 'opensearch-service/',
  tag: 'Search engine with vector and hybrid search: the workhorse for large-scale RAG retrieval.',
  what: 'OpenSearch indexes documents for full-text search, analytics, and (with the **k-NN** plugin) approximate vector search using HNSW graphs. You can run **managed clusters** or **OpenSearch Serverless**, which has a dedicated **vector search** collection type.\n\nIts strength for AI is **hybrid search**: combining keyword relevance (BM25) with vector similarity, and filtering, in one engine, at high concurrency.',
  flow: ['Documents + embeddings', 'Index (shards)', 'HNSW graph per segment', 'Query: BM25 + k-NN', 'Merged ranking'],
  steps: [
    [0, 'You index documents with a text field and an embedding field of fixed dimension.'],
    [1, 'Data is split into shards across nodes (or handled by the serverless layer).'],
    [2, 'Each segment builds an HNSW graph held largely in off-heap memory for fast traversal.'],
    [3, 'A query runs keyword scoring and vector search, optionally with filters and a search pipeline.'],
    [4, 'Scores are normalised and combined, and the top hits come back.']
  ],
  gotchas: [
    '**Memory is the cost driver.** HNSW graphs want to live in RAM; capacity planning is vectors × dimensions × overhead. Quantisation (byte, binary) and disk-based modes reduce it at some recall cost.',
    '**Mapping is hard to change.** Vector dimension and engine settings are fixed per field. A change means reindexing.',
    '**Near-real-time, not real-time.** New documents become searchable after a refresh interval, typically about a second.',
    '**Serverless has a baseline cost** from a minimum capacity, so it is not free when idle.',
    'Shard count is set at index creation; too many tiny shards or a few huge ones both hurt.'
  ],
  edges: [
    'Filtering strategy matters: pre-filter and post-filter give different recall and latency. Test with realistic filters.',
    'Cluster managed upgrades and blue/green deployments can briefly stress search latency.',
    'Dense vectors plus sparse (neural sparse) retrieval often beat either alone for domain-specific vocabulary.'
  ],
  ml: [
    'Production RAG retrieval at scale with metadata filters, multi-tenancy, and hybrid ranking.',
    'Backing vector store for [[bedrock-kb|Bedrock Knowledge Bases]].',
    'Log and trace analytics for LLM applications, alongside vector search over past conversations.'
  ],
  pairs: ['bedrock-kb', 's3-vectors', 'aurora', 'kinesis', 'lambda'],
  cost: 'Managed: instance hours plus storage. Serverless: OCU-hours for indexing and search. Memory-bound vector workloads drive size.'
});

S({
  id: 'elasticache', cat: 'databases', name: 'ElastiCache & MemoryDB', doc: 'AmazonElastiCache/latest/dg/',
  tag: 'In-memory data stores for sub-millisecond reads: caches, session state and semantic caches.',
  what: '**ElastiCache** is a managed in-memory cache (Valkey, Redis OSS, or Memcached) with an optional serverless mode. **MemoryDB** is a Redis-compatible in-memory database with a **durable** multi-AZ transaction log, so it can be a primary store rather than only a cache.\n\nBoth keep data in RAM for microsecond to low-millisecond latency, and vector search is available on supported engines, enabling **semantic caching** of LLM answers.',
  flow: ['App', 'Cache lookup (exact / vector)', 'Hit: return', 'Miss: call model', 'Store result + TTL'],
  steps: [
    [0, 'The app receives a prompt and computes its embedding, or hashes the exact prompt.'],
    [1, 'It queries the cache: an exact key lookup, or a vector similarity search for semantically similar earlier prompts.'],
    [2, 'On a close-enough hit, the stored answer returns in milliseconds with no model cost.'],
    [3, 'On a miss, the app calls [[bedrock]] or a model endpoint.'],
    [4, 'The answer is stored with a TTL so future similar prompts hit the cache.']
  ],
  gotchas: [
    '**ElastiCache is a cache, not a database.** Failover or node loss can drop data; design so everything is rebuildable.',
    '**Semantic caching can return wrong answers.** A similarity threshold that is too loose serves an answer to a different question. Tune it, scope the cache by tenant and context, and never cache personalised responses globally.',
    '**VPC only.** There is no public endpoint; clients must be inside or peered to the VPC.',
    '**Memory is the budget.** Large keys, large values and unbounded growth lead to evictions or out-of-memory errors; pick an eviction policy on purpose.'
  ],
  edges: [
    'MemoryDB costs more than ElastiCache because it persists every write across AZs.',
    'Vector search capabilities and limits vary by engine and version; check what your cluster supports before designing.',
    'Cluster-mode sharding changes multi-key operations: keys used together must hash to the same slot.'
  ],
  ml: [
    '**Semantic cache** in front of LLM calls to cut cost and latency on repeated questions.',
    'Hot feature store for inference-time lookups, and session or conversation memory.',
    'Rate limiting and token-bucket counters protecting model endpoints from abuse.'
  ],
  pairs: ['bedrock', 'dynamodb', 'lambda', 'sm-feature-store'],
  cost: 'Node-hours (or serverless data-stored and compute units). MemoryDB adds durability cost. Often saves more on model spend than it costs.'
});

S({
  id: 'neptune', cat: 'databases', name: 'Amazon Neptune & Neptune Analytics', doc: 'neptune/',
  tag: 'Graph database and graph analytics engine: the backbone of GraphRAG and knowledge graphs.',
  what: '**Neptune** is a managed graph database for highly connected data, queryable with openCypher, Gremlin or SPARQL. **Neptune Analytics** is a separate in-memory engine for graph algorithms and **vector search** over graphs.\n\nGraphs help when the answer requires following relationships (who reports to whom, which component depends on which), exactly where pure vector similarity struggles. **GraphRAG** combines both: retrieve by similarity, then expand along edges.',
  flow: ['Documents', 'Entity + relation extraction', 'Graph with embeddings', 'Vector entry point', 'Traverse edges', 'Context to LLM'],
  steps: [
    [0, 'Source documents are chunked and processed.'],
    [1, 'An LLM or extraction pipeline identifies entities and relationships.'],
    [2, 'Nodes, edges and embeddings are loaded into Neptune Analytics (bulk load from [[s3]]).'],
    [3, 'A user question is embedded and used to find the nearest nodes or chunks.'],
    [4, 'The graph is traversed a few hops to collect connected facts.'],
    [5, 'The assembled sub-graph and text go to the LLM as grounded context.']
  ],
  gotchas: [
    '**Neptune and Neptune Analytics are different engines** with different data loading, sizing and query surfaces. Pick deliberately.',
    '**Graph quality is the whole game.** Poor entity extraction produces a noisy graph that makes answers worse than plain vector search.',
    'Neptune Analytics keeps the graph in memory, so graph size determines the capacity you provision.',
    'Query language choice affects tooling; openCypher is the most portable for GraphRAG.'
  ],
  edges: [
    'Unbounded traversals explode on dense graphs. Always limit hop depth and fan-out.',
    'Keeping the graph in sync with changing source documents needs an incremental update pipeline.'
  ],
  ml: [
    'GraphRAG through [[bedrock-kb|Bedrock Knowledge Bases]], which can use Neptune Analytics as its store.',
    'Fraud rings, recommendation and entity resolution, where the signal is in connectivity.',
    'Enterprise knowledge graphs that give agents precise relational answers.'
  ],
  pairs: ['bedrock-kb', 's3', 'opensearch', 'bedrock'],
  cost: 'Neptune: instance hours, storage, I/O. Neptune Analytics: provisioned memory capacity hours.'
});
