'use client'

import { useReducer } from 'react'
import type { CompletedExerciseRow, EntryComparisons, ExerciseCategory } from '@/lib/completedExercises'
import type { CopyCategoryTarget } from '../_helpers/CompletedExercisesHelper'

export type UseCompletedExercisesClientStateParams = {
  initialDateFrom: string
  initialDateTo: string
  initialEntries: CompletedExerciseRow[]
  initialExerciseCategories: ExerciseCategory[]
  initialEntryComparisons: EntryComparisons
  initialErrorMessage: string
  initialIsLoading: boolean
  initialSelectedExerciseCategory: string
  initialFiltersValue: string
}

export type CompletedExercisesClientState = {
  dateRange: {
    dateFrom: string
    dateTo: string
  }
  data: {
    entries: CompletedExerciseRow[]
    exerciseCategories: ExerciseCategory[]
    entryComparisons: EntryComparisons
  }
  messages: {
    errorMessage: string
    successMessage: string
  }
  ui: {
    isDataLoading: boolean
    selectedExerciseCategory: string
    filtersValue: string
  }
  deleteDialog: {
    open: boolean
    entryId: string | null
    loading: boolean
  }
  copyDialog: {
    open: boolean
    target: CopyCategoryTarget | null
    date: string
    loading: boolean
  }
}

export type CompletedExercisesClientAction =
  | { type: 'date_range_changed'; payload: { dateFrom: string; dateTo: string } }
  | { type: 'refresh_started' }
  | {
      type: 'refresh_succeeded'
      payload: {
        entries: CompletedExerciseRow[]
        exerciseCategories: ExerciseCategory[]
        entryComparisons: EntryComparisons
      }
    }
  | { type: 'refresh_failed'; payload: { errorMessage: string } }
  | { type: 'exercise_category_selected'; payload: { exerciseCategory: string } }
  | { type: 'filters_value_set'; payload: { value: string } }
  | { type: 'delete_dialog_opened'; payload: { entryId: string } }
  | { type: 'delete_dialog_closed' }
  | { type: 'delete_started' }
  | { type: 'delete_finished' }
  | { type: 'delete_failed'; payload: { errorMessage: string } }
  | { type: 'delete_succeeded'; payload: { entryId: string } }
  | { type: 'copy_dialog_opened'; payload: { target: CopyCategoryTarget; date: string } }
  | { type: 'copy_dialog_closed' }
  | { type: 'copy_date_set'; payload: { date: string } }
  | { type: 'copy_started' }
  | { type: 'copy_finished' }
  | { type: 'copy_failed'; payload: { errorMessage: string } }
  | { type: 'copy_succeeded'; payload: { successMessage: string } }

const reducer = (
  state: CompletedExercisesClientState,
  action: CompletedExercisesClientAction,
): CompletedExercisesClientState => {
  switch (action.type) {
    case 'date_range_changed':
      return { ...state, dateRange: action.payload }
    case 'refresh_started':
      return {
        ...state,
        ui: { ...state.ui, isDataLoading: true },
        messages: { ...state.messages, errorMessage: '' },
      }
    case 'refresh_succeeded':
      return {
        ...state,
        data: {
          ...state.data,
          entries: action.payload.entries,
          exerciseCategories: action.payload.exerciseCategories,
          entryComparisons: action.payload.entryComparisons,
        },
        ui: { ...state.ui, isDataLoading: false },
      }
    case 'refresh_failed':
      return {
        ...state,
        data: { ...state.data, entries: [], entryComparisons: {} },
        messages: { ...state.messages, errorMessage: action.payload.errorMessage },
        ui: { ...state.ui, isDataLoading: false },
      }
    case 'exercise_category_selected':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedExerciseCategory: action.payload.exerciseCategory,
          filtersValue: action.payload.exerciseCategory === 'all' ? state.ui.filtersValue : 'filters',
        },
      }
    case 'filters_value_set':
      return { ...state, ui: { ...state.ui, filtersValue: action.payload.value } }
    case 'delete_dialog_opened':
      return {
        ...state,
        deleteDialog: { ...state.deleteDialog, open: true, entryId: action.payload.entryId },
        messages: { ...state.messages, successMessage: '' },
      }
    case 'delete_dialog_closed':
      return { ...state, deleteDialog: { ...state.deleteDialog, open: false, entryId: null } }
    case 'delete_started':
      return { ...state, deleteDialog: { ...state.deleteDialog, loading: true } }
    case 'delete_finished':
      return { ...state, deleteDialog: { ...state.deleteDialog, loading: false } }
    case 'delete_failed':
      return {
        ...state,
        messages: { ...state.messages, errorMessage: action.payload.errorMessage, successMessage: '' },
      }
    case 'delete_succeeded':
      return {
        ...state,
        data: {
          ...state.data,
          entries: state.data.entries.filter((row) => row.id !== action.payload.entryId),
        },
        messages: { ...state.messages, successMessage: 'Deleted entry.' },
      }
    case 'copy_dialog_opened':
      return {
        ...state,
        copyDialog: {
          ...state.copyDialog,
          open: true,
          target: action.payload.target,
          date: action.payload.date,
        },
        messages: { ...state.messages, errorMessage: '', successMessage: '' },
      }
    case 'copy_dialog_closed':
      return { ...state, copyDialog: { ...state.copyDialog, open: false, target: null, date: '' } }
    case 'copy_date_set':
      return { ...state, copyDialog: { ...state.copyDialog, date: action.payload.date } }
    case 'copy_started':
      return {
        ...state,
        copyDialog: { ...state.copyDialog, loading: true },
        messages: { ...state.messages, errorMessage: '', successMessage: '' },
      }
    case 'copy_finished':
      return { ...state, copyDialog: { ...state.copyDialog, loading: false } }
    case 'copy_failed':
      return { ...state, messages: { ...state.messages, errorMessage: action.payload.errorMessage } }
    case 'copy_succeeded':
      return { ...state, messages: { ...state.messages, successMessage: action.payload.successMessage } }
    default:
      return state
  }
}

const createInitialState = (
  params: UseCompletedExercisesClientStateParams,
): CompletedExercisesClientState => ({
  dateRange: { dateFrom: params.initialDateFrom, dateTo: params.initialDateTo },
  data: {
    entries: params.initialEntries,
    exerciseCategories: params.initialExerciseCategories,
    entryComparisons: params.initialEntryComparisons,
  },
  messages: {
    errorMessage: params.initialErrorMessage,
    successMessage: '',
  },
  ui: {
    isDataLoading: params.initialIsLoading,
    selectedExerciseCategory: params.initialSelectedExerciseCategory,
    filtersValue: params.initialFiltersValue || (params.initialSelectedExerciseCategory === 'all' ? '' : 'filters'),
  },
  deleteDialog: {
    open: false,
    entryId: null,
    loading: false,
  },
  copyDialog: {
    open: false,
    target: null,
    date: '',
    loading: false,
  },
})

export const useCompletedExercisesState = (params: UseCompletedExercisesClientStateParams) =>
  useReducer(reducer, createInitialState(params))
