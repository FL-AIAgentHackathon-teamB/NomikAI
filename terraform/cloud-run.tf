# ============================================
# Backend Cloud Run Service
# ============================================
resource "google_cloud_run_service" "backend" {
  name     = "nomikai-backend"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.backend.email

      containers {
        # 初期デプロイ用のダミーイメージ（後でCIで差し替え）
        image = "us-docker.pkg.dev/cloudrun/container/hello"

        # リソース制限
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }

        # ポート設定
        ports {
          container_port = 8080
        }

        # 環境変数
        env {
          name  = "PROJECT_ID"
          value = var.project_id
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }

        # Vertex AI用の環境変数（ADC認証を使用）
        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }

        env {
          name  = "VERTEX_AI_REGION"
          value = var.region
        }
      }
    }

    metadata {
      annotations = {
        # 最小/最大インスタンス数
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "10"

        # コールドスタート対策（第2世代実行環境）
        "run.googleapis.com/execution-environment" = "gen2"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  # 既存のIAM設定を保持
  lifecycle {
    ignore_changes = [
      template[0].metadata[0].annotations["run.googleapis.com/client-name"],
      template[0].metadata[0].annotations["run.googleapis.com/client-version"],
    ]
  }
}

# Backend は IAM認証必須（デフォルト）
# allUsers を許可しないことで、明示的に権限を付与されたSAのみアクセス可能

# ============================================
# IAM: Frontend → Backend 呼び出し権限
# ============================================
resource "google_cloud_run_service_iam_member" "frontend_to_backend" {
  service  = google_cloud_run_service.backend.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.frontend.email}"
}

# ============================================
# Frontend Cloud Run Service
# ============================================
resource "google_cloud_run_service" "frontend" {
  name     = "nomikai-frontend"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.frontend.email

      containers {
        # 初期デプロイ用のダミーイメージ（後でCIで差し替え）
        image = "us-docker.pkg.dev/cloudrun/container/hello"

        # リソース制限
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }

        # ポート設定
        ports {
          container_port = 3000
        }

        # 環境変数
        env {
          name  = "NODE_ENV"
          value = "production"
        }

        # Backend URLを参照（Terraformが依存関係を自動解決）
        env {
          name  = "BACKEND_URL"
          value = google_cloud_run_service.backend.status[0].url
        }
      }
    }

    metadata {
      annotations = {
        # 最小/最大インスタンス数
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "10"

        # コールドスタート対策（第2世代実行環境）
        "run.googleapis.com/execution-environment" = "gen2"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  # 既存のIAM設定を保持
  lifecycle {
    ignore_changes = [
      template[0].metadata[0].annotations["run.googleapis.com/client-name"],
      template[0].metadata[0].annotations["run.googleapis.com/client-version"],
    ]
  }
}

# Frontend は公開アクセス可（allUsers許可）
resource "google_cloud_run_service_iam_member" "frontend_public" {
  service  = google_cloud_run_service.frontend.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
