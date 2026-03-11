import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('user_email')
  
  if (!userCookie) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
  
  return NextResponse.json({ 
    user: { 
      email: userCookie.value 
    } 
  })
}
