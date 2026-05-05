import { Suspense } from 'react'
import BackLink from '@/components/BackLink'
import NavigationCard from '@/components/NavigationCard'
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

async function SettingsContent() {
  await requireUser()

  return <SettingsView />
}

function SettingsView() {
  return (
    <PageContainer className={styles.Settings}>
      <BackLink href="/" label="← Back to Home" />
      <div className={styles.SettingsHeader}>
        <h1 className={styles.SettingsTitle}>Settings</h1>
        <p className={styles.SettingsDescription}>Manage account-related options and exercise setup.</p>
      </div>
      <div className={styles.SettingsList}>
        {settingsRoutes.map((route) => (
          <NavigationCard
            key={route.path}
            href={route.path}
            title={route.name}
            description={route.description}
          />
        ))}
      </div>
    </PageContainer>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsView />}>
      <SettingsContent />
    </Suspense>
  )
}
