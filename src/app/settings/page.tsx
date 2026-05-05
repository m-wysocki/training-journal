import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import BackLink from '@/components/BackLink'
import PageContainer from '@/components/PageContainer'
import { requireUser } from '@/lib/supabase/auth'
import styles from './page.module.scss'

const settingsRoutes = [
  {
    path: '/settings/exercise-categories',
    name: 'Exercise Categories',
    description: 'Manage your exercise categories',
  },
]

export default async function SettingsPage() {
  await requireUser()

  return (
    <PageContainer className={styles.container}>
      <BackLink href="/" label="← Back to Home" />
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.description}>Manage account-related options and exercise setup.</p>
      </div>
      <div className={styles.list}>
        {settingsRoutes.map((route) => (
          <Link key={route.path} href={route.path} className={styles.card}>
            <div className={styles.cardInner}>
              <div>
                <h2 className={styles.cardTitle}>{route.name}</h2>
                <p className={styles.cardDescription}>{route.description}</p>
              </div>
              <ChevronRight size={20} strokeWidth={2} className={styles.arrowIcon} aria-hidden="true" />
            </div>
          </Link>
        ))}
      </div>
    </PageContainer>
  )
}
