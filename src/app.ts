import { Company, UserInput, MatchResult } from './types';
import { matchCompanies, logMatchResults } from './matching';

/**
 * メインアプリケーションロジック
 */
export class OEMSelectionApp {
  private companies: Company[] = [];

  /**
   * JSONファイルから会社データを読み込む
   */
  public async loadCompanies(): Promise<void> {
    try {
      const response = await fetch('./data/companies.json');
      this.companies = await response.json();
    } catch (error) {
      console.error('会社データの読み込みに失敗しました:', error);
      alert('会社データの読み込みに失敗しました。ページを再読み込みしてください。');
    }
  }

  /**
   * ユーザー入力に基づいてOEM会社を検索
   */
  public searchCompanies(userInput: UserInput): MatchResult[] {
    return matchCompanies(this.companies, userInput);
  }

  /**
   * フォームから入力を受け取り、結果を表示
   */
  public handleFormSubmit(event: Event): void {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const userInput: UserInput = {
      category: formData.get('category') as string,
      quantity: parseInt(formData.get('quantity') as string, 10),
      budget: parseInt(formData.get('budget') as string, 10),
      preferredRegion: formData.get('region') as "日本" | "中国" | "どちらでも",
      requiredCapabilities: formData.getAll('capabilities') as string[],
    };

    // バリデーション
    if (!this.validateInput(userInput)) {
      alert('すべての必須項目を入力してください。');
      return;
    }

    // マッチング実行
    const results = this.searchCompanies(userInput);

    // 結果を表示
    this.displayResults(results);
  }

  /**
   * 入力値のバリデーション
   */
  private validateInput(input: UserInput): boolean {
    return (
      input.category.trim() !== '' &&
      input.quantity > 0 &&
      input.budget > 0 &&
      input.preferredRegion !== ''
    );
  }

  /**
   * 結果を画面に表示
   */
  private displayResults(results: MatchResult[]): void {
    const resultsContainer = document.getElementById('results');
    if (!resultsContainer) {
      console.error('結果表示用のコンテナが見つかりません');
      return;
    }

    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="no-results">
          <h2>条件に合うOEM会社が見つかりませんでした</h2>
          <p>条件を変更して再度検索してください。</p>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = `
      <h2>検索結果（${results.length}社）</h2>
      ${results
        .map(
          (result, index) => `
        <div class="company-card">
          <div class="company-header">
            <h3>${index + 1}. ${result.company.name}</h3>
            <span class="score">スコア: ${result.score.toFixed(1)}</span>
          </div>
          <div class="company-info">
            <p><strong>地域:</strong> ${result.company.region}</p>
            <p><strong>価格範囲:</strong> ¥${result.company.priceRange.min.toLocaleString()} - ¥${result.company.priceRange.max.toLocaleString()}</p>
            <p><strong>数量範囲:</strong> ${result.company.minQuantity.toLocaleString()} - ${result.company.maxQuantity.toLocaleString()}</p>
            <p><strong>対応機能:</strong> ${result.company.capabilities.join(', ')}</p>
            <p><strong>説明:</strong> ${result.company.description}</p>
            <div class="reasons">
              <strong>マッチした理由:</strong>
              <ul>
                ${result.reasons.map(reason => `<li>${reason}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      `
        )
        .join('')}
    `;
  }
}

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', async () => {
  const app = new OEMSelectionApp();
  await app.loadCompanies();
  
  const form = document.getElementById('search-form') as HTMLFormElement;

  if (form) {
    form.addEventListener('submit', (e) => app.handleFormSubmit(e));
  }
});
