import { formatLocalDateOnly, parseDateOnly } from '@/lib/dateOnly'

export type TrainingDateRange = {
  dateFrom: string
  dateTo: string
}

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

const getStartOfWeek = (date: Date) => {
  const normalizedDate = new Date(date)
  normalizedDate.setHours(0, 0, 0, 0)

  const day = normalizedDate.getDay()
  const offset = day === 0 ? -6 : 1 - day
  normalizedDate.setDate(normalizedDate.getDate() + offset)

  return normalizedDate
}

export const getCurrentWeekRange = (): TrainingDateRange => {
  const dateFrom = getStartOfWeek(new Date())
  const dateTo = addDays(dateFrom, 6)

  return {
    dateFrom: formatLocalDateOnly(dateFrom),
    dateTo: formatLocalDateOnly(dateTo),
  }
}

export const shiftWeekRange = (dateFrom: string, direction: -1 | 1): TrainingDateRange => {
  const nextDateFrom = addDays(getStartOfWeek(parseDateOnly(dateFrom)), direction * 7)
  const nextDateTo = addDays(nextDateFrom, 6)

  return {
    dateFrom: formatLocalDateOnly(nextDateFrom),
    dateTo: formatLocalDateOnly(nextDateTo),
  }
}

export const formatDateRange = (dateFrom: string, dateTo: string) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return `${formatter.format(parseDateOnly(dateFrom))} - ${formatter.format(parseDateOnly(dateTo))}`
}
