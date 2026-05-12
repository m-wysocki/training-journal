'use client'

import { ClipboardList } from 'lucide-react'
import BackLink from '@/components/BackLink'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import PageContainer from '@/components/PageContainer'
import PageHeader from '@/components/PageHeader'
import StatusPanel from '@/components/StatusPanel'
import type { CompletedExerciseRow, EntryComparisons, ExerciseCategory } from '@/lib/completedExercises'
import CompletedExerciseDialogs from './CompletedExerciseDialogs'
import CompletedExercisesDayList from './CompletedExercisesDayList'
import CompletedExercisesFilters from './CompletedExercisesFilters'
import { useCompletedExercisesClient } from '../_hooks/useCompletedExercisesClient'
import styles from './CompletedExercisesClient.module.scss'

type CompletedExercisesClientProps = {
  initialDateFrom: string
  initialDateTo: string
  initialEntries: CompletedExerciseRow[]
  initialExerciseCategories: ExerciseCategory[]
  initialEntryComparisons: EntryComparisons
  initialErrorMessage?: string
  initialIsLoading?: boolean
  initialSelectedExerciseCategory?: string
}

export default function CompletedExercisesClient({
  initialDateFrom,
  initialDateTo,
  initialEntries,
  initialExerciseCategories,
  initialEntryComparisons,
  initialErrorMessage = '',
  initialIsLoading = false,
  initialSelectedExerciseCategory = 'all',
}: CompletedExercisesClientProps) {
  const {
    state,
    groupedByDate,
    exerciseCategoryOptions,
    isCopyDateSameAsSource,
    updateDateRange,
    shiftDateRangeByWeek,
    selectExerciseCategory,
    openDelete,
    closeDelete,
    confirmDelete,
    openCopyCategory,
    closeCopyCategory,
    confirmCopyCategory,
    setFiltersValue,
    setCopyDate,
  } = useCompletedExercisesClient({
    initialDateFrom,
    initialDateTo,
    initialEntries,
    initialExerciseCategories,
    initialEntryComparisons,
    initialErrorMessage,
    initialIsLoading,
    initialSelectedExerciseCategory,
  })

  const { dateRange, data, messages, ui, deleteDialog, copyDialog } = state
  const { dateFrom, dateTo } = dateRange
  const { entryComparisons } = data
  const { errorMessage, successMessage } = messages
  const { isDataLoading, selectedExerciseCategory, filtersValue } = ui
  const { open: deleteOpen, loading: deleteLoading } = deleteDialog
  const { open: copyOpen, target: copyTarget, date: copyDate, loading: copyLoading } = copyDialog

  return (
    <div className={styles.CompletedExercises}>
      <PageContainer className={styles.CompletedExercisesContainer}>
        <BackLink href="/" label="Back to Home" />
        <PageHeader
          icon={ClipboardList}
          title="Completed Exercises"
          description="Browse your logged exercises grouped by workout date."
        />

        <CompletedExercisesFilters
          dateFrom={dateFrom}
          dateTo={dateTo}
          filtersValue={filtersValue}
          selectedExerciseCategory={selectedExerciseCategory}
          exerciseCategoryOptions={exerciseCategoryOptions}
          onUpdateDateRange={updateDateRange}
          onShiftDateRangeByWeek={shiftDateRangeByWeek}
          onSetFiltersValue={setFiltersValue}
          onSelectExerciseCategory={selectExerciseCategory}
        />

        {errorMessage && (
          <StatusPanel variant="error" withBottomSpacing>
            {errorMessage}
          </StatusPanel>
        )}
        {successMessage && (
          <StatusPanel variant="success" withBottomSpacing>
            {successMessage}
          </StatusPanel>
        )}
        {isDataLoading ? (
          <LoadingSkeleton ariaLabel="Loading completed exercise entries" count={3} variant="card" />
        ) : null}
        {!errorMessage && !isDataLoading && groupedByDate.length === 0 && (
          <div className={styles.CompletedExercisesEmptyState}>No completed exercises for this date range.</div>
        )}

        {!isDataLoading ? (
          <CompletedExercisesDayList
            groupedByDate={groupedByDate}
            entryComparisons={entryComparisons}
            onOpenCopyCategory={openCopyCategory}
            onOpenDelete={openDelete}
          />
        ) : null}

        <CompletedExerciseDialogs
          deleteOpen={deleteOpen}
          deleteLoading={deleteLoading}
          copyOpen={copyOpen}
          copyLoading={copyLoading}
          copyTarget={copyTarget}
          copyDate={copyDate}
          isCopyDateSameAsSource={isCopyDateSameAsSource}
          onCloseDelete={closeDelete}
          onConfirmDelete={confirmDelete}
          onCloseCopyCategory={closeCopyCategory}
          onConfirmCopyCategory={confirmCopyCategory}
          onSetCopyDate={setCopyDate}
        />
      </PageContainer>
    </div>
  )
}
