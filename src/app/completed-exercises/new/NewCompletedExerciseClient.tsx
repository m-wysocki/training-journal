'use client'

import { SquarePen } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  CompletedExerciseForm,
  DEFAULT_LOAD_KG,
  type CompletedExerciseFormValues,
} from '@/components/CompletedExerciseForm'
import { createCompletedExercise } from '@/app/completed-exercises/actions'
import { loadExerciseSetup } from '@/app/exerciseSetupActions'
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

type NewCompletedExerciseClientProps = {
  exerciseCategories: ExerciseCategory[]
  exercises: Exercise[]
  initialPerformedAt: string
}

type ExerciseSetup = {
  exerciseCategories: ExerciseCategory[]
  exercises: Exercise[]
}

let exerciseSetupCache: ExerciseSetup | null = null
let exerciseSetupPromise: Promise<ExerciseSetup> | null = null

const getExerciseSetup = async () => {
  if (exerciseSetupCache) {
    return exerciseSetupCache
  }

  exerciseSetupPromise ??= loadExerciseSetup().then(({ data, error }) => {
    if (error || !data) {
      throw new Error(error || 'Could not load exercise setup.')
    }

    exerciseSetupCache = data
    return data
  })

  return exerciseSetupPromise
}

export default function NewCompletedExerciseClient({
  exerciseCategories,
  exercises,
  initialPerformedAt,
}: NewCompletedExerciseClientProps) {
  const [performedAt] = useState(initialPerformedAt)
  const [loadedExerciseCategories, setLoadedExerciseCategories] = useState(exerciseCategories)
  const [loadedExercises, setLoadedExercises] = useState(exercises)
  const [loadedPerformedAt, setLoadedPerformedAt] = useState(initialPerformedAt)
  const [isExerciseSetupLoading, setIsExerciseSetupLoading] = useState(
    exerciseCategories.length === 0 && exercises.length === 0,
  )

  useEffect(() => {
    let isActive = true

    if (exerciseCategories.length > 0 || exercises.length > 0) {
      exerciseSetupCache = { exerciseCategories, exercises }
      return () => {
        isActive = false
      }
    }

    getExerciseSetup()
      .then((setup) => {
        if (!isActive) return

        setLoadedExerciseCategories(setup.exerciseCategories)
        setLoadedExercises(setup.exercises)
        setLoadedPerformedAt((current) => current || formatLocalDateOnly(new Date()))
        setIsExerciseSetupLoading(false)
      })
      .catch(() => {
        if (!isActive) return

        setLoadedExerciseCategories([])
        setLoadedExercises([])
        setLoadedPerformedAt((current) => current || formatLocalDateOnly(new Date()))
        setIsExerciseSetupLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [exerciseCategories, exercises])

  const initialValues: CompletedExerciseFormValues = {
    exerciseCategoryId: '',
    exerciseId: '',
    sets: 3,
    repsPerSet: [12, 12, 12],
    durationPerSetSeconds: null,
    loadKg: DEFAULT_LOAD_KG,
    distanceKm: null,
    paceMinPerKm: null,
    note: '',
    performedAt: loadedPerformedAt || performedAt,
  }

  return (
    <CompletedExerciseForm
      key={`${loadedPerformedAt}-${loadedExerciseCategories.length}-${loadedExercises.length}`}
      mode="create"
      title="Log Exercise"
      description="Choose an exercise and save only the most important workout details."
      headerIcon={SquarePen}
      submitLabel="Save Exercise"
      submittingLabel="Saving..."
      initialValues={initialValues}
      initialExerciseCategories={loadedExerciseCategories}
      initialExercises={loadedExercises}
      isExerciseSetupLoading={isExerciseSetupLoading}
      onSubmit={createCompletedExercise}
    />
  )
}
