export const exerciseTypes = ['strength', 'cardio', 'duration'] as const

export type ExerciseType = (typeof exerciseTypes)[number]

export const isExerciseType = (value: unknown): value is ExerciseType =>
  typeof value === 'string' && exerciseTypes.includes(value as ExerciseType)
