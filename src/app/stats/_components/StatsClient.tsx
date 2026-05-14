import { BarChart3 } from 'lucide-react'
import BackLink from '@/components/BackLink'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import PageContainer from '@/components/PageContainer'
import PageHeader from '@/components/PageHeader'
import StatusPanel from '@/components/StatusPanel'
import SurfaceCard from '@/components/SurfaceCard'
import type { WeeklyEntry } from '@/lib/supabase/trainingData'
import StatsCategoryBreakdown from './StatsCategoryBreakdown'
import { getExerciseCategoryStats } from '../_helpers/stats'
import StatsFilters from './StatsFilters'
import styles from './StatsClient.module.scss'

type StatsClientProps = {
  dateFrom: string
  dateTo: string
  entries: WeeklyEntry[]
  errorMessage?: string
  isLoading?: boolean
}

export default function StatsClient({
  dateFrom,
  dateTo,
  entries,
  errorMessage = '',
  isLoading = false,
}: StatsClientProps) {
  const workoutDaysCount = new Set(entries.map((entry) => entry.performed_at)).size
  const exerciseCategoryStats = getExerciseCategoryStats(entries)

  return (
    <div className={styles.StatsClient}>
      <PageContainer className={styles.StatsClientContainer}>
        <BackLink href="/" label="Back to Home" />
        <PageHeader
          icon={BarChart3}
          title="Statistics"
          description="Review your training by date range and see how often you trained each exercise category."
        />

        <StatsFilters dateFrom={dateFrom} dateTo={dateTo} />

        {isLoading ? (
          <LoadingSkeleton ariaLabel="Loading statistics" count={2} variant="card" />
        ) : null}

        {errorMessage ? (
          <StatusPanel variant="error" withBottomSpacing>
            {errorMessage}
          </StatusPanel>
        ) : null}

        {!errorMessage && !isLoading && (
          <div className={styles.StatsClientGrid}>
            <SurfaceCard as="section" className={styles.StatsClientSummaryCard}>
              <p className={styles.StatsClientCardLabel}>Workout Days</p>
              <p className={styles.StatsClientPrimaryStat}>{workoutDaysCount}</p>
              <p className={styles.StatsClientCardHint}>Number of days you trained during the selected date range.</p>
            </SurfaceCard>

            <SurfaceCard as="section" className={styles.StatsClientBreakdownCard}>
              <div className={styles.StatsClientBreakdownHeader}>
                <h2 className={styles.StatsClientBreakdownTitle}>Exercise Category Frequency</h2>
                <p className={styles.StatsClientBreakdownDescription}>
                  Counted as distinct training days per exercise category within the selected date range.
                </p>
              </div>

              <StatsCategoryBreakdown stats={exerciseCategoryStats} />
            </SurfaceCard>
          </div>
        )}
      </PageContainer>
    </div>
  )
}
