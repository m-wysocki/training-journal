import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const getCurrentUserContext = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return { supabase, user, accessToken: session?.access_token ?? null }
})

export async function getCurrentUser() {
  const { user } = await getCurrentUserContext()

  return user
}

export async function requireUser() {
  const { supabase, user, accessToken } = await getCurrentUserContext()

  if (!user || !accessToken) {
    redirect('/login')
  }

  return { supabase, user, accessToken }
}
