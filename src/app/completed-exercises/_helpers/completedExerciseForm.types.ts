import type { LucideIcon } from 'lucide-react'
import type { ExerciseType } from '@/lib/exerciseTypes'

export type ExerciseCategory = {
  id: string
  name: string
}

export type Exercise = {
  id: string
  name: string
  exercise_category_id: string
  exercise_type: ExerciseType
}

export type CompletedExerciseFormValues = {
  exerciseCategoryId: string
  exerciseId: string
  sets: number | null
  repsPerSet: number[] | null
  durationPerSetSeconds: number[] | null
  loadKg: number | null
  distanceKm: number | null
  paceMinPerKm: number | null
  note: string
  performedAt: string
}

export type CompletedExerciseFormProps = {
  mode: 'create' | 'edit'
  title: string
  description: string
  headerIcon?: LucideIcon
  submitLabel: string
  submittingLabel: string
  initialValues: CompletedExerciseFormValues
  initialExerciseCategories: ExerciseCategory[]
  initialExercises: Exercise[]
  isExerciseSetupLoading?: boolean
  onSubmit: (values: CompletedExerciseFormValues) => Promise<{ error?: string | null }>
  onSuccess?: () => void
}
