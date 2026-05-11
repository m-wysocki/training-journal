import type { WeeklyEntry } from '@/lib/supabase/trainingData'
import { loadStatsEntries } from '../actions'
import type { ExerciseCategoryStat } from './types'

export const getStatsRangeKey = (dateFrom: string, dateTo: string) => `${dateFrom}:${dateTo}`

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

export const loadStatsPayload = async (dateFrom: string, dateTo: string) => {
  const { data, error } = await loadStatsEntries(dateFrom, dateTo)

  if (error || !data) {
    throw new Error(error || 'Could not load statistics for the selected date range.')
  }

  return data
}
