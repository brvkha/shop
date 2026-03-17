# Quickstart: Enterprise AWS Infra + CI/CD Automation

## 1. Prerequisites

- AWS account with permissions for VPC, ALB, EC2, Route53, CloudFront, S3, IAM, WAF, Aurora, DynamoDB, Secrets Manager.
- Registered domain in Route53: `khaleoshop.click`.
- GitHub repository with `production` environment and required reviewers configured.
- Terraform >= 1.2.0.

## 2. Terraform Variables

Create `infra/terraform/terraform.tfvars` (or environment-specific tfvars):

```hcl
aws_region                   = "ap-southeast-1"
github_owner                 = "<your-github-user-or-org>"
github_repository            = "KhaLeo"
github_environment_name      = "production"
artifact_bucket              = "khaleo-prod-artifacts"
frontend_bucket              = "khaleo-prod-frontend"
cloudfront_distribution_id   = "<from-cloudfront>"
deploy_target_tag_key        = "Role"
deploy_target_tag_value      = "khaleo-backend"
deploy_service_name          = "flashcard-backend"
```

## 3. Terraform Apply

```bash
cd infra/terraform
terraform init
terraform validate
terraform plan -out tfplan
terraform apply tfplan
```

Collect outputs and verify:

- `github_actions_role_arn`
- `github_environment_name`
- `artifact_bucket`
- `frontend_bucket`

## 4. GitHub Environment Setup

Environment: `production`

Secrets:

- `AWS_ROLE_TO_ASSUME` = Terraform output `github_actions_role_arn`
- `AWS_REGION` = `ap-southeast-1`
- `ARTIFACT_BUCKET`
- `FRONTEND_S3_BUCKET`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `DEPLOY_TARGET_TAG_KEY`
- `DEPLOY_TARGET_TAG_VALUE`
- `DEPLOY_SERVICE_NAME`

Variables:

- `BACKEND_BASE_URL` = `https://api.khaleoshop.click`
- `APP_ENV` = `production`
- `JAVA_VERSION` = `17`
- `NODE_VERSION` = `20`

## 5. Validate OIDC Trust Scope

Trust policy should contain:

- `aud` = `sts.amazonaws.com`
- `sub` = `repo:<owner>/KhaLeo:environment:production`

## 6. Trigger Deployment

- Push to `main` -> CI runs automatically.
- If CI passes -> deploy workflows await `production` approval.
- Approve deploy in GitHub UI.
- Verify:
  - Frontend: `https://khaleoshop.click`
  - Backend health: `https://api.khaleoshop.click/actuator/health`

## 7. Rollback

- Re-run backend deploy workflow via `workflow_dispatch` with known-good `artifactSha`.
- Re-run frontend deploy with same SHA for consistency.
