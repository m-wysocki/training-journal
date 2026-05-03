import { createClient } from '@/lib/supabase/server'
import { getCurrentWeekRange } from '@/lib/trainingDateRange'
import {
  getEntryComparisons,
  type CompletedExerciseRow,
  type EntryComparisons,
  type ExerciseCategory,
} from '@/lib/completedExercises'
import CompletedExercisesClient from './CompletedExercisesClient'

type CompletedExercisesPageProps = {
  searchParams?: Promise<{
    dateFrom?: string
    dateTo?: string
  }>
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

export default async function CompletedExercisesPage({ searchParams }: CompletedExercisesPageProps) {
  const params = await searchParams
  const currentWeekRange = getCurrentWeekRange()
  const dateFrom = params?.dateFrom || currentWeekRange.dateFrom
  const dateTo = params?.dateTo || currentWeekRange.dateTo
  const supabase = await createClient()

  const [entriesResult, categoriesResult] = await Promise.all([
    supabase
      .from('completed_exercises')
      .select(COMPLETED_EXERCISES_SELECT)
      .gte('performed_at', dateFrom)
      .lte('performed_at', dateTo)
      .order('performed_at', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('exercise_categories')
      .select('id, name')
      .order('created_at'),
  ])

  const entries = entriesResult.error ? [] : ((entriesResult.data as unknown as CompletedExerciseRow[]) || [])
  const exerciseCategories = categoriesResult.error ? [] : ((categoriesResult.data as ExerciseCategory[]) || [])
  let entryComparisons: EntryComparisons = {}

  if (entries.length > 0) {
    const exerciseIds = Array.from(new Set(entries.map((entry) => entry.exercise_id)))
    const { data } = await supabase
      .from('completed_exercises')
      .select(COMPLETED_EXERCISES_SELECT)
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
      initialDateFrom={dateFrom}
      initialDateTo={dateTo}
      initialEntries={entries}
      initialExerciseCategories={exerciseCategories}
      initialEntryComparisons={entryComparisons}
      initialErrorMessage={entriesResult.error || categoriesResult.error ? 'Could not load data.' : ''}
      initialExerciseCategoriesLoaded={!categoriesResult.error}
    />
  )
}
