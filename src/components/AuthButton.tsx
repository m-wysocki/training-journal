'use client'

import Link from 'next/link'
import { LogOut, Settings, User as UserIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import styles from './AuthButton.module.scss'

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Sprawdź aktualną sesję
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Nasłuchuj zmian w autoryzacji
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

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
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return null
  }

  if (user) {
    return (
      <div className={styles.userMenu} ref={menuRef}>
        <button
          type="button"
          className={styles.avatarButton}
          aria-label="Open account menu"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
        >
          <UserIcon size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>

        {menuOpen ? (
          <div className={styles.menuPanel} role="menu">
            <div className={styles.menuEmail}>{user.email}</div>
            <Link
              href="/settings"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              <span className={styles.menuIcon}>
                <Settings size={16} strokeWidth={1.9} />
              </span>
              Settings
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className={`${styles.menuItem} ${styles.menuItemPrimary}`}
              role="menuitem"
            >
              <span className={styles.menuIcon}>
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
    <button
      onClick={() => router.push('/login')}
      className={styles.avatarButton}
      aria-label="Sign in"
      type="button"
    >
      <UserIcon size={18} strokeWidth={1.8} aria-hidden="true" />
    </button>
  )
}
