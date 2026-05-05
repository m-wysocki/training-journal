import { Suspense } from 'react'
import { getCurrentWeekRange } from '@/lib/trainingDateRange'
import CompletedExercisesClient from './CompletedExercisesClient'

type CompletedExercisesPageProps = {
  searchParams?: Promise<{
    dateFrom?: string
    dateTo?: string
  }>
}

async function CompletedExercisesData({ searchParams }: CompletedExercisesPageProps) {
  const params = await searchParams
  const currentWeekRange = getCurrentWeekRange()
  const dateFrom = params?.dateFrom || currentWeekRange.dateFrom
  const dateTo = params?.dateTo || currentWeekRange.dateTo

  return (
    <CompletedExercisesClient
      key={`${dateFrom}-${dateTo}`}
      initialDateFrom={dateFrom}
      initialDateTo={dateTo}
      initialEntries={[]}
      initialExerciseCategories={[]}
      initialEntryComparisons={{}}
      initialIsLoading
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
