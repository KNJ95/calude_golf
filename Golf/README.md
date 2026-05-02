# my caddie - デプロイ手順

ゴルフショット記録アプリ。

## ファイル構成

```
mycaddie-deploy/
├── public/
│   ├── index.html       ← HTMLテンプレート（PWA設定含む）
│   └── manifest.json    ← PWA manifest
├── src/
│   ├── App.jsx          ← メインアプリ（6000行）
│   ├── courses.json     ← コースマスター
│   ├── index.js         ← エントリポイント
│   └── index.css        ← グローバルCSS
├── package.json
├── .gitignore
└── README.md
```

## デプロイ手順（Vercel · 無料）

### 前提

- Googleアカウントまたはメールアドレス（GitHub・Vercelどちらも作成に必要）
- 所要時間：15〜20分

### Step 1: GitHubアカウント作成（持っていなければ）

1. https://github.com/ にアクセス
2. 「Sign up」→ メール・パスワード設定
3. メール認証完了

### Step 2: GitHubに新リポジトリ作成

1. ログイン後、右上「+」→「New repository」
2. Repository name: `mycaddie`（任意）
3. **Public** または **Private** どちらでもOK（個人用ならPrivate推奨）
4. 「Create repository」

### Step 3: コードをアップロード

**方法A: ブラウザから直接アップロード（簡単・GitなしOK）**

1. 作成したリポジトリのトップページで「uploading an existing file」リンクをクリック
2. このフォルダ（`mycaddie-deploy`）の中身を**全部選択してドラッグ&ドロップ**
   - `src/`、`public/` フォルダごと、`package.json`、`.gitignore`、`README.md` まで
3. 「Commit changes」

**方法B: Gitコマンド（PCにGitが入っているなら）**

```bash
cd mycaddie-deploy
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mycaddie.git
git push -u origin main
```

### Step 4: Vercelアカウント作成・連携

1. https://vercel.com/ にアクセス
2. 「Sign Up」→「Continue with GitHub」（GitHubでログイン推奨）
3. GitHub連携を許可

### Step 5: Vercelでデプロイ

1. Vercelダッシュボードで「Add New...」→「Project」
2. GitHubのリポジトリ一覧から `mycaddie` を選んで「Import」
3. **設定はそのまま（CRAは自動検出される）**
4. 「Deploy」ボタンを押す
5. **2〜3分待つ** → ビルド完了

### Step 6: 完成

- URLが発行される（例：`mycaddie-xxx.vercel.app`）
- iPhoneのSafariで開いてホーム画面に追加
- **CodeSandboxバナーは消える**

## アプリの更新方法

GitHubのリポジトリにファイルを上書きアップロードすると、Vercelが**自動で再ビルド・再デプロイ**します（30秒〜2分）。

例：`courses.json` を更新したい時
1. GitHubの `src/courses.json` を開く
2. 鉛筆マークで編集 → 内容書き換え → コミット
3. 自動で Vercel に反映

## トラブルシューティング

**Q: ビルドが失敗する**
- `package.json` 内の依存関係が正しいか確認
- Vercelのビルドログを確認（エラーメッセージが出る）

**Q: デプロイ後にアプリが真っ白**
- ブラウザの開発者ツール（F12）でエラー確認
- `manifest.json` のパスが正しいか確認

**Q: PWAアイコンが表示されない**
- 現状 `favicon.ico` `icon-192.png` `icon-512.png` が未配置
- 画像が必要なら、適当なロゴ画像を `public/` に置けばOK
- 一旦なくてもアプリ自体は動く

## 既知の注意点

- **iCloud同期はしない**：データは端末のlocalStorageのみ
- **Safariの「履歴とWebサイトデータを消去」をすると全データ消える**
- 機種変更前にデータエクスポート機能（v1.2予定）の利用を検討



**作成日**: 2026年5月2日
**プロダクト**: my caddie（ゴルフショット記録 PWA）
**リリースバージョン**: v2.1

---

## 1. プロダクト概要

iPhone / Android 向けのゴルフショット記録 PWA。
ラウンド中の各ショットを記録し、累積データから自動的にクラブ別パフォーマンスを分析する。

**コンセプト**: 簡単入力 + 詳細分析

---

## 2. 技術スタック

### 2.1 言語・フレームワーク

| カテゴリ | 採用技術 | 補足 |
|---|---|---|
| 言語 | JavaScript (ES2022) | TypeScript 不採用（軽量さ重視） |
| UI | React 18 (関数コンポーネント + Hooks) | useState / useMemo / useEffect 中心 |
| ビルド | Create React App | デフォルト設定 |
| ファイル構成 | 単一 JSX ファイル中心 | `App.jsx` 約 10,000 行（v2.1） |

