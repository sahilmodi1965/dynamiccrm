import { NextResponse } from 'next/server';
import fs from 'fs';

export async function POST() {
  try {
    const data = JSON.parse(fs.readFileSync('data/leads.json', 'utf-8'));
    const leads = data.leads || data;
    const pipedriveData = JSON.parse(fs.readFileSync('data/pipedrive_export.json', 'utf-8'));
    
    const excluded = new Set(
      pipedriveData.deals
        .filter((d: any) => ['io_stage', 'integration', 'live', 'deal_won'].includes(d.stage))
        .map((d: any) => d.company.toLowerCase())
    );

    const filtered = leads.map((lead: any) => ({
      ...lead,
      excluded: excluded.has(lead.company.toLowerCase()),
      exclusionReason: excluded.has(lead.company.toLowerCase()) 
        ? 'Existing partner in mature stage' 
        : null
    }));

    fs.writeFileSync('data/leads.json', JSON.stringify({ leads: filtered }, null, 2));

    return NextResponse.json({
      success: true,
      excluded: filtered.filter((l: any) => l.excluded).length,
      active: filtered.filter((l: any) => !l.excluded).length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
