import { google } from 'googleapis'

export async function sendEmailViaGmail(to: string, subject: string, body: string) {
  // MOCK MODE: Log email instead of sending (replace with real Gmail later)
  console.log('📧 MOCK EMAIL SEND')
  console.log('To:', to)
  console.log('Subject:', subject)
  console.log('Body:', body)
  console.log('---')

  // Return mock response
  return {
    id: 'mock_email_' + Date.now(),
    threadId: 'mock_thread_' + Date.now(),
    labelIds: ['SENT']
  }
}
