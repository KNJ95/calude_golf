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
