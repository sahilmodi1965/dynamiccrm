import { NextResponse } from 'next/server'
import { getNextLeadToContact } from '@/app/lib/sequencingEngine'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const company = searchParams.get('company')

    const nextLeads = await getNextLeadToContact(company || undefined)

    return NextResponse.json({ 
      success: true,
      nextLeads,
      count: nextLeads.length
    })
  } catch (error: any) {
    console.error('Sequencing error:', error)
    return NextResponse.json({ 
      error: 'Failed to get next leads',
      details: error.message 
    }, { status: 500 })
  }
}
