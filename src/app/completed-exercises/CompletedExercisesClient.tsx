'use client'

import { ArrowDown, ArrowUp, ClipboardList } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import BackLink from '@/components/BackLink'
import DateRangeFiltersBar from '@/components/DateRangeFiltersBar'
import { DatePicker } from '@/components/DatePicker'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import OverflowMenu from '@/components/OverflowMenu'
import PageContainer from '@/components/PageContainer'
import PageHeader from '@/components/PageHeader'
import StatusPanel from '@/components/StatusPanel'
import SurfaceCard from '@/components/SurfaceCard'
import { formatLocalDateOnly } from '@/lib/dateOnly'
import type { CompletedExerciseRow, EntryComparisons, ExerciseCategory } from '@/lib/completedExercises'
import {
  copyCompletedExerciseCategory,
  deleteCompletedExercise,
  loadCompletedExercisesForRange,
} from '@/app/completed-exercises/actions'
import { getWeekRangeForDate, shiftWeekRange } from '@/lib/trainingDateRange'
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
  initialIsLoading?: boolean
  initialSelectedExerciseCategory?: string
}

const loadCompletedExercisesPayload = async (dateFrom: string, dateTo: string) => {
  const { data, error } = await loadCompletedExercisesForRange(dateFrom, dateTo)

  if (error || !data) {
    throw new Error(error || 'Could not load data.')
  }

  return data
}

const getCompletedExercisesSearchParams = (
  dateRange: { dateFrom: string; dateTo: string },
  exerciseCategory: string,
) => {
  const searchParams = new URLSearchParams(dateRange)

  if (exerciseCategory !== 'all') {
    searchParams.set('category', exerciseCategory)
  }

  return searchParams
}

