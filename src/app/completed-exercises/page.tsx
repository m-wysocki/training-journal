import { Suspense } from 'react'
import { getCurrentWeekRange } from '@/lib/trainingDateRange'
import { requireUser } from '@/lib/supabase/auth'
import { getCompletedExercisesPayload } from '@/lib/supabase/trainingData'
import { getCompletedExercisesPayloadKey } from './_helpers/CompletedExercisesHelper'
import CompletedExercisesClient from './_components/CompletedExercisesClient'

type CompletedExercisesPageProps = {
  searchParams?: Promise<{
    dateFrom?: string
    dateTo?: string
    category?: string
  }>
}

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
