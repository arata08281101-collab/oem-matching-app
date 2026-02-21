'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import styles from '../page.module.css'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isVerifying, setIsVerifying] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    
    if (!sessionId) {
      setIsVerifying(false)
      return
    }

    // セッションを確認
    fetch('/api/check-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIsSuccess(true)
          // ローカルストレージにプレミアムプラン状態を保存
          localStorage.setItem('premium_subscription', JSON.stringify({
            subscriptionId: data.subscriptionId,
            expiresAt: data.currentPeriodEnd * 1000, // ミリ秒に変換
          }))
          // ページをリロードしてプレミアムプランの状態を反映
          setTimeout(() => {
            router.push('/')
          }, 2000)
        } else {
          setIsSuccess(false)
        }
        setIsVerifying(false)
      })
      .catch((error) => {
        console.error('エラー:', error)
        setIsVerifying(false)
      })
  }, [searchParams])

  if (isVerifying) {
    return (
      <div className={styles.container}>
        <div className={styles.formCard}>
          <h2>決済を確認中...</h2>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.formCard}>
          <h2 style={{ color: '#4a9b8e', marginBottom: '20px' }}>
            ✅ 決済が完了しました！
          </h2>
          <p style={{ marginBottom: '24px', lineHeight: '1.8' }}>
            プレミアムプランにアップグレードされました。
            上位2社の詳細情報を確認できるようになりました。
          </p>
          <button
            onClick={() => router.push('/')}
            className={styles.submitButton}
            style={{ width: '100%' }}
          >
            アプリに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h2 style={{ color: '#c44', marginBottom: '20px' }}>
          決済の確認に失敗しました
        </h2>
        <p style={{ marginBottom: '24px', lineHeight: '1.8' }}>
          決済が完了していないか、エラーが発生した可能性があります。
          サポートにお問い合わせください。
        </p>
        <button
          onClick={() => router.push('/')}
          className={styles.submitButton}
          style={{ width: '100%' }}
        >
          ホームに戻る
        </button>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.formCard}>
          <h2>読み込み中...</h2>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
