'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { routes } from '@/lib/routes'
import PageContainer from '@/components/PageContainer'
import { supabase } from '@/lib/supabase'
import styles from './page.module.scss'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <PageContainer className={styles.container}>
      <h1 className={styles.title}>Training Journal</h1>

      {!loading && !user ? (
        <section className={styles.signedOutPanel}>
          <h2 className={styles.signedOutTitle}>Sign in to see your training data</h2>
          <p className={styles.signedOutText}>
            Create an account or sign in to add muscle groups, log exercises, and review your workouts.
          </p>
          <Link href="/login" className={styles.signInLink}>
            Sign In or Create Account
          </Link>
        </section>
      ) : null}

      {loading ? (
        <p className={styles.loadingText}>Loading...</p>
      ) : user ? (
      <div className={styles.list}>
        {routes.map((route) => (
          <Link
            key={route.path}
            href={route.path}
            className={styles.card}
          >
            <div className={styles.cardInner}>
              <div>
                <h2 className={styles.cardTitle}>
                  {route.name}
                </h2>
                <p className={styles.cardDescription}>{route.description}</p>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.arrowIcon}
              >
                <path
                  d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>
      ) : null}
    </PageContainer>
  )
}
