'use client'

import { useEffect, useState } from 'react'
import { loadRecentCompletedExercises } from '@/app/completed-exercises/actions'
import type { RecentCompletedExercise } from '@/lib/completedExercises'
import type { Exercise } from '../_helpers/completedExerciseForm.types'
import {
  ACTIVITY_DURATION_STEP_SECONDS,
  DEFAULT_ACTIVITY_DURATION_SECONDS,
  DEFAULT_DISTANCE_KM,
  DEFAULT_DURATION_SECONDS,
  DEFAULT_LOAD_KG,
  DEFAULT_REPS,
  MAX_ACTIVITY_DURATION_SECONDS,
  MAX_DISTANCE_KM,
  MAX_DURATION_SECONDS,
  MAX_PACE_MIN_PER_KM,
  MAX_REPS,
  MAX_SETS,
  MIN_ACTIVITY_DURATION_SECONDS,
  MIN_DISTANCE_KM,
  MIN_DURATION_SECONDS,
  MIN_PACE_MIN_PER_KM,
  MIN_REPS,
  MIN_SETS,
} from '../_helpers/completedExerciseForm.constants'

type StrengthDetailMode = 'reps' | 'time'

type Params = {
  mode: 'create' | 'edit'
  selectedExercise: Exercise | null
  selectedExerciseId: string
  initialSets: number
  initialRepsPerSet: number[]
  initialDurationPerSetSeconds: number[]
  initialLoadKg: number
  initialHasLoad: boolean
  initialDistanceKm: number
  initialPaceMinPerKm: number | null
  initialActivityDurationSeconds: number
}

