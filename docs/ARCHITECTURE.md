# NomikAI アーキテクチャ設計書

## 概要

食事管理を行うAIアプリケーション「NomikAI」のシステムアーキテクチャ。
フロントエンド（Next.js）とバックエンド（Node.js/Express）を分離し、Google Cloud上で動作する。

## システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                         User                                 │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Cloud Run)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js 15 (App Router)                  │   │
│  │  - UI/UX (モバイルファースト)                           │   │
│  │  - 画像アップロード                                      │   │
│  │  - セッション・履歴表示                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS + IAM認証 (IDトークン)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Cloud Run)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Node.js + Express + Genkit                │   │
│  │                                                       │   │
│  │  Endpoints:                                          │   │
│  │  - POST /api/v1/sessions                            │   │
│  │  - GET  /api/v1/sessions/{id}                       │   │
│  │  - POST /api/v1/sessions/{id}/meals/analyze         │   │
│  │  - GET  /api/v1/sessions/{id}/meals                 │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
     ┌──────────────────────┼──────────────────────┐
     │                      │                      │
     ▼                      ▼                      ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│  Gemini API  │    │  Firestore   │    │       GCS        │
│              │    │              │    │     (images)     │
│ - 食事画像解析│    │ - sessions   │    │                  │
│ - カロリー推定│    │ - meals      │    │ - 食事画像        │
│ - アドバイス  │    │ (TTL: 3日)   │    │ (TTL: 3日)       │
└──────────────┘    └──────────────┘    └──────────────────┘
     │
     │ APIキー参照
     ▼
┌──────────────┐
│Secret Manager│
│              │
│- GEMINI_API  │
│  _KEY        │
└──────────────┘
```

## インフラ構成

### GCPリソース一覧

| リソース | 用途 | 備考 |
|----------|------|------|
| Cloud Run (Frontend) | Next.js ホスティング | 公開アクセス可 |
| Cloud Run (Backend) | API サーバー | IAM認証必須 |
| Artifact Registry | Docker イメージ保存 | |
| Firestore | セッション・食事履歴 | TTL: 1日 |
| Cloud Storage | 食事画像保存 | TTL: 1日、ライフサイクルルール |
| Secret Manager | APIキー管理 | 手動で値を設定 |
| GCS (terraform) | Terraform state | |

### 認証フロー

```
Frontend (Cloud Run)
    │
    │ 1. Google認証ライブラリでIDトークン取得
    │
    ▼
Authorization: Bearer <ID_TOKEN>
    │
    │ 2. Backend呼び出し
    │
    ▼
Backend (Cloud Run)
    │
    │ 3. IAMがトークンを検証
    │    (Frontend SAのみ許可)
    │
    ▼
処理実行
```

### VPCを使わない理由

- Cloud Run同士の通信はIAM認証で保護可能
- Firestoreは公開APIでIAMアクセス制御
- VPC Connector不要でコスト削減 (~$7/月)
- コールドスタートが速い

## 技術スタック

### フロントエンド
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS + Radix UI
- **Deployment**: Cloud Run

### バックエンド
- **Runtime**: Node.js 20+
- **Framework**: Express
- **Language**: TypeScript
- **AI SDK**: Genkit + Google GenAI

### AI/ML
- **Model**: Gemini 2.5 Flash
- **SDK**: @genkit-ai/google-genai

### データストア
- **Primary DB**: Firestore (NoSQL)
- **File Storage**: Cloud Storage (画像保存)
- **データ保持期間**: 1日間 (TTL)

### Infrastructure
- **Container Runtime**: Cloud Run (Auto-scaling)
- **Container Registry**: Artifact Registry
- **IaC**: Terraform
- **CI/CD**: GitHub Actions
- **Secret Management**: Secret Manager

## データモデル (Firestore)

### sessions コレクション
```typescript
// sessions/{sessionId}
interface Session {
  id: string;                // ドキュメントID
  name?: string;             // "新年会" など（任意、最大100文字）
  createdAt: Timestamp;
  expireAt: Timestamp;       // TTL用 (createdAt + 24時間で固定)
}
```

### meals サブコレクション
```typescript
// sessions/{sessionId}/meals/{mealId}
interface Meal {
  id: string;              // ドキュメントID
  imageUrl: string;        // GCSのURL
  analyzedAt: Timestamp;
  calories: number;
  foods: Food[];
  advice: string;
}

interface Food {
  name: string;            // "唐揚げ"
  calories: number;        // 300
  quantity?: string;       // "3個"
}
```

### TTL設定
- **有効期限**: 作成から24時間（固定）
- Firestoreの TTL機能で自動削除
- GCSのライフサイクルルールも24時間で同期削除
- ⚠️ タイミング差で一時的に404が発生する可能性あり（許容）

## セッション管理（ユーザー登録なし）

### アクセス方法
ユーザー登録なしで、以下2つの方法でセッションにアクセス：

1. **URL直接アクセス**: `nomikai.app/s/{sessionId}`
2. **ローカルストレージ**: 同じブラウザなら履歴から選択

### URL構成
```
/                    → トップページ（履歴一覧 + 新規作成）
/s/{sessionId}       → セッション詳細（食事一覧）
```

### ローカルストレージ (Frontend)
```typescript
// 保存形式
interface LocalSession {
  id: string;
  name: string;
  createdAt: string;  // ISO 8601
}

