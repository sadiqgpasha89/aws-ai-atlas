S({
  id: 'sm-studio', cat: 'ml', name: 'SageMaker Studio & Unified Studio', doc: 'sagemaker/',
  tag: 'The browser IDE and workspace where ML teams explore data, run notebooks and manage the lifecycle.',
  what: 'Studio is a web IDE (JupyterLab, Code Editor, optional RStudio) organised into a **domain** with user profiles and **spaces**. Each space runs on an instance you choose. Compute for notebooks is separate from training and endpoints, so you can develop on a small instance and launch big jobs from it.\n\n**SageMaker Unified Studio** is the broader workspace that brings data engineering, analytics, ML and GenAI into shared **projects**, with a common catalogue and governance.',
  flow: ['Sign in to domain', 'Space (IDE on instance)', 'Notebook / script', 'Launch jobs', 'Artifacts in S3 + registry'],
  steps: [
    [0, 'A user signs in through IAM Identity Center or IAM to the SageMaker domain.'],
    [1, 'They start a **space** on a chosen instance type; their home directory is persistent storage mounted to it.'],
    [2, 'They write code in a notebook or editor, reading data from [[s3]] or the catalogue.'],
    [3, 'From code they launch [[sm-training|training]], processing, tuning, or [[sm-pipelines|pipelines]] on separate managed compute.'],
    [4, 'Outputs land in S3 and the model registry, while the IDE instance can be stopped.']
  ],
  gotchas: [
    '**Idle apps keep billing.** A forgotten GPU notebook instance can cost more than the project. Configure idle shutdown for spaces.',
    '**VPC-only mode needs plumbing.** Without NAT or VPC endpoints for S3, SageMaker APIs and ECR, notebooks cannot pip install or reach AWS services.',
    '**Roles are layered.** The domain execution role, the space role and the job execution role may differ. Permission errors usually mean the wrong one.',
    'Home-directory storage is per user and persists, so it grows silently and costs money.'
  ],
  edges: [
    'Different instance types for the IDE and for jobs is intended. Do not train on the notebook instance.',
    'Lifecycle configurations run at start-up and can break the app if they fail or take too long.',
    'Unified Studio projects bring their own IAM and governance model on top of domain roles.'
  ],
  ml: [
    'Collaborative workspace for data scientists, with controlled access to data and compute.',
    'Standardise environments across a team with shared images and lifecycle scripts.',
    'Entry point to experiment tracking (managed MLflow) and the model registry.'
  ],
  pairs: ['sm-training', 'sm-pipelines', 'sm-jumpstart', 's3', 'iam', 'glue'],
  cost: 'Studio itself is free; you pay for the instances behind spaces, home storage, and any jobs or endpoints you launch.'
});

