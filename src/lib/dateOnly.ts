const padDatePart = (value: number) => String(value).padStart(2, '0')

export const formatLocalDateOnly = (date: Date) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`

export const parseDateOnly = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}
