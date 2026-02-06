# セッション機能設計書

**作成日**: 2026年2月5日  
**ステータス**: 提案・議論中

## 概要

現在の「1入力1レスポンス」型から、**飲み会セッション全体を管理できる**アプリケーションへの拡張提案。

### 現在の仕様
- 目標カロリーと写真を入力
- 1つのメニューを分析して結果を表示
- リセットして次の分析

### 提案する仕様
- 飲み会の開始時に目標カロリーと品数を設定
- 複数のメニューを順次登録・分析
- 各メニューで「どれくらい食べたか」を選択
- 残りカロリーと品数をリアルタイム更新
- セッション全体の履歴を表示

---

## ユーザーフロー

```
┌─────────────────────────────────────┐
│ 1. セッション初期設定画面           │
│  - 目標カロリー入力                 │
│  - 品数入力（任意）                 │
│  [飲み会スタート！]                 │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. セッション管理画面（メイン）     │
├─────────────────────────────────────┤
│ ■ ヘッダー情報                      │
│   残りカロリー: 1500 / 2000 kcal   │
│   残り品数: 3品                     │
├─────────────────────────────────────┤
│ ■ メニュー履歴（登録順）            │
│                                     │
│ ┌─────────────────────────────┐     │
│ │ メニュー1: 唐揚げ            │     │
│ │ [写真]                       │     │
│ │ 推定: 450 kcal              │     │
│ │ 提案: 半分くらいがおすすめ   │     │
│ │ [提案通り] [もっと] [少し]   │ ← 選択済みは強調表示
│ │ 実際の摂取: 315 kcal        │     │
│ └─────────────────────────────┘     │
│                                     │
│ ┌─────────────────────────────┐     │
│ │ メニュー2: サラダ            │     │
│ │ [写真]                       │     │
│ │ 推定: 150 kcal              │     │
│ │ 提案: 全部食べてOK！         │     │
│ │ [提案通り] [もっと] [少し]   │     │
│ └─────────────────────────────┘     │
│                                     │
├─────────────────────────────────────┤
│ ■ 新しいメニューを追加              │
│   [写真をアップロード]              │
│   [分析する]                        │
├─────────────────────────────────────┤
│ [セッションを終了]                  │
└─────────────────────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. セッション終了画面（任意）       │
│  - 総カロリー表示                   │
│  - 目標との比較                     │
│  - メニュー一覧                     │
│  [新しいセッションを始める]         │
└─────────────────────────────────────┘
```

---

## データ構造

### Session（セッション情報）
```typescript
interface Session {
  id: string;                  // セッションID（将来的にFirestoreで使用）
  targetCalories: number;      // 目標カロリー（例: 2000）
  remainingCalories: number;   // 残りカロリー（リアルタイム更新）
  totalDishes?: number;        // 総品数（任意、例: 5）
  remainingDishes?: number;    // 残り品数（カウントダウン）
  startedAt: Date;             // 開始時刻
  status: 'active' | 'completed'; // セッション状態
}
```

### Meal（メニュー情報）
```typescript
interface Meal {
  id: string;                  // メニューID
  sessionId: string;           // 所属するセッションID
  imageUrl: string;            // 写真のURL（Data URI）
  analyzedAt: Date;            // 分析時刻
  
  // AI分析結果
  foodName: string;            // メニュー名（例: "唐揚げ"）
  calorieEstimate: number;     // 推定カロリー（例: 450）
  suggestedRefinement: string; // 提案文（例: "半分くらいが..."）
  verdict: 'OK' | 'CAUTION';   // 判定
  
  // ユーザー選択
  consumptionLevel?: 'suggested' | 'more' | 'less'; // 摂取量レベル
  actualCalories?: number;     // 実際の摂取カロリー（計算値）
}
```

---

## 摂取量選択のロジック

ユーザーが選択したボタンに応じて、実際の摂取カロリーを計算：

| 選択肢 | 説明 | カロリー計算 | 例（推定450kcal） |
|--------|------|--------------|-------------------|
| **提案通り** | AIの提案に従う | 推定の 70% | 315 kcal |
| **もっと食べる** | 満足するまで食べた | 推定の 100% | 450 kcal |
| **少しだけ** | ほとんど食べなかった | 推定の 30% | 135 kcal |

### 計算例
```typescript
const calculateActualCalories = (
  estimate: number,
  level: 'suggested' | 'more' | 'less'
): number => {
  switch (level) {
    case 'suggested':
      return Math.round(estimate * 0.7);
    case 'more':
      return estimate;
    case 'less':
      return Math.round(estimate * 0.3);
  }
};
```

