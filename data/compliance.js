/* AI Compliance, Auditability & Responsible AI Centre.
   Regulatory crosswalks (NIST AI RMF, ISO 42001, EU AI Act, India DPDP Act),
   compliance control matrix, responsible AI dimensions, and audit evidence guidelines. */
window.ATLAS = window.ATLAS || {};
window.ATLAS.compliance = {
  frameworks: [
    {
      id: 'nist-ai-rmf',
      name: 'NIST AI Risk Management Framework (AI RMF 1.0)',
      scope: 'Global / Enterprise Standard',
      pillars: ['GOVERN (Organizational risk culture & policies)', 'MAP (Context & risk identification)', 'MEASURE (Quantitative evaluations & testing)', 'MANAGE (Risk mitigation & production monitoring)'],
      awsMapping: 'AWS Well-Architected GenAI Lens, CloudWatch Model Metrics, Bedrock Guardrails, SageMaker Clarify'
    },
    {
      id: 'iso-42001',
      name: 'ISO/IEC 42001:2023',
      scope: 'International Standard for AI Management Systems (AIMS)',
      pillars: ['AI Policy & Objectives', 'Risk Assessment & Treatment', 'AI System Impact Assessment', 'Data for AI Systems', 'Third-Party AI Supplier Management'],
      awsMapping: 'AWS Artifact compliance reports, AWS Control Tower SCPs, Model Portfolio Registry'
    },
    {
      id: 'eu-ai-act',
      name: 'European Union Artificial Intelligence Act (EU AI Act)',
      scope: 'European Union / Global extraterritorial reach',
      pillars: ['Prohibited Practices', 'High-Risk AI Systems Conformity', 'General Purpose AI (GPAI) Transparency', 'Synthetic Content Watermarking', 'Fundamental Rights Impact Assessment'],
      awsMapping: 'Bedrock Guardrails content safety filters, S3 immutable audit logs, synthetic provenance tags'
    },
    {
      id: 'india-dpdp',
      name: 'India Digital Personal Data Protection Act (DPDP Act 2023)',
      scope: 'Processing of digital personal data within India / extraterritorial targeting',
      pillars: ['Lawful Purpose & Notice', 'Purpose Limitation & Data Minimization', 'Right to Correction & Erasure', 'Breach Notification within 6 hours', 'Significant Data Fiduciary Obligations'],
      awsMapping: 'AWS Asia Pacific (Mumbai ap-south-1 & Hyderabad ap-south-2) data residency, Amazon Macie PII scanning, KMS encryption'
    },
    {
      id: 'soc2',
      name: 'SOC 2 Type II (Trust Services Criteria)',
      scope: 'SaaS & Enterprise B2B Customers',
      pillars: ['Security', 'Availability', 'Processing Integrity', 'Confidentiality', 'Privacy'],
      awsMapping: 'AWS CloudTrail activity logging, KMS Customer Managed Keys, PrivateLink VPC endpoints'
    }
  ],

  controlsMatrix: [
    {
      req: 'Least-Privilege Access Control',
      control: 'IAM roles must restrict model invocation and tool execution to authorized principals with zero wildcard permissions.',
      awsImpl: '[[iam|AWS IAM]] execution roles with resource ARN constraints, [[cognito|Amazon Cognito]] User Pools, and STS Session Policies.',
      evidence: 'IAM Access Analyzer policy verification report, CloudTrail `AssumeRole` audit events.'
    },
    {
      req: 'Encryption at Rest & in Transit',
      control: 'All document embeddings, customer prompts, model checkpoints, and communication channels must be cryptographically encrypted.',
      awsImpl: '[[kms|AWS KMS]] Customer Managed Keys (CMKs) with automated annual rotation; TLS 1.3 enforced on all [[apigw|API Gateway]] and ALB endpoints.',
      evidence: 'AWS Config rule `s3-bucket-server-side-encryption-enabled`, KMS key policy audit.'
    },
    {
      req: 'Data Retention & Right to Erasure',
      control: 'Customer prompts and vector embeddings must be purged upon contract termination or user deletion request.',
      awsImpl: '[[s3|Amazon S3]] Lifecycle expiration rules; [[opensearch|OpenSearch]] document deletion pipeline triggered by user ID.',
      evidence: 'S3 lifecycle configuration JSON, automated deletion integration test logs.'
    },
    {
      req: 'Immutable Activity Logging',
      control: 'Every model call, tool execution, and administrative permission change must be logged to a tamper-proof log archive.',
      awsImpl: '[[cloudtrail|AWS CloudTrail]] multi-region organizational trail delivered to centralized, S3 Object Lock-enabled bucket.',
      evidence: 'CloudTrail log validation cryptographic digests, S3 Object Lock compliance mode certificate.'
    },
    {
      req: 'PII Minimization & Redaction',
      control: 'Personally Identifiable Information must be detected and masked before passing to external LLMs or vector indices.',
      awsImpl: '[[macie|Amazon Macie]] automated bucket scanning and [[bedrock-guardrails|Bedrock Guardrails]] native PII masking filters.',
      evidence: 'Macie sensitive data discovery dashboard, Bedrock Guardrail blocked request metrics.'
    },
    {
      req: 'AI Content Safety & Hallucination Defense',
      control: 'System must intercept harmful queries, hate speech, and hallucinated factual claims before reaching the end user.',
      awsImpl: '[[bedrock-guardrails|Bedrock Guardrails]] content filters, custom regex patterns, and automated Ragas Faithfulness evaluations in CI/CD.',
      evidence: 'Bedrock Guardrail intervention logs, automated test suite evaluation reports in CI/CD.'
    },
    {
      req: 'Human Oversight & Approval for Sensitive Actions',
      control: 'High-risk or irreversible agent actions must require explicit human authorization before execution.',
      awsImpl: '[[stepfunctions|AWS Step Functions]] task token callback workflows, [[sns|Amazon SNS]] human approval alerts.',
      evidence: 'Step Functions execution history showing human approver identity, timestamp, and signed decision.'
    },
    {
      req: 'Model Provenance & Version Traceability',
      control: 'Every AI output must be traceable to the exact model identifier, model version, prompt hash, and retrieved document chunks.',
      awsImpl: 'OpenTelemetry metadata headers logged to [[cloudwatch|CloudWatch]] and [[athena|Athena]] log analytics lake.',
      evidence: 'Athena query output demonstrating end-to-end trace correlation ID linking user request to model response.'
    },
    {
      req: 'Zero-Trust Network Perimeter & Private Ingestion',
      control: 'AI model inference and vector search endpoints must not traverse the public internet; traffic must remain inside dedicated VPCs.',
      awsImpl: '[[privatelink|AWS PrivateLink]], VPC Endpoints for Amazon Bedrock, [[waf|AWS WAF]] on [[apigw|API Gateway]].',
      evidence: 'VPC Route table configuration and Security Group ingress rules verifying no 0.0.0.0/0 route.'
    },
    {
      req: 'Model Vulnerability & Currency Management',
      control: 'All deployed models must be inventoried, patched, and migrated prior to upstream provider end-of-life.',
      awsImpl: 'Central Model Registry in [[dynamodb|DynamoDB]], EventBridge alerts on AWS Bedrock model deprecation announcements.',
      evidence: 'Monthly Model Portfolio Review minutes and migration completion tickets.'
    },
    {
      req: 'Synthetic Content Disclosure & Watermarking',
      control: 'All AI-generated text and media delivered to external users must include machine-readable metadata and disclosure labels.',
      awsImpl: 'API Gateway response headers (`X-AI-Generated: true`) and C2PA cryptographic watermarks on generated media.',
      evidence: 'API integration test assertions verifying mandatory header presence on generated payloads.'
    },
    {
      req: 'Cross-Border Data Residency Enforcement',
      control: 'Customer prompts, fine-tuning datasets, and embeddings must remain within the legal jurisdiction of origination.',
      awsImpl: '[[controltower|AWS Control Tower]] Region Deny SCPs preventing resource provisioning outside authorized AWS Regions.',
      evidence: 'AWS Organizations SCP policy JSON and AWS Config compliance report.'
    }
  ],

  responsibleAI: [
    { dimension: 'Fairness & Bias', requirement: 'Ensure model outputs do not exhibit bias across demographic groups; evaluate with SageMaker Clarify.' },
    { dimension: 'Explainability & Citations', requirement: 'Every generative answer must provide verifiable citations to underlying authoritative documents.' },
    { dimension: 'Transparency & Disclosure', requirement: 'Users must be explicitly informed that they are interacting with an AI system in compliance with the EU AI Act.' },
    { dimension: 'Human Oversight', requirement: 'Humans retain meaningful oversight and veto capability over high-stakes automated decisions.' },
    { dimension: 'Safety & Robustness', requirement: 'Defensive guardrails prevent jailbreaks, prompt injection, and catastrophic failure modes.' },
    { dimension: 'Privacy & Data Protection', requirement: 'Respect data sovereignty, minimize collected data, and ensure zero training on enterprise customer prompts.' },
    { dimension: 'Accountability & Auditability', requirement: 'Clear organizational ownership (RACI) for all AI systems, with immutable audit logs for regulatory review.' },
    { dimension: 'Environmental Sustainability', requirement: 'Optimize compute efficiency, utilize AWS Trainium/Inferentia silicon, and minimize wasted token generation.' }
  ],

  auditEvidenceChecklist: [
    { item: 'Architecture Decision Records (ADRs)', desc: 'Signed ADRs documenting model selection, vector database choice, and tenancy model.' },
    { item: 'System Security Plan & Threat Model', desc: 'Completed STRIDE / OWASP GenAI threat model reviewed by InfoSec team.' },
    { item: 'Data Processing & Flow Diagram', desc: 'Clear visual mapping of data ingestion, encryption boundaries, and zero-data-retention guarantees.' },
    { item: 'Golden Evaluation Test Report', desc: 'Automated evaluation benchmark results demonstrating >= 95% grounding and safety compliance.' },
    { item: 'KMS Key Policy & IAM Role Review', desc: 'Exported IAM least-privilege policies showing scoped resource ARNs and session policy boundaries.' },
    { item: 'CloudTrail & S3 Object Lock Verification', desc: 'Cryptographic proof of immutable audit logs stored in centralized Log Archive AWS account.' },
    { item: 'Disaster Recovery Drill Evidence', desc: 'Report of completed chaos engineering failover drill demonstrating RTO < 5m and RPO < 1m.' }
  ]
};
