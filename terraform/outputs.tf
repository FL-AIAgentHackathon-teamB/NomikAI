output "backend_url" {
  description = "Backend API URL"
  value       = google_cloud_run_v2_service.backend.uri
}

output "frontend_url" {
  description = "Frontend URL"
  value       = google_cloud_run_v2_service.frontend.uri
}

output "backend_service_name" {
  description = "Backend service name"
  value       = google_cloud_run_v2_service.backend.name
}

output "frontend_service_name" {
  description = "Frontend service name"
  value       = google_cloud_run_v2_service.frontend.name
}
