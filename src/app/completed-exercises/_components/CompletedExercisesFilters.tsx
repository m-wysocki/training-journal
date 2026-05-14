import DateRangeFiltersBar from '@/components/DateRangeFiltersBar'
import styles from './CompletedExercisesFilters.module.scss'

type CompletedExercisesFiltersProps = {
  dateFrom: string
  dateTo: string
  filtersValue: string
  selectedExerciseCategory: string
  exerciseCategoryOptions: string[]
  onUpdateDateRange: (nextDateRange: { dateFrom: string; dateTo: string }) => void
  onShiftDateRangeByWeek: (direction: -1 | 1) => void
  onSetFiltersValue: (value: string) => void
  onSelectExerciseCategory: (exerciseCategory: string) => void
}

export default function CompletedExercisesFilters({
  dateFrom,
  dateTo,
  filtersValue,
  selectedExerciseCategory,
  exerciseCategoryOptions,
  onUpdateDateRange,
  onShiftDateRangeByWeek,
  onSetFiltersValue,
  onSelectExerciseCategory,
}: CompletedExercisesFiltersProps) {
  return (
    <DateRangeFiltersBar
      dateFrom={dateFrom}
      dateTo={dateTo}
      onDateRangeChange={(nextDateFrom, nextDateTo) => onUpdateDateRange({ dateFrom: nextDateFrom, dateTo: nextDateTo })}
      onShiftWeek={onShiftDateRangeByWeek}
      datePickerCloseOnSelect={false}
      accordionValue={filtersValue}
      onAccordionValueChange={onSetFiltersValue}
      idPrefix="completed-exercises"
      extraFilters={(
        <div className={styles.CompletedExercisesFiltersFilterField}>
          <p className={styles.CompletedExercisesFiltersFilterLabel}>Exercise Category</p>
          <div className={styles.CompletedExercisesFiltersBadgeGroup} role="group" aria-label="Exercise category filter">
            <button
              type="button"
              className={styles.CompletedExercisesFiltersChoiceBadge}
              aria-pressed={selectedExerciseCategory === 'all'}
              data-selected={selectedExerciseCategory === 'all' ? 'true' : undefined}
              onClick={() => onSelectExerciseCategory('all')}
            >
              All
            </button>
            {exerciseCategoryOptions.map((exerciseCategory) => (
              <button
                key={exerciseCategory}
                type="button"
                className={styles.CompletedExercisesFiltersChoiceBadge}
                aria-pressed={selectedExerciseCategory === exerciseCategory}
                data-selected={selectedExerciseCategory === exerciseCategory ? 'true' : undefined}
                onClick={() => onSelectExerciseCategory(exerciseCategory)}
              >
                {exerciseCategory}
              </button>
            ))}
          </div>
        </div>
      )}
    />
  )
}
