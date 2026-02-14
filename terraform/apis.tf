# =============================================================================
# Google Cloud APIs
# =============================================================================
# Enable required APIs for NomikAI application

locals {
  required_apis = [
    "run.googleapis.com",              # Cloud Run
    "artifactregistry.googleapis.com", # Artifact Registry
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