### 2.2 ライブラリ依存

| ライブラリ | 用途 | 備考 |
|---|---|---|
| react | UI | 18.x |
| react-dom | 描画 | 18.x |
| (なし) | アイコン | **lucide-react は不採用**、SVG をインライン定義 |

外部 UI ライブラリを意図的に避け、SVG を直接記述することでバンドルサイズを最小化している。

### 2.3 ブラウザ API

| API | 用途 |
|---|---|
| Web Speech API (`SpeechRecognition`) | 音声入力 |
| LocalStorage | データ永続化（ブラウザローカル） |
| Touch Events | スワイプ削除（自前実装） |

### 2.4 ホスティング・デプロイ

| 項目 | 内容 |
|---|---|
| ソース管理 | GitHub: `KNJ95/calude_golf` |
| デプロイ先 | Vercel（自動デプロイ） |
| 公開URL | `calude-golf.vercel.app` |
| ブランチ | `main`（本番）、`develop`（実験） |
| ルートディレクトリ | `Golf/`（モノレポ風） |

### 2.5 ファイル構成

```
Golf/
├── public/
│   ├── index.html
│   └── manifest.json     # PWA マニフェスト
├── src/
│   ├── App.jsx           # 約10,000行、全UIロジック・スタイル
│   ├── courses.json      # コースマスタデータ（109レコード）
│   ├── index.css
│   └── index.js
└── package.json
```

CSS は `App.jsx` 内にテンプレートリテラルで埋め込み、コンポーネントと同居している（インラインスタイル + CSS-in-JS のような構造）。

---

## 3. データモデル

### 3.1 トップレベル State

```js
state = {
  rounds: Round[],
  clubs: Club[],
  unit: 'yd' | 'm',
  courseMasters: CourseMaster[],
}
```

### 3.2 Round

```js
{
  id: string,
  date: 'YYYY-MM-DD',
  venue: string,
  course: string,
  frontCourse: string,
  backCourse: string,
  tee: 'Blue' | 'White' | 'Red' | 'Gold',
  weather: string,
  holes: Hole[18],
  createdAt: number,
}
```

### 3.3 Hole

```js
{
  id: string,
  number: 1..18,
  par: number,
  distance: number | null,
  shots: Shot[],
  manualScore?: number,    // 手入力スコア優先
  manualPutts?: number,    // 手入力パット数優先
}
```

### 3.4 Shot（v2.1 で大幅拡張）

#### 通常ショット（driver / wood / utility / iron）

```js
{
  id: string,
  clubId: string,
  distance: number | null,           // ヤード or メートル
  lie: 'tee' | 'fw' | 'rough' | 'bunker' | 'green',
  nextLie: 'fw' | 'rough' | 'bunker' | 'green' | 'pond',
  direction: 'left' | 'straight' | 'right' | null,
  depth: 'short' | 'pin' | 'over' | null,
  selfRating: 'good' | 'ok' | 'miss' | 'bad' | null,
  outcome: 'in_play' | 'ob' | 'lost' | 'penalty_red' | 'penalty_yellow',
  contact: 'nice' | 'duff' | 'top' | 'shank' | null,    // v2.1 新規
  excludeFromAvg: boolean,                              // v2.1 新規
  memo: string,
}
```

#### パター（category: 'putter'）

```js
{
  id: string,
  clubId: string,
  puttDistance: number | null,        // メートル
  puttLineSlope: 'up' | 'flat' | 'down' | null,
  puttLineCurve: 'hook' | 'straight' | 'slice' | null,
  puttResult: 'in' | 'ok' | 'short' | 'over' | 'left' | 'right',
  outcome: 'in_play',
  memo: string,
}
```

#### ウェッジ（category: 'wedge'）v2.1 新規

```js
{
  id: string,
  clubId: string,
  wedgeTargetDistance: number | null,    // ピンまでの距離
  wedgeDistance: number | null,          // 実距離
  wedgeResult: string[],                 // ['pin','left'] など複数選択（グループ単一）
  contact: 'nice' | 'duff' | 'top' | 'shank' | null,
  excludeFromAvg: boolean,
  outcome: 'in_play',
  memo: string,
}
```

ウェッジの `wedgeResult` は **配列** で、グループごとに排他的に選択：

