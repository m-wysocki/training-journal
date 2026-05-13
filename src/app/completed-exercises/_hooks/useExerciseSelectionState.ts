'use client'

import { useMemo, useState } from 'react'
import {
  addExercise,
  addExerciseCategory,
} from '@/lib/actions/exerciseSetupActions'
import type { ExerciseType } from '@/lib/exerciseTypes'
import type { Exercise, ExerciseCategory } from '../_helpers/completedExerciseForm.types'

type Params = {
  initialExerciseCategories: ExerciseCategory[]
  initialExercises: Exercise[]
  initialExerciseCategoryId: string
  initialExerciseId: string
  onStatus: (isError: boolean, message: string) => void
}

export const useExerciseSelectionState = ({
  initialExerciseCategories,
  initialExercises,
  initialExerciseCategoryId,
  initialExerciseId,
  onStatus,
}: Params) => {
  const [exerciseCategories, setExerciseCategories] = useState<ExerciseCategory[]>(initialExerciseCategories)
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises)
  const [selectedExerciseCategoryId, setSelectedExerciseCategoryId] = useState(initialExerciseCategoryId)
  const [selectedExerciseId, setSelectedExerciseId] = useState(initialExerciseId)
  const [newExerciseCategoryName, setNewExerciseCategoryName] = useState('')
  const [newExerciseName, setNewExerciseName] = useState('')
  const [newExerciseType, setNewExerciseType] = useState<ExerciseType>('strength')
  const [isAddingExerciseCategory, setIsAddingExerciseCategory] = useState(false)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [isExerciseCategoryDialogOpen, setIsExerciseCategoryDialogOpen] = useState(false)
  const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false)

  const filteredExercises = useMemo(
    () => exercises.filter((exercise) => exercise.exercise_category_id === selectedExerciseCategoryId),
    [exercises, selectedExerciseCategoryId],
  )

  const selectedExercise = useMemo(
    () => exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null,
    [exercises, selectedExerciseId],
  )

  const handleAddExerciseCategory = async () => {
    const trimmedName = newExerciseCategoryName.trim()
    if (!trimmedName) {
      onStatus(true, 'Enter an exercise category name.')
      return
    }

    setIsAddingExerciseCategory(true)
    onStatus(false, '')

    const result = await addExerciseCategory(trimmedName)
    setIsAddingExerciseCategory(false)

    if (result.error || !result.data) {
      onStatus(true, result.error ?? 'Could not add the exercise category.')
      return
    }

    const data = result.data
    setExerciseCategories((current) => [...current, data])
    setSelectedExerciseCategoryId(data.id)
    setSelectedExerciseId('')
    setNewExerciseCategoryName('')
    setIsExerciseCategoryDialogOpen(false)
    onStatus(false, `Added exercise category: ${data.name}.`)
  }

  const handleAddExercise = async () => {
    const trimmedName = newExerciseName.trim()

    if (!selectedExerciseCategoryId) {
      onStatus(true, 'Select an exercise category first.')
      return
    }
    if (!trimmedName) {
      onStatus(true, 'Enter an exercise name.')
      return
    }

    setIsAddingExercise(true)
    onStatus(false, '')

    const result = await addExercise(selectedExerciseCategoryId, trimmedName, newExerciseType)
    setIsAddingExercise(false)

    if (result.error || !result.data) {
      onStatus(true, result.error ?? 'Could not add the exercise.')
      return
    }

    const data = result.data
    setExercises((current) => [...current, data])
    setSelectedExerciseId(data.id)
    setNewExerciseName('')
    setNewExerciseType('strength')
    setIsExerciseDialogOpen(false)
    onStatus(false, `Added exercise: ${data.name}.`)
  }

  return {
    exerciseCategories,
    filteredExercises,
    selectedExercise,
    selectedExerciseCategoryId,
    selectedExerciseId,
    newExerciseCategoryName,
    newExerciseName,
    newExerciseType,
    isAddingExerciseCategory,
    isAddingExercise,
    isExerciseCategoryDialogOpen,
    isExerciseDialogOpen,
    setSelectedExerciseCategoryId,
    setSelectedExerciseId,
    setNewExerciseCategoryName,
    setNewExerciseName,
    setNewExerciseType,
    setIsExerciseCategoryDialogOpen,
    setIsExerciseDialogOpen,
    handleAddExerciseCategory,
    handleAddExercise,
  }
}

export type ExerciseSelectionState = ReturnType<typeof useExerciseSelectionState>
