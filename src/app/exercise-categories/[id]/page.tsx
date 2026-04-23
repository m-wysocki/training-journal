'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import styles from './page.module.scss'

type Exercise = {
  id: string
  name: string
  exercise_type: 'strength' | 'cardio' | 'duration'
}

type ExerciseCategory = {
  id: string
  name: string
  exercises: Exercise[]
}

export default function ExerciseCategoryPage() {
  const params = useParams()
  const exerciseCategoryId = params.id as string

  const [category, setCategory] = useState<ExerciseCategory | null>(null)
  const [newExercise, setNewExercise] = useState('')
  const [newExerciseType, setNewExerciseType] = useState<'strength' | 'cardio' | 'duration'>('strength')
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [editExerciseName, setEditExerciseName] = useState('')
  const [editExerciseType, setEditExerciseType] = useState<'strength' | 'cardio' | 'duration'>('strength')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const fetchCategory = useCallback(async () => {
    const { data } = await supabase
      .from('exercise_categories')
      .select(`
        id,
        name,
        exercises (
          id,
          name,
          exercise_type
        )
      `)
      .eq('id', exerciseCategoryId)
      .single()

    return data as ExerciseCategory | null
  }, [exerciseCategoryId])

  useEffect(() => {
    let isActive = true

    fetchCategory().then((data) => {
      if (isActive) {
        setCategory(data)
      }
    })

    return () => {
      isActive = false
    }
  }, [fetchCategory])

  const refreshCategory = async () => {
    setCategory(await fetchCategory())
  }

  const addExercise = async () => {
    const trimmedName = newExercise.trim()

    if (!trimmedName) return

    setMessage('')
    setIsError(false)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setIsError(true)
      setMessage('Sign in before adding an exercise.')
      return
    }

    const { error } = await supabase.from('exercises').insert({
      name: trimmedName,
      exercise_category_id: exerciseCategoryId,
      exercise_type: newExerciseType,
      user_id: session.user.id,
    })

    if (error) {
      setIsError(true)
      setMessage(
        error.message.includes('row-level security policy')
          ? 'Could not add the exercise because database access rules blocked it. Run the exercises RLS policy in Supabase.'
          : 'Could not add the exercise.',
      )
      return
    }

    setNewExercise('')
    setNewExerciseType('strength')
    setOpen(false)
    setMessage(`Added exercise: ${trimmedName}.`)
    refreshCategory()
  }

  const deleteExercise = async (id: string) => {
    setMessage('')
    setIsError(false)

    const { error } = await supabase.from('exercises').delete().eq('id', id)

    if (error) {
      setIsError(true)
      setMessage(
        error.message.includes('row-level security policy')
          ? 'Could not delete the exercise because database access rules blocked it.'
          : 'Could not delete the exercise.',
      )
      return
    }

    refreshCategory()
  }

  const openEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise)
    setEditExerciseName(exercise.name)
    setEditExerciseType(exercise.exercise_type)
    setEditOpen(true)
    setMessage('')
    setIsError(false)
  }

  const updateExercise = async () => {
    const trimmedName = editExerciseName.trim()

    if (!editingExercise || !trimmedName) return

    setMessage('')
    setIsError(false)

    const { error } = await supabase
      .from('exercises')
      .update({
        name: trimmedName,
        exercise_type: editExerciseType,
      })
      .eq('id', editingExercise.id)

    if (error) {
      setIsError(true)
      setMessage(
        error.message.includes('row-level security policy')
          ? 'Could not update the exercise because database access rules blocked it.'
          : 'Could not update the exercise.',
      )
      return
    }

    setEditOpen(false)
    setEditingExercise(null)
    setEditExerciseName('')
    setEditExerciseType('strength')
    setMessage(`Updated exercise: ${trimmedName}.`)
    refreshCategory()
  }

  if (!category) return (
    <div className={styles.loading}>
      <p className={styles.loadingText}>Loading…</p>
    </div>
  )

  return (
    <PageContainer className={styles.container}>
        <div className={styles.header}>
          <BackLink href="/exercise-categories" label="← Back to Exercise Categories" />
          <h1 className={styles.title}>{category.name}</h1>
        </div>

        {message && (
          <div className={isError ? styles.messageError : styles.messageSuccess}>
            {message}
          </div>
        )}

        {category.exercises.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No exercises yet</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {category.exercises.map((exercise) => (
              <li
                key={exercise.id}
                className={styles.listItem}
              >
                <span className={styles.exerciseName}>
                  {exercise.name}
                </span>
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
                        onSelect={() => openEditExercise(exercise)}
                      >
                        Edit
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className={styles.menuItemDanger}
                        onSelect={() => deleteExercise(exercise.id)}
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

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className={styles.primaryButton}>
              Add Exercise
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className={styles.overlay} />
            <Dialog.Content className={styles.dialogContent}>
              <Dialog.Title className={styles.dialogTitle}>
                Add Exercise
              </Dialog.Title>
              <Dialog.Description className={styles.dialogDescription}>
                Enter the name of the exercise you want to add.
              </Dialog.Description>
              <div className={styles.dialogBody}>
                <input
                  className={styles.input}
                  placeholder="e.g. Biceps Curls"
                  value={newExercise}
                  onChange={(e) => setNewExercise(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addExercise()
                    }
                  }}
                />
                <select
                  className={styles.input}
                  value={newExerciseType}
                  onChange={(e) => setNewExerciseType(e.target.value as 'strength' | 'cardio' | 'duration')}
                >
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                  <option value="duration">Duration only</option>
                </select>
                <div className={styles.dialogActions}>
                  <Dialog.Close asChild>
                    <button className={styles.ghostButton}>
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={addExercise}
                    className={styles.primaryButton}
                  >
                    Add
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className={styles.overlay} />
            <Dialog.Content className={styles.dialogContent}>
              <Dialog.Title className={styles.dialogTitle}>
                Edit Exercise
              </Dialog.Title>
              <Dialog.Description className={styles.dialogDescription}>
                Update the exercise name and type.
              </Dialog.Description>
              <div className={styles.dialogBody}>
                <input
                  className={styles.input}
                  placeholder="e.g. Biceps Curls"
                  value={editExerciseName}
                  onChange={(e) => setEditExerciseName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateExercise()
                    }
                  }}
                />
                <select
                  className={styles.input}
                  value={editExerciseType}
                  onChange={(e) => setEditExerciseType(e.target.value as 'strength' | 'cardio' | 'duration')}
                >
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                  <option value="duration">Duration only</option>
                </select>
                <div className={styles.dialogActions}>
                  <Dialog.Close asChild>
                    <button type="button" className={styles.ghostButton}>
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="button"
                    onClick={updateExercise}
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
