import { formatLongDate } from '@/lib/trainingFormatters'
import { formatRecentExerciseSummary } from '../../_helpers/formatRecentExerciseSummary'
import type { WorkoutDetailsState } from '../../_hooks/useWorkoutDetailsState'
import styles from './WorkoutDetailsRecentHistory.module.scss'

type Props = {
  form: WorkoutDetailsState
}

export default function WorkoutDetailsRecentHistory({ form }: Props) {
  const { isRecentExercisesLoading, recentExercises, selectedExerciseType } = form

  return (
    <div className={styles.WorkoutDetailsRecentHistory}>
      <p className={styles.WorkoutDetailsRecentHistoryTitle}>Last 3 entries</p>
      {isRecentExercisesLoading ? (
        <div className={styles.WorkoutDetailsRecentHistorySkeleton} aria-label="Loading recent history"><span /><span /><span /></div>
      ) : recentExercises.length === 0 ? (
        <p className={styles.WorkoutDetailsRecentHistoryEmpty}>No previous entries for this exercise yet.</p>
      ) : (
        <div className={styles.WorkoutDetailsRecentHistoryList}>
          {recentExercises.map((exercise) => (
            <div key={exercise.id} className={styles.WorkoutDetailsRecentHistoryItem}>
              <p className={styles.WorkoutDetailsRecentHistoryDate}>{formatLongDate(exercise.performed_at)}</p>
              <p className={styles.WorkoutDetailsRecentHistoryDetails}>{formatRecentExerciseSummary(selectedExerciseType, exercise)}</p>
              {exercise.note?.trim() ? <p className={styles.WorkoutDetailsRecentHistoryNote}>{exercise.note.trim()}</p> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
