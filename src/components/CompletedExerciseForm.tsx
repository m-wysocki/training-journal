'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { supabase } from '@/lib/supabase'
import BackLink from '@/components/BackLink'
import { DatePicker } from '@/components/DatePicker'
import { DurationStepper } from '@/components/DurationStepper'
import { NumericStepper } from '@/components/NumericStepper'
import { PaceStepper } from '@/components/PaceStepper'
import PageContainer from '@/components/PageContainer'
import styles from './CompletedExerciseForm.module.scss'

type ExerciseCategory = {
  id: string
  name: string
}

export type ExerciseType = 'strength' | 'cardio' | 'duration'
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
  submitLabel: string
  submittingLabel: string
  initialValues: CompletedExerciseFormValues
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
const DEFAULT_PACE_MIN_PER_KM = 6
const MIN_PACE_MIN_PER_KM = 1
const MAX_PACE_MIN_PER_KM = 60

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor(seconds / 60)
  const remainingMinutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    if (remainingMinutes === 0) {
      return remainingSeconds === 0 ? `${hours}h` : `${hours}h ${remainingSeconds}s`
    }

    return remainingSeconds === 0
      ? `${hours}h ${remainingMinutes}min`
      : `${hours}h ${remainingMinutes}min ${remainingSeconds}s`
  }

  return remainingSeconds === 0 ? `${minutes}m` : `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

export function CompletedExerciseForm({
  mode,
  title,
  description,
  submitLabel,
  submittingLabel,
  initialValues,
  onSubmit,
  onSuccess,
}: CompletedExerciseFormProps) {
  const router = useRouter()
  const [exerciseCategories, setExerciseCategories] = useState<ExerciseCategory[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
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
  const [paceMinPerKm, setPaceMinPerKm] = useState(initialValues.paceMinPerKm ?? DEFAULT_PACE_MIN_PER_KM)
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

  useEffect(() => {
    let isActive = true

    Promise.all([
      supabase.from('exercise_categories').select('id, name').order('created_at'),
      supabase.from('exercises').select('id, name, exercise_category_id, exercise_type').order('created_at'),
    ]).then(([categoriesResult, exercisesResult]) => {
      if (!isActive) return

      if (categoriesResult.error || exercisesResult.error) {
        setIsError(true)
        setMessage('Could not load data. Please try again.')
        return
      }

      setExerciseCategories(categoriesResult.data || [])
      setExercises(exercisesResult.data || [])
    })

    return () => {
      isActive = false
    }
  }, [])

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

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setIsError(true)
      setMessage('Sign in before adding an exercise category.')
      setIsAddingExerciseCategory(false)
      return
    }

    const { data, error } = await supabase
      .from('exercise_categories')
      .insert({
        name: trimmedName,
        user_id: session.user.id,
      })
      .select('id, name')
      .single()

    setIsAddingExerciseCategory(false)

    if (error || !data) {
      setIsError(true)
      setMessage(
        error?.message.includes('row-level security policy')
          ? 'Could not add the exercise category because database access rules blocked it. Run the exercise_categories RLS policy in Supabase.'
          : 'Could not add the exercise category.',
      )
      return
    }

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

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setIsError(true)
      setMessage('Sign in before adding an exercise.')
      setIsAddingExercise(false)
      return
    }

    const { data, error } = await supabase
      .from('exercises')
      .insert({
        name: trimmedName,
        exercise_category_id: selectedExerciseCategoryId,
        exercise_type: newExerciseType,
        user_id: session.user.id,
      })
      .select('id, name, exercise_category_id, exercise_type')
      .single()

    setIsAddingExercise(false)

    if (error || !data) {
      setIsError(true)
      setMessage(
        error?.message.includes('row-level security policy')
          ? 'Could not add the exercise because database access rules blocked it. Run the exercises RLS policy in Supabase.'
          : 'Could not add the exercise.',
      )
      return
    }

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
    const hasInvalidPace = paceMinPerKm < MIN_PACE_MIN_PER_KM || paceMinPerKm > MAX_PACE_MIN_PER_KM
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
      setMessage('Check the allowed ranges for distance and pace.')
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

    if (mode === 'create') {
      onSuccess?.()
      router.push('/completed-exercises')
      return
    }

    onSuccess?.()
    router.push('/completed-exercises')
  }

  return (
    <div className={styles.wrapper}>
      <PageContainer className={styles.container}>
        <div className={styles.header}>
          <BackLink
            href={mode === 'edit' ? '/completed-exercises' : '/'}
            label={mode === 'edit' ? '← Back to Completed Exercises' : '← Back to Home'}
          />
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Exercise</h2>
              <p className={styles.sectionDescription}>
                Start by choosing an exercise category and a specific exercise.
              </p>
            </div>

            <div className={styles.sectionBody}>
              <div className={styles.badgeField}>
                <p className={styles.label}>Exercise Category</p>
                <div className={styles.badgeGroup} role="group" aria-label="Exercise category">
                  {exerciseCategories.length === 0 && (
                    <p className={styles.badgeEmpty}>No exercise categories yet.</p>
                  )}
                  {exerciseCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={styles.choiceBadge}
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
                      <button type="button" className={styles.addBadge}>
                        Add
                      </button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Overlay className={styles.overlay} />
                      <Dialog.Content className={styles.dialogContent}>
                        <Dialog.Title className={styles.dialogTitle}>Add Exercise Category</Dialog.Title>
                        <Dialog.Description className={styles.dialogDescription}>
                          Enter the name of the new exercise category.
                        </Dialog.Description>
                        <div className={styles.dialogBody}>
                          <input
                            className={styles.input}
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
                          <div className={styles.dialogActions}>
                            <Dialog.Close asChild>
                              <button type="button" className={styles.ghostButton}>
                                Cancel
                              </button>
                            </Dialog.Close>
                            <button
                              type="button"
                              onClick={handleAddExerciseCategory}
                              className={styles.primaryButton}
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

              <div className={styles.badgeField}>
                <p className={styles.label}>Exercise</p>
                <div className={styles.badgeGroup} role="group" aria-label="Exercise">
                  {!selectedExerciseCategoryId ? (
                    <p className={styles.badgeEmpty}>Select an exercise category first.</p>
                  ) : filteredExercises.length === 0 ? (
                    <p className={styles.badgeEmpty}>No exercises in this category yet.</p>
                  ) : (
                    filteredExercises.map((exercise) => (
                      <button
                        key={exercise.id}
                        type="button"
                        className={styles.choiceBadge}
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
                        className={styles.addBadge}
                        disabled={!selectedExerciseCategoryId}
                      >
                        Add
                      </button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Overlay className={styles.overlay} />
                      <Dialog.Content className={styles.dialogContent}>
                        <Dialog.Title className={styles.dialogTitle}>Add Exercise</Dialog.Title>
                        <Dialog.Description className={styles.dialogDescription}>
                          Add a new exercise to the selected exercise category.
                        </Dialog.Description>
                        <div className={styles.dialogBody}>
                          <input
                            className={styles.input}
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
                          <label htmlFor="newExerciseType" className={styles.label}>
                            Type
                          </label>
                          <select
                            id="newExerciseType"
                            className={styles.select}
                            value={newExerciseType}
                            onChange={(e) => setNewExerciseType(e.target.value as ExerciseType)}
                          >
                            <option value="strength">Strength</option>
                            <option value="cardio">Cardio</option>
                            <option value="duration">Duration only</option>
                          </select>
                          <div className={styles.dialogActions}>
                            <Dialog.Close asChild>
                              <button type="button" className={styles.ghostButton}>
                                Cancel
                              </button>
                            </Dialog.Close>
                            <button
                              type="button"
                              onClick={handleAddExercise}
                              className={styles.primaryButton}
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

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Workout Details</h2>
              <p className={styles.sectionDescription}>
                {isStrengthExercise
                  ? 'Set the number of sets, reps or time, and load for this exercise.'
                  : isCardioExercise
                    ? 'Set the distance and pace for this cardio exercise.'
                    : 'Enter the total duration for this activity in hh:mm, using 5-minute steps.'}
              </p>
            </div>

            <div className={styles.sectionBody}>
              {isStrengthExercise ? (
                <>
                  <div className={styles.field}>
                    <label htmlFor="sets" className={styles.label}>
                      Sets (1-5)
                    </label>
                    <NumericStepper
                      id="sets"
                      inputClassName={styles.input}
                      value={sets}
                      min={MIN_SETS}
                      max={MAX_SETS}
                      onChange={(value) => handleSetsChange(String(value))}
                    />
                  </div>

                  <div className={styles.field}>
                    <p className={styles.repsHeading}>Set Target</p>
                    <div className={styles.segmentedControl} role="group" aria-label="Set target type">
                      <button
                        type="button"
                        className={styles.segmentButton}
                        data-selected={strengthDetailMode === 'reps' ? 'true' : undefined}
                        aria-pressed={strengthDetailMode === 'reps'}
                        onClick={() => setStrengthDetailMode('reps')}
                      >
                        Reps
                      </button>
                      <button
                        type="button"
                        className={styles.segmentButton}
                        data-selected={strengthDetailMode === 'time' ? 'true' : undefined}
                        aria-pressed={strengthDetailMode === 'time'}
                        onClick={() => setStrengthDetailMode('time')}
                      >
                        Time
                      </button>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <p className={styles.repsHeading}>
                      {strengthDetailMode === 'reps' ? 'Reps Per Set (1-30)' : 'Time Per Set'}
                    </p>
                    <div className={styles.repsGrid}>
                      {strengthDetailMode === 'reps'
                        ? repsPerSet.map((rep, index) => (
                            <div key={`rep-${index}`} className={styles.repField}>
                              <label htmlFor={`rep-${index}`} className={styles.repLabel}>
                                Set {index + 1}
                              </label>
                              <NumericStepper
                                id={`rep-${index}`}
                                inputClassName={styles.input}
                                value={rep}
                                min={MIN_REPS}
                                max={MAX_REPS}
                                onChange={(value) => handleRepChange(index, String(value))}
                              />
                            </div>
                          ))
                        : durationPerSetSeconds.map((duration, index) => (
                            <div key={`duration-${index}`} className={styles.repField}>
                              <label htmlFor={`duration-${index}`} className={styles.repLabel}>
                                Set {index + 1}
                              </label>
                              <NumericStepper
                                id={`duration-${index}`}
                                inputClassName={styles.input}
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

                  <div className={styles.field}>
                    <div className={styles.fieldHeader}>
                      <label htmlFor="loadKg" className={styles.label}>
                        Load (kg)
                      </label>
                      <label className={styles.checkboxRow}>
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
                        inputClassName={styles.input}
                        value={loadKg}
                        min={MIN_LOAD_KG}
                        max={MAX_LOAD_KG}
                        step={LOAD_STEP_KG}
                        onChange={setLoadKg}
                        displayValue={`${loadKg.toFixed(1)} kg`}
                        unit="kg"
                      />
                    ) : (
                      <div className={styles.emptyValue}>This exercise will be saved without a load value.</div>
                    )}
                  </div>
                </>
              ) : isCardioExercise ? (
                <div className={styles.metricsGrid}>
                  <div className={styles.field}>
                    <label htmlFor="distanceKm" className={styles.label}>
                      Distance (km)
                    </label>
                    <NumericStepper
                      id="distanceKm"
                      inputClassName={styles.input}
                      value={distanceKm}
                      min={MIN_DISTANCE_KM}
                      max={MAX_DISTANCE_KM}
                      step={DISTANCE_STEP_KM}
                      onChange={setDistanceKm}
                      displayValue={`${distanceKm.toFixed(1)} km`}
                      unit="km"
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="paceMinPerKm" className={styles.label}>
                      Pace (min/km)
                    </label>
                    <PaceStepper
                      id="paceMinPerKm"
                      inputClassName={styles.input}
                      value={paceMinPerKm}
                      min={MIN_PACE_MIN_PER_KM}
                      max={MAX_PACE_MIN_PER_KM}
                      onChange={setPaceMinPerKm}
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.field}>
                  <label htmlFor="activityDuration" className={styles.label}>
                    Duration
                  </label>
                  <DurationStepper
                    id="activityDuration"
                    inputClassName={styles.input}
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

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Notes</h2>
              <p className={styles.sectionDescription}>
                Add the workout date and an optional note.
              </p>
            </div>

            <div className={styles.sectionBody}>
              <label htmlFor="performedAt" className={styles.label}>
                Date
              </label>
              <DatePicker
                id="performedAt"
                value={performedAt}
                onChange={setPerformedAt}
              />

              <label htmlFor="note" className={styles.label}>
                Note
              </label>
              <textarea
                id="note"
                className={`${styles.input} ${styles.textarea}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Optional: how the workout felt, notes, observations..."
              />
            </div>
          </section>

          <div className={styles.formFooter}>
            {message && (
              <div className={isError ? styles.messageError : styles.messageSuccess}>
                {message}
              </div>
            )}

            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? submittingLabel : submitLabel}
            </button>
          </div>
        </form>
      </PageContainer>
    </div>
  )
}
