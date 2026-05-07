'use client'

import { useMemo, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { formatLocalDateOnly, parseDateOnly } from '@/lib/dateOnly'
import styles from './DatePicker.module.scss'

type DatePickerProps = {
  id: string
  value: string
  onChange: (value: string) => void
  className?: string
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
})
const DATE_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const addMonths = (date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() + months, 1)

const getMonthDays = (monthDate: Date) => {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const firstWeekdayOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return [
    ...Array.from({ length: firstWeekdayOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
  ]
}

const getInitialMonth = (value: string) => {
  if (!value) return new Date()

  const parsed = parseDateOnly(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

const formatDateLabel = (value: string) => {
  if (!value) return 'Select date'

  const parsed = parseDateOnly(value)
  return Number.isNaN(parsed.getTime()) ? 'Select date' : DATE_LABEL_FORMATTER.format(parsed)
}

export function DatePicker({ id, value, onChange, className }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() => getInitialMonth(value))
  const selectedDate = value ? parseDateOnly(value) : null
  const monthDays = useMemo(() => getMonthDays(visibleMonth), [visibleMonth])

  const selectDate = (date: Date) => {
    onChange(formatLocalDateOnly(date))
    setVisibleMonth(date)
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <input value={value} readOnly tabIndex={-1} className={styles.DatePickerHiddenInput} />
      <Popover.Trigger asChild>
        <button id={id} type="button" className={[styles.DatePickerTrigger, className].filter(Boolean).join(' ')}>
          <span>{formatDateLabel(value)}</span>
          <span className={styles.DatePickerTriggerIcon} aria-hidden="true">
            ▾
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className={styles.DatePickerContent} sideOffset={8} align="start">
          <div className={styles.DatePickerHeader}>
            <button
              type="button"
              className={styles.DatePickerNavButton}
              onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
              aria-label="Previous month"
            >
              ‹
            </button>
            <div className={styles.DatePickerMonthLabel}>{MONTH_LABEL_FORMATTER.format(visibleMonth)}</div>
            <button
              type="button"
              className={styles.DatePickerNavButton}
              onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className={styles.DatePickerWeekDays} aria-hidden="true">
            {WEEK_DAYS.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className={styles.DatePickerDaysGrid}>
            {monthDays.map((date, index) =>
              date ? (
                <button
                  key={formatLocalDateOnly(date)}
                  type="button"
                  className={styles.DatePickerDayButton}
                  data-selected={
                    selectedDate && formatLocalDateOnly(selectedDate) === formatLocalDateOnly(date)
                      ? 'true'
                      : undefined
                  }
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                </button>
              ) : (
                <div key={`empty-${index}`} className={styles.DatePickerEmptyDay} />
              ),
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
