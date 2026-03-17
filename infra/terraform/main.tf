locals {
  repo = var.github_repository
  repo_full_name = "${var.github_owner}/${var.github_repository}"

  # Secrets required by current GitHub Actions deploy workflows.
  deployment_environment_secrets = {
    AWS_ROLE_TO_ASSUME         = aws_iam_role.github_actions_deploy.arn
    AWS_REGION                 = var.aws_region
    ARTIFACT_BUCKET            = var.artifact_bucket
    FRONTEND_S3_BUCKET         = var.frontend_bucket
    CLOUDFRONT_DISTRIBUTION_ID = var.cloudfront_distribution_id
    DEPLOY_TARGET_TAG_KEY      = var.deploy_target_tag_key
    DEPLOY_TARGET_TAG_VALUE    = var.deploy_target_tag_value
    DEPLOY_SERVICE_NAME        = var.deploy_service_name
  }
}

resource "aws_s3_bucket" "artifact_bucket" {
  bucket = var.artifact_bucket
}

resource "aws_s3_bucket_public_access_block" "artifact_block" {
  bucket = aws_s3_bucket.artifact_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "artifact_bucket_versioning" {
  bucket = aws_s3_bucket.artifact_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "frontend_bucket" {
  bucket = var.frontend_bucket
}

resource "aws_s3_bucket_public_access_block" "frontend_block" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "frontend_bucket_versioning" {
  bucket = aws_s3_bucket.frontend_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

data "aws_iam_policy_document" "github_actions_oidc_assume_role" {
  statement {
    sid     = "GitHubActionsAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${local.repo_full_name}:environment:${var.github_environment_name}"]
    }
  }
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_actions_deploy" {
  name               = "github-actions-khaleo-prod-role"
  assume_role_policy = data.aws_iam_policy_document.github_actions_oidc_assume_role.json
}

resource "aws_iam_policy" "github_actions_deploy" {
  name = "GitHubActionsKhaLeoDeployPolicy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3ArtifactBucketReadWrite"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:AbortMultipartUpload",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.artifact_bucket}",
          "arn:aws:s3:::${var.artifact_bucket}/*"
        ]
      },
      {
        Sid    = "S3FrontendBucketDeploy"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:AbortMultipartUpload",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.frontend_bucket}",
          "arn:aws:s3:::${var.frontend_bucket}/*"
        ]
      },
      {
        Sid    = "CloudFrontInvalidate"
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
          "cloudfront:GetInvalidation"
        ]
        Resource = "*"
      },
      {
        Sid    = "SsmDeployCommands"
        Effect = "Allow"
        Action = [
          "ssm:SendCommand",
          "ssm:ListCommandInvocations",
          "ssm:GetCommandInvocation",
          "ssm:ListCommands"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:*:document/AWS-RunShellScript",
          "arn:aws:ec2:${var.aws_region}:*:instance/*",
          "arn:aws:ssm:${var.aws_region}:*:command/*"
        ]
      },
      {
        Sid    = "Ec2DescribeForTargetResolution"
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeTags"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach" {
  role       = aws_iam_role.github_actions_deploy.name
  policy_arn = aws_iam_policy.github_actions_deploy.arn
}

# Create Secrets Manager placeholders for runtime secrets (no secret string supplied)
resource "aws_secretsmanager_secret" "db_credentials" {
  name = "khaleo/prod/db-credentials"
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "khaleo/prod/jwt-secret"
}

resource "aws_secretsmanager_secret" "ses_credentials" {
  name = "khaleo/prod/ses-credentials"
}

### GitHub environment
resource "github_repository_environment" "production" {
  repository  = local.repo
  environment = var.github_environment_name
}

resource "github_actions_environment_secret" "deployment" {
  for_each = local.deployment_environment_secrets

  repository      = local.repo
  environment     = github_repository_environment.production.environment
  secret_name     = each.key
  plaintext_value = tostring(each.value)
}

resource "github_actions_environment_secret" "manual_placeholders" {
  for_each = toset(var.github_manual_environment_secrets)

  repository      = local.repo
  environment     = github_repository_environment.production.environment
  secret_name     = each.value
  plaintext_value = var.placeholder_secret_value

  # Allow manual updates in GitHub UI without Terraform overwriting them.
  lifecycle {
    ignore_changes = [plaintext_value]
  }
}

output "deploy_artifact_bucket" {
  description = "S3 bucket used for immutable backend artifacts"
  value       = var.deploy_artifact_bucket
}

output "deploy_target_tag" {
  description = "EC2 tag selector used by deployment workflow"
  value = {
    key   = var.deploy_target_tag_key
    value = var.deploy_target_tag_value
  }
}
