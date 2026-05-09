'use client'

import { Ellipsis } from 'lucide-react'
import Link from 'next/link'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import styles from './OverflowMenu.module.scss'

export type OverflowMenuItem = {
  key: string
  label: string
  onSelect?: () => void
  href?: string
  danger?: boolean
  disabled?: boolean
}

type OverflowMenuProps = {
  ariaLabel: string
  items: OverflowMenuItem[]
  align?: 'start' | 'center' | 'end'
}

export default function OverflowMenu({
  ariaLabel,
  items,
  align = 'end',
}: OverflowMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className={styles.OverflowMenuTrigger} aria-label={ariaLabel}>
          <Ellipsis size={16} strokeWidth={2} className={styles.OverflowMenuIcon} aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className={styles.OverflowMenuContent} align={align}>
          {items.map((item) => {
            const itemClassName = item.danger
              ? `${styles.OverflowMenuItem} ${styles.OverflowMenuItemDanger}`
              : styles.OverflowMenuItem

            if (item.href) {
              return (
                <DropdownMenu.Item key={item.key} asChild disabled={item.disabled}>
                  <Link href={item.href} className={itemClassName}>
                    {item.label}
                  </Link>
                </DropdownMenu.Item>
              )
            }

            return (
              <DropdownMenu.Item
                key={item.key}
                className={itemClassName}
                disabled={item.disabled}
                onSelect={item.onSelect}
              >
                {item.label}
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

