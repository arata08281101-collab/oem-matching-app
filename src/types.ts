/**
 * OEM会社の型定義
 */
export interface Company {
  id: string;
  name: string;
  region: "日本" | "中国";
  categories: string[];
  minQuantity: number;
  maxQuantity: number;
  priceRange: {
    min: number;
    max: number;
  };
  capabilities: string[];
  description: string;
}

/**
 * ユーザー入力の型定義
 */
export interface UserInput {
  category: string;
  quantity: number;
  budget: number;
  preferredRegion: "日本" | "中国" | "どちらでも";
  requiredCapabilities: string[];
}

/**
 * マッチング結果の型定義
 */
export interface MatchResult {
  company: Company;
  score: number;
  reasons: string[];
}
