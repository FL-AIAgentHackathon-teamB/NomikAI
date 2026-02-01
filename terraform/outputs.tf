# ============================================
# Cloud Run Service URLs
# ============================================
output "frontend_url" {
  description = "Frontend Cloud Run service URL"
  value       = google_cloud_run_service.frontend.status[0].url
}

output "backend_url" {
  description = "Backend Cloud Run service URL"
  value       = google_cloud_run_service.backend.status[0].url
}

# ============================================
# Service Account Emails
# ============================================
output "backend_service_account_email" {
  description = "Backend service account email"
  value       = google_service_account.backend.email
}

output "frontend_service_account_email" {
  description = "Frontend service account email"
  value       = google_service_account.frontend.email
}

# ============================================
# Storage
# ============================================
output "gcs_bucket_name" {
  description = "GCS bucket name for meal images"
  value       = google_storage_bucket.meal_images.name
}

# Note: Artifact Registry outputs are defined in artifact-registry.tf
