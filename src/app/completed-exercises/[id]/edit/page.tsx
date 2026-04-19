'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CompletedExerciseForm, type CompletedExerciseFormValues } from '@/components/CompletedExerciseForm'
import { supabase } from '@/lib/supabase'

type CompletedExerciseRecord = {
  id: string
  exercise_id: string
  performed_at: string
  sets: number
  reps_per_set: number[]
  load_kg: number | null
  note: string | null
  exercise: {
    muscle_group_id: string
  } | null
}

export default function EditCompletedExercisePage() {
  const params = useParams()
  const entryId = params.id as string
  const [initialValues, setInitialValues] = useState<CompletedExerciseFormValues | null>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isActive = true

    supabase
      .from('completed_exercises')
      .select(
        `
          id,
          exercise_id,
          performed_at,
          sets,
          reps_per_set,
          load_kg,
          note,
          exercise:exercises (
            muscle_group_id
          )
        `,
      )
      .eq('id', entryId)
      .single()
      .then(({ data, error }) => {
        if (!isActive) return

        if (error || !data) {
          setLoadError('Could not load the entry for editing.')
          return
        }

        const entry = data as unknown as CompletedExerciseRecord

        setInitialValues({
          muscleGroupId: entry.exercise?.muscle_group_id ?? '',
          exerciseId: entry.exercise_id,
          sets: entry.sets,
          repsPerSet: entry.reps_per_set,
          loadKg: entry.load_kg === null ? null : Number(entry.load_kg),
          note: entry.note ?? '',
          performedAt: entry.performed_at,
        })
      })

    return () => {
      isActive = false
    }
  }, [entryId])

  if (loadError) {
    return <div>{loadError}</div>
  }

  if (!initialValues) {
    return <div>Loading entry data...</div>
  }

  return (
    <CompletedExerciseForm
      mode="edit"
      title="Edit Completed Exercise"
      description="Update the exercise, workout details, or notes using the same view as the create form."
      submitLabel="Save Changes"
      submittingLabel="Saving..."
      initialValues={initialValues}
      onSubmit={async (values) => {
        const { error } = await supabase
          .from('completed_exercises')
          .update({
            exercise_id: values.exerciseId,
            sets: values.sets,
            reps_per_set: values.repsPerSet,
            load_kg: values.loadKg,
            note: values.note,
            performed_at: values.performedAt,
          })
          .eq('id', entryId)

        if (error) {
          return { error: 'Could not save changes.' }
        }

        return {}
      }}
    />
  )
}
