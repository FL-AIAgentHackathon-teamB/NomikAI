# Terraform Backend Configuration
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # State管理（後で設定）
  # backend "gcs" {
  #   bucket = "nomikai-terraform-state"
  #   prefix = "terraform/state"
  # }
}

# Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
}
