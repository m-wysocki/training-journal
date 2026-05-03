import { NextResponse } from 'next/server'
import { sendNewUserNotification } from '@/lib/newUserNotification'

type NewUserPayload = {
  email?: string
  userId?: string
}

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

  const result = await sendNewUserNotification({ email, userId })

  if (!result.ok) {
    return NextResponse.json({ error: 'Could not send notification.' }, { status: 502 })
  }

  return NextResponse.json(result)
}
