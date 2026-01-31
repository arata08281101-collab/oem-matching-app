import { Company, UserInput, MatchResult } from './types';

/**
 * スコアに小さなランダム要素を追加して多様性を持たせる
 * 同じ条件でも毎回少し異なる結果になるようにする
 */
function addDiversityToScore(baseScore: number, companyId: string): number {
  // 会社IDをハッシュ化して、再現可能なランダム値を生成
  let hash = 0;
  for (let i = 0; i < companyId.length; i++) {
    const char = companyId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // ハッシュ値から-5%〜+5%の変動を生成
  const variation = (hash % 11 - 5) / 100; // -5% to +5%
  return baseScore * (1 + variation);
}

/**
 * OEM会社をユーザー入力に基づいてマッチング・スコアリングする関数
 * 
 * @param companies - OEM会社のリスト
 * @param userInput - ユーザーの入力条件
 * @returns スコア順にソートされた上位10社のマッチング結果
 */
export function matchCompanies(
  companies: Company[],
  userInput: UserInput
): MatchResult[] {
  // まず基本的な条件でフィルタリング
  const filteredCompanies = companies.filter(company => {
    // カテゴリの一致チェック
    if (!company.categories.includes(userInput.category)) {
      return false;
    }

    // 数量の範囲チェック（MOQ以上）
    if (userInput.quantity < company.moq_min) {
      return false;
    }

    // 予算チェック：価格範囲の平均値×MOQが予算以下であること
    const averagePrice = (company.price_range[0] + company.price_range[1]) / 2;
    const minCost = averagePrice * company.moq_min;
    if (minCost > userInput.budget) {
      return false;
    }

    // 地域の一致チェック（国レベルで判定）
    if (userInput.preferredRegion !== "どちらでも") {
      if (userInput.preferredRegion === "日本") {
        // 日本を選択した場合、Japanのみ
        if (company.country !== "Japan") {
          return false;
        }
      } else if (userInput.preferredRegion === "海外") {
        // 海外を選択した場合、日本以外のすべて（China、Hong Kongなど）
        if (company.country === "Japan") {
          return false;
        }
      }
    }

    // 必須条件（capabilities）のチェック
    const hasAllRequiredCapabilities = userInput.requiredCapabilities.every(
      capability => company.capabilities.includes(capability)
    );
    if (!hasAllRequiredCapabilities) {
      return false;
    }

    // 実績年数のチェック（指定されている場合）
    if (userInput.minYearsActive !== undefined && userInput.minYearsActive > 0) {
      if (company.years_active < userInput.minYearsActive) {
        return false;
      }
    }

    return true;
  });

  // フィルタリングされた会社をスコアリング
  const isCap = userInput.category === "cap";
  const isHoodie = userInput.category === "hoodie";
  
  const scoredResults: MatchResult[] = filteredCompanies.map(company => {
    let score = 0;
    const reasons: string[] = [];

    if (isCap) {
      // キャップ用の新しい採点基準
      
      // ① 価格×MOQのバランス（25点）：最小発注数での単価、スケール時の下がり方
      const moqPrice = (company.price_range[0] + company.price_range[1]) / 2; // MOQ時の平均単価
      const priceRange = company.price_range[1] - company.price_range[0]; // 価格の幅
      const priceRangeRatio = priceRange / company.price_range[0]; // 価格変動率
      
      // MOQが低いほど高スコア（最大15点）
      let moqScore = 0;
      if (company.moq_min <= 3) {
        moqScore = 15;
        reasons.push('MOQが非常に低い（3個以下）');
      } else if (company.moq_min <= 10) {
        moqScore = 12;
        reasons.push('MOQが低い（10個以下）');
      } else if (company.moq_min <= 30) {
        moqScore = 8;
        reasons.push('MOQが中程度（30個以下）');
      } else {
        moqScore = 5;
        reasons.push(`MOQ: ${company.moq_min}個`);
      }
      
      // 価格の幅が大きいほど（スケール時に下がりやすい）高スコア（最大10点）
      let scaleScore = 0;
      if (priceRangeRatio >= 0.5) {
        scaleScore = 10;
        reasons.push('スケール時の価格下がり幅が大きい');
      } else if (priceRangeRatio >= 0.3) {
        scaleScore = 7;
        reasons.push('スケール時の価格下がり幅が中程度');
      } else if (priceRangeRatio >= 0.1) {
        scaleScore = 4;
        reasons.push('スケール時の価格下がり幅が小さい');
      } else {
        scaleScore = 2;
      }
      
      score += moqScore + scaleScore;

      // ② カスタム対応力（12点）：刺繍/3D刺繍/熱転写/印刷、ロゴ位置の自由度、オプションの幅
      let customScore = 0;
      const customReasons: string[] = [];
      
      // 刺繍対応
      if (company.capabilities.some(cap => cap.includes('embroidery') || cap.includes('刺繍'))) {
        customScore += 3;
        customReasons.push('刺繍対応');
      }
      
      // 3D刺繍対応（capabilitiesに3dや立体などのキーワードがあれば）
      if (company.capabilities.some(cap => cap.toLowerCase().includes('3d') || cap.toLowerCase().includes('立体'))) {
        customScore += 2;
        customReasons.push('3D刺繍対応');
      }
      
      // 熱転写対応
      if (company.capabilities.some(cap => cap.includes('heat-transfer') || cap.includes('熱転写'))) {
        customScore += 2;
        customReasons.push('熱転写対応');
      }
      
      // 印刷対応
      if (company.capabilities.some(cap => cap.includes('print') || cap.includes('印刷') || cap.includes('プリント'))) {
        customScore += 2;
        customReasons.push('印刷対応');
      }
      
      // カスタムロゴ対応
      if (company.capabilities.some(cap => cap.includes('custom') || cap.includes('logo') || cap.includes('ロゴ'))) {
        customScore += 2;
        customReasons.push('カスタムロゴ対応');
      }
      
      // その他のオプション（capabilitiesの数が多いほど高スコア）
      const otherCapabilities = company.capabilities.filter(cap => 
        !cap.includes('embroidery') && !cap.includes('刺繍') &&
        !cap.includes('heat-transfer') && !cap.includes('熱転写') &&
        !cap.includes('print') && !cap.includes('印刷') && !cap.includes('プリント') &&
        !cap.includes('custom') && !cap.includes('logo') && !cap.includes('ロゴ')
      );
      customScore += Math.min(1, otherCapabilities.length);
      
      score += Math.min(12, customScore);
      if (customReasons.length > 0) {
        reasons.push(`カスタム対応: ${customReasons.join(', ')}`);
      }

      // ③ 素材・仕様の明確さ（15点）：素材、生地タイプ、6パネル等が明記されているか
      // 現時点ではcapabilitiesやfeaturesから推測
      let specScore = 0;
      const specReasons: string[] = [];
      
      // capabilitiesに詳細な情報があれば加点
      const hasDetailedInfo = company.capabilities.length >= 3;
      if (hasDetailedInfo) {
        specScore += 8;
        specReasons.push('対応オプションが詳細に記載');
      }
      
      // featuresに詳細な情報があれば加点
      if (company.features) {
        const featureCount = Object.values(company.features).filter(v => v === true).length;
        if (featureCount >= 3) {
          specScore += 7;
          specReasons.push('特徴が詳細に記載');
        } else if (featureCount >= 1) {
          specScore += 4;
          specReasons.push('特徴が一部記載');
        }
      }
      
      score += Math.min(15, specScore);
      if (specReasons.length > 0) {
        reasons.push(`仕様の明確さ: ${specReasons.join(', ')}`);
      }

      // ④ キャップの特徴（10点）：どのようなオリジナリ性があり顧客にマッチするのか
      let originalityScore = 0;
      const originalityReasons: string[] = [];
      
      if (company.features) {
        // ストリートファッション対応
        if (company.features.street_focused) {
          originalityScore += 4;
          originalityReasons.push('ストリートファッション対応');
        }
        
        // 小ロット対応（オリジナリティの高いデザインに対応）
        if (company.features.small_lot) {
          originalityScore += 3;
          originalityReasons.push('小ロット対応（オリジナルデザイン可）');
        }
        
        // ヴィンテージ対応
        if (company.features.vintage) {
          originalityScore += 3;
          originalityReasons.push('ヴィンテージ対応');
        }
      }
      
      // カテゴリに"cap"が含まれる場合（専門性）
      if (company.categories.includes("cap")) {
        originalityScore += 2;
        originalityReasons.push('キャップ専門');
      }
      
      score += Math.min(10, originalityScore);
      if (originalityReasons.length > 0) {
        reasons.push(`オリジナリティ: ${originalityReasons.join(', ')}`);
      }

      // ⑤ 信頼性シグナル（20点）：Verified、販売数/レビュー、年数など
      let trustSignalScore = 0;
      
      // 信頼スコア（trust_score × 0.8点、最大4点）
      trustSignalScore += Math.min(4, company.trust_score * 0.8);
      
      // 実績年数（キャップ用の新しい配点）
      let yearsScore = 0;
      if (company.years_active >= 6) {
        yearsScore = 10; // 6年以上は10点
      } else if (company.years_active >= 5) {
        yearsScore = 6; // 5年は6点
      } else if (company.years_active >= 3) {
        yearsScore = 3; // 3年は3点
      } else if (company.years_active >= 1) {
        yearsScore = 1.3; // 1年は1.3点
      } else {
        yearsScore = 0;
      }
      trustSignalScore += yearsScore;
      
      score += Math.min(20, trustSignalScore);
      reasons.push(`信頼性: スコア${company.trust_score}/5、実績${company.years_active}年`);

      // ⑥ 追加コストの透明性（10点）：ロゴ追加料金、最低注文数（ロゴ）などが明確か
      // 現時点ではcapabilitiesの詳細度から推測
      let transparencyScore = 0;
      
      // capabilitiesに詳細な情報があれば透明性が高いと判断
      if (company.capabilities.length >= 4) {
        transparencyScore = 10;
        reasons.push('対応オプションが詳細に記載（透明性が高い）');
      } else if (company.capabilities.length >= 2) {
        transparencyScore = 6;
        reasons.push('対応オプションが一部記載');
      } else {
        transparencyScore = 3;
        reasons.push('対応オプションの記載が少ない');
      }
      
      score += transparencyScore;

    } else {
      // Tシャツ・フーディ用の既存採点基準
      
      // 1. 価格の適合度（総コストベースで評価）
      const minTotalCost = company.price_range[0] * userInput.quantity;
      const maxTotalCost = company.price_range[1] * userInput.quantity;
      const averageTotalCost = (minTotalCost + maxTotalCost) / 2;

      if (maxTotalCost <= userInput.budget) {
        const costRatio = averageTotalCost / userInput.budget;
        score += Math.round(40 * (1 - costRatio * 0.5));
        reasons.push(`予算内（総コスト: ¥${Math.round(minTotalCost).toLocaleString()} - ¥${Math.round(maxTotalCost).toLocaleString()}）`);
      } else if (minTotalCost <= userInput.budget) {
        score += 20;
        reasons.push(`予算範囲内の可能性あり（総コスト: ¥${Math.round(minTotalCost).toLocaleString()} - ¥${Math.round(maxTotalCost).toLocaleString()}）`);
      } else {
        score += 5;
        reasons.push(`予算超過（総コスト: ¥${Math.round(minTotalCost).toLocaleString()} - ¥${Math.round(maxTotalCost).toLocaleString()}）`);
      }

      // 2. 地域の一致（希望地域が明確な場合のみ）
      if (userInput.preferredRegion !== "どちらでも") {
        if (userInput.preferredRegion === "日本") {
          if (company.country === "Japan") {
            score += 25;
            reasons.push(`希望地域（${userInput.preferredRegion}）に一致`);
          }
        } else if (userInput.preferredRegion === "海外") {
          if (company.country !== "Japan") {
            score += 25;
            reasons.push(`希望地域（${userInput.preferredRegion}）に一致`);
          }
        }
      }

      // 3. 対応機能の数（多いほど高スコア、最大15点）
      const capabilityScore = Math.min(15, company.capabilities.length * 3);
      score += capabilityScore;
      reasons.push(`対応機能: ${company.capabilities.length}種類`);

      // 4. 信頼スコア（trust_score × 4点、最大20点）
      const trustScore = Math.min(20, company.trust_score * 4);
      score += trustScore;
      reasons.push(`信頼スコア: ${company.trust_score}/5`);

      // 5. 実績年数（Tシャツ・フーディ用の新しい配点）
      let yearsScore = 0;
      if (company.years_active >= 10) {
        yearsScore = 10; // 10年以上は10点
      } else if (company.years_active >= 8) {
        yearsScore = 8; // 8年は8点
      } else if (company.years_active >= 3) {
        yearsScore = 5; // 3年は5点
      } else if (company.years_active >= 1) {
        yearsScore = 2; // 1年は2点
      } else {
        yearsScore = 0;
      }
      score += yearsScore;
      reasons.push(`実績年数: ${company.years_active}年`);

      // 6. 企業の特徴（features）による配点（最大30点）
      if (company.features) {
        let featuresScore = 0;
        const featureReasons: string[] = [];

        // 数量に応じた特徴の評価（カテゴリによって閾値を調整）
        let isSmallLot: boolean;
        let isLargeLot: boolean;
        
        if (isCap) {
          // キャップの場合：小ロットの閾値を低く設定
          isSmallLot = userInput.quantity < 50;
          isLargeLot = userInput.quantity >= 500;
        } else {
          // Tシャツ・フーディの場合：既存の閾値
          isSmallLot = userInput.quantity < 100;
          isLargeLot = userInput.quantity >= 1000;
        }

        // 小ロット対応
        if (company.features.small_lot && isSmallLot) {
          featuresScore += 10;
          featureReasons.push('小ロット対応');
        }

        // 大量生産対応
        if (company.features.mass_production && isLargeLot) {
          featuresScore += 10;
          featureReasons.push('大量生産対応');
        }

        // カテゴリに応じた特徴の評価
        if (!isCap) {
          // Tシャツ・フーディの場合のみ評価する特徴
          // ヴィンテージ対応
          if (company.features.vintage) {
            featuresScore += 5;
            featureReasons.push('ヴィンテージ対応');
          }

          // ヘビーウェイト対応（キャップには関係ない）
          if (company.features.heavyweight) {
            featuresScore += 5;
            featureReasons.push('ヘビーウェイト対応');
          }

          // オーバーサイズ対応（フーディには関係するが、キャップには関係ない）
          if (company.features.oversize && !isCap) {
            featuresScore += 3;
            featureReasons.push('オーバーサイズ対応');
          }

          // ディストレス加工対応
          if (company.features.distressed) {
            featuresScore += 2;
            featureReasons.push('ディストレス加工対応');
          }
        }

        // ストリートファッション対応（全カテゴリで評価）
        if (company.features.street_focused) {
          featuresScore += 3;
          featureReasons.push('ストリートファッション対応');
        }

        score += Math.min(30, featuresScore); // 最大30点
        if (featureReasons.length > 0) {
          reasons.push(`特徴: ${featureReasons.join(', ')}`);
        }
      }

      // 7. カテゴリ特化スコア（カテゴリに応じた追加評価）
      if (isCap) {
        // キャップの場合：カテゴリが"cap"を含む会社にボーナス
        if (company.categories.includes("cap")) {
          score += 5;
          reasons.push('キャップ専門');
        }
      } else if (isHoodie) {
        // フーディの場合：カテゴリが"hoodie"を含む会社にボーナス
        if (company.categories.includes("hoodie")) {
          score += 5;
          reasons.push('フーディ専門');
        }
      } else {
        // Tシャツの場合：カテゴリが"tshirt"を含む会社にボーナス
        if (company.categories.includes("tshirt")) {
          score += 5;
          reasons.push('Tシャツ専門');
        }
      }

      // 8. 納期の短さ（短いほど高スコア、最大10点）
      const averageLeadTime = (company.lead_time_days[0] + company.lead_time_days[1]) / 2;
      if (averageLeadTime <= 10) {
        score += 10;
        reasons.push(`納期が短い（平均${Math.round(averageLeadTime)}日）`);
      } else if (averageLeadTime <= 15) {
        score += 7;
        reasons.push(`納期が比較的短い（平均${Math.round(averageLeadTime)}日）`);
      } else if (averageLeadTime <= 20) {
        score += 5;
        reasons.push(`納期: 平均${Math.round(averageLeadTime)}日`);
      }
    }

    // 多様性のためのランダム要素を追加（±5%の変動）
    const finalScore = addDiversityToScore(score, company.id);

    return {
      company,
      score: Math.max(0, Math.round(finalScore * 10) / 10), // 小数点第1位まで
      reasons,
    };
  });

  // スコアの降順でソート
  scoredResults.sort((a, b) => b.score - a.score);

  // 上位10社を返す
  return scoredResults.slice(0, 10);
}
