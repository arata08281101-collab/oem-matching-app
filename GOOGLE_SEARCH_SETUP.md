# Google検索に表示されるための設定ガイド

## 完了した設定

✅ **robots.txt** - 検索エンジンクローラー向けの設定ファイルを作成
✅ **sitemap.xml** - サイトマップを作成
✅ **SEOメタデータ** - 詳細なメタデータを追加（Open Graph、Twitterカードなど）
✅ **Google Search Console検証タグ** - 既に設定済み

## Google Search Consoleへの登録手順

### 1. Google Search Consoleにアクセス
1. [Google Search Console](https://search.google.com/search-console) にアクセス
2. Googleアカウントでログイン

### 2. プロパティを追加
1. 「プロパティを追加」をクリック
2. 「URLプレフィックス」を選択
3. サイトのURLを入力: `https://oem-indol.vercel.app`
4. 「続行」をクリック

### 3. 所有権の確認
1. 「HTMLタグ」の方法を選択
2. 既に `app/layout.tsx` に以下の検証タグが設定されています：
   ```html
   <meta name="google-site-verification" content="djaJNHJoQoYBiSYerMRQPxd3etDfBHC2w7hbCl4FLJ8" />
   ```
3. 「確認」をクリック

### 4. サイトマップの送信
1. 左メニューから「サイトマップ」を選択
2. 「新しいサイトマップを追加」をクリック
3. 以下のURLを入力: `https://oem-indol.vercel.app/sitemap.xml`
4. 「送信」をクリック

### 5. インデックス登録のリクエスト（オプション）
1. 左メニューから「URL検査」を選択
2. サイトのURL (`https://oem-indol.vercel.app`) を入力
3. 「インデックス登録をリクエスト」をクリック

## インデックスされるまでの時間

- **初回インデックス**: 通常、数日から数週間かかります
- **サイトマップ送信後**: 1〜2週間程度でインデックスされることが多いです
- **インデックス登録リクエスト後**: 数時間から数日でインデックスされる場合があります

## 確認方法

### 1. Google検索で確認
以下の検索クエリでサイトが表示されるか確認：
- `site:oem-indol.vercel.app`
- `OEM選定アプリ`

### 2. Google Search Consoleで確認
- 「カバレッジ」セクションでインデックスされたページ数を確認
- 「パフォーマンス」セクションで検索結果への表示状況を確認

## 注意事項

1. **デプロイが必要**: 変更を反映するには、Vercelにデプロイする必要があります
2. **robots.txtとsitemap.xml**: デプロイ後、以下のURLで確認できます：
   - `https://oem-indol.vercel.app/robots.txt`
   - `https://oem-indol.vercel.app/sitemap.xml`
3. **定期的な更新**: サイトマップは自動的に更新されますが、Google Search Consoleで定期的に確認することをお勧めします

## トラブルシューティング

### サイトがインデックスされない場合
1. Google Search Consoleでエラーがないか確認
2. robots.txtが正しく設定されているか確認
3. サイトマップが正しく送信されているか確認
4. サイトのコンテンツが十分か確認（最低限のテキストコンテンツが必要）

### 検証タグが認識されない場合
1. `app/layout.tsx` の検証タグが正しく設定されているか確認
2. サイトを再デプロイしてから再度確認を試みる
3. 別の検証方法（HTMLファイルのアップロードなど）を試す
