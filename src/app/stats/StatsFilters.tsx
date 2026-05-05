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

  const updateRange = (nextDateFrom: string, nextDateTo: string) => {
    const params = new URLSearchParams()
    params.set('dateFrom', nextDateFrom)
    params.set('dateTo', nextDateTo)
    startTransition(() => {
      router.push(`/stats?${params.toString()}`)
    })
  }

  const shiftDateRangeByWeek = (direction: -1 | 1) => {
    const nextRange = shiftWeekRange(dateFrom, direction)
    updateRange(nextRange.dateFrom, nextRange.dateTo)
  }

  return (
    <div className={styles.filtersBar}>
      <Accordion.Root type="single" collapsible className={styles.filtersAccordion}>
        <Accordion.Item value="filters" className={styles.filtersAccordionItem}>
          <Accordion.Header className={styles.filtersAccordionHeader}>
            <Accordion.Trigger className={styles.filtersTrigger}>
              Filters
              <span className={styles.filtersTriggerIcon} aria-hidden="true">
                ▾
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className={styles.filtersContent}>
            <div className={styles.dateRangeFields}>
              <div className={styles.datePickerGroup}>
                <label htmlFor="dateFrom" className={styles.label}>
                  From
                </label>
                <DatePicker id="dateFrom" value={dateFrom} onChange={(value) => updateRange(value, dateTo)} />
              </div>
              <div className={styles.datePickerGroup}>
                <label htmlFor="dateTo" className={styles.label}>
                  To
                </label>
                <DatePicker id="dateTo" value={dateTo} onChange={(value) => updateRange(dateFrom, value)} />
              </div>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>

      <div className={styles.compactWeekBar}>
        <button
          type="button"
          className={styles.weekIconButton}
          onClick={() => shiftDateRangeByWeek(-1)}
          aria-label="Previous week"
        >
          ‹
        </button>
        <p className={styles.weekRange}>{formatDateRange(dateFrom, dateTo)}</p>
        <button
          type="button"
          className={styles.weekIconButton}
          onClick={() => shiftDateRangeByWeek(1)}
          aria-label="Next week"
        >
          ›
        </button>
      </div>
    </div>
  )
}
