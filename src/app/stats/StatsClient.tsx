'use client'

import { BarChart3, ChevronDown } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import StatusPanel from '@/components/StatusPanel'
import type { CachedWeeklyEntry } from '@/lib/supabase/cachedTrainingData'
import { formatWeekdayDate } from '@/lib/trainingFormatters'
import { loadStatsEntries } from './actions'
import StatsFilters from './StatsFilters'
import styles from './page.module.scss'

type ExerciseCategoryStat = {
  name: string
  trainingDays: number
  trainingDates: string[]
}

type StatsClientProps = {
  dateFrom: string
  dateTo: string
}

const statsEntriesCache = new Map<string, CachedWeeklyEntry[]>()
const statsEntriesPromises = new Map<string, Promise<CachedWeeklyEntry[]>>()

const getStatsCacheKey = (dateFrom: string, dateTo: string) => `${dateFrom}:${dateTo}`

const getExerciseCategoryStats = (entries: CachedWeeklyEntry[]): ExerciseCategoryStat[] => {
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
  const cacheKey = getStatsCacheKey(dateFrom, dateTo)
  const cachedEntries = statsEntriesCache.get(cacheKey)

  if (cachedEntries) {
    return cachedEntries
  }

  if (!statsEntriesPromises.has(cacheKey)) {
    statsEntriesPromises.set(
      cacheKey,
      loadStatsEntries(dateFrom, dateTo).then(({ data, error }) => {
        if (error || !data) {
          throw new Error(error || 'Could not load statistics for the selected date range.')
        }

        statsEntriesCache.set(cacheKey, data)
        statsEntriesPromises.delete(cacheKey)
        return data
      }),
    )
  }

  return statsEntriesPromises.get(cacheKey)!
}

export default function StatsClient({ dateFrom, dateTo }: StatsClientProps) {
  const [entries, setEntries] = useState<CachedWeeklyEntry[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [loadedCacheKey, setLoadedCacheKey] = useState('')
  const currentCacheKey = getStatsCacheKey(dateFrom, dateTo)
  const isLoading = loadedCacheKey !== currentCacheKey

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
        setLoadedCacheKey(currentCacheKey)
      })
      .catch((error: Error) => {
        if (!isActive) return

        setEntries([])
        setErrorMessage(error.message)
        setLoadedCacheKey(currentCacheKey)
      })

    return () => {
      isActive = false
    }
  }, [dateFrom, dateTo, currentCacheKey])

  const workoutDaysCount = useMemo(
    () => new Set(entries.map((entry) => entry.performed_at)).size,
    [entries],
  )
  const exerciseCategoryStats = useMemo(() => getExerciseCategoryStats(entries), [entries])

  return (
    <div className={styles.wrapper}>
      <PageContainer className={styles.container}>
        <div className={styles.header}>
          <BackLink href="/" label="← Back to Home" />
          <div className={styles.titleRow}>
            <div className={styles.titleIcon} aria-hidden="true">
              <BarChart3 size={22} strokeWidth={1.9} />
            </div>
            <h1 className={styles.title}>Statistics</h1>
          </div>
          <p className={styles.description}>
            Review your training by date range and see how often you trained each exercise category.
          </p>
        </div>

        <StatsFilters dateFrom={dateFrom} dateTo={dateTo} />

        {isLoading ? (
          <StatusPanel variant="loading" withBottomSpacing>
            Loading statistics...
          </StatusPanel>
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

              {exerciseCategoryStats.length === 0 ? (
                <p className={styles.emptyText}>No workouts logged for this date range.</p>
              ) : (
                <Accordion.Root type="single" collapsible className={styles.breakdownList} asChild>
                  <ul>
                    {exerciseCategoryStats.map((stat) => (
                      <Accordion.Item key={stat.name} value={stat.name} className={styles.breakdownItem} asChild>
                        <li>
                          <Accordion.Header className={styles.breakdownItemHeader}>
                            <Accordion.Trigger className={styles.breakdownTrigger}>
                              <span className={styles.exerciseCategoryName}>{stat.name}</span>
                              <span className={styles.exerciseCategoryMeta}>
                                <span className={styles.exerciseCategoryValue}>
                                  {stat.trainingDays} {stat.trainingDays === 1 ? 'day' : 'days'}
                                </span>
                                <ChevronDown
                                  size={16}
                                  strokeWidth={2}
                                  className={styles.breakdownTriggerIcon}
                                  aria-hidden="true"
                                />
                              </span>
                            </Accordion.Trigger>
                          </Accordion.Header>
                          <Accordion.Content className={styles.breakdownContent}>
                            <ul className={styles.trainingDatesList}>
                              {stat.trainingDates.map((trainingDate) => (
                                <li key={trainingDate} className={styles.trainingDateItem}>
                                  {formatWeekdayDate(trainingDate)}
                                </li>
                              ))}
                            </ul>
                          </Accordion.Content>
                        </li>
                      </Accordion.Item>
                    ))}
                  </ul>
                </Accordion.Root>
              )}
            </section>
          </div>
        )}
      </PageContainer>
    </div>
  )
}
