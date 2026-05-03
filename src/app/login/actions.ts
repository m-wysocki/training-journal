'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { sendNewUserNotification } from '@/lib/newUserNotification'

type AuthActionResult = {
  error?: string | null
  message?: string
  signedIn?: boolean
}

export async function signInWithPassword(email: string, password: string): Promise<AuthActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return { signedIn: true }
}

export async function signUpWithPassword(email: string, password: string): Promise<AuthActionResult> {
  const requestHeaders = await headers()
  const origin = requestHeaders.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user?.email) {
    await sendNewUserNotification({
      email: data.user.email,
      userId: data.user.id,
    })
  }

  if (data.session) {
    return { signedIn: true }
  }

  return {
    message: 'Account created. Check your inbox to confirm your email address. Access starts after admin approval.',
  }
}
