# Terraform Configuration
terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Backend configuration for storing Terraform state in GCS
  # This enables team collaboration and CI/CD workflows
  backend "gcs" {
    bucket = "nomikai-485006-terraform-state"
    prefix = "terraform/state"
  }
}

# Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
}
