variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud Region"
  type        = string
  default     = "asia-northeast1"
}

variable "github_repository_id" {
  description = "GitHub repository ID (numeric)"
  type        = string
  default     = "1133304651"
}
