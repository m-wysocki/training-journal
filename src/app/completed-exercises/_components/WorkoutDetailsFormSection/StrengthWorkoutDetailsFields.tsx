import { NumericStepper } from '@/components/NumericStepper'
import { formatDuration } from '@/lib/trainingFormatters'
import {
  LOAD_STEP_KG,
  MAX_DURATION_SECONDS,
  MAX_LOAD_KG,
  MAX_REPS,
  MAX_SETS,
  MIN_DURATION_SECONDS,
  MIN_LOAD_KG,
  MIN_REPS,
  MIN_SETS,
} from '../../_helpers/completedExerciseForm.constants'
import type { WorkoutDetailsState } from '../../_hooks/useWorkoutDetailsState'
import styles from './StrengthWorkoutDetailsFields.module.scss'

type Props = {
  form: WorkoutDetailsState
}

export default function StrengthWorkoutDetailsFields({ form }: Props) {
  const {
    sets,
    repsPerSet,
    durationPerSetSeconds,
    strengthDetailMode,
    hasLoad,
    loadKg,
    setStrengthDetailMode,
    setHasLoad,
    setLoadKg,
    handleSetsChange,
    handleRepChange,
    handleDurationChange,
  } = form

  return (
    <>
      <div className={styles.StrengthWorkoutDetailsFieldsField}>
        <label htmlFor="sets" className={styles.StrengthWorkoutDetailsFieldsLabel}>Sets (1-5)</label>
        <NumericStepper id="sets" inputClassName={styles.StrengthWorkoutDetailsFieldsInput} value={sets} min={MIN_SETS} max={MAX_SETS} onChange={(v) => handleSetsChange(String(v))} />
      </div>
      <div className={styles.StrengthWorkoutDetailsFieldsField}>
        <p className={styles.StrengthWorkoutDetailsFieldsRepsHeading}>Set Target</p>
        <div className={styles.StrengthWorkoutDetailsFieldsSegmentedControl} role="group" aria-label="Set target type">
          <button type="button" className={styles.StrengthWorkoutDetailsFieldsSegmentButton} data-selected={strengthDetailMode === 'reps' ? 'true' : undefined} aria-pressed={strengthDetailMode === 'reps'} onClick={() => setStrengthDetailMode('reps')}>Reps</button>
          <button type="button" className={styles.StrengthWorkoutDetailsFieldsSegmentButton} data-selected={strengthDetailMode === 'time' ? 'true' : undefined} aria-pressed={strengthDetailMode === 'time'} onClick={() => setStrengthDetailMode('time')}>Time</button>
        </div>
      </div>
      <div className={styles.StrengthWorkoutDetailsFieldsField}>
        <p className={styles.StrengthWorkoutDetailsFieldsRepsHeading}>{strengthDetailMode === 'reps' ? 'Reps Per Set (1-30)' : 'Time Per Set'}</p>
        <div className={styles.StrengthWorkoutDetailsFieldsRepsGrid}>
          {strengthDetailMode === 'reps' ? repsPerSet.map((rep, index) => (
            <div key={`rep-${index}`} className={styles.StrengthWorkoutDetailsFieldsRepField}>
              <label htmlFor={`rep-${index}`} className={styles.StrengthWorkoutDetailsFieldsRepLabel}>Set {index + 1}</label>
              <NumericStepper id={`rep-${index}`} inputClassName={styles.StrengthWorkoutDetailsFieldsInput} value={rep} min={MIN_REPS} max={MAX_REPS} onChange={(v) => handleRepChange(index, String(v))} />
            </div>
          )) : durationPerSetSeconds.map((duration, index) => (
            <div key={`duration-${index}`} className={styles.StrengthWorkoutDetailsFieldsRepField}>
              <label htmlFor={`duration-${index}`} className={styles.StrengthWorkoutDetailsFieldsRepLabel}>Set {index + 1}</label>
              <NumericStepper id={`duration-${index}`} inputClassName={styles.StrengthWorkoutDetailsFieldsInput} value={duration} min={MIN_DURATION_SECONDS} max={MAX_DURATION_SECONDS} onChange={(v) => handleDurationChange(index, v)} displayValue={formatDuration(duration)} unit="s" />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.StrengthWorkoutDetailsFieldsField}>
        <div className={styles.StrengthWorkoutDetailsFieldsFieldHeader}>
          <label htmlFor="loadKg" className={styles.StrengthWorkoutDetailsFieldsLabel}>Load (kg)</label>
          <label className={styles.StrengthWorkoutDetailsFieldsCheckboxRow}>
            <input type="checkbox" checked={!hasLoad} onChange={(e) => setHasLoad(!e.target.checked)} />
            <span>No Load</span>
          </label>
        </div>
        {hasLoad ? (
          <NumericStepper id="loadKg" inputClassName={styles.StrengthWorkoutDetailsFieldsInput} value={loadKg} min={MIN_LOAD_KG} max={MAX_LOAD_KG} step={LOAD_STEP_KG} onChange={setLoadKg} displayValue={`${loadKg.toFixed(1)} kg`} unit="kg" />
        ) : (
          <div className={styles.StrengthWorkoutDetailsFieldsEmptyValue}>This exercise will be saved without a load value.</div>
        )}
      </div>
    </>
  )
}