| グループ | 選択肢 |
|---|---|
| 状態 | `pin` (カップイン) / `green` (グリーン乗) |
| 距離 | `short` / `over` |
| 方向 | `left` / `right` |

旧データ（string）との互換のため、読み取り時に自動的に配列化。

---

## 4. v2.1 実装機能一覧

### 4.1 入力機能

#### 音声入力（Web Speech API）

`parseTranscript()` 関数で日本語音声をパース。一括認識に対応。

**認識項目**:
- クラブ（ドライバー / 7番アイアン / 七番アイアン / ナナ番アイアン / 56度 など漢数字対応）
- 距離（数字 + ヤード/メートル）
- ライ（フェアウェイ / ラフ / バンカー / 池 など）
- 方向（左 / 真っ直ぐ / 右）
- 距離感（ショート / ピン / オーバー）
- 自己評価（ナイス / OK / ミス / ダメ）
- 結果（OB / ロスト / 赤杭 / 黄杭）
- 打感（ナイスショット / ダフリ / トップ / シャンク）
- ウェッジ「ピンまで」距離
- ウェッジ結果（カップイン / グリーン乗 / ショート / 左外し など）

**例**: 「ピンまで50ヤード 55ヤード ショート 左外し ダフリ」で 6 項目を一発入力。

ウェッジ度数の動的マッピング: 「56度40ヤード」と発話すると、ユーザー登録クラブから最も近い度数（同距離なら大きい方優先）を選択。

#### ウェッジ専用UI

クラブ選択で `category === 'wedge'` のクラブが選ばれると専用 UI に切替：

- ピンまで距離（ヤード）
- 実距離（ヤード、ピンまでとの差分をリアルタイム表示）
- クイック距離ボタン（20/30/50/70/90/110）
- ±調整ボタン（-5/-1/+1/+5）
- 結果（6 択、グループ単一・複数選択可能）
- 打感
- 「平均距離から除外」フラグ

#### パター専用UI

`category === 'putter'` で専用 UI 表示：

- 距離（メートル）+ クイックボタン（1/2/3/5/7/10m）
- ライン読み（傾斜：登り/平/下り、曲がり：フック/直/スライス）
- 結果 6 択（IN / OK圏 / ショート / オーバー / 左 / 右）
- **複数打一括入力**（2パットを 1 操作で記録、`manualScore` / `manualPutts` 自動加算）

#### スワイプ削除

ショット行を **左方向にスワイプ** すると右端から赤い削除ボタンが現れる、iOS 風の操作感。
- 60px 以上スワイプで削除ボタン表示
- タッチイベントで自前実装（外部ライブラリ不使用）
- ジェスチャ中の誤クリック防止ロジック付き

#### その他の入力強化

- **「平均距離から除外」フラグ**: 平均距離からは除外、ミス率にはカウント。「打ち直し」フラグの後継として統合（旧 `isReplay` は廃止）
- **±距離調整ボタン**: 距離数値の細かい調整
- **クイック距離ボタン**: 6 つのプリセット距離

### 4.2 分析機能

#### ショットタブ（旧「距離」タブを刷新）

各クラブが**カード形式**で並び、タップで詳細画面へ遷移：

```
┌─ DR ──────────  12回 ──►┐
│ ┌信頼距離┐ ┌レンジ┐ ┌ミス率┐│
│ │ 240yd ││210-260││ 18% ││
│ └───────┘└──────┘└──────┘│
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░          │
└──────────────────────────┘
```

#### クラブ詳細画面（v2.1 新規）

各クラブの全分析を 1 画面に集約：

1. 基本統計（信頼距離、中央値、レンジ、ミス率）
2. ライ別距離（FW vs ラフ）
3. 方向の傾向（左 / 直 / 右、セグメントバー）
4. 距離感の傾向（短 / ピン / 長、セグメントバー）
5. 結果分布（セーフ / OB / ロスト / 赤杭 / 黄杭）
6. 自己評価分布（◎ / ○ / △ / ✕）
7. 打感分布（ナイス / ダフリ / トップ / シャンク）
8. メモ一覧（新しい順、日付・コース・ホール・距離・自己評価・打感・結果のメタ情報付き）

#### ウェッジタブ（v2.1 新規）

コントロールショット専用分析：

- クラブ別の平均距離・レンジ
- カップイン率・ミス率
- 距離精度（絶対誤差 ±N yd、サンプル数）
- クセ（符号付き平均、長め / 短め / ぴったり）
- 結果分布バー（カップイン / 乗 / 短 / 長 / 左 / 右）

#### ラウンドタブ + ラウンド詳細画面（v2.1 新規）

