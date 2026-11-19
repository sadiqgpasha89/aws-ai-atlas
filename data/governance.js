/* Enterprise AI Security, Governance & AWS Well-Architected Framework */
window.ATLAS.governance = {
  "landingZones": {
    "title": "Enterprise AI Landing Zones & AWS Well-Architected Framework",
    "intro": "The AWS Well-Architected Framework for Generative AI recommends extending multi-account AWS Control Tower landing zones rather than creating an isolated AI silo. An AI workload relies on enterprise identity, network connectivity, centralized logging and policy guardrails.",
    "principles": [
      {
        "name": "Extend, Do Not Fork, Landing Zones",
        "desc": "Incorporate AI platform resources into established AWS Organizations and multi-account hierarchies. AI is an application workload, not an alternative cloud platform."
      },
      {
        "name": "Shared Platform vs Workload Accounts",
        "desc": "Separate central shared platform services (API gateways, foundational model provisioned capacity, central ECR registries) from decentralized application workload accounts (feature development, prompt engineering)."
      },
      {
        "name": "Zero Trust Network Architecture",
        "desc": "No public IPs or endpoints on AI services. Enforce AWS PrivateLink interface endpoints, route all outbound traffic through AWS Network Firewall, and use Amazon Route 53 private hosted zones."
      },
      {
        "name": "Policy-Driven Governance",
        "desc": "Enforce security controls programmatically via Service Control Policies (SCPs) and AWS Config conformance packs rather than manual review gates."
      }
    ],
    "hierarchy": [
      {
        "level": "Organization Management Account",
        "scope": "Enterprise Root",
        "purpose": "Defines global compliance Service Control Policies (SCPs), root IAM permissions, and consolidated billing accounts."
      },
      {
        "level": "Core Services / Security OU",
        "scope": "Security · Log Archive · Network Hub",
        "purpose": "Hosts central AWS Transit Gateway, AWS Network Firewall, central Amazon S3 log buckets, and AWS CloudTrail aggregation."
      },
      {
        "level": "AI Platform / Shared Services OU",
        "scope": "Bedrock Provisioned Capacity · Central APIGW",
        "purpose": "Hosts enterprise AI gateways ([[apigw]]), shared provisioned model throughput (PTUs), centralized container registries, and enterprise knowledge bases in [[opensearch]]."
      },
      {
        "level": "Workload Application OUs",
        "scope": "Business Units & Application Teams",
        "purpose": "Subdivided into Development, Staging, and Production workload accounts. Each team receives isolated AWS accounts for prompt testing, agent development, and RAG experimentation."
      },
      {
        "level": "Sandbox OU",
        "scope": "Isolated R&D",
        "purpose": "Strictly budgeted, network-isolated environments for rapid model prototyping with automated monthly spend caps via [[budgets]] and auto-destruction policies."
      }
    ],
    "networkTopology": {
      "type": "Hub-and-Spoke with AWS Transit Gateway",
      "components": [
        {
          "name": "Hub VPC",
          "desc": "Hosts AWS Network Firewall, Application Load Balancers with AWS WAF, AWS Direct Connect / VPN gateways, and Route 53 Resolver."
        },
        {
          "name": "AI Spoke VPCs",
          "desc": "Isolated spoke VPCs for AI workloads (EKS model clusters, ECS agent runtimes, SageMaker notebook pools)."
        },
        {
          "name": "VPC Endpoints (PrivateLink)",
          "desc": "Every AWS service (Bedrock, OpenSearch Serverless, S3, DynamoDB, Secrets Manager) projects a private IP into dedicated subnets."
        },
        {
          "name": "Transit Gateway Route Tables",
          "desc": "Force all spoke outbound traffic (`0.0.0.0/0`) through AWS Network Firewall for FQDN filtering and exfiltration prevention."
        }
      ]
    }
  },
  "securityFramework": {
    "title": "Enterprise AI Security Framework",
    "intro": "A defense-in-depth model mapping security controls across every layer of the generative AI stack, grounded in the AWS Well-Architected Framework for Generative AI.",
    "pillars": [
      {
        "id": "identity",
        "name": "1. Identity & Access Management",
        "controls": [
          "**Disable Long-Lived API Keys:** Never issue long-lived IAM access keys for developers or applications. Enforce AWS IAM Identity Center and short-lived STS credentials.",
          "**IAM Execution Roles:** Workloads authenticate between services (e.g. Lambda -> Bedrock, ECS -> OpenSearch) using dedicated, narrow IAM execution roles.",
          "**Workload Identity Federation:** CI/CD pipelines (GitHub Actions, GitLab) authenticate to AWS via OpenID Connect (OIDC) without long-lived secrets.",
          "**Delegated User Authorization:** Propagate end-user [[cognito]] OAuth2 bearer tokens so agent tools and RAG retrieval act with user permissions, not administrative privileges."
        ]
      },
      {
        "id": "authorization",
        "name": "2. Fine-Grained RBAC & Tool Permissions",
        "controls": [
          "**Least-Privilege Action Groups:** Restrict [[bedrock-agents]] action groups to specific Lambda function ARNs with granular invocation permissions.",
          "**Tool-Level Permission Boundaries:** Agent tools hosted as [[lambda]] functions must validate JWT bearer tokens and check caller security scopes before executing business actions.",
          "**Server-Side Parameter Validation:** Tools must strictly validate argument schemas server-side using JSON Schema to prevent parameter tampering or prompt-induced SQL injection."
        ]
      },
      {
        "id": "data",
        "name": "3. Data Security & Cryptography",
        "controls": [
          "**Customer-Managed Keys (CMK):** Encrypt data at rest in [[s3]], [[opensearch]], and [[dynamodb]] with customer-managed keys held in [[kms|AWS KMS]].",
          "**Zero Customer Data Retention (ZCDR):** Contractually confirm with AWS that foundation model prompts and completions are never logged or stored for model training.",
          "**Automated PII Masking:** Use [[macie|Amazon Macie]] and Bedrock Guardrails to detect and redact sensitive personal, healthcare, or financial identifiers before prompts enter model context."
        ]
      },
      {
        "id": "rag-security",
        "name": "4. Document-Level Security in RAG",
        "controls": [
          "**Security Trimming:** Tag chunks in [[opensearch]] with Cognito user and security group identifiers (SIDs).",
          "**Mandatory Server-Side Filter Injection:** Inject security filters (`terms: { security_groups: userGroups }`) at the backend search proxy layer. Never trust frontend filters.",
          "**Pre-Signed S3 URLs:** Serve raw document downloads using short-lived (5-minute) pre-signed S3 URLs verified against the user storage permissions."
        ]
      },
      {
        "id": "agent-security",
        "name": "5. Agentic Security & Autonomy Controls",
        "controls": [
          "**Human-in-the-Loop (HITL) Approval Gates:** Mandate human authorization (via [[stepfunctions]] task tokens) for all external writes, financial transactions, or customer-facing notifications.",
          "**Container Sandboxing:** Execute dynamic Python code generated by models inside ephemeral, network-isolated sandboxes with restricted disk and CPU limits.",
          "**Hard Iteration & Budget Caps:** Enforce hard stops (max 5 tool turns, 60s timeout, 10,000 tokens) per agent task to prevent infinite loops."
        ]
      },
      {
        "id": "prompt-security",
        "name": "6. Prompt Security & Guardrails",
        "controls": [
          "**Bedrock Guardrails Prompt Shields:** Screen incoming prompts for direct jailbreak attempts and system prompt extraction attacks using [[bedrock-guardrails]].",
          "**Indirect Injection Defenses:** Screen untrusted retrieved documents and tool outputs for embedded instructions designed to hijack agent reasoning.",
          "**Delimited System Prompts:** Isolate external content inside unambiguous XML delimiters (`<untrusted_context>`) with explicit model instructions to ignore instructions inside tags."
        ]
      },
      {
        "id": "network",
        "name": "7. Network Security & Perimeter Defense",
        "controls": [
          "**AWS PrivateLink VPC Endpoints:** Expose all AWS AI services exclusively on private IP addresses within virtual private clouds.",
          "**Outbound Egress Whitelisting:** Enforce FQDN filtering via AWS Network Firewall to prevent compromised agents or models from transmitting data to external endpoints.",
          "**Layer 7 WAF:** Front user-facing web applications with [[waf|AWS WAF]] rules blocking OWASP Top 10 vulnerabilities and rate-limiting abusive IP addresses."
        ]
      },
      {
        "id": "governance",
        "name": "8. AI Red Teaming & Continuous Governance",
        "controls": [
          "**Continuous Adversarial Testing:** Conduct automated red-teaming sweeps simulating jailbreaks, data exfiltration, and prompt injection before every production release.",
          "**Immutable Audit Trails:** Record every model call, prompt hash, tool execution, and approval event to an immutable [[cloudtrail]] and [[cloudwatch]] log stream.",
          "**Responsible AI Verification:** Review AI capabilities against fairness, transparency, and accountability checklists before production sign-off."
        ]
      }
    ]
  },
  "tenancyModels": {
    "title": "Enterprise Multi-Tenancy Architecture Patterns",
    "models": [
      {
        "name": "Pooled / Shared Index (Logical Isolation)",
        "fit": "Standard B2B SaaS with hundreds or thousands of low-to-medium risk customers.",
        "mechanism": "Single [[opensearch]] index; documents carry `tenant_id` metadata; gateway injects mandatory search filters.",
        "pros": "Lowest infrastructure cost; instant tenant onboarding; scales to millions of documents.",
        "cons": "Logical isolation only; bugs in filter injection could leak data across tenants; shared noisy-neighbor capacity."
      },
      {
        "name": "Index-per-Tenant (Isolated Index)",
        "fit": "Moderate tenant counts (50-200) requiring custom schemas or fast one-click tenant deletion.",
        "mechanism": "Dedicated search index per customer inside a shared OpenSearch Serverless collection.",
        "pros": "Strong logical separation; distinct schemas per customer; easy tenant deletion and data export.",
        "cons": "Bounded by collection index limits; cost accumulates across multiple collections."
      },
      {
        "name": "Collection-per-Tenant (Physical Isolation)",
        "fit": "Regulated enterprise tiers, government clients, or contracts mandating dedicated compute.",
        "mechanism": "Dedicated [[opensearch]] collection and dedicated S3 bucket in a dedicated AWS account per tenant.",
        "pros": "Complete physical isolation; customer-managed encryption keys per tenant; zero noisy-neighbor interference.",
        "cons": "Highest cost ($350 - $1,500+/mo per tenant); high operational overhead to provision and upgrade."
      }
    ]
  },
  "policyInitiatives": {
    "title": "Recommended AWS Service Control Policies (SCPs) & Config Rules for AI",
    "policies": [
      {
        "name": "Deny Bedrock API Calls from Outside VPC Endpoints",
        "effect": "Deny",
        "purpose": "Ensures no developer or application can invoke Bedrock model APIs over the public internet."
      },
      {
        "name": "Require Customer-Managed Keys (CMK) on S3 AI Buckets",
        "effect": "Deny",
        "purpose": "Guarantees that all document storage buckets and search data are encrypted using AWS KMS keys."
      },
      {
        "name": "Restrict Approved Bedrock Foundation Model IDs",
        "effect": "Deny",
        "purpose": "Restricts model invocations in Bedrock to an approved corporate catalog (e.g. Claude 3.5 Sonnet, Nova Pro, Titan)."
      },
      {
        "name": "Enforce Mandatory Cost Center & Owner Resource Tags",
        "effect": "Deny",
        "purpose": "Blocks resource creation if mandatory resource attribution tags (`costCenter`, `owner`, `environment`) are missing."
      },
      {
        "name": "Enforce CloudTrail Logging to Central S3 Bucket",
        "effect": "Deny",
        "purpose": "Blocks any action that attempts to disable or modify CloudTrail audit logging across all accounts."
      }
    ]
  },
  "policyInitiative": {
    "title": "Recommended AWS Service Control Policies (SCPs) & Config Rules for AI",
    "policies": [
      {
        "name": "Deny Bedrock API Calls from Outside VPC Endpoints",
        "effect": "Deny",
        "purpose": "Ensures no developer or application can invoke Bedrock model APIs over the public internet."
      },
      {
        "name": "Require Customer-Managed Keys (CMK) on S3 AI Buckets",
        "effect": "Deny",
        "purpose": "Guarantees that all document storage buckets and search data are encrypted using AWS KMS keys."
      },
      {
        "name": "Restrict Approved Bedrock Foundation Model IDs",
        "effect": "Deny",
        "purpose": "Restricts model invocations in Bedrock to an approved corporate catalog (e.g. Claude 3.5 Sonnet, Nova Pro, Titan)."
      },
      {
        "name": "Enforce Mandatory Cost Center & Owner Resource Tags",
        "effect": "Deny",
        "purpose": "Blocks resource creation if mandatory resource attribution tags (`costCenter`, `owner`, `environment`) are missing."
      },
      {
        "name": "Enforce CloudTrail Logging to Central S3 Bucket",
        "effect": "Deny",
        "purpose": "Blocks any action that attempts to disable or modify CloudTrail audit logging across all accounts."
      }
    ]
  }
};
