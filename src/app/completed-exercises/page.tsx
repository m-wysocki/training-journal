import { Suspense } from 'react'
import { getCurrentWeekRange } from '@/lib/trainingDateRange'
import { requireUser } from '@/lib/supabase/auth'
import { getCompletedExercisesPayload } from '@/lib/supabase/trainingData'
import CompletedExercisesClient from './CompletedExercisesClient'

type CompletedExercisesPageProps = {
  searchParams?: Promise<{
    dateFrom?: string
    dateTo?: string
    category?: string
  }>
}

const getCompletedExercisesPayloadKey = (
  entries: Awaited<ReturnType<typeof getCompletedExercisesPayload>>['entries'],
) =>
  entries
    .map((entry) =>
      [
        entry.id,
        entry.exercise_id,
        entry.performed_at,
        entry.sets,
        entry.reps_per_set?.join(',') ?? '',
        entry.duration_per_set_seconds?.join(',') ?? '',
        entry.load_kg ?? '',
        entry.distance_km ?? '',
        entry.pace_min_per_km ?? '',
        entry.note ?? '',
      ].join(':'),
    )
    .join('|')

async function CompletedExercisesData({ searchParams }: CompletedExercisesPageProps) {
  const params = await searchParams
  const currentWeekRange = getCurrentWeekRange()
  const dateFrom = params?.dateFrom || currentWeekRange.dateFrom
  const dateTo = params?.dateTo || currentWeekRange.dateTo
  const selectedExerciseCategory = params?.category || 'all'
  const { supabase, user } = await requireUser()
  const payload = await getCompletedExercisesPayload(supabase, user.id, dateFrom, dateTo)

  return (
    <CompletedExercisesClient
      key={`${dateFrom}:${dateTo}:${getCompletedExercisesPayloadKey(payload.entries)}`}
      initialDateFrom={dateFrom}
      initialDateTo={dateTo}
      initialEntries={payload.entries}
      initialExerciseCategories={payload.exerciseCategories}
      initialEntryComparisons={payload.entryComparisons}
      initialErrorMessage={payload.errorMessage}
      initialSelectedExerciseCategory={selectedExerciseCategory}
    />
  )
}

function CompletedExercisesFallback() {
  return (
    <CompletedExercisesClient
      initialDateFrom=""
      initialDateTo=""
      initialEntries={[]}
      initialExerciseCategories={[]}
      initialEntryComparisons={{}}
      initialIsLoading
    />
  )
}

export default function CompletedExercisesPage(props: CompletedExercisesPageProps) {
  return (
    <Suspense fallback={<CompletedExercisesFallback />}>
      <CompletedExercisesData {...props} />
    </Suspense>
  )
}
