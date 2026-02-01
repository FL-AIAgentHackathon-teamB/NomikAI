# =============================================================================
# Secret Manager
# =============================================================================
# Secure storage for sensitive configuration like API keys
# Note: This only creates the "secret" container. Actual values must be
# added manually via GCP Console or gcloud command.

resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "gemini-api-key"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = {
    purpose     = "api-key"
    service     = "gemini"
    managed_by  = "terraform"
    environment = "production"
  }
}

# Instructions for adding the secret value manually:
# ------------------------------------------------
# Option 1: Using gcloud command
#   echo -n "your-api-key-here" | gcloud secrets versions add gemini-api-key --data-file=- --project=nomikai-485006
#
# Option 2: Using GCP Console
#   1. Go to Secret Manager in GCP Console
#   2. Click on "gemini-api-key"
#   3. Click "NEW VERSION"
#   4. Paste your API key
#   5. Click "ADD NEW VERSION"
