import { cache } from 'react'
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
