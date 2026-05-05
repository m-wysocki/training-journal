import { Suspense } from 'react'
import BackLink from '@/components/BackLink'
import ExerciseCategoriesManager from '@/components/ExerciseCategoriesManager'
import PageContainer from '@/components/PageContainer'
import { requireUser } from '@/lib/supabase/auth'
import styles from './page.module.scss'
import managerStyles from '@/components/ExerciseCategoriesManager.module.scss'

async function ExerciseCategoriesData() {
  const { supabase, user } = await requireUser()
  const { data, error } = await supabase
    .from('exercise_categories')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at')

  return (
    <PageContainer className={styles.container}>
      <BackLink href="/settings" label="← Back to Settings" />
      <ExerciseCategoriesManager
        initialCategories={data || []}
        initialErrorMessage={error ? 'Could not load exercise categories.' : ''}
      />
    </PageContainer>
  )
}

function ExerciseCategoriesFallback() {
  return (
    <PageContainer className={styles.container}>
      <BackLink href="/settings" label="← Back to Settings" />
      <section className={managerStyles.section} aria-busy="true">
        <div className={managerStyles.topBar}>
          <div>
            <h2 className={managerStyles.title}>Exercise Categories</h2>
            <p className={managerStyles.description}>Manage your exercise categories</p>
          </div>
          <button type="button" className={managerStyles.primaryButton} disabled>
            Add Category
          </button>
        </div>
        <div className={managerStyles.listSkeleton} aria-label="Loading exercise categories">
          <span />
          <span />
          <span />
        </div>
      </section>
    </PageContainer>
  )
}

export default function SettingsExerciseCategoriesPage() {
  return (
    <Suspense fallback={<ExerciseCategoriesFallback />}>
      <ExerciseCategoriesData />
    </Suspense>
  )
}