S({
  id: 'sm-training', cat: 'ml', name: 'SageMaker Training', doc: 'sagemaker/latest/dg/how-it-works-training.html',
  tag: 'Managed training jobs: bring a container and data, get compute that exists only while it runs.',
  what: 'A **training job** provisions instances, loads your container, streams data from [[s3]] (or mounts [[fsx-lustre]] or [[efs]]), runs your script, saves the model artifact back to S3, and tears everything down. You pay only for the run.\n\nBuilt-in capabilities include **distributed training libraries**, managed **Spot** training with checkpointing, **warm pools** for fast iteration, automatic **hyper-parameter tuning**, and reservation of capacity through **training plans**.',
  flow: ['Estimator / API call', 'Provision instances', 'Pull container + data', 'Train + checkpoint', 'Save model.tar.gz', 'Terminate'],
  steps: [
    [0, 'You define an estimator: image or framework, entry-point script, instance type and count, hyper-parameters, and data channels.'],
    [1, 'SageMaker provisions the instances (this takes minutes) and sets up networking.'],
    [2, 'It pulls your container from ECR and exposes the input channels at known paths.'],
    [3, 'Your script trains, logging metrics and writing checkpoints to a local path that SageMaker syncs to [[s3]].'],
    [4, 'On finish, anything under the model directory is packaged as the model artifact in S3.'],
    [5, 'Instances are terminated; billing stops. Spot jobs can resume from the last checkpoint after interruption.']
  ],
  gotchas: [
    '**Quotas are per usage type.** "ml.p5.48xlarge for training job usage" is a different quota from the same instance type for endpoints or notebooks. Request the right one.',
    '**Start-up overhead is real.** Provisioning plus image pull can take several minutes; use warm pools for rapid iteration.',
    '**Maximum runtime applies.** The default stopping condition ends long runs; set it consciously.',
    '**Spot without checkpoints loses work.** Enable checkpointing and set a maximum wait time.',
    'Data and training job must be in the same Region; cross-Region reads are slow and billed.'
  ],
  edges: [
    'Input modes differ: File (copy everything first), FastFile (stream on demand), Pipe (stream sequentially). Pick for dataset size.',
    'The model artifact is a compressed archive; very large models make packaging and download slow.',
    'Distributed jobs need all instances in one AZ for network performance; capacity shortages can fail the whole job.',
    'For long, big, failure-prone runs, a persistent resilient cluster ([[hyperpod]]) is usually better than a single job.'
  ],
  ml: [
    'Train or fine-tune open-weight LLMs with LoRA or full-parameter methods, using the distributed libraries and recipes.',
    'Hyper-parameter search across dozens of parallel trials with Bayesian optimisation.',
    'Reproducible training steps as the core of [[sm-pipelines|pipelines]].'
  ],
  pairs: ['s3', 'fsx-lustre', 'hyperpod', 'sm-pipelines', 'sm-inference', 'ec2', 'neuron'],
  cost: 'Instance-seconds for the job duration, plus storage for data and artifacts. Spot can discount heavily for interruptible training.'
});

S({
  id: 'hyperpod', cat: 'ml', name: 'SageMaker HyperPod', doc: 'sagemaker/latest/dg/sagemaker-hyperpod.html',
  tag: 'A persistent, self-healing GPU/Trainium cluster built for weeks-long foundation model training.',
  what: 'HyperPod creates a **persistent cluster** (orchestrated by Slurm or by Amazon EKS) tuned for large distributed training and inference. It adds **continuous health monitoring**: when a node or accelerator fails, HyperPod replaces it and resumes the job from the last checkpoint, so a hardware fault does not cost the whole run.\n\nIt also provides pre-configured networking (EFA), shared storage integration, recipes for common models, and tools for task governance and capacity sharing across teams.',
  flow: ['Provision cluster', 'Slurm / EKS scheduler', 'Training job on N nodes', 'Health agents', 'Node replaced', 'Resume from checkpoint'],
  steps: [
    [0, 'You create a cluster of instance groups (for example, 64 GPU nodes), with lifecycle scripts to set up the environment.'],
    [1, 'Users submit jobs through Slurm or Kubernetes, just as on any on-prem cluster.'],
    [2, 'A distributed job runs across the nodes, checkpointing periodically to shared storage such as [[fsx-lustre]] or [[s3]].'],
    [3, 'Health agents run continuous and deep checks on GPUs, network, and disks.'],
    [4, 'On a failure, the bad node is removed and a healthy spare or new instance is added.'],
    [5, 'The job restarts from the last checkpoint with the full set of nodes.']
  ],
  gotchas: [
    '**You pay for the cluster while it is up,** idle or not. Scale instance groups down between campaigns.',
    '**Resume is only as good as your checkpoints.** Checkpoint frequency trades lost progress against I/O stall; measure the checkpoint write time.',
    '**Capacity comes from somewhere.** Plan it with training plans or reservations, not on-demand hope.',
    'You administer more here than in plain training jobs: lifecycle scripts, images, scheduler configuration.'
  ],
  edges: [
    'Node replacement takes minutes, so extremely short jobs do not benefit.',
    'EKS-orchestrated clusters bring Kubernetes operational overhead; Slurm suits teams from HPC backgrounds.',
    'Deep health checks may take nodes out of service during validation, reducing usable capacity briefly.'
  ],
  ml: [
    'Pre-training and continued pre-training of foundation models over many nodes for weeks.',
    'Shared GPU cluster for a research org, with quotas and priorities between teams.',
    'Fine-tuning and serving open models on the same fleet to maximise utilisation.'
  ],
  pairs: ['ec2', 'fsx-lustre', 'eks', 's3', 'sm-training', 'neuron'],
  cost: 'Instance-hours for every node in the cluster, whether or not jobs run. Reserved capacity options reduce the rate.'
});

