import { Company, UserInput, MatchResult } from './types';

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

    // 数量の範囲チェック
    if (
      userInput.quantity < company.minQuantity ||
      userInput.quantity > company.maxQuantity
    ) {
      return false;
    }

    // 地域の一致チェック
    if (
      userInput.preferredRegion !== "どちらでも" &&
      company.region !== userInput.preferredRegion
    ) {
      return false;
    }

    // 必須条件（capabilities）のチェック
    const hasAllRequiredCapabilities = userInput.requiredCapabilities.every(
      capability => company.capabilities.includes(capability)
    );
    if (!hasAllRequiredCapabilities) {
      return false;
    }

    return true;
  });

  // フィルタリングされた会社をスコアリング（簡易版）
  const scoredResults: MatchResult[] = filteredCompanies.map(company => {
    let score = 0;
    const reasons: string[] = [];

    // 1. 価格の適合度（簡易計算：予算内なら高スコア）
    const averagePrice = (company.priceRange.min + company.priceRange.max) / 2;
    if (averagePrice <= userInput.budget) {
      // 予算内の場合：予算に対する割合が低いほど高スコア（最大50点）
      const priceRatio = averagePrice / userInput.budget;
      score += Math.round(50 * (1 - priceRatio * 0.5)); // 予算の50%なら37.5点、100%なら25点
      reasons.push(`予算内（平均価格: ¥${Math.round(averagePrice).toLocaleString()}）`);
    } else {
      // 予算超過の場合は低スコア
      score += 10;
      reasons.push(`予算超過の可能性（平均価格: ¥${Math.round(averagePrice).toLocaleString()}）`);
    }

    // 2. 地域の一致（希望地域が明確な場合のみ）
    if (userInput.preferredRegion !== "どちらでも") {
      if (company.region === userInput.preferredRegion) {
        score += 30;
        reasons.push(`希望地域（${userInput.preferredRegion}）に一致`);
      }
    }

    // 3. 対応機能の数（多いほど高スコア、最大20点）
    const capabilityScore = Math.min(20, company.capabilities.length * 5);
    score += capabilityScore;
    reasons.push(`対応機能: ${company.capabilities.length}種類`);

    return {
      company,
      score: Math.max(0, score), // スコアは0以上に制限
      reasons,
    };
  });

  // スコアの降順でソート
  scoredResults.sort((a, b) => b.score - a.score);

  // 上位10社を返す
  return scoredResults.slice(0, 10);
}

/**
 * デバッグ用：マッチング結果をコンソールに出力
 */
export function logMatchResults(results: MatchResult[]): void {
  console.log(`\n=== マッチング結果（${results.length}社） ===\n`);
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.company.name}`);
    console.log(`   スコア: ${result.score.toFixed(1)}`);
    console.log(`   地域: ${result.company.region}`);
    console.log(`   価格範囲: ¥${result.company.priceRange.min.toLocaleString()} - ¥${result.company.priceRange.max.toLocaleString()}`);
    console.log(`   数量範囲: ${result.company.minQuantity.toLocaleString()} - ${result.company.maxQuantity.toLocaleString()}`);
    console.log(`   理由: ${result.reasons.join(', ')}`);
    console.log('');
  });
}
