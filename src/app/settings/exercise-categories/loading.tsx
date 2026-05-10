import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import ExerciseCategoriesManager from './ExerciseCategoriesManager'
import styles from './page.module.scss'

export default function ExerciseCategoriesLoading() {
  return (
    <PageContainer className={styles.SettingsExerciseCategories}>
      <BackLink href="/settings" label="Back to Settings" />
      <ExerciseCategoriesManager initialCategories={[]} isLoading />
    </PageContainer>
  )
}
