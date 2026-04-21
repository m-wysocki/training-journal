'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { supabase } from '@/lib/supabase'
import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import { parseDateOnly } from '@/lib/dateOnly'
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

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parseDateOnly(date))

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
  const [entries, setEntries] = useState<CompletedExerciseRow[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedExerciseCategory, setSelectedExerciseCategory] = useState('all')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

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
      .order('performed_at', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setErrorMessage('Could not load data.')
          return
        }

        setErrorMessage('')
        setEntries((data as unknown as CompletedExerciseRow[]) || [])
      })
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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
      closeDelete()
      return
    }

    setEntries((prev) => prev.filter((row) => row.id !== deletingEntryId))
    closeDelete()
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

        {errorMessage && <div className={styles.errorBox}>{errorMessage}</div>}

        {!errorMessage && groupedByDate.length === 0 && (
          <div className={styles.emptyState}>No completed exercises yet.</div>
        )}

        <div className={styles.daysList}>
          {groupedByDate.map((group) => (
            <section key={group.date} className={styles.dayCard}>
              <h2 className={styles.dayTitle}>{formatDate(group.date)}</h2>
              <div className={styles.exerciseCategorySections}>
                {group.exerciseCategories.map((exerciseCategory) => (
                  <section key={`${group.date}-${exerciseCategory.name}`} className={styles.exerciseCategorySection}>
                    <h3 className={styles.exerciseCategoryHeading}>{exerciseCategory.name}</h3>
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
      </PageContainer>
    </div>
  )
}
