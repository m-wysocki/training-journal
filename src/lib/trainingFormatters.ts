import { parseDateOnly } from '@/lib/dateOnly'

export const formatLongDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parseDateOnly(date))

export const formatWeekdayDate = formatLongDate

export const formatPace = (paceMinPerKm: number) => {
  const totalSeconds = Math.round(paceMinPerKm * 60)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${String(seconds).padStart(2, '0')} min/km`
}

export const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor(seconds / 60)
  const remainingMinutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    if (remainingMinutes === 0) {
      return remainingSeconds === 0 ? `${hours}h` : `${hours}h ${remainingSeconds}s`
    }

    return remainingSeconds === 0
      ? `${hours}h ${remainingMinutes}min`
      : `${hours}h ${remainingMinutes}min ${remainingSeconds}s`
  }

  return remainingSeconds === 0 ? `${minutes}m` : `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

export const formatDurationHoursMinutes = (seconds: number) => {
  const totalMinutes = Math.floor(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${hours}h ${minutes}min`
}
