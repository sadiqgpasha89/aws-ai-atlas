S({
  id: 'vpc', cat: 'networking', name: 'VPC, Endpoints & PrivateLink', doc: 'vpc/',
  tag: 'Your private network, and the endpoints that keep model and data traffic off the internet.',
  what: 'A **VPC** is your isolated network, divided into subnets across AZs with route tables, security groups and gateways. Workloads in private subnets reach AWS services in one of three ways: through a **NAT gateway** (to public endpoints), through a **gateway endpoint** (S3 and DynamoDB, free), or through an **interface endpoint** powered by **PrivateLink** (most other services, including Bedrock and SageMaker runtimes), which puts a private IP for the service inside your subnet.\n\nFor AI workloads handling sensitive data, private endpoints plus endpoint policies are the standard way to guarantee prompts and datasets never traverse the public internet.',
  flow: ['Workload (private subnet)', 'Route table', 'Gateway / interface endpoint', 'AWS service', 'Endpoint policy check'],
  steps: [
    [0, 'A workload in a private subnet calls an AWS API, for example Bedrock runtime.'],
    [1, 'DNS resolves the service name (private DNS on an interface endpoint resolves to a private IP).'],
    [2, 'Traffic goes to the endpoint network interface in your subnet, not to a NAT or internet gateway.'],
    [3, 'PrivateLink carries it over the AWS network to the service.'],
    [4, 'The endpoint policy and the caller\'s IAM policy must both allow the action.']
  ],
  gotchas: [
    '**NAT gateway data processing is expensive for bulk transfer.** Pulling terabytes from S3 through NAT is a classic surprise bill. Use a free **S3 gateway endpoint**.',
    '**Interface endpoints bill per AZ per hour plus per GB.** Many endpoints in many AZs adds up; share through a central VPC where it suits.',
    '**Endpoint policies silently deny.** A restrictive default or custom policy produces `AccessDenied` that looks like IAM.',
    '**No endpoint means no access.** A private subnet without NAT or the right endpoint fails with timeouts (not errors) when a job tries to reach ECR, S3 or the SageMaker API.',
    'Overlapping CIDR ranges block peering and Transit Gateway connections. Plan address space early.'
  ],
  edges: [
    'Security groups are stateful and attach to interfaces; network ACLs are stateless at the subnet. Most debugging belongs to security groups.',
    'Kubernetes pods using the VPC CNI consume subnet IPs. Large GPU clusters can exhaust small subnets.',
    'SageMaker supports VPC-only mode and network isolation (no outbound calls from the container) for sensitive training.'
  ],
  ml: [
    'Run training and inference in private subnets with endpoints for S3, ECR, CloudWatch, KMS, and the Bedrock and SageMaker runtimes.',
    'Apply endpoint policies that restrict which buckets and models a VPC can reach, limiting data exfiltration.',
    'Connect to private data sources and SaaS model providers via PrivateLink.'
  ],
  pairs: ['s3', 'iam', 'ec2', 'sm-training', 'bedrock', 'kms'],
  cost: 'VPC is free. NAT gateways: hourly plus per GB processed. Interface endpoints: per AZ-hour plus per GB. Gateway endpoints: free.'
});

