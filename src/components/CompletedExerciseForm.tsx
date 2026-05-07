'use client'

import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { DatePicker } from '@/components/DatePicker'
import { DurationStepper } from '@/components/DurationStepper'
import { NumericStepper } from '@/components/NumericStepper'
import { PaceStepper } from '@/components/PaceStepper'
import PageContainer from '@/components/PageContainer'
import PageHeader from '@/components/PageHeader'
import StatusPanel from '@/components/StatusPanel'
import { loadRecentCompletedExercises } from '@/app/completed-exercises/actions'
import {
  addExercise,
  addExerciseCategory,
} from '@/lib/actions/exerciseSetupActions'
import type { RecentCompletedExercise } from '@/lib/completedExercises'
import type { ExerciseType } from '@/lib/exerciseTypes'
import { getCompletedExercisesHrefForDate } from '@/lib/trainingDateRange'
import { formatDuration, formatLongDate, formatPace } from '@/lib/trainingFormatters'
import styles from './CompletedExerciseForm.module.scss'

type ExerciseCategory = {
  id: string
  name: string
}

type StrengthDetailMode = 'reps' | 'time'

type Exercise = {
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

type CompletedExerciseFormProps = {
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

const MIN_SETS = 1
const MAX_SETS = 5
const MIN_REPS = 1
const MAX_REPS = 30
const MIN_LOAD_KG = 2.5
const MAX_LOAD_KG = 400
const LOAD_STEP_KG = 0.5
export const DEFAULT_LOAD_KG = 11.5
const DEFAULT_REPS = 12
const DEFAULT_DURATION_SECONDS = 40
const MIN_DURATION_SECONDS = 1
const MAX_DURATION_SECONDS = 3600
const DEFAULT_ACTIVITY_DURATION_SECONDS = 600
const MIN_ACTIVITY_DURATION_SECONDS = 300
const MAX_ACTIVITY_DURATION_SECONDS = 86400
const ACTIVITY_DURATION_STEP_SECONDS = 300
const DEFAULT_DISTANCE_KM = 5
const MIN_DISTANCE_KM = 0.1
const MAX_DISTANCE_KM = 999
const DISTANCE_STEP_KM = 0.1
const MIN_PACE_MIN_PER_KM = 1
const MAX_PACE_MIN_PER_KM = 60

const formatRecentExerciseSummary = (
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

export function CompletedExerciseForm({
  mode,
  title,
  description,
  headerIcon: HeaderIcon,
  submitLabel,
  submittingLabel,
  initialValues,
  initialExerciseCategories,
  initialExercises,
  isExerciseSetupLoading = false,
  onSubmit,
  onSuccess,
}: CompletedExerciseFormProps) {
  const router = useRouter()
  const [exerciseCategories, setExerciseCategories] = useState<ExerciseCategory[]>(initialExerciseCategories)
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises)
  const [selectedExerciseCategoryId, setSelectedExerciseCategoryId] = useState(initialValues.exerciseCategoryId)
  const [selectedExerciseId, setSelectedExerciseId] = useState(initialValues.exerciseId)
  const [newExerciseCategoryName, setNewExerciseCategoryName] = useState('')
  const [newExerciseName, setNewExerciseName] = useState('')
  const [newExerciseType, setNewExerciseType] = useState<ExerciseType>('strength')
  const [strengthDetailMode, setStrengthDetailMode] = useState<StrengthDetailMode>(
    initialValues.durationPerSetSeconds ? 'time' : 'reps',
  )
  const [sets, setSets] = useState(initialValues.sets ?? 3)
  const [repsPerSet, setRepsPerSet] = useState<number[]>(initialValues.repsPerSet ?? [12, 12, 12])
  const [durationPerSetSeconds, setDurationPerSetSeconds] = useState<number[]>(
    initialValues.durationPerSetSeconds ?? [40, 40, 40],
  )
  const [loadKg, setLoadKg] = useState<number>(initialValues.loadKg ?? DEFAULT_LOAD_KG)
  const [hasLoad, setHasLoad] = useState(initialValues.loadKg !== null)
  const [distanceKm, setDistanceKm] = useState(initialValues.distanceKm ?? DEFAULT_DISTANCE_KM)
  const [paceMinPerKm, setPaceMinPerKm] = useState<number | null>(initialValues.paceMinPerKm)
  const [activityDurationSeconds, setActivityDurationSeconds] = useState(
    initialValues.durationPerSetSeconds?.length === 1
      ? initialValues.durationPerSetSeconds[0]
      : DEFAULT_ACTIVITY_DURATION_SECONDS,
  )
  const [note, setNote] = useState(initialValues.note)
  const [performedAt, setPerformedAt] = useState(initialValues.performedAt)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isAddingExerciseCategory, setIsAddingExerciseCategory] = useState(false)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [isExerciseCategoryDialogOpen, setIsExerciseCategoryDialogOpen] = useState(false)
  const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false)
  const [recentExercisesState, setRecentExercisesState] = useState<{
    exerciseId: string
    entries: RecentCompletedExercise[]
  }>({
    exerciseId: '',
    entries: [],
  })

  const filteredExercises = useMemo(
    () => exercises.filter((exercise) => exercise.exercise_category_id === selectedExerciseCategoryId),
    [exercises, selectedExerciseCategoryId],
  )

  const selectedExercise = useMemo(
    () => exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null,
    [exercises, selectedExerciseId],
  )

  const selectedExerciseType = selectedExercise?.exercise_type ?? 'strength'
  const isStrengthExercise = selectedExerciseType === 'strength'
  const isCardioExercise = selectedExerciseType === 'cardio'
  const isDurationExercise = selectedExerciseType === 'duration'
  const recentExercises =
    recentExercisesState.exerciseId === selectedExerciseId ? recentExercisesState.entries : []
  const isRecentExercisesLoading = Boolean(selectedExerciseId) && recentExercisesState.exerciseId !== selectedExerciseId

  useEffect(() => {
    let isActive = true

    if (!selectedExerciseId) {
      return () => {
        isActive = false
      }
    }

    loadRecentCompletedExercises(selectedExerciseId)
      .then(({ data, error }) => {
        if (!isActive) return

        if (error) {
          setRecentExercisesState({
            exerciseId: selectedExerciseId,
            entries: [],
          })
          return
        }

        const entries = data || []
        setRecentExercisesState({
          exerciseId: selectedExerciseId,
          entries,
        })
      })

    return () => {
      isActive = false
    }
  }, [selectedExerciseId])

  const handleSetsChange = (value: string) => {
    const parsed = Number(value)
    const nextSets = Number.isNaN(parsed) ? MIN_SETS : Math.min(MAX_SETS, Math.max(MIN_SETS, parsed))

    setSets(nextSets)
    setRepsPerSet((current) => {
      if (nextSets <= current.length) {
        return current.slice(0, nextSets)
      }

      return [...current, ...Array.from({ length: nextSets - current.length }, () => DEFAULT_REPS)]
    })
    setDurationPerSetSeconds((current) => {
      if (nextSets <= current.length) {
        return current.slice(0, nextSets)
      }

      return [
        ...current,
        ...Array.from({ length: nextSets - current.length }, () => DEFAULT_DURATION_SECONDS),
      ]
    })
  }

  const handleRepChange = (index: number, value: string) => {
    const parsed = Number(value)
    const nextRep = Number.isNaN(parsed) ? MIN_REPS : parsed

    setRepsPerSet((current) =>
      current.map((rep, currentIndex) => {
        if (currentIndex !== index) return rep
        return nextRep
      }),
    )
  }

  const handleDurationChange = (index: number, value: number) => {
    const nextDuration = Math.min(MAX_DURATION_SECONDS, Math.max(MIN_DURATION_SECONDS, value))

    setDurationPerSetSeconds((current) =>
      current.map((duration, currentIndex) => {
        if (currentIndex !== index) return duration
        return nextDuration
      }),
    )
  }

  const handleAddExerciseCategory = async () => {
    const trimmedName = newExerciseCategoryName.trim()

    if (!trimmedName) {
      setIsError(true)
      setMessage('Enter an exercise category name.')
      return
    }

    setIsAddingExerciseCategory(true)
    setMessage('')
    setIsError(false)

    const result = await addExerciseCategory(trimmedName)

    setIsAddingExerciseCategory(false)

    if (result.error || !result.data) {
      setIsError(true)
      setMessage(result.error ?? 'Could not add the exercise category.')
      return
    }

    const data = result.data
    setExerciseCategories((current) => [...current, data])
    setSelectedExerciseCategoryId(data.id)
    setSelectedExerciseId('')
    setNewExerciseCategoryName('')
    setIsExerciseCategoryDialogOpen(false)
    setMessage(`Added exercise category: ${data.name}.`)
  }

  const handleAddExercise = async () => {
    const trimmedName = newExerciseName.trim()

    if (!selectedExerciseCategoryId) {
      setIsError(true)
      setMessage('Select an exercise category first.')
      return
    }

    if (!trimmedName) {
      setIsError(true)
      setMessage('Enter an exercise name.')
      return
    }

    setIsAddingExercise(true)
    setMessage('')
    setIsError(false)

    const result = await addExercise(selectedExerciseCategoryId, trimmedName, newExerciseType)

    setIsAddingExercise(false)

    if (result.error || !result.data) {
      setIsError(true)
      setMessage(result.error ?? 'Could not add the exercise.')
      return
    }

    const data = result.data
    setExercises((current) => [...current, data])
    setSelectedExerciseId(data.id)
    setNewExerciseName('')
    setNewExerciseType('strength')
    setIsExerciseDialogOpen(false)
    setMessage(`Added exercise: ${data.name}.`)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')
    setIsError(false)

    if (!selectedExerciseCategoryId || !selectedExerciseId) {
      setIsError(true)
      setMessage('Select an exercise category and exercise.')
      return
    }

    if (!performedAt) {
      setIsError(true)
      setMessage('Select a workout date.')
      return
    }

    const hasInvalidReps = repsPerSet.some((rep) => rep < MIN_REPS || rep > MAX_REPS)
    const hasInvalidDurations = durationPerSetSeconds.some(
      (duration) => duration < MIN_DURATION_SECONDS || duration > MAX_DURATION_SECONDS,
    )
    const hasInvalidLoad = hasLoad && (loadKg < MIN_LOAD_KG || !Number.isInteger(loadKg / LOAD_STEP_KG))
    const hasInvalidDistance = distanceKm < MIN_DISTANCE_KM || distanceKm > MAX_DISTANCE_KM
    const hasInvalidPace =
      paceMinPerKm !== null && (paceMinPerKm < MIN_PACE_MIN_PER_KM || paceMinPerKm > MAX_PACE_MIN_PER_KM)
    const hasInvalidActivityDuration =
      activityDurationSeconds < MIN_ACTIVITY_DURATION_SECONDS ||
      activityDurationSeconds > MAX_ACTIVITY_DURATION_SECONDS ||
      activityDurationSeconds % ACTIVITY_DURATION_STEP_SECONDS !== 0

    if (isStrengthExercise && (
      sets < MIN_SETS ||
      sets > MAX_SETS ||
      (strengthDetailMode === 'reps' && (hasInvalidReps || repsPerSet.length !== sets)) ||
      (strengthDetailMode === 'time' && (hasInvalidDurations || durationPerSetSeconds.length !== sets)) ||
      hasInvalidLoad
    )) {
      setIsError(true)
      setMessage('Check the allowed ranges for sets, reps, time, and load.')
      return
    }

    if (isCardioExercise && (hasInvalidDistance || hasInvalidPace)) {
      setIsError(true)
      setMessage('Check the allowed ranges for distance and pace if provided.')
      return
    }

    if (isDurationExercise && hasInvalidActivityDuration) {
      setIsError(true)
      setMessage('Enter a valid duration in hh:mm using 5-minute steps.')
      return
    }

    setLoading(true)

    const result = await onSubmit({
      exerciseCategoryId: selectedExerciseCategoryId,
      exerciseId: selectedExerciseId,
      sets: isStrengthExercise ? sets : null,
      repsPerSet: isStrengthExercise && strengthDetailMode === 'reps' ? repsPerSet : null,
      durationPerSetSeconds:
        isStrengthExercise && strengthDetailMode === 'time'
          ? durationPerSetSeconds
          : isDurationExercise
            ? [activityDurationSeconds]
            : null,
      loadKg: isStrengthExercise && hasLoad ? loadKg : null,
      distanceKm: isCardioExercise ? distanceKm : null,
      paceMinPerKm: isCardioExercise ? paceMinPerKm : null,
      note: note.trim(),
      performedAt,
    })

    setLoading(false)

    if (result.error) {
      setIsError(true)
      setMessage(result.error)
      return
    }

    onSuccess?.()
    router.push(getCompletedExercisesHrefForDate(performedAt))
  }

  return (
    <div className={styles.CompletedExerciseForm}>
      <PageContainer className={styles.CompletedExerciseFormContainer}>
        <PageHeader
          backHref={mode === 'edit' ? '/completed-exercises' : '/'}
          backLabel={mode === 'edit' ? '← Back to Completed Exercises' : '← Back to Home'}
          icon={HeaderIcon}
          title={title}
          description={description}
          descriptionSize="large"
          titleRowMobileAlign="start"
        />

        <form onSubmit={handleSubmit} className={styles.CompletedExerciseFormForm}>
          <section className={styles.CompletedExerciseFormSection}>
            <div className={styles.CompletedExerciseFormSectionHeader}>
              <h2 className={styles.CompletedExerciseFormSectionTitle}>Exercise</h2>
              <p className={styles.CompletedExerciseFormSectionDescription}>
                Start by choosing an exercise category and a specific exercise.
              </p>
            </div>

            <div className={styles.CompletedExerciseFormSectionBody}>
              <div className={styles.CompletedExerciseFormBadgeField}>
                <p className={styles.CompletedExerciseFormLabel}>Exercise Category</p>
                <div className={styles.CompletedExerciseFormBadgeGroup} role="group" aria-label="Exercise category">
                  {isExerciseSetupLoading ? (
                    <div className={styles.CompletedExerciseFormFormDataSkeleton} aria-label="Loading exercise categories">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : exerciseCategories.length === 0 ? (
                    <p className={styles.CompletedExerciseFormBadgeEmpty}>No exercise categories yet.</p>
                  ) : null}
                  {exerciseCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={styles.CompletedExerciseFormChoiceBadge}
                      aria-pressed={selectedExerciseCategoryId === category.id}
                      data-selected={selectedExerciseCategoryId === category.id ? 'true' : undefined}
                      onClick={() => {
                        setSelectedExerciseCategoryId(category.id)
                        setSelectedExerciseId('')
                      }}
                    >
                      {category.name}
                    </button>
                  ))}
                  <Dialog.Root open={isExerciseCategoryDialogOpen} onOpenChange={setIsExerciseCategoryDialogOpen}>
                    <Dialog.Trigger asChild>
                      <button type="button" className={styles.CompletedExerciseFormAddBadge}>
                        Add
                      </button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Overlay className={styles.CompletedExerciseFormOverlay} />
                      <Dialog.Content className={styles.CompletedExerciseFormDialogContent}>
                        <Dialog.Title className={styles.CompletedExerciseFormDialogTitle}>Add Exercise Category</Dialog.Title>
                        <Dialog.Description className={styles.CompletedExerciseFormDialogDescription}>
                          Enter the name of the new exercise category.
                        </Dialog.Description>
                        <div className={styles.CompletedExerciseFormDialogBody}>
                          <input
                            className={styles.CompletedExerciseFormInput}
                            value={newExerciseCategoryName}
                            onChange={(e) => setNewExerciseCategoryName(e.target.value)}
                            placeholder="e.g. Back"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddExerciseCategory()
                              }
                            }}
                          />
                          <div className={styles.CompletedExerciseFormDialogActions}>
                            <Dialog.Close asChild>
                              <button type="button" className={styles.CompletedExerciseFormGhostButton}>
                                Cancel
                              </button>
                            </Dialog.Close>
                            <button
                              type="button"
                              onClick={handleAddExerciseCategory}
                              className={styles.CompletedExerciseFormPrimaryButton}
                              disabled={isAddingExerciseCategory}
                            >
                              {isAddingExerciseCategory ? 'Adding...' : 'Add'}
                            </button>
                          </div>
                        </div>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                </div>
              </div>

              <div className={styles.CompletedExerciseFormBadgeField}>
                <p className={styles.CompletedExerciseFormLabel}>Exercise</p>
                <div className={styles.CompletedExerciseFormBadgeGroup} role="group" aria-label="Exercise">
                  {!selectedExerciseCategoryId ? (
                    <p className={styles.CompletedExerciseFormBadgeEmpty}>Select an exercise category first.</p>
                  ) : filteredExercises.length === 0 ? (
                    <p className={styles.CompletedExerciseFormBadgeEmpty}>No exercises in this category yet.</p>
                  ) : (
                    filteredExercises.map((exercise) => (
                      <button
                        key={exercise.id}
                        type="button"
                        className={styles.CompletedExerciseFormChoiceBadge}
                        aria-pressed={selectedExerciseId === exercise.id}
                        data-selected={selectedExerciseId === exercise.id ? 'true' : undefined}
                        onClick={() => setSelectedExerciseId(exercise.id)}
                      >
                        {exercise.name}
                      </button>
                    ))
                  )}
                  <Dialog.Root open={isExerciseDialogOpen} onOpenChange={setIsExerciseDialogOpen}>
                    <Dialog.Trigger asChild>
                      <button
                        type="button"
                        className={styles.CompletedExerciseFormAddBadge}
                        disabled={!selectedExerciseCategoryId}
                      >
                        Add
                      </button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Overlay className={styles.CompletedExerciseFormOverlay} />
                      <Dialog.Content className={styles.CompletedExerciseFormDialogContent}>
                        <Dialog.Title className={styles.CompletedExerciseFormDialogTitle}>Add Exercise</Dialog.Title>
                        <Dialog.Description className={styles.CompletedExerciseFormDialogDescription}>
                          Add a new exercise to the selected exercise category.
                        </Dialog.Description>
                        <div className={styles.CompletedExerciseFormDialogBody}>
                          <input
                            className={styles.CompletedExerciseFormInput}
                            value={newExerciseName}
                            onChange={(e) => setNewExerciseName(e.target.value)}
                            placeholder="e.g. Barbell Row"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddExercise()
                              }
                            }}
                          />
                          <label htmlFor="newExerciseType" className={styles.CompletedExerciseFormLabel}>
                            Type
                          </label>
                          <select
                            id="newExerciseType"
                            className={styles.CompletedExerciseFormSelect}
                            value={newExerciseType}
                            onChange={(e) => setNewExerciseType(e.target.value as ExerciseType)}
                          >
                            <option value="strength">Strength</option>
                            <option value="cardio">Cardio</option>
                            <option value="duration">Duration only</option>
                          </select>
                          <div className={styles.CompletedExerciseFormDialogActions}>
                            <Dialog.Close asChild>
                              <button type="button" className={styles.CompletedExerciseFormGhostButton}>
                                Cancel
                              </button>
                            </Dialog.Close>
                            <button
                              type="button"
                              onClick={handleAddExercise}
                              className={styles.CompletedExerciseFormPrimaryButton}
                              disabled={isAddingExercise}
                            >
                              {isAddingExercise ? 'Adding...' : 'Add'}
                            </button>
                          </div>
                        </div>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                </div>
              </div>
            </div>
          </section>

          {selectedExercise ? (
            <section className={styles.CompletedExerciseFormSection}>
              <div className={styles.CompletedExerciseFormSectionHeader}>
                <h2 className={styles.CompletedExerciseFormSectionTitle}>Workout Details</h2>
                <p className={styles.CompletedExerciseFormSectionDescription}>
                  {isStrengthExercise
                    ? 'Set the number of sets, reps or time, and load for this exercise.'
                    : isCardioExercise
                      ? 'Set the distance and optional pace for this cardio exercise.'
                      : 'Enter the total duration for this activity in hh:mm, using 5-minute steps.'}
                </p>

                <div className={styles.CompletedExerciseFormRecentHistory}>
                  <p className={styles.CompletedExerciseFormRecentHistoryTitle}>Last 3 entries</p>
                  {isRecentExercisesLoading ? (
                    <div className={styles.CompletedExerciseFormRecentHistorySkeleton} aria-label="Loading recent history">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : recentExercises.length === 0 ? (
                    <p className={styles.CompletedExerciseFormRecentHistoryEmpty}>No previous entries for this exercise yet.</p>
                  ) : (
                    <div className={styles.CompletedExerciseFormRecentHistoryList}>
                      {recentExercises.map((exercise) => (
                        <div key={exercise.id} className={styles.CompletedExerciseFormRecentHistoryItem}>
                          <p className={styles.CompletedExerciseFormRecentHistoryDate}>{formatLongDate(exercise.performed_at)}</p>
                          <p className={styles.CompletedExerciseFormRecentHistoryDetails}>
                            {formatRecentExerciseSummary(selectedExerciseType, exercise)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.CompletedExerciseFormSectionBody}>
                {isStrengthExercise ? (
                <>
                  <div className={styles.CompletedExerciseFormField}>
                    <label htmlFor="sets" className={styles.CompletedExerciseFormLabel}>
                      Sets (1-5)
                    </label>
                    <NumericStepper
                      id="sets"
                      inputClassName={styles.CompletedExerciseFormInput}
                      value={sets}
                      min={MIN_SETS}
                      max={MAX_SETS}
                      onChange={(value) => handleSetsChange(String(value))}
                    />
                  </div>

                  <div className={styles.CompletedExerciseFormField}>
                    <p className={styles.CompletedExerciseFormRepsHeading}>Set Target</p>
                    <div className={styles.CompletedExerciseFormSegmentedControl} role="group" aria-label="Set target type">
                      <button
                        type="button"
                        className={styles.CompletedExerciseFormSegmentButton}
                        data-selected={strengthDetailMode === 'reps' ? 'true' : undefined}
                        aria-pressed={strengthDetailMode === 'reps'}
                        onClick={() => setStrengthDetailMode('reps')}
                      >
                        Reps
                      </button>
                      <button
                        type="button"
                        className={styles.CompletedExerciseFormSegmentButton}
                        data-selected={strengthDetailMode === 'time' ? 'true' : undefined}
                        aria-pressed={strengthDetailMode === 'time'}
                        onClick={() => setStrengthDetailMode('time')}
                      >
                        Time
                      </button>
                    </div>
                  </div>

                  <div className={styles.CompletedExerciseFormField}>
                    <p className={styles.CompletedExerciseFormRepsHeading}>
                      {strengthDetailMode === 'reps' ? 'Reps Per Set (1-30)' : 'Time Per Set'}
                    </p>
                    <div className={styles.CompletedExerciseFormRepsGrid}>
                      {strengthDetailMode === 'reps'
                        ? repsPerSet.map((rep, index) => (
                            <div key={`rep-${index}`} className={styles.CompletedExerciseFormRepField}>
                              <label htmlFor={`rep-${index}`} className={styles.CompletedExerciseFormRepLabel}>
                                Set {index + 1}
                              </label>
                              <NumericStepper
                                id={`rep-${index}`}
                                inputClassName={styles.CompletedExerciseFormInput}
                                value={rep}
                                min={MIN_REPS}
                                max={MAX_REPS}
                                onChange={(value) => handleRepChange(index, String(value))}
                              />
                            </div>
                          ))
                        : durationPerSetSeconds.map((duration, index) => (
                            <div key={`duration-${index}`} className={styles.CompletedExerciseFormRepField}>
                              <label htmlFor={`duration-${index}`} className={styles.CompletedExerciseFormRepLabel}>
                                Set {index + 1}
                              </label>
                              <NumericStepper
                                id={`duration-${index}`}
                                inputClassName={styles.CompletedExerciseFormInput}
                                value={duration}
                                min={MIN_DURATION_SECONDS}
                                max={MAX_DURATION_SECONDS}
                                onChange={(value) => handleDurationChange(index, value)}
                                displayValue={formatDuration(duration)}
                                unit="s"
                              />
                            </div>
                          ))}
                    </div>
                  </div>

                  <div className={styles.CompletedExerciseFormField}>
                    <div className={styles.CompletedExerciseFormFieldHeader}>
                      <label htmlFor="loadKg" className={styles.CompletedExerciseFormLabel}>
                        Load (kg)
                      </label>
                      <label className={styles.CompletedExerciseFormCheckboxRow}>
                        <input
                          type="checkbox"
                          checked={!hasLoad}
                          onChange={(e) => setHasLoad(!e.target.checked)}
                        />
                        <span>No Load</span>
                      </label>
                    </div>
                    {hasLoad ? (
                      <NumericStepper
                        id="loadKg"
                        inputClassName={styles.CompletedExerciseFormInput}
                        value={loadKg}
                        min={MIN_LOAD_KG}
                        max={MAX_LOAD_KG}
                        step={LOAD_STEP_KG}
                        onChange={setLoadKg}
                        displayValue={`${loadKg.toFixed(1)} kg`}
                        unit="kg"
                      />
                    ) : (
                      <div className={styles.CompletedExerciseFormEmptyValue}>This exercise will be saved without a load value.</div>
                    )}
                  </div>
                </>
                ) : isCardioExercise ? (
                <div className={styles.CompletedExerciseFormMetricsGrid}>
                  <div className={styles.CompletedExerciseFormField}>
                    <label htmlFor="distanceKm" className={styles.CompletedExerciseFormLabel}>
                      Distance (km)
                    </label>
                    <NumericStepper
                      id="distanceKm"
                      inputClassName={styles.CompletedExerciseFormInput}
                      value={distanceKm}
                      min={MIN_DISTANCE_KM}
                      max={MAX_DISTANCE_KM}
                      step={DISTANCE_STEP_KM}
                      onChange={setDistanceKm}
                      displayValue={`${distanceKm.toFixed(1)} km`}
                      unit="km"
                    />
                  </div>

                  <div className={styles.CompletedExerciseFormField}>
                    <label htmlFor="paceMinPerKm" className={styles.CompletedExerciseFormLabel}>
                      Pace (min/km)
                    </label>
                    <PaceStepper
                      id="paceMinPerKm"
                      inputClassName={styles.CompletedExerciseFormInput}
                      value={paceMinPerKm}
                      min={MIN_PACE_MIN_PER_KM}
                      max={MAX_PACE_MIN_PER_KM}
                      onChange={setPaceMinPerKm}
                    />
                  </div>
                </div>
                ) : (
                <div className={styles.CompletedExerciseFormField}>
                  <label htmlFor="activityDuration" className={styles.CompletedExerciseFormLabel}>
                    Duration
                  </label>
                  <DurationStepper
                    id="activityDuration"
                    inputClassName={styles.CompletedExerciseFormInput}
                    value={activityDurationSeconds}
                    min={MIN_ACTIVITY_DURATION_SECONDS}
                    max={MAX_ACTIVITY_DURATION_SECONDS}
                    step={ACTIVITY_DURATION_STEP_SECONDS}
                    onChange={setActivityDurationSeconds}
                  />
                </div>
                )}
              </div>
            </section>
          ) : null}

          {selectedExercise ? (
            <section className={styles.CompletedExerciseFormSection}>
              <div className={styles.CompletedExerciseFormSectionHeader}>
                <h2 className={styles.CompletedExerciseFormSectionTitle}>Notes</h2>
                <p className={styles.CompletedExerciseFormSectionDescription}>
                  Add the workout date and an optional note.
                </p>
              </div>

              <div className={styles.CompletedExerciseFormSectionBody}>
                <label htmlFor="performedAt" className={styles.CompletedExerciseFormLabel}>
                  Date
                </label>
                <DatePicker
                  id="performedAt"
                  value={performedAt}
                  onChange={setPerformedAt}
                />

                <label htmlFor="note" className={styles.CompletedExerciseFormLabel}>
                  Note
                </label>
                <textarea
                  id="note"
                  className={`${styles.CompletedExerciseFormInput} ${styles.CompletedExerciseFormTextarea}`}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Optional: how the workout felt, notes, observations..."
                />
              </div>
            </section>
          ) : null}

          <div className={styles.CompletedExerciseFormFormFooter}>
            {message && (
              <StatusPanel variant={isError ? 'error' : 'success'} withTopSpacing>
                {message}
              </StatusPanel>
            )}

            <button type="submit" className={styles.CompletedExerciseFormSubmit} disabled={loading}>
              {loading ? submittingLabel : submitLabel}
            </button>
          </div>
        </form>
      </PageContainer>
    </div>
  )
}
