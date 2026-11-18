S({
  id: 'ec2', cat: 'compute', name: 'Amazon EC2 (GPU instances)', doc: 'ec2/',
  tag: 'Virtual machines, and the home of NVIDIA GPU capacity for training and inference.',
  what: 'EC2 rents virtual machines by the second. For AI the instance **family** is what matters: `P` families carry high-end NVIDIA GPUs for training (P5 with H100, P5e/P5en with H200, newer Blackwell-based P6), `G` families carry cost-efficient GPUs for inference and graphics (G5, G6, G6e), and `Trn`/`Inf` families carry AWS silicon (see [[neuron]]).\n\nFor multi-node training, instances join a **cluster placement group** and talk over **EFA** (Elastic Fabric Adapter), a low-latency network interface that lets collective operations like all-reduce bypass the OS kernel. That is what lets hundreds of GPUs behave like one machine.',
  flow: ['Reserve capacity', 'Placement group', 'GPU instance', 'EFA fabric', 'Local NVMe + EBS', 'Training job'],
  steps: [
    [0, 'You secure capacity: On-Demand, a Savings Plan, a **Capacity Block for ML** (a scheduled, fixed-duration reservation), or Spot.'],
    [1, 'Instances launch into a **cluster placement group** so they land physically close, in one Availability Zone.'],
    [2, 'Each instance boots a Deep Learning AMI with matching NVIDIA driver, CUDA and NCCL already installed.'],
    [3, 'EFA connects the nodes. NCCL uses the aws-ofi-nccl plugin to run collectives over it, bypassing the kernel network stack.'],
    [4, 'Fast ephemeral NVMe holds the shuffled dataset shard and checkpoints; EBS or [[fsx-lustre]] holds what must survive.'],
    [5, 'Your framework (PyTorch, JAX) launches one process per GPU and trains. Checkpoints stream out to [[s3]].']
  ],
  gotchas: [
    '**Quota is not capacity.** GPU quotas are per family and counted in vCPUs. Holding quota does not guarantee an instance exists when you ask. Reserve ahead for anything that matters.',
    '**Spot gives a 2-minute warning**, then the instance is gone. Checkpoint frequently and make jobs resumable.',
    '**Instance store is ephemeral.** NVMe contents vanish when you stop or terminate the instance.',
    '**EFA needs three things to line up:** a supported instance type, a security group that allows all traffic to itself, and the NCCL plugin. Missing any one gives silent fallback to slow TCP.',
    'Driver, CUDA and framework versions must agree. Mismatches show up as cryptic runtime errors, not clear messages.'
  ],
  edges: [
    'A cluster placement group is single-AZ. If that AZ lacks capacity the whole launch can fail, so request all nodes in one call.',
    'One bad GPU (ECC errors, thermal throttle) can stall a synchronous job on every node. Without health checks and automatic replacement, a single fault wastes the entire run. [[hyperpod]] automates this.',
    'Cross-AZ traffic is billed and adds latency. Keep tightly-coupled workers together.'
  ],
  ml: [
    'Distributed training and fine-tuning when you want full control of the stack, or when SageMaker abstractions are in the way.',
    'Self-hosted LLM inference with vLLM, TensorRT-LLM or Triton on `G6e`/`P5` when you need a specific model or throughput the managed APIs do not offer.',
    'Pair with [[fsx-lustre]] and [[s3]] for data, and [[eks]] or [[ecs]] to schedule inference containers across the fleet.'
  ],
  pairs: ['neuron', 'eks', 'fsx-lustre', 's3', 'hyperpod', 'servicequotas'],
  cost: 'Per-second billing for Linux On-Demand. Savings Plans and Capacity Blocks trade flexibility for price. Spot is cheapest but interruptible. GPU hours dominate almost every AI bill, so utilisation is the number to watch.'
});

