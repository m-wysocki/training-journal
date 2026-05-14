import type { RecentCompletedExercise } from '@/lib/completedExercises'
import type { ExerciseType } from '@/lib/exerciseTypes'
import { formatDuration, formatPace } from '@/lib/trainingFormatters'

export const formatRecentExerciseSummary = (
  exerciseType: ExerciseType,
  exercise: RecentCompletedExercise,
) => {
  if (exerciseType === 'cardio') {
    const details = []

    if (exercise.distance_km !== null) {
      details.push(`Distance: ${Number(exercise.distance_km).toFixed(1)} km`)
    }

    if (exercise.pace_min_per_km !== null) {
      details.push(`Pace: ${formatPace(Number(exercise.pace_min_per_km))}`)
    }

    return details.join(' | ')
  }

  if (exerciseType === 'duration') {
    return `Time: ${exercise.duration_per_set_seconds?.[0] ? formatDuration(exercise.duration_per_set_seconds[0]) : '-'}`
  }

  const details = [`Sets: ${exercise.sets ?? '-'}`]

  if (exercise.duration_per_set_seconds?.length) {
    details.push(`Time: ${exercise.duration_per_set_seconds.map(formatDuration).join(' / ')}`)
  } else {
    details.push(`Reps: ${exercise.reps_per_set?.join(' / ') ?? '-'}`)
  }

  if (exercise.load_kg !== null) {
    details.push(`Load: ${Number(exercise.load_kg)} kg`)
  }

  return details.join(' | ')
}
