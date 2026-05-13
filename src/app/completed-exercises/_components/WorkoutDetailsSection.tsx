import { DurationStepper } from '@/components/DurationStepper'
import { NumericStepper } from '@/components/NumericStepper'
import { PaceStepper } from '@/components/PaceStepper'
import SurfaceCard from '@/components/SurfaceCard'
import { formatDuration, formatLongDate } from '@/lib/trainingFormatters'
import {
  ACTIVITY_DURATION_STEP_SECONDS,
  MAX_ACTIVITY_DURATION_SECONDS,
  MAX_DISTANCE_KM,
  MAX_DURATION_SECONDS,
  MAX_LOAD_KG,
  MAX_PACE_MIN_PER_KM,
  MAX_REPS,
  MAX_SETS,
  MIN_ACTIVITY_DURATION_SECONDS,
  MIN_DISTANCE_KM,
  MIN_DURATION_SECONDS,
  MIN_LOAD_KG,
  MIN_PACE_MIN_PER_KM,
  MIN_REPS,
  MIN_SETS,
  DISTANCE_STEP_KM,
  LOAD_STEP_KG,
} from '../_helpers/completedExerciseForm.constants'
import { formatRecentExerciseSummary } from '../_helpers/formatRecentExerciseSummary'
import type { WorkoutDetailsState } from '../_hooks/useWorkoutDetailsState'
import styles from './WorkoutDetailsSection.module.scss'

type Props = {
  form: WorkoutDetailsState
}

