import { NextResponse } from 'next/server'
import { migrateLeadsToSequencing } from '@/app/lib/migrateLeads'

export async function POST() {
  try {
    const result = await migrateLeadsToSequencing()
    return NextResponse.json({ 
      success: true,
      message: 'Leads migrated to sequencing model',
      ...result
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error.message 
    }, { status: 500 })
  }
}
