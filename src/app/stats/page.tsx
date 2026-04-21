'use client'

import { useEffect, useMemo, useState } from 'react'
import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import { formatLocalDateOnly } from '@/lib/dateOnly'
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

const formatWeekRange = (start: Date, end: Date) =>
  new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
  }).format(start) +
  ' - ' +
  new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(end)

const getIsoWeekValue = (date: Date) => {
  const target = new Date(date.valueOf())
  const dayNr = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const firstDayNr = (firstThursday.getDay() + 6) % 7
  firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3)
  const weekNumber = 1 + Math.round((target.getTime() - firstThursday.getTime()) / 604800000)
  return `${target.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`
}

const parseIsoWeek = (value: string) => {
  const match = /^(\d{4})-W(\d{2})$/.exec(value)
  if (!match) {
    return getStartOfWeek(new Date())
  }

  const year = Number(match[1])
  const week = Number(match[2])
  const januaryFourth = new Date(year, 0, 4)
  const start = getStartOfWeek(januaryFourth)
  return addDays(start, (week - 1) * 7)
}

export default function StatsPage() {
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => getStartOfWeek(new Date()))
  const [entries, setEntries] = useState<WeeklyEntry[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const weekStart = useMemo(() => selectedWeekStart, [selectedWeekStart])
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart])
  const weekValue = useMemo(() => getIsoWeekValue(weekStart), [weekStart])

  const updateSelectedWeekStart = (nextWeekStart: Date) => {
    setLoading(true)
    setSelectedWeekStart(nextWeekStart)
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
      .gte('performed_at', formatLocalDateOnly(weekStart))
      .lte('performed_at', formatLocalDateOnly(weekEnd))
      .then(({ data, error }) => {
        if (!isActive) return

        if (error) {
          setErrorMessage('Could not load statistics for the selected week.')
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
  }, [weekStart, weekEnd])

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
          <h1 className={styles.title}>Statistics</h1>
          <p className={styles.description}>
            Review your training week from Monday to Sunday and see how often you trained each exercise category.
          </p>
        </div>

        <section className={styles.controlsCard}>
          <div className={styles.controlsTop}>
            <button
              type="button"
              className={styles.weekButton}
              onClick={() => updateSelectedWeekStart(addDays(weekStart, -7))}
            >
              Previous Week
            </button>
            <button
              type="button"
              className={styles.weekButton}
              onClick={() => updateSelectedWeekStart(addDays(weekStart, 7))}
            >
              Next Week
            </button>
          </div>

          <div className={styles.weekPickerGroup}>
            <label htmlFor="weekPicker" className={styles.label}>
              Week
            </label>
            <input
              id="weekPicker"
              type="week"
              className={styles.input}
              value={weekValue}
              onChange={(e) => updateSelectedWeekStart(parseIsoWeek(e.target.value))}
            />
          </div>

          <p className={styles.weekRange}>{formatWeekRange(weekStart, weekEnd)}</p>
        </section>

        {errorMessage && <div className={styles.errorBox}>{errorMessage}</div>}

        {!errorMessage && (
          <div className={styles.statsGrid}>
            <section className={styles.summaryCard}>
              <p className={styles.cardLabel}>Workout Days</p>
              <p className={styles.primaryStat}>{loading ? '...' : workoutDaysCount}</p>
              <p className={styles.cardHint}>Number of days you trained during the selected week.</p>
            </section>

            <section className={styles.breakdownCard}>
              <div className={styles.breakdownHeader}>
                <h2 className={styles.breakdownTitle}>Exercise Category Frequency</h2>
                <p className={styles.breakdownDescription}>
                  Counted as distinct training days per exercise category within the week.
                </p>
              </div>

              {loading ? (
                <p className={styles.emptyText}>Loading statistics...</p>
              ) : exerciseCategoryStats.length === 0 ? (
                <p className={styles.emptyText}>No workouts logged for this week.</p>
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
