'use server'

import { requireUser } from '@/lib/supabase/auth'
import { getCachedStatsEntries, type CachedWeeklyEntry } from '@/lib/supabase/cachedTrainingData'

type ActionResult<T = undefined> = Promise<{ data?: T; error?: string | null }>

export async function loadStatsEntries(
  dateFrom: string,
  dateTo: string,
): ActionResult<CachedWeeklyEntry[]> {
  try {
    const { user, accessToken } = await requireUser()
    const { data, error } = await getCachedStatsEntries(user.id, accessToken, dateFrom, dateTo)

    if (error) {
      return { error: 'Could not load statistics for the selected date range.' }
    }

    return { data }
  } catch {
    return { error: 'Could not load statistics for the selected date range.' }
  }
}
