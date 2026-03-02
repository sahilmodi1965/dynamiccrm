import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const STORAGE_PATH = path.join(process.cwd(), 'backend', 'storage', 'leads.json');

export async function POST(request: NextRequest) {
  try {
    const { leads } = await request.json();
    
    if (!Array.isArray(leads)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Read existing data
    const fileData = await fs.readFile(STORAGE_PATH, 'utf-8');
    const storage = JSON.parse(fileData);

    // Append new leads (avoid duplicates by company name)
    const existingCompanies = new Set(storage.leads.map((l: any) => l.company));
    const newLeads = leads.filter((lead: any) => !existingCompanies.has(lead.company));
    
    storage.leads = [...storage.leads, ...newLeads];
    storage.lastUpdated = new Date().toISOString();

    // Write back to file
    await fs.writeFile(STORAGE_PATH, JSON.stringify(storage, null, 2));

    return NextResponse.json({ 
      success: true, 
      saved: newLeads.length,
      total: storage.leads.length 
    });
  } catch (error: any) {
    console.error('Save error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
