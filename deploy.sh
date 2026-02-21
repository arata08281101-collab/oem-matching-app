#!/bin/bash

# OEM選定アプリのデプロイスクリプト
# 使用方法: ./deploy.sh

echo "🚀 デプロイを開始します..."

# プロジェクトディレクトリに移動
cd "$(dirname "$0")"

# .gitディレクトリを一時的にバックアップ
if [ -d ".git" ]; then
  echo "📦 .gitディレクトリを一時的にバックアップします..."
  mv .git .git.backup
fi

# Vercelにデプロイ
echo "📤 Vercelにデプロイ中..."
npx vercel --prod --yes

# デプロイ結果を保存
DEPLOY_RESULT=$?

# .gitディレクトリを復元
if [ -d ".git.backup" ]; then
  echo "🔄 .gitディレクトリを復元します..."
  mv .git.backup .git
fi

# 結果を表示
if [ $DEPLOY_RESULT -eq 0 ]; then
  echo "✅ デプロイが完了しました！"
  echo "🌐 URL: https://oem-indol.vercel.app"
else
  echo "❌ デプロイ中にエラーが発生しました。"
  exit 1
fi
