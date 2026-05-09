'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import BackLink from '@/components/BackLink'
import OverflowMenu from '@/components/OverflowMenu'
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
    <div className={styles.ExerciseCategoryLoading}>
      <p className={styles.ExerciseCategoryLoadingText}>Loading…</p>
    </div>
  )

  return (
    <PageContainer className={styles.ExerciseCategoryContainer}>
        <div className={styles.ExerciseCategoryHeader}>
          <BackLink href="/exercise-categories" label="← Back to Exercise Categories" />
          <h1 className={styles.ExerciseCategoryTitle}>{category.name}</h1>
        </div>

        {message && (
          <StatusPanel variant={isError ? 'error' : 'success'} withBottomSpacing>
            {message}
          </StatusPanel>
        )}

        {category.exercises.length === 0 ? (
          <div className={styles.ExerciseCategoryEmptyState}>
            <p className={styles.ExerciseCategoryEmptyText}>No exercises yet</p>
          </div>
        ) : (
          <ul className={styles.ExerciseCategoryList}>
            {category.exercises.map((exercise) => (
              <li
                key={exercise.id}
                className={styles.ExerciseCategoryListItem}
              >
                <span className={styles.ExerciseCategoryExerciseName}>
                  {exercise.name}
                </span>
                <OverflowMenu
                  ariaLabel={`Options for ${exercise.name}`}
                  items={[
                    {
                      key: 'edit',
                      label: 'Edit',
                      onSelect: () => openEditExercise(exercise),
                    },
                    {
                      key: 'delete',
                      label: deletingExerciseId === exercise.id ? 'Deleting...' : 'Delete',
                      danger: true,
                      disabled: deletingExerciseId === exercise.id,
                      onSelect: () => deleteExercise(exercise.id),
                    },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className={styles.ExerciseCategoryPrimaryButton}>
              Add Exercise
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className={styles.ExerciseCategoryOverlay} />
            <Dialog.Content className={styles.ExerciseCategoryDialogContent}>
              <Dialog.Title className={styles.ExerciseCategoryDialogTitle}>
                Add Exercise
              </Dialog.Title>
              <Dialog.Description className={styles.ExerciseCategoryDialogDescription}>
                Enter the name of the exercise you want to add.
              </Dialog.Description>
              <div className={styles.ExerciseCategoryDialogBody}>
                <input
                  className={styles.ExerciseCategoryInput}
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
                  className={styles.ExerciseCategoryInput}
                  value={newExerciseType}
                  onChange={(e) => setNewExerciseType(e.target.value as ExerciseType)}
                >
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                  <option value="duration">Duration only</option>
                </select>
                <div className={styles.ExerciseCategoryDialogActions}>
                  <Dialog.Close asChild>
                    <button className={styles.ExerciseCategoryGhostButton}>
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="button"
                    onClick={addExercise}
                    className={styles.ExerciseCategoryPrimaryButton}
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
            <Dialog.Overlay className={styles.ExerciseCategoryOverlay} />
            <Dialog.Content className={styles.ExerciseCategoryDialogContent}>
              <Dialog.Title className={styles.ExerciseCategoryDialogTitle}>
                Edit Exercise
              </Dialog.Title>
              <Dialog.Description className={styles.ExerciseCategoryDialogDescription}>
                Update the exercise name and type.
              </Dialog.Description>
              <div className={styles.ExerciseCategoryDialogBody}>
                <input
                  className={styles.ExerciseCategoryInput}
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
                  className={styles.ExerciseCategoryInput}
                  value={editExerciseType}
                  onChange={(e) => setEditExerciseType(e.target.value as ExerciseType)}
                >
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                  <option value="duration">Duration only</option>
                </select>
                <div className={styles.ExerciseCategoryDialogActions}>
                  <Dialog.Close asChild>
                    <button type="button" className={styles.ExerciseCategoryGhostButton}>
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="button"
                    onClick={updateExercise}
                    className={styles.ExerciseCategoryPrimaryButton}
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
