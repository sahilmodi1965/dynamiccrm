/**
 * Contact Hierarchy & Decision Maker Identification
 * Scores job titles to prioritize decision-makers
 */

export interface HierarchyScore {
  score: number;
  level: string;
  isDecisionMaker: boolean;
}

// Title keywords ranked by decision-making power
const HIERARCHY_KEYWORDS = {
  executive: { keywords: ['ceo', 'cto', 'cfo', 'coo', 'chief', 'president', 'founder', 'owner'], score: 100, level: 'C-Level' },
  vp: { keywords: ['vp', 'vice president', 'svp', 'senior vice president'], score: 80, level: 'VP' },
  director: { keywords: ['director', 'head of'], score: 60, level: 'Director' },
  manager: { keywords: ['manager', 'lead', 'principal'], score: 40, level: 'Manager' },
  specialist: { keywords: ['specialist', 'coordinator', 'analyst', 'associate'], score: 20, level: 'Specialist' }
};

export function calculateHierarchyScore(title: string): HierarchyScore {
  if (!title) {
    return { score: 0, level: 'Unknown', isDecisionMaker: false };
  }

  const normalized = title.toLowerCase().trim();

  // Check each hierarchy level
  for (const [key, config] of Object.entries(HIERARCHY_KEYWORDS)) {
    for (const keyword of config.keywords) {
      if (normalized.includes(keyword)) {
        return {
          score: config.score,
          level: config.level,
          isDecisionMaker: config.score >= 60 // Director and above
        };
      }
    }
  }

  // No match found
  return { score: 10, level: 'Individual Contributor', isDecisionMaker: false };
}

export function rankLeadsByHierarchy(leads: any[]): any[] {
  // Group by company
  const companyGroups = new Map<string, any[]>();
  
  leads.forEach(lead => {
    const company = (lead.company || '').toLowerCase().trim();
    if (!companyGroups.has(company)) {
      companyGroups.set(company, []);
    }
    companyGroups.get(company)!.push(lead);
  });

  // Sort each company's leads by hierarchy score
  const ranked: any[] = [];
  companyGroups.forEach((companyLeads, company) => {
    const sorted = companyLeads
      .map(lead => ({
        ...lead,
        hierarchyScore: calculateHierarchyScore(lead.title).score,
        hierarchyLevel: calculateHierarchyScore(lead.title).level,
        isDecisionMaker: calculateHierarchyScore(lead.title).isDecisionMaker
      }))
      .sort((a, b) => b.hierarchyScore - a.hierarchyScore);
    
    ranked.push(...sorted);
  });

  return ranked;
}

export function getTopContactPerCompany(leads: any[]): any[] {
  const companyGroups = new Map<string, any>();
  
  leads.forEach(lead => {
    const company = (lead.company || '').toLowerCase().trim();
    const hierarchy = calculateHierarchyScore(lead.title);
    
    if (!companyGroups.has(company) || 
        hierarchy.score > calculateHierarchyScore(companyGroups.get(company).title).score) {
      companyGroups.set(company, { ...lead, ...hierarchy });
    }
  });

  return Array.from(companyGroups.values());
}
