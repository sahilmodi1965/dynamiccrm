import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const timezone = searchParams.get("timezone") || "America/New_York"
    const contactEmail = searchParams.get("email")

    // Default optimal hours based on industry research
    // Tuesday-Thursday, 9-11am and 2-4pm are typically best
    const defaultOptimalHours = [9, 10, 14, 15]
    const defaultOptimalDays = [2, 3, 4] // Tue, Wed, Thu

    let personalizedData = null

    // If we have a contact email, check their engagement history
    if (contactEmail) {
      const { data: engagements } = await supabase
        .from("email_tracking")
        .select("opened_at, clicked_at")
        .eq("recipient_email", contactEmail)
        .not("opened_at", "is", null)
        .limit(20)

      if (engagements && engagements.length >= 3) {
        // Calculate most responsive hours from their history
        const openHours = engagements
          .filter(e => e.opened_at)
          .map(e => new Date(e.opened_at).getHours())
        
        if (openHours.length > 0) {
          const hourCounts: Record<number, number> = {}
          openHours.forEach(h => { hourCounts[h] = (hourCounts[h] || 0) + 1 })
          const bestHour = Object.entries(hourCounts)
            .sort((a, b) => b[1] - a[1])[0]
          
          personalizedData = {
            basedOn: "contact_history",
            engagementCount: engagements.length,
            bestHour: parseInt(bestHour[0])
          }
        }
      }
    }

    // Get current time in requested timezone
    const now = new Date()
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
      weekday: "short"
    })
    const parts = formatter.formatToParts(now)
    const currentHour = parseInt(parts.find(p => p.type === "hour")?.value || "12")
    const currentDay = parts.find(p => p.type === "weekday")?.value

    // Find next optimal send time
    const optimalHour = personalizedData?.bestHour || defaultOptimalHours[0]
    
    let recommendation = "now"
    if (currentHour >= 17) {
      recommendation = "tomorrow morning at 9:00 AM"
    } else if (currentHour < 9) {
      recommendation = "today at 9:00 AM"
    } else if (currentHour >= 12 && currentHour < 14) {
      recommendation = "today at 2:00 PM"
    }

    // Check if today is weekend
    if (currentDay === "Sat") {
      recommendation = "Monday at 9:00 AM"
    } else if (currentDay === "Sun") {
      recommendation = "tomorrow (Monday) at 9:00 AM"
    }

    return NextResponse.json({
      timezone,
      currentHour,
      currentDay,
      optimalHour,
      optimalDays: ["Tuesday", "Wednesday", "Thursday"],
      recommendation,
      personalizedData,
      reasoning: personalizedData 
        ? "Based on this contacts past email engagement patterns"
        : "Based on industry benchmarks for B2B outreach"
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
