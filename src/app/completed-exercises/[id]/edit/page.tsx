import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/supabase/auth'
import { getExerciseSetup } from '@/lib/supabase/trainingData'
import EditCompletedExerciseClient from './_components/EditCompletedExerciseClient'
import EditCompletedExerciseFallback from './_components/EditCompletedExerciseFallback'
import { mapEntryToInitialValues, parseCompletedExerciseRecord } from './_helpers/mapEntryToInitialValues'

type EditCompletedExercisePageProps = {
  params: Promise<{
    id: string
  }>
}

async function EditCompletedExerciseData({ params }: EditCompletedExercisePageProps) {
  const { id } = await params
  const { supabase, user } = await requireUser()
  const [entryResult, exerciseSetup] = await Promise.all([
    supabase
      .from('completed_exercises')
      .select(
        `
          id,
          exercise_id,
          performed_at,
          sets,
          reps_per_set,
          duration_per_set_seconds,
          load_kg,
          distance_km,
          pace_min_per_km,
          note,
          exercise:exercises (
            exercise_category_id
          )
        `,
      )
      .eq('user_id', user.id)
      .eq('id', id)
      .single(),
    getExerciseSetup(supabase, user.id),
  ])

  const entry = parseCompletedExerciseRecord(entryResult.data)

  if (entryResult.error || !entry) {
    notFound()
  }

  return (
    <EditCompletedExerciseClient
      entryId={id}
      initialValues={mapEntryToInitialValues(entry)}
      exerciseCategories={exerciseSetup.exerciseCategories}
      exercises={exerciseSetup.exercises}
    />
  )
}

export default function EditCompletedExercisePage(props: EditCompletedExercisePageProps) {
  return (
    <Suspense fallback={<EditCompletedExerciseFallback />}>
      <EditCompletedExerciseData {...props} />
    </Suspense>
  )
}
