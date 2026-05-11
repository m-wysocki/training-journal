import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import PageHeader from '@/components/PageHeader'
import styles from './page.module.scss'

export default function ExerciseCategoryLoading() {
  return (
    <PageContainer className={styles.ExerciseCategoryContainer}>
      <BackLink href="/settings/exercise-categories" label="Back to Exercise Categories" />
      <PageHeader title="Exercise Category" />
    </PageContainer>
  )
}
