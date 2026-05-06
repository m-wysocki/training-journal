import {
  getEntryComparisons,
  type CompletedExerciseRow,
  type EntryComparisons,
} from '@/lib/completedExercises'
import type { ExerciseType } from '@/lib/exerciseTypes'
import type { createClient } from '@/lib/supabase/server'

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

export type TrainingExerciseCategory = {
  id: string
  name: string
}

export type TrainingExercise = {
  id: string
  name: string
  exercise_category_id: string
  exercise_type: ExerciseType
}

export type TrainingExerciseCategoryDetail = TrainingExerciseCategory & {
  exercises: {
    id: string
    name: string
    exercise_type: ExerciseType
  }[]
}

export type WeeklyEntry = {
  performed_at: string
  exercise: {
    exercise_category: {
      name: string
    } | null
  } | null
}

export type CompletedExercisesPayload = {
  entries: CompletedExerciseRow[]
  exerciseCategories: TrainingExerciseCategory[]
  entryComparisons: EntryComparisons
  errorMessage: string
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

export async function getExerciseCategories(supabase: ServerSupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('exercise_categories')
    .select('id, name')
    .eq('user_id', userId)
    .order('created_at')

  return {
    data: (data as TrainingExerciseCategory[] | null) || [],
    error,
  }
}

export async function getExercises(supabase: ServerSupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, exercise_category_id, exercise_type')
    .eq('user_id', userId)
    .order('created_at')

  return {
    data: (data as TrainingExercise[] | null) || [],
    error,
  }
}

export async function getExerciseSetup(supabase: ServerSupabaseClient, userId: string) {
  const [categoriesResult, exercisesResult] = await Promise.all([
    getExerciseCategories(supabase, userId),
    getExercises(supabase, userId),
  ])

  return {
    exerciseCategories: categoriesResult.data,
    exercises: exercisesResult.data,
    error: categoriesResult.error || exercisesResult.error,
  }
}

export async function getExerciseCategoryDetail(
  supabase: ServerSupabaseClient,
  userId: string,
  exerciseCategoryId: string,
) {
  const { data, error } = await supabase
    .from('exercise_categories')
    .select(`
      id,
      name,
      exercises (
        id,
        name,
        exercise_type
      )
    `)
    .eq('user_id', userId)
    .eq('id', exerciseCategoryId)
    .single()

  return {
    data: data as TrainingExerciseCategoryDetail | null,
    error,
  }
}

export async function getCompletedExercisesPayload(
  supabase: ServerSupabaseClient,
  userId: string,
  dateFrom: string,
  dateTo: string,
): Promise<CompletedExercisesPayload> {
  const [entriesResult, categoriesResult] = await Promise.all([
    supabase
      .from('completed_exercises')
      .select(COMPLETED_EXERCISES_SELECT)
      .eq('user_id', userId)
      .gte('performed_at', dateFrom)
      .lte('performed_at', dateTo)
      .order('performed_at', { ascending: false })
      .order('created_at', { ascending: false }),
    getExerciseCategories(supabase, userId),
  ])

  const entries = entriesResult.error ? [] : ((entriesResult.data as unknown as CompletedExerciseRow[]) || [])
  let entryComparisons: EntryComparisons = {}

  if (entries.length > 0) {
    const exerciseIds = Array.from(new Set(entries.map((entry) => entry.exercise_id)))
    const { data } = await supabase
      .from('completed_exercises')
      .select(COMPARABLE_COMPLETED_EXERCISES_SELECT)
      .eq('user_id', userId)
      .in('exercise_id', exerciseIds)
      .lte('performed_at', dateTo)
      .order('performed_at', { ascending: false })
      .order('created_at', { ascending: false })

    entryComparisons = getEntryComparisons(
      ((data as unknown as CompletedExerciseRow[]) || []),
      new Set(entries.map((entry) => entry.id)),
    )
  }

  return {
    entries,
    exerciseCategories: categoriesResult.data,
    entryComparisons,
    errorMessage: entriesResult.error || categoriesResult.error ? 'Could not load data.' : '',
  }
}

export async function getStatsEntries(
  supabase: ServerSupabaseClient,
  userId: string,
  dateFrom: string,
  dateTo: string,
) {
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
    .eq('user_id', userId)
    .gte('performed_at', dateFrom)
    .lte('performed_at', dateTo)

  return {
    data: error ? [] : ((data as unknown as WeeklyEntry[]) || []),
    error,
  }
}
