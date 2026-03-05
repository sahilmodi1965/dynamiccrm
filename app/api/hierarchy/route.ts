import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'leads.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Group by company
    const companies = new Map<string, any[]>();
    data.leads.forEach((lead: any) => {
      const company = lead.company || 'Unknown';
      if (!companies.has(company)) {
        companies.set(company, []);
      }
      companies.get(company)!.push(lead);
    });

    // Build hierarchy report
    const report = Array.from(companies.entries()).map(([company, leads]) => {
      const sorted = leads.sort((a, b) => (b.hierarchyScore || 0) - (a.hierarchyScore || 0));
      const topContact = sorted[0];
      
      return {
        company,
        totalLeads: leads.length,
        topContact: {
          name: topContact.name,
          title: topContact.title,
          email: topContact.email,
          hierarchyLevel: topContact.hierarchyLevel,
          hierarchyScore: topContact.hierarchyScore,
          status: topContact.status
        },
        otherContacts: sorted.slice(1).map((l: any) => ({
          name: l.name,
          title: l.title,
          hierarchyLevel: l.hierarchyLevel,
          hierarchyScore: l.hierarchyScore,
          status: l.status
        }))
      };
    });

    return NextResponse.json({ companies: report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
