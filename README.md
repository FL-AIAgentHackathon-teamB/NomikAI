# NomikAI - AI食事カロリー分析アプリ

Next.js + Express + Genkit で構築された、食事画像からカロリー推定とアドバイスを行うAIアプリケーションです。

## 🏗️ アーキテクチャ

フロントエンド（Next.js）とバックエンド（Node.js/Express）が分離された構成:

```
frontend/           backend/            Google AI
(Next.js)     →    (Express)      →    (Gemini)
Port: 9002          Port: 3001
```


## 🚀 セットアップ

### 必要な環境
- Node.js 20.x 以上
- npm
- Google Gemini API Key

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

バックエンド用 `backend/.env`:
```bash
# Google Cloud 設定（本番環境では必須）
GCP_PROJECT_ID=your-gcp-project-id
VERTEX_AI_REGION=asia-northeast1

# API サーバー設定
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:9002
```

フロントエンド用 `frontend/.env.local`:
```bash
BACKEND_URL=http://localhost:3001
```

**認証について**: 本番環境ではGoogle Cloud Application Default Credentials (ADC)を使用します。開発環境ではローカル認証を自動スキップします。

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
│   │   │   ├── features/ # 機能コンポーネント（meal-analyzer等）
│   │   │   ├── layout/   # レイアウトコンポーネント
│   │   │   └── ui/       # shadcn/ui コンポーネント
│   │   ├── hooks/        # カスタムフック
│   │   ├── lib/          # ユーティリティ
│   │   │   ├── utils.ts
│   │   │   ├── placeholder-images.ts
│   │   │   └── placeholder-images.json
│   │   └── ai/           # Genkit AI フロー（フロントエンド側）
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
│   ├── apis.tf
│   ├── artifact-registry.tf
│   ├── gcs.tf
│   ├── iam.tf
│   ├── outputs.tf
│   ├── variables.tf
│   └── workload-identity-deploy.tf
├── apphosting.yaml        # Firebase App Hosting設定
└── README.md              # このファイル
```

## 🎨 主な機能

- 📸 食事画像のアップロードと分析
- 🤖 Gemini 2.5 Flash による食品識別とカロリー推定
- 💡 残りカロリーに基づいたパーソナライズされたアドバイス
- 📊 シンプルで直感的なUI（shadcn/ui使用）

## 🛠️ 技術スタック

### フロントエンド
- **Framework**: Next.js 16.x (App Router)
- **React**: React 19.x
- **UI**: Tailwind CSS + Radix UI + shadcn/ui
- **UI Libraries**: Recharts, Embla Carousel, Lucide React
- **UI Utilities**: class-variance-authority, clsx, tailwind-merge, tailwindcss-animate
- **Form Management**: React Hook Form + Zod
- **Language**: TypeScript
- **AI Integration**: Google Genkit 1.20 + Gemini 2.5 Flash
- **Authentication**: google-auth-library（Cloud Run IAM認証）
- **Utilities**: date-fns, react-day-picker
- **State Management**: React Server Components
- **Deployment**: Cloud Run

### バックエンド
- **Runtime**: Node.js 20
- **Framework**: Express 4.x
- **Middleware**: CORS, Multer（将来の画像アップロード機能用）
- **AI**: Google Genkit 1.20 + Vertex AI Gemini 2.5 Flash
- **Validation**: Zod
- **Language**: TypeScript
- **Development Tool**: tsx（ホットリロード）
- **Deployment**: Cloud Run

### インフラ
- **IaC**: Terraform
- **Container Registry**: Google Artifact Registry
- **Authentication**: Workload Identity + Application Default Credentials (ADC)
- **Storage**: Google Cloud Storage（計画中）

## 🚢 デプロイ

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
  "remainingCalories": 1500,
  "remainingDishes": 3  // オプショナル
}
```

**バリデーション:**
- photoDataUri: data URI形式の文字列（必須）
- remainingCalories: 数値（必須）
- remainingDishes: 数値（オプショナル）

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

**エラーレスポンス:**
```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```

**ステータスコード:**
- 200: 成功
- 400: バリデーションエラー
- 500: サーバーエラー

### POST /api/v1/meals/reanalyze
カスタム食品名を使用して食事画像を再分析

**リクエスト:**
```json
{
  "photoDataUri": "data:image/jpeg;base64,...",
  "customFoodName": "カスタマイズした食品名",
  "remainingCalories": 1500,
  "remainingDishes": 3
}
```

**バリデーション:**
- customFoodName: 1-15文字の文字列（必須、trim処理）
- photoDataUri: data URI形式の文字列（必須）
- remainingCalories: 数値（必須）
- remainingDishes: 数値（オプショナル）

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "foodName": "カスタマイズした食品名",
    "calorieEstimate": 850,
    "verdict": "CAUTION",
    "suggestedRefinement": "..."
  }
}
```

**エラーレスポンス:**
```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```

**ステータスコード:**
- 200: 成功
- 400: バリデーションエラー
- 500: サーバーエラー

**セキュリティ:**
- プロンプトインジェクション対策として1-15文字制限を実施

### GET /api/v1/meals/health
ヘルスチェック

**レスポンス:**
```json
{
  "status": "ok",
  "service": "meal-analyzer"
}
```

**ステータスコード:**
- 200: 常に成功

## 📊 その他のコマンド

### フロントエンド
```bash
cd frontend
npm run dev         # 開発サーバー（Turbopack、ポート9002）
npm run build       # プロダクションビルド
npm run start       # プロダクションサーバー起動
npm run lint        # リント実行
npm run typecheck   # TypeScript型チェック
npm run genkit:dev  # Genkit開発UI起動
npm run genkit:watch # Genkit開発UI（watchモード）
```

### バックエンド
```bash
cd backend
npm run dev         # 開発サーバー（ホットリロード、tsx watch）
npm run build       # TypeScriptビルド
npm run start       # プロダクションサーバー
npm run typecheck   # TypeScript型チェック
```

## 🔐 セキュリティ

- API キーは環境変数で管理
- 本番環境では Secret Manager を使用
- CORS 設定により不正なオリジンからのアクセスを制限

## 📈 今後の拡張予定

- [ ] ユーザー認証（Firebase Auth）
- [ ] データベース統合（Firestore）
- [ ] セッション管理機能
- [ ] 食事履歴の保存と表示
- [ ] カレンダー連携
- [ ] 画像のCloud Storage保存

## 🤝 コントリビューション

プルリクエスト歓迎です！

## 📄 ライセンス

MIT
