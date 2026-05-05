import { Suspense } from 'react'
import { SquarePen } from 'lucide-react'
import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import { requireUser } from '@/lib/supabase/auth'
import NewCompletedExerciseClient from './NewCompletedExerciseClient'
import styles from '@/components/CompletedExerciseForm.module.scss'

async function NewCompletedExerciseData() {
  const { supabase, user } = await requireUser()
  const [categoriesResult, exercisesResult] = await Promise.all([
    supabase.from('exercise_categories').select('id, name').eq('user_id', user.id).order('created_at'),
    supabase
      .from('exercises')
      .select('id, name, exercise_category_id, exercise_type')
      .eq('user_id', user.id)
      .order('created_at'),
  ])

  return (
    <NewCompletedExerciseClient
      exerciseCategories={categoriesResult.data || []}
      exercises={exercisesResult.data || []}
    />
  )
}

function NewCompletedExerciseFallback() {
  return (
    <div className={styles.wrapper}>
      <PageContainer className={styles.container}>
        <div className={styles.header}>
          <BackLink href="/" label="← Back to Home" />
          <div className={styles.titleRow}>
            <div className={styles.titleIcon} aria-hidden="true">
              <SquarePen size={22} strokeWidth={1.9} />
            </div>
            <h1 className={styles.title}>Log Exercise</h1>
          </div>
          <p className={styles.description}>
            Choose an exercise and save only the most important workout details.
          </p>
        </div>

        <form className={styles.form} aria-busy="true">
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Exercise</h2>
              <p className={styles.sectionDescription}>
                Start by choosing an exercise category and a specific exercise.
              </p>
            </div>

            <div className={styles.sectionBody}>
              <div className={styles.badgeField}>
                <p className={styles.label}>Exercise Category</p>
                <div className={styles.formDataSkeleton} aria-label="Loading exercise categories">
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className={styles.badgeField}>
                <p className={styles.label}>Exercise</p>
                <div className={styles.formDataSkeleton} aria-label="Loading exercises">
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </section>

          <div className={styles.formFooter}>
            <button type="button" className={styles.submit} disabled>
              Save Exercise
            </button>
          </div>
        </form>
      </PageContainer>
    </div>
  )
}

export default function NewCompletedExercisePage() {
  return (
    <Suspense fallback={<NewCompletedExerciseFallback />}>
      <NewCompletedExerciseData />
    </Suspense>
  )
}
