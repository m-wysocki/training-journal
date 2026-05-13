'use client'

import { useEffect, useState } from 'react'
import { loadExerciseSetup } from '@/lib/actions/exerciseSetupActions'
import { formatLocalDateOnly } from '@/lib/dateOnly'

type ExerciseCategory = {
  id: string
  name: string
}

type Exercise = {
  id: string
  name: string
  exercise_category_id: string
  exercise_type: 'strength' | 'cardio' | 'duration'
}

type UseNewCompletedExerciseSetupParams = {
  initialExerciseCategories: ExerciseCategory[]
  initialExercises: Exercise[]
  initialPerformedAt: string
}

const getExerciseSetup = async () => {
  const { data, error } = await loadExerciseSetup()

  if (error || !data) {
    throw new Error(error || 'Could not load exercise setup.')
  }

  return data
}

export function useNewCompletedExerciseSetup({
  initialExerciseCategories,
  initialExercises,
  initialPerformedAt,
}: UseNewCompletedExerciseSetupParams) {
  const [exerciseCategories, setExerciseCategories] = useState(initialExerciseCategories)
  const [exercises, setExercises] = useState(initialExercises)
  const [performedAt, setPerformedAt] = useState(initialPerformedAt)
  const [isExerciseSetupLoading, setIsExerciseSetupLoading] = useState(
    initialExerciseCategories.length === 0 && initialExercises.length === 0,
  )

  useEffect(() => {
    let cancelled = false

    if (initialExerciseCategories.length > 0 || initialExercises.length > 0) {
      return () => {
        cancelled = true
      }
    }

    const fallbackDate = formatLocalDateOnly(new Date())
    const finalize = (nextCategories: ExerciseCategory[], nextExercises: Exercise[]) => {
      if (cancelled) return
      setExerciseCategories(nextCategories)
      setExercises(nextExercises)
      setPerformedAt((current) => current || fallbackDate)
      setIsExerciseSetupLoading(false)
    }

    getExerciseSetup()
      .then((setup) => {
        finalize(setup.exerciseCategories, setup.exercises)
      })
      .catch(() => {
        finalize([], [])
      })

    return () => {
      cancelled = true
    }
  }, [initialExerciseCategories, initialExercises])

  return {
    exerciseCategories,
    exercises,
    performedAt,
    isExerciseSetupLoading,
  }
}
