import { Suspense } from 'react'
import { ClipboardList } from 'lucide-react'
import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import { requireUser } from '@/lib/supabase/auth'
import { getCurrentWeekRange } from '@/lib/trainingDateRange'
import {
  getEntryComparisons,
  type CompletedExerciseRow,
  type EntryComparisons,
  type ExerciseCategory,
} from '@/lib/completedExercises'
import CompletedExercisesClient from './CompletedExercisesClient'
import styles from './page.module.scss'

type CompletedExercisesPageProps = {
  searchParams?: Promise<{
    dateFrom?: string
    dateTo?: string
  }>
}

type ResolvedCompletedExercisesPageProps = {
  searchParams?: {
    dateFrom?: string
    dateTo?: string
  }
}

const COMPLETED_EXERCISES_SELECT = `
  id,
  exercise_id,
  performed_at,
  created_at,
  sets,
  reps_per_set,
  duration_per_set_seconds,
  load_kg,
  distance_km,
  pace_min_per_km,
  note,
  exercise:exercises (
    id,
    name,
    exercise_category_id,
    exercise_type,
    exercise_category:exercise_categories (
      name
    )
  )
`

const COMPARABLE_COMPLETED_EXERCISES_SELECT = `
  id,
  exercise_id,
  performed_at,
  created_at,
  sets,
  reps_per_set,
  duration_per_set_seconds,
  load_kg,
  distance_km,
  pace_min_per_km
`

async function CompletedExercisesData({ searchParams }: ResolvedCompletedExercisesPageProps) {
  const params = searchParams
  const currentWeekRange = getCurrentWeekRange()
  const dateFrom = params?.dateFrom || currentWeekRange.dateFrom
  const dateTo = params?.dateTo || currentWeekRange.dateTo
  const { supabase, user } = await requireUser()

  const [entriesResult, categoriesResult] = await Promise.all([
    supabase
      .from('completed_exercises')
      .select(COMPLETED_EXERCISES_SELECT)
      .eq('user_id', user.id)
      .gte('performed_at', dateFrom)
      .lte('performed_at', dateTo)
      .order('performed_at', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('exercise_categories')
      .select('id, name')
      .eq('user_id', user.id)
      .order('created_at'),
  ])

  const entries = entriesResult.error ? [] : ((entriesResult.data as unknown as CompletedExerciseRow[]) || [])
  const exerciseCategories = categoriesResult.error ? [] : ((categoriesResult.data as ExerciseCategory[]) || [])
  let entryComparisons: EntryComparisons = {}

  if (entries.length > 0) {
    const exerciseIds = Array.from(new Set(entries.map((entry) => entry.exercise_id)))
    const { data } = await supabase
      .from('completed_exercises')
      .select(COMPARABLE_COMPLETED_EXERCISES_SELECT)
      .eq('user_id', user.id)
      .in('exercise_id', exerciseIds)
      .lte('performed_at', dateTo)
      .order('performed_at', { ascending: false })
      .order('created_at', { ascending: false })

    entryComparisons = getEntryComparisons(
      ((data as unknown as CompletedExerciseRow[]) || []),
      new Set(entries.map((entry) => entry.id)),
    )
  }

  return (
    <CompletedExercisesClient
      key={`${dateFrom}-${dateTo}`}
      initialDateFrom={dateFrom}
      initialDateTo={dateTo}
      initialEntries={entries}
      initialExerciseCategories={exerciseCategories}
      initialEntryComparisons={entryComparisons}
      initialErrorMessage={entriesResult.error || categoriesResult.error ? 'Could not load data.' : ''}
    />
  )
}

function CompletedExercisesFallback({ searchParams }: ResolvedCompletedExercisesPageProps) {
  const currentWeekRange = getCurrentWeekRange()
  const dateFrom = searchParams?.dateFrom || currentWeekRange.dateFrom
  const dateTo = searchParams?.dateTo || currentWeekRange.dateTo

  return (
    <div className={styles.wrapper}>
      <PageContainer className={styles.container}>
        <div className={styles.header}>
          <BackLink href="/" label="← Back to Home" />
          <div className={styles.titleRow}>
            <div className={styles.titleIcon} aria-hidden="true">
              <ClipboardList size={22} strokeWidth={1.9} />
            </div>
            <h1 className={styles.title}>Completed Exercises</h1>
          </div>
          <p className={styles.description}>Browse your logged exercises grouped by workout date.</p>
        </div>

        <div className={styles.filtersBar}>
          <div className={styles.completedFiltersSkeleton} aria-label="Loading exercise filters">
            <span />
          </div>
          <p className={styles.weekRange}>
            {dateFrom} - {dateTo}
          </p>
        </div>

        <div className={styles.daysList} aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className={styles.dayCard}>
              <div className={styles.completedDayTitleSkeleton} />
              <div className={styles.completedEntriesSkeleton} aria-label="Loading completed exercises">
                <span />
                <span />
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </div>
  )
}

export default async function CompletedExercisesPage({ searchParams }: CompletedExercisesPageProps) {
  const resolvedSearchParams = await searchParams

  return (
    <Suspense fallback={<CompletedExercisesFallback searchParams={resolvedSearchParams} />}>
      <CompletedExercisesData searchParams={resolvedSearchParams} />
    </Suspense>
  )
}
