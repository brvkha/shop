variables {
  github_owner                   = "example-owner"
  github_repository              = "example-repo"
  artifact_bucket                = "example-artifact-bucket"
  frontend_bucket                = "example-frontend-bucket"
  route53_zone_id                = "Z0123456789ABCDE"
  alb_certificate_arn            = "arn:aws:acm:ap-southeast-1:111111111111:certificate/11111111-2222-3333-4444-555555555555"
  cloudfront_acm_certificate_arn = "arn:aws:acm:us-east-1:111111111111:certificate/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
}

run "network_dns_contract" {
  command = plan

  plan_options {
    refresh = false
  }

  assert {
    condition     = aws_lb.backend.load_balancer_type == "application"
    error_message = "US2 requires an application load balancer for backend ingress."
  }

  assert {
    condition     = aws_cloudfront_distribution.frontend.enabled
    error_message = "US2 requires CloudFront distribution for frontend delivery."
  }

  assert {
    condition     = aws_route53_record.frontend_alias[0].name == var.root_domain_name
    error_message = "Frontend DNS record must target root domain."
  }

  assert {
    condition     = aws_route53_record.api_alias[0].name == "${var.api_subdomain}.${var.root_domain_name}"
    error_message = "API DNS record must target configured api subdomain."
  }

  assert {
    condition     = aws_wafv2_web_acl_association.backend.resource_arn == aws_lb.backend.arn
    error_message = "WAF must be associated with backend ALB."
  }
}
