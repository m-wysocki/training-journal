import BackLink from '@/components/BackLink'
import ExerciseCategoriesManager from '@/components/ExerciseCategoriesManager'
import PageContainer from '@/components/PageContainer'
import styles from './page.module.scss'

export default function SettingsExerciseCategoriesPage() {
  return (
    <PageContainer className={styles.container}>
      <BackLink href="/settings" label="← Back to Settings" />
      <ExerciseCategoriesManager />
    </PageContainer>
  )
}