S({
  id: 'sm-pipelines', cat: 'ml', name: 'SageMaker Pipelines & Model Registry', doc: 'sagemaker/latest/dg/pipelines.html',
  tag: 'CI/CD for ML: a DAG of steps from data prep to a versioned, approved, deployable model.',
  what: '**Pipelines** defines an ML workflow as a directed graph of steps: processing, training, tuning, evaluation, conditional branching, model registration, deployment, and custom Lambda or callback steps. Results are cached when inputs are unchanged.\n\nThe **Model Registry** stores model versions with metadata, metrics and an **approval status**; changing that status can trigger automated deployment, giving a controlled promotion path from experiment to production.',
  flow: ['Trigger', 'Process data', 'Train', 'Evaluate', 'Condition: good enough?', 'Register + approve → deploy'],
  steps: [
    [0, 'A trigger starts an execution: schedule, [[eventbridge]] event on new data, or a commit.'],
    [1, 'A processing step cleans and splits data, writing outputs to [[s3]].'],
    [2, 'A training step produces a model artifact, reusing cached results if inputs are unchanged.'],
    [3, 'An evaluation step computes metrics on held-out data and writes a report.'],
    [4, 'A condition step compares the metric to a threshold and branches.'],
    [5, 'On success the model is registered as a pending version; approval (human or automatic) triggers deployment to an endpoint.']
  ],
  gotchas: [
    '**Steps communicate through S3 and properties,** not shared memory. Wire outputs to inputs through property references or the dependency graph will not form as you expect.',
    '**Cache keys can mask changes.** A cached step may reuse stale results if the thing that changed is not an input to the step.',
    '**Branching is limited** to condition steps. Complex logic often belongs in a Lambda step or in [[stepfunctions]].',
    'Pipeline definitions are versioned artifacts. Treat edits like code changes with review.'
  ],
  edges: [
    'Approval gates stop automation by design; decide who is allowed to flip status and audit it via [[cloudtrail]].',
    'Cross-account promotion (dev to prod) needs a registry share and roles on both sides.',
    'Retry policies exist per step. Without them, a transient capacity error fails the run.'
  ],
  ml: [
    'Continuous training: retrain on fresh data when drift alarms fire, and only promote if evaluation beats the current model.',
    'Reproducible lineage from dataset to deployed model, which audit and regulated settings require.',
    'Fine-tune an LLM, evaluate it on a regression set, register it, and deploy behind an endpoint, all as one pipeline.'
  ],
  pairs: ['sm-training', 'sm-inference', 'sm-monitor', 'eventbridge', 'stepfunctions', 'glue'],
  cost: 'No charge for Pipelines or the registry; you pay for the steps\' compute.'
});

