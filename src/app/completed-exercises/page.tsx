'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Accordion from '@radix-ui/react-accordion'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { supabase } from '@/lib/supabase'
import BackLink from '@/components/BackLink'
import { DatePicker } from '@/components/DatePicker'
import PageContainer from '@/components/PageContainer'
import { formatLocalDateOnly, parseDateOnly } from '@/lib/dateOnly'
import styles from './page.module.scss'

type CompletedExerciseRow = {
  id: string
  exercise_id: string
  performed_at: string
  sets: number | null
  reps_per_set: number[] | null
  duration_per_set_seconds: number[] | null
  load_kg: number | null
  distance_km: number | null
  pace_min_per_km: number | null
  note: string | null
  exercise: {
    id: string
    name: string
    exercise_category_id: string
    exercise_type: 'strength' | 'cardio'
    exercise_category: {
      name: string
    } | null
  } | null
}

type DayGroup = {
  date: string
  exerciseCategories: {
    name: string
    entries: CompletedExerciseRow[]
  }[]
}

type CopyCategoryTarget = {
  sourceDate: string
  categoryName: string
  entries: CompletedExerciseRow[]
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parseDateOnly(date))

const getStartOfWeek = (date: Date) => {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  const day = normalized.getDay()
  const diff = day === 0 ? -6 : 1 - day
  normalized.setDate(normalized.getDate() + diff)
  return normalized
}

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const formatWeekRange = (start: Date, end: Date) =>
  new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
  }).format(start) +
  ' - ' +
  new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(end)

const getIsoWeekValue = (date: Date) => {
  const target = new Date(date.valueOf())
  const dayNr = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const firstDayNr = (firstThursday.getDay() + 6) % 7
  firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3)
  const weekNumber = 1 + Math.round((target.getTime() - firstThursday.getTime()) / 604800000)
  return `${target.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`
}

const parseIsoWeek = (value: string) => {
  const match = /^(\d{4})-W(\d{2})$/.exec(value)
  if (!match) {
    return getStartOfWeek(new Date())
  }

  const year = Number(match[1])
  const week = Number(match[2])
  const januaryFourth = new Date(year, 0, 4)
  const start = getStartOfWeek(januaryFourth)
  return addDays(start, (week - 1) * 7)
}

