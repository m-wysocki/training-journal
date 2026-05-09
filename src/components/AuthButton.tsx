'use client'

import Link from 'next/link'
import { LogOut, Settings, User as UserIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import IconButton from '@/components/IconButton'
import { signOut } from '@/components/authActions'
import styles from './AuthButton.module.scss'

export type AuthButtonUser = {
  id: string
  email: string | null
}

type AuthButtonProps = {
  user: AuthButtonUser | null
  onUserChange?: (user: AuthButtonUser | null) => void
}

export default function AuthButton({ user, onUserChange }: AuthButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!menuOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    setMenuOpen(false)
    onUserChange?.(null)
    await signOut()
    router.push('/')
    router.refresh()
  }

  if (user) {
    return (
      <div className={styles.AuthButton} ref={menuRef}>
        <IconButton
          type="button"
          aria-label="Open account menu"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
          icon={UserIcon}
          iconSize={18}
          iconStrokeWidth={1.8}
        />

        {menuOpen ? (
          <div className={styles.AuthButtonMenuPanel} role="menu">
            <div className={styles.AuthButtonMenuEmail}>{user.email}</div>
            <Link
              href="/settings"
              className={styles.AuthButtonMenuItem}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              <span className={styles.AuthButtonMenuIcon}>
                <Settings size={16} strokeWidth={1.9} />
              </span>
              Settings
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className={`${styles.AuthButtonMenuItem} ${styles.AuthButtonMenuItemPrimary}`}
              role="menuitem"
            >
              <span className={styles.AuthButtonMenuIcon}>
                <LogOut size={16} strokeWidth={1.9} />
              </span>
              Sign Out
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <IconButton href="/login" aria-label="Sign in" icon={UserIcon} iconSize={18} iconStrokeWidth={1.8} />
  )
}
