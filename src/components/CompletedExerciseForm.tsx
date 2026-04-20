'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { supabase } from '@/lib/supabase'
import BackLink from '@/components/BackLink'
import { NumericStepper } from '@/components/NumericStepper'
import PageContainer from '@/components/PageContainer'
import styles from './CompletedExerciseForm.module.scss'

type MuscleGroup = {
  id: string
  name: string
}

export type ExerciseType = 'strength' | 'cardio'

type Exercise = {
  id: string
  name: string
  muscle_group_id: string
  exercise_type: ExerciseType
}

export type CompletedExerciseFormValues = {
  muscleGroupId: string
  exerciseId: string
  sets: number | null
  repsPerSet: number[] | null
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
const DEFAULT_DISTANCE_KM = 5
const MIN_DISTANCE_KM = 0.1
const MAX_DISTANCE_KM = 999
const DISTANCE_STEP_KM = 0.1
const DEFAULT_PACE_MIN_PER_KM = 6
const MIN_PACE_MIN_PER_KM = 1
const MAX_PACE_MIN_PER_KM = 60
const PACE_STEP_MIN_PER_KM = 0.05

const formatPace = (paceMinPerKm: number) => {
  const totalSeconds = Math.round(paceMinPerKm * 60)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')} min/km`
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
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState(initialValues.muscleGroupId)
  const [selectedExerciseId, setSelectedExerciseId] = useState(initialValues.exerciseId)
  const [newMuscleGroupName, setNewMuscleGroupName] = useState('')
  const [newExerciseName, setNewExerciseName] = useState('')
  const [newExerciseType, setNewExerciseType] = useState<ExerciseType>('strength')
  const [sets, setSets] = useState(initialValues.sets ?? 3)
  const [repsPerSet, setRepsPerSet] = useState<number[]>(initialValues.repsPerSet ?? [12, 12, 12])
  const [loadKg, setLoadKg] = useState<number>(initialValues.loadKg ?? DEFAULT_LOAD_KG)
  const [hasLoad, setHasLoad] = useState(initialValues.loadKg !== null)
  const [distanceKm, setDistanceKm] = useState(initialValues.distanceKm ?? DEFAULT_DISTANCE_KM)
  const [paceMinPerKm, setPaceMinPerKm] = useState(initialValues.paceMinPerKm ?? DEFAULT_PACE_MIN_PER_KM)
  const [note, setNote] = useState(initialValues.note)
  const [performedAt, setPerformedAt] = useState(initialValues.performedAt)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isAddingMuscleGroup, setIsAddingMuscleGroup] = useState(false)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [isMuscleGroupDialogOpen, setIsMuscleGroupDialogOpen] = useState(false)
  const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false)

  useEffect(() => {
    let isActive = true

    Promise.all([
      supabase.from('muscle_groups').select('id, name').order('created_at'),
      supabase.from('exercises').select('id, name, muscle_group_id, exercise_type').order('created_at'),
    ]).then(([groupsResult, exercisesResult]) => {
      if (!isActive) return

      if (groupsResult.error || exercisesResult.error) {
        setIsError(true)
        setMessage('Could not load data. Please try again.')
        return
      }

      setMuscleGroups(groupsResult.data || [])
      setExercises(exercisesResult.data || [])
    })

    return () => {
      isActive = false
    }
  }, [])

  const filteredExercises = useMemo(
    () => exercises.filter((exercise) => exercise.muscle_group_id === selectedMuscleGroupId),
    [exercises, selectedMuscleGroupId],
  )

  const selectedExercise = useMemo(
    () => exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null,
    [exercises, selectedExerciseId],
  )

  const selectedExerciseType = selectedExercise?.exercise_type ?? 'strength'
  const isStrengthExercise = selectedExerciseType === 'strength'

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

  const handleAddMuscleGroup = async () => {
    const trimmedName = newMuscleGroupName.trim()

    if (!trimmedName) {
      setIsError(true)
      setMessage('Enter a muscle group name.')
      return
    }

    setIsAddingMuscleGroup(true)
    setMessage('')
    setIsError(false)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setIsError(true)
      setMessage('Sign in before adding a muscle group.')
      setIsAddingMuscleGroup(false)
      return
    }

    const { data, error } = await supabase
      .from('muscle_groups')
      .insert({
        name: trimmedName,
        user_id: session.user.id,
      })
      .select('id, name')
      .single()

    setIsAddingMuscleGroup(false)

    if (error || !data) {
      setIsError(true)
      setMessage(
        error?.message.includes('row-level security policy')
          ? 'Could not add the muscle group because database access rules blocked it. Run the muscle_groups RLS policy in Supabase.'
          : 'Could not add the muscle group.',
      )
      return
    }

    setMuscleGroups((current) => [...current, data])
    setSelectedMuscleGroupId(data.id)
    setSelectedExerciseId('')
    setNewMuscleGroupName('')
    setIsMuscleGroupDialogOpen(false)
    setMessage(`Added muscle group: ${data.name}.`)
  }

  const handleAddExercise = async () => {
    const trimmedName = newExerciseName.trim()

    if (!selectedMuscleGroupId) {
      setIsError(true)
      setMessage('Select a muscle group first.')
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
        muscle_group_id: selectedMuscleGroupId,
        exercise_type: newExerciseType,
        user_id: session.user.id,
      })
      .select('id, name, muscle_group_id, exercise_type')
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

    if (!selectedMuscleGroupId || !selectedExerciseId) {
      setIsError(true)
      setMessage('Select a muscle group and exercise.')
      return
    }

    const hasInvalidReps = repsPerSet.some((rep) => rep < MIN_REPS || rep > MAX_REPS)
    const hasInvalidLoad = hasLoad && (loadKg < MIN_LOAD_KG || !Number.isInteger(loadKg / LOAD_STEP_KG))
    const hasInvalidDistance = distanceKm < MIN_DISTANCE_KM || distanceKm > MAX_DISTANCE_KM
    const hasInvalidPace =
      paceMinPerKm < MIN_PACE_MIN_PER_KM || paceMinPerKm > MAX_PACE_MIN_PER_KM

    if (isStrengthExercise && (
      sets < MIN_SETS ||
      sets > MAX_SETS ||
      hasInvalidReps ||
      repsPerSet.length !== sets ||
      hasInvalidLoad
    )) {
      setIsError(true)
      setMessage('Check the allowed ranges for sets, reps, and load.')
      return
    }

    if (!isStrengthExercise && (hasInvalidDistance || hasInvalidPace)) {
      setIsError(true)
      setMessage('Check the allowed ranges for distance and pace.')
      return
    }

    setLoading(true)

    const result = await onSubmit({
      muscleGroupId: selectedMuscleGroupId,
      exerciseId: selectedExerciseId,
      sets: isStrengthExercise ? sets : null,
      repsPerSet: isStrengthExercise ? repsPerSet : null,
      loadKg: isStrengthExercise && hasLoad ? loadKg : null,
      distanceKm: isStrengthExercise ? null : distanceKm,
      paceMinPerKm: isStrengthExercise ? null : paceMinPerKm,
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
                Start by choosing a muscle group and a specific exercise.
              </p>
            </div>

            <div className={styles.sectionBody}>
              <label htmlFor="muscleGroup" className={styles.label}>
                Muscle Group
              </label>
              <div className={styles.selectRow}>
                <select
                  id="muscleGroup"
                  className={styles.select}
                  value={selectedMuscleGroupId}
                  onChange={(e) => {
                    setSelectedMuscleGroupId(e.target.value)
                    setSelectedExerciseId('')
                  }}
                  required
                >
                  <option value="">Select a muscle group</option>
                  {muscleGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <Dialog.Root open={isMuscleGroupDialogOpen} onOpenChange={setIsMuscleGroupDialogOpen}>
                  <Dialog.Trigger asChild>
                    <button type="button" className={styles.secondaryButton}>
                      Add
                    </button>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className={styles.overlay} />
                    <Dialog.Content className={styles.dialogContent}>
                      <Dialog.Title className={styles.dialogTitle}>Add Muscle Group</Dialog.Title>
                      <Dialog.Description className={styles.dialogDescription}>
                        Enter the name of the new muscle group.
                      </Dialog.Description>
                      <div className={styles.dialogBody}>
                        <input
                          className={styles.input}
                          value={newMuscleGroupName}
                          onChange={(e) => setNewMuscleGroupName(e.target.value)}
                          placeholder="e.g. Back"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddMuscleGroup()
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
                            onClick={handleAddMuscleGroup}
                            className={styles.primaryButton}
                            disabled={isAddingMuscleGroup}
                          >
                            {isAddingMuscleGroup ? 'Adding...' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </div>

              <label htmlFor="exercise" className={`${styles.label} ${styles.labelWithSpacing}`}>
                Exercise
              </label>
              <div className={styles.selectRow}>
                <select
                  id="exercise"
                  className={styles.select}
                  value={selectedExerciseId}
                  onChange={(e) => setSelectedExerciseId(e.target.value)}
                  disabled={!selectedMuscleGroupId}
                  required
                >
                  <option value="">Select an exercise</option>
                  {filteredExercises.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </option>
                  ))}
                </select>
                <Dialog.Root open={isExerciseDialogOpen} onOpenChange={setIsExerciseDialogOpen}>
                  <Dialog.Trigger asChild>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      disabled={!selectedMuscleGroupId}
                    >
                      Add
                    </button>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className={styles.overlay} />
                    <Dialog.Content className={styles.dialogContent}>
                      <Dialog.Title className={styles.dialogTitle}>Add Exercise</Dialog.Title>
                      <Dialog.Description className={styles.dialogDescription}>
                        Add a new exercise to the selected muscle group.
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
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Workout Details</h2>
              <p className={styles.sectionDescription}>
                {isStrengthExercise
                  ? 'Set the number of sets, reps, and load for this exercise.'
                  : 'Set the distance and pace for this cardio exercise.'}
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
                    <p className={styles.repsHeading}>Reps Per Set (1-30)</p>
                    <div className={styles.repsGrid}>
                      {repsPerSet.map((rep, index) => (
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
                      />
                    ) : (
                      <div className={styles.emptyValue}>This exercise will be saved without a load value.</div>
                    )}
                  </div>
                </>
              ) : (
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
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="paceMinPerKm" className={styles.label}>
                      Pace (min/km)
                    </label>
                    <NumericStepper
                      id="paceMinPerKm"
                      inputClassName={styles.input}
                      value={paceMinPerKm}
                      min={MIN_PACE_MIN_PER_KM}
                      max={MAX_PACE_MIN_PER_KM}
                      step={PACE_STEP_MIN_PER_KM}
                      onChange={setPaceMinPerKm}
                      displayValue={formatPace(paceMinPerKm)}
                    />
                  </div>
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
              <input
                id="performedAt"
                className={styles.input}
                type="date"
                value={performedAt}
                onChange={(e) => setPerformedAt(e.target.value)}
                required
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
