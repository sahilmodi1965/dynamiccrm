import Papa from 'papaparse';
import { deduplicateCompanies } from '../app/lib/fuzzy-match';
import { calculateHierarchyScore } from '../backend/hierarchy';
import { filterPipedriveExclusions } from '../app/lib/pipedrive';
import { calculateRelevance } from '../app/lib/scoring';

// Raw, unedited strings straight from your uploaded vendor CSVs
const dirtyCSV = `First Name,Last Name,Title,Company Name,Email,Person Linkedin Url,Website,Secondary Email
Elsa,Saquilayan,Team Lead Manager,Atlas,elsas@atlasfin.com,link,https://atlasfin.com,
Vetri,Balaji,Co-Founder & CTO,Atlas,vetri@atlasfin.com,link,https://atlasfin.com,
Latoria,Williams,Chief Executive Officer,1F Cash Advance,latoria.williams@1firstcashadvance.org,link,1firstcashadvance.org,
Peter,Choi,CEO,Superblock,peter@superblock.xyz,link,superblock.xyz,
Nadine,Herrmann,Managing Director,mycashbacks GmbH,nadine.herrmann@mycashbacks.com,link,mycashbacks.com,`;

async function runTest() {
  console.log("📥 1. INGESTING DIRTY CSV...");
  const parsed = Papa.parse(dirtyCSV, { header: true, skipEmptyLines: true });
  
  // Mapping the messy vendor headers to our schema
  const rawLeads = parsed.data.map((row: any) => ({
    companyName: row['Company Name'] || '',
    contactName: `${row['First Name']} ${row['Last Name']}`.trim(),
    email: row['Email'] || '',
    title: row['Title'] || '',
    domain: row['Website'] || ''
  }));

  console.log("🧩 2. M2: FUZZY DEDUPLICATION...");
  const companies = deduplicateCompanies(rawLeads, 0.15);

  console.log("🛡️  3. M3: PIPEDRIVE EXCLUSION...");
  // Injecting Superblock exactly as it appears in your CRM import.csv
  const activeDeals = [{ company: 'Superblock', stage: '🤙 Live', value: '3000', owner: 'Josh Jang' }];
  const filteredCompanies = filterPipedriveExclusions(companies, activeDeals);

  console.log("🧠 4. M4 & M5: SCORING AND HIERARCHY EVALUATION...\n");
  
  const finalOutput = filteredCompanies.map(company => {
    // M4: Simulate website scrape / domain scoring
    const relevance = calculateRelevance(company.normalizedName, company.domain, 'cashback and rewards surveys');

    // M5: Hierarchy & Department sorting
    const scoredContacts = company.contacts.map(c => ({
      name: c.contactName,
      title: c.title,
      ...calculateHierarchyScore(c.title)
    })).sort((a, b) => b.score - a.score);

    return {
      Company: company.normalizedName,
      Status: company.status,
      RelevanceScore: relevance.score,
      Category: relevance.category,
      PrimaryContact: scoredContacts[0]?.name,
      Level: scoredContacts[0]?.level,
      Dept: scoredContacts[0]?.department,
      ContactsExtracted: scoredContacts.length
    };
  });

  console.table(finalOutput);
}

runTest();
