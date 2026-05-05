import { Suspense } from 'react'
import BackLink from '@/components/BackLink'
import ExerciseCategoriesManager from '@/components/ExerciseCategoriesManager'
import PageContainer from '@/components/PageContainer'
import { requireUser } from '@/lib/supabase/auth'
import { getCachedExerciseCategories } from '@/lib/supabase/cachedTrainingData'
import styles from './page.module.scss'

async function ExerciseCategoriesData() {
  const { user, accessToken } = await requireUser()
  const { data, error } = await getCachedExerciseCategories(user.id, accessToken)

  return (
    <ExerciseCategoriesManager
      initialCategories={data || []}
      initialErrorMessage={error ? 'Could not load exercise categories.' : ''}
    />
  )
}

function ExerciseCategoriesFallback() {
  return <ExerciseCategoriesManager initialCategories={[]} />
}

export default function SettingsExerciseCategoriesPage() {
  return (
    <PageContainer className={styles.container}>
      <BackLink href="/settings" label="← Back to Settings" />
      <Suspense fallback={<ExerciseCategoriesFallback />}>
        <ExerciseCategoriesData />
      </Suspense>
    </PageContainer>
  )
}
