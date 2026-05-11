'use client'

import { useState } from 'react'
import {
  addExercise as addExerciseAction,
  deleteExercise as deleteExerciseAction,
  updateExercise as updateExerciseAction,
} from '@/lib/actions/exerciseSetupActions'
import { DEFAULT_EXERCISE_TYPE } from '@/lib/exerciseTypeOptions'
import type { ExerciseType } from '@/lib/exerciseTypes'

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

type UseExerciseCategoryManagerParams = {
  exerciseCategoryId: string
  initialCategory: ExerciseCategory
}

export function useExerciseCategoryManager({
  exerciseCategoryId,
  initialCategory,
}: UseExerciseCategoryManagerParams) {
  const [category, setCategory] = useState<ExerciseCategory>(initialCategory)
  const [addDialog, setAddDialog] = useState({
    open: false,
    name: '',
    exerciseType: DEFAULT_EXERCISE_TYPE as ExerciseType,
  })
  const [editDialog, setEditDialog] = useState({
    open: false,
    editingExercise: null as Exercise | null,
    name: '',
    exerciseType: DEFAULT_EXERCISE_TYPE as ExerciseType,
  })
  const [feedback, setFeedback] = useState({
    message: '',
    isError: false,
  })
  const [pending, setPending] = useState({
    isAdding: false,
    updatingExerciseId: null as string | null,
    deletingExerciseId: null as string | null,
  })
  const resetFeedback = () => {
    setFeedback({ message: '', isError: false })
  }

  const setErrorFeedback = (message: string) => {
    setFeedback({ message, isError: true })
  }

  const setPendingAdding = (isAdding: boolean) => {
    setPending((current) => ({ ...current, isAdding }))
  }

  const setPendingUpdating = (updatingExerciseId: string | null) => {
    setPending((current) => ({ ...current, updatingExerciseId }))
  }

  const setPendingDeleting = (deletingExerciseId: string | null) => {
    setPending((current) => ({ ...current, deletingExerciseId }))
  }

  const addExercise = async () => {
    const trimmedName = addDialog.name.trim()

    if (!trimmedName) return

    resetFeedback()
    setPendingAdding(true)

    const result = await addExerciseAction(exerciseCategoryId, trimmedName, addDialog.exerciseType)
    setPendingAdding(false)

    if (result.error) {
      setErrorFeedback(result.error)
      return
    }

    setAddDialog({
      open: false,
      name: '',
      exerciseType: DEFAULT_EXERCISE_TYPE,
    })
    setFeedback({ message: `Added exercise: ${trimmedName}.`, isError: false })
    setCategory((current) =>
      current && result.data
        ? { ...current, exercises: [...current.exercises, result.data] }
        : current,
    )
  }

  const deleteExercise = async (id: string) => {
    const deletedExerciseName = category.exercises.find((exercise) => exercise.id === id)?.name

    resetFeedback()
    setPendingDeleting(id)

    const result = await deleteExerciseAction(id, exerciseCategoryId)
    setPendingDeleting(null)

    if (result.error) {
      setErrorFeedback(result.error)
      return
    }

    setCategory((current) =>
      current ? { ...current, exercises: current.exercises.filter((exercise) => exercise.id !== id) } : current,
    )
    setFeedback({
      message: deletedExerciseName ? `Deleted exercise: ${deletedExerciseName}.` : 'Deleted exercise.',
      isError: false,
    })
  }

  const openEditExercise = (exercise: Exercise) => {
    setEditDialog({
      open: true,
      editingExercise: exercise,
      name: exercise.name,
      exerciseType: exercise.exercise_type,
    })
    resetFeedback()
  }

  const updateExercise = async () => {
    const trimmedName = editDialog.name.trim()
    const editingExercise = editDialog.editingExercise

    if (!editingExercise || !trimmedName) return

    resetFeedback()
    setPendingUpdating(editingExercise.id)

    const result = await updateExerciseAction(
      editingExercise.id,
      exerciseCategoryId,
      trimmedName,
      editDialog.exerciseType,
    )
    setPendingUpdating(null)

    if (result.error) {
      setErrorFeedback(result.error)
      return
    }

    setEditDialog({
      open: false,
      editingExercise: null,
      name: '',
      exerciseType: DEFAULT_EXERCISE_TYPE,
    })
    setFeedback({ message: `Updated exercise: ${trimmedName}.`, isError: false })
    setCategory((current) =>
      current
        ? {
            ...current,
            exercises: current.exercises.map((exercise) =>
              exercise.id === editingExercise.id
                ? { ...exercise, name: trimmedName, exercise_type: editDialog.exerciseType }
                : exercise,
            ),
          }
        : current,
    )
  }

  return {
    category,
    addDialog,
    setAddDialog,
    editDialog,
    setEditDialog,
    feedback,
    pending,
    addExercise,
    deleteExercise,
    openEditExercise,
    updateExercise,
  }
}
