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
