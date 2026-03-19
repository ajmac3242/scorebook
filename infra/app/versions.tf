terraform {
  required_version = ">= 1.0.0"

  backend "s3" {
    bucket         = "basketball-stats-terraform-state-269555264437"
    key            = "app/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    use_lockfile   = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

data "terraform_remote_state" "base" {
  backend = "s3"
  config = {
    bucket = "basketball-stats-terraform-state-269555264437"
    key    = "base/terraform.tfstate"
    region = "us-east-1"
  }
}
