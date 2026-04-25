'use client'

import { BarChart3 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import BackLink from '@/components/BackLink'
import { DatePicker } from '@/components/DatePicker'
import PageContainer from '@/components/PageContainer'
import { formatLocalDateOnly, parseDateOnly } from '@/lib/dateOnly'
import { supabase } from '@/lib/supabase'
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
}

const getStartOfWeek = (date: Date) => {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  const day = normalized.getDay()
  const diff = day === 0 ? -6 : 1 - day
  normalized.setDate(normalized.getDate() + diff)
  return normalized
}

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const formatDateRange = (dateFrom: string, dateTo: string) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return `${formatter.format(parseDateOnly(dateFrom))} - ${formatter.format(parseDateOnly(dateTo))}`
}

export default function StatsPage() {
  const [dateFrom, setDateFrom] = useState(() => formatLocalDateOnly(getStartOfWeek(new Date())))
  const [dateTo, setDateTo] = useState(() => formatLocalDateOnly(new Date()))
  const [entries, setEntries] = useState<WeeklyEntry[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const updateDateFrom = (value: string) => {
    setLoading(true)
    setDateFrom(value)
  }

  const updateDateTo = (value: string) => {
    setLoading(true)
    setDateTo(value)
  }

  const shiftDateRangeByWeek = (direction: -1 | 1) => {
    setLoading(true)
    const nextWeekStart = addDays(getStartOfWeek(parseDateOnly(dateFrom)), direction * 7)
    setDateFrom(formatLocalDateOnly(nextWeekStart))
    setDateTo(formatLocalDateOnly(addDays(nextWeekStart, 6)))
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
      .map(([name, trainingDays]) => ({
        name,
        trainingDays: trainingDays.size,
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
                <ul className={styles.breakdownList}>
                  {exerciseCategoryStats.map((stat) => (
                    <li key={stat.name} className={styles.breakdownItem}>
                      <span className={styles.exerciseCategoryName}>{stat.name}</span>
                      <span className={styles.exerciseCategoryValue}>
                        {stat.trainingDays} {stat.trainingDays === 1 ? 'day' : 'days'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </PageContainer>
    </div>
  )
}
