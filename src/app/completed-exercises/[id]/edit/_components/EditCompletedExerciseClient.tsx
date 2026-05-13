'use client'

import {
  CompletedExerciseForm,
  type CompletedExerciseFormValues,
} from '@/app/completed-exercises/_components/CompletedExerciseForm'
import { updateCompletedExercise } from '@/app/completed-exercises/actions'

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

type EditCompletedExerciseClientProps = {
  entryId: string
  initialValues: CompletedExerciseFormValues
  exerciseCategories: ExerciseCategory[]
  exercises: Exercise[]
}

export default function EditCompletedExerciseClient({
  entryId,
  initialValues: serverInitialValues,
  exerciseCategories,
  exercises,
}: EditCompletedExerciseClientProps) {
  return (
    <CompletedExerciseForm
      mode="edit"
      title="Edit Completed Exercise"
      description="Update the exercise, workout details, or notes using the same view as the create form."
      submitLabel="Save Changes"
      submittingLabel="Saving..."
      initialValues={serverInitialValues}
      initialExerciseCategories={exerciseCategories}
      initialExercises={exercises}
      onSubmit={(values) => updateCompletedExercise(entryId, values)}
    />
  )
}
