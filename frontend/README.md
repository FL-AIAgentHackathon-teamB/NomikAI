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
GEMINI_API_KEY=your_gemini_api_key_here
BACKEND_URL=http://localhost:3001
```

（GEMINI_API_KEYはフロントエンド側でも使用されます。AI機能の主な処理はバックエンド側で行われます）

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
- **UI Libraries**: Recharts, Embla Carousel
- **Form Management**: React Hook Form + Zod
- **Language**: TypeScript 5.x
- **Utilities**: date-fns, lucide-react
- **AI Integration**: Genkit 1.20 + Google Gemini
- **Build Tool**: Turbopack
- **Deployment**: Cloud Run / Firebase App Hosting

**依存関係の詳細:**
- Radix UI: 多数のコンポーネント（Dialog, Dropdown, Popover等）
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
