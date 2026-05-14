import SurfaceCard from '@/components/SurfaceCard'
import type { WorkoutDetailsState } from '../../_hooks/useWorkoutDetailsState'
import CardioWorkoutDetailsFields from './CardioWorkoutDetailsFields'
import DurationWorkoutDetailsField from './DurationWorkoutDetailsField'
import StrengthWorkoutDetailsFields from './StrengthWorkoutDetailsFields'
import WorkoutDetailsRecentHistory from './WorkoutDetailsRecentHistory'
import styles from './WorkoutDetailsFormSection.module.scss'

type Props = {
  form: WorkoutDetailsState
}

export default function WorkoutDetailsFormSection({ form }: Props) {
  const { isStrengthExercise, isCardioExercise } = form

  return (
    <SurfaceCard as="section" className={styles.WorkoutDetailsFormSection}>
      <div className={styles.WorkoutDetailsFormSectionHeader}>
        <h2 className={styles.WorkoutDetailsFormSectionTitle}>Workout Details Form</h2>
        <p className={styles.WorkoutDetailsFormSectionDescription}>
          {isStrengthExercise
            ? 'Set the number of sets, reps or time, and load for this exercise.'
            : isCardioExercise
              ? 'Set the distance and optional pace for this cardio exercise.'
              : 'Enter the total duration for this activity in hh:mm, using 5-minute steps.'}
        </p>
        <WorkoutDetailsRecentHistory form={form} />
      </div>

      <div className={styles.WorkoutDetailsFormSectionBody}>
        {isStrengthExercise ? (
          <StrengthWorkoutDetailsFields form={form} />
        ) : isCardioExercise ? (
          <CardioWorkoutDetailsFields form={form} />
        ) : (
          <DurationWorkoutDetailsField form={form} />
        )}
      </div>
    </SurfaceCard>
  )
}