### カロリー更新フロー
1. メニュー分析完了 → 分析結果表示
2. ユーザーが摂取量を選択
3. `actualCalories` を計算
4. `remainingCalories` を更新: `残り - actualCalories`
5. `remainingDishes` があれば -1

---

## 状態管理

### React State構成
```typescript
// セッション状態
const [session, setSession] = useState<Session | null>(null);

// メニュー履歴（配列）
const [meals, setMeals] = useState<Meal[]>([]);

// 現在分析中のメニュー
const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);

// ローディング状態
const [isAnalyzing, setIsAnalyzing] = useState(false);
```

### 状態遷移
```
null (初期)
  ↓ startSession()
{ status: 'active', remainingCalories: 2000, ... }
  ↓ addMeal() → selectConsumption() → updateRemaining()
{ status: 'active', remainingCalories: 1685, meals: [meal1] }
  ↓ addMeal() → ...
{ status: 'active', remainingCalories: 1235, meals: [meal1, meal2] }
  ↓ endSession()
{ status: 'completed', ... }
```

---

## コンポーネント設計

### コンポーネント構成
```
meal-analyzer.tsx (メインコンポーネント)
  ├─ SessionInitForm        // 初期設定フォーム
  ├─ SessionView            // セッション管理画面
  │  ├─ SessionHeader       // ヘッダー（残りカロリー表示）
  │  ├─ MealList            // メニュー履歴リスト
  │  │  └─ MealCard         // 各メニューのカード
  │  │     └─ ConsumptionSelector // 摂取量選択ボタン
  │  ├─ NewMealInput        // 新規メニュー入力
  │  └─ SessionEndButton    // セッション終了ボタン
  └─ SessionSummary         // セッション終了画面（任意）
```

### 各コンポーネントの責務

#### 1. `SessionInitForm`
- **役割**: セッション開始前の初期設定
- **Props**: なし
- **State**: フォーム入力値
- **Output**: `onStart(targetCalories, totalDishes?)`

```tsx
<SessionInitForm onStart={(targetCalories, totalDishes) => {
  const newSession = {
    id: generateId(),
    targetCalories,
    remainingCalories: targetCalories,
    totalDishes,
    remainingDishes: totalDishes,
    startedAt: new Date(),
    status: 'active'
  };
  setSession(newSession);
}} />
```

#### 2. `SessionHeader`
- **役割**: 現在の状態を表示
- **Props**: `session: Session`
- **表示内容**:
  - 残りカロリー（進捗バー）
  - 残り品数
  - 経過時間（任意）

```tsx
<SessionHeader session={session} />
```

#### 3. `MealCard`
- **役割**: 各メニューの情報と摂取量選択
- **Props**: `meal: Meal`, `onSelectConsumption: (level) => void`
- **表示内容**:
  - 写真
  - メニュー名
  - 推定カロリー
  - 提案文
  - 摂取量選択ボタン
  - 実際の摂取カロリー（選択後）

```tsx
<MealCard 
  meal={meal} 
  onSelectConsumption={(level) => {
    const actualCalories = calculateActualCalories(
      meal.calorieEstimate, 
      level
    );
    updateMeal(meal.id, { consumptionLevel: level, actualCalories });
    updateRemainingCalories(actualCalories);
  }}
/>
```

#### 4. `ConsumptionSelector`
- **役割**: 3つの選択肢ボタン
- **Props**: `onSelect: (level) => void`, `selected?: level`
- **ボタン**:
  - 「提案通り」（70%）
  - 「もっと食べる」（100%）
  - 「少しだけ」（30%）

```tsx
<ConsumptionSelector
  onSelect={onSelect}
  selected={meal.consumptionLevel}
/>
```

#### 5. `NewMealInput`
- **役割**: 新しいメニューの追加
- **Props**: `remainingCalories: number`, `remainingDishes?: number`
- **機能**:
  - 写真アップロード
  - 分析ボタン
  - ローディング表示

```tsx
<NewMealInput
  remainingCalories={session.remainingCalories}
  remainingDishes={session.remainingDishes}
  onAnalyze={async (photo) => {
    const result = await analyzeMeal({
      photoDataUri: photo,
      remainingCalories: session.remainingCalories,
      remainingDishes: session.remainingDishes
    });
    const newMeal = {
      id: generateId(),
      sessionId: session.id,
      imageUrl: photo,
      analyzedAt: new Date(),
      ...result
    };
    setMeals([...meals, newMeal]);
  }}
/>
```

---

## UI/UX 考慮事項

