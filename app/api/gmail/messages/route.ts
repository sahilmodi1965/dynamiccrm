import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { setCredentials } from '@/app/lib/google-auth';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Load saved tokens
    const tokensPath = path.join(process.cwd(), 'data', 'google-tokens.json');
    const tokensData = await fs.readFile(tokensPath, 'utf-8');
    const tokens = JSON.parse(tokensData);

    // Set credentials
    const auth = setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth });

    // Fetch recent messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
      q: 'is:inbox',
    });

    const messages = response.data.messages || [];
    
    // Get message details
    const messageDetails = await Promise.all(
      messages.map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        });

        const headers = detail.data.payload?.headers || [];
        const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
        const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        return {
          id: msg.id,
          from,
          subject,
          date,
          snippet: detail.data.snippet,
        };
      })
    );

    return NextResponse.json({
      success: true,
      messages: messageDetails,
      count: messageDetails.length,
    });

  } catch (error: any) {
    console.error('Gmail API error:', error);
    
    if (error.code === 'ENOENT') {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated. Please connect Gmail first.',
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch messages',
    }, { status: 500 });
  }
}