S({
  id: 'apigw', cat: 'networking', name: 'Amazon API Gateway', doc: 'apigateway/',
  tag: 'A managed front door for APIs: auth, throttling, caching and routing to Lambda or services.',
  what: 'API Gateway exposes **REST**, **HTTP** and **WebSocket** APIs. It authenticates callers (IAM, Cognito, JWT, Lambda authorisers), enforces throttles and quotas with **usage plans**, validates requests, optionally caches responses, and routes to Lambda, HTTP backends, or other AWS services.\n\nIn AI systems it is the usual public entry point to a model-backed API: it adds auth and rate limiting before expensive inference is reached.',
  flow: ['Client', 'API Gateway', 'Authoriser', 'Throttle + validate', 'Integration (Lambda / ALB)', 'Response'],
  steps: [
    [0, 'A client sends an HTTPS request to the API\'s custom domain.'],
    [1, 'API Gateway matches the route and stage.'],
    [2, 'The authoriser (Cognito, JWT, Lambda or IAM) verifies the caller.'],
    [3, 'Throttling and usage-plan quotas are applied, and the request is validated.'],
    [4, 'It is forwarded to the integration (for example [[lambda]]).'],
    [5, 'The integration\'s result is mapped to an HTTP response and returned to the client, with metrics and access logs recorded.']
  ],
  gotchas: [
    '**Integration timeout is short by default** (about 29 seconds for REST APIs; adjustable for Regional REST APIs with trade-offs). LLM calls that take longer need streaming, async patterns or a different front door.',
    '**Payload limits** (around 10 MB) apply. Upload large files to [[s3]] with presigned URLs.',
    '**Buffered responses make chatbots feel slow.** Use response streaming (supported for REST APIs in newer releases), WebSockets, or Lambda Function URLs with streaming.',
    '**REST vs HTTP APIs differ.** HTTP APIs are cheaper and simpler but lack some REST features (such as usage plans and direct WAF attachment). Pick on features.',
    'Account-level throttle limits are shared across APIs in a Region.'
  ],
  edges: [
    'WebSocket APIs have connection duration and idle limits; clients need reconnect logic.',
    'Caching responses to personalised or non-deterministic LLM calls is usually wrong; cache only deterministic lookups.',
    'Per-API-key quotas are a handy way to implement tenant-level token or request budgets.'
  ],
  ml: [
    'Public API for an inference service, with per-customer keys and quotas protecting GPU spend.',
    'Asynchronous pattern: `POST` returns a job ID, workers process through [[sqs]], clients poll or receive a WebSocket push.',
    'Authentication layer in front of a Bedrock-backed app via [[cognito]].'
  ],
  pairs: ['lambda', 'cognito', 'waf', 'cloudfront', 'alb', 'sqs'],
  cost: 'Per million requests (REST costs more than HTTP), plus data transfer, caching, and WebSocket connection minutes.'
});

S({
  id: 'alb', cat: 'networking', name: 'Elastic Load Balancing (ALB)', doc: 'elasticloadbalancing/',
  tag: 'Spreads HTTP traffic across containers and instances: the front of most model-serving fleets.',
  what: 'The **Application Load Balancer** works at layer 7: it routes by host and path, supports WebSockets and gRPC, performs health checks, and can authenticate users through OIDC or Cognito before forwarding. Targets can be instances, IP addresses (containers), or Lambda functions.\n\nThe **Network Load Balancer** works at layer 4 for raw TCP/UDP and very high throughput or static IPs.',
  flow: ['Client', 'ALB listener', 'Rules (host / path)', 'Target group + health check', 'Model server'],
  steps: [
    [0, 'The client connects to the ALB over HTTPS (TLS terminates at the ALB).'],
    [1, 'A listener evaluates rules by host header, path and headers.'],
    [2, 'The matching rule forwards to a target group.'],
    [3, 'Only targets passing health checks receive traffic; the algorithm picks one (least-outstanding-requests suits variable LLM latencies).'],
    [4, 'The target (for example a vLLM container) responds, streaming back through the ALB.']
  ],
  gotchas: [
    '**Idle timeout defaults to 60 seconds.** If a slow generation sends no bytes for longer, the ALB closes the connection. Stream tokens, send keep-alives, or raise the timeout.',
    '**Health checks vs model load.** A container that takes minutes to load weights fails checks and is killed or never added. Use a readiness endpoint and sufficient grace period.',
    '**Round-robin is a poor fit for LLMs.** Requests vary from milliseconds to minutes; least-outstanding-requests balances better.',
    'Cross-zone load balancing and slow-start settings affect how traffic shifts onto new tasks.'
  ],
  edges: [
    'Deregistration delay lets in-flight requests finish before a target is removed; set it above your longest request.',
    'Sticky sessions can help KV-cache reuse but unbalance load.',
    'AWS WAF can attach directly to an ALB.'
  ],
  ml: [
    'Front for self-hosted model servers on [[ecs]], [[eks]] or [[ec2]].',
    'Path-based routing to send different model families to different target groups.',
    'Weighted target groups for canary rollouts of a new model version.'
  ],
  pairs: ['ecs', 'eks', 'waf', 'cognito', 'cloudfront', 'route53'],
  cost: 'Hourly fee plus load balancer capacity units (new connections, active connections, bandwidth, rule evaluations).'
});

