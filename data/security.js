S({
  id: 'iam', cat: 'security', name: 'AWS IAM', doc: 'IAM/',
  tag: 'Who can do what. Every API call in every AI system passes through it.',
  what: 'IAM defines **identities** (users, and more commonly **roles** that workloads and people assume for temporary credentials) and **policies** (JSON documents granting or denying actions on resources, optionally with conditions). Policy evaluation starts at "deny", an explicit deny always wins, and an allow is needed from every applicable layer: identity policy, resource policy, permission boundaries, and organisation-level SCPs.\n\nAI services lean on roles heavily: SageMaker jobs, Lambda functions, Bedrock agents and knowledge bases each run with an **execution role** that defines what they can touch.',
  flow: ['Caller assumes role', 'STS temporary credentials', 'API request signed', 'Policy evaluation', 'Allow / deny'],
  steps: [
    [0, 'A person (via Identity Center) or a workload assumes a role, subject to its trust policy.'],
    [1, 'STS issues short-lived credentials.'],
    [2, 'The caller signs the API request with them.'],
    [3, 'The service evaluates all applicable policies, plus conditions such as source VPC endpoint or tags.'],
    [4, 'If nothing denies and the required layers allow, the call proceeds.']
  ],
  gotchas: [
    '**Wildcards on Bedrock are expensive.** `bedrock:InvokeModel` on `*` lets a compromised role call the priciest models. Scope to specific model ARNs.',
    '**Cross-Region inference needs more permissions.** Invoking through an inference profile requires access to the profile and the underlying models in every Region it may route to.',
    '**`iam:PassRole` is the hidden permission.** To start a SageMaker job with a role, you need permission to pass that role. Missing it gives confusing errors.',
    '**Confused deputy.** When a service assumes your role, add `aws:SourceArn` and `aws:SourceAccount` conditions to the trust policy.',
    '**Execution roles are broad by habit.** A notebook role with admin rights turns any notebook compromise into account compromise.'
  ],
  edges: [
    'Changes propagate quickly but not instantly, so a just-created role may fail for seconds.',
    'Service control policies restrict but never grant; an SCP deny can override a perfectly good role policy.',
    'Access Analyzer finds unintended external access and can generate least-privilege policies from CloudTrail history.'
  ],
  ml: [
    'Separate roles for data scientists, training jobs, endpoints and pipelines, each with minimum S3 and KMS access.',
    'Per-tenant or per-application roles for Bedrock so usage is attributable and capped.',
    'Tag-based and attribute-based access control to isolate teams sharing one GPU account.'
  ],
  pairs: ['kms', 'vpc', 'cloudtrail', 'sm-studio', 'bedrock', 'lakeformation'],
  cost: 'Free.'
});

S({
  id: 'kms', cat: 'security', name: 'AWS KMS', doc: 'kms/',
  tag: 'Managed encryption keys: control who can decrypt your data, models and vectors.',
  what: 'KMS creates and protects cryptographic keys that never leave the service in plaintext. Most AWS services use **envelope encryption**: they ask KMS for a data key, encrypt your data locally with it, and store the encrypted data key beside the data. Decrypting requires permission on the KMS key, so the key is a second gate on top of storage permissions.\n\n**Customer managed keys** give you control over key policy, rotation and the ability to disable access instantly.',
  flow: ['Service needs to encrypt', 'GenerateDataKey', 'KMS (key policy check)', 'Data key', 'Encrypted data + wrapped key'],
  steps: [
    [0, 'A service such as [[s3]], EBS or SageMaker writes data and needs encryption.'],
    [1, 'It calls `GenerateDataKey` on your KMS key.'],
    [2, 'KMS checks the key policy and the caller\'s IAM permissions.'],
    [3, 'It returns a plaintext data key and the same key encrypted under your KMS key.'],
    [4, 'The service encrypts the data, discards the plaintext key, and stores the encrypted key with the data.']
  ],
  gotchas: [
    '**Key deletion is data deletion.** Once a key is gone (after the waiting period), everything encrypted only under it is unrecoverable.',
    '**Request-rate quotas.** High-volume S3 workloads with SSE-KMS can be throttled by KMS. Enable **S3 Bucket Keys** to cut KMS calls dramatically.',
    '**Key policy is primary.** Without a statement allowing IAM to manage access, IAM policies alone do not work. Cross-account use needs both sides.',
    '**Service roles need key access.** SageMaker, Bedrock and Lambda roles require `kms:Decrypt` and `kms:GenerateDataKey` on the CMK, or jobs fail with opaque errors.',
    'Each KMS request costs a little; chatty workloads show up on the bill.'
  ],
  edges: [
    'Multi-Region keys let you decrypt replicated data in another Region without cross-Region calls.',
    'Grants allow services to use keys on your behalf with narrow, temporary permissions.',
    'Disabling a key is a fast, reversible kill switch for data access.'
  ],
  ml: [
    'Encrypt training datasets, checkpoints, model artifacts, EBS volumes and feature stores with CMKs.',
    'Customer-managed encryption for Bedrock knowledge bases, custom models and agent sessions where policy demands it.',
    'Per-tenant keys for strong data isolation in multi-tenant AI platforms.'
  ],
  pairs: ['s3', 'iam', 'ebs', 'bedrock', 'sm-training', 'secrets'],
  cost: 'Monthly fee per customer managed key, plus per-request charges. AWS-managed keys have no monthly fee.'
});

