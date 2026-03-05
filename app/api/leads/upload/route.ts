import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    const leads = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const lead: any = {};
      headers.forEach((header, i) => {
        lead[header] = values[i] || '';
      });
      lead.id = Math.random().toString(36).substr(2, 9);
      lead.uploadedAt = new Date().toISOString();
      lead.status = 'new';
      return lead;
    });

    // Deduplicate by email
    const existing = JSON.parse(fs.readFileSync('data/leads.json', 'utf-8'));
    const existingEmails = new Set(existing.map((l: any) => l.email));
    const newLeads = leads.filter(l => !existingEmails.has(l.email));
    
    const updated = [...existing, ...newLeads];
    fs.writeFileSync('data/leads.json', JSON.stringify(updated, null, 2));

    return NextResponse.json({
      success: true,
      uploaded: newLeads.length,
      duplicates: leads.length - newLeads.length,
      total: updated.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
