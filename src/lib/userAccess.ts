import { getCurrentUserContext } from '@/lib/supabase/auth'

export type UserAccessStatus = 'approved' | 'pending'

export async function getCurrentUserAccessStatus(): Promise<UserAccessStatus> {
  const { supabase, user } = await getCurrentUserContext()

  if (!user) {
    return 'pending'
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
