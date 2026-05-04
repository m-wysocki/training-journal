import BackLink from '@/components/BackLink'
import ExerciseCategoriesManager from '@/components/ExerciseCategoriesManager'
import PageContainer from '@/components/PageContainer'
import { createClient } from '@/lib/supabase/server'
import styles from './page.module.scss'

export default async function SettingsExerciseCategoriesPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('exercise_categories')
    .select('id, name')
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
