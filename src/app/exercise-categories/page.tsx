'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import Link from 'next/link'
import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import styles from './page.module.scss'

type ExerciseCategory = {
  id: string
  name: string
}

export default function ExerciseCategoriesPage() {
  const [name, setName] = useState('')
  const [categories, setCategories] = useState<ExerciseCategory[]>([])
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ExerciseCategory | null>(null)
  const [editName, setEditName] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('exercise_categories')
      .select('*')
      .order('created_at')

    if (error) {
      setIsError(true)
      setMessage('Could not load exercise categories.')
      return
    }

    setCategories(data || [])
  }

  useEffect(() => {
    supabase
      .from('exercise_categories')
      .select('*')
      .order('created_at')
      .then(({ data, error }) => {
        if (error) {
          setIsError(true)
          setMessage('Could not load exercise categories.')
          return
        }

        setCategories(data || [])
      })
  }, [])

  const addCategory = async () => {
    const trimmedName = name.trim()

    if (!trimmedName) return

    setMessage('')
    setIsError(false)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setIsError(true)
      setMessage('Sign in before adding an exercise category.')
      return
    }

    const { error } = await supabase.from('exercise_categories').insert({
      name: trimmedName,
      user_id: session.user.id,
    })

    if (error) {
      setIsError(true)
      setMessage(
        error.message.includes('row-level security policy')
          ? 'Could not add the exercise category because database access rules blocked it. Run the exercise_categories RLS policy in Supabase.'
          : 'Could not add the exercise category.',
      )
      return
    }

    setName('')
    setOpen(false)
    setMessage(`Added exercise category: ${trimmedName}.`)
    fetchCategories()
  }

  const deleteCategory = async (id: string) => {
    setMessage('')
    setIsError(false)

    const { error } = await supabase.from('exercise_categories').delete().eq('id', id)

    if (error) {
      setIsError(true)
      setMessage(
        error.message.includes('row-level security policy')
          ? 'Could not delete the exercise category because database access rules blocked it.'
          : 'Could not delete the exercise category.',
      )
      return
    }

    fetchCategories()
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

    const { error } = await supabase
      .from('exercise_categories')
      .update({ name: trimmedName })
      .eq('id', editingCategory.id)

    if (error) {
      setIsError(true)
      setMessage(
        error.message.includes('row-level security policy')
          ? 'Could not update the exercise category because database access rules blocked it.'
          : 'Could not update the exercise category.',
      )
      return
    }

    setEditOpen(false)
    setEditingCategory(null)
    setEditName('')
    setMessage(`Updated exercise category: ${trimmedName}.`)
    fetchCategories()
  }

  return (
    <PageContainer className={styles.container}>
        <BackLink href="/" label="← Back to Home" />
        <div className={styles.topBar}>
          <h1 className={styles.title}>Exercise Categories</h1>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button className={styles.primaryButton}>
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
                      <button className={styles.ghostButton}>
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      onClick={addCategory}
                      className={styles.primaryButton}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        {message && (
          <div className={isError ? styles.messageError : styles.messageSuccess}>
            {message}
          </div>
        )}

        {categories.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No exercise categories yet</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {categories.map((category) => (
              <li
                key={category.id}
                className={styles.listItem}
              >
                <Link
                  href={`/exercise-categories/${category.id}`}
                  className={styles.categoryLink}
                >
                  {category.name}
                </Link>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      className={styles.menuTrigger}
                      aria-label="Options"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={styles.menuIcon}
                      >
                        <path
                          d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        />
                      </svg>
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
                        onSelect={() => deleteCategory(category.id)}
                      >
                        Delete
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
                  >
                    Save
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
    </PageContainer>
  )
}
