import { formatDuration } from '@/lib/trainingFormatters'

export type CompletedExerciseRow = {
  id: string
  exercise_id: string
  performed_at: string
  created_at: string
  sets: number | null
  reps_per_set: number[] | null
  duration_per_set_seconds: number[] | null
  load_kg: number | null
  distance_km: number | null
  pace_min_per_km: number | null
  note: string | null
  exercise: {
    id: string
    name: string
    exercise_category_id: string
    exercise_type: 'strength' | 'cardio' | 'duration'
    exercise_category: {
      name: string
    } | null
  } | null
}

export type ComparableCompletedExerciseRow = Pick<
  CompletedExerciseRow,
  | 'id'
  | 'exercise_id'
  | 'performed_at'
  | 'created_at'
  | 'sets'
  | 'reps_per_set'
  | 'duration_per_set_seconds'
  | 'load_kg'
  | 'distance_km'
  | 'pace_min_per_km'
>

export type ExerciseCategory = {
  id: string
  name: string
}

export type RecentCompletedExercise = {
  id: string
  performed_at: string
  sets: number | null
  reps_per_set: number[] | null
  duration_per_set_seconds: number[] | null
  load_kg: number | null
  distance_km: number | null
  pace_min_per_km: number | null
  note: string | null
}

export type EntryComparisonMetric = {
  key: 'reps' | 'load' | 'time' | 'distance' | 'pace'
  label: string
  direction: 'up' | 'down'
  tone: 'positive' | 'negative'
  value: string
}

export type EntryComparisons = Record<string, EntryComparisonMetric[]>

const sumValues = (values: number[] | null) => values?.reduce((total, value) => total + value, 0) ?? null

const formatSignedNumber = (value: number) => {
  const absoluteValue = Math.abs(value)
  const formattedValue = Number.isInteger(absoluteValue) ? String(absoluteValue) : absoluteValue.toFixed(1)

  return `${value > 0 ? '+' : '-'}${formattedValue}`
}

const formatSignedDuration = (seconds: number) => `${seconds > 0 ? '+' : '-'}${formatDuration(Math.abs(seconds))}`

const formatSignedPace = (paceMinPerKm: number) => {
  const sign = paceMinPerKm > 0 ? '+' : '-'
  const totalSeconds = Math.round(Math.abs(paceMinPerKm) * 60)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${sign}${minutes}:${String(seconds).padStart(2, '0')} min/km`
}

const createComparisonMetric = (
  key: EntryComparisonMetric['key'],
  label: string,
  delta: number,
  value: string,
  isIncreasePositive = true,
): EntryComparisonMetric | null => {
  if (delta === 0) return null

  const isPositive = isIncreasePositive ? delta > 0 : delta < 0

  return {
    key,
    label,
    direction: delta > 0 ? 'up' : 'down',
    tone: isPositive ? 'positive' : 'negative',
    value,
  }
}

const getEntryComparisonMetrics = (
  currentEntry: ComparableCompletedExerciseRow,
  previousEntry: ComparableCompletedExerciseRow | undefined,
) => {
  if (!previousEntry) return []

  const metrics: EntryComparisonMetric[] = []
  const currentReps = sumValues(currentEntry.reps_per_set)
  const previousReps = sumValues(previousEntry.reps_per_set)
  const currentDuration = sumValues(currentEntry.duration_per_set_seconds)
  const previousDuration = sumValues(previousEntry.duration_per_set_seconds)

  if (currentReps !== null && previousReps !== null) {
    const delta = currentReps - previousReps
    const metric = createComparisonMetric('reps', 'Reps', delta, formatSignedNumber(delta))

    if (metric) metrics.push(metric)
  }

  if (currentEntry.load_kg !== null && previousEntry.load_kg !== null) {
    const delta = Number(currentEntry.load_kg) - Number(previousEntry.load_kg)
    const metric = createComparisonMetric('load', 'Load', delta, `${formatSignedNumber(delta)} kg`)

    if (metric) metrics.push(metric)
  }

  if (currentDuration !== null && previousDuration !== null) {
    const delta = currentDuration - previousDuration
    const metric = createComparisonMetric('time', 'Time', delta, formatSignedDuration(delta))

    if (metric) metrics.push(metric)
  }

  if (currentEntry.distance_km !== null && previousEntry.distance_km !== null) {
    const delta = Number(currentEntry.distance_km) - Number(previousEntry.distance_km)
    const metric = createComparisonMetric('distance', 'Distance', delta, `${formatSignedNumber(delta)} km`)

    if (metric) metrics.push(metric)
  }

  if (currentEntry.pace_min_per_km !== null && previousEntry.pace_min_per_km !== null) {
    const delta = Number(currentEntry.pace_min_per_km) - Number(previousEntry.pace_min_per_km)
    const metric = createComparisonMetric('pace', 'Pace', delta, formatSignedPace(delta), false)

    if (metric) metrics.push(metric)
  }

  return metrics
}

const compareEntriesByRecency = (
  firstEntry: ComparableCompletedExerciseRow,
  secondEntry: ComparableCompletedExerciseRow,
) => {
  const performedAtComparison = secondEntry.performed_at.localeCompare(firstEntry.performed_at)

  if (performedAtComparison !== 0) return performedAtComparison

  return secondEntry.created_at.localeCompare(firstEntry.created_at)
}

export const getEntryComparisons = (
  historyEntries: ComparableCompletedExerciseRow[],
  visibleEntryIds: Set<string>,
) => {
  const entriesByExercise = new Map<string, ComparableCompletedExerciseRow[]>()
  const comparisons: EntryComparisons = {}

  historyEntries.forEach((entry) => {
    const currentEntries = entriesByExercise.get(entry.exercise_id) ?? []
    entriesByExercise.set(entry.exercise_id, [...currentEntries, entry])
  })

  entriesByExercise.forEach((exerciseEntries) => {
    const sortedEntries = [...exerciseEntries].sort(compareEntriesByRecency)

    sortedEntries.forEach((entry, index) => {
      if (!visibleEntryIds.has(entry.id)) return

      const metrics = getEntryComparisonMetrics(entry, sortedEntries[index + 1])

      if (metrics.length > 0) {
        comparisons[entry.id] = metrics
      }
    })
  })

  return comparisons
}
