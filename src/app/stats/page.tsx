import { Suspense } from 'react'
import { getCurrentWeekRange } from '@/lib/trainingDateRange'
import { requireUser } from '@/lib/supabase/auth'
import { getStatsEntries } from '@/lib/supabase/trainingData'
import StatsClient from './_components/StatsClient'

type StatsPageProps = {
  searchParams?: Promise<{
    dateFrom?: string
    dateTo?: string
  }>
}

async function StatsData({ searchParams }: StatsPageProps) {
  const params = await searchParams
  const currentWeekRange = getCurrentWeekRange()
  const dateFrom = params?.dateFrom || currentWeekRange.dateFrom
  const dateTo = params?.dateTo || currentWeekRange.dateTo
  const { supabase, user } = await requireUser()
  const { data, error } = await getStatsEntries(supabase, user.id, dateFrom, dateTo)

  return (
    <StatsClient
      dateFrom={dateFrom}
      dateTo={dateTo}
      entries={data}
      errorMessage={error ? 'Could not load statistics for the selected date range.' : ''}
    />
  )
}

function StatsFallback() {
  return <StatsClient dateFrom="" dateTo="" entries={[]} isLoading />
}

export default function StatsPage(props: StatsPageProps) {
  return (
    <Suspense fallback={<StatsFallback />}>
      <StatsData {...props} />
    </Suspense>
  )
}
