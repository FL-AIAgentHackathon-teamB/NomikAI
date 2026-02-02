# NomikAI Frontend

Next.js + React + shadcn/ui で構築されたフロントエンドアプリケーション。

## 開発サーバーの起動

```bash
npm install
npm run dev
```

アプリは http://localhost:9002 で起動します。（Turbopack使用）

## 環境変数

`.env.local` ファイルを作成し、以下の環境変数を設定:

```bash
BACKEND_URL=http://localhost:3001
```

（AI機能はバックエンド側で処理されます）

## ビルド

```bash
npm run build     # プロダクションビルド（NODE_ENV=production）
npm run start     # プロダクションサーバー起動
npm run lint      # リント実行
npm run typecheck # TypeScript型チェック
```

### Genkit開発ツール

```bash
npm run genkit:dev   # Genkit開発UI起動
npm run genkit:watch # Genkit開発UI（watchモード）
```

## 技術スタック

- **Framework**: Next.js 16.x (App Router)
- **UI**: Tailwind CSS + Radix UI + shadcn/ui
- **Language**: TypeScript 5.x
- **AI Integration**: Genkit 1.20 + Google Gemini
- **Build Tool**: Turbopack
- **Deployment**: Cloud Run / Firebase App Hosting

## ディレクトリ構造

```
src/
├── app/           # Next.js App Router
│   ├── actions.ts # Server Actions
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/    # React コンポーネント
│   ├── features/  # 機能コンポーネント（meal-analyzer等）
│   ├── layout/    # レイアウトコンポーネント
│   └── ui/        # shadcn/ui コンポーネント
├── hooks/         # カスタムフック
├── lib/           # ユーティリティ
└── ai/            # Genkit AI フロー（フロントエンド側）
    ├── dev.ts
    ├── genkit.ts
    └── flows/
```
