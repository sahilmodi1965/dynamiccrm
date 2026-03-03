import { NextResponse } from 'next/server'
import { markLeadAsReplied } from '@/app/lib/sequencingEngine'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { leadId } = body

    if (!leadId) {
      return NextResponse.json({ 
        error: 'Missing leadId' 
      }, { status: 400 })
    }

    const lead = await markLeadAsReplied(leadId)

    if (!lead) {
      return NextResponse.json({ 
        error: 'Lead not found' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Lead marked as replied',
      leadName: lead.name,
      company: lead.company
    })
  } catch (error: any) {
    console.error('Reply tracking error:', error)
    return NextResponse.json({ 
      error: 'Failed to mark reply',
      details: error.message
    }, { status: 500 })
  }
}
