# Quickstart Validation Status

Date: 2026-03-17
Feature: enterprise-aws-infra-cicd

## Commands Executed Locally

- `terraform fmt -recursive`
- `terraform validate`
- `terraform init -input=false`
- `aws sts get-caller-identity`
- `terraform plan -out tfplan -input=false` (with required `TF_VAR_*` values for owner/repo/buckets)
- `terraform apply -input=false tfplan`
- `terraform plan -out tfplan-live2 -input=false`
- `terraform apply tfplan-live2`
- `aws ssm get-parameter --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64`
- Re-run plan attempts with corrected `GH_TOKEN` + `TF_VAR_*` formatting and `TF_VAR_backend_ami_id`
- `terraform plan -no-color -refresh=false -out tfplan-final -var github_owner=brvkha -var github_repository=KhaLeo -var artifact_bucket=kha-leo-build-artifacts -var frontend_bucket=khaleo-frontend-prod -var backend_ami_id=ami-0be9cb9f67c8dabd6`
- `terraform apply -no-color tfplan-final`
- `terraform output -json`
- `aws cloudfront list-distributions --query "DistributionList.Items[].[Id,Status,DomainName]" --output table`
- `aws elbv2 describe-load-balancers ...`
- `aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names khaleo-backend-asg ...`
- GitHub Actions API workflow dispatch attempts for `deploy-backend.yml` and `deploy-frontend.yml`
- `terraform test tests/backend_topology_validation.tftest.hcl`
- `terraform test tests/oidc_trust_validation.tftest.hcl` (runner did not isolate to a single file; see blocker)
- Backend workflow contract tests
- Frontend workflow contract tests

## Outcome

- Local Terraform formatting and configuration validation passed.
- Terraform initialization passed.
- AWS credentials are active in this terminal (`arn:aws:iam::817888697629:user/khaleo1`).
- GitHub token authentication was supplied and accepted (Terraform proceeded past earlier 401 authentication failures).
- Clean live Terraform execution succeeded:
	- `terraform plan` exited `0` and produced `tfplan-final`.
	- `terraform apply` completed successfully.
	- Terraform summary: `Apply complete! Resources: 21 added, 2 changed, 1 destroyed.`
- Backend topology Terraform contract test passed.
- Backend runtime secret access integration test passed.
- Workflow contract tests for US1 and US3 passed.
- Live `terraform apply` reached real resource mutation (VPC, subnets, ALB, WAF, NAT, route tables, instance profile, and GitHub environment secret resources).
- One earlier live apply attempt failed with concrete errors captured in `infra/terraform/apply-output-cmd2.log`:
	- GitHub provider requests were made against `repos/brvkha%20/KhaLeo` (owner value included trailing whitespace in one attempt), returning 404.
	- Bucket names were interpreted with trailing whitespace in one attempt (`kha-leo-build-artifacts ` and `khaleo-frontend-prod `), failing S3 name validation.
	- Backend launch template AMI default (`ami-0c02fb55956c7d316`) is invalid in `ap-southeast-1`; latest AL2023 AMI resolved as `ami-0be9cb9f67c8dabd6`.
- Corrected rerun succeeded and produced verified outputs in `infra/terraform/tf-output-final.json`:
	- `cloudfront_distribution_id = E38IV1662DB13U`
	- `cloudfront_distribution_domain_name = d2wbaiqm7ws2ha.cloudfront.net`
	- `backend_alb_dns_name = khaleo-backend-alb-229921275.ap-southeast-1.elb.amazonaws.com`
	- `github_actions_role_arn = arn:aws:iam::817888697629:role/github-actions-khaleo-prod-role`
	- Secrets ARNs exported for DB/JWT/SES.
- Runtime verification after apply:
	- CloudFront distributions include `E38IV1662DB13U` in `Deployed` status.
	- ALB `khaleo-backend-alb` is `active`.
	- ASG `khaleo-backend-asg` exists with desired capacity `3` and instance state `InService`.
- Deployment workflow dispatch attempts failed with GitHub API `403 Resource not accessible by personal access token` for both backend and frontend workflow_dispatch endpoints.
- Latest GitHub Actions deploy-run check shows no new dispatch-created deploy runs; most recent `Deploy Backend` run is `completed/failure` (event `push`).
- Manual workflow evidence from operator-triggered runs:
	- Backend run failed: https://github.com/brvkha/KhaLeo/actions/runs/23186187892
	- Frontend run succeeded: https://github.com/brvkha/KhaLeo/actions/runs/23186072895
- Backend failure root cause confirmed from SSM command `6ee25ccd-37ac-465d-85da-74f1a6b3ebd1`:
	- All targets failed with `Failed to restart flashcard-backend.service: Unit flashcard-backend.service not found.`
- Remediation implemented in repo:
	- Updated `backend/scripts/deploy-via-ssm.sh` to auto-create and enable `${SERVICE_NAME}.service` if missing before restart.
	- Verified deploy/security integration contracts still pass (5 tests passed).

## Remaining Live Validation

- Re-run backend deployment workflow after script fix merge to `main`, then approve production gate and confirm target success.
- Capture updated backend run summary (failed targets must be `0`) and pair it with successful frontend run evidence.
- Full `terraform test` execution for all Terraform contract test files in this terminal session

## Blocker

Terraform plan/apply is no longer blocked.

Current blocker for end-to-end T035 completion is GitHub token authorization for workflow dispatch: API calls to create `deploy-backend.yml` and `deploy-frontend.yml` runs returned `403 Resource not accessible by personal access token`.

To complete deploy evidence capture, run `Deploy Backend` again from GitHub UI (or use a token with Actions workflow-dispatch permission) after merging the script fix, then approve the `production` environment gate and record backend/frontend run summaries.

In addition, `terraform test` in this local terminal repeatedly executed the full test set and stalled while reaching `network_dns_validation.tftest.hcl`, so only partial Terraform test evidence is available locally.