各ラウンドカードがクリック可能。詳細画面：

1. スコア概要（合計スコア + 対パー、パット、パーオン、FWキープ、OB、3パット以上）
2. クラブ別集計（このラウンド限定）
3. ホール別（Par / スコア / 差分ラベル「バーディ・パー・ボギー…」/ パット数）

#### 計算ロジック

| 関数 | 用途 |
|---|---|
| `computeClubStats(state)` | クラブ別統計（信頼距離、ライ別、方向、距離感、ミス率） |
| `computeWedgeStats(state)` | ウェッジ専用統計（精度、クセ、結果分布） |
| `computeRoundKPI(round, clubs)` | ラウンド別 KPI（スコア、パット、パーオン） |
| `aggregateKPI(rounds)` | 複数ラウンドの集約 |

「信頼距離」は trimmed mean（上下 20% 除外平均）で算出。
ウェッジ・パターは通常クラブの距離分析対象から除外（性質が異なるため）。

### 4.3 AI 連携

3 種類の Gemini 用プロンプトをコピーボタンで提供。クリップボードに Markdown 形式で出力。

#### `buildClubDistancePrompt(state)`

ラウンド中の番手相談用（軽量）。
- クラブ別の信頼距離・FW距離・ラフ距離・レンジ・ミス率・方向傾向・距離感傾向
- ウェッジ実戦距離（カップイン率・距離精度・クセ）

#### `buildIssueAnalysisPrompt(state)`

累積データからの課題分析・練習メニュー提案用。
- サマリ KPI（直近 5 ラウンド vs 全期間）
- クラブ別パフォーマンス
- ウェッジパフォーマンス
- 打感の傾向（クラブ別）
- 最近のショットメモ（最新 20 件、定性的気づき）

#### `buildRoundReviewPrompt(round, clubs, unit)`

1 ラウンドの詳細振り返り用。
- 全 18 ホールのスコア
- 全ショット一覧（ホール / Par / # / クラブ / 距離 / 打点 / 着地 / 方向 / 距離感 / 自己評価 / 打感 / 結果 / 平均除外 / メモ）
- クラブ別傾向（このラウンド）
- ウェッジ集計（精度、クセ、結果分布）
- 打感集計（クラブ別ミス系内訳）

### 4.4 コースデータ

`courses.json` にコースマスタを 109 レコード収録（15 会場、北海道・関東圏）。

#### 収録会場（v2.1 で追加した 7 会場）

| 会場 | コース | レコード数 |
|---|---|---|
| 小樽カントリー倶楽部 | 新コース OUT/IN | 8 |
| エルムカントリー倶楽部 | 西/東 OUT/IN | 12 |
| シャトレーゼカントリークラブマサリカップ | OUT/IN | 4 |
| 北海道リンクスカントリー倶楽部 | 美唄 OUT/IN | 6 |
| 空知川ラベンダーの森ゴルフコース | 北 OUT/IN | 4 |
| 札幌リージェントゴルフ倶楽部 | 旧/新 OUT/IN | 12 |
| 東京湾カントリークラブ | 長浦/久保田/蔵波（各 9H） | 3 |

ティー色は `Gold / Blue / White / Red` の 4 色をサポート。
9 ホール構成のコースは frontCourse + backCourse の組み合わせで 18 ホールを構築。

---

## 5. 主要コンポーネント

### 5.1 画面コンポーネント

| コンポーネント | 役割 |
|---|---|
| `App` | ルート、画面遷移管理 |
| `HomeView` | ホーム画面、ラウンド一覧 |
| `NewRoundSheet` | 新規ラウンド作成シート |
| `RoundView` | ラウンド画面、ショット記録 |
| `ShotEditor` | ショット入力モーダル（通常 / パター / ウェッジ自動切替） |
| `ShotRow` / `ShotRowInner` | ショット一覧行（スワイプ削除ラッパー含む） |
| `AnalyticsView` | 分析タブ親（タブ切替） |
| `ShotTab` | クラブリスト |
| `ClubDetailView` | クラブ詳細画面（v2.1 新規） |
| `WedgeTab` | ウェッジ専用分析（v2.1 新規） |
| `TendencyTab` | ミス傾向（方向・距離感セグメント） |
| `RoundsTab` | ラウンド一覧 KPI |
| `RoundDetailView` | ラウンド詳細画面（v2.1 新規） |
| `CoursesView` | コース管理 |
| `ClubsView` / `ClubAddSheet` | クラブ管理 |

### 5.2 主要ヘルパー関数

