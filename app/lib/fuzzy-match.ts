import Fuse from 'fuse.js';

export interface Lead {
  companyName: string;
  contactName: string;
  email: string;
  title: string;
  domain?: string;
}

export interface CompanyRecord {
  normalizedName: string;
  domain: string;
  industryGuess?: string;
  contacts: Lead[];
}

// 0.15 threshold in Fuse.js roughly translates to 85%+ similarity
export function deduplicateCompanies(rawLeads: Lead[], similarityThreshold: number = 0.15): CompanyRecord[] {
  const companies: CompanyRecord[] = [];
  
  for (const lead of rawLeads) {
    if (!lead.companyName) continue;

    // Fallback to extracting domain from email if not provided
    const leadDomain = lead.domain || (lead.email ? lead.email.split('@')[1] : '');

    if (companies.length === 0) {
      companies.push({
        normalizedName: lead.companyName,
        domain: leadDomain,
        contacts: [lead]
      });
      continue;
    }

    const fuse = new Fuse(companies, {
      keys: ['normalizedName'],
      includeScore: true,
      threshold: similarityThreshold
    });

    const results = fuse.search(lead.companyName);

    if (results.length > 0 && results[0].score !== undefined && results[0].score <= similarityThreshold) {
      // Match found (>= 85% similar)
      const matchedCompany = companies[results[0].refIndex];
      matchedCompany.contacts.push(lead);
    } else {
      // No match, create new company record
      companies.push({
        normalizedName: lead.companyName,
        domain: leadDomain,
        contacts: [lead]
      });
    }
  }

  return companies;
}
