'use client'

import { SquarePen } from 'lucide-react'
import {
  CompletedExerciseForm,
  DEFAULT_LOAD_KG,
  type CompletedExerciseFormValues,
} from '@/app/completed-exercises/_components/CompletedExerciseForm'
import { createCompletedExercise } from '@/app/completed-exercises/actions'
import { useNewCompletedExerciseSetup } from '../_hooks/useNewCompletedExerciseSetup'

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

export default function NewCompletedExerciseClient({
  exerciseCategories,
  exercises,
  initialPerformedAt,
}: NewCompletedExerciseClientProps) {
  const {
    exerciseCategories: loadedExerciseCategories,
    exercises: loadedExercises,
    performedAt,
    isExerciseSetupLoading,
  } = useNewCompletedExerciseSetup({
    initialExerciseCategories: exerciseCategories,
    initialExercises: exercises,
    initialPerformedAt,
  })

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
    performedAt,
  }

  return (
    <CompletedExerciseForm
      key={`${performedAt}-${loadedExerciseCategories.length}-${loadedExercises.length}`}
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
