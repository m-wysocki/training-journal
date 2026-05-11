'use client'

import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { DatePicker } from '@/components/DatePicker'
import IconButton from '@/components/IconButton'
import { formatDateRange } from '@/lib/trainingDateRange'
import styles from './DateRangeFiltersBar.module.scss'
import type { ReactNode } from 'react'

type DateRangeFiltersBarProps = {
  dateFrom: string
  dateTo: string
  onDateRangeChange: (nextDateFrom: string, nextDateTo: string) => void
  onShiftWeek: (direction: -1 | 1) => void
  datePickerCloseOnSelect?: boolean
  accordionValue?: string
  onAccordionValueChange?: (value: string) => void
  extraFilters?: ReactNode
  idPrefix?: string
}

export default function DateRangeFiltersBar({
  dateFrom,
  dateTo,
  onDateRangeChange,
  onShiftWeek,
  datePickerCloseOnSelect,
  accordionValue,
  onAccordionValueChange,
  extraFilters,
  idPrefix = 'date-range',
}: DateRangeFiltersBarProps) {
  const hasDateRange = Boolean(dateFrom && dateTo)
  const dateFromId = `${idPrefix}-from`
  const dateToId = `${idPrefix}-to`

  const accordionControlProps =
    accordionValue !== undefined && onAccordionValueChange
      ? { value: accordionValue, onValueChange: onAccordionValueChange }
      : {}

  return (
    <div className={styles.DateRangeFiltersBar}>
      <Accordion.Root
        type="single"
        collapsible
        className={styles.DateRangeFiltersBarAccordion}
        {...accordionControlProps}
      >
        <Accordion.Item value="filters" className={styles.DateRangeFiltersBarAccordionItem}>
          <Accordion.Header className={styles.DateRangeFiltersBarAccordionHeader}>
            <Accordion.Trigger className={styles.DateRangeFiltersBarTrigger}>
              Filters
              <span className={styles.DateRangeFiltersBarTriggerIcon} aria-hidden="true">
                <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className={styles.DateRangeFiltersBarContent}>
            <div className={styles.DateRangeFiltersBarDateRangeFields}>
              <div className={styles.DateRangeFiltersBarDatePickerGroup}>
                <label htmlFor={dateFromId} className={styles.DateRangeFiltersBarLabel}>
                  From
                </label>
                <DatePicker
                  id={dateFromId}
                  value={dateFrom}
                  closeOnSelect={datePickerCloseOnSelect}
                  onChange={(value) => onDateRangeChange(value, dateTo)}
                />
              </div>
              <div className={styles.DateRangeFiltersBarDatePickerGroup}>
                <label htmlFor={dateToId} className={styles.DateRangeFiltersBarLabel}>
                  To
                </label>
                <DatePicker
                  id={dateToId}
                  value={dateTo}
                  closeOnSelect={datePickerCloseOnSelect}
                  onChange={(value) => onDateRangeChange(dateFrom, value)}
                />
              </div>
            </div>

            {extraFilters}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>

      <div className={styles.DateRangeFiltersBarCompactWeekBar}>
        <IconButton
          className={styles.DateRangeFiltersBarWeekIconButton}
          icon={ChevronLeft}
          iconSize={14}
          iconStrokeWidth={2.2}
          onClick={() => onShiftWeek(-1)}
          aria-label="Previous week"
          disabled={!hasDateRange}
        />
        <p className={styles.DateRangeFiltersBarWeekRange}>
          {hasDateRange ? formatDateRange(dateFrom, dateTo) : 'Loading date range...'}
        </p>
        <IconButton
          className={styles.DateRangeFiltersBarWeekIconButton}
          icon={ChevronRight}
          iconSize={14}
          iconStrokeWidth={2.2}
          onClick={() => onShiftWeek(1)}
          aria-label="Next week"
          disabled={!hasDateRange}
        />
      </div>
    </div>
  )
}
