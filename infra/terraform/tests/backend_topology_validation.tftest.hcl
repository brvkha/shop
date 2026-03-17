variables {
  github_owner                   = "example-owner"
  github_repository              = "example-repo"
  artifact_bucket                = "example-artifact-bucket"
  frontend_bucket                = "example-frontend-bucket"
  route53_zone_id                = "Z0123456789ABCDE"
  alb_certificate_arn            = "arn:aws:acm:ap-southeast-1:111111111111:certificate/11111111-2222-3333-4444-555555555555"
  cloudfront_acm_certificate_arn = "arn:aws:acm:us-east-1:111111111111:certificate/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
}

run "backend_topology_contract" {
  command = plan

  plan_options {
    refresh = false
  }

  assert {
    condition     = length(aws_subnet.private) == 3
    error_message = "US2 requires three private subnets across AZs."
  }

  assert {
    condition     = length(aws_subnet.public) == 3
    error_message = "US2 requires public subnets for ALB/NAT across AZs."
  }

  assert {
    condition     = length(var.private_subnet_cidrs) == 3
    error_message = "Backend topology contract requires three private subnet CIDRs."
  }

  assert {
    condition     = aws_lb_target_group.backend.health_check[0].path == var.backend_health_check_path
    error_message = "Backend target group health check path must follow contract variable."
  }

  assert {
    condition     = aws_autoscaling_group.backend.min_size >= 3
    error_message = "Backend ASG minimum size must preserve multi-AZ baseline."
  }
}
