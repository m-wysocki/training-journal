'use client'

import { Tags } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import {
  addExerciseCategory,
  deleteExerciseCategory,
  updateExerciseCategory,
} from '@/lib/actions/exerciseSetupActions'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import FormDialog from '@/components/FormDialog'
import OverflowMenu from '@/components/OverflowMenu'
import StatusPanel from '@/components/StatusPanel'
import styles from './ExerciseCategoriesManager.module.scss'

type ExerciseCategory = {
  id: string
  name: string
}

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
  const [name, setName] = useState('')
  const [categories, setCategories] = useState<ExerciseCategory[]>(initialCategories)
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ExerciseCategory | null>(null)
  const [editName, setEditName] = useState('')
  const [message, setMessage] = useState(initialErrorMessage)
  const [isError, setIsError] = useState(Boolean(initialErrorMessage))
  const [isAdding, setIsAdding] = useState(false)
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)

  const addCategory = async () => {
    const trimmedName = name.trim()

    if (!trimmedName) return

    setMessage('')
    setIsError(false)
    setIsAdding(true)

    const result = await addExerciseCategory(trimmedName)
    setIsAdding(false)

    if (result.error) {
      setIsError(true)
      setMessage(result.error)
      return
    }

    setName('')
    setOpen(false)
    setMessage(`Added exercise category: ${trimmedName}.`)
    setCategories((current) => result.data ? [...current, result.data] : current)
  }

  const deleteCategory = async (id: string) => {
    setMessage('')
    setIsError(false)
    setDeletingCategoryId(id)

    const result = await deleteExerciseCategory(id)
    setDeletingCategoryId(null)

    if (result.error) {
      setIsError(true)
      setMessage(result.error)
      return
    }

    setCategories((current) => current.filter((category) => category.id !== id))
  }

  const openEditCategory = (category: ExerciseCategory) => {
    setEditingCategory(category)
    setEditName(category.name)
    setEditOpen(true)
    setMessage('')
    setIsError(false)
  }

  const updateCategory = async () => {
    const trimmedName = editName.trim()

    if (!editingCategory || !trimmedName) return

    setMessage('')
    setIsError(false)
    setUpdatingCategoryId(editingCategory.id)

    const result = await updateExerciseCategory(editingCategory.id, trimmedName)
    setUpdatingCategoryId(null)

    if (result.error) {
      setIsError(true)
      setMessage(result.error)
      return
    }

    setEditOpen(false)
    setEditingCategory(null)
    setEditName('')
    setMessage(`Updated exercise category: ${trimmedName}.`)
    setCategories((current) =>
      current.map((category) => category.id === editingCategory.id ? { ...category, name: trimmedName } : category),
    )
  }

  return (
    <section className={styles.ExerciseCategoriesManager}>
      <div className={styles.ExerciseCategoriesManagerTopBar}>
        <div>
          <div className={styles.ExerciseCategoriesManagerTitleRow}>
            <div className={styles.ExerciseCategoriesManagerTitleIcon} aria-hidden="true">
              <Tags size={22} strokeWidth={1.9} />
            </div>
            <h2 className={styles.ExerciseCategoriesManagerTitle}>Exercise Categories</h2>
          </div>
          <p className={styles.ExerciseCategoriesManagerDescription}>Manage your exercise categories</p>
        </div>
        <FormDialog
          open={open}
          onOpenChange={setOpen}
          title="Add Exercise Category"
          description="Enter the name of the exercise category you want to add."
          trigger={(
            <button type="button" className={styles.ExerciseCategoriesManagerPrimaryButton}>
              Add Category
            </button>
          )}
          primaryActionLabel={isAdding ? 'Adding...' : 'Add'}
          onPrimaryAction={addCategory}
          primaryActionDisabled={isAdding}
        >
          <div className={styles.ExerciseCategoriesManagerDialogBody}>
            <input
              className={styles.ExerciseCategoriesManagerInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
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

      {message ? (
        <StatusPanel variant={isError ? 'error' : 'success'}>
          {message}
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
              <Link href={`/exercise-categories/${category.id}`} className={styles.ExerciseCategoriesManagerCategoryLink}>
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
                    label: deletingCategoryId === category.id ? 'Deleting...' : 'Delete',
                    danger: true,
                    disabled: deletingCategoryId === category.id,
                    onSelect: () => deleteCategory(category.id),
                  },
                ]}
              />
            </li>
          ))}
        </ul>
      )}

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Exercise Category"
        description="Update the exercise category name."
        primaryActionLabel={updatingCategoryId === editingCategory?.id ? 'Saving...' : 'Save'}
        onPrimaryAction={updateCategory}
        primaryActionDisabled={updatingCategoryId === editingCategory?.id}
      >
        <div className={styles.ExerciseCategoriesManagerDialogBody}>
          <input
            className={styles.ExerciseCategoriesManagerInput}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
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
