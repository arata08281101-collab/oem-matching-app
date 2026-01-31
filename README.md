# OEM選定アプリ MVP

## プロジェクト概要
「OEM先を探すのが面倒」という課題を解決するWebアプリケーション

## 機能
- ユーザーが製品カテゴリ、数量、予算、希望地域、必須条件を入力
- OEM会社データから条件に合う会社を自動で絞り込み
- スコアリングアルゴリズムで最適な会社を上位10社まで表示

## ファイル構成

```
/
├── app/
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # メインページ（入力フォームと結果表示）
│   ├── page.module.css    # ページスタイル
│   └── globals.css        # グローバルスタイル
├── lib/
│   ├── matching.ts        # マッチング・スコアリング関数
│   └── types.ts           # TypeScript型定義
├── data/
│   └── companies.json     # OEM会社データ（JSON）
├── package.json           # 依存関係
├── tsconfig.json          # TypeScript設定
├── next.config.js         # Next.js設定
├── .gitignore            # Git除外設定
└── README.md              # このファイル
```

## 技術スタック
- フレームワーク: Next.js 14 (App Router)
- 言語: TypeScript
- スタイリング: CSS Modules
- データ: JSON（静的ファイル）

## 開発手順

1. 依存関係のインストール
```bash
npm install
```

2. 開発サーバーを起動
```bash
npm run dev
```

3. ブラウザで `http://localhost:3000` を開く

## ビルドとデプロイ

1. プロダクションビルド
```bash
npm run build
```

2. プロダクションサーバーを起動
```bash
npm start
```

## マッチングアルゴリズム

`lib/matching.ts` の `matchCompanies` 関数で以下の基準でスコアリング（簡易版）：

1. **価格の適合度**（最大50点）
   - 予算内の場合：予算に対する割合が低いほど高スコア
   - 予算超過の場合：10点

2. **地域の一致**（30点）
   - 希望地域が明確で一致する場合のみ加点

3. **対応機能の数**（最大20点）
   - 対応機能数 × 5点（上限20点）

## データ構造

### companies.json
各会社は以下の情報を含みます：
- `id`: 会社ID
- `name`: 会社名
- `region`: 地域（"日本" または "中国"）
- `categories`: 対応製品カテゴリの配列
- `minQuantity` / `maxQuantity`: 対応可能な数量範囲
- `priceRange`: 価格範囲（min/max）
- `capabilities`: 対応可能な機能の配列
- `description`: 会社の説明

## 次のステップ
- [ ] バックエンドAPIの追加（必要に応じて）
- [ ] UIの改善
- [ ] スコアリングアルゴリズムの調整
- [ ] より多くのサンプルデータの追加
- [ ] 検索結果の並び替え機能
- [ ] 会社詳細ページの追加
