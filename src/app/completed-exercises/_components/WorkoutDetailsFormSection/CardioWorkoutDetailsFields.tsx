import { NumericStepper } from '@/components/NumericStepper'
import { PaceStepper } from '@/components/PaceStepper'
import {
  DISTANCE_STEP_KM,
  MAX_DISTANCE_KM,
  MAX_PACE_MIN_PER_KM,
  MIN_DISTANCE_KM,
  MIN_PACE_MIN_PER_KM,
} from '../../_helpers/completedExerciseForm.constants'
import type { WorkoutDetailsState } from '../../_hooks/useWorkoutDetailsState'
import styles from './CardioWorkoutDetailsFields.module.scss'

type Props = {
  form: WorkoutDetailsState
}

export default function CardioWorkoutDetailsFields({ form }: Props) {
  const { distanceKm, paceMinPerKm, setDistanceKm, setPaceMinPerKm } = form

  return (
    <div className={styles.CardioWorkoutDetailsFields}>
      <div className={styles.CardioWorkoutDetailsFieldsField}>
        <label htmlFor="distanceKm" className={styles.CardioWorkoutDetailsFieldsLabel}>Distance (km)</label>
        <NumericStepper id="distanceKm" inputClassName={styles.CardioWorkoutDetailsFieldsInput} value={distanceKm} min={MIN_DISTANCE_KM} max={MAX_DISTANCE_KM} step={DISTANCE_STEP_KM} onChange={setDistanceKm} displayValue={`${distanceKm.toFixed(1)} km`} unit="km" />
      </div>
      <div className={styles.CardioWorkoutDetailsFieldsField}>
        <label htmlFor="paceMinPerKm" className={styles.CardioWorkoutDetailsFieldsLabel}>Pace (min/km)</label>
        <PaceStepper id="paceMinPerKm" inputClassName={styles.CardioWorkoutDetailsFieldsInput} value={paceMinPerKm} min={MIN_PACE_MIN_PER_KM} max={MAX_PACE_MIN_PER_KM} onChange={setPaceMinPerKm} />
      </div>
    </div>
  )
}
