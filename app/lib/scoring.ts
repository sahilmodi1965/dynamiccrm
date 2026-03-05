const HIGH_INTENT_KEYWORDS = ['play and earn', 'earn from surveys', 'cashback', 'coupon', 'rewards'];
const PUBLISHER_CATEGORIES = ['Consumer Cashback & Rewards', 'Offerwall & reward platform', 'Fintech', 'Gaming'];

export function calculateRelevance(companyName: string, domain: string, websiteContent: string = ''): { score: number, category: string } {
  let score = 50; // Base score
  let category = 'Uncategorized';
  const textToAnalyze = (companyName + ' ' + websiteContent).toLowerCase();

  // Keyword Matching
  if (textToAnalyze.includes('cashback') || textToAnalyze.includes('coupon')) {
    score += 30;
    category = 'Consumer Cashback & Rewards';
  } else if (textToAnalyze.includes('play and earn') || textToAnalyze.includes('surveys')) {
    score += 40;
    category = 'Offerwall & reward platform';
  } else if (textToAnalyze.includes('finance') || textToAnalyze.includes('pay')) {
    score += 20;
    category = 'Fintech';
  }

  // Cap at 100
  return {
    score: Math.min(score, 100),
    category
  };
}
