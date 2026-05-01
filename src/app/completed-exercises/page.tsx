'use client'

import { ArrowDown, ArrowUp, ClipboardList, Ellipsis } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Accordion from '@radix-ui/react-accordion'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { supabase } from '@/lib/supabase'
import BackLink from '@/components/BackLink'
import { DatePicker } from '@/components/DatePicker'
import PageContainer from '@/components/PageContainer'
import { formatLocalDateOnly } from '@/lib/dateOnly'
import { formatDateRange, getCurrentWeekRange, shiftWeekRange } from '@/lib/trainingDateRange'
import { formatDuration, formatDurationHoursMinutes, formatPace, formatWeekdayDate } from '@/lib/trainingFormatters'
import styles from './page.module.scss'

type CompletedExerciseRow = {
  id: string
  exercise_id: string
  performed_at: string
  created_at: string
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
    exercise_type: 'strength' | 'cardio' | 'duration'
    exercise_category: {
      name: string
    } | null
  } | null
}

type ExerciseCategory = {
  id: string
  name: string
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

type EntryComparisonMetric = {
  key: 'reps' | 'load' | 'time' | 'distance' | 'pace'
  label: string
  direction: 'up' | 'down'
  tone: 'positive' | 'negative'
  value: string
}

type EntryComparisons = Record<string, EntryComparisonMetric[]>

const sumValues = (values: number[] | null) => values?.reduce((total, value) => total + value, 0) ?? null

const formatSignedNumber = (value: number) => {
  const absoluteValue = Math.abs(value)
  const formattedValue = Number.isInteger(absoluteValue) ? String(absoluteValue) : absoluteValue.toFixed(1)

  return `${value > 0 ? '+' : '-'}${formattedValue}`
}

const formatSignedDuration = (seconds: number) => `${seconds > 0 ? '+' : '-'}${formatDuration(Math.abs(seconds))}`

const formatSignedPace = (paceMinPerKm: number) => {
  const sign = paceMinPerKm > 0 ? '+' : '-'
  const totalSeconds = Math.round(Math.abs(paceMinPerKm) * 60)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${sign}${minutes}:${String(seconds).padStart(2, '0')} min/km`
}

const createComparisonMetric = (
  key: EntryComparisonMetric['key'],
  label: string,
  delta: number,
  value: string,
  isIncreasePositive = true,
): EntryComparisonMetric | null => {
  if (delta === 0) return null

  const isPositive = isIncreasePositive ? delta > 0 : delta < 0

  return {
    key,
    label,
    direction: delta > 0 ? 'up' : 'down',
    tone: isPositive ? 'positive' : 'negative',
    value,
  }
}

const getEntryComparisonMetrics = (
  currentEntry: CompletedExerciseRow,
  previousEntry: CompletedExerciseRow | undefined,
) => {
  if (!previousEntry) return []

  const metrics: EntryComparisonMetric[] = []
  const currentReps = sumValues(currentEntry.reps_per_set)
  const previousReps = sumValues(previousEntry.reps_per_set)
  const currentDuration = sumValues(currentEntry.duration_per_set_seconds)
  const previousDuration = sumValues(previousEntry.duration_per_set_seconds)

  if (currentReps !== null && previousReps !== null) {
    const delta = currentReps - previousReps
    const metric = createComparisonMetric('reps', 'Reps', delta, formatSignedNumber(delta))

    if (metric) metrics.push(metric)
  }

  if (currentEntry.load_kg !== null && previousEntry.load_kg !== null) {
    const delta = Number(currentEntry.load_kg) - Number(previousEntry.load_kg)
    const metric = createComparisonMetric('load', 'Load', delta, `${formatSignedNumber(delta)} kg`)

    if (metric) metrics.push(metric)
  }

  if (currentDuration !== null && previousDuration !== null) {
    const delta = currentDuration - previousDuration
    const metric = createComparisonMetric('time', 'Time', delta, formatSignedDuration(delta))

    if (metric) metrics.push(metric)
  }

  if (currentEntry.distance_km !== null && previousEntry.distance_km !== null) {
    const delta = Number(currentEntry.distance_km) - Number(previousEntry.distance_km)
    const metric = createComparisonMetric('distance', 'Distance', delta, `${formatSignedNumber(delta)} km`)

    if (metric) metrics.push(metric)
  }

  if (currentEntry.pace_min_per_km !== null && previousEntry.pace_min_per_km !== null) {
    const delta = Number(currentEntry.pace_min_per_km) - Number(previousEntry.pace_min_per_km)
    const metric = createComparisonMetric('pace', 'Pace', delta, formatSignedPace(delta), false)

    if (metric) metrics.push(metric)
  }

  return metrics
}

const compareEntriesByRecency = (firstEntry: CompletedExerciseRow, secondEntry: CompletedExerciseRow) => {
  const performedAtComparison = secondEntry.performed_at.localeCompare(firstEntry.performed_at)

  if (performedAtComparison !== 0) return performedAtComparison

  return secondEntry.created_at.localeCompare(firstEntry.created_at)
}

const getEntryComparisons = (historyEntries: CompletedExerciseRow[], visibleEntryIds: Set<string>) => {
  const entriesByExercise = new Map<string, CompletedExerciseRow[]>()
  const comparisons: EntryComparisons = {}

  historyEntries.forEach((entry) => {
    const currentEntries = entriesByExercise.get(entry.exercise_id) ?? []
    entriesByExercise.set(entry.exercise_id, [...currentEntries, entry])
  })

  entriesByExercise.forEach((exerciseEntries) => {
    const sortedEntries = [...exerciseEntries].sort(compareEntriesByRecency)

    sortedEntries.forEach((entry, index) => {
      if (!visibleEntryIds.has(entry.id)) return

      const metrics = getEntryComparisonMetrics(entry, sortedEntries[index + 1])

      if (metrics.length > 0) {
        comparisons[entry.id] = metrics
      }
    })
  })

  return comparisons
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

  if (entry.exercise?.exercise_type === 'duration') {
    return `Time: ${entry.duration_per_set_seconds?.[0] ? formatDurationHoursMinutes(entry.duration_per_set_seconds[0]) : '-'}`
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
  const [{ dateFrom, dateTo }, setDateRange] = useState(getCurrentWeekRange)
  const [entries, setEntries] = useState<CompletedExerciseRow[]>([])
  const [exerciseCategories, setExerciseCategories] = useState<ExerciseCategory[]>([])
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
  const [entryComparisons, setEntryComparisons] = useState<EntryComparisons>({})
  const isCopyDateSameAsSource = Boolean(copyTarget && copyDate === copyTarget.sourceDate)

  const loadData = useCallback(() => {
    void supabase
      .from('completed_exercises')
      .select(
        `
          id,
          exercise_id,
          performed_at,
          created_at,
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
      .gte('performed_at', dateFrom)
      .lte('performed_at', dateTo)
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
  }, [dateFrom, dateTo])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const exerciseIds = Array.from(new Set(entries.map((entry) => entry.exercise_id)))

    if (exerciseIds.length === 0) {
      return
    }

    let isActive = true

    void supabase
      .from('completed_exercises')
      .select(
        `
          id,
          exercise_id,
          performed_at,
          created_at,
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
      .in('exercise_id', exerciseIds)
      .lte('performed_at', dateTo)
      .order('performed_at', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!isActive) return

        if (error) {
          setEntryComparisons({})
          return
        }

        setEntryComparisons(
          getEntryComparisons((data as unknown as CompletedExerciseRow[]) || [], new Set(entries.map((entry) => entry.id))),
        )
      })

    return () => {
      isActive = false
    }
  }, [dateTo, entries])

  useEffect(() => {
    supabase
      .from('exercise_categories')
      .select('id, name')
      .order('created_at')
      .then(({ data, error }) => {
        if (error) {
          setErrorMessage('Could not load exercise categories.')
          setSuccessMessage('')
          return
        }

        setExerciseCategories(data || [])
      })
  }, [])

  const shiftDateRangeByWeek = (direction: -1 | 1) => {
    setDateRange(shiftWeekRange(dateFrom, direction))
  }

  const exerciseCategoryOptions = useMemo(() => {
    const categoryNames = new Set(exerciseCategories.map((category) => category.name))

    if (selectedExerciseCategory !== 'all') {
      categoryNames.add(selectedExerciseCategory)
    }

    return Array.from(categoryNames).sort((a, b) => a.localeCompare(b))
  }, [exerciseCategories, selectedExerciseCategory])

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
      `Copied ${copiedCount} ${copiedCount === 1 ? 'exercise' : 'exercises'} from ${copyTarget.categoryName} to ${formatWeekdayDate(copyDate)}.`,
    )
    closeCopyCategory()
    loadData()
  }

  return (
    <div className={styles.wrapper}>
      <PageContainer className={styles.container}>
        <div className={styles.header}>
          <BackLink href="/" label="← Back to Home" />
          <div className={styles.titleRow}>
            <div className={styles.titleIcon} aria-hidden="true">
              <ClipboardList size={22} strokeWidth={1.9} />
            </div>
            <h1 className={styles.title}>Completed Exercises</h1>
          </div>
          <p className={styles.description}>Browse your logged exercises grouped by workout date.</p>
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
                <div className={styles.dateRangeFields}>
                  <div className={styles.datePickerGroup}>
                    <label htmlFor="dateFrom" className={styles.filterLabel}>
                      From
                    </label>
                    <DatePicker
                      id="dateFrom"
                      value={dateFrom}
                      onChange={(value) => setDateRange((current) => ({ ...current, dateFrom: value }))}
                    />
                  </div>
                  <div className={styles.datePickerGroup}>
                    <label htmlFor="dateTo" className={styles.filterLabel}>
                      To
                    </label>
                    <DatePicker
                      id="dateTo"
                      value={dateTo}
                      onChange={(value) => setDateRange((current) => ({ ...current, dateTo: value }))}
                    />
                  </div>
                </div>

                <div className={styles.filterField}>
                  <p className={styles.filterLabel}>Exercise Category</p>
                  <div className={styles.badgeGroup} role="group" aria-label="Exercise category filter">
                    <button
                      type="button"
                      className={styles.choiceBadge}
                      aria-pressed={selectedExerciseCategory === 'all'}
                      data-selected={selectedExerciseCategory === 'all' ? 'true' : undefined}
                      onClick={() => setSelectedExerciseCategory('all')}
                    >
                      All
                    </button>
                    {exerciseCategoryOptions.map((exerciseCategory) => (
                      <button
                        key={exerciseCategory}
                        type="button"
                        className={styles.choiceBadge}
                        aria-pressed={selectedExerciseCategory === exerciseCategory}
                        data-selected={selectedExerciseCategory === exerciseCategory ? 'true' : undefined}
                        onClick={() => setSelectedExerciseCategory(exerciseCategory)}
                      >
                        {exerciseCategory}
                      </button>
                    ))}
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

        {errorMessage && <div className={styles.errorBox}>{errorMessage}</div>}
        {successMessage && <div className={styles.successBox}>{successMessage}</div>}

        {!errorMessage && groupedByDate.length === 0 && (
          <div className={styles.emptyState}>No completed exercises for this date range.</div>
        )}

        <div className={styles.daysList}>
          {groupedByDate.map((group) => (
            <section key={group.date} className={styles.dayCard}>
              <h2 className={styles.dayTitle}>{formatWeekdayDate(group.date)}</h2>
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
                            <Ellipsis size={16} strokeWidth={2} className={styles.menuIcon} aria-hidden="true" />
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
                              {entryComparisons[entry.id]?.length ? (
                                <div className={styles.entryComparisons} aria-label="Changes since previous session">
                                  {entryComparisons[entry.id].map((metric) => {
                                    const ComparisonIcon = metric.direction === 'up' ? ArrowUp : ArrowDown

                                    return (
                                      <span
                                        key={metric.key}
                                        className={styles.comparisonBadge}
                                        data-direction={metric.direction}
                                        data-tone={metric.tone}
                                      >
                                        <ComparisonIcon size={14} strokeWidth={2.4} aria-hidden="true" />
                                        <span>
                                          {metric.label}: {metric.value}
                                        </span>
                                      </span>
                                    )
                                  })}
                                </div>
                              ) : null}
                              {entry.note?.trim() ? (
                                <p className={styles.entryNote}>{entry.note.trim()}</p>
                              ) : null}
                            </div>

                            <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                              <button type="button" className={styles.menuTrigger} aria-label="Opcje">
                                <Ellipsis size={16} strokeWidth={2} className={styles.menuIcon} aria-hidden="true" />
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
                  ? `Copy ${copyTarget.categoryName} from ${formatWeekdayDate(copyTarget.sourceDate)} to another date.`
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
