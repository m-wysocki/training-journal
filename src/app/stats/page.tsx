'use client'

import { BarChart3, ChevronDown } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import BackLink from '@/components/BackLink'
import { DatePicker } from '@/components/DatePicker'
import PageContainer from '@/components/PageContainer'
import { supabase } from '@/lib/supabase'
import { formatDateRange, getCurrentWeekRange, shiftWeekRange } from '@/lib/trainingDateRange'
import { formatWeekdayDate } from '@/lib/trainingFormatters'
import styles from './page.module.scss'

type WeeklyEntry = {
  performed_at: string
  exercise: {
    exercise_category: {
      name: string
    } | null
  } | null
}

type ExerciseCategoryStat = {
  name: string
  trainingDays: number
  trainingDates: string[]
}

export default function StatsPage() {
  const [{ dateFrom, dateTo }, setDateRange] = useState(getCurrentWeekRange)
  const [entries, setEntries] = useState<WeeklyEntry[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const updateDateFrom = (value: string) => {
    setLoading(true)
    setDateRange((current) => ({ ...current, dateFrom: value }))
  }

  const updateDateTo = (value: string) => {
    setLoading(true)
    setDateRange((current) => ({ ...current, dateTo: value }))
  }

  const shiftDateRangeByWeek = (direction: -1 | 1) => {
    setLoading(true)
    setDateRange(shiftWeekRange(dateFrom, direction))
  }

  useEffect(() => {
    let isActive = true

    supabase
      .from('completed_exercises')
      .select(
        `
          performed_at,
          exercise:exercises (
            exercise_category:exercise_categories (
              name
            )
          )
        `,
      )
      .gte('performed_at', dateFrom)
      .lte('performed_at', dateTo)
      .then(({ data, error }) => {
        if (!isActive) return

        if (error) {
          setErrorMessage('Could not load statistics for the selected date range.')
          setEntries([])
          setLoading(false)
          return
        }

        setErrorMessage('')
        setEntries((data as unknown as WeeklyEntry[]) || [])
        setLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [dateFrom, dateTo])

  const workoutDaysCount = useMemo(() => new Set(entries.map((entry) => entry.performed_at)).size, [entries])

  const exerciseCategoryStats = useMemo<ExerciseCategoryStat[]>(() => {
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
  }, [entries])

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

        <div className={styles.filtersBar}>
          <Accordion.Root type="single" collapsible className={styles.filtersAccordion}>
            <Accordion.Item value="filters" className={styles.filtersAccordionItem}>
              <Accordion.Header className={styles.filtersAccordionHeader}>
                <Accordion.Trigger className={styles.filtersTrigger}>
                  Filters
                  <span className={styles.filtersTriggerIcon} aria-hidden="true">
                    ▾
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className={styles.filtersContent}>
                <div className={styles.dateRangeFields}>
                  <div className={styles.datePickerGroup}>
                    <label htmlFor="dateFrom" className={styles.label}>
                      From
                    </label>
                    <DatePicker id="dateFrom" value={dateFrom} onChange={updateDateFrom} />
                  </div>
                  <div className={styles.datePickerGroup}>
                    <label htmlFor="dateTo" className={styles.label}>
                      To
                    </label>
                    <DatePicker id="dateTo" value={dateTo} onChange={updateDateTo} />
                  </div>
                </div>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion.Root>

          <div className={styles.compactWeekBar}>
            <button
              type="button"
              className={styles.weekIconButton}
              onClick={() => shiftDateRangeByWeek(-1)}
              aria-label="Previous week"
            >
              ‹
            </button>
            <p className={styles.weekRange}>{formatDateRange(dateFrom, dateTo)}</p>
            <button
              type="button"
              className={styles.weekIconButton}
              onClick={() => shiftDateRangeByWeek(1)}
              aria-label="Next week"
            >
              ›
            </button>
          </div>
        </div>

        {errorMessage && <div className={styles.errorBox}>{errorMessage}</div>}

        {!errorMessage && (
          <div className={styles.statsGrid}>
            <section className={styles.summaryCard}>
              <p className={styles.cardLabel}>Workout Days</p>
              <p className={styles.primaryStat}>{loading ? '...' : workoutDaysCount}</p>
              <p className={styles.cardHint}>Number of days you trained during the selected date range.</p>
            </section>

            <section className={styles.breakdownCard}>
              <div className={styles.breakdownHeader}>
                <h2 className={styles.breakdownTitle}>Exercise Category Frequency</h2>
                <p className={styles.breakdownDescription}>
                  Counted as distinct training days per exercise category within the selected date range.
                </p>
              </div>

              {loading ? (
                <p className={styles.emptyText}>Loading statistics...</p>
              ) : exerciseCategoryStats.length === 0 ? (
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
