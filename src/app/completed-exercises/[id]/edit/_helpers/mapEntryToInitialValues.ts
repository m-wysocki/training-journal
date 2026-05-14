import type { CompletedExerciseFormValues } from '@/app/completed-exercises/_components/CompletedExerciseForm'

export type CompletedExerciseRecord = {
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

const isStringArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'number')

export const parseCompletedExerciseRecord = (value: unknown): CompletedExerciseRecord | null => {
  if (!value || typeof value !== 'object') return null

  const row = value as Record<string, unknown>

  const hasRequiredStrings =
    typeof row.id === 'string' &&
    typeof row.exercise_id === 'string' &&
    typeof row.performed_at === 'string'

  if (!hasRequiredStrings) return null

  const hasValidScalars =
    (typeof row.sets === 'number' || row.sets === null) &&
    (typeof row.load_kg === 'number' || row.load_kg === null) &&
    (typeof row.distance_km === 'number' || row.distance_km === null) &&
    (typeof row.pace_min_per_km === 'number' || row.pace_min_per_km === null) &&
    (typeof row.note === 'string' || row.note === null)

  if (!hasValidScalars) return null

  const hasValidArrays =
    (row.reps_per_set === null || isStringArray(row.reps_per_set)) &&
    (row.duration_per_set_seconds === null || isStringArray(row.duration_per_set_seconds))

  if (!hasValidArrays) return null

  const exercise = row.exercise
  const hasValidExercise =
    exercise === null ||
    (typeof exercise === 'object' &&
      exercise !== null &&
      typeof (exercise as Record<string, unknown>).exercise_category_id === 'string')

  if (!hasValidExercise) return null

  return row as CompletedExerciseRecord
}

export const mapEntryToInitialValues = (entry: CompletedExerciseRecord): CompletedExerciseFormValues => ({
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