S({
  id: 'neuron', cat: 'compute', name: 'Trainium & Inferentia (Neuron)', doc: 'neuron/',
  tag: 'AWS-designed accelerators for training and inference, programmed through the Neuron SDK.',
  what: 'Trainium (`Trn1`, `Trn2`) targets training and increasingly inference. Inferentia2 (`Inf2`) targets inference. They are alternatives to NVIDIA GPUs with a different price-performance profile, and are used inside AWS services too.\n\nYou do not write CUDA. The **Neuron SDK** compiles your PyTorch or JAX model into an executable for the chip\'s NeuronCores. Because compilation fixes tensor shapes ahead of time, how you batch and pad inputs matters more than on a GPU.',
  flow: ['PyTorch / JAX model', 'Neuron compiler', 'Compiled graph', 'NeuronCores', 'NeuronLink / EFA', 'Serve or train'],
  steps: [
    [0, 'You write the model in PyTorch or JAX, usually via Hugging Face Optimum Neuron or the NxD libraries for large models.'],
    [1, 'The Neuron compiler traces the model and lowers it to an optimised graph for the NeuronCore architecture.'],
    [2, 'The result is cached as a compiled artifact. Recompiling is slow, so cache it in [[s3]] or bake it into the container image.'],
    [3, 'At runtime the graph loads onto NeuronCores and executes; the model is split across cores with tensor or pipeline parallelism.'],
    [4, 'Chips exchange tensors over NeuronLink within a node, and over EFA across nodes.'],
    [5, 'Inference stacks (vLLM on Neuron, or a DLC) expose the model behind an HTTP endpoint on [[ecs]], [[eks]] or [[sm-inference]].']
  ],
  gotchas: [
    '**Static shapes.** A new input shape can trigger recompilation. Use bucketing: pad inputs to a small set of fixed lengths.',
    '**Operator coverage is not total.** Custom CUDA kernels do not port. Neuron provides NKI for writing custom kernels, but that is real work.',
    '**Version coupling.** Neuron SDK, framework and DLC versions must match. Pin them.',
    'First-load latency is high if the compiled artifact is not cached.'
  ],
  edges: [
    'Parallelism degree must divide the model\'s attention heads and fit the chip\'s memory; an awkward model size can waste cores.',
    'Quantisation and some newer model architectures arrive later than on NVIDIA. Check support for your exact model before committing.',
    'Some managed services (including parts of [[bedrock]]) may run on AWS silicon without you choosing it.'
  ],
  ml: [
    'Cost-sensitive, steady-state LLM or embedding inference where you can pin model, shapes and SDK versions.',
    'Large pre-training and fine-tuning on `Trn2` when GPU capacity is scarce or expensive.',
    'Best fit for teams that standardise on a handful of open models, since the compile step is amortised over a long serving life.'
  ],
  pairs: ['ec2', 'eks', 'sm-training', 'hyperpod', 'sm-inference'],
  cost: 'Priced as instance hours like any EC2 family, typically below comparable GPU instances. Engineering time to port and tune is the hidden cost.'
});

S({
  id: 'lambda', cat: 'compute', name: 'AWS Lambda', doc: 'lambda/',
  tag: 'Run code on demand with no servers: the glue and the lightweight inference layer.',
  what: 'Lambda runs a function in response to an event (an HTTP request, an S3 upload, a queue message) and scales it out automatically, billing for the milliseconds used. There is **no GPU** option, a 15-minute maximum run time, and up to 10,240 MB of memory (CPU scales with memory).\n\nIn AI systems Lambda is the connective tissue: pre- and post-processing, calling model endpoints, executing agent tools, and reacting to data arriving.',
  flow: ['Event source', 'Lambda service', 'Execution environment', 'Your handler', 'Model / data / API'],
  steps: [
    [0, 'Something happens: API Gateway request, S3 object created, SQS message, EventBridge rule, or a direct invoke.'],
    [1, 'The Lambda service finds a warm execution environment, or creates one (a **cold start**: download code, start runtime, run init code).'],
    [2, 'The environment is a sandboxed microVM. Code outside the handler runs once at init and is reused across invocations.'],
    [3, 'Your handler runs with the event. Large imports (like PyTorch) belong at init so warm invokes skip them.'],
    [4, 'The handler calls [[bedrock]], an [[sm-inference]] endpoint, [[dynamodb]] or [[s3]], then returns or emits a result.']
  ],
  gotchas: [
    '**Hard ceilings:** 15 min timeout, no GPU, ~6 MB cap on synchronous request and response bodies. Move large data through [[s3]], not through the event.',
    '**Cold starts grow with package size.** Heavy ML libraries hurt. Use container images (up to 10 GB), **provisioned concurrency**, or SnapStart where supported.',
    '**Concurrency is a shared pool** (default 1,000 per Region, adjustable). One runaway function can starve the others unless you set reserved concurrency.',
    'Async invocations retry automatically on failure; handlers must be idempotent.'
  ],
  edges: [
    'For SQS triggers, set the queue visibility timeout comfortably above the function timeout, or messages reappear mid-processing and get handled twice.',
    'Streaming LLM tokens to a client needs **response streaming** (Function URLs or `InvokeWithResponseStream`), because buffered responses make chat feel frozen.',
    'A function in a VPC needs NAT or VPC endpoints to reach AWS APIs and the internet.',
    '`/tmp` is writable (up to 10 GB) but not shared and not durable.'
  ],
  ml: [
    'Agent **tool execution**: a Bedrock Agent action group or an MCP-style tool is often just a Lambda.',
    'Event-driven ingestion: S3 upload triggers Lambda, which chunks a document, calls an embedding model, and writes vectors.',
    'Small-model inference (scikit-learn, ONNX, tiny transformers) where latency is relaxed and traffic is spiky.',
    'Thin API layer in front of [[bedrock]], adding auth, prompt assembly, and response streaming.'
  ],
  pairs: ['apigw', 'sqs', 'stepfunctions', 'bedrock', 's3', 'eventbridge'],
  cost: 'Requests plus GB-seconds of duration. Excellent for spiky load; becomes expensive for sustained high-throughput work that would fit on a few always-on containers.'
});

