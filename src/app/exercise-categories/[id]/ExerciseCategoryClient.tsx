'use client'

import { useState } from 'react'
import BackLink from '@/components/BackLink'
import FormDialog from '@/components/FormDialog'
import OverflowMenu from '@/components/OverflowMenu'
import PageContainer from '@/components/PageContainer'
import PageHeader from '@/components/PageHeader'
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
        <BackLink href="/exercise-categories" label="Back to Exercise Categories" />
        <PageHeader
          title={category.name}
        />

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

        <FormDialog
          open={open}
          onOpenChange={setOpen}
          title="Add Exercise"
          description="Enter the name of the exercise you want to add."
          trigger={<button className={styles.ExerciseCategoryPrimaryButton}>Add Exercise</button>}
          primaryActionLabel={isAdding ? 'Adding...' : 'Add'}
          onPrimaryAction={addExercise}
          primaryActionDisabled={isAdding}
        >
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
          </div>
        </FormDialog>

        <FormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          title="Edit Exercise"
          description="Update the exercise name and type."
          primaryActionLabel={updatingExerciseId === editingExercise?.id ? 'Saving...' : 'Save'}
          onPrimaryAction={updateExercise}
          primaryActionDisabled={updatingExerciseId === editingExercise?.id}
        >
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
          </div>
        </FormDialog>
    </PageContainer>
  )
}
