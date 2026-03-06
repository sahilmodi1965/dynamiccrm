import fs from 'fs';
import Papa from 'papaparse';
import { deduplicateCompanies } from '../app/lib/fuzzy-match';
import { calculateHierarchyScore } from '../backend/hierarchy';
import { filterPipedriveExclusions } from '../app/lib/pipedrive';
import { calculateRelevance } from '../app/lib/scoring';

const LEADS_FILE = './data/Reward_leads.csv'; // Adjust this name to match your exact file
const CRM_FILE = './data/CRM import.csv';
const FOUNDER_EXCLUDE_FILE = './data/Exclude by Founder .csv';

async function runBulkTest() {
  console.log("🚀 STARTING BULK INGESTION EXPERIMENT...\n");

  // 1. Load CRM Active Deals
  let activeDeals: any[] = [];
  if (fs.existsSync(CRM_FILE)) {
    const crmRaw = fs.readFileSync(CRM_FILE, 'utf-8');
    const crmParsed = Papa.parse(crmRaw, { header: true, skipEmptyLines: true });
    activeDeals = crmParsed.data.map((row: any) => ({
      company: row['Deal - Organization'] || '',
      stage: row['Deal - Stage'] || ''
    })).filter(d => d.company);
    console.log(`✅ Loaded ${activeDeals.length} active deals from CRM.`);
  } else {
    console.log(`⚠️ CRM file not found at ${CRM_FILE}, skipping M3 exclusions.`);
  }

  // 2. Load Raw Leads
  if (!fs.existsSync(LEADS_FILE)) {
    console.error(`❌ Leads file not found at ${LEADS_FILE}. Please rename your file and put it in the data folder.`);
    return;
  }
  
  const leadsRaw = fs.readFileSync(LEADS_FILE, 'utf-8');
  const leadsParsed = Papa.parse(leadsRaw, { header: true, skipEmptyLines: true });
  
  const rawLeads = leadsParsed.data.map((row: any) => ({
    companyName: row['Company Name'] || row['Company'] || '',
    contactName: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
    email: row['Email'] || '',
    title: row['Title'] || '',
    domain: row['Website'] || ''
  })).filter((l: any) => l.companyName || l.email);

  console.log(`✅ Loaded ${rawLeads.length} raw contacts from vendor CSV.`);

  // 3. Process Pipeline
  console.log("⚙️  Running M2: Fuzzy Deduplication...");
  const companies = deduplicateCompanies(rawLeads, 0.15);
  
  console.log("🛡️  Running M3: Pipedrive & Founder Exclusions...");
  const filteredCompanies = filterPipedriveExclusions(companies, activeDeals);

  console.log("🧠 Running M4 & M5: Relevance Scoring and Hierarchy Assessment...");
  const finalOutput = filteredCompanies.map(company => {
    const relevance = calculateRelevance(company.normalizedName, company.domain, 'cashback rewards');
    const scoredContacts = company.contacts.map(c => ({
      name: c.contactName,
      title: c.title,
      ...calculateHierarchyScore(c.title)
    })).sort((a, b) => b.score - a.score);

    return {
      Company: company.normalizedName.substring(0, 20),
      Status: company.status === 'Available' ? '✅ Available' : '🚫 Excluded',
      Score: relevance.score,
      PrimaryContact: scoredContacts[0]?.name || 'Unknown',
      Title: (scoredContacts[0]?.title || '').substring(0, 20),
      Level: scoredContacts[0]?.level,
      TotalContacts: scoredContacts.length
    };
  });

  // Analytics
  const availableCount = finalOutput.filter(c => c.Status.includes('Available')).length;
  const excludedCount = finalOutput.filter(c => c.Status.includes('Excluded')).length;

  console.log("\n\033[1;32m━━━ PIPELINE RESULTS ━━━\033[0m");
  console.log(`Total Contacts Ingested: ${rawLeads.length}`);
  console.log(`Unique Companies Found (M2): ${companies.length}`);
  console.log(`Companies Excluded (M3): ${excludedCount}`);
  console.log(`Companies Ready for Outreach: ${availableCount}`);
  
  console.log("\n\033[1;36m━━━ SAMPLE OF PROCESSED COMPANIES (Top 15) ━━━\033[0m");
  console.table(finalOutput.slice(0, 15));
}

runBulkTest();
