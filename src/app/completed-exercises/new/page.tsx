'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import * as Dialog from '@radix-ui/react-dialog'
import { supabase } from '@/lib/supabase'
import styles from './page.module.scss'

type MuscleGroup = {
  id: string
  name: string
}

type Exercise = {
  id: string
  name: string
  muscle_group_id: string
}

const MIN_SETS = 1
const MAX_SETS = 5
const MIN_REPS = 1
const MAX_REPS = 30
const MIN_LOAD_KG = 2.5
const LOAD_STEP_KG = 0.5
const DEFAULT_SETS = 3
const DEFAULT_REPS = 12
const DEFAULT_LOAD_KG = 2.5

const today = new Date().toISOString().split('T')[0]

export default function NewCompletedExercisePage() {
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState('')
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [newMuscleGroupName, setNewMuscleGroupName] = useState('')
  const [newExerciseName, setNewExerciseName] = useState('')
  const [sets, setSets] = useState(DEFAULT_SETS)
  const [repsPerSet, setRepsPerSet] = useState<number[]>(
    Array.from({ length: DEFAULT_SETS }, () => DEFAULT_REPS),
  )
  const [loadKg, setLoadKg] = useState(DEFAULT_LOAD_KG)
  const [note, setNote] = useState('')
  const [performedAt, setPerformedAt] = useState(today)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isAddingMuscleGroup, setIsAddingMuscleGroup] = useState(false)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [isMuscleGroupDialogOpen, setIsMuscleGroupDialogOpen] = useState(false)
  const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false)

  const loadReferenceData = async () => {
    const [groupsResult, exercisesResult] = await Promise.all([
      supabase.from('muscle_groups').select('id, name').order('created_at'),
      supabase.from('exercises').select('id, name, muscle_group_id').order('created_at'),
    ])

    return {
      groupsResult,
      exercisesResult,
    }
  }

  useEffect(() => {
    let isActive = true

    loadReferenceData().then(({ groupsResult, exercisesResult }) => {
      if (!isActive) return

      if (groupsResult.error || exercisesResult.error) {
        setIsError(true)
        setMessage('Nie udało się pobrać danych. Spróbuj ponownie.')
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
      setMessage('Podaj nazwę partii.')
      return
    }

    setIsAddingMuscleGroup(true)
    setMessage('')
    setIsError(false)

    const { data, error } = await supabase
      .from('muscle_groups')
      .insert({ name: trimmedName })
      .select('id, name')
      .single()

    setIsAddingMuscleGroup(false)

    if (error || !data) {
      setIsError(true)
      setMessage('Nie udało się dodać partii.')
      return
    }

    setMuscleGroups((current) => [...current, data])
    setSelectedMuscleGroupId(data.id)
    setSelectedExerciseId('')
    setNewMuscleGroupName('')
    setIsMuscleGroupDialogOpen(false)
    setMessage(`Dodano partię: ${data.name}.`)
  }

  const handleAddExercise = async () => {
    const trimmedName = newExerciseName.trim()

    if (!selectedMuscleGroupId) {
      setIsError(true)
      setMessage('Najpierw wybierz partię mięśniową.')
      return
    }

    if (!trimmedName) {
      setIsError(true)
      setMessage('Podaj nazwę ćwiczenia.')
      return
    }

    setIsAddingExercise(true)
    setMessage('')
    setIsError(false)

    const { data, error } = await supabase
      .from('exercises')
      .insert({
        name: trimmedName,
        muscle_group_id: selectedMuscleGroupId,
      })
      .select('id, name, muscle_group_id')
      .single()

    setIsAddingExercise(false)

    if (error || !data) {
      setIsError(true)
      setMessage('Nie udało się dodać ćwiczenia.')
      return
    }

    setExercises((current) => [...current, data])
    setSelectedExerciseId(data.id)
    setNewExerciseName('')
    setIsExerciseDialogOpen(false)
    setMessage(`Dodano ćwiczenie: ${data.name}.`)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')
    setIsError(false)

    if (!selectedMuscleGroupId || !selectedExerciseId) {
      setIsError(true)
      setMessage('Wybierz partię i ćwiczenie.')
      return
    }

    const hasInvalidReps = repsPerSet.some((rep) => rep < MIN_REPS || rep > MAX_REPS)
    const hasInvalidLoad = loadKg < MIN_LOAD_KG || !Number.isInteger(loadKg / LOAD_STEP_KG)

    if (
      sets < MIN_SETS ||
      sets > MAX_SETS ||
      hasInvalidReps ||
      repsPerSet.length !== sets ||
      hasInvalidLoad
    ) {
      setIsError(true)
      setMessage('Sprawdź zakres serii, powtórzeń i obciążenia.')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('completed_exercises').insert({
      exercise_id: selectedExerciseId,
      sets,
      reps_per_set: repsPerSet,
      load_kg: loadKg,
      note: note.trim(),
      performed_at: performedAt,
    })

    setLoading(false)

    if (error) {
      setIsError(true)
      if (error.message.includes("Could not find the table 'public.completed_exercises'")) {
        setMessage('Brakuje tabeli completed_exercises w bazie. Dodaj ją w SQL Editor w Supabase.')
      } else {
        setMessage('Nie udało się zapisać ćwiczenia. Sprawdź konfigurację bazy.')
      }
      return
    }

    setSets(DEFAULT_SETS)
    setRepsPerSet(Array.from({ length: DEFAULT_SETS }, () => DEFAULT_REPS))
    setLoadKg(DEFAULT_LOAD_KG)
    setNote('')
    setPerformedAt(today)
    setSelectedMuscleGroupId('')
    setSelectedExerciseId('')
    setMessage('Zapisano wykonane ćwiczenie.')
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/" className={styles.backLink}>
            ← Back to Home
          </Link>
          <h1 className={styles.title}>Dodaj wykonane ćwiczenie</h1>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="muscleGroup" className={styles.label}>
            Partia
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
              <option value="">Wybierz partię</option>
              {muscleGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <Dialog.Root open={isMuscleGroupDialogOpen} onOpenChange={setIsMuscleGroupDialogOpen}>
              <Dialog.Trigger asChild>
                <button type="button" className={styles.secondaryButton}>
                  Dodaj
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className={styles.overlay} />
                <Dialog.Content className={styles.dialogContent}>
                  <Dialog.Title className={styles.dialogTitle}>Dodaj partię</Dialog.Title>
                  <Dialog.Description className={styles.dialogDescription}>
                    Wpisz nazwę nowej partii mięśniowej.
                  </Dialog.Description>
                  <div className={styles.dialogBody}>
                    <input
                      className={styles.input}
                      value={newMuscleGroupName}
                      onChange={(e) => setNewMuscleGroupName(e.target.value)}
                      placeholder="np. Plecy"
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
                          Anuluj
                        </button>
                      </Dialog.Close>
                      <button
                        type="button"
                        onClick={handleAddMuscleGroup}
                        className={styles.primaryButton}
                        disabled={isAddingMuscleGroup}
                      >
                        {isAddingMuscleGroup ? 'Dodawanie...' : 'Dodaj'}
                      </button>
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>

          <label htmlFor="exercise" className={styles.label}>
            Ćwiczenie
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
              <option value="">Wybierz ćwiczenie</option>
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
                  Dodaj
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className={styles.overlay} />
                <Dialog.Content className={styles.dialogContent}>
                  <Dialog.Title className={styles.dialogTitle}>Dodaj ćwiczenie</Dialog.Title>
                  <Dialog.Description className={styles.dialogDescription}>
                    Dodaj nowe ćwiczenie do wybranej partii.
                  </Dialog.Description>
                  <div className={styles.dialogBody}>
                    <input
                      className={styles.input}
                      value={newExerciseName}
                      onChange={(e) => setNewExerciseName(e.target.value)}
                      placeholder="np. Wiosłowanie sztangą"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddExercise()
                        }
                      }}
                    />
                    <div className={styles.dialogActions}>
                      <Dialog.Close asChild>
                        <button type="button" className={styles.ghostButton}>
                          Anuluj
                        </button>
                      </Dialog.Close>
                      <button
                        type="button"
                        onClick={handleAddExercise}
                        className={styles.primaryButton}
                        disabled={isAddingExercise}
                      >
                        {isAddingExercise ? 'Dodawanie...' : 'Dodaj'}
                      </button>
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>

          <div className={styles.field}>
            <label htmlFor="sets" className={styles.label}>
              Serie (1-5)
            </label>
            <input
              id="sets"
              className={styles.input}
              type="number"
              min={MIN_SETS}
              max={MAX_SETS}
              value={sets}
              onChange={(e) => handleSetsChange(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <p className={styles.label}>Powtórzenia na serię (1-30)</p>
            <div className={styles.repsGrid}>
              {repsPerSet.map((rep, index) => (
                <div key={`rep-${index}`} className={styles.field}>
                  <label htmlFor={`rep-${index}`} className={styles.label}>
                    Seria {index + 1}
                  </label>
                  <input
                    id={`rep-${index}`}
                    className={styles.input}
                    type="number"
                    min={MIN_REPS}
                    max={MAX_REPS}
                    value={rep}
                    onChange={(e) => handleRepChange(index, e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="loadKg" className={styles.label}>
              Obciążenie (kg)
            </label>
            <input
              id="loadKg"
              className={styles.input}
              type="number"
              min={MIN_LOAD_KG}
              step={LOAD_STEP_KG}
              value={loadKg}
              onChange={(e) => setLoadKg(Number(e.target.value))}
              required
            />
          </div>

          <label htmlFor="performedAt" className={styles.label}>
            Data
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
            Notatka
          </label>
          <textarea
            id="note"
            className={`${styles.input} ${styles.textarea}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Opcjonalnie: jak poszło trening, odczucia…"
          />

          {message && (
            <div className={isError ? styles.messageError : styles.messageSuccess}>
              {message}
            </div>
          )}

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Zapisywanie...' : 'Zapisz ćwiczenie'}
          </button>
        </form>
      </div>
    </div>
  )
}
