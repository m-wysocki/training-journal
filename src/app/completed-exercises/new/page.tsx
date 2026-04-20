'use client'

import { useState } from 'react'
import {
  CompletedExerciseForm,
  DEFAULT_LOAD_KG,
  type CompletedExerciseFormValues,
} from '@/components/CompletedExerciseForm'
import { formatLocalDateOnly } from '@/lib/dateOnly'
import { supabase } from '@/lib/supabase'

export default function NewCompletedExercisePage() {
  const [today] = useState(() => formatLocalDateOnly(new Date()))

  const initialValues: CompletedExerciseFormValues = {
    muscleGroupId: '',
    exerciseId: '',
    sets: 3,
    repsPerSet: [12, 12, 12],
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
      submitLabel="Save Exercise"
      submittingLabel="Saving..."
      initialValues={initialValues}
      onSubmit={async (values) => {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          return {
            error: 'Sign in before logging an exercise.',
          }
        }

        const { error } = await supabase.from('completed_exercises').insert({
          exercise_id: values.exerciseId,
          sets: values.sets,
          reps_per_set: values.repsPerSet,
          load_kg: values.loadKg,
          distance_km: values.distanceKm,
          pace_min_per_km: values.paceMinPerKm,
          note: values.note,
          performed_at: values.performedAt,
          user_id: session.user.id,
        })

        if (error) {
          if (error.message.includes("Could not find the table 'public.completed_exercises'")) {
            return {
              error: 'The completed_exercises table is missing in the database. Add it in the Supabase SQL Editor.',
            }
          }

          if (error.message.includes('row-level security policy')) {
            return {
              error: 'Could not save the exercise because database access rules blocked it. Sign in again or update the completed_exercises RLS policy in Supabase.',
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
