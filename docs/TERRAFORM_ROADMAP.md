# Terraform ロードマップ

NomikAI インフラ構築の進捗管理ドキュメント

## 進捗状況

| # | タスク | ファイル | ステータス |
|---|--------|----------|------------|
| 1 | APIs有効化 | `apis.tf` | ✅ 完了 |
| 2 | GCS バケット (Terraform state用) | `gcs.tf` | ✅ 完了 |
| 3 | Terraform State Backend設定 | `main.tf` | ✅ 完了 |
| 4 | GCS バケット (画像用) | `gcs.tf` | ✅ 完了 |
| 5 | Artifact Registry | `artifact-registry.tf` | ✅ 完了 |
| 6 | Firestore | `firestore.tf` | ✅ 完了 |
| 7 | Secret Manager | `secret-manager.tf` | ✅ 完了 |
| 8 | IAM / サービスアカウント | `iam.tf` | ✅ 完了 |
| 9 | Cloud Run Backend | `cloud-run.tf` | ✅ 完了 |
| 10 | Cloud Run Frontend | `cloud-run.tf` | ✅ 完了 |
| 11 | Outputs | `outputs.tf` | ✅ 完了 |

**🎉 全タスク完了！**

---

## 詳細

### ✅ 1. APIs有効化 (apis.tf) - 完了

有効化済みのAPI:
- `run.googleapis.com` - Cloud Run
- `firestore.googleapis.com` - Firestore
- `storage.googleapis.com` - Cloud Storage
- `artifactregistry.googleapis.com` - Artifact Registry
- `secretmanager.googleapis.com` - Secret Manager
- `iam.googleapis.com` - IAM
- `aiplatform.googleapis.com` - Vertex AI (Gemini)

---

### ✅ 2. GCS バケット - Terraform state用 (gcs.tf) - 完了

**目的**: Terraform stateをチームで共有、CIで使用可能に

**作成したリソース**:
- `google_storage_bucket` - Terraform state用バケット

**設定内容**:
- バケット名: `nomikai-485006-terraform-state`
- リージョン: `asia-northeast1`
- バージョニング: 有効（誤操作からの復旧用）
- `prevent_destroy = true`（誤削除防止）
- ライフサイクルルール: 古いバージョンを3世代保持

**完了日**: 2026年2月1日

---

### ✅ 3. Terraform State Backend設定 (main.tf) - 完了

**目的**: tfstateファイルをGCSで管理

**実施内容**:
1. `main.tf` に `backend "gcs"` を追加
2. `terraform init -migrate-state` でstate移行完了
3. ローカルのtfstateファイルを削除
4. CIでの実行が可能に！

**設定**:
```hcl
terraform {
  backend "gcs" {
    bucket = "nomikai-485006-terraform-state"
    prefix = "terraform/state"
  }
}
```

**完了日**: 2026年2月1日

---

### ✅ 4. GCS バケット - 食事画像用 (gcs.tf) - 完了

**目的**: 食事画像の保存

**作成したリソース**:
- `google_storage_bucket` - 画像用バケット

**設定内容**:
- バケット名: `nomikai-485006-meal-images`
- リージョン: `asia-northeast1`
- ライフサイクルルール: **24時間で自動削除**
- CORS設定: 開発用に全オリジン許可（後でCloud Run URLに制限予定）

**完了日**: 2026年2月1日

---

### ✅ 5. Artifact Registry (artifact-registry.tf) - 完了

**目的**: Dockerイメージの保存

**作成したリソース**:
- `google_artifact_registry_repository` - Dockerリポジトリ

**設定内容**:
- リポジトリ名: `nomikai-images`
- リージョン: `asia-northeast1`
- フォーマット: `DOCKER`
- 用途: frontend/backend のコンテナイメージを保存
- Output: リポジトリURLを出力（`asia-northeast1-docker.pkg.dev/nomikai-485006/nomikai-images`）

**完了日**: 2026年2月1日

---

### ✅ 6. Firestore (firestore.tf) - 完了

**目的**: セッション・食事データの保存

**作成したリソース**:
- `google_firestore_database` - データベース

**設定内容**:
- データベース名: `(default)`
- モード: `FIRESTORE_NATIVE`
- リージョン: `asia-northeast1`
- 並行制御: `OPTIMISTIC`
- TTL: `expireAt` フィールドで24時間後に自動削除（gcloud コマンドで設定済み）

**完了日**: 2026年2月1日

---

### ✅ 7. Secret Manager (secret-manager.tf) - 完了

**目的**: APIキーの安全な管理

**作成したリソース**:
- `google_secret_manager_secret` - シークレットの「箱」

**設定内容**:
- シークレット名: `gemini-api-key`
- レプリケーション: `auto`（自動マルチリージョン）
- 値の追加: gcloud コマンドで手動設定済み

**完了日**: 2026年2月1日

---

### ✅ 8. IAM / サービスアカウント (iam.tf) - 完了

**目的**: Cloud Run用のサービスアカウント

**作成したリソース**:
- `google_service_account` - Cloud Run用SA
- `google_project_iam_member` - 必要な権限付与

**付与した権限**:
- `roles/datastore.user` - Firestore読み書き
- `roles/storage.objectAdmin` - GCS読み書き
- `roles/secretmanager.secretAccessor` - シークレット読み取り
- `roles/aiplatform.user` - Vertex AI (Gemini) 使用

**完了日**: 2026年2月1日

---

### ✅ 9. Cloud Run Backend (cloud-run.tf) - 完了

**目的**: APIサーバー

**作成したリソース**:
- `google_cloud_run_v2_service` - Backendサービス

**設定内容**:
- イメージ: Artifact Registryから自動デプロイ（CI/CD）
- 認証: **IAM認証（Frontend からのみアクセス可）**
- 環境変数:
  - `GCS_BUCKET` - 画像バケット名
  - `PROJECT_ID` - プロジェクトID
- シークレット:
  - `GEMINI_API_KEY` - Secret Managerから注入

**完了日**: 2026年2月1日

---

### ✅ 10. Cloud Run Frontend (cloud-run.tf) - 完了

**目的**: Next.js Webアプリ

**作成したリソース**:
- `google_cloud_run_v2_service` - Frontendサービス
- `google_cloud_run_service_iam_member` - 公開アクセス許可
- `google_cloud_run_service_iam_member` - BackendへのIAM認証権限（roles/run.invoker）

**設定内容**:
- イメージ: Artifact Registryから自動デプロイ（CI/CD）
- 認証: **公開（allUsers）**
- 環境変数:
  - `BACKEND_URL` - Backend の URL

**完了日**: 2026年2月1日

---

### ✅ 11. Outputs (outputs.tf) - 完了

**目的**: デプロイ後に必要な情報を出力

**出力する値**:
- `frontend_url` - FrontendのURL
- `backend_url` - BackendのURL
- `gcs_bucket_name` - 画像バケット名
- `artifact_registry_url` - Dockerリポジトリの URL
- `service_account_email` - Cloud Run用SAのメール

**完了日**: 2026年2月1日