export default function CompletedExercisesClient({
  initialDateFrom,
  initialDateTo,
  initialEntries,
  initialExerciseCategories,
  initialEntryComparisons,
  initialErrorMessage = '',
  initialIsLoading = false,
  initialSelectedExerciseCategory = 'all',
}: CompletedExercisesClientProps) {
  const router = useRouter()
  const [, startRouteTransition] = useTransition()
  const [{ dateFrom, dateTo }, setDateRange] = useState({ dateFrom: initialDateFrom, dateTo: initialDateTo })
  const [entries, setEntries] = useState<CompletedExerciseRow[]>(initialEntries)
  const [exerciseCategories, setExerciseCategories] = useState<ExerciseCategory[]>(initialExerciseCategories)
  const [errorMessage, setErrorMessage] = useState(initialErrorMessage)
  const [isDataLoading, setIsDataLoading] = useState(initialIsLoading)
  const [selectedExerciseCategory, setSelectedExerciseCategory] = useState(initialSelectedExerciseCategory)
  const [filtersValue, setFiltersValue] = useState(initialSelectedExerciseCategory === 'all' ? '' : 'filters')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)
  const [copyTarget, setCopyTarget] = useState<CopyCategoryTarget | null>(null)
  const [copyDate, setCopyDate] = useState('')
  const [copyLoading, setCopyLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [entryComparisons, setEntryComparisons] = useState<EntryComparisons>(initialEntryComparisons)
  const isCopyDateSameAsSource = Boolean(copyTarget && copyDate === copyTarget.sourceDate)

  const updateDateRange = (nextDateRange: { dateFrom: string; dateTo: string }) => {
    setDateRange(nextDateRange)
    setIsDataLoading(true)
    setErrorMessage('')
    const searchParams = getCompletedExercisesSearchParams(nextDateRange, selectedExerciseCategory)
    startRouteTransition(() => {
      router.push(`/completed-exercises?${searchParams.toString()}`, { scroll: false })
    })
  }

  const selectExerciseCategory = (exerciseCategory: string) => {
    setSelectedExerciseCategory(exerciseCategory)

    if (exerciseCategory !== 'all') {
      setFiltersValue('filters')
    }

    if (!dateFrom || !dateTo) return

    const searchParams = getCompletedExercisesSearchParams({ dateFrom, dateTo }, exerciseCategory)
    startRouteTransition(() => {
      router.replace(`/completed-exercises?${searchParams.toString()}`, { scroll: false })
    })
  }

  const refreshCurrentDateRange = async () => {
    if (!dateFrom || !dateTo) return

    setIsDataLoading(true)
    setErrorMessage('')

    try {
      const payload = await loadCompletedExercisesPayload(dateFrom, dateTo)

      setEntries(payload.entries)
      setExerciseCategories(payload.exerciseCategories)
      setEntryComparisons(payload.entryComparisons)
    } catch (error) {
      setEntries([])
      setEntryComparisons({})
      setErrorMessage(error instanceof Error ? error.message : 'Could not load data.')
    } finally {
      setIsDataLoading(false)
    }
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
    await refreshCurrentDateRange()
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

    const targetDateRange = getWeekRangeForDate(copyDate)

    if (targetDateRange.dateFrom === dateFrom && targetDateRange.dateTo === dateTo) {
      await refreshCurrentDateRange()
      return
    }

    updateDateRange(targetDateRange)
  }

  return (
    <div className={styles.CompletedExercises}>
      <PageContainer className={styles.CompletedExercisesContainer}>
        <BackLink href="/" label="Back to Home" />
        <PageHeader
          icon={ClipboardList}
          title="Completed Exercises"
          description="Browse your logged exercises grouped by workout date."
        />

        <DateRangeFiltersBar
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateRangeChange={(nextDateFrom, nextDateTo) => updateDateRange({ dateFrom: nextDateFrom, dateTo: nextDateTo })}
          onShiftWeek={shiftDateRangeByWeek}
          datePickerCloseOnSelect={false}
          accordionValue={filtersValue}
          onAccordionValueChange={setFiltersValue}
          idPrefix="completed-exercises"
          extraFilters={(
            <div className={styles.CompletedExercisesFilterField}>
              <p className={styles.CompletedExercisesFilterLabel}>Exercise Category</p>
              <div className={styles.CompletedExercisesBadgeGroup} role="group" aria-label="Exercise category filter">
                <button
                  type="button"
                  className={styles.CompletedExercisesChoiceBadge}
                  aria-pressed={selectedExerciseCategory === 'all'}
                  data-selected={selectedExerciseCategory === 'all' ? 'true' : undefined}
                  onClick={() => selectExerciseCategory('all')}
                >
                  All
                </button>
                {exerciseCategoryOptions.map((exerciseCategory) => (
                  <button
                    key={exerciseCategory}
                    type="button"
                    className={styles.CompletedExercisesChoiceBadge}
                    aria-pressed={selectedExerciseCategory === exerciseCategory}
                    data-selected={selectedExerciseCategory === exerciseCategory ? 'true' : undefined}
                    onClick={() => selectExerciseCategory(exerciseCategory)}
                  >
                    {exerciseCategory}
                  </button>
                ))}
              </div>
            </div>
          )}
        />

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
        {isDataLoading ? (
          <LoadingSkeleton ariaLabel="Loading completed exercise entries" count={3} variant="card" />
        ) : null}
        {!errorMessage && !isDataLoading && groupedByDate.length === 0 && (
          <div className={styles.CompletedExercisesEmptyState}>No completed exercises for this date range.</div>
        )}

        {!isDataLoading ? (
        <div className={styles.CompletedExercisesDaysList}>
          {groupedByDate.map((group) => (
            <SurfaceCard as="section" key={group.date} className={styles.CompletedExercisesDayCard}>
              <h2 className={styles.CompletedExercisesDayTitle}>{formatWeekdayDate(group.date)}</h2>
              <div className={styles.CompletedExercisesExerciseCategorySections}>
                {group.exerciseCategories.map((exerciseCategory) => (
                  <section key={`${group.date}-${exerciseCategory.name}`} className={styles.CompletedExercisesExerciseCategorySection}>
                    <div className={styles.CompletedExercisesExerciseCategoryHeader}>
                      <h3 className={styles.CompletedExercisesExerciseCategoryHeading}>{exerciseCategory.name}</h3>
                      <OverflowMenu
                        ariaLabel={`Options for ${exerciseCategory.name}`}
                        items={[
                          {
                            key: 'copy',
                            label: 'Copy to another date',
                            onSelect: () => openCopyCategory(group.date, exerciseCategory.name, exerciseCategory.entries),
                          },
                        ]}
                      />
                    </div>
                    <ul className={styles.CompletedExercisesEntriesList}>
                      {exerciseCategory.entries.map((entry) => (
                        <li key={entry.id} className={styles.CompletedExercisesEntryItem}>
                          <div className={styles.CompletedExercisesEntryRow}>
                            <div className={styles.CompletedExercisesEntryMain}>
                              <div className={styles.CompletedExercisesEntryTop}>
                                <p className={styles.CompletedExercisesExerciseName}>
                                  {entry.exercise?.name || 'Unknown exercise'}
                                </p>
                              </div>
                              <p className={styles.CompletedExercisesEntryDetails}>
                                {formatEntryDetails(entry)}
                              </p>
                              {entryComparisons[entry.id]?.length ? (
                                <div className={styles.CompletedExercisesEntryComparisons} aria-label="Changes since previous session">
                                  {entryComparisons[entry.id].map((metric) => {
                                    const ComparisonIcon = metric.direction === 'up' ? ArrowUp : ArrowDown

                                    return (
                                      <span
                                        key={metric.key}
                                        className={styles.CompletedExercisesComparisonBadge}
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
                                <p className={styles.CompletedExercisesEntryNote}>{entry.note.trim()}</p>
                              ) : null}
                            </div>

                            <OverflowMenu
                              ariaLabel={`Options for ${entry.exercise?.name || 'exercise entry'}`}
                              items={[
                                {
                                  key: 'edit',
                                  label: 'Edit',
                                  href: `/completed-exercises/${entry.id}/edit`,
                                },
                                {
                                  key: 'delete',
                                  label: 'Delete',
                                  danger: true,
                                  onSelect: () => openDelete(entry.id),
                                },
                              ]}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </SurfaceCard>
          ))}
        </div>
        ) : null}

        <Dialog.Root open={deleteOpen} onOpenChange={(open) => !open && closeDelete()}>
          <Dialog.Portal>
            <Dialog.Overlay className={styles.CompletedExercisesOverlay} />
            <Dialog.Content className={styles.CompletedExercisesDialogContentSmall}>
              <Dialog.Title className={styles.CompletedExercisesDialogTitle}>Delete entry?</Dialog.Title>
              <Dialog.Description className={styles.CompletedExercisesDialogDescription}>
                This action cannot be undone.
              </Dialog.Description>
              <div className={styles.CompletedExercisesDialogActions}>
                <Dialog.Close asChild>
                  <button type="button" className={styles.CompletedExercisesGhostButton}>
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  className={styles.CompletedExercisesDangerButton}
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
            <Dialog.Overlay className={styles.CompletedExercisesOverlay} />
            <Dialog.Content className={styles.CompletedExercisesDialogContentSmall}>
              <Dialog.Title className={styles.CompletedExercisesDialogTitle}>Copy exercises</Dialog.Title>
              <Dialog.Description className={styles.CompletedExercisesDialogDescription}>
                {copyTarget
                  ? `Copy ${copyTarget.categoryName} from ${formatWeekdayDate(copyTarget.sourceDate)} to another date.`
                  : 'Choose a date to copy these exercises.'}
              </Dialog.Description>
              <div className={styles.CompletedExercisesDialogForm}>
                <div className={styles.CompletedExercisesField}>
                  <label htmlFor="copyDate" className={styles.CompletedExercisesLabel}>
                    New date
                  </label>
                  <DatePicker
                    id="copyDate"
                    value={copyDate}
                    onChange={setCopyDate}
                  />
                  {isCopyDateSameAsSource ? (
                    <p className={styles.CompletedExercisesFieldHint}>Choose a different date than the source workout.</p>
                  ) : null}
                </div>
                <div className={styles.CompletedExercisesDialogActions}>
                  <Dialog.Close asChild>
                    <button type="button" className={styles.CompletedExercisesGhostButton}>
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="button"
                    className={styles.CompletedExercisesPrimaryButton}
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
