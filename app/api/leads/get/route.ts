import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const STORAGE_PATH = path.join(process.cwd(), 'backend', 'storage', 'leads.json');

export async function GET(request: NextRequest) {
  try {
    // Check if storage file exists
    try {
      await fs.access(STORAGE_PATH);
    } catch {
      // File doesn't exist yet - return empty state
      return NextResponse.json({ 
        leads: [],
        lastUpdated: null,
        message: 'No leads saved yet. Upload and analyze your first CSV file to get started.'
      });
    }

    // Read and parse file
    const fileData = await fs.readFile(STORAGE_PATH, 'utf-8');
    let storage;
    
    try {
      storage = JSON.parse(fileData);
    } catch (parseError) {
      // Corrupted JSON - return empty state
      console.error('Corrupted leads file, returning empty state');
      return NextResponse.json({ 
        leads: [],
        lastUpdated: null,
        error: 'Storage file corrupted. Data has been reset.'
      });
    }

    // Validate structure
    if (!storage.leads || !Array.isArray(storage.leads)) {
      return NextResponse.json({ 
        leads: [],
        lastUpdated: null,
        error: 'Invalid storage structure. Data has been reset.'
      });
    }

    return NextResponse.json({ 
      leads: storage.leads,
      lastUpdated: storage.lastUpdated,
      total: storage.leads.length,
      message: storage.leads.length === 0 
        ? 'No leads saved yet.' 
        : `Loaded ${storage.leads.length} leads.`
    });

  } catch (error: any) {
    console.error('Get leads error:', error);
    return NextResponse.json({ 
      leads: [],
      error: `Failed to load leads: ${error.message}` 
    }, { status: 500 });
  }
}
