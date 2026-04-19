'use client'

import { useState } from 'react'
import { CompletedExerciseForm, type CompletedExerciseFormValues } from '@/components/CompletedExerciseForm'
import { formatLocalDateOnly } from '@/lib/dateOnly'
import { supabase } from '@/lib/supabase'

export default function NewCompletedExercisePage() {
  const [today] = useState(() => formatLocalDateOnly(new Date()))

  const initialValues: CompletedExerciseFormValues = {
    muscleGroupId: '',
    exerciseId: '',
    sets: 3,
    repsPerSet: [12, 12, 12],
    loadKg: 2.5,
    note: '',
    performedAt: today,
  }

  return (
    <CompletedExerciseForm
      mode="create"
      title="Add Completed Exercise"
      description="Choose an exercise and save only the most important workout details."
      submitLabel="Save Exercise"
      submittingLabel="Saving..."
      initialValues={initialValues}
      onSubmit={async (values) => {
        const { error } = await supabase.from('completed_exercises').insert({
          exercise_id: values.exerciseId,
          sets: values.sets,
          reps_per_set: values.repsPerSet,
          load_kg: values.loadKg,
          note: values.note,
          performed_at: values.performedAt,
        })

        if (error) {
          if (error.message.includes("Could not find the table 'public.completed_exercises'")) {
            return {
              error: 'The completed_exercises table is missing in the database. Add it in the Supabase SQL Editor.',
            }
          }

          return {
            error: 'Could not save the exercise. Check your database configuration.',
          }
        }

        return {}
      }}
    />
  )
}
