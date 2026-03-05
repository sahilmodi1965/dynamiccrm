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
