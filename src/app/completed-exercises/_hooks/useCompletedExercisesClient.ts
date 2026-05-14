'use client'

import { useMemo, useReducer, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatLocalDateOnly } from '@/lib/dateOnly'
import type { CompletedExerciseRow, EntryComparisons, ExerciseCategory } from '@/lib/completedExercises'
import { copyCompletedExerciseCategory, deleteCompletedExercise } from '@/app/completed-exercises/actions'
import { getWeekRangeForDate, shiftWeekRange } from '@/lib/trainingDateRange'
import { formatWeekdayDate } from '@/lib/trainingFormatters'
import {
  getCompletedExercisesSearchParams,
  getExerciseCategoryOptions,
  getFilteredEntries,
  getGroupedEntriesByDate,
  loadCompletedExercisesPayload,
  type CopyCategoryTarget,
} from '../_helpers/CompletedExercisesHelper'

type UseCompletedExercisesClientParams = {
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

type State = {
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

type Action =
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

const reducer = (state: State, action: Action): State => {
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

export function useCompletedExercisesClient(params: UseCompletedExercisesClientParams) {
  const router = useRouter()
  const [, startRouteTransition] = useTransition()

  const [state, dispatch] = useReducer(reducer, {
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

  const updateDateRange = (nextDateRange: { dateFrom: string; dateTo: string }) => {
    dispatch({ type: 'date_range_changed', payload: nextDateRange })
    dispatch({ type: 'filters_value_set', payload: { value: 'filters' } })
    dispatch({ type: 'refresh_started' })

    const searchParams = getCompletedExercisesSearchParams(nextDateRange, state.ui.selectedExerciseCategory)
    startRouteTransition(() => {
      router.push(`/completed-exercises?${searchParams.toString()}`, { scroll: false })
    })
  }

  const selectExerciseCategory = (exerciseCategory: string) => {
    dispatch({ type: 'exercise_category_selected', payload: { exerciseCategory } })

    if (!state.dateRange.dateFrom || !state.dateRange.dateTo) return

    const searchParams = getCompletedExercisesSearchParams(state.dateRange, exerciseCategory)
    startRouteTransition(() => {
      router.replace(`/completed-exercises?${searchParams.toString()}`, { scroll: false })
    })
  }

  const refreshCurrentDateRange = async () => {
    if (!state.dateRange.dateFrom || !state.dateRange.dateTo) return

    dispatch({ type: 'refresh_started' })

    try {
      const payload = await loadCompletedExercisesPayload(state.dateRange.dateFrom, state.dateRange.dateTo)
      dispatch({
        type: 'refresh_succeeded',
        payload: {
          entries: payload.entries,
          exerciseCategories: payload.exerciseCategories,
          entryComparisons: payload.entryComparisons,
        },
      })
    } catch (error) {
      dispatch({
        type: 'refresh_failed',
        payload: { errorMessage: error instanceof Error ? error.message : 'Could not load data.' },
      })
    }
  }

  const shiftDateRangeByWeek = (direction: -1 | 1) => {
    updateDateRange(shiftWeekRange(state.dateRange.dateFrom, direction))
  }

  const exerciseCategoryOptions = useMemo(
    () => getExerciseCategoryOptions(state.data.exerciseCategories, state.ui.selectedExerciseCategory),
    [state.data.exerciseCategories, state.ui.selectedExerciseCategory],
  )

  const filteredEntries = useMemo(
    () => getFilteredEntries(state.data.entries, state.ui.selectedExerciseCategory),
    [state.data.entries, state.ui.selectedExerciseCategory],
  )

  const groupedByDate = useMemo(() => getGroupedEntriesByDate(filteredEntries), [filteredEntries])

  const openDelete = (id: string) => {
    dispatch({ type: 'delete_dialog_opened', payload: { entryId: id } })
  }

  const closeDelete = () => {
    dispatch({ type: 'delete_dialog_closed' })
  }

  const confirmDelete = async () => {
    const entryId = state.deleteDialog.entryId
    if (!entryId) return

    dispatch({ type: 'delete_started' })
    const result = await deleteCompletedExercise(entryId)
    dispatch({ type: 'delete_finished' })

    if (result.error) {
      dispatch({ type: 'delete_failed', payload: { errorMessage: result.error } })
      closeDelete()
      return
    }

    dispatch({ type: 'delete_succeeded', payload: { entryId } })
    closeDelete()
    await refreshCurrentDateRange()
  }

  const openCopyCategory = (sourceDate: string, categoryName: string, categoryEntries: CompletedExerciseRow[]) => {
    dispatch({
      type: 'copy_dialog_opened',
      payload: {
        target: { sourceDate, categoryName, entries: categoryEntries } as CopyCategoryTarget,
        date: formatLocalDateOnly(new Date()),
      },
    })
  }

  const closeCopyCategory = () => {
    dispatch({ type: 'copy_dialog_closed' })
  }

  const confirmCopyCategory = async () => {
    const copyTarget = state.copyDialog.target
    const copyDate = state.copyDialog.date
    if (!copyTarget || !copyDate || copyDate === copyTarget.sourceDate) return

    dispatch({ type: 'copy_started' })

    const result = await copyCompletedExerciseCategory(copyTarget.entries, copyDate)

    dispatch({ type: 'copy_finished' })

    if (result.error) {
      dispatch({ type: 'copy_failed', payload: { errorMessage: result.error } })
      return
    }

    const copiedCount = result.data?.copiedCount ?? copyTarget.entries.length
    dispatch({
      type: 'copy_succeeded',
      payload: {
        successMessage: `Copied ${copiedCount} ${copiedCount === 1 ? 'exercise' : 'exercises'} from ${copyTarget.categoryName} to ${formatWeekdayDate(copyDate)}.`,
      },
    })
    closeCopyCategory()

    const targetDateRange = getWeekRangeForDate(copyDate)
    if (
      targetDateRange.dateFrom === state.dateRange.dateFrom &&
      targetDateRange.dateTo === state.dateRange.dateTo
    ) {
      await refreshCurrentDateRange()
      return
    }

    updateDateRange(targetDateRange)
  }

  const isCopyDateSameAsSource = Boolean(
    state.copyDialog.target && state.copyDialog.date === state.copyDialog.target.sourceDate,
  )

  return {
    state,
    groupedByDate,
    exerciseCategoryOptions,
    isCopyDateSameAsSource,
    updateDateRange,
    shiftDateRangeByWeek,
    selectExerciseCategory,
    openDelete,
    closeDelete,
    confirmDelete,
    openCopyCategory,
    closeCopyCategory,
    confirmCopyCategory,
    setFiltersValue: (value: string) => dispatch({ type: 'filters_value_set', payload: { value } }),
    setCopyDate: (value: string) => dispatch({ type: 'copy_date_set', payload: { date: value } }),
  }
}
