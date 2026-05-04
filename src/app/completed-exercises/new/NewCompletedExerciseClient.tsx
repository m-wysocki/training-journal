'use client'

import { SquarePen } from 'lucide-react'
import { useState } from 'react'
import {
  CompletedExerciseForm,
  DEFAULT_LOAD_KG,
  type CompletedExerciseFormValues,
} from '@/components/CompletedExerciseForm'
import { formatLocalDateOnly } from '@/lib/dateOnly'
import { createCompletedExercise } from '@/app/completed-exercises/actions'

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
}

export default function NewCompletedExerciseClient({
  exerciseCategories,
  exercises,
}: NewCompletedExerciseClientProps) {
  const [today] = useState(() => formatLocalDateOnly(new Date()))

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
    performedAt: today,
  }

  return (
    <CompletedExerciseForm
      mode="create"
      title="Log Exercise"
      description="Choose an exercise and save only the most important workout details."
      headerIcon={SquarePen}
      submitLabel="Save Exercise"
      submittingLabel="Saving..."
      initialValues={initialValues}
      initialExerciseCategories={exerciseCategories}
      initialExercises={exercises}
      onSubmit={createCompletedExercise}
    />
  )
}
