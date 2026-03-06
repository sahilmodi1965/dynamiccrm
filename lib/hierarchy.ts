// Hierarchy scoring for contact prioritization

interface HierarchyResult {
  score: number;
  level: string;
  department: string;
}

const TITLE_SCORES: Record<string, number> = {
  // C-Suite (100)
  'ceo': 100, 'chief executive': 100,
  'cto': 95, 'chief technology': 95,
  'cfo': 95, 'chief financial': 95,
  'coo': 95, 'chief operating': 95,
  'cmo': 95, 'chief marketing': 95,
  'cro': 95, 'chief revenue': 95,
  
  // VP Level (80-89)
  'vp': 85, 'vice president': 85,
  'svp': 88, 'senior vice president': 88,
  'evp': 89, 'executive vice president': 89,
  
  // Director Level (70-79)
  'director': 75,
  'senior director': 78,
  'head of': 77,
  
  // Manager Level (50-69)
  'manager': 60,
  'senior manager': 65,
  
  // Individual Contributors (30-49)
  'lead': 45,
  'senior': 40,
  'specialist': 35,
  'analyst': 35,
  'associate': 30,
  'coordinator': 30,
  'executive': 35, // Account Executive etc.
  'representative': 25,
};

const DEPARTMENTS: Record<string, string> = {
  'sales': 'Sales',
  'marketing': 'Marketing',
  'revenue': 'Sales',
  'business development': 'Sales',
  'bd': 'Sales',
  'growth': 'Marketing',
  'partnerships': 'Partnerships',
  'partner': 'Partnerships',
  'product': 'Product',
  'engineering': 'Engineering',
  'technology': 'Engineering',
  'finance': 'Finance',
  'operations': 'Operations',
  'hr': 'HR',
  'human resources': 'HR',
  'customer success': 'Customer Success',
  'support': 'Support',
};

export function calculateHierarchyScore(title: string): HierarchyResult {
  const lowerTitle = title.toLowerCase();
  
  // Find score
  let score = 20; // default
  let level = 'Individual Contributor';
  
  for (const [keyword, points] of Object.entries(TITLE_SCORES)) {
    if (lowerTitle.includes(keyword)) {
      if (points > score) {
        score = points;
        if (points >= 90) level = 'C-Suite';
        else if (points >= 80) level = 'VP';
        else if (points >= 70) level = 'Director';
        else if (points >= 50) level = 'Manager';
        else level = 'Individual Contributor';
      }
    }
  }
  
  // Find department
  let department = 'General';
  for (const [keyword, dept] of Object.entries(DEPARTMENTS)) {
    if (lowerTitle.includes(keyword)) {
      department = dept;
      break;
    }
  }
  
  return { score, level, department };
}

// Get top contact per company based on hierarchy
export function getTopContactPerCompany<T extends { title: string }>(contacts: T[]): T | null {
  if (contacts.length === 0) return null;
  
  return contacts.reduce((best, current) => {
    const bestScore = calculateHierarchyScore(best.title).score;
    const currentScore = calculateHierarchyScore(current.title).score;
    return currentScore > bestScore ? current : best;
  });
}

// Sort contacts by hierarchy (highest first)
export function sortByHierarchy<T extends { title: string }>(contacts: T[]): T[] {
  return [...contacts].sort((a, b) => {
    const scoreA = calculateHierarchyScore(a.title).score;
    const scoreB = calculateHierarchyScore(b.title).score;
    return scoreB - scoreA;
  });
}
