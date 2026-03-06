import Fuse from 'fuse.js';
import { calculateHierarchyScore } from '../lib/hierarchy';

interface RawLead {
  contactName: string;
  title: string;
  company: string;
  email: string;
}

interface ScoredContact {
  name: string;
  title: string;
  score: number;
  level: string;
  department: string;
}

interface CompanyGroup {
  normalizedName: string;
  contacts: RawLead[];
}

// Helper: normalize company name
function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b/gi, '')
    .trim()
    .replace(/\s+/g, ' ');
}

// Helper: check if two names are duplicates
function isDuplicate(a: string, b: string): boolean {
  const fuse = new Fuse([{ name: a }], { keys: ['name'], threshold: 0.3 });
  return fuse.search(b).length > 0;
}

// Helper: group contacts by company
function groupContactsByCompany(leads: RawLead[]): CompanyGroup[] {
  const groups: Map<string, RawLead[]> = new Map();
  
  leads.forEach(lead => {
    const normalized = normalizeCompanyName(lead.company);
    let matchedKey: string | null = null;
    
    for (const key of groups.keys()) {
      if (isDuplicate(key, normalized)) {
        matchedKey = key;
        break;
      }
    }
    
    if (matchedKey) {
      groups.get(matchedKey)!.push(lead);
    } else {
      groups.set(normalized, [lead]);
    }
  });
  
  return Array.from(groups.entries()).map(([name, contacts]) => ({
    normalizedName: name,
    contacts
  }));
}

// Sample test data
const testLeads: RawLead[] = [
  { contactName: "John Smith", title: "CEO", company: "Acme Corp", email: "john@acme.com" },
  { contactName: "Jane Doe", title: "VP Sales", company: "Acme Corporation", email: "jane@acme.com" },
  { contactName: "Bob Wilson", title: "Director of Marketing", company: "ACME", email: "bob@acme.com" },
  { contactName: "Alice Brown", title: "Sales Manager", company: "TechStart Inc", email: "alice@techstart.com" },
  { contactName: "Charlie Davis", title: "CTO", company: "Tech Start", email: "charlie@techstart.com" },
  { contactName: "Eve Johnson", title: "Account Executive", company: "BigCo LLC", email: "eve@bigco.com" },
];

// Simulated Pipedrive exclusions
const pipedriveExclusions = ["Acme Corp", "acme corporation"];

async function runPipelineTest(): Promise<void> {
  console.log("\x1b[1;36m━━━ PIPELINE TEST ━━━\x1b[0m\n");

  // M2: Normalize and group
  console.log("Step 1: Normalizing company names...");
  const companies = groupContactsByCompany(testLeads);
  console.log(`Found ${companies.length} unique companies from ${testLeads.length} contacts\n`);

  // M3: Check exclusions
  console.log("Step 2: Checking Pipedrive exclusions...");
  const filteredCompanies = companies.filter(company => {
    const isExcluded = pipedriveExclusions.some(exc => 
      isDuplicate(company.normalizedName, normalizeCompanyName(exc))
    );
    if (isExcluded) {
      console.log(`  Excluded: ${company.normalizedName}`);
    }
    return !isExcluded;
  });
  console.log(`${filteredCompanies.length} companies remaining after exclusions\n`);

  // M5: Score and rank contacts
  console.log("Step 3: Scoring contact hierarchy...");
  const results = filteredCompanies.map(company => {
    const scoredContacts: ScoredContact[] = company.contacts.map((c: RawLead) => ({
      name: c.contactName,
      title: c.title,
      ...calculateHierarchyScore(c.title)
    })).sort((a: ScoredContact, b: ScoredContact) => b.score - a.score);

    const topContact = scoredContacts[0];
    return {
      company: company.normalizedName,
      topContact: topContact.name,
      title: topContact.title,
      score: topContact.score,
      level: topContact.level
    };
  });

  // Display results
  console.log("\n\x1b[1;32m━━━ RESULTS ━━━\x1b[0m");
  console.table(results);

  console.log("\n Pipeline test complete!");
}

runPipelineTest().catch(console.error);
