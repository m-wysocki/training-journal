import { DurationStepper } from '@/components/DurationStepper'
import {
  ACTIVITY_DURATION_STEP_SECONDS,
  MAX_ACTIVITY_DURATION_SECONDS,
  MIN_ACTIVITY_DURATION_SECONDS,
} from '../../_helpers/completedExerciseForm.constants'
import type { WorkoutDetailsState } from '../../_hooks/useWorkoutDetailsState'
import styles from './DurationWorkoutDetailsField.module.scss'

type Props = {
  form: WorkoutDetailsState
}

export default function DurationWorkoutDetailsField({ form }: Props) {
  const { activityDurationSeconds, setActivityDurationSeconds } = form

  return (
    <div className={styles.DurationWorkoutDetailsField}>
      <label htmlFor="activityDuration" className={styles.DurationWorkoutDetailsFieldLabel}>Duration</label>
      <DurationStepper id="activityDuration" inputClassName={styles.DurationWorkoutDetailsFieldInput} value={activityDurationSeconds} min={MIN_ACTIVITY_DURATION_SECONDS} max={MAX_ACTIVITY_DURATION_SECONDS} step={ACTIVITY_DURATION_STEP_SECONDS} onChange={setActivityDurationSeconds} />
    </div>
  )
}
