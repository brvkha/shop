terraform {
  required_version = ">= 1.2.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# The GitHub provider will use the environment variable GITHUB_TOKEN or GH_TOKEN
provider "github" {
  owner = var.github_owner
}
