'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import PageHeader from '@/components/PageHeader'
import { getCompletedExercisesHrefForDate } from '@/lib/trainingDateRange'
import {
  DEFAULT_ACTIVITY_DURATION_SECONDS,
  DEFAULT_DISTANCE_KM,
  DEFAULT_LOAD_KG,
} from '../_helpers/completedExerciseForm.constants'
import type {
  CompletedExerciseFormProps,
  CompletedExerciseFormValues,
} from '../_helpers/completedExerciseForm.types'
import { useCompletedExerciseSubmit } from '../_hooks/useCompletedExerciseSubmit'
import { useExerciseSelectionState } from '../_hooks/useExerciseSelectionState'
import { useWorkoutDetailsState } from '../_hooks/useWorkoutDetailsState'
import CompletedExerciseFormFooter from './CompletedExerciseFormFooter'
import ExerciseSelectionSection from './ExerciseSelectionSection'
import NotesSection from './NotesSection'
import WorkoutDetailsFormSection from './WorkoutDetailsFormSection/WorkoutDetailsFormSection'
import styles from './CompletedExerciseForm.module.scss'

export type { CompletedExerciseFormValues }
export { DEFAULT_LOAD_KG }

export function CompletedExerciseForm({
  mode,
  title,
  description,
  headerIcon: HeaderIcon,
  submitLabel,
  submittingLabel,
  initialValues,
  initialExerciseCategories,
  initialExercises,
  isExerciseSetupLoading = false,
  onSubmit,
  onSuccess,
}: CompletedExerciseFormProps) {
  const router = useRouter()
  const [performedAt, setPerformedAt] = useState(initialValues.performedAt)
  const [note, setNote] = useState(initialValues.note)

  const submit = useCompletedExerciseSubmit({
    onSubmit,
    onSuccess,
    onAfterSubmitSuccess: (nextPerformedAt) => {
      router.push(getCompletedExercisesHrefForDate(nextPerformedAt))
    },
  })

  const selection = useExerciseSelectionState({
    initialExerciseCategories,
    initialExercises,
    initialExerciseCategoryId: initialValues.exerciseCategoryId,
    initialExerciseId: initialValues.exerciseId,
    onStatus: submit.setStatus,
  })

  const details = useWorkoutDetailsState({
    mode,
    selectedExercise: selection.selectedExercise,
    selectedExerciseId: selection.selectedExerciseId,
    initialSets: initialValues.sets ?? 3,
    initialRepsPerSet: initialValues.repsPerSet ?? (mode === 'create' ? [12, 12, 12] : []),
    initialDurationPerSetSeconds: initialValues.durationPerSetSeconds ?? (mode === 'create' ? [40, 40, 40] : []),
    initialLoadKg: initialValues.loadKg ?? DEFAULT_LOAD_KG,
    initialHasLoad: initialValues.loadKg !== null,
    initialDistanceKm: initialValues.distanceKm ?? DEFAULT_DISTANCE_KM,
    initialPaceMinPerKm: initialValues.paceMinPerKm,
    initialActivityDurationSeconds:
      initialValues.durationPerSetSeconds?.length === 1
        ? initialValues.durationPerSetSeconds[0]
        : DEFAULT_ACTIVITY_DURATION_SECONDS,
  })

  return (
    <div className={styles.CompletedExerciseForm}>
      <PageContainer className={styles.CompletedExerciseFormContainer}>
        <BackLink
          href={mode === 'edit' ? '/completed-exercises' : '/'}
          label={mode === 'edit' ? 'Back to Completed Exercises' : 'Back to Home'}
        />
        <PageHeader
          icon={HeaderIcon}
          title={title}
          description={description}
          descriptionSize="large"
          titleRowMobileAlign="start"
        />

        <form
          onSubmit={(e) => submit.handleSubmit(e, {
            selectedExerciseCategoryId: selection.selectedExerciseCategoryId,
            selectedExerciseId: selection.selectedExerciseId,
            performedAt,
            note,
            isStrengthExercise: details.isStrengthExercise,
            isCardioExercise: details.isCardioExercise,
            isDurationExercise: details.isDurationExercise,
            sets: details.sets,
            repsPerSet: details.repsPerSet,
            durationPerSetSeconds: details.durationPerSetSeconds,
            strengthDetailMode: details.strengthDetailMode,
            hasLoad: details.hasLoad,
            loadKg: details.loadKg,
            distanceKm: details.distanceKm,
            paceMinPerKm: details.paceMinPerKm,
            activityDurationSeconds: details.activityDurationSeconds,
          })}
          className={styles.CompletedExerciseFormForm}
        >
          <ExerciseSelectionSection form={selection} isExerciseSetupLoading={isExerciseSetupLoading} />

          {selection.selectedExercise ? (
            <WorkoutDetailsFormSection form={details} />
          ) : null}

          {selection.selectedExercise ? (
            <NotesSection
              performedAt={performedAt}
              note={note}
              setPerformedAt={setPerformedAt}
              setNote={setNote}
            />
          ) : null}

          <CompletedExerciseFormFooter form={submit} submitLabel={submitLabel} submittingLabel={submittingLabel} />
        </form>
      </PageContainer>
    </div>
  )
}
