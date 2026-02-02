# NomikAI - AI食事カロリー分析アプリ

Next.js + Express + Genkit で構築された、食事画像からカロリー推定とアドバイスを行うAIアプリケーション「Nomini」のリポジトリです。

## 🏗️ アーキテクチャ

フロントエンド（Next.js）とバックエンド（Node.js/Express）が分離された構成:

```
frontend/           backend/            Google AI
(Next.js)     →    (Express)      →    (Gemini)
Port: 9002          Port: 3001
```

詳細は [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) を参照してください。

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
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:9002
```

フロントエンド用 `frontend/.env.local`:
```bash
BACKEND_URL=http://localhost:3001
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
│   │   │   ├── features/ # 機能コンポーネント（meal-analyzer等）
│   │   │   ├── layout/   # レイアウトコンポーネント
│   │   │   └── ui/       # shadcn/ui コンポーネント
│   │   ├── hooks/        # カスタムフック
│   │   ├── lib/          # ユーティリティ
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
│   ├── firestore.tf
│   └── その他の設定ファイル
├── docs/                  # ドキュメント
│   ├── ARCHITECTURE.md   # アーキテクチャ詳細
│   ├── DEPLOYMENT.md     # デプロイメントガイド
│   ├── PROJECT_OVERVIEW.md
│   └── その他
├── apphosting.yaml        # Firebase App Hosting設定
└── README.md              # このファイル
```

## 🎨 主な機能

- 📸 食事画像のアップロードと分析
- 🤖 Gemini 2.0 Flash による食品識別とカロリー推定
- 💡 残りカロリーに基づいたパーソナライズされたアドバイス
- 📊 シンプルで直感的なUI（shadcn/ui使用）

## 🛠️ 技術スタック

### フロントエンド
- **Framework**: Next.js 16.x (App Router)
- **UI**: Tailwind CSS + Radix UI + shadcn/ui
- **Language**: TypeScript
- **State Management**: React Server Components
- **Deployment**: Cloud Run / Firebase App Hosting

### バックエンド
- **Runtime**: Node.js 20
- **Framework**: Express 4.x
- **AI**: Google Genkit 1.20 + Gemini 2.0 Flash
- **Language**: TypeScript
- **Deployment**: Cloud Run

### インフラ
- **IaC**: Terraform
- **Container Registry**: Google Artifact Registry
- **Database**: Firestore (計画中)
- **Storage**: Google Cloud Storage (計画中)
- **Secrets**: Google Secret Manager

## 🚢 デプロイ

詳細なデプロイ手順は [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) を参照してください。

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
npm run dev         # 開発サーバー（Turbopack、ポート9002）
npm run build       # プロダクションビルド
npm run start       # プロダクションサーバー起動
npm run lint        # リント実行
npm run typecheck   # TypeScript型チェック
npm run genkit:dev  # Genkit開発UI起動
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
