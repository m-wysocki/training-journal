'use client'

import { useMemo } from 'react'
import {
  getExerciseCategoryOptions,
  getFilteredEntries,
  getGroupedEntriesByDate,
} from '../_helpers/CompletedExercisesHelper'
import type { CompletedExercisesClientState } from './useCompletedExercisesState'

export const useCompletedExercisesDerived = (state: CompletedExercisesClientState) => {
  const exerciseCategoryOptions = useMemo(
    () => getExerciseCategoryOptions(state.data.exerciseCategories, state.ui.selectedExerciseCategory),
    [state.data.exerciseCategories, state.ui.selectedExerciseCategory],
  )

  const filteredEntries = useMemo(
    () => getFilteredEntries(state.data.entries, state.ui.selectedExerciseCategory),
    [state.data.entries, state.ui.selectedExerciseCategory],
  )

  const groupedByDate = useMemo(() => getGroupedEntriesByDate(filteredEntries), [filteredEntries])

  return {
    exerciseCategoryOptions,
    groupedByDate,
  }
}
