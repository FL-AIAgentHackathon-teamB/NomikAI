# =============================================================================
# Google Cloud Storage Buckets
# =============================================================================

# -----------------------------------------------------------------------------
# Terraform State Bucket
# -----------------------------------------------------------------------------
# This bucket stores Terraform state files for team collaboration and CI/CD.
# Must be created BEFORE adding backend "gcs" configuration to main.tf

resource "google_storage_bucket" "terraform_state" {
  name     = "${var.project_id}-terraform-state"
  location = var.region

  # Enable versioning to protect against accidental deletions or corruption
  versioning {
    enabled = true
  }

  # Uniform bucket-level access (recommended for new buckets)
  uniform_bucket_level_access = true

  # Prevent accidental deletion of this bucket
  lifecycle {
    prevent_destroy = true
  }

  # Optional: Enable object lifecycle management
  # Automatically delete old versions after 30 days to save costs
  lifecycle_rule {
    condition {
      num_newer_versions = 3
    }
    action {
      type = "Delete"
    }
  }

  labels = {
    purpose     = "terraform-state"
    managed_by  = "terraform"
    environment = "global"
  }
}

# -----------------------------------------------------------------------------
# Meal Images Bucket
# -----------------------------------------------------------------------------
# This bucket stores meal images uploaded by users.
# Images are automatically deleted after 24 hours.

resource "google_storage_bucket" "meal_images" {
  name     = "${var.project_id}-meal-images"
  location = var.region

  # Uniform bucket-level access
  uniform_bucket_level_access = true

  # CORS configuration for frontend access
  # Initially allowing all origins (*) for development
  # TODO: Restrict to specific Cloud Run URL after frontend deployment
  cors {
    origin          = ["*"]
    method          = ["GET", "POST", "PUT", "DELETE"]
    response_header = ["Content-Type", "Content-Length"]
    max_age_seconds = 3600
  }

  # Lifecycle rule: Delete objects after 24 hours
  lifecycle_rule {
    condition {
      age = 1 # days
    }
    action {
      type = "Delete"
    }
  }

  labels = {
    purpose     = "meal-images"
    managed_by  = "terraform"
    environment = "production"
    ttl         = "24h"
  }
}
