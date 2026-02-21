import styles from './page.module.css'

export default function LegalPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>特定商取引法に基づく表記</h1>
        
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>販売事業者名</h2>
          <p className={styles.text}>宇井新</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>所在地</h2>
          <p className={styles.text}>請求があった場合に遅滞なく開示します</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>メールアドレス</h2>
          <p className={styles.text}>sample@example.com</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>販売価格</h2>
          <p className={styles.text}>プレミアムプラン 月額3,000円（税込）</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>支払方法</h2>
          <p className={styles.text}>クレジットカード（Stripe）</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>支払時期</h2>
          <p className={styles.text}>申込時に即時決済</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>解約方法</h2>
          <p className={styles.text}>マイページよりいつでも解約可能</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>返金について</h2>
          <p className={styles.text}>サービスの性質上、返金は行いません</p>
        </div>
      </div>
    </div>
  )
}
