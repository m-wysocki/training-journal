'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAuthButtonUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return {
    email: user.email ?? null,
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
