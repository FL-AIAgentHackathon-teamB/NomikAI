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

**注記**: 開発環境では`NODE_ENV=development`が自動設定され、IAM認証がスキップされます。本番環境（Cloud Run）では自動的にIAM認証が有効化されます。

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
npm run genkit:watch # Genkit開発UI（watchモード、自動リロード）
```

## 技術スタック

- **Framework**: Next.js 16.x (App Router)
- **React**: React 19.x
- **UI**: Tailwind CSS + Radix UI + shadcn/ui
- **UI Libraries**: Recharts, Embla Carousel, Lucide React
- **UI Utilities**: class-variance-authority, clsx, tailwind-merge, tailwindcss-animate
- **Form Management**: React Hook Form + Zod
- **Language**: TypeScript 5.x
- **AI Integration**: Google Genkit 1.20 + Gemini 2.5 Flash
- **Authentication**: google-auth-library（Cloud Run IAM認証）
- **Utilities**: date-fns, react-day-picker
- **Build Tool**: Turbopack
- **Deployment**: Cloud Run

**依存関係の詳細:**
- Radix UI: 16個のコンポーネント（Dialog, Dropdown, Popover等）
- fast-xml-parser: ^5.3.4（overrides設定）

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
│   ├── utils.ts
│   ├── placeholder-images.ts
│   └── placeholder-images.json
└── ai/            # Genkit AI フロー（フロントエンド側）
    ├── dev.ts
    ├── genkit.ts
    └── flows/
```

