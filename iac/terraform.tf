terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.82.2"
    }
  }

  backend "s3" {
    bucket = "terraform-medium-api-notification"
    key    = "116117-crawler/state.tfstate"
  }
}

provider "aws" {}
