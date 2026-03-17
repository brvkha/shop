variables {
  github_owner      = "example-owner"
  github_repository = "example-repo"
  artifact_bucket   = "example-artifact-bucket"
  frontend_bucket   = "example-frontend-bucket"
}

run "oidc_trust_contract" {
  command = plan

  plan_options {
    refresh = false
  }

  assert {
    condition     = strcontains(data.aws_iam_policy_document.github_actions_oidc_assume_role.json, "token.actions.githubusercontent.com:aud")
    error_message = "OIDC trust policy must require sts.amazonaws.com audience."
  }

  assert {
    condition     = strcontains(data.aws_iam_policy_document.github_actions_oidc_assume_role.json, "repo:${var.github_owner}/${var.github_repository}:environment:${var.github_environment_name}")
    error_message = "OIDC trust policy must restrict role assumption to the production environment subject."
  }

  assert {
    condition     = strcontains(aws_iam_policy.backend_runtime.policy, "secretsmanager:GetSecretValue")
    error_message = "Backend runtime role must allow Secrets Manager reads only through explicit policy."
  }
}