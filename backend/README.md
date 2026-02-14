# NomikAI Backend API

Express + TypeScript + Genkit で構築されたバックエンドAPIサーバー。

## 開発サーバーの起動

```bash
npm install
npm run dev
```

APIサーバーは http://localhost:3001 で起動します。

## 環境変数

`.env` ファイルを作成し、以下の環境変数を設定:

```bash
# Google Cloud 設定（本番環境では必須）
GCP_PROJECT_ID=your-gcp-project-id
VERTEX_AI_REGION=asia-northeast1

# API サーバー設定
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:9002
```

**認証について**: 本番環境ではGoogle Cloud Application Default Credentials (ADC)とVertex AIを使用します。開発環境ではローカル認証で動作します。

## ビルド

```bash
npm run build
npm run start
```

## 技術スタック

- **Runtime**: Node.js 20
- **Framework**: Express 4.x
- **Middleware**: CORS (^2.8.5), Multer (^2.0.2)（将来の画像アップロード機能用）
- **AI**: Google Genkit 1.20 + Vertex AI Gemini 2.5 Flash
- **Validation**: Zod (^3.24.2)
- **Language**: TypeScript 5.x
- **Build Tool**: tsx (開発時), tsc (ビルド時)
- **Deployment**: Cloud Run

**依存関係の詳細:**
- fast-xml-parser: ^5.3.4（overrides設定）
- @genkit-ai/vertexai: Vertex AI統合プラグイン

## API エンドポイント

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

### POST /api/v1/meals/reanalyze
カスタム食品名を使用して食事画像を再分析

**実装場所:** `src/routes/meals.ts:48-104`

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
- プロンプトインジェクション対策として1-15文字制限とtrim処理を実施

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

## ディレクトリ構造

```
src/
├── ai/            # Genkit AI フロー
│   ├── genkit.ts
│   └── analyze-meal.ts
├── routes/        # API ルート
│   └── meals.ts
├── services/      # ビジネスロジック
│   └── meal.service.ts
└── index.ts       # エントリーポイント
```
