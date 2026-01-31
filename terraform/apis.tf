# =============================================================================
# Google Cloud APIs
# =============================================================================
# Enable required APIs for NomikAI application

locals {
  required_apis = [
    "run.googleapis.com",              # Cloud Run
    "firestore.googleapis.com",        # Firestore
    "storage.googleapis.com",          # Cloud Storage
    "artifactregistry.googleapis.com", # Artifact Registry
    "secretmanager.googleapis.com",    # Secret Manager
    "iam.googleapis.com",              # IAM
    "aiplatform.googleapis.com",       # Vertex AI (Gemini)
  ]
}

resource "google_project_service" "apis" {
  for_each = toset(local.required_apis)

  project = var.project_id
  service = each.value

  # Don't disable the API when destroying
  # (prevents accidental data loss and allows faster re-creation)
  disable_on_destroy = false
}