export const useWorkoutDetailsState = ({
  mode,
  selectedExercise,
  selectedExerciseId,
  initialSets,
  initialRepsPerSet,
  initialDurationPerSetSeconds,
  initialLoadKg,
  initialHasLoad,
  initialDistanceKm,
  initialPaceMinPerKm,
  initialActivityDurationSeconds,
}: Params) => {
  const hasInitialReps = initialRepsPerSet.length > 0
  const hasInitialDurations = initialDurationPerSetSeconds.length > 0
  const [strengthDetailMode, setStrengthDetailMode] = useState<StrengthDetailMode>(
    hasInitialDurations && !hasInitialReps ? 'time' : 'reps',
  )
  const [sets, setSets] = useState(initialSets)
  const [repsPerSet, setRepsPerSet] = useState<number[]>(initialRepsPerSet)
  const [durationPerSetSeconds, setDurationPerSetSeconds] = useState<number[]>(initialDurationPerSetSeconds)
  const [loadKg, setLoadKg] = useState<number>(initialLoadKg)
  const [hasLoad, setHasLoad] = useState(initialHasLoad)
  const [distanceKm, setDistanceKm] = useState(initialDistanceKm)
  const [paceMinPerKm, setPaceMinPerKm] = useState<number | null>(initialPaceMinPerKm)
  const [activityDurationSeconds, setActivityDurationSeconds] = useState(initialActivityDurationSeconds)
  const [recentExercisesState, setRecentExercisesState] = useState<{ exerciseId: string; entries: RecentCompletedExercise[] }>({
    exerciseId: '',
    entries: [],
  })

  const selectedExerciseType = selectedExercise?.exercise_type ?? 'strength'
  const isStrengthExercise = selectedExerciseType === 'strength'
  const isCardioExercise = selectedExerciseType === 'cardio'
  const isDurationExercise = selectedExerciseType === 'duration'
  const recentExercises = recentExercisesState.exerciseId === selectedExerciseId ? recentExercisesState.entries : []
  const isRecentExercisesLoading = Boolean(selectedExerciseId) && recentExercisesState.exerciseId !== selectedExerciseId

  useEffect(() => {
    let isActive = true
    const currentExerciseType = selectedExercise?.exercise_type ?? 'strength'

    if (!selectedExerciseId) return () => { isActive = false }

    loadRecentCompletedExercises(selectedExerciseId).then(({ data, error }) => {
      if (!isActive) return
      if (error) {
        setRecentExercisesState({ exerciseId: selectedExerciseId, entries: [] })
        return
      }

      const entries = data || []
      setRecentExercisesState({ exerciseId: selectedExerciseId, entries })
      if (mode !== 'create') return

      const latestEntry = entries[0]
      if (!latestEntry) {
        setSets(3)
        setRepsPerSet([12, 12, 12])
        setDurationPerSetSeconds([40, 40, 40])
        setStrengthDetailMode('reps')
        setLoadKg(DEFAULT_LOAD_KG)
        setHasLoad(true)
        setDistanceKm(DEFAULT_DISTANCE_KM)
        setPaceMinPerKm(null)
        setActivityDurationSeconds(DEFAULT_ACTIVITY_DURATION_SECONDS)
        return
      }

      if (currentExerciseType === 'strength') {
        const sourceSets = latestEntry.sets ?? latestEntry.reps_per_set?.length ?? latestEntry.duration_per_set_seconds?.length ?? 3
        const nextSets = Math.min(MAX_SETS, Math.max(MIN_SETS, sourceSets))
        const nextReps = Array.from({ length: nextSets }, (_, index) => {
          const sourceValue = latestEntry.reps_per_set?.[index]
          return sourceValue ? Math.min(MAX_REPS, Math.max(MIN_REPS, sourceValue)) : DEFAULT_REPS
        })
        const nextDurations = Array.from({ length: nextSets }, (_, index) => {
          const sourceValue = latestEntry.duration_per_set_seconds?.[index]
          return sourceValue ? Math.min(MAX_DURATION_SECONDS, Math.max(MIN_DURATION_SECONDS, sourceValue)) : DEFAULT_DURATION_SECONDS
        })

        setSets(nextSets)
        setRepsPerSet(nextReps)
        setDurationPerSetSeconds(nextDurations)
        setStrengthDetailMode(latestEntry.duration_per_set_seconds?.length ? 'time' : 'reps')
        setHasLoad(latestEntry.load_kg !== null)
        setLoadKg(latestEntry.load_kg ?? DEFAULT_LOAD_KG)
        return
      }

      if (currentExerciseType === 'cardio') {
        setDistanceKm(
          latestEntry.distance_km === null
            ? DEFAULT_DISTANCE_KM
            : Math.min(MAX_DISTANCE_KM, Math.max(MIN_DISTANCE_KM, latestEntry.distance_km)),
        )
        setPaceMinPerKm(
          latestEntry.pace_min_per_km === null
            ? null
            : Math.min(MAX_PACE_MIN_PER_KM, Math.max(MIN_PACE_MIN_PER_KM, latestEntry.pace_min_per_km)),
        )
        return
      }

      const sourceDuration = latestEntry.duration_per_set_seconds?.[0]
      const nextDurationSeconds =
        sourceDuration && sourceDuration >= MIN_ACTIVITY_DURATION_SECONDS && sourceDuration <= MAX_ACTIVITY_DURATION_SECONDS
          ? sourceDuration - (sourceDuration % ACTIVITY_DURATION_STEP_SECONDS)
          : DEFAULT_ACTIVITY_DURATION_SECONDS

      setActivityDurationSeconds(Math.max(MIN_ACTIVITY_DURATION_SECONDS, nextDurationSeconds))
    })

    return () => { isActive = false }
  }, [mode, selectedExercise?.exercise_type, selectedExerciseId])

  const handleSetsChange = (value: string) => {
    const parsed = Number(value)
    const nextSets = Number.isNaN(parsed) ? MIN_SETS : Math.min(MAX_SETS, Math.max(MIN_SETS, parsed))
    setSets(nextSets)
    setRepsPerSet((current) => (
      nextSets <= current.length
        ? current.slice(0, nextSets)
        : [...current, ...Array.from({ length: nextSets - current.length }, () => DEFAULT_REPS)]
    ))
    setDurationPerSetSeconds((current) => (
      nextSets <= current.length
        ? current.slice(0, nextSets)
        : [...current, ...Array.from({ length: nextSets - current.length }, () => DEFAULT_DURATION_SECONDS)]
    ))
  }

  const handleRepChange = (index: number, value: string) => {
    const parsed = Number(value)
    const nextRep = Number.isNaN(parsed) ? MIN_REPS : parsed
    setRepsPerSet((current) => current.map((rep, currentIndex) => (currentIndex === index ? nextRep : rep)))
  }

  const handleDurationChange = (index: number, value: number) => {
    const nextDuration = Math.min(MAX_DURATION_SECONDS, Math.max(MIN_DURATION_SECONDS, value))
    setDurationPerSetSeconds((current) =>
      current.map((duration, currentIndex) => (currentIndex === index ? nextDuration : duration)),
    )
  }

  return {
    strengthDetailMode,
    sets,
    repsPerSet,
    durationPerSetSeconds,
    loadKg,
    hasLoad,
    distanceKm,
    paceMinPerKm,
    activityDurationSeconds,
    recentExercises,
    isRecentExercisesLoading,
    selectedExerciseType,
    isStrengthExercise,
    isCardioExercise,
    isDurationExercise,
    setStrengthDetailMode,
    setLoadKg,
    setHasLoad,
    setDistanceKm,
    setPaceMinPerKm,
    setActivityDurationSeconds,
    handleSetsChange,
    handleRepChange,
    handleDurationChange,
  }
}

export type WorkoutDetailsState = ReturnType<typeof useWorkoutDetailsState>
