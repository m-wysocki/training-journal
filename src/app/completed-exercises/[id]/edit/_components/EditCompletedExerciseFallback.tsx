import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import PageHeader from '@/components/PageHeader'
import styles from '@/app/completed-exercises/_components/CompletedExerciseForm.module.scss'

export default function EditCompletedExerciseFallback() {
  return (
    <div className={styles.CompletedExerciseForm}>
      <PageContainer className={styles.CompletedExerciseFormContainer}>
        <BackLink href="/completed-exercises" label="Back to Completed Exercises" />
        <PageHeader
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
