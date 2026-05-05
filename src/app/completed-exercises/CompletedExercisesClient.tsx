'use client'

import { ArrowDown, ArrowUp, ClipboardList, Ellipsis } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import * as Accordion from '@radix-ui/react-accordion'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import BackLink from '@/components/BackLink'
import { DatePicker } from '@/components/DatePicker'
import PageContainer from '@/components/PageContainer'
import StatusPanel from '@/components/StatusPanel'
import { formatLocalDateOnly } from '@/lib/dateOnly'
import type { CompletedExerciseRow, EntryComparisons, ExerciseCategory } from '@/lib/completedExercises'
import {
  copyCompletedExerciseCategory,
  deleteCompletedExercise,
} from '@/app/completed-exercises/actions'
import { formatDateRange, getCompletedExercisesHrefForDate, shiftWeekRange } from '@/lib/trainingDateRange'
import { formatDuration, formatDurationHoursMinutes, formatPace, formatWeekdayDate } from '@/lib/trainingFormatters'
import styles from './page.module.scss'

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

type CompletedExercisesClientProps = {
  initialDateFrom: string
  initialDateTo: string
  initialEntries: CompletedExerciseRow[]
  initialExerciseCategories: ExerciseCategory[]
  initialEntryComparisons: EntryComparisons
  initialErrorMessage?: string
}

export default function CompletedExercisesClient({
  initialDateFrom,
  initialDateTo,
  initialEntries,
  initialExerciseCategories,
  initialEntryComparisons,
  initialErrorMessage = '',
}: CompletedExercisesClientProps) {
  const router = useRouter()
  const [, startRouteTransition] = useTransition()
  const [{ dateFrom, dateTo }, setDateRange] = useState({ dateFrom: initialDateFrom, dateTo: initialDateTo })
  const [entries, setEntries] = useState<CompletedExerciseRow[]>(initialEntries)
  const [exerciseCategories] = useState<ExerciseCategory[]>(initialExerciseCategories)
  const [errorMessage, setErrorMessage] = useState(initialErrorMessage)
  const [selectedExerciseCategory, setSelectedExerciseCategory] = useState('all')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)
  const [copyTarget, setCopyTarget] = useState<CopyCategoryTarget | null>(null)
  const [copyDate, setCopyDate] = useState('')
  const [copyLoading, setCopyLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [entryComparisons] = useState<EntryComparisons>(initialEntryComparisons)
  const isCopyDateSameAsSource = Boolean(copyTarget && copyDate === copyTarget.sourceDate)

  const updateDateRange = (nextDateRange: { dateFrom: string; dateTo: string }) => {
    setDateRange(nextDateRange)
    const searchParams = new URLSearchParams(nextDateRange)
    startRouteTransition(() => {
      router.push(`/completed-exercises?${searchParams.toString()}`)
    })
  }

  const shiftDateRangeByWeek = (direction: -1 | 1) => {
    updateDateRange(shiftWeekRange(dateFrom, direction))
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

    const result = await deleteCompletedExercise(deletingEntryId)

    setDeleteLoading(false)

    if (result.error) {
      setErrorMessage(result.error)
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

    const result = await copyCompletedExerciseCategory(copyTarget.entries, copyDate)

    setCopyLoading(false)

    if (result.error) {
      setErrorMessage(result.error)
      return
    }

    const copiedCount = result.data?.copiedCount ?? copyTarget.entries.length
    setSuccessMessage(
      `Copied ${copiedCount} ${copiedCount === 1 ? 'exercise' : 'exercises'} from ${copyTarget.categoryName} to ${formatWeekdayDate(copyDate)}.`,
    )
    closeCopyCategory()
    startRouteTransition(() => {
      router.push(getCompletedExercisesHrefForDate(copyDate))
    })
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
                      onChange={(value) => updateDateRange({ dateFrom: value, dateTo })}
                    />
                  </div>
                  <div className={styles.datePickerGroup}>
                    <label htmlFor="dateTo" className={styles.filterLabel}>
                      To
                    </label>
                    <DatePicker
                      id="dateTo"
                      value={dateTo}
                      onChange={(value) => updateDateRange({ dateFrom, dateTo: value })}
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

        {errorMessage && (
          <StatusPanel variant="error" withBottomSpacing>
            {errorMessage}
          </StatusPanel>
        )}
        {successMessage && (
          <StatusPanel variant="success" withBottomSpacing>
            {successMessage}
          </StatusPanel>
        )}
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