const formatPace = (paceMinPerKm: number) => {
  const totalSeconds = Math.round(paceMinPerKm * 60)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')} min/km`
}

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return remainingSeconds === 0 ? `${minutes}m` : `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

const formatEntryDetails = (entry: CompletedExerciseRow) => {
  if (entry.exercise?.exercise_type === 'cardio') {
    const details = []

    if (entry.distance_km !== null) {
      details.push(`Distance: ${Number(entry.distance_km).toFixed(1)} km`)
    }

    if (entry.pace_min_per_km !== null) {
      details.push(`Pace: ${formatPace(Number(entry.pace_min_per_km))}`)
    }

    return details.join(' | ')
  }

  const details = [
    `Sets: ${entry.sets ?? '-'}`,
  ]

  if (entry.duration_per_set_seconds?.length) {
    details.push(`Time: ${entry.duration_per_set_seconds.map(formatDuration).join(' / ')}`)
  } else {
    details.push(`Reps: ${entry.reps_per_set?.join(' / ') ?? '-'}`)
  }

  if (entry.load_kg !== null) {
    details.push(`Load: ${Number(entry.load_kg)} kg`)
  }

  return details.join(' | ')
}

export default function CompletedExercisesPage() {
  const router = useRouter()
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => getStartOfWeek(new Date()))
  const [entries, setEntries] = useState<CompletedExerciseRow[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedExerciseCategory, setSelectedExerciseCategory] = useState('all')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)
  const [copyTarget, setCopyTarget] = useState<CopyCategoryTarget | null>(null)
  const [copyDate, setCopyDate] = useState('')
  const [copyLoading, setCopyLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const isCopyDateSameAsSource = Boolean(copyTarget && copyDate === copyTarget.sourceDate)
  const weekStart = useMemo(() => selectedWeekStart, [selectedWeekStart])
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart])
  const weekValue = useMemo(() => getIsoWeekValue(weekStart), [weekStart])

  const loadData = useCallback(() => {
    void supabase
      .from('completed_exercises')
      .select(
        `
          id,
          exercise_id,
          performed_at,
          sets,
          reps_per_set,
          duration_per_set_seconds,
          load_kg,
          distance_km,
          pace_min_per_km,
          note,
          exercise:exercises (
            id,
            name,
            exercise_category_id,
            exercise_type,
            exercise_category:exercise_categories (
              name
            )
          )
        `,
      )
      .gte('performed_at', formatLocalDateOnly(weekStart))
      .lte('performed_at', formatLocalDateOnly(weekEnd))
      .order('performed_at', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setErrorMessage('Could not load data.')
          setSuccessMessage('')
          return
        }

        setErrorMessage('')
        setEntries((data as unknown as CompletedExerciseRow[]) || [])
      })
  }, [weekStart, weekEnd])

  useEffect(() => {
    loadData()
  }, [loadData])

  const updateSelectedWeekStart = (nextWeekStart: Date) => {
    setSelectedExerciseCategory('all')
    setSelectedWeekStart(nextWeekStart)
  }

  const exerciseCategoryOptions = useMemo(
    () =>
      Array.from(
        new Set(entries.map((entry) => entry.exercise?.exercise_category?.name || 'Unknown exercise category')),
      ).sort((a, b) => a.localeCompare(b)),
    [entries],
  )

  const filteredEntries = useMemo(
    () =>
      selectedExerciseCategory === 'all'
        ? entries
        : entries.filter(
            (entry) => (entry.exercise?.exercise_category?.name || 'Unknown exercise category') === selectedExerciseCategory,
          ),
    [entries, selectedExerciseCategory],
  )

  const groupedByDate = useMemo<DayGroup[]>(() => {
    const map = new Map<string, CompletedExerciseRow[]>()

    filteredEntries.forEach((entry) => {
      const current = map.get(entry.performed_at) || []
      map.set(entry.performed_at, [...current, entry])
    })

    return Array.from(map.entries()).map(([date, dayEntries]) => {
      const exerciseCategoryMap = new Map<string, CompletedExerciseRow[]>()

      dayEntries.forEach((entry) => {
        const exerciseCategoryName = entry.exercise?.exercise_category?.name || 'Unknown exercise category'
        const current = exerciseCategoryMap.get(exerciseCategoryName) || []
        exerciseCategoryMap.set(exerciseCategoryName, [...current, entry])
      })

      return {
        date,
        exerciseCategories: Array.from(exerciseCategoryMap.entries()).map(([name, groupedEntries]) => ({
          name,
          entries: groupedEntries,
        })),
      }
    })
  }, [filteredEntries])

  const openDelete = (id: string) => {
    setDeletingEntryId(id)
    setDeleteOpen(true)
    setSuccessMessage('')
  }

  const closeDelete = () => {
    setDeleteOpen(false)
    setDeletingEntryId(null)
  }

  const confirmDelete = async () => {
    if (!deletingEntryId) return

    setDeleteLoading(true)

    const { error } = await supabase.from('completed_exercises').delete().eq('id', deletingEntryId)

    setDeleteLoading(false)

    if (error) {
      setErrorMessage('Could not delete the entry.')
      setSuccessMessage('')
      closeDelete()
      return
    }

    setSuccessMessage('Deleted entry.')
    setEntries((prev) => prev.filter((row) => row.id !== deletingEntryId))
    closeDelete()
  }

  const openCopyCategory = (sourceDate: string, categoryName: string, categoryEntries: CompletedExerciseRow[]) => {
    setCopyTarget({
      sourceDate,
      categoryName,
      entries: categoryEntries,
    })
    setCopyDate(formatLocalDateOnly(new Date()))
    setCopyOpen(true)
    setErrorMessage('')
    setSuccessMessage('')
  }

  const closeCopyCategory = () => {
    setCopyOpen(false)
    setCopyTarget(null)
    setCopyDate('')
  }

  const confirmCopyCategory = async () => {
    if (!copyTarget || !copyDate || copyDate === copyTarget.sourceDate) return

    setCopyLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setCopyLoading(false)
      setErrorMessage('Sign in before copying exercises.')
      return
    }

    const rowsToInsert = copyTarget.entries.map((entry) => ({
      exercise_id: entry.exercise_id,
      sets: entry.sets,
      reps_per_set: entry.reps_per_set,
      duration_per_set_seconds: entry.duration_per_set_seconds,
      load_kg: entry.load_kg,
      distance_km: entry.distance_km,
      pace_min_per_km: entry.pace_min_per_km,
      note: entry.note ?? '',
      performed_at: copyDate,
      user_id: session.user.id,
    }))

    const { error } = await supabase.from('completed_exercises').insert(rowsToInsert)

    setCopyLoading(false)

    if (error) {
      setErrorMessage('Could not copy exercises to the selected date.')
      return
    }

    const copiedCount = rowsToInsert.length
    setSuccessMessage(
      `Copied ${copiedCount} ${copiedCount === 1 ? 'exercise' : 'exercises'} from ${copyTarget.categoryName} to ${formatDate(copyDate)}.`,
    )
    closeCopyCategory()
    loadData()
  }

  return (
    <div className={styles.wrapper}>
      <PageContainer className={styles.container}>
        <div className={styles.header}>
          <BackLink href="/" label="← Back to Home" />
          <div className={styles.headerTop}>
            <div className={styles.headerCopy}>
              <h1 className={styles.title}>Completed Exercises</h1>
              <p className={styles.description}>Browse your logged exercises grouped by workout date.</p>
            </div>
          </div>
        </div>

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
                <div className={styles.weekPickerGroup}>
                  <label htmlFor="weekPicker" className={styles.filterLabel}>
                    Week
                  </label>
                  <input
                    id="weekPicker"
                    type="week"
                    className={styles.filterInput}
                    value={weekValue}
                    onChange={(e) => updateSelectedWeekStart(parseIsoWeek(e.target.value))}
                  />
                </div>

                <div className={styles.filterField}>
                  <label htmlFor="exerciseCategoryFilter" className={styles.filterLabel}>
                    Exercise Category
                  </label>
                  <select
                    id="exerciseCategoryFilter"
                    className={styles.filterSelect}
                    value={selectedExerciseCategory}
                    onChange={(e) => setSelectedExerciseCategory(e.target.value)}
                  >
                    <option value="all">All exercise categories</option>
                    {exerciseCategoryOptions.map((exerciseCategory) => (
                      <option key={exerciseCategory} value={exerciseCategory}>
                        {exerciseCategory}
                      </option>
                    ))}
                  </select>
                </div>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion.Root>

          <div className={styles.compactWeekBar}>
            <button
              type="button"
              className={styles.weekIconButton}
              onClick={() => updateSelectedWeekStart(addDays(weekStart, -7))}
              aria-label="Previous week"
            >
              ‹
            </button>
            <p className={styles.weekRange}>{formatWeekRange(weekStart, weekEnd)}</p>
            <button
              type="button"
              className={styles.weekIconButton}
              onClick={() => updateSelectedWeekStart(addDays(weekStart, 7))}
              aria-label="Next week"
            >
              ›
            </button>
          </div>
        </div>

        {errorMessage && <div className={styles.errorBox}>{errorMessage}</div>}
        {successMessage && <div className={styles.successBox}>{successMessage}</div>}

        {!errorMessage && groupedByDate.length === 0 && (
          <div className={styles.emptyState}>No completed exercises for this week.</div>
        )}

        <div className={styles.daysList}>
          {groupedByDate.map((group) => (
            <section key={group.date} className={styles.dayCard}>
              <h2 className={styles.dayTitle}>{formatDate(group.date)}</h2>
              <div className={styles.exerciseCategorySections}>
                {group.exerciseCategories.map((exerciseCategory) => (
                  <section key={`${group.date}-${exerciseCategory.name}`} className={styles.exerciseCategorySection}>
                    <div className={styles.exerciseCategoryHeader}>
                      <h3 className={styles.exerciseCategoryHeading}>{exerciseCategory.name}</h3>
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button
                            type="button"
                            className={styles.menuTrigger}
                            aria-label={`Options for ${exerciseCategory.name}`}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 15 15"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className={styles.menuIcon}
                            >
                              <path
                                d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z"
                                fill="currentColor"
                                fillRule="evenodd"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content className={styles.menuContent} align="end">
                            <DropdownMenu.Item
                              className={styles.menuItem}
                              onSelect={() =>
                                openCopyCategory(group.date, exerciseCategory.name, exerciseCategory.entries)
                              }
                            >
                              Copy to another date
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>
                    <ul className={styles.entriesList}>
                      {exerciseCategory.entries.map((entry) => (
                        <li key={entry.id} className={styles.entryItem}>
                          <div className={styles.entryRow}>
                            <div className={styles.entryMain}>
                              <div className={styles.entryTop}>
                                <p className={styles.exerciseName}>
                                  {entry.exercise?.name || 'Unknown exercise'}
                                </p>
                              </div>
                              <p className={styles.entryDetails}>
                                {formatEntryDetails(entry)}
                              </p>
                              {entry.note?.trim() ? (
                                <p className={styles.entryNote}>{entry.note.trim()}</p>
                              ) : null}
                            </div>

                            <DropdownMenu.Root>
                              <DropdownMenu.Trigger asChild>
                                <button type="button" className={styles.menuTrigger} aria-label="Opcje">
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 15 15"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={styles.menuIcon}
                                  >
                                    <path
                                      d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z"
                                      fill="currentColor"
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </DropdownMenu.Trigger>
                              <DropdownMenu.Portal>
                                <DropdownMenu.Content className={styles.menuContent} align="end">
                                  <DropdownMenu.Item
                                    className={styles.menuItem}
                                    onSelect={() => router.push(`/completed-exercises/${entry.id}/edit`)}
                                  >
                                    Edit
                                  </DropdownMenu.Item>
                                  <DropdownMenu.Item
                                    className={styles.menuItemDanger}
                                    onSelect={() => openDelete(entry.id)}
                                  >
                                    Delete
                                  </DropdownMenu.Item>
                                </DropdownMenu.Content>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </section>
          ))}
        </div>

        <Dialog.Root open={deleteOpen} onOpenChange={(open) => !open && closeDelete()}>
          <Dialog.Portal>
            <Dialog.Overlay className={styles.overlay} />
            <Dialog.Content className={styles.dialogContentSmall}>
              <Dialog.Title className={styles.dialogTitle}>Delete entry?</Dialog.Title>
              <Dialog.Description className={styles.dialogDescription}>
                This action cannot be undone.
              </Dialog.Description>
              <div className={styles.dialogActions}>
                <Dialog.Close asChild>
                  <button type="button" className={styles.ghostButton}>
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  className={styles.dangerButton}
                  disabled={deleteLoading}
                  onClick={confirmDelete}
                >
                  {deleteLoading ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <Dialog.Root open={copyOpen} onOpenChange={(open) => !open && closeCopyCategory()}>
          <Dialog.Portal>
            <Dialog.Overlay className={styles.overlay} />
            <Dialog.Content className={styles.dialogContentSmall}>
              <Dialog.Title className={styles.dialogTitle}>Copy exercises</Dialog.Title>
              <Dialog.Description className={styles.dialogDescription}>
                {copyTarget
                  ? `Copy ${copyTarget.categoryName} from ${formatDate(copyTarget.sourceDate)} to another date.`
                  : 'Choose a date to copy these exercises.'}
              </Dialog.Description>
              <div className={styles.dialogForm}>
                <div className={styles.field}>
                  <label htmlFor="copyDate" className={styles.label}>
                    New date
                  </label>
                  <DatePicker
                    id="copyDate"
                    value={copyDate}
                    onChange={setCopyDate}
                  />
                  {isCopyDateSameAsSource ? (
                    <p className={styles.fieldHint}>Choose a different date than the source workout.</p>
                  ) : null}
                </div>
                <div className={styles.dialogActions}>
                  <Dialog.Close asChild>
                    <button type="button" className={styles.ghostButton}>
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    disabled={copyLoading || !copyDate || isCopyDateSameAsSource}
                    onClick={confirmCopyCategory}
                  >
                    {copyLoading ? 'Copying...' : 'Copy'}
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </PageContainer>
    </div>
  )
}