S({
  id: 'sm-feature-store', cat: 'ml', name: 'SageMaker Feature Store', doc: 'sagemaker/latest/dg/feature-store.html',
  tag: 'One definition of each feature for both training (offline) and low-latency inference (online).',
  what: 'Feature Store keeps **feature groups**, collections of features keyed by a record identifier and an event time. Every write goes to an **online store** (low-latency lookup by key for inference) and, if enabled, an **offline store** in S3 (queried with Athena for training sets).\n\nThe point is avoiding **training-serving skew**: the same transformation and values feed both paths, and offline queries support **point-in-time correct** joins so training data does not leak the future.',
  flow: ['Feature pipeline', 'PutRecord', 'Online store', 'Offline store (S3)', 'Training set (Athena)', 'Inference lookup'],
  steps: [
    [0, 'A batch or streaming pipeline computes features such as "purchases in last 7 days".'],
    [1, 'It writes records into a feature group with a record ID and event time.'],
    [2, 'The latest value per ID is held in the online store for millisecond reads.'],
    [3, 'Every version is appended to the offline store in [[s3]] as Iceberg or Glue-catalogued tables.'],
    [4, 'Training queries the offline store with point-in-time logic to build correct datasets.'],
    [5, 'At inference time the app fetches current features by ID from the online store.']
  ],
  gotchas: [
    '**Offline and online stores are eventually consistent** with each other; the offline copy lags by minutes.',
    '**Schema is hard to change.** You can add features but not remove or retype them. Version groups deliberately.',
    '**Event time must be right.** Wrong timestamps break point-in-time correctness without raising any error.',
    'Online storage costs scale with record count and tier; keep only what inference needs.',
    'Late or out-of-order records need explicit handling; the online store keeps the latest by event time.'
  ],
  edges: [
    'Not every project needs one. For simple models a table in [[dynamodb]] plus Parquet in S3 is lighter.',
    'Feature groups are tied to a Region; cross-Region reads add latency.',
    'Ingesting from streaming sources requires a consumer you operate or a managed stream integration.'
  ],
  ml: [
    'Real-time recommendation, fraud and ranking models that need fresh per-user features.',
    'Shared feature catalogue so multiple teams reuse the same vetted definitions.',
    'Personalising LLM prompts with user attributes fetched at request time.'
  ],
  pairs: ['dynamodb', 's3', 'athena', 'kinesis', 'sm-inference', 'glue'],
  cost: 'Online store: storage and read/write units (or in-memory tier by hour). Offline store: S3 storage and Athena queries.'
});

S({
  id: 'sm-inference', cat: 'ml', name: 'SageMaker Inference', doc: 'sagemaker/latest/dg/deploy-model.html',
  tag: 'Four ways to host a model: real-time, serverless, asynchronous and batch.',
  what: 'SageMaker hosts models behind managed endpoints:\n\n**Real-time endpoints** keep instances running for low-latency requests and autoscale. **Serverless inference** scales to zero for spiky CPU workloads. **Asynchronous inference** queues requests and handles large payloads and long processing. **Batch transform** runs offline over a dataset in S3.\n\nFor LLMs, **Large Model Inference** containers (vLLM, TensorRT-LLM and others) and **inference components** let you place multiple models or copies on shared instances with per-model scaling.',
  flow: ['Client', 'Endpoint (HTTPS)', 'Load balancer', 'Container on instance', 'Model', 'Response / stream'],
  steps: [
    [0, 'A client calls `InvokeEndpoint` (or the streaming variant) with SigV4-signed HTTPS.'],
    [1, 'The managed endpoint authenticates and routes the request.'],
    [2, 'It balances across instances in the production variant.'],
    [3, 'The serving container (with your model loaded) receives the payload.'],
    [4, 'The model computes; LLM servers batch concurrent requests continuously for throughput.'],
    [5, 'The response returns, or tokens stream back as they are generated.']
  ],
  gotchas: [
    '**Real-time endpoints bill while running,** busy or not. A GPU endpoint left up overnight is a real cost; delete test endpoints.',
    '**Invocation timeout is short** for real-time (on the order of a minute). Long generations or heavy processing belong on async endpoints or streaming.',
    '**Scale-out lag.** A new instance must provision, pull the image and load weights, which can take many minutes for big models. Keep headroom or pre-scale before known peaks.',
    '**Serverless inference limits:** CPU only, bounded memory and payload size, and cold starts.',
    'Endpoint quotas per instance type apply separately from training quotas.'
  ],
  edges: [
    '**Multi-model endpoints** load models on demand into one container, saving cost for many small, rarely-used models, but the first call to a model pays a load delay.',
    'Autoscaling on concurrency-per-model metrics tracks LLM load better than request counts, since request cost varies hugely with length.',
    '**Shadow variants and blue/green** deployments let you test a new model on live traffic before cutover.',
    'Async endpoints can scale to zero but then take longer to respond to the first request.'
  ],
  ml: [
    'Host a fine-tuned or open-weight LLM when Bedrock does not offer the model or customisation you need.',
    'Low-latency serving for classic models (fraud, ranking) behind autoscaling endpoints.',
    'Cost-efficient batch scoring of millions of records with batch transform.'
  ],
  pairs: ['sm-training', 'sm-monitor', 'apigw', 'ec2', 'neuron', 'bedrock-guardrails', 'cloudwatch'],
  cost: 'Real-time: instance-hours per variant. Serverless: per request and duration. Async and batch: instance time while processing. Inference is usually the largest steady-state ML cost.'
});

