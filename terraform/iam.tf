# =============================================================================
# IAM & Service Accounts
# =============================================================================
# Service accounts for Cloud Run services to access GCP resources

# -----------------------------------------------------------------------------
# Backend Service Account
# -----------------------------------------------------------------------------
resource "google_service_account" "backend" {
  account_id   = "nomikai-backend"
  display_name = "NomikAI Backend Service Account"
  description  = "Service account for NomikAI backend Cloud Run service"
  project      = var.project_id
}

# Firestore access
resource "google_project_iam_member" "backend_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

# Cloud Storage access (for meal images)
resource "google_project_iam_member" "backend_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.backend.email}"
  
  # 並行更新を避けるため順次実行
  depends_on = [google_project_iam_member.backend_firestore]
}

# Secret Manager access (for API keys)
resource "google_secret_manager_secret_iam_member" "backend_secret_access" {
  secret_id = google_secret_manager_secret.gemini_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend.email}"
}

# Vertex AI access (for Gemini API)
resource "google_project_iam_member" "backend_aiplatform" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.backend.email}"
  
  # 並行更新を避けるため順次実行
  depends_on = [google_project_iam_member.backend_storage]
}

# -----------------------------------------------------------------------------
# Frontend Service Account
# -----------------------------------------------------------------------------
resource "google_service_account" "frontend" {
  account_id   = "nomikai-frontend"
  display_name = "NomikAI Frontend Service Account"
  description  = "Service account for NomikAI frontend Cloud Run service"
  project      = var.project_id
}

# Frontend needs minimal permissions
# Only needs to invoke backend service (will be added in cloud-run.tf)
