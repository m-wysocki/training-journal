'use client'

import { useEffect, useState } from 'react'
import type { WeeklyEntry } from '@/lib/supabase/trainingData'
import { getStatsRangeKey, loadStatsPayload } from '../_helpers/stats'

type UseStatsEntriesResult = {
  entries: WeeklyEntry[]
  errorMessage: string
  isLoading: boolean
}

export const useStatsEntries = (dateFrom: string, dateTo: string): UseStatsEntriesResult => {
  const [entries, setEntries] = useState<WeeklyEntry[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [loadedRangeKey, setLoadedRangeKey] = useState('')
  const currentRangeKey = getStatsRangeKey(dateFrom, dateTo)
  const isLoading = loadedRangeKey !== currentRangeKey

  useEffect(() => {
    let isActive = true

    if (!dateFrom || !dateTo) {
      return () => {
        isActive = false
      }
    }

    loadStatsPayload(dateFrom, dateTo)
      .then((nextEntries) => {
        if (!isActive) return

        setEntries(nextEntries)
        setErrorMessage('')
        setLoadedRangeKey(currentRangeKey)
      })
      .catch((error: Error) => {
        if (!isActive) return

        setEntries([])
        setErrorMessage(error.message)
        setLoadedRangeKey(currentRangeKey)
      })

    return () => {
      isActive = false
    }
  }, [dateFrom, dateTo, currentRangeKey])

  return { entries, errorMessage, isLoading }
}
