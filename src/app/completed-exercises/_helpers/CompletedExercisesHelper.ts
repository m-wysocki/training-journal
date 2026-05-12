import { loadCompletedExercisesForRange } from '@/app/completed-exercises/actions'
import { formatDuration, formatDurationHoursMinutes, formatPace } from '@/lib/trainingFormatters'
import type { CompletedExerciseRow, ExerciseCategory } from '@/lib/completedExercises'
import { getCompletedExercisesPayload } from '@/lib/supabase/trainingData'

export type DayGroup = {
  date: string
  exerciseCategories: {
    name: string
    entries: CompletedExerciseRow[]
  }[]
}

export type CopyCategoryTarget = {
  sourceDate: string
  categoryName: string
  entries: CompletedExerciseRow[]
}

export const formatEntryDetails = (entry: CompletedExerciseRow) => {
  if (entry.exercise?.exercise_type === 'cardio') {
    const details = []

    if (entry.distance_km !== null) {
      details.push(`Distance: ${Number(entry.distance_km).toFixed(1)} km`)
    }

    if (entry.pace_min_per_km !== null) {
      details.push(`Pace: ${formatPace(Number(entry.pace_min_per_km))}`)
    }

    return details.join(' | ')
  }

  if (entry.exercise?.exercise_type === 'duration') {
    return `Time: ${entry.duration_per_set_seconds?.[0] ? formatDurationHoursMinutes(entry.duration_per_set_seconds[0]) : '-'}`
  }

  const details = [`Sets: ${entry.sets ?? '-'}`]

  if (entry.duration_per_set_seconds?.length) {
    details.push(`Time: ${entry.duration_per_set_seconds.map(formatDuration).join(' / ')}`)
  } else {
    details.push(`Reps: ${entry.reps_per_set?.join(' / ') ?? '-'}`)
  }

  if (entry.load_kg !== null) {
    details.push(`Load: ${Number(entry.load_kg)} kg`)
  }

  return details.join(' | ')
}

export const loadCompletedExercisesPayload = async (dateFrom: string, dateTo: string) => {
  const { data, error } = await loadCompletedExercisesForRange(dateFrom, dateTo)

  if (error || !data) {
    throw new Error(error || 'Could not load data.')
  }

  return data
}

export const getCompletedExercisesSearchParams = (
  dateRange: { dateFrom: string; dateTo: string },
  exerciseCategory: string,
) => {
  const searchParams = new URLSearchParams(dateRange)

  if (exerciseCategory !== 'all') {
    searchParams.set('category', exerciseCategory)
  }

  return searchParams
}

export const getExerciseCategoryOptions = (
  exerciseCategories: ExerciseCategory[],
  selectedExerciseCategory: string,
) => {
  const categoryNames = new Set(exerciseCategories.map((category) => category.name))

  if (selectedExerciseCategory !== 'all') {
    categoryNames.add(selectedExerciseCategory)
  }

  return Array.from(categoryNames).sort((a, b) => a.localeCompare(b))
}

export const getFilteredEntries = (entries: CompletedExerciseRow[], selectedExerciseCategory: string) =>
  selectedExerciseCategory === 'all'
    ? entries
    : entries.filter(
        (entry) => (entry.exercise?.exercise_category?.name || 'Unknown exercise category') === selectedExerciseCategory,
      )

export const getGroupedEntriesByDate = (entries: CompletedExerciseRow[]): DayGroup[] => {
  const map = new Map<string, CompletedExerciseRow[]>()

  entries.forEach((entry) => {
    const current = map.get(entry.performed_at) || []
    map.set(entry.performed_at, [...current, entry])
  })

  return Array.from(map.entries()).map(([date, dayEntries]) => {
    const exerciseCategoryMap = new Map<string, CompletedExerciseRow[]>()

    dayEntries.forEach((entry) => {
      const exerciseCategoryName = entry.exercise?.exercise_category?.name || 'Unknown exercise category'
      const current = exerciseCategoryMap.get(exerciseCategoryName) || []
      exerciseCategoryMap.set(exerciseCategoryName, [...current, entry])
    })

    return {
      date,
      exerciseCategories: Array.from(exerciseCategoryMap.entries()).map(([name, groupedEntries]) => ({
        name,
        entries: groupedEntries,
      })),
    }
  })
}

type CompletedExerciseEntry = Awaited<ReturnType<typeof getCompletedExercisesPayload>>['entries'][number]

export const getCompletedExercisesPayloadKey = (entries: CompletedExerciseEntry[]) =>
  entries
    .map((entry) =>
      [
        entry.id,
        entry.exercise_id,
        entry.performed_at,
        entry.sets,
        entry.reps_per_set?.join(',') ?? '',
        entry.duration_per_set_seconds?.join(',') ?? '',
        entry.load_kg ?? '',
        entry.distance_km ?? '',
        entry.pace_min_per_km ?? '',
        entry.note ?? '',
      ].join(':'),
    )
    .join('|')
