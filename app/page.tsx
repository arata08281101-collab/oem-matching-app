'use client'

import { useState, FormEvent, useEffect } from 'react'
import { matchCompanies } from '@/lib/matching'
import { UserInput, MatchResult, Company } from '@/lib/types'
import companiesDataRaw from '@/data/companies.json'
import styles from './page.module.css'

// JSONデータを正しい型に変換
const companiesData = companiesDataRaw as Company[]

// capabilitiesの日本語表示マッピング
const capabilityLabels: Record<string, string> = {
  'digital_print': 'デジタルプリント',
  'embroidery': '刺繍',
  'label': 'タグ付け',
  'screen_print': 'スクリーンプリント',
  'silk_print': 'シルクプリント',
  'vintage_wash': 'ヴィンテージウォッシュ',
  'heavyweight': 'ヘビーウェイト',
  'print': 'プリント',
  'basic_print': 'ベーシックプリント',
  'distressed': 'ディストレス加工',
  'custom_label': 'カスタムラベル',
  'puff_print': 'パフプリント',
  'custom_packaging': 'カスタムパッケージング',
  'bulk_production': '大量生産',
}

// 検索結果が少ない理由を分析する関数
function analyzeLowResults(
  companies: Company[],
  userInput: UserInput,
  matchedCount: number
): string[] {
  const reasons: string[] = []
  
  // カテゴリに該当する企業数を確認
  const categoryCompanies = companies.filter(c => c.categories.includes(userInput.category))
  if (categoryCompanies.length === 0) {
    reasons.push(`「${userInput.category === 'tshirt' ? 'Tシャツ' : userInput.category === 'cap' ? 'キャップ' : 'フーディ'}」カテゴリに該当する企業が登録されていません`)
    return reasons
  }
  
  // 実績年数のフィルタリング
  if (userInput.minYearsActive) {
    const yearsFiltered = categoryCompanies.filter(c => c.years_active >= userInput.minYearsActive!)
    if (yearsFiltered.length < categoryCompanies.length * 0.3) {
      reasons.push(`実績年数「${userInput.minYearsActive}年以上」の条件が厳しすぎる可能性があります（該当: ${yearsFiltered.length}社 / 全${categoryCompanies.length}社）`)
    }
  }
  
  // MOQのチェック
  const moqFiltered = categoryCompanies.filter(c => userInput.quantity >= c.moq_min)
  if (moqFiltered.length < categoryCompanies.length * 0.3) {
    const avgMoq = categoryCompanies.reduce((sum, c) => sum + c.moq_min, 0) / categoryCompanies.length
    reasons.push(`数量「${userInput.quantity.toLocaleString()}個」が少なすぎる可能性があります（平均MOQ: ${Math.round(avgMoq).toLocaleString()}個）`)
  }
  
  // 予算のチェック
  const budgetFiltered = categoryCompanies.filter(c => {
    const averagePrice = (c.price_range[0] + c.price_range[1]) / 2
    const minCost = averagePrice * c.moq_min
    return minCost <= userInput.budget
  })
  if (budgetFiltered.length < categoryCompanies.length * 0.3) {
    const avgMinCost = categoryCompanies
      .map(c => {
        const avgPrice = (c.price_range[0] + c.price_range[1]) / 2
        return avgPrice * c.moq_min
      })
      .reduce((sum, cost) => sum + cost, 0) / categoryCompanies.length
    reasons.push(`予算「¥${userInput.budget.toLocaleString()}」が低すぎる可能性があります（平均必要予算: ¥${Math.round(avgMinCost).toLocaleString()}）`)
  }
  
  // 必須条件のチェック
  if (userInput.requiredCapabilities.length > 0) {
    const capabilityFiltered = categoryCompanies.filter(c => {
      return userInput.requiredCapabilities.every(req => c.capabilities.includes(req))
    })
    if (capabilityFiltered.length < categoryCompanies.length * 0.3) {
      reasons.push(`必須条件「${userInput.requiredCapabilities.map(cap => capabilityLabels[cap] || cap).join('、')}」が厳しすぎる可能性があります（該当: ${capabilityFiltered.length}社 / 全${categoryCompanies.length}社）`)
    }
  }
  
  return reasons
}

