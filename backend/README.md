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
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:9002
```

## ビルド

```bash
npm run build
npm run start
```

## 技術スタック

- **Runtime**: Node.js 20
- **Framework**: Express 4.x
- **Middleware**: CORS (^2.8.5), Multer (^2.0.2)
- **AI**: Google Genkit 1.20 + Gemini 2.0 Flash
- **Validation**: Zod (^3.24.2)
- **Language**: TypeScript 5.x
- **Build Tool**: tsx (開発時), tsc (ビルド時)
- **Deployment**: Cloud Run

**依存関係の詳細:**
- fast-xml-parser: ^5.3.4（overrides設定）

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
