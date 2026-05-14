'use client'

import { useState, type FormEvent } from 'react'
import type { CompletedExerciseFormValues } from '../_helpers/completedExerciseForm.types'
import {
  ACTIVITY_DURATION_STEP_SECONDS,
  LOAD_STEP_KG,
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
} from '../_helpers/completedExerciseForm.constants'

type Params = {
  onSubmit: (values: CompletedExerciseFormValues) => Promise<{ error?: string | null }>
  onSuccess?: () => void
  onAfterSubmitSuccess: (performedAt: string) => void
}

type SubmitState = {
  selectedExerciseCategoryId: string
  selectedExerciseId: string
  performedAt: string
  note: string
  isStrengthExercise: boolean
  isCardioExercise: boolean
  isDurationExercise: boolean
  sets: number
  repsPerSet: number[]
  durationPerSetSeconds: number[]
  strengthDetailMode: 'reps' | 'time'
  hasLoad: boolean
  loadKg: number
  distanceKm: number
  paceMinPerKm: number | null
  activityDurationSeconds: number
}

export const useCompletedExerciseSubmit = ({
  onSubmit,
  onSuccess,
  onAfterSubmitSuccess,
}: Params) => {
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  const setStatus = (nextIsError: boolean, nextMessage: string) => {
    setIsError(nextIsError)
    setMessage(nextMessage)
  }

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>,
    state: SubmitState,
  ) => {
    e.preventDefault()
    setStatus(false, '')

    if (!state.selectedExerciseCategoryId || !state.selectedExerciseId) {
      setStatus(true, 'Select an exercise category and exercise.')
      return
    }
    if (!state.performedAt) {
      setStatus(true, 'Select a workout date.')
      return
    }

    const hasInvalidReps = state.repsPerSet.some((rep) => rep < MIN_REPS || rep > MAX_REPS)
    const hasInvalidDurations = state.durationPerSetSeconds.some((duration) => duration < MIN_DURATION_SECONDS || duration > MAX_DURATION_SECONDS)
    const hasInvalidLoad = state.hasLoad && (state.loadKg < MIN_LOAD_KG || state.loadKg > MAX_LOAD_KG || !Number.isInteger(state.loadKg / LOAD_STEP_KG))
    const hasInvalidDistance = state.distanceKm < MIN_DISTANCE_KM || state.distanceKm > MAX_DISTANCE_KM
    const hasInvalidPace = state.paceMinPerKm !== null && (state.paceMinPerKm < MIN_PACE_MIN_PER_KM || state.paceMinPerKm > MAX_PACE_MIN_PER_KM)
    const hasInvalidActivityDuration = state.activityDurationSeconds < MIN_ACTIVITY_DURATION_SECONDS
      || state.activityDurationSeconds > MAX_ACTIVITY_DURATION_SECONDS
      || state.activityDurationSeconds % ACTIVITY_DURATION_STEP_SECONDS !== 0

    if (state.isStrengthExercise && (
      state.sets < MIN_SETS
      || state.sets > MAX_SETS
      || (state.strengthDetailMode === 'reps' && (hasInvalidReps || state.repsPerSet.length !== state.sets))
      || (state.strengthDetailMode === 'time' && (hasInvalidDurations || state.durationPerSetSeconds.length !== state.sets))
      || hasInvalidLoad
    )) {
      setStatus(true, 'Check the allowed ranges for sets, reps, time, and load.')
      return
    }

    if (state.isCardioExercise && (hasInvalidDistance || hasInvalidPace)) {
      setStatus(true, 'Check the allowed ranges for distance and pace if provided.')
      return
    }

    if (state.isDurationExercise && hasInvalidActivityDuration) {
      setStatus(true, 'Enter a valid duration in hh:mm using 5-minute steps.')
      return
    }

    setLoading(true)
    const result = await onSubmit({
      exerciseCategoryId: state.selectedExerciseCategoryId,
      exerciseId: state.selectedExerciseId,
      sets: state.isStrengthExercise ? state.sets : null,
      repsPerSet: state.isStrengthExercise && state.strengthDetailMode === 'reps' ? state.repsPerSet : null,
      durationPerSetSeconds:
        state.isStrengthExercise && state.strengthDetailMode === 'time'
          ? state.durationPerSetSeconds
          : state.isDurationExercise
            ? [state.activityDurationSeconds]
            : null,
      loadKg: state.isStrengthExercise && state.hasLoad ? state.loadKg : null,
      distanceKm: state.isCardioExercise ? state.distanceKm : null,
      paceMinPerKm: state.isCardioExercise ? state.paceMinPerKm : null,
      note: state.note.trim(),
      performedAt: state.performedAt,
    })
    setLoading(false)

    if (result.error) {
      setStatus(true, result.error)
      return
    }

    onSuccess?.()
    onAfterSubmitSuccess(state.performedAt)
  }

  return { message, isError, loading, setStatus, handleSubmit }
}

export type CompletedExerciseSubmitState = ReturnType<typeof useCompletedExerciseSubmit>
