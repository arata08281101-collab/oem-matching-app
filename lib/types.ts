/**
 * OEM会社の型定義
 */
export interface Company {
  id: string;
  name: string;
  country: string;
  region: string;
  categories: string[];
  moq_min: number;
  price_range: [number, number]; // [min, max]
  lead_time_days: [number, number]; // [min, max]
  features?: {
    vintage?: boolean;
    heavyweight?: boolean;
    oversize?: boolean;
    distressed?: boolean;
    small_lot?: boolean;
    mass_production?: boolean;
    street_focused?: boolean;
  };
  capabilities: string[];
  languages: string[];
  years_active: number;
  trust_score: number;
  alibaba_company_url?: string;
  made_in_china_company_url?: string;
}

/**
 * ユーザー入力の型定義
 */
export interface UserInput {
  category: string;
  quantity: number;
  budget: number;
  preferredRegion: "日本" | "海外" | "どちらでも";
  requiredCapabilities: string[];
  productDescription?: string;
  minYearsActive?: number; // 実績年数の最小値（何年以上）
}

/**
 * マッチング結果の型定義
 */
export interface MatchResult {
  company: Company;
  score: number;
  reasons: string[];
}