// 最新10件を保存
localStorage.setItem('sessions', JSON.stringify(sessions));
```

### トップページUI
```
┌─────────────────────────────────────────────────────┐
│  🍺 NomikAI                                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│   📸 新しいセッションを始める                         │
│   [ セッション開始 ]                                  │
│                                                     │
│   ─────────────────────────────────                 │
│                                                     │
│   📋 最近のセッション                                │
│   ┌─────────────────────────────────┐               │
│   │ 🍺 新年会         1/31 19:00    │               │
│   │    1,650 kcal    あと23時間     │               │
│   └─────────────────────────────────┘               │
│                                                     │
│   💡 URLを共有すれば他の端末でも見れます              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## API設計

### 1. セッション作成
```
POST /api/v1/sessions

Request:
{
  "name": "新年会"  // 任意
}

Response:
{
  "sessionId": "abc123",
  "name": "新年会",
  "createdAt": "2026-01-31T19:00:00Z",
  "expireAt": "2026-02-03T19:00:00Z"
}
```

### 2. 食事画像解析
```
POST /api/v1/sessions/{sessionId}/meals/analyze
Content-Type: multipart/form-data

Request:
- image: (binary)

Response:
{
  "mealId": "xyz789",
  "imageUrl": "https://storage.googleapis.com/...",
  "calories": 850,
  "foods": [
    { "name": "唐揚げ", "calories": 400, "quantity": "5個" },
    { "name": "ビール", "calories": 150, "quantity": "1杯" },
    { "name": "枝豆", "calories": 100, "quantity": "1皿" }
  ],
  "advice": "揚げ物が多めです。次は野菜を取り入れましょう！",
  "analyzedAt": "2026-01-31T19:30:00Z"
}
```

### 3. セッション詳細取得（食事履歴含む）
```
GET /api/v1/sessions/{sessionId}

Response:
{
  "sessionId": "abc123",
  "name": "新年会",
  "createdAt": "2026-01-31T19:00:00Z",
  "totalCalories": 1650,
  "meals": [
    {
      "mealId": "xyz789",
      "imageUrl": "https://...",
      "calories": 850,
      "foods": [...],
      "analyzedAt": "2026-01-31T19:30:00Z"
    },
    {
      "mealId": "xyz790",
      "imageUrl": "https://...",
      "calories": 800,
      "foods": [...],
      "analyzedAt": "2026-01-31T20:15:00Z"
    }
  ]
}
```

## セキュリティ設計

### Cloud Run間の認証
- **方式**: IAM認証 (IDトークン)
- **FrontendのSA**: Backend呼び出し権限 (`roles/run.invoker`)
- **BackendのSA**: Firestore/GCSアクセス権限

### API保護
- **Backend**: Cloud Run IAM認証必須（Frontend SAのみ許可）
- **Frontend**: 公開アクセス可 (--allow-unauthenticated)

### データ保護
- **通信**: TLS 1.3 (Cloud Run標準)
- **Secrets**: Secret Manager で管理（手動で値を設定）
- **画像**: GCS + Signed URLs
- **データ保持**: 1日間で自動削除（TTL）

## デプロイメント

### CI/CD パイプライン
```
GitHub PR
    │
    ▼
┌─────────────────────────────────┐
│  Terraform Plan (自動)          │
│  - PRにコメントで結果表示        │
└─────────────────────────────────┘
    │
    ▼ マージ
┌─────────────────────────────────┐
│  Terraform Plan (自動)          │
│  - mainでも再確認               │
└─────────────────────────────────┘
    │
    ▼ 手動実行
┌─────────────────────────────────┐
│  Terraform Apply (手動)         │
│  - "apply"入力で実行            │
└─────────────────────────────────┘
```

### Terraform管理リソース
```
terraform/
├── main.tf              # provider設定
├── variables.tf         # 変数定義
├── apis.tf              # 必要なAPIを有効化
├── artifact-registry.tf # Dockerイメージ保存
├── secret-manager.tf    # シークレットの箱
├── iam.tf               # サービスアカウント
├── firestore.tf         # データベース
├── gcs.tf               # 画像保存 + Terraform state
├── cloud-run.tf         # Frontend & Backend
└── outputs.tf           # 出力値
```

## コスト見積もり (月額)

### ハッカソン/MVP フェーズ
| サービス | 見積もり | 備考 |
|----------|----------|------|
| Cloud Run | ~$0 | 無料枠内 |
| Firestore | ~$0 | 無料枠内 |
| Cloud Storage | ~$1 | 24時間TTLで容量抑制 |
| Artifact Registry | ~$1 | イメージ保存 |
| Secret Manager | ~$0 | 無料枠内 |
| Gemini API | ~$5-20 | 使用量による |
| **合計** | **~$10-25/月** | |

### 本番フェーズ (ユーザー増加時)
- Cloud Run: ~$20-50
- Firestore: ~$10-30
- Gemini API: ~$50-100
- **合計**: ~$80-180/月

## 今後の拡張性

### 短期 (ハッカソン後)
- ユーザー認証 (Firebase Auth)
- カロリー目標設定
- 1日の食事サマリー

### 中期
- Google Calendar連携
- プッシュ通知
- 食事の手動編集

### スケーリング
- Cloud Runの自動スケーリングで対応
- 必要に応じてCloud SQL (PostgreSQL) への移行検討

## 設計判断の記録

| 判断 | 選択 | 理由 |
|------|------|------|
| DB | Firestore | VPC不要、無料枠大、スキーマレス |
| 認証 | IAM認証 (Cloud Run間) | シンプル、追加コストなし |
| VPC | 使わない | コスト削減、コールドスタート改善 |
| TTL | 作成から24時間（固定） | シンプル、Firestore/GCS同期しやすい |
| ユーザー管理 | なし (URL + localStorage) | 登録不要でハードル低い |
