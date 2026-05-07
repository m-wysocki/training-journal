'use client'

import { BarChart3 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import PageContainer from '@/components/PageContainer'
import PageHeader from '@/components/PageHeader'
import StatusPanel from '@/components/StatusPanel'
import type { WeeklyEntry } from '@/lib/supabase/trainingData'
import { loadStatsEntries } from './actions'
import StatsCategoryBreakdown, { type ExerciseCategoryStat } from './StatsCategoryBreakdown'
import StatsFilters from './StatsFilters'
import styles from './page.module.scss'

type StatsClientProps = {
  dateFrom: string
  dateTo: string
}

const getStatsRangeKey = (dateFrom: string, dateTo: string) => `${dateFrom}:${dateTo}`

const getExerciseCategoryStats = (entries: WeeklyEntry[]): ExerciseCategoryStat[] => {
  const groups = new Map<string, Set<string>>()

  entries.forEach((entry) => {
    const exerciseCategoryName = entry.exercise?.exercise_category?.name || 'Unknown exercise category'
    const current = groups.get(exerciseCategoryName) || new Set<string>()
    current.add(entry.performed_at)
    groups.set(exerciseCategoryName, current)
  })

  return Array.from(groups.entries())
    .map(([name, trainingDates]) => ({
      name,
      trainingDays: trainingDates.size,
      trainingDates: Array.from(trainingDates).sort((a, b) => b.localeCompare(a)),
    }))
    .sort((a, b) => b.trainingDays - a.trainingDays || a.name.localeCompare(b.name))
}

const loadStatsPayload = async (dateFrom: string, dateTo: string) => {
  const { data, error } = await loadStatsEntries(dateFrom, dateTo)

  if (error || !data) {
    throw new Error(error || 'Could not load statistics for the selected date range.')
  }

  return data
}

export default function StatsClient({ dateFrom, dateTo }: StatsClientProps) {
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

  const workoutDaysCount = useMemo(
    () => new Set(entries.map((entry) => entry.performed_at)).size,
    [entries],
  )
  const exerciseCategoryStats = useMemo(() => getExerciseCategoryStats(entries), [entries])

  return (
    <div className={styles.wrapper}>
      <PageContainer className={styles.container}>
        <PageHeader
          backHref="/"
          backLabel="← Back to Home"
          icon={BarChart3}
          title="Statistics"
          description="Review your training by date range and see how often you trained each exercise category."
        />

        <StatsFilters dateFrom={dateFrom} dateTo={dateTo} />

        {isLoading ? (
          <LoadingSkeleton ariaLabel="Loading statistics" count={2} variant="card" />
        ) : null}

        {errorMessage ? (
          <StatusPanel variant="error" withBottomSpacing>
            {errorMessage}
          </StatusPanel>
        ) : null}

        {!errorMessage && !isLoading && (
          <div className={styles.statsGrid}>
            <section className={styles.summaryCard}>
              <p className={styles.cardLabel}>Workout Days</p>
              <p className={styles.primaryStat}>{workoutDaysCount}</p>
              <p className={styles.cardHint}>Number of days you trained during the selected date range.</p>
            </section>

            <section className={styles.breakdownCard}>
              <div className={styles.breakdownHeader}>
                <h2 className={styles.breakdownTitle}>Exercise Category Frequency</h2>
                <p className={styles.breakdownDescription}>
                  Counted as distinct training days per exercise category within the selected date range.
                </p>
              </div>

              <StatsCategoryBreakdown stats={exerciseCategoryStats} />
            </section>
          </div>
        )}
      </PageContainer>
    </div>
  )
}
