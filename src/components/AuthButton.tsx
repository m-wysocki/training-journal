'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import styles from './AuthButton.module.scss'

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return null
  }

  if (user) {
    return (
      <div className={styles.loggedIn}>
        <span className={styles.userEmail}>
          {user.email}
        </span>
        <button
          onClick={handleLogout}
          className={styles.button}
        >
          Wyloguj
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => router.push('/login')}
      className={styles.button}
    >
      Zaloguj się
    </button>
  )
}