S({
  id: 'secrets', cat: 'security', name: 'AWS Secrets Manager', doc: 'secretsmanager/',
  tag: 'Store, rotate and fetch credentials and API keys without putting them in code.',
  what: 'Secrets Manager stores secrets (database passwords, API keys, tokens) encrypted with KMS, controls access through IAM, keeps versions, and can **rotate** secrets automatically with a Lambda function. Applications fetch secrets at runtime, ideally caching them briefly.\n\nA lighter alternative is **Systems Manager Parameter Store**, which suits configuration and simple secrets at lower cost but without built-in rotation workflows.',
  flow: ['App starts', 'GetSecretValue', 'IAM + KMS check', 'Secret (cached)', 'Rotation Lambda'],
  steps: [
    [0, 'Your app starts and needs a credential, for example a third-party model API key.'],
    [1, 'It calls `GetSecretValue` using its role.'],
    [2, 'IAM and KMS permissions are verified.'],
    [3, 'The secret is returned; a client library caches it to reduce calls.'],
    [4, 'On a schedule, a rotation function creates a new version, updates the target, and promotes it.']
  ],
  gotchas: [
    '**Rotation breaks apps that cache forever.** Refresh on auth failure or on a short TTL.',
    '**Rotation functions need network access** to the target (database or API) from their VPC.',
    '**Per-secret monthly fee.** Thousands of tiny secrets cost more than one JSON secret. Parameter Store is cheaper for simple values.',
    'Deleting a secret has a recovery window, and forced immediate deletion cannot be undone.',
    'Do not log secret values, and avoid putting them in environment variables that appear in consoles.'
  ],
  edges: [
    'Secrets can be replicated across Regions for multi-Region apps.',
    'Secret size is bounded; store certificates and large blobs elsewhere.',
    'Resource policies allow cross-account access.'
  ],
  ml: [
    'Credentials for third-party model providers or vector databases (some Bedrock Knowledge Base stores read them from here).',
    'Database credentials for RAG stores and feature pipelines.',
    'Tokens for tools that agents call on a user\'s behalf, with narrow scopes.'
  ],
  pairs: ['kms', 'iam', 'lambda', 'bedrock-kb', 'aurora'],
  cost: 'Per secret per month plus per 10,000 API calls.'
});

S({
  id: 'cognito', cat: 'security', name: 'Amazon Cognito', doc: 'cognito/',
  tag: 'User sign-up, sign-in and tokens for the people using your AI application.',
  what: 'Cognito has two parts. **User pools** are a user directory with sign-up, sign-in, MFA, social and enterprise federation (SAML, OIDC), and they issue **JWT tokens**. **Identity pools** exchange those tokens for temporary **AWS credentials** so a client can call AWS services directly.\n\nA user pool token is usually what you validate in [[apigw|API Gateway]] or your backend to know who is calling and which groups they belong to.',
  flow: ['User signs in', 'User pool', 'JWT (ID + access)', 'API Gateway authoriser', 'Backend knows user'],
  steps: [
    [0, 'The user signs in through the hosted UI or your own front end, with password, social or enterprise login.'],
    [1, 'The user pool verifies them, applying MFA and any Lambda triggers.'],
    [2, 'It returns ID, access and refresh tokens; claims include user ID and groups.'],
    [3, 'The client sends the access token with each API call; the authoriser validates its signature and expiry.'],
    [4, 'The backend uses the claims for authorisation, quotas and data filtering.']
  ],
  gotchas: [
    '**User pools versus identity pools** are the classic confusion: one authenticates users, the other vends AWS credentials.',
    '**Some attributes are immutable** after creation, such as custom attributes\' type and the username. Design the schema up front.',
    '**Tokens expire.** Handle refresh gracefully, especially for long streaming chats.',
    '**Email and SMS delivery have sandbox limits** until you configure production sending.',
    'Machine-to-machine (client credentials) flows are billed separately from user monthly active users.'
  ],
  edges: [
    'Group claims in tokens can be mapped to Knowledge Base metadata filters to enforce per-user document access.',
    'Pre-token-generation Lambda triggers can add custom claims such as tenant ID.',
    'Feature tiers change which security features are available.'
  ],
  ml: [
    'Authenticate end users of an AI assistant and attach tenant and role claims to every request.',
    'Enforce per-user token budgets using the user ID claim as the rate-limit key.',
    'Drive retrieval filters so each user only sees documents they may access.'
  ],
  pairs: ['apigw', 'alb', 'lambda', 'bedrock-kb', 'waf'],
  cost: 'Per monthly active user (tiered by feature set), with extra charges for advanced security features and M2M tokens.'
});

