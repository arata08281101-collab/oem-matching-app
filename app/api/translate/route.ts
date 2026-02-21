import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'テキストが必要です' },
        { status: 400 }
      )
    }

    // Google Translate API（無料版）を使用
    // 注意: 本番環境では、APIキーを使用することを推奨します
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=en&dt=t&q=${encodeURIComponent(text)}`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      }
    )

    if (!response.ok) {
      throw new Error('翻訳APIの呼び出しに失敗しました')
    }

    const data = await response.json()
    
    // Google Translate APIのレスポンス形式: [[["翻訳結果", "原文", null, null, 0]], ...]
    if (Array.isArray(data) && Array.isArray(data[0]) && Array.isArray(data[0][0])) {
      const translatedText = data[0]
        .map((item: any[]) => item[0])
        .join('')
      
      return NextResponse.json({ translatedText })
    }

    throw new Error('翻訳結果の形式が正しくありません')
  } catch (error) {
    console.error('翻訳エラー:', error)
    return NextResponse.json(
      { error: '翻訳に失敗しました。しばらくしてから再度お試しください。' },
      { status: 500 }
    )
  }
}
