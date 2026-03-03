import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/app/lib/google-auth';

export async function GET() {
  const authUrl = getAuthUrl();
  return NextResponse.redirect(authUrl);
}
