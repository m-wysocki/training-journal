'use client'

import { Tags } from 'lucide-react'
import Link from 'next/link'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import FormDialog from '@/components/FormDialog'
import OverflowMenu from '@/components/OverflowMenu'
import PageHeader from '@/components/PageHeader'
import StatusPanel from '@/components/StatusPanel'
import { useExerciseCategoriesManager, type ExerciseCategory } from './hooks/useExerciseCategoriesManager'
import styles from './ExerciseCategoriesManager.module.scss'

type ExerciseCategoriesManagerProps = {
  initialCategories: ExerciseCategory[]
  initialErrorMessage?: string
  isLoading?: boolean
}

export default function ExerciseCategoriesManager({
  initialCategories,
  initialErrorMessage = '',
  isLoading = false,
}: ExerciseCategoriesManagerProps) {
  const {
    categories,
    uiState,
    updateUiState,
    addCategory,
    deleteCategory,
    openEditCategory,
    updateCategory,
  } = useExerciseCategoriesManager({
    initialCategories,
    initialErrorMessage,
  })

  return (
    <section className={styles.ExerciseCategoriesManager}>
      <div className={styles.ExerciseCategoriesManagerTopBar}>
        <div className={styles.ExerciseCategoriesManagerHeader}>
          <PageHeader
            icon={Tags}
            title="Exercise Categories"
            description="Manage your exercise categories"
          />
        </div>
        <FormDialog
          open={uiState.open}
          onOpenChange={(open) => updateUiState({ open })}
          title="Add Exercise Category"
          description="Enter the name of the exercise category you want to add."
          trigger={(
            <button type="button" className={styles.ExerciseCategoriesManagerPrimaryButton}>
              Add Category
            </button>
          )}
          primaryActionLabel={uiState.isAdding ? 'Adding...' : 'Add'}
          onPrimaryAction={addCategory}
          primaryActionDisabled={uiState.isAdding}
        >
          <div className={styles.ExerciseCategoriesManagerDialogBody}>
            <input
              className={styles.ExerciseCategoriesManagerInput}
              value={uiState.name}
              onChange={(e) => updateUiState({ name: e.target.value })}
              placeholder="e.g. Arms"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addCategory()
                }
              }}
            />
          </div>
        </FormDialog>
      </div>

      {uiState.message ? (
        <StatusPanel variant={uiState.messageType === 'error' ? 'error' : 'success'}>
          {uiState.message}
        </StatusPanel>
      ) : null}

      {isLoading ? (
        <LoadingSkeleton ariaLabel="Loading exercise categories" count={4} />
      ) : categories.length === 0 ? (
        <div className={styles.ExerciseCategoriesManagerEmptyState}>
          <p className={styles.ExerciseCategoriesManagerEmptyText}>No exercise categories yet</p>
        </div>
      ) : (
        <ul className={styles.ExerciseCategoriesManagerList}>
          {categories.map((category) => (
            <li key={category.id} className={styles.ExerciseCategoriesManagerListItem}>
              <Link href={`/settings/exercise-categories/${category.id}`} className={styles.ExerciseCategoriesManagerCategoryLink}>
                {category.name}
              </Link>

              <OverflowMenu
                ariaLabel={`Options for ${category.name}`}
                items={[
                  {
                    key: 'edit',
                    label: 'Edit',
                    onSelect: () => openEditCategory(category),
                  },
                  {
                    key: 'delete',
                    label: uiState.deletingCategoryId === category.id ? 'Deleting...' : 'Delete',
                    danger: true,
                    disabled: uiState.deletingCategoryId === category.id,
                    onSelect: () => deleteCategory(category.id),
                  },
                ]}
              />
            </li>
          ))}
        </ul>
      )}

      <FormDialog
        open={uiState.editOpen}
        onOpenChange={(editOpen) => updateUiState({ editOpen })}
        title="Edit Exercise Category"
        description="Update the exercise category name."
        primaryActionLabel={uiState.updatingCategoryId === uiState.editingCategory?.id ? 'Saving...' : 'Save'}
        onPrimaryAction={updateCategory}
        primaryActionDisabled={uiState.updatingCategoryId === uiState.editingCategory?.id}
      >
        <div className={styles.ExerciseCategoriesManagerDialogBody}>
          <input
            className={styles.ExerciseCategoriesManagerInput}
            value={uiState.editName}
            onChange={(e) => updateUiState({ editName: e.target.value })}
            placeholder="e.g. Arms"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateCategory()
              }
            }}
          />
        </div>
      </FormDialog>
    </section>
  )
}
