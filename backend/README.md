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
- **AI**: Google Genkit 1.20 + Gemini 2.0 Flash
- **Language**: TypeScript 5.x
- **Build Tool**: tsx (開発時), tsc (ビルド時)
- **Deployment**: Cloud Run

## API エンドポイント

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
    "suggestedRefinement": "..."
  }
}
```

### GET /api/v1/meals/health
ヘルスチェック

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
