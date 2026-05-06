import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const getCurrentUserContext = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user }
})

export async function getCurrentUser() {
  const { user } = await getCurrentUserContext()

  return user
}

export async function requireUser() {
  const { supabase, user } = await getCurrentUserContext()

  if (!user) {
    redirect('/login')
  }

  return { supabase, user }
}
