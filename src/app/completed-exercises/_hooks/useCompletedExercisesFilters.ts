'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Dispatch } from 'react'
import { shiftWeekRange } from '@/lib/trainingDateRange'
import { getCompletedExercisesSearchParams } from '../_helpers/CompletedExercisesHelper'
import type { CompletedExercisesClientAction, CompletedExercisesClientState } from './useCompletedExercisesState'

type Params = {
  state: CompletedExercisesClientState
  dispatch: Dispatch<CompletedExercisesClientAction>
}

export const useCompletedExercisesFilters = ({ state, dispatch }: Params) => {
  const router = useRouter()
  const [, startRouteTransition] = useTransition()

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

  const shiftDateRangeByWeek = (direction: -1 | 1) => {
    updateDateRange(shiftWeekRange(state.dateRange.dateFrom, direction))
  }

  const setFiltersValue = (value: string) => {
    dispatch({ type: 'filters_value_set', payload: { value } })
  }

  return {
    updateDateRange,
    selectExerciseCategory,
    shiftDateRangeByWeek,
    setFiltersValue,
  }
}