export default function WorkoutDetailsSection({ form }: Props) {
  const {
    isStrengthExercise, isCardioExercise, selectedExerciseType, isRecentExercisesLoading, recentExercises,
    sets, repsPerSet, durationPerSetSeconds, strengthDetailMode, hasLoad, loadKg, distanceKm, paceMinPerKm,
    activityDurationSeconds, setStrengthDetailMode, setHasLoad, setLoadKg, setDistanceKm, setPaceMinPerKm,
    setActivityDurationSeconds, handleSetsChange, handleRepChange, handleDurationChange,
  } = form

  return (
    <SurfaceCard as="section" className={styles.WorkoutDetailsSection}>
      <div className={styles.WorkoutDetailsSectionHeader}>
        <h2 className={styles.WorkoutDetailsSectionTitle}>Workout Details</h2>
        <p className={styles.WorkoutDetailsSectionDescription}>
          {isStrengthExercise
            ? 'Set the number of sets, reps or time, and load for this exercise.'
            : isCardioExercise
              ? 'Set the distance and optional pace for this cardio exercise.'
              : 'Enter the total duration for this activity in hh:mm, using 5-minute steps.'}
        </p>
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
      </div>

      <div className={styles.WorkoutDetailsSectionBody}>
        {isStrengthExercise ? (
          <>
            <div className={styles.WorkoutDetailsField}>
              <label htmlFor="sets" className={styles.WorkoutDetailsLabel}>Sets (1-5)</label>
              <NumericStepper id="sets" inputClassName={styles.WorkoutDetailsInput} value={sets} min={MIN_SETS} max={MAX_SETS} onChange={(v) => handleSetsChange(String(v))} />
            </div>
            <div className={styles.WorkoutDetailsField}>
              <p className={styles.WorkoutDetailsRepsHeading}>Set Target</p>
              <div className={styles.WorkoutDetailsSegmentedControl} role="group" aria-label="Set target type">
                <button type="button" className={styles.WorkoutDetailsSegmentButton} data-selected={strengthDetailMode === 'reps' ? 'true' : undefined} aria-pressed={strengthDetailMode === 'reps'} onClick={() => setStrengthDetailMode('reps')}>Reps</button>
                <button type="button" className={styles.WorkoutDetailsSegmentButton} data-selected={strengthDetailMode === 'time' ? 'true' : undefined} aria-pressed={strengthDetailMode === 'time'} onClick={() => setStrengthDetailMode('time')}>Time</button>
              </div>
            </div>
            <div className={styles.WorkoutDetailsField}>
              <p className={styles.WorkoutDetailsRepsHeading}>{strengthDetailMode === 'reps' ? 'Reps Per Set (1-30)' : 'Time Per Set'}</p>
              <div className={styles.WorkoutDetailsRepsGrid}>
                {strengthDetailMode === 'reps' ? repsPerSet.map((rep, index) => (
                  <div key={`rep-${index}`} className={styles.WorkoutDetailsRepField}>
                    <label htmlFor={`rep-${index}`} className={styles.WorkoutDetailsRepLabel}>Set {index + 1}</label>
                    <NumericStepper id={`rep-${index}`} inputClassName={styles.WorkoutDetailsInput} value={rep} min={MIN_REPS} max={MAX_REPS} onChange={(v) => handleRepChange(index, String(v))} />
                  </div>
                )) : durationPerSetSeconds.map((duration, index) => (
                  <div key={`duration-${index}`} className={styles.WorkoutDetailsRepField}>
                    <label htmlFor={`duration-${index}`} className={styles.WorkoutDetailsRepLabel}>Set {index + 1}</label>
                    <NumericStepper id={`duration-${index}`} inputClassName={styles.WorkoutDetailsInput} value={duration} min={MIN_DURATION_SECONDS} max={MAX_DURATION_SECONDS} onChange={(v) => handleDurationChange(index, v)} displayValue={formatDuration(duration)} unit="s" />
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.WorkoutDetailsField}>
              <div className={styles.WorkoutDetailsFieldHeader}>
                <label htmlFor="loadKg" className={styles.WorkoutDetailsLabel}>Load (kg)</label>
                <label className={styles.WorkoutDetailsCheckboxRow}>
                  <input type="checkbox" checked={!hasLoad} onChange={(e) => setHasLoad(!e.target.checked)} />
                  <span>No Load</span>
                </label>
              </div>
              {hasLoad ? (
                <NumericStepper id="loadKg" inputClassName={styles.WorkoutDetailsInput} value={loadKg} min={MIN_LOAD_KG} max={MAX_LOAD_KG} step={LOAD_STEP_KG} onChange={setLoadKg} displayValue={`${loadKg.toFixed(1)} kg`} unit="kg" />
              ) : (
                <div className={styles.WorkoutDetailsEmptyValue}>This exercise will be saved without a load value.</div>
              )}
            </div>
          </>
        ) : isCardioExercise ? (
          <div className={styles.WorkoutDetailsMetricsGrid}>
            <div className={styles.WorkoutDetailsField}>
              <label htmlFor="distanceKm" className={styles.WorkoutDetailsLabel}>Distance (km)</label>
              <NumericStepper id="distanceKm" inputClassName={styles.WorkoutDetailsInput} value={distanceKm} min={MIN_DISTANCE_KM} max={MAX_DISTANCE_KM} step={DISTANCE_STEP_KM} onChange={setDistanceKm} displayValue={`${distanceKm.toFixed(1)} km`} unit="km" />
            </div>
            <div className={styles.WorkoutDetailsField}>
              <label htmlFor="paceMinPerKm" className={styles.WorkoutDetailsLabel}>Pace (min/km)</label>
              <PaceStepper id="paceMinPerKm" inputClassName={styles.WorkoutDetailsInput} value={paceMinPerKm} min={MIN_PACE_MIN_PER_KM} max={MAX_PACE_MIN_PER_KM} onChange={setPaceMinPerKm} />
            </div>
          </div>
        ) : (
          <div className={styles.WorkoutDetailsField}>
            <label htmlFor="activityDuration" className={styles.WorkoutDetailsLabel}>Duration</label>
            <DurationStepper id="activityDuration" inputClassName={styles.WorkoutDetailsInput} value={activityDurationSeconds} min={MIN_ACTIVITY_DURATION_SECONDS} max={MAX_ACTIVITY_DURATION_SECONDS} step={ACTIVITY_DURATION_STEP_SECONDS} onChange={setActivityDurationSeconds} />
          </div>
        )}
      </div>
    </SurfaceCard>
  )
}
