import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/supabase/auth'
import type { CompletedExerciseFormValues } from '@/components/CompletedExerciseForm'
import EditCompletedExerciseClient from './EditCompletedExerciseClient'

type CompletedExerciseRecord = {
  id: string
  exercise_id: string
  performed_at: string
  sets: number | null
  reps_per_set: number[] | null
  duration_per_set_seconds: number[] | null
  load_kg: number | null
  distance_km: number | null
  pace_min_per_km: number | null
  note: string | null
  exercise: {
    exercise_category_id: string
  } | null
}

type EditCompletedExercisePageProps = {
  params: Promise<{
    id: string
  }>
}

const mapEntryToInitialValues = (entry: CompletedExerciseRecord): CompletedExerciseFormValues => ({
  exerciseCategoryId: entry.exercise?.exercise_category_id ?? '',
  exerciseId: entry.exercise_id,
  sets: entry.sets,
  repsPerSet: entry.reps_per_set,
  durationPerSetSeconds: entry.duration_per_set_seconds,
  loadKg: entry.load_kg === null ? null : Number(entry.load_kg),
  distanceKm: entry.distance_km === null ? null : Number(entry.distance_km),
  paceMinPerKm: entry.pace_min_per_km === null ? null : Number(entry.pace_min_per_km),
  note: entry.note ?? '',
  performedAt: entry.performed_at,
})

export default async function EditCompletedExercisePage({ params }: EditCompletedExercisePageProps) {
  const { id } = await params
  const { supabase, user } = await requireUser()
  const [entryResult, categoriesResult, exercisesResult] = await Promise.all([
    supabase
      .from('completed_exercises')
      .select(
        `
          id,
          exercise_id,
          performed_at,
          sets,
          reps_per_set,
          duration_per_set_seconds,
          load_kg,
          distance_km,
          pace_min_per_km,
          note,
          exercise:exercises (
            exercise_category_id
          )
        `,
      )
      .eq('user_id', user.id)
      .eq('id', id)
      .single(),
    supabase.from('exercise_categories').select('id, name').eq('user_id', user.id).order('created_at'),
    supabase
      .from('exercises')
      .select('id, name, exercise_category_id, exercise_type')
      .eq('user_id', user.id)
      .order('created_at'),
  ])

  if (entryResult.error || !entryResult.data) {
    notFound()
  }

  return (
    <EditCompletedExerciseClient
      entryId={id}
      initialValues={mapEntryToInitialValues(entryResult.data as unknown as CompletedExerciseRecord)}
      exerciseCategories={categoriesResult.data || []}
      exercises={exercisesResult.data || []}
    />
  )
}
