'use client'

import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDown, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'
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
  const [openItems, setOpenItems] = useState<string[]>([])
  const allItemValues = useMemo(() => stats.map((stat) => stat.name), [stats])
  const isAllExpanded = allItemValues.length > 0 && allItemValues.every((value) => openItems.includes(value))
  const ExpandIcon = isAllExpanded ? ChevronsDownUp : ChevronsUpDown

  if (stats.length === 0) {
    return <p className={styles.StatsCategoryBreakdownEmptyText}>No workouts logged for this date range.</p>
  }

  return (
    <div className={styles.StatsCategoryBreakdown}>
      <div className={styles.StatsCategoryBreakdownActions}>
        <button
          type="button"
          className={styles.StatsCategoryBreakdownActionButton}
          onClick={() => setOpenItems(isAllExpanded ? [] : allItemValues)}
        >
          <ExpandIcon size={16} strokeWidth={2} aria-hidden="true" />
          {isAllExpanded ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <Accordion.Root
        type="multiple"
        value={openItems}
        onValueChange={setOpenItems}
        className={styles.StatsCategoryBreakdownBreakdownList}
        asChild
      >
        <ul>
          {stats.map((stat) => (
            <Accordion.Item key={stat.name} value={stat.name} className={styles.StatsCategoryBreakdownBreakdownItem} asChild>
              <li>
                <Accordion.Header className={styles.StatsCategoryBreakdownBreakdownItemHeader}>
                  <Accordion.Trigger className={styles.StatsCategoryBreakdownBreakdownTrigger}>
                    <span className={styles.StatsCategoryBreakdownExerciseCategoryName}>{stat.name}</span>
                    <span className={styles.StatsCategoryBreakdownExerciseCategoryMeta}>
                      <span className={styles.StatsCategoryBreakdownExerciseCategoryValue}>
                        {stat.trainingDays} {stat.trainingDays === 1 ? 'day' : 'days'}
                      </span>
                      <ChevronDown
                        size={16}
                        strokeWidth={2}
                        className={styles.StatsCategoryBreakdownBreakdownTriggerIcon}
                        aria-hidden="true"
                      />
                    </span>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className={styles.StatsCategoryBreakdownBreakdownContent}>
                  <ul className={styles.StatsCategoryBreakdownTrainingDatesList}>
                    {stat.trainingDates.map((trainingDate) => (
                      <li key={trainingDate} className={styles.StatsCategoryBreakdownTrainingDateItem}>
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
    </div>
  )
}
