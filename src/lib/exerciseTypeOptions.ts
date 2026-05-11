import type { ExerciseType } from './exerciseTypes'

export type ExerciseTypeOption = {
  value: ExerciseType
  label: string
}

export const DEFAULT_EXERCISE_TYPE: ExerciseType = 'strength'

export const EXERCISE_TYPE_OPTIONS: ExerciseTypeOption[] = [
  { value: 'strength', label: 'Strength' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'duration', label: 'Duration only' },
]