export default function Home() {
  const [results, setResults] = useState<MatchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [plan, setPlan] = useState<'free' | 'premium'>('free')
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false)
  const [lastUserInput, setLastUserInput] = useState<UserInput | null>(null)

  // コンポーネントマウント時にプレミアムプランの状態を確認
  useEffect(() => {
    const checkPremiumStatus = () => {
      try {
        const premiumData = localStorage.getItem('premium_subscription')
        if (premiumData) {
          const subscription = JSON.parse(premiumData)
          const now = Date.now()
          // 有効期限をチェック
          if (subscription.expiresAt && subscription.expiresAt > now) {
            setPlan('premium')
          } else {
            // 期限切れの場合は削除
            localStorage.removeItem('premium_subscription')
          }
        }
      } catch (error) {
        console.error('プレミアムプラン状態の確認エラー:', error)
      }
    }
    checkPremiumStatus()
  }, [])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSearching(true)

    const formData = new FormData(e.currentTarget)
    
    const minYearsActiveStr = formData.get('minYearsActive') as string;
    const minYearsActive = minYearsActiveStr && minYearsActiveStr.trim() !== '' 
      ? parseInt(minYearsActiveStr, 10) 
      : undefined;

    const userInput: UserInput = {
      category: formData.get('category') as string,
      quantity: parseInt(formData.get('quantity') as string, 10),
      budget: parseInt(formData.get('budget') as string, 10),
      preferredRegion: "海外",
      requiredCapabilities: formData.getAll('capabilities') as string[],
      productDescription: (formData.get('productDescription') as string) || undefined,
      minYearsActive: minYearsActive && minYearsActive > 0 ? minYearsActive : undefined,
    }

    // バリデーション
    if (!userInput.category || userInput.quantity <= 0 || userInput.budget <= 0) {
      alert('すべての必須項目を正しく入力してください。')
      setIsSearching(false)
      return
    }

    // マッチング実行
    const matchedResults = matchCompanies(companiesData, userInput)
    setResults(matchedResults)
    setLastUserInput(userInput)
    setIsSearching(false)
  }


  const handleUpgrade = async () => {
    setIsLoadingCheckout(true)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()

      if (data.error) {
        alert(`エラー: ${data.error}`)
        setIsLoadingCheckout(false)
        return
      }

      // Stripe Checkoutにリダイレクト
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('決済ページのURLを取得できませんでした')
        setIsLoadingCheckout(false)
      }
    } catch (error) {
      console.error('決済セッション作成エラー:', error)
      alert('決済ページへの接続に失敗しました。しばらくしてから再度お試しください。')
      setIsLoadingCheckout(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>OEMパートナー選定</h1>
        <p className={styles.subtitle}>
          あなたの要件に最適なOEM製造パートナーを<br />
          データに基づいて見つけます
        </p>
        <p className={styles.tagline}>最初の10万円、溶かさない選択</p>
      </div>

      <div className={styles.featuresSection}>
        <div className={`${styles.featureCard} ${styles.featureCardGold}`}>
          <div className={styles.featureIllustration}>
            <div className={styles.illustrationIcon}>
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* お金のイラスト */}
                {/* コイン */}
                <circle cx="25" cy="30" r="12" fill="#d4a574" opacity="0.9"/>
                <circle cx="25" cy="30" r="9" fill="#f5e6d3"/>
                <circle cx="25" cy="30" r="6" fill="#d4a574" opacity="0.3"/>
                <path d="M20 28 L22 30 L20 32 M28 28 L26 30 L28 32 M24 24 L24 26 M24 34 L24 36" stroke="#8b6f47" strokeWidth="1.5" strokeLinecap="round"/>
                
                <circle cx="50" cy="25" r="12" fill="#d4a574" opacity="0.9"/>
                <circle cx="50" cy="25" r="9" fill="#f5e6d3"/>
                <circle cx="50" cy="25" r="6" fill="#d4a574" opacity="0.3"/>
                <path d="M45 23 L47 25 L45 27 M53 23 L51 25 L53 27 M49 19 L49 21 M49 29 L49 31" stroke="#8b6f47" strokeWidth="1.5" strokeLinecap="round"/>
                
                <circle cx="75" cy="30" r="12" fill="#d4a574" opacity="0.9"/>
                <circle cx="75" cy="30" r="9" fill="#f5e6d3"/>
                <circle cx="75" cy="30" r="6" fill="#d4a574" opacity="0.3"/>
                <path d="M70 28 L72 30 L70 32 M78 28 L76 30 L78 32 M74 24 L74 26 M74 34 L74 36" stroke="#8b6f47" strokeWidth="1.5" strokeLinecap="round"/>
                
                {/* 紙幣 */}
                <rect x="20" y="50" width="60" height="35" rx="3" fill="#d4a574" opacity="0.7"/>
                <rect x="22" y="52" width="56" height="31" rx="2" fill="#f5e6d3"/>
                <rect x="25" y="55" width="50" height="25" rx="1" fill="#e8dcc4" opacity="0.5"/>
                <line x1="30" y1="62" x2="70" y2="62" stroke="#8b6f47" strokeWidth="1" opacity="0.6"/>
                <line x1="30" y1="68" x2="70" y2="68" stroke="#8b6f47" strokeWidth="1" opacity="0.6"/>
                <line x1="30" y1="74" x2="70" y2="74" stroke="#8b6f47" strokeWidth="1" opacity="0.6"/>
                <circle cx="45" cy="70" r="4" fill="#d4a574" opacity="0.4"/>
                <path d="M42 68 L44 70 L42 72 M48 68 L46 70 L48 72 M45 66 L45 67 M45 73 L45 74" stroke="#8b6f47" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <h3 className={styles.featureTitle}>副業で自分の商品を作りたいけど初めてのOEMで心配</h3>
          <p className={styles.featureDescription}>
            初めてのOEM発注でも安心。データに基づいた最適なパートナー選定で、リスクを最小限に抑えながら商品づくりを始められます。
          </p>
        </div>

        <div className={`${styles.featureCard} ${styles.featureCardSilver}`}>
          <div className={styles.featureIllustration}>
            <div className={styles.illustrationIcon}>
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* 服とパレットのイラスト */}
                {/* Tシャツ */}
                <rect x="25" y="20" width="50" height="45" rx="3" fill="#a8c5a0" opacity="0.4" stroke="#9bb5c0" strokeWidth="1.5"/>
                {/* 首周り */}
                <path d="M35 20 Q50 15 65 20" stroke="#9bb5c0" strokeWidth="2" fill="none"/>
                <path d="M40 25 Q50 22 60 25" stroke="#9bb5c0" strokeWidth="1.5" fill="none"/>
                {/* 袖 */}
                <rect x="20" y="30" width="8" height="20" rx="2" fill="#a8c5a0" opacity="0.4" stroke="#9bb5c0" strokeWidth="1"/>
                <rect x="72" y="30" width="8" height="20" rx="2" fill="#a8c5a0" opacity="0.4" stroke="#9bb5c0" strokeWidth="1"/>
                {/* デザイン要素 */}
                <circle cx="40" cy="40" r="4" fill="#d4a574" opacity="0.6"/>
                <circle cx="50" cy="40" r="4" fill="#9bb5c0" opacity="0.6"/>
                <circle cx="60" cy="40" r="4" fill="#a8c5a0" opacity="0.6"/>
                <rect x="35" y="50" width="30" height="8" rx="2" fill="#9bb5c0" opacity="0.5"/>
                
                {/* パレット */}
                <rect x="15" y="70" width="25" height="25" rx="3" fill="#f5f2ed" stroke="#d4a574" strokeWidth="2"/>
                <rect x="17" y="72" width="21" height="21" rx="2" fill="#ffffff"/>
                {/* パレットの色 */}
                <circle cx="22" cy="78" r="3" fill="#d4a574"/>
                <circle cx="30" cy="78" r="3" fill="#9bb5c0"/>
                <circle cx="38" cy="78" r="3" fill="#a8c5a0"/>
                <circle cx="22" cy="86" r="3" fill="#9bb5c0"/>
                <circle cx="30" cy="86" r="3" fill="#a8c5a0"/>
                <circle cx="38" cy="86" r="3" fill="#d4a574"/>
                {/* パレットの持ち手 */}
                <ellipse cx="27" cy="95" rx="8" ry="3" fill="#d4a574" opacity="0.6"/>
              </svg>
            </div>
          </div>
          <h3 className={styles.featureTitle}>服が好きでアパレルで自分の商品を出したい</h3>
          <p className={styles.featureDescription}>
            アパレルブランド立ち上げをサポート。あなたのビジョンに合った製造パートナーを見つけて、理想の商品を実現しましょう。
          </p>
        </div>

        <div className={`${styles.featureCard} ${styles.featureCardBronze}`}>
          <div className={styles.featureIllustration}>
            <div className={styles.illustrationIcon}>
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* グラフで予算オーバーのイラスト */}
                <rect x="20" y="20" width="60" height="50" rx="2" fill="#f5f2ed" stroke="#e0ddd8" strokeWidth="1.5"/>
                {/* グラフのバー */}
                <rect x="28" y="55" width="8" height="10" fill="#a8c5a0" opacity="0.6"/>
                <rect x="40" y="50" width="8" height="15" fill="#a8c5a0" opacity="0.6"/>
                <rect x="52" y="45" width="8" height="20" fill="#a8c5a0" opacity="0.6"/>
                <rect x="64" y="35" width="8" height="30" fill="#d4a574" opacity="0.8"/>
                {/* 予算上限ライン */}
                <line x1="20" y1="50" x2="80" y2="50" stroke="#d4a574" strokeWidth="2" strokeDasharray="3,3"/>
                {/* オーバー部分 */}
                <rect x="64" y="30" width="8" height="5" fill="#c44" opacity="0.8"/>
                <circle cx="68" cy="28" r="3" fill="#c44" opacity="0.9"/>
                <line x1="66" y1="26" x2="70" y2="30" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="70" y1="26" x2="66" y2="30" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <h3 className={styles.featureTitle}>コストが高すぎてもう一度考え直したい</h3>
          <p className={styles.featureDescription}>
            予算に合わせた最適なパートナーを提案。価格と品質のバランスを考慮し、無理のない範囲で商品づくりを実現します。
          </p>
        </div>
      </div>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formSection}>
          <div className={styles.formGroup}>
            <label htmlFor="category">製品カテゴリ *</label>
            <select id="category" name="category" required>
              <option value="">選択してください</option>
              <option value="tshirt">Tシャツ</option>
              <option value="cap">キャップ</option>
              <option value="hoodie">フーディ</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="quantity">数量 *</label>
            <input 
              type="number" 
              id="quantity" 
              name="quantity" 
              min="1" 
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="budget">予算（円） *</label>
            <input 
              type="number" 
              id="budget" 
              name="budget" 
              min="1" 
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="minYearsActive">実績年数（何年以上）</label>
            <input 
              type="number" 
              id="minYearsActive" 
              name="minYearsActive" 
              min="0" 
              placeholder="例: 3（3年以上）"
            />
            <small style={{display: 'block', marginTop: '6px', color: '#8a8a8a', fontSize: '0.85rem'}}>
              指定しない場合はすべての企業が対象になります
            </small>
          </div>

          <div className={styles.formGroup}>
            <label>必須条件（複数選択可）</label>
            <div className={styles.checkboxGroup}>
              <label>
                <input type="checkbox" name="capabilities" value="digital_print" />
                デジタルプリント
              </label>
              <label>
                <input type="checkbox" name="capabilities" value="label" />
                タグ付け
              </label>
              <label>
                <input type="checkbox" name="capabilities" value="embroidery" />
                刺繍
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="productDescription">どのような商品（任意）</label>
            <textarea 
              id="productDescription" 
              name="productDescription" 
              rows={4}
              placeholder="例：ストリートファッション向けのヴィンテージ風Tシャツ、小ロットでオリジナルデザイン、ヘビーウェイト素材など"
              className={styles.textarea}
            />
          </div>
        </div>

          <button type="submit" disabled={isSearching} className={styles.submitButton}>
            {isSearching ? '検索中...' : '最適なパートナーを探す'}
          </button>
        </form>
      </div>

      {/* プレミアプランセクション */}
      <div className={styles.premiumInfoSection}>
        <div className={styles.premiumInfoCard}>
          <h2 className={styles.premiumInfoTitle}>プレミアプラン</h2>
          <p className={styles.premiumInfoPrice}>月額480円（税込）</p>
          <p className={styles.premiumInfoDescription}>
            OEM企業の詳細情報閲覧・上位表示機能が利用できます。以下の特典をご利用いただけます。
          </p>
          <div className={styles.premiumFeatures}>
            <div className={styles.premiumFeature}>
              <span className={styles.premiumFeatureIcon}>⭐</span>
              <div className={styles.premiumFeatureContent}>
                <h3 className={styles.premiumFeatureTitle}>上位2社の詳細情報を閲覧可能</h3>
                <p className={styles.premiumFeatureText}>
                  検索結果のスコア上位1位・2位の企業の詳細情報（価格、納期、対応機能など）を確認できます。
                </p>
              </div>
            </div>
            <div className={styles.premiumFeature}>
              <span className={styles.premiumFeatureIcon}>♾️</span>
              <div className={styles.premiumFeatureContent}>
                <h3 className={styles.premiumFeatureTitle}>使い放題</h3>
                <p className={styles.premiumFeatureText}>
                  検索回数に制限はありません。何度でもご利用いただけます。
                </p>
              </div>
            </div>
          </div>
          <div className={styles.premiumPrice}>
            <span className={styles.premiumPriceAmount}>¥480</span>
            <span className={styles.premiumPriceUnit}>/月（税込）</span>
          </div>
          <p className={styles.premiumNote}>
            ※ いつでもキャンセル可能です。解約後、次回更新日以降は課金されません。
          </p>
        </div>
      </div>

      {results.length > 0 && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.resultsTitle}>
              検索結果（{plan === 'free' 
                ? Math.min(Math.max(0, results.length - 2), 4) 
                : Math.min(results.length, 6)}社{plan === 'free' && results.length >= 2 ? '（3位〜6位）' : ''} / 全{results.length}社）
            </h2>
            {plan === 'free' && (
              <div className={styles.planBadge}>
                <span className={styles.planLabel}>無料プラン</span>
              </div>
            )}
            {plan === 'premium' && (
              <div className={styles.planBadge}>
                <span className={styles.planLabelPremium}>プレミアムプラン</span>
              </div>
            )}
          </div>
          
          {/* 検索結果が3つ以下の場合、理由を表示 */}
          {results.length <= 3 && lastUserInput && (
            <div className={styles.lowResultsWarning}>
              <h3 className={styles.warningTitle}>⚠️ 検索結果が少ない理由</h3>
              <p className={styles.warningDescription}>
                検索結果が{results.length}社と少ないです。以下の要因が考えられます：
              </p>
              <ul className={styles.warningList}>
                {analyzeLowResults(companiesData, lastUserInput, results.length).map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
              <p className={styles.warningSuggestion}>
                💡 より多くの結果を得るには、条件を緩和することをお試しください（例：実績年数の条件を下げる、予算を上げる、必須条件を減らすなど）
              </p>
            </div>
          )}
          
          {/* 有料プラン：1位、2位を表示 */}
          {plan === 'premium' && results.length > 0 && (
            <>
              {results.slice(0, Math.min(2, results.length)).map((result, index) => (
                <div key={result.company.id} className={styles.companyCard}>
                  <div className={styles.companyHeader}>
                    <h3>{index + 1}. {result.company.name}</h3>
                    <span className={styles.score}>スコア: {result.score.toFixed(1)}</span>
                  </div>
                  <div className={styles.companyInfo}>
                    <p>
                      <strong>検索サイト:</strong>{' '}
                      {result.company.alibaba_company_url && (
                        <>
                          <a 
                            href={result.company.alibaba_company_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={styles.link}
                          >
                            ALIBABA
                          </a>
                        </>
                      )}
                      {result.company.made_in_china_company_url && (
                        <>
                          {result.company.alibaba_company_url && ' / '}
                          <a 
                            href={result.company.made_in_china_company_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={styles.link}
                          >
                            MADE IN CHINA
                          </a>
                        </>
                      )}
                      {!result.company.alibaba_company_url && !result.company.made_in_china_company_url && (
                        <a 
                          href="https://www.alibaba.com" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={styles.link}
                        >
                          ALIBABA
                        </a>
                      )}
                    </p>
                    <p><strong>国・地域:</strong> {result.company.country} / {result.company.region}</p>
                    <p><strong>価格範囲:</strong> ¥{result.company.price_range[0].toLocaleString()} - ¥{result.company.price_range[1].toLocaleString()}</p>
                    <p><strong>最小発注数量（MOQ）:</strong> {result.company.moq_min.toLocaleString()}個</p>
                    <p><strong>納期:</strong> {result.company.lead_time_days[0]} - {result.company.lead_time_days[1]}日</p>
                    <p><strong>対応機能:</strong> {result.company.capabilities.map(cap => capabilityLabels[cap] || cap).join(', ')}</p>
                    <p><strong>対応言語:</strong> {result.company.languages.join(', ')}</p>
                    <p><strong>実績年数:</strong> {result.company.years_active}年</p>
                    <p><strong>信頼スコア:</strong> {result.company.trust_score}/5</p>
                    <div className={styles.reasons}>
                      <strong>マッチした理由:</strong>
                      <ul>
                        {result.reasons.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                </div>
              ))}
            </>
          )}

          {/* 無料プラン：1位、2位をロック表示 */}
          {plan === 'free' && results.length > 0 && (
            <>
              {results.slice(0, Math.min(2, results.length)).map((result, index) => (
                <div key={result.company.id} className={`${styles.companyCard} ${styles.lockedCard}`}>
                  <div className={styles.lockedOverlay}>
                    <div className={styles.lockIcon}>🔒</div>
                    <p className={styles.lockedText}>上位2社はプレミアムプランでご覧いただけます</p>
                  </div>
                  <div className={styles.companyHeader}>
                    <h3>{index + 1}. {result.company.name}</h3>
                    <span className={styles.score}>スコア: {result.score.toFixed(1)}</span>
                  </div>
                  <div className={styles.companyInfo} style={{ opacity: 0.3 }}>
                    <p>
                      <strong>検索サイト:</strong>{' '}
                      {result.company.alibaba_company_url && (
                        <>
                          <a 
                            href={result.company.alibaba_company_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={styles.link}
                            style={{ opacity: 0.3 }}
                          >
                            ALIBABA
                          </a>
                        </>
                      )}
                      {result.company.made_in_china_company_url && (
                        <>
                          {result.company.alibaba_company_url && ' / '}
                          <a 
                            href={result.company.made_in_china_company_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={styles.link}
                            style={{ opacity: 0.3 }}
                          >
                            MADE IN CHINA
                          </a>
                        </>
                      )}
                      {!result.company.alibaba_company_url && !result.company.made_in_china_company_url && (
                        <a 
                          href="https://www.alibaba.com" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={styles.link}
                          style={{ opacity: 0.3 }}
                        >
                          ALIBABA
                        </a>
                      )}
                    </p>
                    <p><strong>国・地域:</strong> {result.company.country} / {result.company.region}</p>
                    <p><strong>価格範囲:</strong> ¥{result.company.price_range[0].toLocaleString()} - ¥{result.company.price_range[1].toLocaleString()}</p>
                    <p><strong>最小発注数量（MOQ）:</strong> {result.company.moq_min.toLocaleString()}個</p>
                    <p><strong>納期:</strong> {result.company.lead_time_days[0]} - {result.company.lead_time_days[1]}日</p>
                    <p><strong>対応機能:</strong> {result.company.capabilities.map(cap => capabilityLabels[cap] || cap).join(', ')}</p>
                    <p><strong>対応言語:</strong> {result.company.languages.join(', ')}</p>
                    <p><strong>実績年数:</strong> {result.company.years_active}年</p>
                    <p><strong>信頼スコア:</strong> {result.company.trust_score}/5</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* 無料プラン：3位〜6位、有料プラン：3位〜6位を表示 */}
          {results.length > 2 && results.slice(2, 6).map((result, index) => {
            const actualIndex = index + 2;
            return (
              <div key={result.company.id} className={styles.companyCard}>
                <div className={styles.companyHeader}>
                  <h3>{actualIndex + 1}. {result.company.name}</h3>
                  <span className={styles.score}>スコア: {result.score.toFixed(1)}</span>
                </div>
                <div className={styles.companyInfo}>
                  <p>
                    <strong>検索サイト:</strong>{' '}
                    {result.company.alibaba_company_url && (
                      <>
                        <a 
                          href={result.company.alibaba_company_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={styles.link}
                        >
                          ALIBABA
                        </a>
                      </>
                    )}
                    {result.company.made_in_china_company_url && (
                      <>
                        {result.company.alibaba_company_url && ' / '}
                        <a 
                          href={result.company.made_in_china_company_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={styles.link}
                        >
                          MADE IN CHINA
                        </a>
                      </>
                    )}
                    {!result.company.alibaba_company_url && !result.company.made_in_china_company_url && (
                      <a 
                        href="https://www.alibaba.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={styles.link}
                      >
                        ALIBABA
                      </a>
                    )}
                  </p>
                  <p><strong>国・地域:</strong> {result.company.country} / {result.company.region}</p>
                  <p><strong>価格範囲:</strong> ¥{result.company.price_range[0].toLocaleString()} - ¥{result.company.price_range[1].toLocaleString()}</p>
                  <p><strong>最小発注数量（MOQ）:</strong> {result.company.moq_min.toLocaleString()}個</p>
                  <p><strong>納期:</strong> {result.company.lead_time_days[0]} - {result.company.lead_time_days[1]}日</p>
                  <p><strong>対応機能:</strong> {result.company.capabilities.map(cap => capabilityLabels[cap] || cap).join(', ')}</p>
                  <p><strong>対応言語:</strong> {result.company.languages.join(', ')}</p>
                  <p><strong>実績年数:</strong> {result.company.years_active}年</p>
                  <p><strong>信頼スコア:</strong> {result.company.trust_score}/5</p>
                  <div className={styles.reasons}>
                    <strong>マッチした理由:</strong>
                    <ul>
                      {result.reasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
              </div>
            );
          })}
          {plan === 'free' && results.length >= 2 && (
            <div className={styles.upgradePrompt}>
              <div className={styles.upgradeContent}>
                <h3 className={styles.upgradeTitle}>上位2社の詳細を見る</h3>
                <p className={styles.upgradeDescription}>
                  プレミアムプラン（月額480円・使い放題）にアップグレードすると、スコア上位1位・2位の企業の詳細情報を確認できます。
                </p>
                <div className={styles.priceInfo}>
                  <span className={styles.price}>¥480</span>
                  <span className={styles.priceUnit}>/月</span>
                  <span className={styles.unlimited}>使い放題</span>
                </div>
                <button 
                  onClick={handleUpgrade}
                  className={styles.upgradeButton}
                  disabled={isLoadingCheckout}
                >
                  {isLoadingCheckout ? '決済ページに移動中...' : 'プレミアムプランにアップグレード'}
                </button>
                <p className={styles.upgradeNote}>
                  ※ 月額480円（税込）のサブスクリプションです。いつでもキャンセル可能です。
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {results.length === 0 && !isSearching && (
        <div className={styles.noResults}>
          <p>条件を入力して検索してください。</p>
        </div>
      )}
    </div>
  )
}
