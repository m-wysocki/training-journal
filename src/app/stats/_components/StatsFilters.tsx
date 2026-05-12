'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import DateRangeFiltersBar from '@/components/DateRangeFiltersBar'
import { shiftWeekRange } from '@/lib/trainingDateRange'

type StatsFiltersProps = {
  dateFrom: string
  dateTo: string
}

export default function StatsFilters({ dateFrom, dateTo }: StatsFiltersProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const updateRange = (nextDateFrom: string, nextDateTo: string) => {
    const params = new URLSearchParams()
    params.set('dateFrom', nextDateFrom)
    params.set('dateTo', nextDateTo)
    startTransition(() => {
      router.push(`/stats?${params.toString()}`, { scroll: false })
    })
  }

  const shiftDateRangeByWeek = (direction: -1 | 1) => {
    const nextRange = shiftWeekRange(dateFrom, direction)
    updateRange(nextRange.dateFrom, nextRange.dateTo)
  }

  return (
    <DateRangeFiltersBar
      dateFrom={dateFrom}
      dateTo={dateTo}
      onDateRangeChange={updateRange}
      onShiftWeek={shiftDateRangeByWeek}
      idPrefix="stats"
    />
  )
}
