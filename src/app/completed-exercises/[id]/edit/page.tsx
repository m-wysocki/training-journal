import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import PageContainer from '@/components/PageContainer'
import PageHeader from '@/components/PageHeader'
import { requireUser } from '@/lib/supabase/auth'
import { getExerciseSetup } from '@/lib/supabase/trainingData'
import type { CompletedExerciseFormValues } from '@/components/CompletedExerciseForm'
import EditCompletedExerciseClient from './EditCompletedExerciseClient'
import styles from '@/components/CompletedExerciseForm.module.scss'

type CompletedExerciseRecord = {
  id: string
  exercise_id: string
  performed_at: string
  sets: number | null
  reps_per_set: number[] | null
  duration_per_set_seconds: number[] | null
  load_kg: number | null
  distance_km: number | null
  pace_min_per_km: number | null
  note: string | null
  exercise: {
    exercise_category_id: string
  } | null
}

type EditCompletedExercisePageProps = {
  params: Promise<{
    id: string
  }>
}

const mapEntryToInitialValues = (entry: CompletedExerciseRecord): CompletedExerciseFormValues => ({
  exerciseCategoryId: entry.exercise?.exercise_category_id ?? '',
  exerciseId: entry.exercise_id,
  sets: entry.sets,
  repsPerSet: entry.reps_per_set,
  durationPerSetSeconds: entry.duration_per_set_seconds,
  loadKg: entry.load_kg === null ? null : Number(entry.load_kg),
  distanceKm: entry.distance_km === null ? null : Number(entry.distance_km),
  paceMinPerKm: entry.pace_min_per_km === null ? null : Number(entry.pace_min_per_km),
  note: entry.note ?? '',
  performedAt: entry.performed_at,
})

async function EditCompletedExerciseData({ params }: EditCompletedExercisePageProps) {
  const { id } = await params
  const { supabase, user } = await requireUser()
  const [entryResult, exerciseSetup] = await Promise.all([
    supabase
      .from('completed_exercises')
      .select(
        `
          id,
          exercise_id,
          performed_at,
          sets,
          reps_per_set,
          duration_per_set_seconds,
          load_kg,
          distance_km,
          pace_min_per_km,
          note,
          exercise:exercises (
            exercise_category_id
          )
        `,
      )
      .eq('user_id', user.id)
      .eq('id', id)
      .single(),
    getExerciseSetup(supabase, user.id),
  ])

  if (entryResult.error || !entryResult.data) {
    notFound()
  }

  return (
    <EditCompletedExerciseClient
      entryId={id}
      initialValues={mapEntryToInitialValues(entryResult.data as unknown as CompletedExerciseRecord)}
      exerciseCategories={exerciseSetup.exerciseCategories}
      exercises={exerciseSetup.exercises}
    />
  )
}

function EditCompletedExerciseFallback() {
  return (
    <div className={styles.CompletedExerciseForm}>
      <PageContainer className={styles.CompletedExerciseFormContainer}>
        <PageHeader
          backHref="/completed-exercises"
          backLabel="Back to Completed Exercises"
          title="Edit Completed Exercise"
          description="Update the exercise, workout details, or notes using the same view as the create form."
          descriptionSize="large"
          titleRowMobileAlign="start"
        />

        <form className={styles.CompletedExerciseFormForm} aria-busy="true">
          <section className={styles.CompletedExerciseFormSection}>
            <div className={styles.CompletedExerciseFormSectionHeader}>
              <h2 className={styles.CompletedExerciseFormSectionTitle}>Exercise</h2>
              <p className={styles.CompletedExerciseFormSectionDescription}>
                Start by choosing an exercise category and a specific exercise.
              </p>
            </div>

            <div className={styles.CompletedExerciseFormSectionBody}>
              <div className={styles.CompletedExerciseFormBadgeField}>
                <p className={styles.CompletedExerciseFormLabel}>Exercise Category</p>
                <div className={styles.CompletedExerciseFormFormDataSkeleton} aria-label="Loading exercise categories">
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className={styles.CompletedExerciseFormBadgeField}>
                <p className={styles.CompletedExerciseFormLabel}>Exercise</p>
                <div className={styles.CompletedExerciseFormFormDataSkeleton} aria-label="Loading exercises">
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </section>

          <div className={styles.CompletedExerciseFormFormFooter}>
            <button type="button" className={styles.CompletedExerciseFormSubmit} disabled>
              Save Changes
            </button>
          </div>
        </form>
      </PageContainer>
    </div>
  )
}

export default function EditCompletedExercisePage(props: EditCompletedExercisePageProps) {
  return (
    <Suspense fallback={<EditCompletedExerciseFallback />}>
      <EditCompletedExerciseData {...props} />
    </Suspense>
  )
}
