# NomikAI - プロジェクト概要

このプロジェクトは、フロントエンド、バックエンド、インフラが分離されたモノレポ構成です。

## ディレクトリ構成

```
nomikai/
├── frontend/          # Next.js フロントエンド
├── backend/           # Express バックエンドAPI  
├── terraform/         # Infrastructure as Code
├── docs/              # プロジェクトドキュメント
├── README.md          # このファイル（全体の説明）
├── ARCHITECTURE.md    # アーキテクチャ設計
├── DEPLOYMENT.md      # デプロイ手順
└── specs.md          # 要件定義
```

各ディレクトリの詳細は、それぞれのREADMEを参照してください。

## クイックスタート

### 開発環境のセットアップ

```bash
# 1. バックエンドの起動
cd backend
npm install
npm run dev
# → http://localhost:3001

# 2. フロントエンドの起動（別ターミナル）
cd frontend
npm install
npm run dev
# → http://localhost:9002
```

詳細は [README.md](README.md) を参照してください。

## ドキュメント

- **[README.md](README.md)** - 詳細なセットアップとコマンド一覧
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - システムアーキテクチャとデータモデル
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Google Cloudへのデプロイ手順
- **[specs.md](specs.md)** - 要件定義と機能仕様
- **[frontend/README.md](frontend/README.md)** - フロントエンド詳細
- **[backend/README.md](backend/README.md)** - バックエンドAPI詳細（作成推奨）
