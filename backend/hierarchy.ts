export interface HierarchyScore {
  score: number;
  level: string;
  department: string;
  isDecisionMaker: boolean;
  doNotContact?: boolean;
}

const HIERARCHY_KEYWORDS = {
  executive: { keywords: ['ceo', 'cto', 'cfo', 'coo', 'chief', 'president', 'founder', 'owner', 'managing director'], score: 100, level: 'C-Level' },
  vp: { keywords: ['vp', 'vice president', 'svp'], score: 80, level: 'VP' },
  director: { keywords: ['director', 'head of'], score: 60, level: 'Director' },
  manager: { keywords: ['manager', 'lead', 'principal'], score: 40, level: 'Manager' },
  specialist: { keywords: ['specialist', 'coordinator', 'analyst', 'associate'], score: 20, level: 'Specialist' }
};

const DEPARTMENTS = ['Marketing', 'Sales', 'Finance', 'Product', 'Engineering', 'Operations', 'Revenue', 'Partnerships', 'Growth', 'HR'];

export function calculateHierarchyScore(title: string): HierarchyScore {
  if (!title) return { score: 0, level: 'Unknown', department: 'Unknown', isDecisionMaker: false };

  const normalized = title.toLowerCase().trim();
  let foundDepartment = 'General';

  for (const dept of DEPARTMENTS) {
    if (normalized.includes(dept.toLowerCase())) {
      foundDepartment = dept;
      break;
    }
  }

  for (const [key, config] of Object.entries(HIERARCHY_KEYWORDS)) {
    for (const keyword of config.keywords) {
      if (normalized.includes(keyword)) {
        return {
          score: config.score,
          level: config.level,
          department: foundDepartment,
          isDecisionMaker: config.score >= 60
        };
      }
    }
  }

  return { score: 10, level: 'Individual Contributor', department: foundDepartment, isDecisionMaker: false };
}

export interface Lead {
  firstName?: string
  lastName?: string
  email: string
  company: string
  title?: string
  hierarchyScore?: number
  [key: string]: any
}

export function rankLeadsByHierarchy(leads: Lead[]): Lead[] {
  return leads
    .map(lead => ({
      ...lead,
      hierarchyScore: calculateHierarchyScore(lead.title || '').score
    }))
    .sort((a, b) => (b.hierarchyScore || 0) - (a.hierarchyScore || 0))
}

export function getTopContactPerCompany(leads: Lead[]): Lead[] {
  const companyMap = new Map<string, Lead>()
  
  for (const lead of leads) {
    const company = lead.company?.toLowerCase().trim()
    if (company === undefined || company === '') continue
    
    const score = calculateHierarchyScore(lead.title || '').score
    const existing = companyMap.get(company)
    
    if (existing === undefined || score > (existing.hierarchyScore || 0)) {
      companyMap.set(company, { ...lead, hierarchyScore: score })
    }
  }
  
  return Array.from(companyMap.values())
}
