import { ArrowDown, ArrowUp } from 'lucide-react'
import OverflowMenu from '@/components/OverflowMenu'
import SurfaceCard from '@/components/SurfaceCard'
import type { CompletedExerciseRow, EntryComparisons } from '@/lib/completedExercises'
import { formatWeekdayDate } from '@/lib/trainingFormatters'
import { formatEntryDetails, type DayGroup } from '../_helpers/CompletedExercisesHelper'
import styles from './CompletedExercisesDayList.module.scss'

type CompletedExercisesDayListProps = {
  groupedByDate: DayGroup[]
  entryComparisons: EntryComparisons
  onOpenCopyCategory: (sourceDate: string, categoryName: string, categoryEntries: CompletedExerciseRow[]) => void
  onOpenDelete: (entryId: string) => void
}

export default function CompletedExercisesDayList({
  groupedByDate,
  entryComparisons,
  onOpenCopyCategory,
  onOpenDelete,
}: CompletedExercisesDayListProps) {
  return (
    <div className={styles.CompletedExercisesDayList}>
      {groupedByDate.map((group) => (
        <SurfaceCard as="section" key={group.date} className={styles.CompletedExercisesDayListCard}>
          <h2 className={styles.CompletedExercisesDayListTitle}>{formatWeekdayDate(group.date)}</h2>
          <div className={styles.CompletedExercisesDayListExerciseCategorySections}>
            {group.exerciseCategories.map((exerciseCategory) => (
              <section key={`${group.date}-${exerciseCategory.name}`} className={styles.CompletedExercisesDayListExerciseCategorySection}>
                <div className={styles.CompletedExercisesDayListExerciseCategoryHeader}>
                  <h3 className={styles.CompletedExercisesDayListExerciseCategoryHeading}>{exerciseCategory.name}</h3>
                  <OverflowMenu
                    ariaLabel={`Options for ${exerciseCategory.name}`}
                    items={[
                      {
                        key: 'copy',
                        label: 'Copy to another date',
                        onSelect: () => onOpenCopyCategory(group.date, exerciseCategory.name, exerciseCategory.entries),
                      },
                    ]}
                  />
                </div>
                <ul className={styles.CompletedExercisesDayListEntriesList}>
                  {exerciseCategory.entries.map((entry) => (
                    <li key={entry.id} className={styles.CompletedExercisesDayListEntryItem}>
                      <div className={styles.CompletedExercisesDayListEntryRow}>
                        <div className={styles.CompletedExercisesDayListEntryMain}>
                          <div className={styles.CompletedExercisesDayListEntryTop}>
                            <p className={styles.CompletedExercisesDayListExerciseName}>
                              {entry.exercise?.name || 'Unknown exercise'}
                            </p>
                          </div>
                          <p className={styles.CompletedExercisesDayListEntryDetails}>
                            {formatEntryDetails(entry)}
                          </p>
                          {entryComparisons[entry.id]?.length ? (
                            <div className={styles.CompletedExercisesDayListEntryComparisons} aria-label="Changes since previous session">
                              {entryComparisons[entry.id].map((metric) => {
                                const ComparisonIcon = metric.direction === 'up' ? ArrowUp : ArrowDown

                                return (
                                  <span
                                    key={metric.key}
                                    className={styles.CompletedExercisesDayListComparisonBadge}
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
                            <p className={styles.CompletedExercisesDayListEntryNote}>{entry.note.trim()}</p>
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
                              onSelect: () => onOpenDelete(entry.id),
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
  )
}
