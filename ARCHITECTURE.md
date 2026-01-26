# NomikAI アーキテクチャ設計書

## 概要

食事管理とトレーニング支援を行うAIエージェント「Nomini」のシステムアーキテクチャ。
フロントエンド（Next.js）とバックエンド（Scala/Play or Node.js）を分離し、Google Cloud上で動作する。

## システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Next.js Frontend (React)                     │   │
│  │  - UI/UX (モバイルファースト)                           │   │
│  │  - 画像アップロード                                      │   │
│  │  - 結果表示                                             │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS (REST API)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Cloud Load Balancer + Cloud Armor           │   │
│  │  - Rate Limiting                                     │   │
│  │  - DDoS Protection                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Backend API Server (Cloud Run)               │   │
│  │                                                       │   │
│  │  Option A: Scala + Play Framework                   │   │
│  │  Option B: Node.js + Express                        │   │
│  │                                                       │   │
│  │  Endpoints:                                          │   │
│  │  - POST /api/v1/meals/analyze                       │   │
│  │  - POST /api/v1/calories/advice                     │   │
│  │  - GET  /api/v1/users/{id}/history                  │   │
│  │  - POST /api/v1/users/{id}/preferences              │   │
│  │  - GET  /api/v1/training/suggestions                │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
           ▼                ▼                ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│   Vertex AI      │ │  Cloud SQL   │ │ Secret Manager   │
│   (Gemini API)   │ │  PostgreSQL  │ │                  │
│                  │ │              │ │  - API Keys      │
│  - 食事画像解析   │ │  - Users     │ │  - DB Password   │
│  - カロリー推定   │ │  - Meals     │ └──────────────────┘
│  - アドバイス生成 │ │  - History   │
└──────────────────┘ │  - Settings  │
                     └──────────────┘
```

## 技術スタック

### フロントエンド
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS + Radix UI
- **Deployment**: Firebase App Hosting / Cloud Run

### バックエンド
- **Option A (推奨 - お主が慣れている)**: 
  - Language: Scala 3
  - Framework: Play Framework
  - Build Tool: sbt
  
- **Option B (軽量)**: 
  - Runtime: Node.js 20+
  - Framework: Express / Fastify
  - Language: TypeScript

### AI/ML
- **Platform**: Google Cloud Vertex AI
- **Model**: Gemini 2.5 Flash / Gemini 2.5 Pro
- **SDK**: Vertex AI SDK for Scala/Node.js

### データベース
- **Primary DB**: Cloud SQL (PostgreSQL 15)
- **Cache**: Cloud Memorystore (Redis) - optional
- **File Storage**: Cloud Storage (画像保存)

### Infrastructure
- **Container Runtime**: Cloud Run (Auto-scaling)
- **IaC**: Terraform
- **CI/CD**: Cloud Build + GitHub Actions
- **Monitoring**: Cloud Logging + Cloud Monitoring
- **Secret Management**: Secret Manager

## データモデル

### Users テーブル
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  target_weight DECIMAL(5,2),
  target_calories INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Meals テーブル
```sql
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  image_url VARCHAR(500),
  food_name VARCHAR(200),
  calories INTEGER,
  remaining_calories INTEGER,
  verdict VARCHAR(20), -- 'OK' or 'CAUTION'
  suggestion TEXT,
  eaten_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User_Settings テーブル
```sql
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  calendar_integration BOOLEAN DEFAULT FALSE,
  google_calendar_token TEXT,
  notification_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Training_History テーブル
```sql
CREATE TABLE training_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  gym_area VARCHAR(100),
  suggested_exercises JSONB,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API設計

### 1. 食事画像解析 API
```
POST /api/v1/meals/analyze
Content-Type: multipart/form-data

Request:
{
  "user_id": "uuid",
  "image": "base64_encoded_image",
  "remaining_calories": 1500
}

Response:
{
  "meal_id": "uuid",
  "food_name": "ハンバーグ定食",
  "calorie_estimate": 850,
  "verdict": "CAUTION",
  "suggestion": "夜の飲み会を考慮すると、このメニューは少し重いです。ご飯を半分にすることをお勧めします。",
  "remaining_calories": 650
}
```

### 2. カロリーアドバイス取得
```
POST /api/v1/calories/advice

Request:
{
  "user_id": "uuid",
  "food_name": "ラーメン",
  "food_calories": 700,
  "remaining_calories": 1200
}

Response:
{
  "advice": "まだ1200kcal残っているので、ラーメンを食べても大丈夫です！",
  "updated_remaining_calories": 500
}
```

### 3. 食事履歴取得
```
GET /api/v1/users/{user_id}/meals?from=2026-01-01&to=2026-01-31

Response:
{
  "meals": [
    {
      "id": "uuid",
      "date": "2026-01-19T12:30:00Z",
      "food_name": "サラダボウル",
      "calories": 450,
      "verdict": "OK"
    },
    ...
  ],
  "total_calories": 1850,
  "average_daily_calories": 1850
}
```

## セキュリティ設計

### 認証・認可
- **認証**: Firebase Authentication
- **トークン**: JWT (Firebase ID Token)
- **認可**: Role-Based Access Control (RBAC)

### API保護
- **Rate Limiting**: Cloud Armor (100 req/min per IP)
- **CORS**: 許可されたオリジンのみ
- **Input Validation**: Zod/Play Validation

### データ保護
- **通信**: TLS 1.3
- **DB**: Cloud SQL Proxy経由で接続
- **Secrets**: Secret Manager で管理
- **画像**: Cloud Storage (Signed URLs, 1時間有効)

## デプロイメント戦略

### 環境
1. **Development**: ローカル開発環境
2. **Staging**: Cloud Run (staging)
3. **Production**: Cloud Run (production)

### CI/CD パイプライン
```
GitHub Push → Cloud Build → Container Build → Deploy to Cloud Run
                           ↓
                     Run Tests (Unit + Integration)
```

### Rollback 戦略
- Cloud Run のリビジョン管理
- トラフィックの段階的移行 (Canary Deployment)

## コスト見積もり (月額)

### MVP フェーズ
- Cloud Run: ~$10 (小規模トラフィック)
- Cloud SQL: ~$25 (db-f1-micro)
- Vertex AI: ~$50-100 (画像解析量による)
- その他: ~$15
- **合計**: ~$100-150/月

### 本番フェーズ (ユーザー1000人想定)
- Cloud Run: ~$50-100
- Cloud SQL: ~$100-200
- Vertex AI: ~$300-500
- Cloud Storage: ~$20
- その他: ~$30
- **合計**: ~$500-850/月

## 今後の拡張性

### Phase 3+: 機能追加
- Google Calendar API 連携
- Google Maps API 連携（店舗推定）
- リアルタイム通知 (Cloud Pub/Sub)
- マルチデバイス対応
- 友達との共有機能

### スケーリング戦略
- Cloud Run の自動スケーリング
- Read Replica の追加
- Redis キャッシュの導入
- CDN の活用

## 開発ロードマップ

### Week 1: インフラ構築
- [x] アーキテクチャ設計
- [ ] Terraform設定
- [ ] バックエンドAPI初期実装

### Week 2: API実装
- [ ] 食事解析API
- [ ] データベーススキーマ
- [ ] 認証機能

### Week 3: フロントエンド統合
- [ ] API統合
- [ ] UI/UX改善
- [ ] テスト

### Week 4: 最終調整
- [ ] パフォーマンス最適化
- [ ] デモ動画作成
- [ ] ドキュメント整備
