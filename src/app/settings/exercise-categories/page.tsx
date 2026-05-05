import BackLink from '@/components/BackLink'
import ExerciseCategoriesManager from '@/components/ExerciseCategoriesManager'
import PageContainer from '@/components/PageContainer'
import { requireUser } from '@/lib/supabase/auth'
import styles from './page.module.scss'

export default async function SettingsExerciseCategoriesPage() {
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