S({
  id: 'ecs', cat: 'compute', name: 'Amazon ECS & AWS Fargate', doc: 'ecs/',
  tag: 'Run containers without running Kubernetes. Fargate removes the servers; EC2 mode adds GPUs.',
  what: 'ECS schedules containers described by a **task definition**. You choose where they run: **Fargate** (AWS manages the compute, CPU and memory only) or **EC2** (you manage instances, which is the only way to get GPUs on ECS).\n\nIt is the simplest container platform on AWS and a good home for model-serving containers, API backends and worker fleets.',
  flow: ['Task definition', 'ECS scheduler', 'Capacity (Fargate / EC2)', 'Running task', 'Load balancer', 'Clients'],
  steps: [
    [0, 'You describe the container image, CPU, memory, ports, IAM role and (on EC2) GPU count in a task definition.'],
    [1, 'A **service** asks the scheduler to keep N copies of the task running and replace unhealthy ones.'],
    [2, 'Capacity is found: Fargate provisions an isolated micro-VM, or the scheduler places the task on a registered EC2 instance, possibly a GPU one.'],
    [3, 'The image is pulled and started. For model servers, the weights load now, and the task is not ready until they do.'],
    [4, 'Once health checks pass, the [[alb]] begins routing traffic to the task.'],
    [5, 'Autoscaling adds or removes tasks based on CPU, requests per target, or a custom metric such as queue depth.']
  ],
  gotchas: [
    '**Fargate has no GPU support.** GPU inference on ECS means EC2 capacity with a GPU-optimised AMI.',
    '**Large model images start slowly.** A 10+ GB image pull plus weight loading can take minutes. Use lazy-loading image formats, keep weights in [[s3]] and pull at start, or keep warm capacity.',
    'Health-check grace period must exceed model load time, or ECS kills the task before it is ready, then restarts it in a loop.',
    '**Task role vs. execution role.** Execution role pulls images and writes logs; the task role is what your code uses to call AWS. Mixing them up is the classic permission error.'
  ],
  edges: [
    'Scale-in can terminate a task mid-request. Use scale-in protection or generous stop timeouts for long jobs.',
    'In `awsvpc` mode each task gets its own network interface, and instances have a limit on how many they can hold.',
    'Fargate ephemeral storage is limited by default (increasable); big scratch space needs EC2 or a mounted [[efs]].'
  ],
  ml: [
    'Serve embedding models and small LLMs behind an ALB, on Fargate (CPU) or EC2 GPU instances.',
    'Run RAG ingestion workers, agent orchestrators, and evaluation harnesses as long-lived services.',
    'Use Fargate Spot for interruptible batch work like re-embedding a corpus.'
  ],
  pairs: ['alb', 'ec2', 's3', 'sqs', 'cloudwatch'],
  cost: 'Fargate: per vCPU-second and GB-second. EC2 mode: the instances, whether busy or not. Fargate costs more per unit but you pay only while tasks run.'
});

