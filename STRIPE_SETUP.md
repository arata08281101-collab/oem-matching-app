# Stripe決済システムのセットアップ

このアプリケーションでは、Stripeを使用してプレミアムプランの月額サブスクリプション決済を実装しています。

## セットアップ手順

### 1. Stripeアカウントの作成

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

### 4. 環境変数の設定

#### ローカル開発環境

プロジェクトルートに`.env.local`ファイルを作成：

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Vercelでの環境変数設定

1. [Vercelダッシュボード](https://vercel.com)にログイン
2. プロジェクトを選択
3. 「Settings」→「Environment Variables」を開く
4. 以下の環境変数を追加：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `STRIPE_SECRET_KEY` | `sk_test_xxxxx` または `sk_live_xxxxx` | Stripeシークレットキー |
| `STRIPE_PRICE_ID` | `price_xxxxx` | 作成した価格ID |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_xxxxx` または `pk_live_xxxxx` | Stripe公開可能キー（現在は未使用） |

### 5. Webhookの設定（オプション）

サブスクリプションの状態変更（キャンセル、更新など）を自動で処理するには、Webhookを設定します：

1. Stripeダッシュボードで「開発者」→「Webhook」を開く
2. 「エンドポイントを追加」をクリック
3. エンドポイントURL: `https://oem-indol.vercel.app/api/webhook`
4. イベントを選択：
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
5. 「エンドポイントを追加」をクリック
6. シグネチャシークレット（`whsec_xxxxx`）をコピー
7. Vercelの環境変数に`STRIPE_WEBHOOK_SECRET`を追加

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
5. Webhookエンドポイントを本番URLに更新

## トラブルシューティング

### エラー: "価格IDが設定されていません"

- `.env.local`ファイルに`STRIPE_PRICE_ID`が設定されているか確認
- Vercelの環境変数に`STRIPE_PRICE_ID`が設定されているか確認

### エラー: "Stripe Checkoutセッション作成エラー"

- `STRIPE_SECRET_KEY`が正しく設定されているか確認
- Stripe APIキーが有効か確認
- ネットワーク接続を確認

### 決済完了後、プレミアムプランが有効にならない

- ブラウザのローカルストレージを確認
- `/success`ページでエラーが発生していないか確認
- ブラウザのコンソールでエラーログを確認

## 参考リンク

- [Stripe公式ドキュメント](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripeサブスクリプション](https://stripe.com/docs/billing/subscriptions/overview)