### 1. レスポンシブデザイン
- モバイルファースト
- カードレイアウトでスクロール可能
- 新規メニュー入力は画面下部に固定（sticky）

### 2. フィードバック
- 摂取量選択後、残りカロリーをアニメーション更新
- 品数カウントダウン表示
- カロリー超過時に警告表示

### 3. エラーハンドリング
- 写真アップロード失敗時のリトライ
- AI分析失敗時のエラーメッセージ
- オフライン時の対応（将来的）

### 4. アクセシビリティ
- ボタンの適切なラベル
- カラーコントラスト確保
- キーボード操作対応

---

## 実装ロードマップ

### Phase 1: 基本機能（MVP）
- [ ] `SessionInitForm` コンポーネント作成
- [ ] `SessionView` 基本構造実装
- [ ] `SessionHeader` 実装
- [ ] `MealCard` 実装
- [ ] `ConsumptionSelector` 実装
- [ ] 状態管理（useState）実装
- [ ] **localStorage統合**（セッション永続化）
- [ ] カロリー計算ロジック実装
- [ ] 品数カウントダウン実装

**目標**: 1セッションで複数メニューを登録・管理（リロード対応）  
**データ**: localStorage（バックエンド変更不要）

### Phase 2: UX改善
- [ ] アニメーション追加
- [ ] ローディング改善
- [ ] エラーハンドリング強化
- [ ] レスポンシブ対応強化

### Phase 3: データ永続化
- [ ] Firestoreへのセッション保存
- [ ] セッション終了時に「履歴として保存」選択UI
- [ ] バックエンドAPI実装（POST /api/v1/sessions）
- [ ] 履歴画面追加
- [ ] セッション一覧表示
- [ ] デバイス間同期

**目標**: セッション履歴の管理と共有  
**データ**: localStorage（一時） + Firestore（永続）

### Phase 4: 高度な機能
- [ ] セッション共有機能
- [ ] カロリー目標の動的調整
- [ ] 栄養バランス分析

---

## API変更（バックエンド）

### 現在のAPI
```typescript
POST /api/v1/meals/analyze
{
  photoDataUri: string;
  remainingCalories: number;
  remainingDishes?: number;
}
→ { foodName, calorieEstimate, verdict, suggestedRefinement }
```

### 将来的な拡張（Phase 3以降）
```typescript
// セッション作成
POST /api/v1/sessions
{ targetCalories: number, totalDishes?: number }
→ { sessionId, ... }

// メニュー追加
POST /api/v1/sessions/:id/meals
{ photoDataUri, remainingCalories, remainingDishes }
→ { mealId, foodName, calorieEstimate, ... }

// セッション取得
GET /api/v1/sessions/:id
→ { session, meals: [...] }
```

**Phase 1ではバックエンド変更不要**（フロントエンドのみで実装可能）

---

## 技術的な検討事項

### 1. 状態管理の選択
**Option A**: `useState` のみ（MVP推奨）
- シンプル
- 学習コスト低
- 小規模アプリに最適

**Option B**: Context API
- コンポーネント間の状態共有が楽
- props drilling回避

**Option C**: Zustand / Jotai
- より高度な状態管理
- Phase 3以降で検討

**推奨**: Phase 1は `useState`、Phase 2以降でContext API検討

### 2. データ永続化戦略（確定）

**Phase 1: localStorage中心（推奨アプローチ）**

リロード対応と一時保存のため、localStorageを活用：

```typescript
// セッション開始時に保存
const startSession = (targetCalories: number, totalDishes?: number) => {
  const newSession: Session = {
    id: generateId(),
    targetCalories,
    remainingCalories: targetCalories,
    totalDishes,
    remainingDishes: totalDishes,
    startedAt: new Date(),
    status: 'active'
  };
  setSession(newSession);
  localStorage.setItem('currentSession', JSON.stringify(newSession));
};

// メニュー追加時に保存
const addMeal = (newMeal: Meal) => {
  const updatedMeals = [...meals, newMeal];
  setMeals(updatedMeals);
  localStorage.setItem('sessionMeals', JSON.stringify(updatedMeals));
};

// カロリー更新時に保存
const updateRemainingCalories = (consumed: number) => {
  const updated = {
    ...session!,
    remainingCalories: session!.remainingCalories - consumed,
    remainingDishes: session!.remainingDishes ? session!.remainingDishes - 1 : undefined
  };
  setSession(updated);
  localStorage.setItem('currentSession', JSON.stringify(updated));
};

// ページロード時に復元（useEffect）
useEffect(() => {
  const savedSession = localStorage.getItem('currentSession');
  const savedMeals = localStorage.getItem('sessionMeals');
  
  if (savedSession) {
    setSession(JSON.parse(savedSession));
  }
  if (savedMeals) {
    setMeals(JSON.parse(savedMeals));
  }
}, []);

// セッション終了時にクリア
const endSession = () => {
  setSession(null);
  setMeals([]);
  localStorage.removeItem('currentSession');
  localStorage.removeItem('sessionMeals');
};
```

