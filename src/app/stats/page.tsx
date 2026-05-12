import { Suspense } from 'react'
import { getCurrentWeekRange } from '@/lib/trainingDateRange'
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

  return <StatsClient dateFrom={dateFrom} dateTo={dateTo} />
}

function StatsFallback() {
  return <StatsClient dateFrom="" dateTo="" />
}

export default function StatsPage(props: StatsPageProps) {
  return (
    <Suspense fallback={<StatsFallback />}>
      <StatsData {...props} />
    </Suspense>
  )
}
