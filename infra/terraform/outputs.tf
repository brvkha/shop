output "artifact_bucket" {
  description = "Name of the artifact S3 bucket"
  value       = aws_s3_bucket.artifact_bucket.id
}

output "frontend_bucket" {
  description = "Name of the frontend S3 bucket"
  value       = aws_s3_bucket.frontend_bucket.id
}

output "github_actions_role_arn" {
  description = "IAM role ARN assumed by GitHub Actions using OIDC"
  value       = aws_iam_role.github_actions_deploy.arn
}

output "github_actions_oidc_provider_arn" {
  description = "OIDC provider ARN used for GitHub Actions federation"
  value       = aws_iam_openid_connect_provider.github_actions.arn
}

output "github_environment_name" {
  description = "GitHub environment bootstrapped for deployment workflows"
  value       = github_repository_environment.production.environment
}

output "secrets_manager_secrets" {
  description = "Runtime Secrets Manager ARNs"
  value = {
    db  = aws_secretsmanager_secret.db_credentials.arn
    jwt = aws_secretsmanager_secret.jwt_secret.arn
    ses = aws_secretsmanager_secret.ses_credentials.arn
  }
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for frontend"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "backend_alb_dns_name" {
  description = "Backend ALB DNS name"
  value       = aws_lb.backend.dns_name
}

output "backend_target_group_arn" {
  description = "Backend ALB target group ARN"
  value       = aws_lb_target_group.backend.arn
}

output "aurora_cluster_endpoint" {
  description = "Aurora MySQL writer endpoint"
  value       = aws_rds_cluster.aurora.endpoint
}

output "aurora_cluster_reader_endpoint" {
  description = "Aurora MySQL reader endpoint"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "aurora_cluster_identifier" {
  description = "Aurora MySQL cluster identifier"
  value       = aws_rds_cluster.aurora.cluster_identifier
}
