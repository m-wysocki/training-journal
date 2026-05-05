import { unstable_cache } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cacheTags } from '@/lib/cacheTags'
import {
  getEntryComparisons,
  type CompletedExerciseRow,
  type EntryComparisons,
} from '@/lib/completedExercises'
import type { ExerciseType } from '@/components/CompletedExerciseForm'

export type CachedExerciseCategory = {
  id: string
  name: string
}

export type CachedExercise = {
  id: string
  name: string
  exercise_category_id: string
  exercise_type: ExerciseType
}

export type CachedExerciseCategoryDetail = CachedExerciseCategory & {
  exercises: {
    id: string
    name: string
    exercise_type: ExerciseType
  }[]
}

export type CachedWeeklyEntry = {
  performed_at: string
  exercise: {
    exercise_category: {
      name: string
    } | null
  } | null
}

export type CachedCompletedExercisesPayload = {
  entries: CompletedExerciseRow[]
  exerciseCategories: CachedExerciseCategory[]
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

const createAuthenticatedCachedClient = (accessToken: string) =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  )

export const getCachedExerciseCategories = (userId: string, accessToken: string) =>
  unstable_cache(
    async () => {
      const supabase = createAuthenticatedCachedClient(accessToken)
      const { data, error } = await supabase
        .from('exercise_categories')
        .select('id, name')
        .eq('user_id', userId)
        .order('created_at')

      return {
        data: (data as CachedExerciseCategory[] | null) || [],
        error,
      }
    },
    ['exercise-categories', userId],
    {
      tags: [cacheTags.exerciseCategories(userId)],
    },
  )()

export const getCachedExercises = (userId: string, accessToken: string) =>
  unstable_cache(
    async () => {
      const supabase = createAuthenticatedCachedClient(accessToken)
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, exercise_category_id, exercise_type')
        .eq('user_id', userId)
        .order('created_at')

      return {
        data: (data as CachedExercise[] | null) || [],
        error,
      }
    },
    ['exercises', userId],
    {
      tags: [cacheTags.exercises(userId)],
    },
  )()

export async function getCachedExerciseSetup(userId: string, accessToken: string) {
  const [categoriesResult, exercisesResult] = await Promise.all([
    getCachedExerciseCategories(userId, accessToken),
    getCachedExercises(userId, accessToken),
  ])

  return {
    exerciseCategories: categoriesResult.data,
    exercises: exercisesResult.data,
    error: categoriesResult.error || exercisesResult.error,
  }
}

export const getCachedExerciseCategoryDetail = (
  userId: string,
  accessToken: string,
  exerciseCategoryId: string,
) =>
  unstable_cache(
    async () => {
      const supabase = createAuthenticatedCachedClient(accessToken)
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
        data: data as CachedExerciseCategoryDetail | null,
        error,
      }
    },
    ['exercise-category', userId, exerciseCategoryId],
    {
      tags: [
        cacheTags.exerciseCategories(userId),
        cacheTags.exercises(userId),
        cacheTags.exerciseCategory(userId, exerciseCategoryId),
      ],
    },
  )()

export const getCachedCompletedExercisesPayload = (
  userId: string,
  accessToken: string,
  dateFrom: string,
  dateTo: string,
) =>
  unstable_cache(
    async (): Promise<CachedCompletedExercisesPayload> => {
      const supabase = createAuthenticatedCachedClient(accessToken)
      const [entriesResult, categoriesResult] = await Promise.all([
        supabase
          .from('completed_exercises')
          .select(COMPLETED_EXERCISES_SELECT)
          .eq('user_id', userId)
          .gte('performed_at', dateFrom)
          .lte('performed_at', dateTo)
          .order('performed_at', { ascending: false })
          .order('created_at', { ascending: false }),
        getCachedExerciseCategories(userId, accessToken),
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
    },
    ['completed-exercises', userId, dateFrom, dateTo],
    {
      tags: [
        cacheTags.completedExercises(userId),
        cacheTags.completedExercisesRange(userId, dateFrom, dateTo),
        cacheTags.exerciseCategories(userId),
        cacheTags.exercises(userId),
      ],
    },
  )()

export const getCachedStatsEntries = (
  userId: string,
  accessToken: string,
  dateFrom: string,
  dateTo: string,
) =>
  unstable_cache(
    async () => {
      const supabase = createAuthenticatedCachedClient(accessToken)
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
        data: error ? [] : ((data as unknown as CachedWeeklyEntry[]) || []),
        error,
      }
    },
    ['stats', userId, dateFrom, dateTo],
    {
      tags: [
        cacheTags.stats(userId),
        cacheTags.statsRange(userId, dateFrom, dateTo),
        cacheTags.exerciseCategories(userId),
        cacheTags.exercises(userId),
      ],
    },
  )()
