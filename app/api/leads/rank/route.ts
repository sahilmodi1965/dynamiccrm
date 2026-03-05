import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { rankLeadsByHierarchy } from '@/backend/hierarchy';

export async function POST() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'leads.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Add hierarchy scores to all leads
    const rankedLeads = rankLeadsByHierarchy(data.leads);

    // Save updated data
    fs.writeFileSync(dataPath, JSON.stringify({ leads: rankedLeads }, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Leads ranked by hierarchy',
      totalLeads: rankedLeads.length,
      decisionMakers: rankedLeads.filter((l: any) => l.isDecisionMaker).length,
      ranked: rankedLeads
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
