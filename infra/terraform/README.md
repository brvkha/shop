Terraform bootstrap for CI/CD resources

Overview
--
This folder contains Terraform configuration to create minimal infra and GitHub placeholders needed to run the CI/CD workflows added to the repo.

What it creates
- S3 buckets for backend artifacts and frontend static site (no public policy added).
- IAM OIDC provider for GitHub Actions and deploy IAM role `github-actions-khaleo-prod-role`.
- SecretsManager secret placeholders for `khaleo/prod/*` runtime secrets.
- GitHub `production` environment and environment-level deploy secrets used by workflows (`AWS_ROLE_TO_ASSUME`, `AWS_REGION`, `ARTIFACT_BUCKET`, `FRONTEND_S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, `DEPLOY_TARGET_TAG_KEY`, `DEPLOY_TARGET_TAG_VALUE`, `DEPLOY_SERVICE_NAME`).
- Additional app/runtime placeholder secrets in GitHub environment (`TO_BE_SET` by default) so you can fill them manually after apply.

Prerequisites
- `terraform` v1.2+
- AWS CLI configured (or environment variables/profile that can run `terraform apply`)
- GitHub CLI `gh` or a `GITHUB_TOKEN` with repo admin privileges exported as `GH_TOKEN` or `GITHUB_TOKEN` environment variable.

Quick run steps (LOCAL, manual approval required)

1. Export required env vars (example PowerShell):

```powershell
$env:AWS_PROFILE = 'default'
$env:AWS_REGION = 'ap-southeast-1'
$env:GITHUB_TOKEN = '<your-personal-access-token-with-repo_scope>'
```

2. Initialize Terraform and inspect plan:

```powershell
cd infra/terraform
terraform init
terraform plan -var "github_owner=<your-github-owner>" -var "github_repository=<your-repo-name>" -var "artifact_bucket=<your-artifact-bucket>" -var "frontend_bucket=<your-frontend-bucket>"
```

3. Apply the plan (review carefully):

```powershell
terraform apply -var "github_owner=<your-github-owner>" -var "github_repository=<your-repo-name>" -var "artifact_bucket=<your-artifact-bucket>" -var "frontend_bucket=<your-frontend-bucket>"
```

4. After `apply` completes:
- Deploy workflow secrets are already created in GitHub `production` environment by Terraform.
- You only need to open GitHub Environment secrets and replace app/runtime placeholders currently set to `TO_BE_SET`.

How to replace runtime placeholders after apply

Using GitHub CLI (`gh`):

```powershell
gh auth login --with-token < .github-token-file
gh secret set SPRING_DATASOURCE_URL --body "<jdbc-url>" --repo <owner>/<repo> --env production
gh secret set SPRING_DATASOURCE_USERNAME --body "<db-username>" --repo <owner>/<repo> --env production
gh secret set SPRING_DATASOURCE_PASSWORD --body "<db-password>" --repo <owner>/<repo> --env production
gh secret set JWT_SECRET --body "<jwt-secret>" --repo <owner>/<repo> --env production
gh secret set SES_ACCESS_KEY_ID --body "<ses-access-key-id>" --repo <owner>/<repo> --env production
gh secret set SES_SECRET_ACCESS_KEY --body "<ses-secret-access-key>" --repo <owner>/<repo> --env production
```

Notes and security
- Terraform state will contain resource identifiers and ARNs. Do not commit `terraform.tfstate` and protect the state file if remote backends are used.
- Consider using a remote state backend (S3 + DynamoDB lock) with encryption for team usage.
- Deploy workflows use short-lived AWS credentials from OIDC; no long-lived AWS access key is required in GitHub secrets.

This setup is intended for one-click bootstrap: `terraform apply` provisions infra + deploy secrets, then you only fill application secrets in GitHub Environment.
