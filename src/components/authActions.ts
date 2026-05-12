'use server'

import { getCurrentUser, getCurrentUserContext } from '@/lib/supabase/auth'

export async function getAuthButtonUser() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email ?? null,
  }
}

export async function signOut() {
  const { supabase } = await getCurrentUserContext()
  await supabase.auth.signOut()
}
