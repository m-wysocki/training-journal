import PageContainer from '@/components/PageContainer'
import styles from './PageLoadingSkeleton.module.scss'

type PageLoadingSkeletonProps = {
  title?: string
  itemCount?: number
}

export default function PageLoadingSkeleton({
  title = 'Loading',
  itemCount = 3,
}: PageLoadingSkeletonProps) {
  return (
    <div className={styles.PageLoadingSkeleton}>
      <PageContainer className={styles.PageLoadingSkeletonContainer}>
        <div className={styles.PageLoadingSkeletonHeader}>
          <div className={styles.PageLoadingSkeletonBackLink} />
          <div className={styles.PageLoadingSkeletonTitleRow}>
            <div className={styles.PageLoadingSkeletonIcon} />
            <div>
              <p className={styles.PageLoadingSkeletonTitle}>{title}</p>
              <div className={styles.PageLoadingSkeletonText} />
            </div>
          </div>
        </div>

        <div className={styles.PageLoadingSkeletonFilters} />

        <div className={styles.PageLoadingSkeletonList}>
          {Array.from({ length: itemCount }, (_, index) => (
            <div key={index} className={styles.PageLoadingSkeletonCard}>
              <div className={styles.PageLoadingSkeletonLineLarge} />
              <div className={styles.PageLoadingSkeletonLine} />
              <div className={styles.PageLoadingSkeletonLineShort} />
            </div>
          ))}
        </div>
      </PageContainer>
    </div>
  )
}
