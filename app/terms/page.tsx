import styles from './page.module.css'

export default function TermsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>利用規約</h1>
        <p className={styles.lastUpdated}>制定日：2026年2月</p>
        
        <p className={styles.intro}>
          本規約は、当社が提供するOEM選定WEBアプリ（以下「本サービス」）の利用条件を定めるものです。
        </p>
        
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>第1条（サービス内容）</h2>
          <p className={styles.text}>
            本サービスは、OEM対応可能な企業情報を検索・比較できる情報提供型WEBサービスです。
            当社は取引の仲介や契約の保証は行いません。
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>第2条（有料プラン）</h2>
          <p className={styles.text}>
            有料プラン（プレミアプラン）に加入すると、詳細情報の閲覧や上位表示などの追加機能を利用できます。
            料金は月額制で、自動更新となります。
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>第3条（解約）</h2>
          <p className={styles.text}>
            ユーザーはいつでもサブスクリプションを解約できます。
            解約後、次回更新日以降は課金されません。
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>第4条（免責事項）</h2>
          <p className={styles.text}>
            当社は、本サービスの利用により生じた損害について責任を負いません。
          </p>
        </div>
      </div>
    </div>
  )
}
