'use server'

import { getCurrentUserContext } from '@/lib/supabase/auth'

export type HomeAccessState = 'approved' | 'pending' | 'signed-out'

export async function getHomeAccessState(): Promise<HomeAccessState> {
  const { supabase, user } = await getCurrentUserContext()

  if (!user) {
    return 'signed-out'
  }

  const { data, error } = await supabase
    .from('user_access')
    .select('approved')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return 'pending'
  }

  return data?.approved ? 'approved' : 'pending'
}
