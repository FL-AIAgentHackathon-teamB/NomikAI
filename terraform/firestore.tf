# =============================================================================
# Firestore Database
# =============================================================================
# NoSQL database for storing session and meal data
# Data is automatically deleted after 24 hours using TTL policy

resource "google_firestore_database" "database" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  # Concurrency control
  concurrency_mode = "OPTIMISTIC"

  # App Engine integration (not used, but required)
  app_engine_integration_mode = "DISABLED"
}

# Note: TTL (Time To Live) Policy
# --------------------------------
# Firestore's TTL policy is configured at the collection level, not in Terraform.
# To enable automatic deletion after 24 hours:
#
# 1. Go to Firestore Console
# 2. Select your collection (e.g., "sessions")
# 3. Enable TTL policy on the "expireAt" field
#
# Alternatively, use gcloud command after Terraform apply:
#   gcloud firestore fields ttls update expireAt \
#     --collection-group=sessions \
#     --enable-ttl
#
# Application code should set expireAt field:
#   expireAt: Timestamp(now + 24 hours)
