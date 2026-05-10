'use client'

import { BarChart3 } from 'lucide-react'
import { useMemo } from 'react'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import PageContainer from '@/components/PageContainer'
import PageHeader from '@/components/PageHeader'
import StatusPanel from '@/components/StatusPanel'
import SurfaceCard from '@/components/SurfaceCard'
import StatsCategoryBreakdown from './StatsCategoryBreakdown'
import { getExerciseCategoryStats } from './helpers/stats'
import { useStatsEntries } from './hooks/useStatsEntries'
import StatsFilters from './StatsFilters'
import styles from './StatsClient.module.scss'

type StatsClientProps = {
  dateFrom: string
  dateTo: string
}

export default function StatsClient({ dateFrom, dateTo }: StatsClientProps) {
  const { entries, errorMessage, isLoading } = useStatsEntries(dateFrom, dateTo)

  const workoutDaysCount = useMemo(
    () => new Set(entries.map((entry) => entry.performed_at)).size,
    [entries],
  )
  const exerciseCategoryStats = useMemo(() => getExerciseCategoryStats(entries), [entries])

  return (
    <div className={styles.Stats}>
      <PageContainer className={styles.StatsContainer}>
        <PageHeader
          backHref="/"
          backLabel="Back to Home"
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
          <div className={styles.StatsGrid}>
            <SurfaceCard as="section" className={styles.StatsSummaryCard}>
              <p className={styles.StatsCardLabel}>Workout Days</p>
              <p className={styles.StatsPrimaryStat}>{workoutDaysCount}</p>
              <p className={styles.StatsCardHint}>Number of days you trained during the selected date range.</p>
            </SurfaceCard>

            <SurfaceCard as="section" className={styles.StatsBreakdownCard}>
              <div className={styles.StatsBreakdownHeader}>
                <h2 className={styles.StatsBreakdownTitle}>Exercise Category Frequency</h2>
                <p className={styles.StatsBreakdownDescription}>
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
