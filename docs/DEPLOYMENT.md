# NomikAI デプロイメントガイド

## 前提条件

- Google Cloud アカウント
- gcloud CLI がインストール済み
- Docker がインストール済み
- Terraform がインストール済み

## 1. Google Cloud プロジェクトのセットアップ

```bash
# プロジェクトIDを設定
export PROJECT_ID="your-project-id"
export REGION="asia-northeast1"

# gcloud CLIの認証
gcloud auth login
gcloud config set project $PROJECT_ID

# アプリケーションデフォルト認証情報の設定
gcloud auth application-default login
```

## 2. 必要なAPIの有効化

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

## 3. Artifact Registry リポジトリの作成

```bash
gcloud artifacts repositories create nomikai-images \
  --repository-format=docker \
  --location=$REGION \
  --description="NomikAI Docker images"

# Docker認証設定
gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

## 4. Dockerイメージのビルドとプッシュ

### バックエンド

```bash
cd backend

docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/nomikai-images/backend:latest .

docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/nomikai-images/backend:latest
```

### フロントエンド

```bash
cd ../frontend

docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/nomikai-images/frontend:latest .

docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/nomikai-images/frontend:latest
```

## 5. Terraform でインフラをデプロイ

```bash
cd terraform

# terraform.tfvars ファイルを作成
cp terraform.tfvars.example terraform.tfvars

# terraform.tfvars を編集
# project_id と gemini_api_key を設定

# Terraform初期化
terraform init

# プラン確認
terraform plan

# デプロイ実行
terraform apply
```

## 6. デプロイ確認

```bash
# バックエンドURLを取得
terraform output backend_url

# フロントエンドURLを取得
terraform output frontend_url

# ブラウザでアクセス
open $(terraform output -raw frontend_url)
```

## ローカル開発環境

### バックエンド

```bash
cd backend
npm install
npm run dev
# http://localhost:3001 で起動
```

### フロントエンド

```bash
cd frontend
npm install
npm run dev
# http://localhost:9002 で起動
```

## 環境変数

### バックエンド (.env)
```
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:9002
```

### フロントエンド (frontend/.env.local)
```
BACKEND_URL=http://localhost:3001
GEMINI_API_KEY=your_gemini_api_key
```

## トラブルシューティング

### Dockerビルドが失敗する場合

```bash
# キャッシュをクリアして再ビルド
docker build --no-cache -t <image-name> .
```

### Cloud Run デプロイが失敗する場合

```bash
# ログを確認
gcloud run services logs read <service-name> --region=$REGION
```

### Terraform エラーが発生する場合

```bash
# State をリフレッシュ
terraform refresh

# 特定のリソースを再作成
terraform taint <resource-name>
terraform apply
```

## CI/CD（オプション）

GitHub Actions を使った自動デプロイの設定例:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}
      
      - name: Build and Push Backend
        run: |
          cd backend
          docker build -t ${{ secrets.REGION }}-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/nomikai-images/backend:${{ github.sha }} .
          docker push ${{ secrets.REGION }}-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/nomikai-images/backend:${{ github.sha }}
      
      - name: Build and Push Frontend
        run: |
          cd frontend
          docker build -t ${{ secrets.REGION }}-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/nomikai-images/frontend:${{ github.sha }} .
          docker push ${{ secrets.REGION }}-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/nomikai-images/frontend:${{ github.sha }}
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy nomikai-backend \
            --image ${{ secrets.REGION }}-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/nomikai-images/backend:${{ github.sha }} \
            --region ${{ secrets.REGION }}
          
          gcloud run deploy nomikai-frontend \
            --image ${{ secrets.REGION }}-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/nomikai-images/frontend:${{ github.sha }} \
            --region ${{ secrets.REGION }}
```

## コスト管理

- Cloud Run は使用した分だけ課金
- 最小インスタンス数を0に設定すると、アクセスがない時は課金されない
- 開発中は `min_instances = 0` を推奨

## 次のステップ

1. カスタムドメインの設定
2. Cloud SQL の追加（ユーザーデータ永続化）
3. Cloud Storage の追加（画像保存）
4. モニタリングとアラートの設定
5. CI/CD パイプラインの構築
