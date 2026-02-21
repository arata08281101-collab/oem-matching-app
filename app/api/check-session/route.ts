import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripeシークレットキーが設定されていません。' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    })

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'セッションIDが必要です' },
        { status: 400 }
      )
    }

    // Stripe Checkoutセッションを取得
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    if (session.payment_status === 'paid' && session.subscription) {
      // サブスクリプション情報を取得
      const subscription = typeof session.subscription === 'string'
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription

      return NextResponse.json({
        success: true,
        subscriptionId: subscription.id,
        currentPeriodEnd: 'current_period_end' in subscription ? subscription.current_period_end : undefined,
      })
    }

    return NextResponse.json({
      success: false,
      error: '決済が完了していません',
    })
  } catch (error: any) {
    console.error('セッション確認エラー:', error)
    return NextResponse.json(
      { error: error.message || 'セッションの確認に失敗しました。' },
      { status: 500 }
    )
  }
}
