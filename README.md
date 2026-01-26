# Nomini - AI食事カロリー分析アプリ

Firebase Studio + Next.js + Genkit で構築された、食事画像からカロリー推定とアドバイスを行うAIアプリケーションです。

## 🏗️ アーキテクチャ

フロントエンド（Next.js）とバックエンド（Node.js/Express）が分離された構成:

```
frontend/           backend/            Vertex AI
(Next.js)     →    (Express)      →    (Gemini)
Port: 9002          Port: 3001
```

詳細は [ARCHITECTURE.md](ARCHITECTURE.md) を参照してください。

## 🚀 セットアップ

### 必要な環境
- Node.js 20.x 以上
- npm または yarn
- Gemini API Key

### ローカル開発環境の起動

1. 依存関係のインストール:
```bash
# フロントエンド
cd frontend
npm install

# バックエンド
cd ../backend
npm install
```

2. 環境変数の設定:

フロントエンド用 `frontend/.env.local`:
```bash
BACKEND_URL=http://localhost:3001
GEMINI_API_KEY=your_api_key_here
```

バックエンド用 `backend/.env`:
```bash
GEMINI_API_KEY=your_api_key_here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:9002
```

3. 開発サーバーの起動:

**ターミナル1: バックエンド**
```bash
cd backend
npm run dev
```
バックエンドAPI: http://localhost:3001

**ターミナル2: フロントエンド**
```bash
cd frontend
npm run dev
```
フロントエンド: http://localhost:9002

## 📁 プロジェクト構造

```
.
├── frontend/              # Next.js フロントエンド
│   ├── src/
│   │   ├── app/          # App Router ページ
│   │   ├── components/   # Reactコンポーネント
│   │   └── lib/         # ユーティリティ
│   ├── Dockerfile        # フロントエンド用Docker設定
│   └── package.json
├── backend/               # Express バックエンドAPI
│   ├── src/
│   │   ├── ai/           # Genkit AI フロー
│   │   ├── routes/       # API ルート
│   │   ├── services/     # ビジネスロジック
│   │   └── index.ts      # エントリーポイント
│   ├── Dockerfile        # バックエンド用Docker設定
│   └── package.json
├── terraform/             # Infrastructure as Code
│   ├── main.tf
│   ├── cloud-run.tf
│   └── variables.tf
├── docs/                  # ドキュメント
├── ARCHITECTURE.md        # アーキテクチャ詳細
└── DEPLOYMENT.md          # デプロイメントガイド
```

## 🎨 主な機能

- 📸 食事画像のアップロードと分析
- 🤖 Gemini AIによる食品識別とカロリー推定
- 💡 残りカロリーに基づいたパーソナライズされたアドバイス
- 📊 シンプルで直感的なUI

## 🛠️ 技術スタック

### フロントエンド
- **Framework**: Next.js 15.5 (App Router)
- **UI**: Tailwind CSS + Radix UI + shadcn/ui
- **Language**: TypeScript
- **Deployment**: Firebase App Hosting / Cloud Run

### バックエンド
- **Runtime**: Node.js 20
- **Framework**: Express
- **AI**: Google Genkit + Gemini 2.0 Flash
- **Language**: TypeScript
- **Deployment**: Cloud Run

### インフラ
- **IaC**: Terraform
- **Container Registry**: Google Artifact Registry
- **Secrets**: Google Secret Manager

## 🚢 デプロイ

詳細なデプロイ手順は [DEPLOYMENT.md](DEPLOYMENT.md) を参照してください。

### クイックデプロイ

```bash
# 1. Google Cloud プロジェクトの設定
export PROJECT_ID="your-project-id"
export REGION="asia-northeast1"

# 2. Dockerイメージのビルドとプッシュ
# バックエンド
cd backend
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/nomikai-images/backend:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/nomikai-images/backend:latest

# フロントエンド
cd ../frontend
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/nomikai-images/frontend:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/nomikai-images/frontend:latest

# 3. Terraformでデプロイ
cd ../terraform
terraform init
terraform apply
```

## 📝 API エンドポイント

### POST /api/v1/meals/analyze
食事画像を分析してカロリーとアドバイスを返す

**リクエスト:**
```json
{
  "photoDataUri": "data:image/jpeg;base64,...",
  "remainingCalories": 1500
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "foodName": "ハンバーグ定食",
    "calorieEstimate": 850,
    "verdict": "CAUTION",
    "suggestedRefinement": "夜の飲み会を考慮すると..."
  }
}
```

### GET /api/v1/meals/health
ヘルスチェック

## 📊 その他のコマンド

### フロントエンド
```bash
cd frontend
npm run build       # プロダクションビルド
npm run start       # プロダクションサーバー起動
npm run lint        # リント実行
npm run typecheck   # TypeScript型チェック
```

### バックエンド
```bash
cd backend
npm run build       # TypeScriptビルド
npm run dev         # 開発サーバー (ホットリロード)
npm run start       # プロダクションサーバー
```

## 🔐 セキュリティ

- API キーは環境変数で管理
- 本番環境では Secret Manager を使用
- CORS 設定により不正なオリジンからのアクセスを制限

## 📈 今後の拡張予定

- [ ] ユーザー認証（Firebase Auth）
- [ ] データベース統合（Cloud SQL）
- [ ] カレンダー連携
- [ ] トレーニング提案機能
- [ ] 履歴管理機能

## 🤝 コントリビューション

プルリクエスト歓迎です！

## 📄 ライセンス

MIT
