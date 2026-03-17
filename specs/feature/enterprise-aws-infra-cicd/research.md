# Phase 0 Research: Enterprise AWS Infra + CI/CD

## Decision 1: Backend deployment runtime and release unit
- Decision: Use immutable JAR deployment to EC2 via SSM (`send-command`) with `systemd` service restart.
- Rationale: Existing workflows and scripts already implement this pattern, minimizing migration risk and preserving rollback-by-SHA behavior.
- Alternatives considered:
  - ECR container rollout on EC2: better container standardization but more moving parts now.
  - ECS/EKS migration: higher operational complexity not required for current 50/30 target.

## Decision 2: CI/CD authentication model
- Decision: GitHub Actions OIDC role assumption only.
- Rationale: Eliminates long-lived AWS keys and aligns with security constitution and current Terraform IAM trust model.
- Alternatives considered:
  - Static `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`: rejected due to credential lifecycle risk.

## Decision 3: Production deployment governance
- Decision: Keep manual approval gate on GitHub `production` environment and fail runs on partial deploy failures (no auto-rollback).
- Rationale: Provides explicit release control and auditable approvals while avoiding unsafe automatic rollback behavior.
- Alternatives considered:
  - Fully automatic deploy after CI: rejected due to governance requirements.
  - Automatic rollback: rejected because partial rollback can mask root cause and cause version skew.

## Decision 4: AWS edge and network topology
- Decision: Route53 for DNS, CloudFront+S3 for frontend, WAF+ALB for backend entry, backend compute in private subnets across 3 AZ.
- Rationale: Matches constitutional architecture and provides resilience across AZ failures.
- Alternatives considered:
  - Single-AZ backend: rejected for lower availability.
  - Public EC2 without ALB: rejected for weaker security and scaling controls.

## Decision 5: Runtime secret management
- Decision: Store DB/JWT/SES runtime secrets in Secrets Manager and grant read via EC2 instance role.
- Rationale: Keeps secrets out of repository and deployment logs while allowing controlled rotation.
- Alternatives considered:
  - GitHub Environment secrets as runtime source: rejected for instance runtime coupling and rotation friction.

## Decision 6: Infrastructure source of truth and drift handling
- Decision: Terraform remains authoritative for all managed AWS and GitHub deployment contract resources; add CI `terraform validate` and plan checks.
- Rationale: Consistent declarative governance with early drift detection.
- Alternatives considered:
  - Mixed console/manual changes: rejected due to drift and poor reproducibility.
