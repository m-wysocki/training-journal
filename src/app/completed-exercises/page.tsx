import { requireUser } from '@/lib/supabase/auth'
import { getCachedCompletedExercisesPayload } from '@/lib/supabase/cachedTrainingData'
import { getCurrentWeekRange } from '@/lib/trainingDateRange'
import CompletedExercisesClient from './CompletedExercisesClient'

type CompletedExercisesPageProps = {
  searchParams?: Promise<{
    dateFrom?: string
    dateTo?: string
  }>
}

export default async function CompletedExercisesPage({ searchParams }: CompletedExercisesPageProps) {
  const params = await searchParams
  const currentWeekRange = getCurrentWeekRange()
  const dateFrom = params?.dateFrom || currentWeekRange.dateFrom
  const dateTo = params?.dateTo || currentWeekRange.dateTo
  const { user, accessToken } = await requireUser()
  const payload = await getCachedCompletedExercisesPayload(user.id, accessToken, dateFrom, dateTo)

  return (
    <CompletedExercisesClient
      key={`${dateFrom}-${dateTo}`}
      initialDateFrom={dateFrom}
      initialDateTo={dateTo}
      initialEntries={payload.entries}
      initialExerciseCategories={payload.exerciseCategories}
      initialEntryComparisons={payload.entryComparisons}
      initialErrorMessage={payload.errorMessage}
    />
  )
}
