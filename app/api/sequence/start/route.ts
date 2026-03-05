import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getTopContactPerCompany } from '@/backend/hierarchy';

export async function POST(request: Request) {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'leads.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Get only the top-ranked contact per company
    const topContacts = getTopContactPerCompany(data.leads);

    // Filter to uncontacted leads
    const eligible = topContacts.filter((lead: any) => lead.status !== 'contacted');

    if (eligible.length === 0) {
      return NextResponse.json({ 
        message: 'No eligible leads. All top contacts have been contacted.',
        totalLeads: data.leads.length,
        topContacts: topContacts.length
      });
    }

    // Start sequence with highest-ranked leads
    const started = eligible.map((lead: any) => ({
      ...lead,
      sequencePosition: 1,
      sequenceStartedAt: new Date().toISOString()
    }));

    // Update data
    const updatedLeads = data.leads.map((lead: any) => {
      const updated = started.find((s: any) => s.id === lead.id);
      return updated || lead;
    });

    fs.writeFileSync(dataPath, JSON.stringify({ leads: updatedLeads }, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Sequence started with top contacts per company',
      started: started.length,
      breakdown: started.map((l: any) => ({
        company: l.company,
        contact: l.name,
        title: l.title,
        hierarchyLevel: l.hierarchyLevel,
        hierarchyScore: l.hierarchyScore
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