S({
  id: 'waf', cat: 'security', name: 'AWS WAF', doc: 'waf/',
  tag: 'Filter and rate-limit web traffic before it reaches your expensive model endpoints.',
  what: 'WAF inspects HTTP requests with a **web ACL** attached to CloudFront, an ALB, API Gateway (REST), AppSync or a Cognito user pool. Rules can match IPs, geographies, headers and body content, use **managed rule groups** (OWASP-style protections, bot control, IP reputation), and apply **rate-based** limits.\n\nFor AI products, the most valuable job is preventing **denial of wallet**: abusive clients who send unlimited requests to an endpoint that costs money per call.',
  flow: ['Request', 'Web ACL (edge / ALB)', 'Rules in priority order', 'Allow / block / count / CAPTCHA', 'Origin'],
  steps: [
    [0, 'A request arrives at CloudFront, an ALB, or API Gateway.'],
    [1, 'The associated web ACL evaluates it.'],
    [2, 'Rules are checked in priority order: IP sets, rate limits, managed groups, custom rules.'],
    [3, 'The first terminating match decides: allow, block, challenge, or only count.'],
    [4, 'Permitted requests continue to the origin.']
  ],
  gotchas: [
    '**Prompts look like attacks.** User text containing code, SQL or HTML can trigger injection rules and block legitimate chat messages. Start in **count** mode, review matches, and tune exclusions.',
    '**Body inspection is size-limited.** Only the first part of large bodies is inspected by default, so big payloads may skip body rules.',
    '**Rate-based rules key on IP by default.** Users behind a shared NAT get throttled together, and attackers rotate IPs. Add keys such as an API-key or token header where supported.',
    'Rule capacity (WCUs) per web ACL is finite; managed groups consume a lot.'
  ],
  edges: [
    'WAF does not understand prompt injection; use [[bedrock-guardrails|Guardrails]] for model-level threats.',
    'Bot Control and CAPTCHA add per-request charges.',
    'Logging WAF decisions to S3 or CloudWatch is essential for tuning and forensics.'
  ],
  ml: [
    'Rate limit expensive inference routes per client.',
    'Block scraping and automated abuse of free-tier AI features.',
    'Geo-restrict a model API where required by policy.'
  ],
  pairs: ['cloudfront', 'apigw', 'alb', 'cognito', 'bedrock-guardrails'],
  cost: 'Per web ACL and per rule monthly, plus per million requests inspected; bot and fraud features cost extra.'
});

S({
  id: 'macie', cat: 'security', name: 'Amazon Macie', doc: 'macie/',
  tag: 'Finds sensitive data in S3 (PII, credentials, financial data) before it reaches a model.',
  what: 'Macie scans S3 using managed data identifiers (names, addresses, government IDs, card numbers, credentials) and your own custom identifiers, and also assesses bucket security posture. It can run **automated sampling** across your buckets or targeted **discovery jobs**, and publishes **findings** to EventBridge and Security Hub.\n\nIt finds and reports; it does not redact or delete.',
  flow: ['S3 buckets', 'Discovery job', 'Pattern + ML detection', 'Findings', 'EventBridge → action'],
  steps: [
    [0, 'Macie inventories your [[s3]] buckets and their configuration.'],
    [1, 'A discovery job (or automated sampling) scans selected objects.'],
    [2, 'Managed and custom data identifiers detect sensitive types in content.'],
    [3, 'Findings list what was found, where, and how many.'],
    [4, 'Findings flow through [[eventbridge]] to trigger quarantine, tickets or pipeline failure.']
  ],
  gotchas: [
    '**Cost is per GB inspected.** Scanning petabyte lakes in full gets expensive. Sample, or target new data.',
    '**S3 only.** It does not scan databases or logs outside S3.',
    '**Encrypted objects need key access.** Macie\'s role must be allowed on the KMS key.',
    'Supported file types are finite; unsupported formats are skipped.'
  ],
  edges: [
    'Detection is probabilistic. Expect false positives and misses, particularly with custom identifiers.',
    'Multi-account setups use delegated administration through AWS Organizations.'
  ],
  ml: [
    'Gate training and fine-tuning: scan the dataset bucket and fail the pipeline if PII appears.',
    'Scan buckets that hold prompt and response logs.',
    'Audit RAG source buckets so sensitive documents are not ingested into a widely accessible knowledge base.'
  ],
  pairs: ['s3', 'comprehend', 'lakeformation', 'eventbridge', 'kms'],
  cost: 'Per bucket monitored plus per GB of data inspected.'
});