| 関数 | 役割 |
|---|---|
| `isShotOffPlay(shot)` | OB・ロスト・ペナ判定 |
| `isExcludedFromAvg(shot)` | 平均距離除外フラグ判定 |
| `isMissShot(shot)` | ミスショット判定（自己評価 △/✕、off-play、平均除外フラグ） |
| `getShotOutcome(shot)` | 結果取得 |
| `getShotSelfRating(shot)` | 自己評価取得 |
| `getHoleScore(hole)` | ホールスコア（手入力優先） |
| `getHolePutts(hole, clubs)` | ホールパット数（手入力優先） |
| `median(arr)` / `trimmedMean(arr)` | 統計値 |

---

## 6. 設計上の判断

### 6.1 単一ファイル構成の理由

`App.jsx` 1 ファイルに全コードを集中させている：
- ファイル間の import 解決の手間を排除
- リファクタの自由度（型がないため境界がぶれやすい問題を回避）
- AI に全文渡してデバッグできる

トレードオフ: 可読性・保守性は犠牲（10,000 行超え）。
将来的にコンポーネント分割を検討するか、TypeScript 化するかは課題。

### 6.2 lucide-react を不採用とした理由

- アイコン需要が限定的（10 種類程度）
- バンドルサイズの削減（数十 KB）
- SVG をインライン記述すれば十分

### 6.3 LocalStorage のみで永続化

- バックエンド構築コスト不要
- 個人利用前提のデータ規模
- マルチデバイス同期は v2.1 では非対応

### 6.4 「打ち直し」フラグの廃止

旧 `isReplay`（打ち直しは距離もミス率も完全除外）を廃止し、
`excludeFromAvg`（平均からは除外、ミス率にはカウント）に統一。

理由: ユーザー要望で「ミスとしては数えたいが、平均には入れたくない」という中間的な需要が判明。
旧データはマイグレーションせず無視（ユーザー指示）。

### 6.5 ウェッジ結果の配列化

v2.1 後半で「結果は複数選択可能にしたい」要望に対応。
- `wedgeResult: string` → `wedgeResult: string[]`
- グループ単位で排他選択（状態 / 距離 / 方向の 3 グループ）
- 例: `['short', 'left']`（短くて左外し）が記録可能

旧データ（文字列）との互換性を保つため、読み取り時に `Array.isArray()` で判定して配列化。

---

## 7. 既知の制約・今後の課題

### 7.1 制約

- LocalStorage のみ → デバイス間データ同期なし
- `App.jsx` 10,000 行 → 可読性に難あり
- 音声入力で「メモ」は未対応
- TypeScript 不採用 → 型安全性は皆無
- テスト未整備

### 7.2 今後の検討項目

| 項目 | 優先度 | 備考 |
|---|---|---|
| 入力項目のオプション化 | 中 | 11 項目を全部埋める負担を軽減 |
| クイックショットモード | 中 | クラブ + 距離だけで保存 |
| メモの音声入力対応 | 低 | 形態素解析が必要 |
| バックエンド・データ同期 | 低 | コスト次第 |
| TypeScript 化 | 低 | 大規模リファクタ |
| メモのキーワード集計 | 低 | 「ひっかけ」「ダフリ」等の頻度可視化 |
| iPhone Pro Max 対応 | 完了（develop） | safe-area-inset 対応済み、main 未反映 |

---

## 8. 開発体制

- 開発: 1 名
- 期間: 継続中（v2.1 はこのセッションで実装）
- ブランチ運用: `main`（本番） / `develop`（実験）
- デプロイ: Git push → Vercel 自動デプロイ

---

## 9. 動作環境

| 項目 | 推奨 |
|---|---|
| ブラウザ | Chrome / Safari（iOS Safari 含む） |
| デバイス | iPhone / Android スマートフォン |
| 画面サイズ | 360px〜 |
| ネット接続 | 初回ロード時のみ必須（PWA としてオフライン動作可能） |
| 音声入力 | Web Speech API 対応ブラウザ（Chrome 推奨） |

---

## 10. リリースサマリ

| 指標 | 数値 |
|---|---|
| App.jsx 行数 | 約 10,043 行 |
| courses.json レコード数 | 109 件（15 会場） |
| コンポーネント数 | 約 20 |
| 主要ヘルパー関数 | 約 15 |
| 計算関数 | 4（computeClubStats、computeWedgeStats、computeRoundKPI、aggregateKPI） |
| AI プロンプト関数 | 3 |
| 外部依存ライブラリ | 2（react、react-dom） |

---
