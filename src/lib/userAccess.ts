import { supabase } from '@/lib/supabase'

export type UserAccessStatus = 'approved' | 'pending'

export async function getCurrentUserAccessStatus(): Promise<UserAccessStatus> {
  const { data, error } = await supabase
    .from('user_access')
    .select('approved')
    .maybeSingle()

  if (error) {
    return 'pending'
  }

  return data?.approved ? 'approved' : 'pending'
}