S({
  id: 'sm-monitor', cat: 'ml', name: 'Model Monitor & Clarify', doc: 'sagemaker/latest/dg/model-monitor.html',
  tag: 'Detect data drift, quality decay, bias and explain predictions after the model is live.',
  what: '**Model Monitor** compares production traffic to a **baseline** from training data and reports four kinds of drift: data quality, model quality, bias drift and feature-attribution drift. Endpoints optionally **capture** requests and responses to S3, and scheduled monitoring jobs analyse them.\n\n**Clarify** measures bias in data and models, explains predictions with SHAP-style feature attributions, and supports foundation-model evaluation.',
  flow: ['Endpoint', 'Data capture to S3', 'Baseline stats', 'Scheduled monitor job', 'Violations report', 'CloudWatch alarm'],
  steps: [
    [0, 'Live requests and responses flow through the endpoint, with a sampled copy captured to [[s3]].'],
    [1, 'At setup you compute baseline statistics and constraints from training data.'],
    [2, 'A scheduled processing job runs over captured data (hourly or longer intervals).'],
    [3, 'It compares distributions and metrics with the baseline.'],
    [4, 'A violations report lists drifted features or degraded metrics.'],
    [5, 'Metrics publish to [[cloudwatch]], where alarms trigger notifications or retraining via [[sm-pipelines]].']
  ],
  gotchas: [
    '**Not real time.** Jobs run on a schedule (hourly at the shortest), so fast incidents need CloudWatch metrics on the endpoint too.',
    '**Model quality needs ground truth,** which often arrives late (labels days after predictions). You must build the join between predictions and eventual outcomes.',
    '**Baselines go stale.** A baseline from last year\'s data flags healthy seasonal change as drift.',
    'Data capture adds storage and may expose sensitive payloads; protect and expire it.'
  ],
  edges: [
    'High-cardinality or free-text inputs need custom analysis; default statistics suit tabular data.',
    'Sampling rate trades visibility against cost and privacy.',
    'For LLM apps, quality drift is better tracked with eval scores and guardrail metrics than with feature distributions.'
  ],
  ml: [
    'Trigger retraining pipelines automatically when input drift crosses a threshold.',
    'Fairness audits before launch and periodic reviews in regulated domains.',
    'Explain individual predictions for decisions that need justification.'
  ],
  pairs: ['sm-inference', 'sm-pipelines', 's3', 'cloudwatch', 'eventbridge'],
  cost: 'Processing-job instance time for each monitoring run, plus S3 storage for captured data.'
});

