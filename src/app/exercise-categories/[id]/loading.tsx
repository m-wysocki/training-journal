import BackLink from '@/components/BackLink'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import PageContainer from '@/components/PageContainer'
import styles from './page.module.scss'

export default function ExerciseCategoryLoading() {
  return (
    <PageContainer className={styles.container}>
      <div className={styles.header}>
        <BackLink href="/settings/exercise-categories" label="← Back to Exercise Categories" />
        <h1 className={styles.title}>Exercise Category</h1>
      </div>
      <LoadingSkeleton ariaLabel="Loading exercise category" count={4} />
    </PageContainer>
  )
}