S({
  id: 'eks', cat: 'compute', name: 'Amazon EKS', doc: 'eks/',
  tag: 'Managed Kubernetes: the standard ML platform substrate for teams that already run K8s.',
  what: 'EKS runs the Kubernetes control plane for you; you bring worker nodes (managed node groups, Karpenter-provisioned instances, Fargate, or **EKS Auto Mode**, where AWS manages nodes too).\n\nFor ML it is attractive because the ecosystem lives on Kubernetes: Ray, Kubeflow, KServe, vLLM production stack, Kueue and Volcano for gang scheduling, and the NVIDIA GPU operator.',
  flow: ['kubectl / GitOps', 'API server', 'Scheduler', 'Karpenter node', 'GPU device plugin', 'Pod'],
  steps: [
    [0, 'You apply a manifest requesting, for example, `nvidia.com/gpu: 8` for a training pod.'],
    [1, 'The managed API server stores it and the scheduler finds no node that fits.'],
    [2, 'The pod is marked pending and signals demand for capacity.'],
    [3, 'Karpenter sees the pending pod, picks a suitable instance type, and launches it into the cluster.'],
    [4, 'The NVIDIA device plugin advertises GPUs to the kubelet; for multi-node jobs the EFA plugin exposes the fabric.'],
    [5, 'The pod schedules, pulls its image, and runs. When it finishes, Karpenter consolidates and removes the idle node.']
  ],
  gotchas: [
    '**It is a toolkit, not a product.** You install and maintain the GPU operator, EFA plugin, schedulers, monitoring, and ingress yourself (Auto Mode reduces some of this).',
    '**Pod IP exhaustion.** The VPC CNI gives each pod a VPC IP. Large clusters need prefix delegation or custom networking.',
    '**Gang scheduling is not default.** Distributed training needs all pods at once; without Kueue or Volcano you can deadlock with half a job running.',
    'A fixed control-plane fee per cluster, plus extended-support charges if you stay on old Kubernetes versions.'
  ],
  edges: [
    'GPU sharing (time-slicing, MIG) improves utilisation of small inference models but gives weaker isolation.',
    'Node image pre-pulling or image caching matters; cold nodes pulling 20 GB images stall scale-out.',
    'Upgrades touch add-ons (CNI, CoreDNS, device plugins). Test on a staging cluster.'
  ],
  ml: [
    'Multi-tenant ML platform: many teams share a GPU pool with quotas, queues and priorities.',
    'Large-scale online inference with KServe or a vLLM stack, autoscaled on queue depth or tokens/second.',
    'Distributed training with Ray or PyTorch operator, using [[fsx-lustre]] for data and [[s3]] for checkpoints.'
  ],
  pairs: ['ec2', 'neuron', 'fsx-lustre', 'alb', 'cloudwatch', 'iam'],
  cost: 'Control-plane hourly fee per cluster plus the worker instances. The real lever is bin-packing and consolidation of expensive GPU nodes.'
});

S({
  id: 'batch', cat: 'compute', name: 'AWS Batch', doc: 'batch/',
  tag: 'A managed job queue that finds capacity, runs containers to completion, and scales to zero.',
  what: 'Batch takes jobs (a container plus resource needs), puts them in a prioritised **queue**, and runs them on **compute environments** that it scales for you, built from EC2, Spot, Fargate, or EKS. You pay only for the compute used.\n\nIt is a natural fit for the offline half of ML: embedding a corpus, preprocessing millions of files, running evaluations, rendering batch inference.',
  flow: ['Submit job', 'Job queue', 'Scheduler', 'Compute environment', 'Container runs', 'Results in S3'],
  steps: [
    [0, 'You submit a job definition, optionally as an **array job** of up to thousands of children, each taking an index.'],
    [1, 'It enters a queue ordered by priority and fair-share policy.'],
    [2, 'The scheduler matches job requirements (vCPU, memory, GPUs) to compute environments attached to that queue.'],
    [3, 'The compute environment scales out: launching Spot or On-Demand instances sized to the waiting jobs.'],
    [4, 'The container runs, reads its slice of input using the array index, and exits.'],
    [5, 'Outputs land in [[s3]]; when the queue drains, instances scale back to zero.']
  ],
  gotchas: [
    '**Jobs stuck in `RUNNABLE`** are almost always unsatisfiable requests: asking for more vCPU, memory or GPUs than any allowed instance type offers, or subnets that cannot reach ECR.',
    '**Spot reclaims kill jobs.** Configure retry attempts and make tasks idempotent or checkpointed.',
    'Choose the Spot allocation strategy deliberately; a price-only strategy gets interrupted most.',
    'Multi-node parallel jobs need all nodes in the same AZ and can wait a long time for capacity.'
  ],
  edges: [
    'Array jobs share one definition; the index is the only thing that differs, so shard your input deterministically.',
    'Job timeouts are not on by default; a hung job holds expensive capacity indefinitely.',
    'Each job has its own container start overhead, so many very short jobs waste time. Batch work into larger units.'
  ],
  ml: [
    'Bulk embedding generation, re-indexing, and document parsing pipelines (often driven by [[stepfunctions]]).',
    'Hyper-parameter sweeps and offline evaluation across many model variants.',
    'Distributed training through multi-node parallel jobs when you want scheduling without Kubernetes.'
  ],
  pairs: ['ec2', 's3', 'stepfunctions', 'ecs', 'eventbridge'],
  cost: 'No charge for Batch itself, only the underlying compute. Spot makes it very cheap if jobs tolerate interruption.'
});
