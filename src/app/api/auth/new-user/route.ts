import { NextResponse } from 'next/server'

type NewUserPayload = {
  email?: string
  userId?: string
}

const resendApiKey = process.env.RESEND_API_KEY
const adminEmail = process.env.ADMIN_EMAIL
const fromEmail = process.env.AUTH_NOTIFICATION_FROM_EMAIL ?? 'Training Journal <onboarding@resend.dev>'

export async function POST(request: Request) {
  let payload: NewUserPayload

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
  }

  const email = payload.email?.trim()
  const userId = payload.userId?.trim()

  if (!email || !userId) {
    return NextResponse.json({ error: 'Missing user details.' }, { status: 400 })
  }

  if (!resendApiKey || !adminEmail) {
    console.warn('New user notification skipped. Set RESEND_API_KEY and ADMIN_EMAIL.')
    return NextResponse.json({ ok: true, skipped: true })
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: adminEmail,
      subject: 'New Training Journal signup',
      text: [
        'A new user created a Training Journal account.',
        '',
        `Email: ${email}`,
        `User ID: ${userId}`,
        '',
        'Approve this candidate in Supabase SQL Editor:',
        `update public.user_access set approved = true, approved_at = now() where user_id = '${userId}';`,
      ].join('\n'),
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    console.error('Could not send new user notification.', details)
    return NextResponse.json({ error: 'Could not send notification.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
