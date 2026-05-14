'use client'

import { formatLocalDateOnly } from '@/lib/dateOnly'
import type { CompletedExerciseRow } from '@/lib/completedExercises'
import { copyCompletedExerciseCategory, deleteCompletedExercise } from '@/app/completed-exercises/actions'
import { getWeekRangeForDate } from '@/lib/trainingDateRange'
import { formatWeekdayDate } from '@/lib/trainingFormatters'
import {
  loadCompletedExercisesPayload,
  type CopyCategoryTarget,
} from '../_helpers/CompletedExercisesHelper'
import type { CompletedExercisesClientAction, CompletedExercisesClientState } from './useCompletedExercisesState'
import type { Dispatch } from 'react'

type Params = {
  state: CompletedExercisesClientState
  dispatch: Dispatch<CompletedExercisesClientAction>
  updateDateRange: (nextDateRange: { dateFrom: string; dateTo: string }) => void
}

export const useCompletedExercisesMutations = ({ state, dispatch, updateDateRange }: Params) => {
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

  const openDelete = (entryId: string) => {
    dispatch({ type: 'delete_dialog_opened', payload: { entryId } })
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

  const setCopyDate = (value: string) => {
    dispatch({ type: 'copy_date_set', payload: { date: value } })
  }

  return {
    openDelete,
    closeDelete,
    confirmDelete,
    openCopyCategory,
    closeCopyCategory,
    confirmCopyCategory,
    setCopyDate,
  }
}