S({
  id: 'cloudfront', cat: 'networking', name: 'Amazon CloudFront', doc: 'cloudfront/',
  tag: 'Global CDN: cache static assets near users and shield your origins.',
  what: 'CloudFront serves content from edge locations worldwide. Requests that hit the cache return in milliseconds; misses go to your **origin** (S3, ALB, API Gateway) over AWS\'s backbone. You can attach **AWS WAF**, run lightweight code at the edge (CloudFront Functions, Lambda@Edge), and use signed URLs or cookies for private content.',
  flow: ['User', 'Nearest edge', 'Cache hit?', 'Origin (S3 / ALB / API)', 'Response cached'],
  steps: [
    [0, 'A user requests a URL on your domain.'],
    [1, 'DNS routes them to the nearest edge location.'],
    [2, 'The edge checks its cache using the cache key.'],
    [3, 'On a miss it fetches from the origin using a persistent, optimised connection.'],
    [4, 'The response is cached according to headers and policies and returned to the user.']
  ],
  gotchas: [
    '**Origin response timeout is limited** (30 seconds by default, adjustable). Long model calls behind CloudFront need streaming that sends bytes early.',
    '**Dynamic, personalised responses should not be cached.** Check cache policies so one user\'s generated answer is never served to another.',
    '**Cache key mistakes** (missing headers or query strings) cause wrong or poor hit rates.',
    'Invalidations are not instant and large numbers cost money; use versioned file names.'
  ],
  edges: [
    'Use Origin Access Control to keep S3 buckets private, reachable only through CloudFront.',
    'WebSocket and streaming behaviours differ from plain HTTP; test your streaming responses end to end.',
    'Signed URLs make a good way to deliver generated images, audio and video.'
  ],
  ml: [
    'Serve the web or mobile front end for an AI product and absorb traffic spikes.',
    'Deliver generated media (images, audio, video) from S3 through signed URLs.',
    'Apply WAF rate limits and bot controls in front of the inference API.'
  ],
  pairs: ['s3', 'apigw', 'alb', 'waf', 'route53'],
  cost: 'Per GB transferred out and per request, by Region. Data transfer from AWS origins to CloudFront is free.'
});

S({
  id: 'route53', cat: 'networking', name: 'Amazon Route 53', doc: 'Route53/',
  tag: 'DNS with smart routing: latency, weighted, failover and health-based traffic steering.',
  what: 'Route 53 hosts DNS zones and answers queries with **routing policies**: simple, weighted, latency-based, geolocation, failover and more. **Health checks** remove unhealthy endpoints from answers. **Private hosted zones** serve names inside a VPC.\n\nFor global AI systems it is how you send users to the nearest Region, shift a percentage of traffic to a new deployment, or fail over when a Region degrades.',
  flow: ['Client DNS query', 'Route 53', 'Routing policy', 'Health check', 'IP / alias returned'],
  steps: [
    [0, 'A client resolves your API hostname.'],
    [1, 'The query reaches Route 53 authoritative servers.'],
    [2, 'The record\'s policy (latency, weighted, failover) selects candidates.'],
    [3, 'Health checks filter out endpoints marked unhealthy.'],
    [4, 'The chosen answer is returned and cached by the resolver for the TTL.']
  ],
  gotchas: [
    '**TTL means slow cutovers.** Resolvers cache answers; a failover is only as fast as your TTL and client behaviour.',
    '**Health checks must be reachable and meaningful.** A shallow check on `/` can say "healthy" when the model is not loaded. Check a real readiness path.',
    '**Latency routing is by AWS network latency to Regions,** not by geography. Test it.',
    'Alias records pointing at AWS resources are free, while ordinary queries are billed.'
  ],
  edges: [
    'Weighted records with weight 0 serve as a standby.',
    'For quota-bound services such as Bedrock, multi-Region deployments with latency or failover routing add both capacity and resilience, but you must replicate data and configuration.'
  ],
  ml: [
    'Route users to the closest Regional inference endpoint.',
    'Canary a new model version with a 5% weighted record, then ramp.',
    'Fail over to another Region if the primary inference stack is unhealthy.'
  ],
  pairs: ['alb', 'cloudfront', 'apigw', 'sm-inference', 'bedrock'],
  cost: 'Per hosted zone per month, plus per million queries and per health check.'
});
