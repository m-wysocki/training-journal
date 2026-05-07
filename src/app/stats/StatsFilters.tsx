'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import * as Accordion from '@radix-ui/react-accordion'
import { DatePicker } from '@/components/DatePicker'
import { formatDateRange, shiftWeekRange } from '@/lib/trainingDateRange'
import styles from './page.module.scss'

type StatsFiltersProps = {
  dateFrom: string
  dateTo: string
}

export default function StatsFilters({ dateFrom, dateTo }: StatsFiltersProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const hasDateRange = Boolean(dateFrom && dateTo)

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
    <div className={styles.StatsFiltersBar}>
      <Accordion.Root type="single" collapsible className={styles.StatsFiltersAccordion}>
        <Accordion.Item value="filters" className={styles.StatsFiltersAccordionItem}>
          <Accordion.Header className={styles.StatsFiltersAccordionHeader}>
            <Accordion.Trigger className={styles.StatsFiltersTrigger}>
              Filters
              <span className={styles.StatsFiltersTriggerIcon} aria-hidden="true">
                ▾
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className={styles.StatsFiltersContent}>
            <div className={styles.StatsDateRangeFields}>
              <div className={styles.StatsDatePickerGroup}>
                <label htmlFor="dateFrom" className={styles.StatsLabel}>
                  From
                </label>
                <DatePicker id="dateFrom" value={dateFrom} onChange={(value) => updateRange(value, dateTo)} />
              </div>
              <div className={styles.StatsDatePickerGroup}>
                <label htmlFor="dateTo" className={styles.StatsLabel}>
                  To
                </label>
                <DatePicker id="dateTo" value={dateTo} onChange={(value) => updateRange(dateFrom, value)} />
              </div>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>

      <div className={styles.StatsCompactWeekBar}>
        <button
          type="button"
          className={styles.StatsWeekIconButton}
          onClick={() => shiftDateRangeByWeek(-1)}
          aria-label="Previous week"
          disabled={!hasDateRange}
        >
          ‹
        </button>
        <p className={styles.StatsWeekRange}>
          {hasDateRange ? formatDateRange(dateFrom, dateTo) : 'Loading date range...'}
        </p>
        <button
          type="button"
          className={styles.StatsWeekIconButton}
          onClick={() => shiftDateRangeByWeek(1)}
          aria-label="Next week"
          disabled={!hasDateRange}
        >
          ›
        </button>
      </div>
    </div>
  )
}
