'use client'

import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { formatWeekdayDate } from '@/lib/trainingFormatters'
import styles from './StatsCategoryBreakdown.module.scss'

export type ExerciseCategoryStat = {
  name: string
  trainingDays: number
  trainingDates: string[]
}

type StatsCategoryBreakdownProps = {
  stats: ExerciseCategoryStat[]
}

export default function StatsCategoryBreakdown({ stats }: StatsCategoryBreakdownProps) {
  if (stats.length === 0) {
    return <p className={styles.emptyText}>No workouts logged for this date range.</p>
  }

  return (
    <Accordion.Root type="multiple" className={styles.breakdownList} asChild>
      <ul>
        {stats.map((stat) => (
          <Accordion.Item key={stat.name} value={stat.name} className={styles.breakdownItem} asChild>
            <li>
              <Accordion.Header className={styles.breakdownItemHeader}>
                <Accordion.Trigger className={styles.breakdownTrigger}>
                  <span className={styles.exerciseCategoryName}>{stat.name}</span>
                  <span className={styles.exerciseCategoryMeta}>
                    <span className={styles.exerciseCategoryValue}>
                      {stat.trainingDays} {stat.trainingDays === 1 ? 'day' : 'days'}
                    </span>
                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      className={styles.breakdownTriggerIcon}
                      aria-hidden="true"
                    />
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className={styles.breakdownContent}>
                <ul className={styles.trainingDatesList}>
                  {stat.trainingDates.map((trainingDate) => (
                    <li key={trainingDate} className={styles.trainingDateItem}>
                      {formatWeekdayDate(trainingDate)}
                    </li>
                  ))}
                </ul>
              </Accordion.Content>
            </li>
          </Accordion.Item>
        ))}
      </ul>
    </Accordion.Root>
  )
}
