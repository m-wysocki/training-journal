'use client'

import { useCompletedExercisesDerived } from './useCompletedExercisesDerived'
import { useCompletedExercisesFilters } from './useCompletedExercisesFilters'
import { useCompletedExercisesMutations } from './useCompletedExercisesMutations'
import {
  useCompletedExercisesState,
  type UseCompletedExercisesClientStateParams,
} from './useCompletedExercisesState'

export function useCompletedExercisesClient(params: UseCompletedExercisesClientStateParams) {
  const [state, dispatch] = useCompletedExercisesState(params)
  const { exerciseCategoryOptions, groupedByDate } = useCompletedExercisesDerived(state)
  const { updateDateRange, selectExerciseCategory, shiftDateRangeByWeek, setFiltersValue } =
    useCompletedExercisesFilters({ state, dispatch })
  const {
    openDelete,
    closeDelete,
    confirmDelete,
    openCopyCategory,
    closeCopyCategory,
    confirmCopyCategory,
    setCopyDate,
  } = useCompletedExercisesMutations({ state, dispatch, updateDateRange })

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
    setFiltersValue,
    setCopyDate,
  }
}
