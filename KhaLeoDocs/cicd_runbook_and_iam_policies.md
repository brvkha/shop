# Kha Leo CI/CD Runbook and IAM Policies

## 1. Scope

This runbook configures automated CI/CD for:

- Backend deployment to EC2 private instances via SSM.
- Frontend deployment to S3 static hosting + CloudFront invalidation.
- Push-to-main flow with production approval gate in GitHub Environments.

## 2. Workflow Topology

- `.github/workflows/ci.yml`
  - Runs backend tests/build and frontend lint/build on PR and push to `main`.
- `.github/workflows/deploy-backend.yml`
  - Triggers on successful `CI` workflow on `main` and supports manual `workflow_dispatch` by commit SHA.
  - Requires production environment approval.
- `.github/workflows/deploy-frontend.yml`
  - Triggers on successful `CI` workflow on `main` and supports manual `workflow_dispatch` by commit SHA.
  - Requires production environment approval.

## 3. Required GitHub Environment Secrets (`production`)

Set these environment secrets in GitHub `production`:

- `AWS_ROLE_TO_ASSUME` (`arn:aws:iam::817888697629:role/github-actions-khaleo-prod-role`)
- `AWS_REGION`
- `ARTIFACT_BUCKET`
- `DEPLOY_TARGET_TAG_KEY`
- `DEPLOY_TARGET_TAG_VALUE`
- `DEPLOY_SERVICE_NAME`
- `FRONTEND_S3_BUCKET`
- `CLOUDFRONT_DISTRIBUTION_ID`

## 4. Required GitHub Variables

Set these variables (environment-scoped recommended):

- `JAVA_VERSION` (example: `17`)
- `NODE_VERSION` (example: `20`)
- `BACKEND_BASE_URL` (example: `https://api.khaleoshop.click`)
- `APP_ENV` (example: `production`)

## 5. IAM Setup Model

This project uses GitHub Actions OIDC role assumption (no long-lived AWS keys):

- IAM role: `github-actions-khaleo-prod-role`
- OIDC provider: `arn:aws:iam::817888697629:oidc-provider/token.actions.githubusercontent.com`
- Trust policy scope should pin repo/environment (`repo:brvkha/KhaLeo:environment:production`).

## 6. Exact IAM Policy for GitHub Actions Role

Replace placeholders before applying:

- `<ACCOUNT_ID>`
- `<AWS_REGION>`
- `<ARTIFACT_BUCKET>`
- `<FRONTEND_BUCKET>`
- `<CLOUDFRONT_DISTRIBUTION_ID>`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ArtifactBucketReadWrite",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:AbortMultipartUpload",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::<ARTIFACT_BUCKET>",
        "arn:aws:s3:::<ARTIFACT_BUCKET>/*"
      ]
    },
    {
      "Sid": "S3FrontendBucketDeploy",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::<FRONTEND_BUCKET>",
        "arn:aws:s3:::<FRONTEND_BUCKET>/*"
      ]
    },
    {
      "Sid": "CloudFrontInvalidate",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::<ACCOUNT_ID>:distribution/<CLOUDFRONT_DISTRIBUTION_ID>"
    },
    {
      "Sid": "SsmDeployCommands",
      "Effect": "Allow",
      "Action": [
        "ssm:SendCommand",
        "ssm:ListCommandInvocations",
        "ssm:GetCommandInvocation",
        "ssm:ListCommands"
      ],
      "Resource": [
        "arn:aws:ssm:<AWS_REGION>:<ACCOUNT_ID>:document/AWS-RunShellScript",
        "arn:aws:ec2:<AWS_REGION>:<ACCOUNT_ID>:instance/*",
        "arn:aws:ssm:<AWS_REGION>:<ACCOUNT_ID>:command/*"
      ]
    },
    {
      "Sid": "Ec2DescribeForTargetResolution",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeTags"
      ],
      "Resource": "*"
    }
  ]
}
```

## 7. IAM Policy for EC2 Instance Role (Runtime Secrets)

Attach this to the backend EC2 instance role for runtime secret retrieval from Secrets Manager.

Replace placeholders:

- `<AWS_REGION>`
- `<ACCOUNT_ID>`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadRuntimeSecrets",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:<AWS_REGION>:<ACCOUNT_ID>:secret:khaleo/prod/*"
      ]
    },
    {
      "Sid": "DecryptSecretsManagerKms",
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": "secretsmanager.<AWS_REGION>.amazonaws.com"
        }
      }
    }
  ]
}
```

## 8. Create GitHub Environment Gate

Create environment `production` in GitHub and require manual reviewers.

This enforces:

- CI runs automatically.
- Deploy workflows pause for approval before touching production.

Recommended minimum gate:

- At least 1 required reviewer.
- Prevent self-review for approver account.
- Restrict deployment branch to `main`.

## 9. Deployment Operations

### 9.1 Standard release (push to main)

1. Merge PR into `main`.
2. Confirm `CI` completes successfully.
3. Approve `production` environment when prompted.
4. Confirm both deploy workflows succeed.

### 9.2 Manual redeploy by commit SHA

Use `workflow_dispatch` input `artifactSha` in each deploy workflow.

### 9.3 Manual rollback

1. Pick known-good commit SHA.
2. Run `Deploy Backend` with `artifactSha`.
3. Run `Deploy Frontend` with `artifactSha`.
4. Verify health and UI availability.

## 10. Verification Checklist

- Backend deploy summary shows all targets and `Failed targets: 0`.
- Frontend deploy summary shows successful CloudFront invalidation ID.
- `/actuator/health` is UP on backend.
- Frontend loads and API calls succeed.

## 11. Troubleshooting

- AccessDenied on S3 upload: check bucket ARN scope in IAM policy.
- No SSM targets updated: check `DEPLOY_TARGET_TAG_KEY` and `DEPLOY_TARGET_TAG_VALUE`.
- Frontend changes not visible: verify CloudFront invalidation completed and origin points to correct bucket.
- Missing runtime env values: check secret names under `khaleo/prod/*` and EC2 role policy attachment.
