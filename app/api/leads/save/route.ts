import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'backend', 'storage');
const STORAGE_PATH = path.join(STORAGE_DIR, 'leads.json');

async function ensureStorageExists() {
  try {
    await fs.access(STORAGE_DIR);
  } catch {
    // Directory doesn't exist, create it
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    
    // Initialize empty leads file
    const initialData = {
      leads: [],
      lastUpdated: new Date().toISOString()
    };
    await fs.writeFile(STORAGE_PATH, JSON.stringify(initialData, null, 2));
  }
}

async function readLeadsFile() {
  try {
    const fileData = await fs.readFile(STORAGE_PATH, 'utf-8');
    const storage = JSON.parse(fileData);
    
    // Validate structure
    if (!storage.leads || !Array.isArray(storage.leads)) {
      throw new Error('Invalid storage structure');
    }
    
    return storage;
  } catch (error: any) {
    // If file is corrupted or doesn't exist, return fresh structure
    console.error('Error reading leads file:', error.message);
    return {
      leads: [],
      lastUpdated: new Date().toISOString()
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Step 1: Validate request body
    const body = await request.json();
    const { leads } = body;
    
    if (!leads) {
      return NextResponse.json({ 
        error: 'Missing leads data in request body.' 
      }, { status: 400 });
    }
    
    if (!Array.isArray(leads)) {
      return NextResponse.json({ 
        error: 'Leads must be an array.' 
      }, { status: 400 });
    }

    if (leads.length === 0) {
      return NextResponse.json({ 
        error: 'No leads to save. Array is empty.' 
      }, { status: 400 });
    }

    // Step 2: Ensure storage directory exists
    await ensureStorageExists();

    // Step 3: Read existing data safely
    const storage = await readLeadsFile();

    // Step 4: Validate lead objects
    const validLeads = leads.filter((lead: any) => {
      return lead && 
             typeof lead === 'object' && 
             lead.company && 
             lead.contact;
    });

    if (validLeads.length === 0) {
      return NextResponse.json({ 
        error: 'No valid leads found. Each lead must have company and contact fields.' 
      }, { status: 400 });
    }

    // Step 5: Avoid duplicates by company name
    const existingCompanies = new Set(storage.leads.map((l: any) => l.company));
    const newLeads = validLeads.filter((lead: any) => !existingCompanies.has(lead.company));
    
    if (newLeads.length === 0) {
      return NextResponse.json({ 
        success: true,
        saved: 0,
        total: storage.leads.length,
        message: 'All leads already exist in database. No duplicates added.'
      });
    }

    // Step 6: Update storage
    storage.leads = [...storage.leads, ...newLeads];
    storage.lastUpdated = new Date().toISOString();

    // Step 7: Write back to file with error handling
    try {
      await fs.writeFile(STORAGE_PATH, JSON.stringify(storage, null, 2));
    } catch (writeError: any) {
      console.error('File write error:', writeError);
      return NextResponse.json({ 
        error: `Failed to save leads: ${writeError.message}. Check file permissions.` 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      saved: newLeads.length,
      skipped: validLeads.length - newLeads.length,
      total: storage.leads.length,
      message: `Successfully saved ${newLeads.length} new leads. Total: ${storage.leads.length}`
    });

  } catch (error: any) {
    console.error('Save error:', error);
    return NextResponse.json({ 
      error: `Save operation failed: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}