S({
  id: 'sm-groundtruth', cat: 'ml', name: 'SageMaker Ground Truth', doc: 'sagemaker/latest/dg/sms.html',
  tag: 'Build labelled datasets with human annotators, active learning, and quality controls.',
  what: 'Ground Truth runs **labeling jobs**: you provide data in S3, labeling instructions and a workforce (your own private team, a vetted vendor, or a crowd), and it produces labelled output. Built-in task types cover images, text, video and 3D point clouds, and **automated labeling** uses a model trained on early labels to label easy items, sending only uncertain ones to humans.\n\nA managed variant, **Ground Truth Plus**, has AWS manage the workforce and quality process.',
  flow: ['Data in S3', 'Labeling job', 'Workers annotate', 'Consolidate labels', 'Labelled manifest'],
  steps: [
    [0, 'You provide an input manifest pointing to objects in [[s3]].'],
    [1, 'You configure the task template, instructions and workforce.'],
    [2, 'Workers annotate items in a web UI; each item is shown to several workers.'],
    [3, 'Annotation consolidation merges multiple answers into one label, with confidence.'],
    [4, 'An output manifest with labels is written to S3 for training.']
  ],
  gotchas: [
    '**Instructions decide label quality.** Vague guidelines yield inconsistent labels no tool can fix. Pilot on a small batch first.',
    '**Sensitive data reaches workers.** Use a private workforce or vendor with contracts for anything confidential.',
    '**Per-object charges add up** when every item gets multiple annotations.',
    'Output manifests have a specific format that training code must parse.'
  ],
  edges: [
    'Automated labeling needs enough initial human labels to be useful; very small datasets gain nothing.',
    'Verification and adjustment jobs can audit and fix existing labels.'
  ],
  ml: [
    'Create supervised datasets for vision and NLP models.',
    'Collect human preference or rating data to evaluate or align LLM outputs.',
    'Audit label quality before training.'
  ],
  pairs: ['s3', 'sm-training', 'sm-studio', 'textract', 'rekognition'],
  cost: 'Per labelled object (varies by task type and workforce), plus automated-labeling compute.'
});

S({
  id: 'sm-jumpstart', cat: 'ml', name: 'SageMaker JumpStart', doc: 'sagemaker/latest/dg/studio-jumpstart.html',
  tag: 'A hub of pretrained open and proprietary models you can deploy or fine-tune in a few clicks.',
  what: 'JumpStart catalogues pretrained foundation and task models (open-weight LLMs, embedding models, vision models, and more) plus solution templates. Each can be **deployed** to a SageMaker endpoint using a tuned serving container, or **fine-tuned** on your data with provided training scripts.\n\nIt is the fastest path from "I want to try Llama or Mistral on my data" to a private endpoint inside your account.',
  flow: ['Browse hub', 'Accept licence', 'Deploy / fine-tune', 'Private endpoint', 'Invoke'],
  steps: [
    [0, 'You browse or search the model hub in Studio or via the SDK.'],
    [1, 'For gated models you accept the end-user licence agreement.'],
    [2, 'You deploy with default or chosen instance type, or start a fine-tuning job pointed at your [[s3]] data.'],
    [3, 'SageMaker creates the endpoint (model weights are pulled into your VPC context).'],
    [4, 'You invoke it like any [[sm-inference|SageMaker endpoint]].']
  ],
  gotchas: [
    '**Licences differ by model.** Check terms for commercial use before building a product.',
    '**Defaults are generic.** Default instance sizes may be large and costly; right-size for your traffic.',
    '**Endpoints keep billing** until deleted.',
    'Catalogue contents and versions change; pin a specific model version for reproducibility.'
  ],
  edges: [
    'Private hubs let an organisation curate approved models.',
    'Some models are also available serverlessly through [[bedrock]], which is simpler if throughput needs are modest.'
  ],
  ml: [
    'Evaluate several open models quickly against your own tasks.',
    'Fine-tune a small open model for a narrow domain to cut inference cost.',
    'Self-host a model for data-sovereignty or customisation reasons.'
  ],
  pairs: ['sm-inference', 'sm-training', 'bedrock', 'sm-studio'],
  cost: 'No JumpStart fee; you pay for the training and endpoint instances. Some third-party models add per-hour software fees.'
});
