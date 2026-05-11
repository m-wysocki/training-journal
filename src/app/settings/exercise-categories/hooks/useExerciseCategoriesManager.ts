'use client'

import { useState } from 'react'
import {
  addExerciseCategory,
  deleteExerciseCategory,
  updateExerciseCategory,
} from '@/lib/actions/exerciseSetupActions'

export type ExerciseCategory = {
  id: string
  name: string
}

type UiState = {
  open: boolean
  editOpen: boolean
  name: string
  editName: string
  editingCategory: ExerciseCategory | null
  message: string
  messageType: 'success' | 'error' | null
  isAdding: boolean
  updatingCategoryId: string | null
  deletingCategoryId: string | null
}

type UseExerciseCategoriesManagerOptions = {
  initialCategories: ExerciseCategory[]
  initialErrorMessage?: string
}

export function useExerciseCategoriesManager({
  initialCategories,
  initialErrorMessage = '',
}: UseExerciseCategoriesManagerOptions) {
  const [categories, setCategories] = useState<ExerciseCategory[]>(initialCategories)
  const [uiState, setUiState] = useState<UiState>({
    open: false,
    editOpen: false,
    name: '',
    editName: '',
    editingCategory: null,
    message: initialErrorMessage,
    messageType: initialErrorMessage ? 'error' : null,
    isAdding: false,
    updatingCategoryId: null,
    deletingCategoryId: null,
  })

  const updateUiState = (nextState: Partial<UiState>) => {
    setUiState((current) => ({ ...current, ...nextState }))
  }

  const clearFeedback = () => {
    updateUiState({ message: '', messageType: null })
  }

  const setErrorMessage = (message: string) => {
    updateUiState({ message, messageType: 'error' })
  }

  const setSuccessMessage = (message: string) => {
    updateUiState({ message, messageType: 'success' })
  }

  const addCategory = async () => {
    const trimmedName = uiState.name.trim()

    if (!trimmedName) return

    updateUiState({ message: '', messageType: null, isAdding: true })

    const result = await addExerciseCategory(trimmedName)
    updateUiState({ isAdding: false })

    if (result.error) {
      setErrorMessage(result.error)
      return
    }

    updateUiState({ name: '', open: false })
    setSuccessMessage(`Added exercise category: ${trimmedName}.`)
    setCategories((current) => result.data ? [...current, result.data] : current)
  }

  const deleteCategory = async (id: string) => {
    const deletedCategoryName = categories.find((category) => category.id === id)?.name

    clearFeedback()
    updateUiState({ deletingCategoryId: id })

    const result = await deleteExerciseCategory(id)
    updateUiState({ deletingCategoryId: null })

    if (result.error) {
      setErrorMessage(result.error)
      return
    }

    setCategories((current) => current.filter((category) => category.id !== id))
    setSuccessMessage(
      deletedCategoryName
        ? `Deleted exercise category: ${deletedCategoryName}.`
        : 'Deleted exercise category.',
    )
  }

  const openEditCategory = (category: ExerciseCategory) => {
    updateUiState({
      editingCategory: category,
      editName: category.name,
      editOpen: true,
      message: '',
      messageType: null,
    })
  }

  const updateCategory = async () => {
    const trimmedName = uiState.editName.trim()
    const editingCategory = uiState.editingCategory

    if (!editingCategory || !trimmedName) return

    clearFeedback()
    updateUiState({ updatingCategoryId: editingCategory.id })

    const result = await updateExerciseCategory(editingCategory.id, trimmedName)
    updateUiState({ updatingCategoryId: null })

    if (result.error) {
      setErrorMessage(result.error)
      return
    }

    updateUiState({ editOpen: false, editingCategory: null, editName: '' })
    setSuccessMessage(`Updated exercise category: ${trimmedName}.`)
    setCategories((current) =>
      current.map((category) => category.id === editingCategory.id ? { ...category, name: trimmedName } : category),
    )
  }

  return {
    categories,
    uiState,
    updateUiState,
    addCategory,
    deleteCategory,
    openEditCategory,
    updateCategory,
  }
}
