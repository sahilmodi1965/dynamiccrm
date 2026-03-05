export interface PipedriveDeal {
  company: string;
  stage: string;
  value: string;
  owner: string;
}

const EXCLUDED_STAGES = ['🤙 Live', '💬 Discussion', 'Integration', 'Test', 'Deal Won'];

export function filterPipedriveExclusions(leads: any[], pipedriveDeals: PipedriveDeal[]) {
  const excludedCompanies = new Set(
    pipedriveDeals
      .filter(deal => EXCLUDED_STAGES.includes(deal.stage))
      .map(deal => deal.company.toLowerCase().trim())
  );

  return leads.map(lead => {
    const isExcluded = excludedCompanies.has(lead.normalizedName.toLowerCase().trim());
    return {
      ...lead,
      status: isExcluded ? 'EXCLUDED - Existing Partner' : 'Available',
      exclusionReason: isExcluded ? 'Found in active Pipedrive stage' : null
    };
  });
}
