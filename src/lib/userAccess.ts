import { createClient } from '@/lib/supabase/server'

export type UserAccessStatus = 'approved' | 'pending'

export async function getCurrentUserAccessStatus(): Promise<UserAccessStatus> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_access')
    .select('approved')
    .maybeSingle()

  if (error) {
    return 'pending'
  }

  return data?.approved ? 'approved' : 'pending'
}
