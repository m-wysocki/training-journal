'use server'

import { requireUser } from '@/lib/supabase/auth'

export async function signOut() {
  const { supabase } = await requireUser()
  await supabase.auth.signOut()
}
