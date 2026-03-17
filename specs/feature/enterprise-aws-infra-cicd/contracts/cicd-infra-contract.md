# Contract: Enterprise Infrastructure and CI/CD Interface

## 1. Scope
Defines the required deployment interface between GitHub Actions, Terraform-managed infrastructure, and AWS runtime resources.

## 2. Workflow Interfaces

### CI Workflow Contract (`.github/workflows/ci.yml`)
- Trigger:
  - `pull_request` to `main`
  - `push` to `main`
  - `workflow_dispatch`
- Required stages:
  - Workflow smoke contract assertions
  - Backend test/build
  - Frontend lint/test/build
  - Terraform validate/plan check
- Output contract:
  - Fail-fast if backend or frontend quality gate fails.
  - Fail-fast if long-lived AWS credentials are referenced in workflows.
  - Summary includes status for each stage.

### Backend Deploy Workflow Contract (`.github/workflows/deploy-backend.yml`)
- Trigger:
  - successful `CI` workflow on `main`
  - `workflow_dispatch` with optional `artifactSha`
- Required environment: `production` with approval gate.
- Deployment contract:
  - Build backend jar.
  - Upload to `s3://$ARTIFACT_BUCKET/backend/<sha>/app.jar`.
  - Pass `DB_SECRET_ID`, `JWT_SECRET_ID`, `SES_SECRET_ID`, and `RUNTIME_ENV_PATH` from GitHub environment variables.
  - Run `aws ssm send-command` against targets by tag using the repo deploy script.
  - Restart `$DEPLOY_SERVICE_NAME` and fail workflow if any target fails.
- Rollback contract:
  - Manual rollback by rerunning workflow with known-good `artifactSha`.

### Frontend Deploy Workflow Contract (`.github/workflows/deploy-frontend.yml`)
- Trigger:
  - successful `CI` workflow on `main`
  - `workflow_dispatch` with optional `artifactSha`
- Required environment: `production` with approval gate.
- Deployment contract:
  - Build frontend with environment vars.
  - Sync `frontend/dist` to `s3://$FRONTEND_S3_BUCKET`.
  - Create CloudFront invalidation for `/*`.
- Failure contract:
  - Publish diagnostics and mark run failed.

## 3. Security Contracts

### OIDC Assume-Role Trust Contract
- `aud` must equal `sts.amazonaws.com`.
- `sub` must equal `repo:<owner>/<repo>:environment:production`.
- Deploy role must not be assumable by other repositories/environments.

### Secrets Contract
- Runtime secrets live in AWS Secrets Manager under `khaleo/prod/*`.
- GitHub environment contains deployment secrets/variables only, not long-lived AWS keys.
- Backend EC2 runtime role may read only the three managed Secrets Manager secrets and immutable artifact bucket objects.

## 4. Infrastructure Contracts

### DNS and Routing
- `khaleoshop.click` -> CloudFront distribution.
- `api.khaleoshop.click` -> ALB (with WAF association).

### Backend Runtime Topology
- EC2 instances are in private subnets across 3 AZ.
- ALB resides in public subnets and routes to healthy backend targets.
- EC2 launch template uses an instance profile with `AmazonSSMManagedInstanceCore` and scoped runtime secret access.

## 5. Operational SLO Contracts
- Partial backend target failure MUST fail deployment run.
- Production deployment MUST require explicit approval.
- No automatic rollback on failure.
- All runs MUST include actionable summary metadata (sha, targets, invalidation id).
- Terraform outputs MUST expose CloudFront distribution ID/domain and backend ALB DNS for operator verification.
