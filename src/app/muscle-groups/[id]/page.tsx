'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import Link from 'next/link'
import styles from './page.module.scss'

type Exercise = {
  id: string
  name: string
}

type MuscleGroup = {
  id: string
  name: string
  exercises: Exercise[]
}

export default function MuscleGroupPage() {
  const params = useParams()
  const router = useRouter()
  const muscleGroupId = params.id as string

  const [group, setGroup] = useState<MuscleGroup | null>(null)
  const [newExercise, setNewExercise] = useState('')
  const [open, setOpen] = useState(false)

  const fetchGroup = async () => {
    const { data } = await supabase
      .from('muscle_groups')
      .select(`
        id,
        name,
        exercises (
          id,
          name
        )
      `)
      .eq('id', muscleGroupId)
      .single()

    setGroup(data)
  }

  useEffect(() => {
    fetchGroup()
  }, [])

  const addExercise = async () => {
    if (!newExercise.trim()) return

    await supabase.from('exercises').insert({
      name: newExercise,
      muscle_group_id: muscleGroupId,
    })

    setNewExercise('')
    setOpen(false)
    fetchGroup()
  }

  const deleteExercise = async (id: string) => {
    await supabase.from('exercises').delete().eq('id', id)
    fetchGroup()
  }

  if (!group) return (
    <div className={styles.loading}>
      <p className={styles.loadingText}>Loading…</p>
    </div>
  )

  return (
    <div className={styles.container}>
        <div className={styles.header}>
          <Link
            href="/muscle-groups"
            className={styles.backLink}
          >
            ← Back to Muscle Groups
          </Link>
          <h1 className={styles.title}>{group.name}</h1>
        </div>

        {group.exercises.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No exercises yet</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {group.exercises.map((exercise) => (
              <li
                key={exercise.id}
                className={styles.listItem}
              >
                <span className={styles.exerciseName}>{exercise.name}</span>
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
    </div>
  )
}
