'use client'

import { Ellipsis } from 'lucide-react'
import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import StatusPanel from '@/components/StatusPanel'
import {
  addExercise as addExerciseAction,
  deleteExercise as deleteExerciseAction,
  updateExercise as updateExerciseAction,
} from '@/lib/actions/exerciseSetupActions'
import type { ExerciseType } from '@/lib/exerciseTypes'
import styles from './page.module.scss'

export type Exercise = {
  id: string
  name: string
  exercise_type: ExerciseType
}

export type ExerciseCategory = {
  id: string
  name: string
  exercises: Exercise[]
}

type ExerciseCategoryClientProps = {
  exerciseCategoryId: string
  initialCategory: ExerciseCategory
}

export default function ExerciseCategoryClient({
  exerciseCategoryId,
  initialCategory,
}: ExerciseCategoryClientProps) {
  const [category, setCategory] = useState<ExerciseCategory>(initialCategory)
  const [newExercise, setNewExercise] = useState('')
  const [newExerciseType, setNewExerciseType] = useState<ExerciseType>('strength')
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [editExerciseName, setEditExerciseName] = useState('')
  const [editExerciseType, setEditExerciseType] = useState<ExerciseType>('strength')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [updatingExerciseId, setUpdatingExerciseId] = useState<string | null>(null)
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null)

  const addExercise = async () => {
    const trimmedName = newExercise.trim()

    if (!trimmedName) return

    setMessage('')
    setIsError(false)
    setIsAdding(true)

    const result = await addExerciseAction(exerciseCategoryId, trimmedName, newExerciseType)
    setIsAdding(false)

    if (result.error) {
      setIsError(true)
      setMessage(result.error)
      return
    }

    setNewExercise('')
    setNewExerciseType('strength')
    setOpen(false)
    setMessage(`Added exercise: ${trimmedName}.`)
    setCategory((current) =>
      current && result.data
        ? { ...current, exercises: [...current.exercises, result.data] }
        : current,
    )
  }

  const deleteExercise = async (id: string) => {
    setMessage('')
    setIsError(false)
    setDeletingExerciseId(id)

    const result = await deleteExerciseAction(id, exerciseCategoryId)
    setDeletingExerciseId(null)

    if (result.error) {
      setIsError(true)
      setMessage(result.error)
      return
    }

    setCategory((current) =>
      current ? { ...current, exercises: current.exercises.filter((exercise) => exercise.id !== id) } : current,
    )
  }

  const openEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise)
    setEditExerciseName(exercise.name)
    setEditExerciseType(exercise.exercise_type)
    setEditOpen(true)
    setMessage('')
    setIsError(false)
  }

  const updateExercise = async () => {
    const trimmedName = editExerciseName.trim()

    if (!editingExercise || !trimmedName) return

    setMessage('')
    setIsError(false)
    setUpdatingExerciseId(editingExercise.id)

    const result = await updateExerciseAction(
      editingExercise.id,
      exerciseCategoryId,
      trimmedName,
      editExerciseType,
    )
    setUpdatingExerciseId(null)

    if (result.error) {
      setIsError(true)
      setMessage(result.error)
      return
    }

    setEditOpen(false)
    setEditingExercise(null)
    setEditExerciseName('')
    setEditExerciseType('strength')
    setMessage(`Updated exercise: ${trimmedName}.`)
    setCategory((current) =>
      current
        ? {
            ...current,
            exercises: current.exercises.map((exercise) =>
              exercise.id === editingExercise.id
                ? { ...exercise, name: trimmedName, exercise_type: editExerciseType }
                : exercise,
            ),
          }
        : current,
    )
  }

  if (!category) return (
    <div className={styles.loading}>
      <p className={styles.loadingText}>Loading…</p>
    </div>
  )

  return (
    <PageContainer className={styles.container}>
        <div className={styles.header}>
          <BackLink href="/exercise-categories" label="← Back to Exercise Categories" />
          <h1 className={styles.title}>{category.name}</h1>
        </div>

        {message && (
          <StatusPanel variant={isError ? 'error' : 'success'} withBottomSpacing>
            {message}
          </StatusPanel>
        )}

        {category.exercises.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No exercises yet</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {category.exercises.map((exercise) => (
              <li
                key={exercise.id}
                className={styles.listItem}
              >
                <span className={styles.exerciseName}>
                  {exercise.name}
                </span>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      className={styles.menuTrigger}
                      aria-label="Options"
                    >
                      <Ellipsis size={16} strokeWidth={2} className={styles.menuIcon} aria-hidden="true" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content className={styles.menuContent}>
                      <DropdownMenu.Item
                        className={styles.menuItem}
                        onSelect={() => openEditExercise(exercise)}
                      >
                        Edit
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className={styles.menuItemDanger}
                        disabled={deletingExerciseId === exercise.id}
                        onSelect={() => deleteExercise(exercise.id)}
                      >
                        {deletingExerciseId === exercise.id ? 'Deleting...' : 'Delete'}
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </li>
            ))}
          </ul>
        )}

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className={styles.primaryButton}>
              Add Exercise
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className={styles.overlay} />
            <Dialog.Content className={styles.dialogContent}>
              <Dialog.Title className={styles.dialogTitle}>
                Add Exercise
              </Dialog.Title>
              <Dialog.Description className={styles.dialogDescription}>
                Enter the name of the exercise you want to add.
              </Dialog.Description>
              <div className={styles.dialogBody}>
                <input
                  className={styles.input}
                  placeholder="e.g. Biceps Curls"
                  value={newExercise}
                  onChange={(e) => setNewExercise(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addExercise()
                    }
                  }}
                />
                <select
                  className={styles.input}
                  value={newExerciseType}
                  onChange={(e) => setNewExerciseType(e.target.value as ExerciseType)}
                >
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                  <option value="duration">Duration only</option>
                </select>
                <div className={styles.dialogActions}>
                  <Dialog.Close asChild>
                    <button className={styles.ghostButton}>
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="button"
                    onClick={addExercise}
                    className={styles.primaryButton}
                    disabled={isAdding}
                  >
                    {isAdding ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className={styles.overlay} />
            <Dialog.Content className={styles.dialogContent}>
              <Dialog.Title className={styles.dialogTitle}>
                Edit Exercise
              </Dialog.Title>
              <Dialog.Description className={styles.dialogDescription}>
                Update the exercise name and type.
              </Dialog.Description>
              <div className={styles.dialogBody}>
                <input
                  className={styles.input}
                  placeholder="e.g. Biceps Curls"
                  value={editExerciseName}
                  onChange={(e) => setEditExerciseName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateExercise()
                    }
                  }}
                />
                <select
                  className={styles.input}
                  value={editExerciseType}
                  onChange={(e) => setEditExerciseType(e.target.value as ExerciseType)}
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
                    onClick={updateExercise}
                    className={styles.primaryButton}
                    disabled={updatingExerciseId === editingExercise?.id}
                  >
                    {updatingExerciseId === editingExercise?.id ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
    </PageContainer>
  )
}
