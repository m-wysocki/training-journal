'use client'

import { Ellipsis } from 'lucide-react'
import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import Link from 'next/link'
import {
  addExerciseCategory,
  deleteExerciseCategory,
  updateExerciseCategory,
} from '@/lib/actions/exerciseSetupActions'
import LoadingSkeleton from '@/components/LoadingSkeleton'
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
    <section className={styles.section}>
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.title}>Exercise Categories</h2>
          <p className={styles.description}>Manage your exercise categories</p>
        </div>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button type="button" className={styles.primaryButton}>
              Add Category
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className={styles.overlay} />
            <Dialog.Content className={styles.dialogContent}>
              <Dialog.Title className={styles.dialogTitle}>
                Add Exercise Category
              </Dialog.Title>
              <Dialog.Description className={styles.dialogDescription}>
                Enter the name of the exercise category you want to add.
              </Dialog.Description>
              <div className={styles.dialogBody}>
                <input
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Arms"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addCategory()
                    }
                  }}
                />
                <div className={styles.dialogActions}>
                  <Dialog.Close asChild>
                    <button type="button" className={styles.ghostButton}>
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="button"
                    onClick={addCategory}
                    className={styles.primaryButton}
                    disabled={isAdding}
                  >
                    {isAdding ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {message ? (
        <StatusPanel variant={isError ? 'error' : 'success'}>
          {message}
        </StatusPanel>
      ) : null}

      {isLoading ? (
        <LoadingSkeleton ariaLabel="Loading exercise categories" count={4} />
      ) : categories.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No exercise categories yet</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {categories.map((category) => (
            <li key={category.id} className={styles.listItem}>
              <Link href={`/exercise-categories/${category.id}`} className={styles.categoryLink}>
                {category.name}
              </Link>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button type="button" className={styles.menuTrigger} aria-label="Options">
                    <Ellipsis size={16} strokeWidth={2} className={styles.menuIcon} aria-hidden="true" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content className={styles.menuContent}>
                    <DropdownMenu.Item
                      className={styles.menuItem}
                      onSelect={() => openEditCategory(category)}
                    >
                      Edit
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className={styles.menuItemDanger}
                      disabled={deletingCategoryId === category.id}
                      onSelect={() => deleteCategory(category.id)}
                    >
                      {deletingCategoryId === category.id ? 'Deleting...' : 'Delete'}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </li>
          ))}
        </ul>
      )}

      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.dialogContent}>
            <Dialog.Title className={styles.dialogTitle}>
              Edit Exercise Category
            </Dialog.Title>
            <Dialog.Description className={styles.dialogDescription}>
              Update the exercise category name.
            </Dialog.Description>
            <div className={styles.dialogBody}>
              <input
                className={styles.input}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Arms"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateCategory()
                  }
                }}
              />
              <div className={styles.dialogActions}>
                <Dialog.Close asChild>
                  <button type="button" className={styles.ghostButton}>
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={updateCategory}
                  className={styles.primaryButton}
                  disabled={updatingCategoryId === editingCategory?.id}
                >
                  {updatingCategoryId === editingCategory?.id ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  )
}
