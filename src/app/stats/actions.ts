'use server'

import { requireUser } from '@/lib/supabase/auth'
import { getStatsEntries, type WeeklyEntry } from '@/lib/supabase/trainingData'

type ActionResult<T = undefined> = Promise<{ data?: T; error?: string | null }>

export async function loadStatsEntries(
  dateFrom: string,
  dateTo: string,
): ActionResult<WeeklyEntry[]> {
  try {
    const { supabase, user } = await requireUser()
    const { data, error } = await getStatsEntries(supabase, user.id, dateFrom, dateTo)

    if (error) {
      return { error: 'Could not load statistics for the selected date range.' }
    }

    return { data }
  } catch {
    return { error: 'Could not load statistics for the selected date range.' }
  }
}
