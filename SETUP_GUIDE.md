# プレミアムプラン決済機能のセットアップガイド

## 実装完了内容

✅ Stripe Checkoutセッション作成API (`/api/create-checkout-session`)
✅ 決済セッション確認API (`/api/check-session`)
✅ 決済完了後の処理 (`/success`ページ)
✅ プレミアムプランアップグレード機能

## 必要な環境変数の設定

### 1. Stripeアカウントの準備

1. [Stripe](https://stripe.com/jp)にアクセスしてアカウントを作成
2. ダッシュボードにログイン

### 2. 商品と価格の作成

1. Stripeダッシュボードで「商品」→「商品を追加」をクリック
2. 以下の情報を入力：
   - **商品名**: プレミアムプラン
   - **説明**: OEM選定アプリ プレミアムプラン（月額480円）
   - **価格**: 480円
   - **請求頻度**: 毎月
3. 「価格を追加」をクリック
4. 作成された価格ID（`price_xxxxx`）をコピー

### 3. APIキーの取得

1. Stripeダッシュボードで「開発者」→「APIキー」を開く
2. **公開可能キー**（`pk_test_xxxxx`）と**シークレットキー**（`sk_test_xxxxx`）をコピー
   - テスト環境では`test`キーを使用
   - 本番環境では`live`キーを使用

### 4. ローカル開発環境の設定

プロジェクトルートに`.env.local`ファイルを作成：

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxx
```

**重要**: `.env.local`ファイルは`.gitignore`に含まれているため、Gitにコミットされません。

### 5. Vercelでの環境変数設定

1. [Vercelダッシュボード](https://vercel.com)にログイン
2. プロジェクトを選択
3. 「Settings」→「Environment Variables」を開く
4. 以下の環境変数を追加：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `STRIPE_SECRET_KEY` | `sk_test_xxxxx` または `sk_live_xxxxx` | Stripeシークレットキー |
| `STRIPE_PRICE_ID` | `price_xxxxx` | 作成した価格ID |

5. 環境変数を追加したら、**再デプロイ**が必要です

## テスト決済

Stripeのテストカードを使用して決済をテストできます：

- **カード番号**: `4242 4242 4242 4242`
- **有効期限**: 任意の未来の日付（例: 12/34）
- **CVC**: 任意の3桁（例: 123）
- **郵便番号**: 任意の5桁（例: 12345）

## 本番環境への移行

1. Stripeダッシュボードで「本番モード」に切り替え
2. 本番用の商品と価格を作成
3. 本番用のAPIキーを取得
4. Vercelの環境変数を本番用のキーに更新
5. 再デプロイ

## 動作確認

1. 環境変数を設定
2. アプリを起動（`npm run dev`）
3. 検索結果を表示
4. 「プレミアムプランにアップグレード」ボタンをクリック
5. Stripe Checkoutページが表示されることを確認
6. テストカードで決済を完了
7. `/success`ページにリダイレクトされることを確認
8. ホームに戻り、プレミアムプランが有効になっていることを確認（上位2社が表示される）

## トラブルシューティング

### エラー: "Stripeシークレットキーが設定されていません"

- `.env.local`ファイルに`STRIPE_SECRET_KEY`が設定されているか確認
- Vercelの環境変数に`STRIPE_SECRET_KEY`が設定されているか確認
- 環境変数を設定した後、再デプロイが必要です

### エラー: "Stripe価格IDが設定されていません"

- `.env.local`ファイルに`STRIPE_PRICE_ID`が設定されているか確認
- Vercelの環境変数に`STRIPE_PRICE_ID`が設定されているか確認
- 価格IDは`price_`で始まる必要があります

### 決済完了後、プレミアムプランが有効にならない

- ブラウザのローカルストレージを確認（開発者ツール → Application → Local Storage）
- `/success`ページでエラーが発生していないか確認
- ブラウザのコンソールでエラーログを確認

## 参考リンク

- [Stripe公式ドキュメント](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripeサブスクリプション](https://stripe.com/docs/billing/subscriptions/overview)
