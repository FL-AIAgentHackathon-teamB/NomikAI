# Nomini Frontend

Next.js + React で構築されたフロントエンドアプリケーション。

## 開発サーバーの起動

```bash
npm install
npm run dev
```

アプリは http://localhost:9002 で起動します。

## 環境変数

`.env.local` ファイルを作成し、以下の環境変数を設定:

```bash
BACKEND_URL=http://localhost:3001
GEMINI_API_KEY=your_api_key_here
```

## ビルド

```bash
npm run build
npm run start
```

## 技術スタック

- **Framework**: Next.js 15.5 (App Router)
- **UI**: Tailwind CSS + Radix UI + shadcn/ui
- **Language**: TypeScript
- **Deployment**: Cloud Run

## ディレクトリ構造

```
src/
├── app/           # Next.js App Router
│   ├── actions.ts # Server Actions
│   ├── layout.tsx
│   └── page.tsx
├── components/    # React コンポーネント
│   ├── features/
│   ├── layout/
│   └── ui/
├── hooks/         # カスタムフック
└── lib/          # ユーティリティ
```