**メリット**:
- ✅ バックエンド変更不要
- ✅ 実装が最速
- ✅ リロードしても復元可能
- ✅ 飲み会中の誤操作に強い

**デメリットと対策**:
- ❌ デバイス間で共有不可 → Phase 3でFirestore対応
- ❌ ブラウザキャッシュクリアで消失 → 「セッション終了時に保存」機能で対応（Phase 3）

**Phase 3: Firestore対応（将来的）**

セッション終了時に任意で履歴として保存：

```typescript
// セッション終了時
const endSession = async (saveToHistory: boolean) => {
  if (saveToHistory) {
    // バックエンドに送信
    await fetch('/api/v1/sessions', {
      method: 'POST',
      body: JSON.stringify({ session, meals })
    });
  }
  
  // localStorageはクリア
  localStorage.removeItem('currentSession');
  localStorage.removeItem('sessionMeals');
  setSession(null);
  setMeals([]);
};
```

**段階的な移行が可能**:
1. Phase 1: localStorageのみ
2. Phase 2: localStorage + オプションでFirestore保存
3. Phase 3: 完全なFirestore統合（リアルタイム同期）

### 3. 画像管理
**Phase 1**: Data URI（現状維持）
- メモリに保持
- リロードで消失

**Phase 3**: Cloud Storage
- 永続化
- サムネイル生成

---

## セキュリティ・パフォーマンス

### セキュリティ
- Data URIのサイズ制限（現状: 5MB）
- XSS対策（画像表示時）

### パフォーマンス
- メニュー数が増えた場合の仮想スクロール検討
- 画像の遅延ロード
- 分析結果のキャッシュ

---

## オープンクエスチョン（議論したいポイント）

### 1. 摂取量の選択肢
現在の提案:
- 提案通り（70%）
- もっと食べる（100%）
- 少しだけ（30%）

**質問**:
- パーセンテージは適切か？
- 選択肢は3つで十分か？（4つ目: 「全く食べない」0%も追加？）
- ラベルはわかりやすいか？

### 2. セッション終了のタイミング
**質問**:
- 明示的な「終了ボタン」が必要か？
- 自動終了（24時間後）でよいか？
- 終了後のサマリー画面は必要か？

### 3. カロリー超過時の挙動
**質問**:
- 残りカロリーがマイナスになった場合の表示は？
- 超過を警告するモーダルを出すか？
- それでも追加を許可するか？

### 4. 品数の扱い
**質問**:
- 品数は必須にするか、任意のままか？
- 品数が0になったら自動終了？
- 予定より多く来た場合の対応は？

### 5. メニューの編集・削除
**質問**:
- 登録したメニューの削除機能は必要か？
- 摂取量の変更（後から修正）は可能にするか？

### 6. UI配置
**質問**:
- 新規メニュー入力は画面下部に固定？
- それとも履歴の一番下？
- ヘッダーは sticky にするか？

---

## 参考UI（イメージ案）

### カラーリング
- **残りカロリー**: 緑（余裕あり） → 黄色（中間） → 赤（危険）
- **摂取量ボタン**: 
  - 提案通り: Primary（青）
  - もっと: Accent（オレンジ）
  - 少し: Secondary（グレー）

### アイコン
- 提案通り: `CheckCircle2`
- もっと: `ArrowUp`
- 少し: `ArrowDown`

---

## まとめ

本設計書では、NomikAIを**1回きりの分析**から**セッション型の飲み会管理アプリ**へ拡張する方針を提案しました。

**メリット**:
- ✅ 飲み会全体のカロリー管理が可能
- ✅ 複数メニューの履歴を保持
- ✅ リアルタイムでカロリーと品数を追跡
- ✅ より実用的なアプリケーション

**実装の柔軟性**:
- Phase 1はフロントエンドのみで実装可能
- バックエンドAPI変更不要
- 段階的に機能追加可能

次のステップとして、**オープンクエスチョン**について議論し、詳細仕様を確定させたいと考えています。

---

**作成者**: AI Assistant  
**レビュー待ち**: Product Owner / Developer
