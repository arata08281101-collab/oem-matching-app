import styles from './page.module.css'

export default function PrivacyPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>プライバシーポリシー</h1>
        <p className={styles.lastUpdated}>制定日：2026年2月</p>
        
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>1. 取得する情報</h2>
          <ul className={styles.list}>
            <li>メールアドレス</li>
            <li>決済情報（Stripeを通じて処理されます）</li>
            <li>アクセス情報</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>2. 利用目的</h2>
          <ul className={styles.list}>
            <li>サービス提供</li>
            <li>本人確認</li>
            <li>サポート対応</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>3. 第三者提供</h2>
          <p className={styles.text}>
            法令に基づく場合を除き、第三者に提供しません。
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>4. 外部決済</h2>
          <p className={styles.text}>
            決済はStripeを利用しています。クレジットカード情報は当社では保持しません。
          </p>
        </div>
      </div>
    </div>
  )
}
