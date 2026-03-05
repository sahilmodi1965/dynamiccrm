import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { deduplicateCompanies } from '@/lib/fuzzy-match';
import { calculateHierarchyScore } from '@/backend/hierarchy';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const text = await file.text();
    // skipEmptyLines and header: true handle the worst of the dirty data
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    
    // Normalize dirty column names (handles 'Company', 'company', 'Company Name', etc.)
    const rawLeads = parsed.data.map((row: any) => ({
      companyName: row.company || row.Company || row['Company Name'] || row.Organization || '',
      contactName: row.name || row.Name || row.Contact || row['First Name'] || '',
      email: row.email || row.Email || '',
      title: row.title || row.Title || row.JobTitle || row['Job Title'] || '',
      domain: row.domain || row.Domain || row.Website || ''
    })).filter((l: any) => l.companyName || l.email); // Drop completely empty rows

    // M2: Fuzzy Match & Deduplicate (85% threshold)
    const companies = deduplicateCompanies(rawLeads, 0.15);

    // M5: Apply Hierarchy & Identify Decision Makers
    const processedCompanies = companies.map(company => {
      const scoredContacts = company.contacts.map(c => ({
        ...c,
        ...calculateHierarchyScore(c.title)
      })).sort((a, b) => b.score - a.score); // Primary contacts float to the top

      // M4 Placeholder: We would map to 'our top publishers.csv' categories here
      const relevanceScore = Math.floor(Math.random() * 40) + 60; // Mock 60-100 score

      return { 
        ...company, 
        contacts: scoredContacts,
        primaryContact: scoredContacts[0],
        relevanceScore
      };
    });

    return NextResponse.json({ success: true, companies: processedCompanies });
  } catch (e: any) {
    console.error("Upload pipeline failed:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
