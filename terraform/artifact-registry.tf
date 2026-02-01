# =============================================================================
# Artifact Registry
# =============================================================================
# Docker image repository for frontend and backend containers

resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = "nomikai-images"
  description   = "Docker images for NomikAI frontend and backend"
  format        = "DOCKER"

  labels = {
    purpose     = "container-images"
    managed_by  = "terraform"
    environment = "production"
  }
}

# Output the repository URL for easy reference
output "artifact_registry_repository" {
  description = "Artifact Registry repository name"
  value       = google_artifact_registry_repository.docker_repo.name
}

output "artifact_registry_url" {
  description = "Full URL to push/pull Docker images"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}"
}
