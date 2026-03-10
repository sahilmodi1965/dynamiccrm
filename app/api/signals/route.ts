import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: signals, error } = await supabase
      .from("signals")
      .select("*")
      .order("detected_at", { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ signals })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { company_domain, signal_type, signal_data, source_url } = body

    if (!company_domain || !signal_type) {
      return NextResponse.json(
        { error: "company_domain and signal_type required" },
        { status: 400 }
      )
    }

    // Get priority boost from signal_weights
    const { data: weightData } = await supabase
      .from("signal_weights")
      .select("priority_boost")
      .eq("signal_type", signal_type)
      .single()

    const priority_boost = weightData?.priority_boost || 10

    // Insert signal
    const { data: signal, error } = await supabase
      .from("signals")
      .insert({
        company_domain,
        signal_type,
        signal_data: signal_data || {},
        source_url,
        priority_boost,
        detected_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Update lead priority scores for this domain
    await supabase.rpc("boost_lead_priority", {
      domain: company_domain,
      boost: priority_boost
    })

    return NextResponse.json({
      success: true,
      signal,
      message: `Signal created with +${priority_boost} priority boost`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
