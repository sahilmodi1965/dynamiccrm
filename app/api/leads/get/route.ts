import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const STORAGE_PATH = path.join(process.cwd(), 'backend', 'storage', 'leads.json');

export async function GET(request: NextRequest) {
  try {
    const fileData = await fs.readFile(STORAGE_PATH, 'utf-8');
    const storage = JSON.parse(fileData);

    return NextResponse.json({
      leads: storage.leads,
      lastUpdated: storage.lastUpdated,
      total: storage.leads.length
    });
  } catch (error: any) {
    console.error('Get error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
