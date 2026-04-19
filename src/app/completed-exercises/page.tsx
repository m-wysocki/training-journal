'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
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

type CompletedExerciseRow = {
  id: string
  exercise_id: string
  performed_at: string
  sets: number
  reps_per_set: number[]
  load_kg: number
  note: string | null
  exercise: {
    id: string
    name: string
    muscle_group_id: string
    muscle_group: {
      name: string
    } | null
  } | null
}

type DayGroup = {
  date: string
  entries: CompletedExerciseRow[]
}

const MIN_SETS = 1
const MAX_SETS = 5
const MIN_REPS = 1
const MAX_REPS = 30
const MIN_LOAD_KG = 2.5
const LOAD_STEP_KG = 0.5
const DEFAULT_REPS = 12

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))

export default function CompletedExercisesPage() {
  const [entries, setEntries] = useState<CompletedExerciseRow[]>([])
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [errorMessage, setErrorMessage] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editMuscleGroupId, setEditMuscleGroupId] = useState('')
  const [editExerciseId, setEditExerciseId] = useState('')
  const [editSets, setEditSets] = useState(3)
  const [editRepsPerSet, setEditRepsPerSet] = useState<number[]>([12, 12, 12])
  const [editLoadKg, setEditLoadKg] = useState(MIN_LOAD_KG)
  const [editNote, setEditNote] = useState('')
  const [editPerformedAt, setEditPerformedAt] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editFormError, setEditFormError] = useState('')

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadData = useCallback(() => {
    void Promise.all([
      supabase
        .from('completed_exercises')
        .select(
          `
        id,
        exercise_id,
        performed_at,
        sets,
        reps_per_set,
        load_kg,
        note,
        exercise:exercises (
          id,
          name,
          muscle_group_id,
          muscle_group:muscle_groups (
            name
          )
        )
      `,
        )
        .order('performed_at', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('muscle_groups').select('id, name').order('created_at'),
      supabase.from('exercises').select('id, name, muscle_group_id').order('created_at'),
    ]).then(([completedResult, groupsResult, exercisesResult]) => {
      if (completedResult.error || groupsResult.error || exercisesResult.error) {
        setErrorMessage('Nie udało się pobrać danych.')
        return
      }

      setErrorMessage('')
      setEntries((completedResult.data as CompletedExerciseRow[]) || [])
      setMuscleGroups(groupsResult.data || [])
      setExercises(exercisesResult.data || [])
    })
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredEditExercises = useMemo(
    () => exercises.filter((ex) => ex.muscle_group_id === editMuscleGroupId),
    [exercises, editMuscleGroupId],
  )

  const groupedByDate = useMemo<DayGroup[]>(() => {
    const map = new Map<string, CompletedExerciseRow[]>()

    entries.forEach((entry) => {
      const current = map.get(entry.performed_at) || []
      map.set(entry.performed_at, [...current, entry])
    })

    return Array.from(map.entries()).map(([date, dayEntries]) => ({
      date,
      entries: dayEntries,
    }))
  }, [entries])

  const handleEditSetsChange = (value: string) => {
    const parsed = Number(value)
    const nextSets = Number.isNaN(parsed) ? MIN_SETS : Math.min(MAX_SETS, Math.max(MIN_SETS, parsed))

    setEditSets(nextSets)
    setEditRepsPerSet((current) => {
      if (nextSets <= current.length) {
        return current.slice(0, nextSets)
      }

      return [...current, ...Array.from({ length: nextSets - current.length }, () => DEFAULT_REPS)]
    })
  }

  const handleEditRepChange = (index: number, value: string) => {
    const parsed = Number(value)
    const nextRep = Number.isNaN(parsed) ? MIN_REPS : parsed

    setEditRepsPerSet((current) =>
      current.map((rep, currentIndex) => (currentIndex === index ? nextRep : rep)),
    )
  }

  const openEdit = (entry: CompletedExerciseRow) => {
    const exerciseRow =
      exercises.find((ex) => ex.id === entry.exercise_id) ?? entry.exercise ?? null
    const muscleGroupId = exerciseRow?.muscle_group_id ?? ''

    setEditingEntryId(entry.id)
    setEditMuscleGroupId(muscleGroupId)
    setEditExerciseId(entry.exercise_id)
    setEditSets(entry.sets)
    setEditRepsPerSet([...entry.reps_per_set])
    setEditLoadKg(Number(entry.load_kg))
    setEditNote(entry.note ?? '')
    setEditPerformedAt(entry.performed_at)
    setEditFormError('')
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditingEntryId(null)
    setEditFormError('')
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingEntryId) return

    setEditFormError('')

    if (!editMuscleGroupId || !editExerciseId) {
      setEditFormError('Wybierz partię i ćwiczenie.')
      return
    }

    const hasInvalidReps = editRepsPerSet.some((rep) => rep < MIN_REPS || rep > MAX_REPS)
    const hasInvalidLoad =
      editLoadKg < MIN_LOAD_KG || !Number.isInteger(editLoadKg / LOAD_STEP_KG)

    if (
      editSets < MIN_SETS ||
      editSets > MAX_SETS ||
      hasInvalidReps ||
      editRepsPerSet.length !== editSets ||
      hasInvalidLoad
    ) {
      setEditFormError('Sprawdź zakres serii, powtórzeń i obciążenia.')
      return
    }

    setEditSaving(true)

    const { error } = await supabase
      .from('completed_exercises')
      .update({
        exercise_id: editExerciseId,
        sets: editSets,
        reps_per_set: editRepsPerSet,
        load_kg: editLoadKg,
        note: editNote.trim(),
        performed_at: editPerformedAt,
      })
      .eq('id', editingEntryId)

    setEditSaving(false)

    if (error) {
      setEditFormError('Nie udało się zapisać zmian.')
      return
    }

    closeEdit()
    loadData()
  }

  const openDelete = (id: string) => {
    setDeletingEntryId(id)
    setDeleteOpen(true)
  }

  const closeDelete = () => {
    setDeleteOpen(false)
    setDeletingEntryId(null)
  }

  const confirmDelete = async () => {
    if (!deletingEntryId) return

    setDeleteLoading(true)

    const { error } = await supabase.from('completed_exercises').delete().eq('id', deletingEntryId)

    setDeleteLoading(false)

    if (error) {
      setErrorMessage('Nie udało się usunąć wpisu.')
      closeDelete()
      return
    }

    setEntries((prev) => prev.filter((row) => row.id !== deletingEntryId))
    closeDelete()
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/" className={styles.backLink}>
            ← Back to Home
          </Link>
          <h1 className={styles.title}>Wykonane ćwiczenia</h1>
          <p className={styles.description}>Podgląd wpisów pogrupowanych po dacie treningu.</p>
        </div>

        {errorMessage && <div className={styles.errorBox}>{errorMessage}</div>}

        {!errorMessage && groupedByDate.length === 0 && (
          <div className={styles.emptyState}>Brak zapisanych ćwiczeń.</div>
        )}

        <div className={styles.daysList}>
          {groupedByDate.map((group) => (
            <section key={group.date} className={styles.dayCard}>
              <h2 className={styles.dayTitle}>{formatDate(group.date)}</h2>
              <ul className={styles.entriesList}>
                {group.entries.map((entry) => (
                  <li key={entry.id} className={styles.entryItem}>
                    <div className={styles.entryRow}>
                      <div className={styles.entryMain}>
                        <div className={styles.entryTop}>
                          <p className={styles.exerciseName}>
                            {entry.exercise?.name || 'Nieznane ćwiczenie'}
                          </p>
                          <p className={styles.muscleGroupName}>
                            {entry.exercise?.muscle_group?.name || 'Nieznana partia'}
                          </p>
                        </div>
                        <p className={styles.entryDetails}>
                          Serie: {entry.sets} | Powtórzenia: {entry.reps_per_set.join(' / ')} |
                          Obciążenie: {Number(entry.load_kg)} kg
                        </p>
                        {entry.note?.trim() ? (
                          <p className={styles.entryNote}>{entry.note.trim()}</p>
                        ) : null}
                      </div>

                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button type="button" className={styles.menuTrigger} aria-label="Opcje">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 15 15"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className={styles.menuIcon}
                            >
                              <path
                                d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z"
                                fill="currentColor"
                                fillRule="evenodd"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content className={styles.menuContent} align="end">
                            <DropdownMenu.Item
                              className={styles.menuItem}
                              onSelect={() => openEdit(entry)}
                            >
                              Edytuj
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              className={styles.menuItemDanger}
                              onSelect={() => openDelete(entry.id)}
                            >
                              Usuń
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <Dialog.Root open={editOpen} onOpenChange={(open) => !open && closeEdit()}>
          <Dialog.Portal>
            <Dialog.Overlay className={styles.overlay} />
            <Dialog.Content className={styles.dialogContent}>
              <Dialog.Title className={styles.dialogTitle}>Edytuj wpis</Dialog.Title>
              <Dialog.Description className={styles.dialogDescription}>
                Zmień partię, ćwiczenie, serie, powtórzenia, obciążenie, datę lub notatkę.
              </Dialog.Description>
              <form onSubmit={handleEditSubmit} className={styles.dialogForm}>
                <label htmlFor="editMuscleGroup" className={styles.label}>
                  Partia
                </label>
                <select
                  id="editMuscleGroup"
                  className={styles.select}
                  value={editMuscleGroupId}
                  onChange={(e) => {
                    setEditMuscleGroupId(e.target.value)
                    setEditExerciseId('')
                  }}
                  required
                >
                  <option value="">Wybierz partię</option>
                  {muscleGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>

                <label htmlFor="editExercise" className={styles.label}>
                  Ćwiczenie
                </label>
                <select
                  id="editExercise"
                  className={styles.select}
                  value={editExerciseId}
                  onChange={(e) => setEditExerciseId(e.target.value)}
                  disabled={!editMuscleGroupId}
                  required
                >
                  <option value="">Wybierz ćwiczenie</option>
                  {filteredEditExercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>

                <div className={styles.field}>
                  <label htmlFor="editSets" className={styles.label}>
                    Serie (1–5)
                  </label>
                  <input
                    id="editSets"
                    className={styles.input}
                    type="number"
                    min={MIN_SETS}
                    max={MAX_SETS}
                    value={editSets}
                    onChange={(e) => handleEditSetsChange(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <p className={styles.label}>Powtórzenia na serię (1–30)</p>
                  <div className={styles.repsGrid}>
                    {editRepsPerSet.map((rep, index) => (
                      <div key={`edit-rep-${index}`} className={styles.field}>
                        <label htmlFor={`edit-rep-${index}`} className={styles.label}>
                          Seria {index + 1}
                        </label>
                        <input
                          id={`edit-rep-${index}`}
                          className={styles.input}
                          type="number"
                          min={MIN_REPS}
                          max={MAX_REPS}
                          value={rep}
                          onChange={(e) => handleEditRepChange(index, e.target.value)}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="editLoadKg" className={styles.label}>
                    Obciążenie (kg)
                  </label>
                  <input
                    id="editLoadKg"
                    className={styles.input}
                    type="number"
                    min={MIN_LOAD_KG}
                    step={LOAD_STEP_KG}
                    value={editLoadKg}
                    onChange={(e) => setEditLoadKg(Number(e.target.value))}
                    required
                  />
                </div>

                <label htmlFor="editPerformedAt" className={styles.label}>
                  Data
                </label>
                <input
                  id="editPerformedAt"
                  className={styles.input}
                  type="date"
                  value={editPerformedAt}
                  onChange={(e) => setEditPerformedAt(e.target.value)}
                  required
                />

                <label htmlFor="editNote" className={styles.label}>
                  Notatka
                </label>
                <textarea
                  id="editNote"
                  className={`${styles.input} ${styles.textarea}`}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={3}
                  placeholder="Opcjonalnie: jak poszło trening, odczucia…"
                />

                {editFormError && <div className={styles.formError}>{editFormError}</div>}

                <div className={styles.dialogActions}>
                  <Dialog.Close asChild>
                    <button type="button" className={styles.ghostButton}>
                      Anuluj
                    </button>
                  </Dialog.Close>
                  <button type="submit" className={styles.primaryButton} disabled={editSaving}>
                    {editSaving ? 'Zapisywanie…' : 'Zapisz'}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <Dialog.Root open={deleteOpen} onOpenChange={(open) => !open && closeDelete()}>
          <Dialog.Portal>
            <Dialog.Overlay className={styles.overlay} />
            <Dialog.Content className={styles.dialogContentSmall}>
              <Dialog.Title className={styles.dialogTitle}>Usunąć wpis?</Dialog.Title>
              <Dialog.Description className={styles.dialogDescription}>
                Tej operacji nie da się cofnąć.
              </Dialog.Description>
              <div className={styles.dialogActions}>
                <Dialog.Close asChild>
                  <button type="button" className={styles.ghostButton}>
                    Anuluj
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  className={styles.dangerButton}
                  disabled={deleteLoading}
                  onClick={() => void confirmDelete()}
                >
                  {deleteLoading ? 'Usuwanie…' : 'Usuń'}
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  )
}
