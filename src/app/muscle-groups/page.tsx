'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import Link from 'next/link'
import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import styles from './page.module.scss'

type MuscleGroup = {
  id: string
  name: string
}

export default function MuscleGroupsPage() {
  const [name, setName] = useState('')
  const [groups, setGroups] = useState<MuscleGroup[]>([])
  const [open, setOpen] = useState(false)

  const fetchGroups = async () => {
    const { data } = await supabase
      .from('muscle_groups')
      .select('*')
      .order('created_at')

    setGroups(data || [])
  }

  useEffect(() => {
    supabase
      .from('muscle_groups')
      .select('*')
      .order('created_at')
      .then(({ data }) => {
        setGroups(data || [])
      })
  }, [])

  const addGroup = async () => {
    if (!name) return

    await supabase.from('muscle_groups').insert({ name })
    setName('')
    setOpen(false)
    fetchGroups()
  }

  const deleteGroup = async (id: string) => {
    await supabase.from('muscle_groups').delete().eq('id', id)
    fetchGroups()
  }

  return (
    <PageContainer className={styles.container}>
        <BackLink href="/" label="← Back to Home" />
        <div className={styles.topBar}>
          <h1 className={styles.title}>Muscle Groups</h1>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button className={styles.primaryButton}>
                Add Group
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className={styles.overlay} />
              <Dialog.Content className={styles.dialogContent}>
                <Dialog.Title className={styles.dialogTitle}>
                  Add Muscle Group
                </Dialog.Title>
                <Dialog.Description className={styles.dialogDescription}>
                  Enter the name of the muscle group you want to add.
                </Dialog.Description>
                <div className={styles.dialogBody}>
                  <input
                    className={styles.input}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Arms"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addGroup()
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
                      onClick={addGroup}
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

        {groups.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No muscle groups yet</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {groups.map((g) => (
              <li
                key={g.id}
                className={styles.listItem}
              >
                <Link
                  href={`/muscle-groups/${g.id}`}
                  className={styles.groupLink}
                >
                  {g.name}
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
                        onSelect={() => deleteGroup(g.id)}
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
    </PageContainer>
  )
}
