import { BarChart3, ChevronDown } from 'lucide-react'
import * as Accordion from '@radix-ui/react-accordion'
import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWeekRange } from '@/lib/trainingDateRange'
import { formatWeekdayDate } from '@/lib/trainingFormatters'
import StatsFilters from './StatsFilters'
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

type StatsPageProps = {
  searchParams?: Promise<{
    dateFrom?: string
    dateTo?: string
  }>
}

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

export default async function StatsPage({ searchParams }: StatsPageProps) {
  const params = await searchParams
  const currentWeekRange = getCurrentWeekRange()
  const dateFrom = params?.dateFrom || currentWeekRange.dateFrom
  const dateTo = params?.dateTo || currentWeekRange.dateTo
  const supabase = await createClient()
  const { data, error } = await supabase
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

  const entries = error ? [] : ((data as unknown as WeeklyEntry[]) || [])
  const errorMessage = error ? 'Could not load statistics for the selected date range.' : ''
  const workoutDaysCount = new Set(entries.map((entry) => entry.performed_at)).size
  const exerciseCategoryStats = getExerciseCategoryStats(entries)

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

        {errorMessage && <div className={styles.errorBox}>{errorMessage}</div>}

        {!errorMessage && (
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
