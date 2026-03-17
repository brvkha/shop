variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "github_owner" {
  description = "GitHub org or user that owns the repository"
  type        = string
}

variable "github_repository" {
  description = "Repository name (owner/NAME is handled by provider.owner + this)"
  type        = string
}

variable "github_environment_name" {
  description = "GitHub Environment name used by deploy workflows"
  type        = string
  default     = "production"
}

variable "artifact_bucket" {
  description = "S3 bucket name for backend artifacts"
  type        = string
}

variable "frontend_bucket" {
  description = "S3 bucket name for frontend static site"
  type        = string
}

variable "cloudfront_distribution_id" {
  description = "CloudFront distribution ID used by frontend deploy invalidation"
  type        = string
  default     = "TO_BE_SET"
}

variable "deploy_target_tag_key" {
  description = "EC2 tag key used to find deployment targets"
  type        = string
  default     = "Role"
}

variable "deploy_target_tag_value" {
  description = "EC2 tag value used to find deployment targets"
  type        = string
  default     = "khaleo-backend"
}

variable "deploy_service_name" {
  description = "Systemd service name on EC2 instances"
  type        = string
  default     = "flashcard-backend"
}

variable "placeholder_secret_value" {
  description = "Placeholder value written to GitHub secrets; replace with real values after apply"
  type        = string
  default     = "TO_BE_SET"
}

variable "github_manual_environment_secrets" {
  description = "Additional GitHub environment secret names to create as placeholders"
  type        = list(string)
  default = [
    "SPRING_DATASOURCE_URL",
    "SPRING_DATASOURCE_USERNAME",
    "SPRING_DATASOURCE_PASSWORD",
    "JWT_SECRET",
    "SES_ACCESS_KEY_ID",
    "SES_SECRET_ACCESS_KEY"
  ]
}

variable "study_activity_log_table_name" {
  description = "DynamoDB table name for study activity logs"
  type        = string
  default     = "StudyActivityLog"
}

variable "study_activity_log_user_index_name" {
  description = "Global secondary index name for study activity lookups by user"
  type        = string
  default     = "userId-timestamp-index"
}

variable "study_activity_log_rate_alarm_threshold" {
  description = "Threshold for high study activity log failures per minute"
  type        = number
  default     = 5
}

variable "aurora_cluster_identifier" {
  description = "Aurora MySQL cluster identifier"
  type        = string
  default     = "khaleo-aurora-cluster"
}

variable "admin_authorization_denials_alarm_threshold" {
  description = "Threshold for admin authorization denial alarms over 5 minutes"
  type        = number
  default     = 5
}

variable "deployment_command_failure_alarm_threshold" {
  description = "Threshold for deployment command failures over 5 minutes"
  type        = number
  default     = 1
}

variable "deploy_artifact_bucket" {
  description = "S3 bucket storing immutable backend deployment artifacts"
  type        = string
  default     = "kha-leo-build-artifacts"
}

variable "common_tags" {
  description = "Common tags applied to infrastructure resources"
  type        = map(string)
  default = {
    Project     = "KhaLeoFlashcard"
    ManagedBy   = "Terraform"
    Environment = "dev"
  }
}
