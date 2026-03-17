# Phase 1 Data Model: Enterprise AWS Infra + CI/CD

## Entity: DeploymentArtifact
- Description: Immutable release object for backend and frontend identified by commit SHA.
- Fields:
  - `sha` (string, required, unique)
  - `backendArtifactKey` (string, required) e.g. `backend/<sha>/app.jar`
  - `frontendBuildVersion` (string, required)
  - `createdAt` (datetime, required)
- Validation:
  - SHA must be 40-char git commit hash.
  - Artifact path must be immutable and append-only.
- Relationships:
  - Referenced by `DeploymentRun`.

## Entity: DeploymentRun
- Description: Execution instance of backend/frontend deployment pipeline.
- Fields:
  - `runId` (string, required)
  - `sha` (string, required)
  - `environment` (enum: `production`, required)
  - `approvedBy` (string, optional)
  - `status` (enum: `pending_approval`, `running`, `success`, `failed`, required)
  - `startedAt` (datetime, required)
  - `finishedAt` (datetime, optional)
- Validation:
  - `approvedBy` required before production deployment execution.
  - `status=success` only when backend and frontend sub-deployments succeed.
- Relationships:
  - One `DeploymentRun` contains one `BackendRollout` and one `FrontendRollout`.

## Entity: BackendRollout
- Description: Per-run backend rollout executed via SSM against EC2 targets.
- Fields:
  - `runId` (string, required)
  - `ssmCommandId` (string, required)
  - `targetTagKey` (string, required)
  - `targetTagValue` (string, required)
  - `totalTargets` (number, required)
  - `failedTargets` (number, required)
- Validation:
  - `failedTargets` must be `0` for run success.
- State transitions:
  - `dispatched -> polling -> success|failed`

## Entity: FrontendRollout
- Description: Per-run static site deployment to S3 + CloudFront invalidation.
- Fields:
  - `runId` (string, required)
  - `bucket` (string, required)
  - `distributionId` (string, required)
  - `invalidationId` (string, required)
  - `status` (enum: `running`, `success`, `failed`, required)
- Validation:
  - CloudFront invalidation ID must exist for successful deployment.

## Entity: EnvironmentContract
- Description: Required GitHub production environment contract values consumed by workflows.
- Fields:
  - `AWS_ROLE_TO_ASSUME` (string, required)
  - `AWS_REGION` (string, required)
  - `ARTIFACT_BUCKET` (string, required)
  - `FRONTEND_S3_BUCKET` (string, required)
  - `CLOUDFRONT_DISTRIBUTION_ID` (string, required)
  - `DEPLOY_TARGET_TAG_KEY` (string, required)
  - `DEPLOY_TARGET_TAG_VALUE` (string, required)
  - `DEPLOY_SERVICE_NAME` (string, required)
  - `BACKEND_BASE_URL` (string, required variable)
  - `APP_ENV` (string, required variable)
- Validation:
  - All required values must be non-empty before deployment starts.

## Entity: RuntimeSecretSet
- Description: Runtime secret references for application startup on EC2 instances.
- Fields:
  - `dbSecretArn` (string, required)
  - `jwtSecretArn` (string, required)
  - `sesSecretArn` (string, required)
  - `rotatedAt` (datetime, optional)
- Validation:
  - Instance IAM role must allow `secretsmanager:GetSecretValue`.
