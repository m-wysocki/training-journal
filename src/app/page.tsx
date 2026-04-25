'use client'

import { BarChart3, ChevronRight, ClipboardList, SquarePen } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { routes } from '@/lib/routes'
import PageContainer from '@/components/PageContainer'
import { supabase } from '@/lib/supabase'
import { getCurrentUserAccessStatus, type UserAccessStatus } from '@/lib/userAccess'
import styles from './page.module.scss'

const routeIcons = {
  '/completed-exercises/new': SquarePen,
  '/completed-exercises': ClipboardList,
  '/stats': BarChart3,
} as const

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [accessStatus, setAccessStatus] = useState<UserAccessStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const updateSession = async (sessionUser: User | null) => {
      setUser(sessionUser)

      if (sessionUser) {
        setAccessStatus(await getCurrentUserAccessStatus())
      } else {
        setAccessStatus(null)
      }

      setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      updateSession(session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      updateSession(session?.user ?? null)
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
            Create an account or sign in to add exercise categories, log exercises, and review your workouts.
          </p>
          <Link href="/login" className={styles.signInLink}>
            Sign In or Create Account
          </Link>
        </section>
      ) : null}

      {loading ? (
        <p className={styles.loadingText}>Loading...</p>
      ) : user && accessStatus === 'pending' ? (
        <section className={styles.pendingPanel}>
          <h2 className={styles.pendingTitle}>Account pending approval</h2>
          <p className={styles.pendingText}>
            Your account was created successfully. You will be able to use the journal after admin approval.
          </p>
        </section>
      ) : user ? (
        <div className={styles.list}>
          {routes.map((route) => {
            const RouteIcon = routeIcons[route.path as keyof typeof routeIcons]

            return (
              <Link
                key={route.path}
                href={route.path}
                className={styles.card}
              >
                <div className={styles.cardInner}>
                  <div className={styles.cardContent}>
                    {RouteIcon ? (
                      <div className={styles.cardIcon} aria-hidden="true">
                        <RouteIcon size={20} strokeWidth={1.9} />
                      </div>
                    ) : null}
                    <div>
                      <h2 className={styles.cardTitle}>
                        {route.name}
                      </h2>
                      <p className={styles.cardDescription}>{route.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} strokeWidth={2} className={styles.arrowIcon} aria-hidden="true" />
                </div>
              </Link>
            )
          })}
        </div>
      ) : null}
    </PageContainer>
  )
}
