'use client'

import OverflowMenu from '@/components/OverflowMenu'
import PageHeader from '@/components/PageHeader'
import StatusPanel from '@/components/StatusPanel'
import ExerciseFormDialog from './ExerciseFormDialog'
import {
  useExerciseCategoryManager,
  type ExerciseCategory,
} from './hooks/useExerciseCategoryManager'
import styles from './page.module.scss'

type ExerciseCategoryClientProps = {
  exerciseCategoryId: string
  initialCategory: ExerciseCategory
}

export default function ExerciseCategoryClient({
  exerciseCategoryId,
  initialCategory,
}: ExerciseCategoryClientProps) {
  const {
    category,
    addDialog,
    setAddDialog,
    editDialog,
    setEditDialog,
    feedback,
    pending,
    addExercise,
    deleteExercise,
    openEditExercise,
    updateExercise,
  } = useExerciseCategoryManager({
    exerciseCategoryId,
    initialCategory,
  })

  if (!category) return (
    <div className={styles.ExerciseCategoryLoading}>
      <p className={styles.ExerciseCategoryLoadingText}>Loading…</p>
    </div>
  )

  return (
    <>
        <PageHeader
          title={category.name}
        />

        {feedback.message && (
          <StatusPanel variant={feedback.isError ? 'error' : 'success'} withBottomSpacing>
            {feedback.message}
          </StatusPanel>
        )}

        {category.exercises.length === 0 ? (
          <div className={styles.ExerciseCategoryEmptyState}>
            <p className={styles.ExerciseCategoryEmptyText}>No exercises yet</p>
          </div>
        ) : (
          <ul className={styles.ExerciseCategoryList}>
            {category.exercises.map((exercise) => (
              <li
                key={exercise.id}
                className={styles.ExerciseCategoryListItem}
              >
                <span className={styles.ExerciseCategoryExerciseName}>
                  {exercise.name}
                </span>
                <OverflowMenu
                  ariaLabel={`Options for ${exercise.name}`}
                  items={[
                    {
                      key: 'edit',
                      label: 'Edit',
                      onSelect: () => openEditExercise(exercise),
                    },
                    {
                      key: 'delete',
                      label: pending.deletingExerciseId === exercise.id ? 'Deleting...' : 'Delete',
                      danger: true,
                      disabled: pending.deletingExerciseId === exercise.id,
                      onSelect: () => deleteExercise(exercise.id),
                    },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}

        <ExerciseFormDialog
          open={addDialog.open}
          onOpenChange={(open) => setAddDialog((current) => ({ ...current, open }))}
          title="Add Exercise"
          description="Enter the name of the exercise you want to add."
          trigger={<button className={styles.ExerciseCategoryPrimaryButton}>Add Exercise</button>}
          name={addDialog.name}
          onNameChange={(name) => setAddDialog((current) => ({ ...current, name }))}
          exerciseType={addDialog.exerciseType}
          onExerciseTypeChange={(exerciseType) => setAddDialog((current) => ({ ...current, exerciseType }))}
          primaryActionLabel={pending.isAdding ? 'Adding...' : 'Add'}
          onPrimaryAction={addExercise}
          primaryActionDisabled={pending.isAdding}
        />

        <ExerciseFormDialog
          open={editDialog.open}
          onOpenChange={(open) => setEditDialog((current) => ({ ...current, open }))}
          title="Edit Exercise"
          description="Update the exercise name and type."
          name={editDialog.name}
          onNameChange={(name) => setEditDialog((current) => ({ ...current, name }))}
          exerciseType={editDialog.exerciseType}
          onExerciseTypeChange={(exerciseType) => setEditDialog((current) => ({ ...current, exerciseType }))}
          primaryActionLabel={pending.updatingExerciseId === editDialog.editingExercise?.id ? 'Saving...' : 'Save'}
          onPrimaryAction={updateExercise}
          primaryActionDisabled={pending.updatingExerciseId === editDialog.editingExercise?.id}
        />
    </>
  )
}
