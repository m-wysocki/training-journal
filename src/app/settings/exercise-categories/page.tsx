import BackLink from '@/components/BackLink'
import ExerciseCategoriesManager from '@/components/ExerciseCategoriesManager'
import PageContainer from '@/components/PageContainer'
import { requireUser } from '@/lib/supabase/auth'
import { getCachedExerciseCategories } from '@/lib/supabase/cachedTrainingData'
import styles from './page.module.scss'

export default async function SettingsExerciseCategoriesPage() {
  const { user, accessToken } = await requireUser()
  const { data, error } = await getCachedExerciseCategories(user.id, accessToken)

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
