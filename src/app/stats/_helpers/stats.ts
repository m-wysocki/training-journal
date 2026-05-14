import type { WeeklyEntry } from '@/lib/supabase/trainingData'
import type { ExerciseCategoryStat } from './types'

const getEarliestTrainingDate = (trainingDates: string[]) => trainingDates[trainingDates.length - 1] || ''

export const getExerciseCategoryStats = (entries: WeeklyEntry[]): ExerciseCategoryStat[] => {
  const groups = new Map<string, Set<string>>()

  entries.forEach((entry) => {
    const exerciseCategoryName = entry.exercise?.exercise_category?.name || 'Unknown exercise category'
    const current = groups.get(exerciseCategoryName) || new Set<string>()
    current.add(entry.performed_at)
    groups.set(exerciseCategoryName, current)
  })

  return Array.from(groups.entries())
    .map(([name, trainingDates]) => ({
      name,
      trainingDays: trainingDates.size,
      trainingDates: Array.from(trainingDates).sort((a, b) => b.localeCompare(a)),
    }))
    .sort(
      (a, b) =>
        b.trainingDays - a.trainingDays ||
        getEarliestTrainingDate(a.trainingDates).localeCompare(getEarliestTrainingDate(b.trainingDates)) ||
        a.name.localeCompare(b.name),
    )
}
