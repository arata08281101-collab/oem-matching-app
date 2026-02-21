# デプロイ手順

このNext.jsアプリケーションを本番環境にデプロイする方法です。

## 方法1: Vercel（推奨・最も簡単）

VercelはNext.jsの開発元が提供するホスティングサービスで、最も簡単にデプロイできます。

### 方法1-A: ターミナルからデプロイ（CLI使用）

**最も簡単で推奨される方法です。**

1. **Vercel CLIをインストール**
   ```bash
   npm install -g vercel
   ```

2. **プロジェクトディレクトリでログイン**
   ```bash
   cd "/Users/uiarata/OEM選定アプリ"
   vercel login
   ```
   - ブラウザが開くので、Vercelアカウントでログイン（なければ作成）

3. **デプロイ実行**
   ```bash
   vercel
   ```
   - 初回は設定を聞かれます：
     - Set up and deploy? → **Y**
     - Which scope? → あなたのアカウントを選択
     - Link to existing project? → **N**（初回は新規プロジェクト）
     - What's your project's name? → プロジェクト名を入力（例: `oem-selection-app`）
     - In which directory is your code located? → **./**（そのままEnter）
     - Want to override the settings? → **N**（そのままEnter）

4. **本番環境にデプロイ**
   ```bash
   vercel --prod
   ```

5. **完了**
   - デプロイが完了するとURLが表示されます
   - `https://あなたのプロジェクト名.vercel.app` でアクセス可能

**今後の更新時は：**
```bash
vercel --prod
```
を実行するだけで、最新のコードがデプロイされます。

---

### 方法1-B: GitHub連携でデプロイ（GUI使用）

1. **Vercelアカウントを作成**
   - https://vercel.com にアクセス
   - GitHubアカウントでサインアップ（推奨）

2. **プロジェクトをGitHubにプッシュ**
   ```bash
   # Gitリポジトリを初期化（まだの場合）
   git init
   
   # すべてのファイルをステージング
   git add .
   
   # コミット
   git commit -m "Initial commit"
   
   # GitHubにリポジトリを作成し、リモートを追加
   git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git
   
   # プッシュ
   git push -u origin main
   ```

3. **Vercelでデプロイ**
   - Vercelのダッシュボードにログイン
   - "Add New Project" をクリック
   - GitHubリポジトリを選択
   - プロジェクト設定：
     - Framework Preset: Next.js（自動検出される）
     - Root Directory: `./`（そのまま）
   - "Deploy" をクリック

4. **完了**
   - 数分でデプロイが完了
   - `https://あなたのプロジェクト名.vercel.app` でアクセス可能

### 環境変数が必要な場合

- **CLI使用時**: `vercel env add` コマンドで設定
- **GUI使用時**: Vercelのプロジェクト設定 > Environment Variables から設定

---

## 方法2: Netlify

### 手順

1. **Netlifyアカウントを作成**
   - https://www.netlify.com にアクセス

2. **GitHubにプッシュ**（上記と同じ）

3. **Netlifyでデプロイ**
   - "Add new site" > "Import an existing project"
   - GitHubリポジトリを選択
   - ビルド設定：
     - Build command: `npm run build`
     - Publish directory: `.next`
   - "Deploy site" をクリック

---

## 方法3: その他のホスティングサービス

### VPS/サーバーにデプロイする場合

1. **ビルド**
   ```bash
   npm run build
   ```

2. **本番サーバーで起動**
   ```bash
   npm start
   ```

3. **PM2などでプロセス管理**（推奨）
   ```bash
   npm install -g pm2
   pm2 start npm --name "oem-app" -- start
   pm2 save
   pm2 startup
   ```

---

## デプロイ前の確認事項

1. **ビルドが成功するか確認**
   ```bash
   npm run build
   ```

2. **環境変数の確認**
   - 必要な環境変数があれば設定

3. **.gitignoreの確認**
   - `node_modules/`、`.next/`などが除外されているか

4. **package.jsonの確認**
   - `build`と`start`スクリプトが正しく設定されているか

---

## トラブルシューティング

### ビルドエラーが発生する場合

- TypeScriptのエラーを確認
- 依存関係が正しくインストールされているか確認
  ```bash
  npm install
  ```

### デプロイ後にページが表示されない場合

- ビルドログを確認
- コンソールエラーを確認
- 環境変数が正しく設定されているか確認

---

## 推奨事項

- **Vercelを使用することを強く推奨**
  - Next.jsに最適化されている
  - 自動デプロイ（GitHubにプッシュするだけでデプロイ）
  - 無料プランで十分
  - HTTPSが自動で設定される
