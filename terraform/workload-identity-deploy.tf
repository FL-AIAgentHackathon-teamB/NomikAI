# =============================================================================
# Workload Identity Federation for Deployment
# =============================================================================

# Workload Identity Pool for Deployment
resource "google_iam_workload_identity_pool" "github_deploy" {
  workload_identity_pool_id = "github-deploy"
  display_name              = "GitHub Actions Deploy Pool"
  description               = "Workload Identity Pool for GitHub Actions deployment workflows"
}

# OIDC Provider (GitHub)
resource "google_iam_workload_identity_pool_provider" "github_deploy" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_deploy.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub OIDC Provider"
  description                        = "OIDC provider for GitHub Actions"

  attribute_mapping = {
    "google.subject"          = "assertion.sub"
    "attribute.repository"    = "assertion.repository"
    "attribute.repository_id" = "assertion.repository_id"
    "attribute.ref"           = "assertion.ref"
  }

  # 属性条件: repository_idとmainブランチで制限
  attribute_condition = "assertion.repository_id == '${var.github_repository_id}' && assertion.ref == 'refs/heads/main'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Deploy Service Account
resource "google_service_account" "deploy" {
  account_id   = "deploy-sa"
  display_name = "Deployment Service Account"
  description  = "Service account for deploying applications to Cloud Run"
}

# Workload Identity binding (using repository_id for security)
resource "google_service_account_iam_member" "deploy_workload_identity" {
  service_account_id = google_service_account.deploy.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_deploy.name}/attribute.repository_id/${var.github_repository_id}"
}

# Artifact Registry Writer
resource "google_project_iam_member" "deploy_artifact_registry" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.deploy.email}"
}

# Cloud Run Admin
resource "google_project_iam_member" "deploy_cloud_run" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.deploy.email}"
}

# Service Account User (to deploy as backend/frontend SA)
resource "google_project_iam_member" "deploy_sa_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.deploy.email}"
}

# Outputs
output "deploy_workload_identity_provider" {
  description = "Workload Identity Provider for deployment"
  value       = google_iam_workload_identity_pool_provider.github_deploy.name
}

output "deploy_service_account_email" {
  description = "Deploy service account email"
  value       = google_service_account.deploy.email
}
